# RAG-only verification — 2026-11-15

User narrowed work to RAG quality (prompts4–5); submission declarations and other product work are outside this branch. Non-RAG work was preserved separately on the local `codex/hackathon-readiness-fixes-20261115` branch, commit `7dd5eee`. Existing user drafts and unrelated files are unchanged on the RAG branch.

## Executed checks

| Check | Result |
| --- | --- |
| New v3 regressions before implementation | 8 failed, 3 passed; reproduced chemical retrieval, comparison, fuel overview, language and aggregate defects |
| Independent-review regressions before their fixes | 3 failed; ordinary “same” follow-up and irrelevant EN/VI comparison topics |
| Focused retrieval/provider/grounding checks after fixes | 60 passed |
| Root full suite through `scripts/test_db.py run -- flameguard-ai-backend/.venv/bin/python -m pytest -q` | **103 passed, 0 skipped**, exit0,115.10s |
| Backend full suite, from backend root: `python3 ../scripts/test_db.py run -- .venv/bin/python -m pytest -q` | **700 passed, 0 skipped**, exit0,54.34s |
| Backend `ruff check .` and `ruff format --check .` | Passed, exit0 |
| Changed root Python files: Ruff check/format check | Passed, exit0 |
| `git diff --check` | Passed |
| `poetry check` | Could not run: Poetry executable is not installed (exit127); dependencies/lockfiles unchanged |
| Independent `kit-plan-critic` | APPROVE for narrowed plan |
| Independent `kit-reviewer` | PASS after fixing the two RAG findings, before holdout execution |

Only `tourbillion-test-pg` at127.0.0.1:55435 was used. Existing project helpers created fresh retained test-named databases/roles; no reset/import/migration of shared or Azure databases. No frontend checks are claimed for this RAG-only branch.

## Real HTTP socket smoke

A fresh default unified preview target was prepared using `scripts/prepare_chat_preview.py --prepare-new-test-target`. The standard backend app was started on an ephemeral localhost port with `scripts/run_chat_backend.py` (not an override/subclass). Readiness returned `ready`, `nasa-extractive-v3`,2574 passages.

Nine HTTP message requests returned201, covering EN/VI CO2/helium retrieval (FLEX first), BASS/Saffire comparison, FLEX fuel overview, BASS-II PMMA evidence, aggregate abstention, FLEX-007 D0 conflict, safety abstention and the ordinary “same pressure” follow-up retaining FLEX-007. The original FLEX citation URL/license was also resolved through the source endpoint. See [sanitized HTTP evidence](quality-http-smoke.json); no session identifiers or credentials are included. Test chat sessions retain the existing24-hour lifetime.

## Evaluation and practical limits

See [evaluation report](evaluation.md), frozen source hashes and split JSON reports. Development30 and held-out10 questions meet the declared thresholds. These small team-authored metrics check accepted investigation identity, abstention and comparison-group coverage, not every excerpt's relevance or scientific interpretation. In the HTTP CO2 smoke, lower-ranked citations can still include other investigations/resources; the reported100% question-level recall must not be read as100% citation precision.

The provider remains lexical/extractive and unreviewed. Cross-record aggregates deliberately abstain; no maximum oxygen or derived summary is fabricated. Scope/units/value/quote and safety boundaries remain enforced. Backend upstream owner review is required before merging.

## Deployed version

A read-only GET to the user-provided Azure frontend's `/api/proxy/api/v1/chat/readiness` returned200, `ready`, `nasa-extractive-v2`,2574 passages on2026-11-15. No deployment was performed; the public site does not yet run this v3 branch.
