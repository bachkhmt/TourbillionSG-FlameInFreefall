"""Offline, hash-bound ingestion of the official challenge resource inventory (option A).

Only NASA-authored article paragraphs enter RAG. Navigation, imagery, captions,
quoted third-party text and unverified video transcripts are excluded. Discovery
links and acquisition failures remain honest source rows with no searchable chunks.
"""

import gzip
import json
import re
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

from app.services.corpus_policy import NASA_RIGHTS_URL, NASA_TEXT_LICENSE

from .coverage import _sentence_windows
from .pilot import digest, uid
from .unified import build_unified_release

ROOT = Path(__file__).resolve().parent / "research/challenge-resources-2026-11-14"
PARSER = "nasa-challenge-resources-v1"
VOID = {
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
}
EXCLUDED = {
    "script",
    "style",
    "nav",
    "header",
    "footer",
    "aside",
    "figure",
    "figcaption",
    "blockquote",
    "noscript",
    "iframe",
}


@dataclass
class Node:
    tag: str
    attrs: dict = field(default_factory=dict)
    children: list = field(default_factory=list)


class ArticleParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node("root")
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        node = Node(tag, dict(attrs))
        self.stack[-1].children.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.stack[-1].children.append(Node(tag, dict(attrs)))

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                del self.stack[index:]
                break

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def descendants(node):
    yield node
    for child in node.children:
        if isinstance(child, Node):
            yield from descendants(child)


def text(node):
    if node.tag in EXCLUDED:
        return ""
    return " ".join(text(child) if isinstance(child, Node) else child for child in node.children)


def article_paragraphs(raw):
    parser = ArticleParser()
    parser.feed(raw.decode("utf-8", errors="replace"))
    articles = [n for n in descendants(parser.root) if n.tag == "article"]
    if len(articles) != 1:
        raise ValueError(
            "Resource must have one explicit article; cannot ingest whole-page boilerplate"
        )
    found = []

    def visit(node):
        if node.tag in EXCLUDED or re.search(
            r"related|social|share|newsletter|cookie", node.attrs.get("class", ""), re.IGNORECASE
        ):
            return
        if node.tag in {"p", "h1", "h2", "h3", "h4", "li"}:
            body = " ".join(text(node).split())
            # Keep article narration; do not assume permission for attributed third-party quotes.
            if len(body) >= 35 and not any(mark in body for mark in ("“", "”", '"', "©")):
                found.append(body)
            return
        for child in node.children:
            if isinstance(child, Node):
                visit(child)

    visit(articles[0])
    if not found:
        raise ValueError("No admissible article paragraphs")
    return found


def build_resource_release(root=ROOT):
    release = build_unified_release()
    base_revision = release["revision"]
    manifest_raw = (root / "acquisition.json").read_bytes()
    acquired = {item["id"]: item for item in json.loads(manifest_raw)["artifacts"]}
    # Rights evidence is independently recoverable, not merely a URL assertion.
    rights = acquired["nasa-usage-guidelines"]
    rights_raw = load_artifact(root, rights)
    release["_artifacts"][digest(rights_raw)] = rights_raw
    report = []
    for resource in release["resources"]:
        entry = acquired[resource["id"]]
        if entry["url"] != resource["url"]:
            raise ValueError("Resource acquisition URL changed")
        raw = (
            load_artifact(root, entry)
            if entry.get("localPath")
            else json.dumps({"resource": resource, "acquisition": entry}, sort_keys=True).encode()
        )
        paragraphs = []
        if resource["kind"] == "data_repository":
            status = "discovery_link"
        elif resource["kind"] == "video":
            status = "transcript_not_verified"
        elif entry.get("statusCode") != 200:
            status = "acquisition_unavailable"
        elif urlparse(entry.get("resolvedUrl", "")).hostname not in {
            "www.nasa.gov",
            "sma.nasa.gov",
            "spinoff.nasa.gov",
        }:
            status = "rights_pending"
        else:
            paragraphs = article_paragraphs(raw)
            status = "source_checked"
        sha = digest(raw)
        source = {
            "id": uid(f"challenge-resource:{resource['id']}:{sha}:{PARSER}"),
            "investigationId": None,
            "sourceScope": "challenge",
            "resourceId": resource["id"],
            "title": resource["title"],
            "filename": resource["id"] + (".html" if entry.get("localPath") else ".json"),
            "sha256": sha,
            "fileVersion": PARSER,
            "studyVersion": None,
            "version": f"resource:{resource['id']}/file:{PARSER}/sha256:{sha}",
            "sourceUrl": resource["url"],
            "resolvedUrl": entry.get("resolvedUrl"),
            "license": NASA_TEXT_LICENSE if paragraphs else "unknown",
            "rightsUrl": NASA_RIGHTS_URL if paragraphs else None,
            "rightsScope": "NASA-authored article text only" if paragraphs else None,
            "kind": resource["kind"],
            "status": status,
            "byteCount": len(raw),
            "doi": None,
            "contentType": entry.get("contentType", "application/json"),
        }
        release["sources"].append(source)
        release["_artifacts"][sha] = raw
        for index, paragraph in enumerate(paragraphs, 1):
            for first, last, body in _sentence_windows(paragraph, 800):
                locator = f"HTML article / paragraph {index} / sentences {first}-{last}"
                body = resource["title"] + ": " + body
                release["chunks"].append(
                    {
                        "id": uid(f"chunk:{source['id']}:{locator}:{digest(body.encode())}"),
                        "sourceId": source["id"],
                        "investigationId": None,
                        "sourceScope": "challenge",
                        "locator": locator,
                        "sourceRef": resource["url"],
                        "text": body,
                        "heading": resource["title"],
                        "type": "challenge_context",
                        "status": "source_checked",
                        "contextual": resource["kind"],
                    }
                )
        resource.update(
            sourceId=source["id"],
            status=status,
            license=source["license"],
            indexed=bool(paragraphs),
            investigationIds=[],
        )
        report.append({"id": resource["id"], "status": status, "paragraphs": len(paragraphs)})
    revision = digest(
        json.dumps(
            {
                "parser": PARSER,
                "baseRevision": base_revision,
                "acquisitionSha256": digest(manifest_raw),
                "sources": release["sources"],
                "chunks": [[c["id"], c["type"]] for c in release["chunks"]],
            },
            sort_keys=True,
        ).encode()
    )
    identities = {}
    for run in release["runs"]:
        old = run["id"]
        run["id"] = uid(
            f"run:{revision}:{run['sourceId']}:{run['rowNumber']}:{run['externalRunKey']}"
        )
        identities[old] = run["id"]
    for key in ("telemetry", "telemetryChannels"):
        release[key] = {identities[k]: v for k, v in release[key].items()}
    release.update(revision=revision, parserVersion=PARSER, resourceAcquisition=report)
    release["stats"].update(sources=len(release["sources"]), chunks=len(release["chunks"]))
    release["limitations"].append(
        "Challenge resources are background/history, not experimental measurements. "
        "Discovery links and unverified video transcripts are not indexed."
    )
    return release


def load_artifact(root, entry):
    path = (root / entry["localPath"]).resolve()
    if not path.is_relative_to(root.resolve()):
        raise ValueError("Resource artifact path escaped its root")
    stored = path.read_bytes()
    raw = gzip.decompress(stored)
    if (
        digest(stored) != entry["storedSha256"]
        or digest(raw) != entry["sha256"]
        or len(raw) != entry["byteCount"]
    ):
        raise ValueError("Resource artifact hash/size mismatch")
    return raw
