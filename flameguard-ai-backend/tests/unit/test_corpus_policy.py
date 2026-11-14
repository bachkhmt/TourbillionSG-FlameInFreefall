"""Corpus policy admission (ADR-0005): registry declaration and chunk/source cross-checks."""

import hashlib
import json
from types import SimpleNamespace
from uuid import uuid4

import pytest

from app.services.corpus_policy import (
    CORPUS_POLICY_VERSION,
    CorpusPolicyError,
    admit_passages,
    load_corpus_policy,
)

SHA = "a" * 64
INVESTIGATION = uuid4()
SOURCE, OTHER_SOURCE, CHUNK = uuid4(), uuid4(), uuid4()
TEXT = "FLEX-007 [row 8]; Droplet initial diameter; mm: 1.87"
VERSION = f"study:1/file:1/sha256:{SHA}"
URL = "https://psi.nasa.gov/example.csv"


def registry(**overrides):
    value = {
        "policyVersion": CORPUS_POLICY_VERSION,
        "sourceRevision": "rev-1",
        "sources": {
            str(SOURCE): {
                "sha256": SHA,
                "license": "CC0-1.0",
                "filename": "PSI-69_Experimental table_FLEX.csv",
                "sourceUrl": URL,
                "investigationId": str(INVESTIGATION),
                "slug": "flex",
                "title": "FLEX",
                "version": VERSION,
            }
        },
        "chunks": {
            str(CHUNK): {
                "sourceId": str(SOURCE),
                "locator": "CSV row 8",
                "textSha256": hashlib.sha256(TEXT.encode()).hexdigest(),
            }
        },
    }
    value.update(overrides)
    return value


def write(tmp_path, value=None, **declaration):
    raw = json.dumps(value or registry()).encode()
    (tmp_path / "corpus-registry.json").write_bytes(raw)
    manifest = tmp_path / "collection.json"
    manifest.write_text("{}")
    config = {
        "origin": "real",
        "reviewState": "unreviewed",
        "corpusPolicy": {
            "policyVersion": CORPUS_POLICY_VERSION,
            "registry": "corpus-registry.json",
            "registrySha256": hashlib.sha256(raw).hexdigest(),
            "sourceRevision": "rev-1",
            **declaration,
        },
    }
    return str(manifest), config


def row(chunk=None, **source):
    chunk_values = {"id": CHUNK, "source_locator": "CSV row 8", "chunk_text": TEXT}
    chunk_values.update(chunk or {})
    source_values = {
        "id": SOURCE,
        "investigation_id": INVESTIGATION,
        "source_url": URL,
        "version": VERSION,
        "ingestion_status": "source_checked",
    }
    source_values.update(source)
    return SimpleNamespace(**chunk_values), SimpleNamespace(**source_values)


def test_valid_declaration_loads_and_admits_registered_chunks(tmp_path):
    policy = load_corpus_policy(*write(tmp_path))
    assert policy.source_revision == "rev-1" and len(policy.registry_sha256) == 64
    other = row(chunk={"id": uuid4()}, id=OTHER_SOURCE)
    passages = admit_passages([row(), other], policy)
    assert len(passages) == 1  # unregistered sources are simply not part of the corpus
    assert passages[0].text == TEXT and passages[0].slug == "flex"
    assert passages[0].investigation_id == INVESTIGATION


def test_missing_declaration_means_no_corpus(tmp_path):
    manifest, config = write(tmp_path)
    config.pop("corpusPolicy")
    assert load_corpus_policy(manifest, config) is None


@pytest.mark.parametrize(
    "mutate",
    [
        lambda config: config["corpusPolicy"].update(registrySha256="0" * 64),
        lambda config: config["corpusPolicy"].update(registry="../corpus-registry.json"),
        lambda config: config["corpusPolicy"].update(policyVersion="other"),
        lambda config: config["corpusPolicy"].update(sourceRevision="rev-2"),
        lambda config: config.update(origin="synthetic"),
        lambda config: config.update(reviewState="unknown"),
    ],
)
def test_invalid_declarations_are_refused(tmp_path, mutate):
    manifest, config = write(tmp_path)
    mutate(config)
    with pytest.raises(CorpusPolicyError):
        load_corpus_policy(manifest, config)


def test_empty_registry_is_refused(tmp_path):
    with pytest.raises(CorpusPolicyError):
        load_corpus_policy(*write(tmp_path, registry(chunks={})))


@pytest.mark.parametrize(
    "bad_row",
    [
        row(chunk={"chunk_text": TEXT + " edited"}),
        row(chunk={"source_locator": "CSV row 9"}),
        row(ingestion_status="pending"),
        row(source_url="https://example.org/other.csv"),
        row(investigation_id=uuid4()),
        row(version="study:1/file:2/sha256:" + "b" * 64),
    ],
)
def test_conflicts_between_registry_and_admitted_rows_are_refused(tmp_path, bad_row):
    policy = load_corpus_policy(*write(tmp_path))
    with pytest.raises(CorpusPolicyError):
        admit_passages([bad_row], policy)


def test_non_cc0_registry_entries_are_refused(tmp_path):
    value = registry()
    value["sources"][str(SOURCE)]["license"] = "unknown"
    policy = load_corpus_policy(*write(tmp_path, value))
    with pytest.raises(CorpusPolicyError):
        admit_passages([row()], policy)
