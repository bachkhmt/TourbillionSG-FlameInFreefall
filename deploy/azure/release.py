"""Build, publish and roll out one component using the existing Azure resources."""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path
from urllib.error import URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]
CONFIG = Path(__file__).with_name("production.json")


def run(arguments, *, capture=False):
    command = [shutil.which(arguments[0]) or arguments[0], *arguments[1:]]
    result = subprocess.run(command, cwd=ROOT, check=True, text=True, capture_output=capture)
    return result.stdout.strip() if capture else None


def changed_components(paths):
    changed = set()
    for path in paths:
        if path.startswith("FlameInFreewall_Tourbillion/"):
            changed.add("frontend")
        if path.startswith(("flameguard-ai-backend/", "integrations/")):
            changed.add("backend")
        if path.startswith(("deploy/", ".github/workflows/")) or path in {
            ".dockerignore",
            ".gitattributes",
            "pytest.ini",
            "ruff.toml",
        }:
            changed.update(("backend", "frontend"))
    return changed


def event_changes(event, event_name):
    if event_name == "workflow_dispatch":
        return {"backend", "frontend"}
    if event_name == "pull_request":
        before = event["pull_request"]["base"]["sha"]
        after = event["pull_request"]["head"]["sha"]
    else:
        before, after = event["before"], event["after"]
    if before == "0" * 40:
        return {"backend", "frontend"}
    if not all(re.fullmatch(r"[a-f0-9]{40}", value) for value in (before, after)):
        raise ValueError("Expected full Git commit SHAs")
    paths = run(["git", "diff", "--name-only", "-z", before, after], capture=True).split("\0")
    return changed_components(paths)


def request(url, payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    headers = {"Content-Type": "application/json"} if data else {}
    with urlopen(Request(url, data=data, headers=headers), timeout=30) as response:
        body = response.read()
        if "json" in response.headers.get("Content-Type", ""):
            return json.loads(body)
        return body.decode()


def check_deployment(config, component):
    base = config[component]["url"].rstrip("/")
    prefix = "/api/v1"
    if component == "frontend":
        if "flameguard" not in request(base + "/").lower():
            raise ValueError("Frontend HTML does not contain the application")
        prefix = "/api/proxy/api/v1"
    ready = request(base + prefix + "/ready")
    if ready.get("database") != "ok":
        raise ValueError("Database readiness failed")
    studies = request(base + prefix + "/investigations?limit=1")
    if studies.get("total", 0) < 1 or studies.get("context", {}).get("origin") != "real":
        raise ValueError("NASA collection admission failed")
    descriptive = request(base + prefix + "/catalog/descriptive")
    if descriptive.get("recordCount", 0) < 1:
        raise ValueError("Descriptive evidence records are unavailable")
    identity = studies["items"][0]["id"]
    overview = request(base + prefix + f"/investigations/{identity}/overview")
    if not overview.get("passages"):
        raise ValueError("Study source overview is unavailable")
    chat = request(base + prefix + "/chat/readiness")
    if (
        chat.get("state") != "ready"
        or chat.get("source_revision") != config["collection"]["sourceRevision"]
        or chat.get("passages", 0) < 1
    ):
        raise ValueError("Extractive chat readiness failed")
    brief = request(
        base + prefix + "/mission/research",
        {
            "workflowId": "prevention",
            "question": "Research source context",
            "scenario": {
                "oxygenPct": 30,
                "oxygenBasis": "volume_percent",
                "pressurePsi": 10.2,
                "gravityG": 0.16,
                "airflowCmS": 5,
                "material": "PMMA",
            },
        },
    )
    if not brief.get("rows") or not brief.get("citations"):
        raise ValueError("Mission research release is unavailable")


def smoke(config, component, *, attempts=12):
    for attempt in range(attempts):
        try:
            check_deployment(config, component)
            print(f"Verified {component}: {config[component]['url']}", flush=True)
            return
        except (URLError, TimeoutError, ValueError) as error:
            print(
                f"Waiting for {component} ({attempt + 1}/{attempts}): {type(error).__name__}",
                flush=True,
            )
            if attempt + 1 < attempts:
                time.sleep(5)
    raise RuntimeError(f"Post-deployment checks failed for {component}")


def current_image(config, component):
    return run(
        [
            "az",
            "containerapp",
            "show",
            "--name",
            config[component]["app"],
            "--resource-group",
            config["resourceGroup"],
            "--query",
            "properties.template.containers[0].image",
            "--output",
            "tsv",
        ],
        capture=True,
    )


def update_image(config, component, image):
    run(
        [
            "az",
            "containerapp",
            "update",
            "--name",
            config[component]["app"],
            "--resource-group",
            config["resourceGroup"],
            "--image",
            image,
            "--output",
            "none",
        ]
    )


def rollout(config, component, image):
    previous = current_image(config, component)
    try:
        update_image(config, component, image)
        smoke(config, component)
    except Exception:
        if previous and current_image(config, component) == image:
            print(f"Restoring previous {component} image: {previous}", flush=True)
            update_image(config, component, previous)
        raise


def deploy(config, component, tag):
    if not re.fullmatch(r"[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}", tag):
        raise ValueError("Invalid image tag")
    image = f"{config['registryServer']}/{config[component]['repository']}:{tag}"
    revision = run(["git", "rev-parse", "HEAD"], capture=True)
    label = f"org.opencontainers.image.revision={revision}"
    if component == "backend":
        bundle = f".demo/cd-bundle-{tag}"
        run([sys.executable, "deploy/azure/prepare-bundle.py", "--output", bundle])
        base = f"flameguard-api-base:{tag}"
        run(
            [
                "docker",
                "build",
                "--platform",
                "linux/amd64",
                "--label",
                label,
                "-f",
                "deploy/backend.Dockerfile",
                "-t",
                base,
                ".",
            ]
        )
        run(
            [
                "docker",
                "build",
                "--platform",
                "linux/amd64",
                "--label",
                label,
                "-f",
                "deploy/backend-data.Dockerfile",
                "--build-arg",
                f"BACKEND_IMAGE={base}",
                "--build-arg",
                f"NASA_BUNDLE_DIR={bundle}",
                "-t",
                image,
                ".",
            ]
        )
    else:
        run(
            [
                "docker",
                "build",
                "--platform",
                "linux/amd64",
                "--label",
                label,
                "-f",
                "deploy/frontend.Dockerfile",
                "--build-arg",
                f"BACKEND_INTERNAL_URL={config['backend']['url']}",
                "-t",
                image,
                ".",
            ]
        )
    run(["az", "acr", "login", "--name", config["registry"]])
    run(["docker", "push", image])
    rollout(config, component, image)
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as output:
            output.write(f"Deployed `{image}`\n\n{config[component]['url']}\n\n")
    print(f"Deployed {image}", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("changes")
    release = commands.add_parser("deploy")
    release.add_argument("component", choices=("backend", "frontend"))
    release.add_argument("--tag", required=True)
    verify = commands.add_parser("smoke")
    verify.add_argument("component", choices=("backend", "frontend"))
    args = parser.parse_args()
    if args.command == "changes":
        event = json.loads(Path(os.environ["GITHUB_EVENT_PATH"]).read_text("utf-8"))
        changed = event_changes(event, os.environ["GITHUB_EVENT_NAME"])
        for component in ("backend", "frontend"):
            print(f"{component}={str(component in changed).lower()}")
        return
    config = json.loads(CONFIG.read_text("utf-8"))
    if args.command == "deploy":
        deploy(config, args.component, args.tag)
    else:
        smoke(config, args.component)


if __name__ == "__main__":
    main()
