from __future__ import annotations

import argparse
import json
import sys

from . import evaluate, ingest
from .config import Settings
from .pipeline import RagPipeline


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="ragkit")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("ingest", help="dựng data/chunks.json từ playbook + data/corpus/")
    a = sub.add_parser("ask", help="hỏi một câu")
    a.add_argument("question")
    a.add_argument("--scenario")
    a.add_argument("--mode", choices=["engineer", "student"], default="engineer")
    a.add_argument("--json", action="store_true")
    sub.add_parser("eval", help="chạy bộ câu hỏi mẫu")
    s = sub.add_parser("serve", help="chạy web + API")
    s.add_argument("--host", default="127.0.0.1")
    s.add_argument("--port", type=int, default=8000)
    args = ap.parse_args(argv)

    if args.cmd == "ingest":
        st = Settings.from_env()
        chunks = ingest.build(st)
        print(f"{len(chunks)} chunk -> {ingest.save(chunks, st)}")
    elif args.cmd == "ask":
        r = RagPipeline.from_settings().answer(args.question, args.scenario, args.mode)
        if args.json:
            print(json.dumps(r, ensure_ascii=False, indent=2))
        else:
            a_, m = r["answer"], r["meta"]
            print(f"[{m['mode']}{'/' + m['reason'] if m['reason'] else ''}] coverage={a_['coverage']}\n")
            for seg in a_["segments"]:
                print(f"- {seg['text']}  {seg['citations']}")
            for miss in a_["missing"]:
                print(f"! thiếu: {miss}")
    elif args.cmd == "eval":
        return evaluate.main([])
    elif args.cmd == "serve":
        import uvicorn

        uvicorn.run("ragkit.api:app", host=args.host, port=args.port)
    return 0


if __name__ == "__main__":
    sys.exit(main())
