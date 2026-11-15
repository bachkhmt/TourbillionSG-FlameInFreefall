# Extractive RAG v3 evaluation — 2026-11-15

Scope: the product provider `nasa-extractive-v3` over the default unified release, not `playbook-rag/`. This is a small team-authored retrieval/navigation benchmark. It does not establish scientific interpretation, safety, corpus completeness or general question-answering accuracy.

## Reproduction

Run from repository root, with existing backend dependencies:

```bash
PYTHONPATH=.:flameguard-ai-backend flameguard-ai-backend/.venv/bin/python -m integrations.nasa_data.chat_evaluation --split development
PYTHONPATH=.:flameguard-ai-backend flameguard-ai-backend/.venv/bin/python -m integrations.nasa_data.chat_evaluation --split holdout
flameguard-ai-backend/.venv/bin/python -m pytest -q -s integration_tests/test_chat_evaluation.py
```

These commands read preserved local artifacts, use no network/database and call no LLM. The regression gates require Recall@4 ≥0.85 and correct abstention ≥0.90 in each split; comparison questions also require representation of every expected study group.

## Results

| Split | Questions (EN/VI) | Answerable | Recall@4 | First citation correct study | Correct abstention | Full comparison-group coverage |
| --- | --- | --- | --- | --- | --- | --- |
| Development | 30 (15/15) | 20 | 20/20 (100%) | 20/20 (100%) | 10/10 (100%) | 2/2 (100%) |
| Held out from tuning | 10 (5/5) | 6 | 6/6 (100%) | 6/6 (100%) | 4/4 (100%) | No comparison cases |

Recall@4 here means a question-level hit: at least one of the accepted investigation slugs occurs among the answer's first four citations. It does not require every slug in an alternatives list. Comparison-group coverage separately checks that both requested families are represented. Scores do not grade every retrieved excerpt's relevance or whether every sentence scientifically answers the question or whether the corpus includes every relevant finding. Excerpts pass backend-style source-slice and numeric-grounding validation in the evaluator.

## Frozen provenance

- Source revision: `117e7ff954cd16fd88ad1e5a2e530d56871a355dee4285b595151595c3312cc0`.
- Admitted registry / offline corpus version: `ea72b748a737e370e0ff3a31c98efecc0dcb2f53041f6303926a4226991b559b`.
- Corpus version kind: `offline-admitted-registry-sha256`; 2,574 passages. The serving backend additionally binds database snapshot content, so its runtime `corpus_version` is a separate fingerprint.
- Frozen question file SHA-256: `602ffb50b9f46bfa9cc74878cd1fb88a9f0effed1129ca71b6f0a79bb1c00dce`.
- Retrieval source digest at freeze: `10bca691afe215c8845dd44800bc7a760724388753a985f9b9b2e97ee26fa8b1`.
- Machine-readable evidence: [development](evaluation-development.json), [holdout](evaluation-holdout.json), [source freeze](evaluation-freeze.json).

The question JSON/split/hash was authored and frozen before tuning. Development outcomes were used while adjusting bounded vocabulary/ranking. The main agent authored the holdout prompts but did not execute or inspect their results until an independent `kit-reviewer` returned PASS and source hashes were frozen. No retrieval/provider behavior was changed after that first holdout run.

After publication, these questions are regression cases, not a permanently fresh test set. Future tuning requires a new held-out set for any new generalization claim. The pairs share topics and include related run/hardware queries, so ten holdout questions provide limited evidence beyond those topics.

## Preserved behavior and remaining limits

Regression coverage includes FLEX-007's original conflicting 1.87/1.82 mm, unchanged citation slices, exact record anchoring, follow-up history (including ordinary English “same”), refused mixed runs, planetary-data gaps, safety verdicts and irrelevant comparison topics. Chemical aliases normalize search only; they never rewrite source excerpts. English scientific Unicode does not force Vietnamese boilerplate.

Unsupported cross-record aggregates abstain with an Explorer suggestion (Prompt5 option A). There is no computed maximum, generated summary source, validated risk model or safety certification. Lexical matching and a small explicit vocabulary still limit unseen paraphrases, nuanced domain comparisons and topics outside indexed sources. Answers remain `unreviewed`.
