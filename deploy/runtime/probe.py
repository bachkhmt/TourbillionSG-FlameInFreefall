"""No credentials or response bodies in container health output."""

import os
import sys
from urllib.request import urlopen

if __name__ == "__main__":
    endpoint = "ready" if sys.argv[1:] == ["ready"] else "health"
    try:
        with urlopen(
            f"http://127.0.0.1:{os.environ.get('PORT', '8000')}/api/v1/{endpoint}", timeout=3
        ) as response:
            sys.exit(0 if response.status == 200 else 1)
    except Exception:
        sys.exit(1)
