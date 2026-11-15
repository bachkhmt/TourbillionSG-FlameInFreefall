.PHONY: install ingest test eval serve lint
install:
	pip install -e ".[dev]"
ingest:
	python -m ragkit ingest
test:
	pytest -q
eval:
	RAG_OFFLINE=1 python -m ragkit eval
serve:
	python -m ragkit serve
lint:
	ruff check src tests
