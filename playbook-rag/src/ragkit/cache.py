from __future__ import annotations

import hashlib
import threading
import time
from collections import OrderedDict, defaultdict, deque


def cache_key(*parts: str) -> str:
    return hashlib.sha256("\x1f".join(parts).encode()).hexdigest()[:24]


class TTLCache:
    def __init__(self, ttl_s: float = 3600, max_items: int = 256):
        self.ttl, self.max = ttl_s, max_items
        self._d: OrderedDict[str, tuple[float, dict]] = OrderedDict()
        self._lock = threading.Lock()

    def get(self, key: str) -> dict | None:
        with self._lock:
            item = self._d.get(key)
            if not item or time.time() - item[0] > self.ttl:
                self._d.pop(key, None)
                return None
            self._d.move_to_end(key)
            return item[1]

    def set(self, key: str, value: dict) -> None:
        with self._lock:
            self._d[key] = (time.time(), value)
            while len(self._d) > self.max:
                self._d.popitem(last=False)


class RateLimiter:
    """Cửa sổ trượt theo khóa (IP). allow() trả False khi vượt limit trong window_s giây."""

    def __init__(self, limit: int = 20, window_s: float = 60):
        self.limit, self.window = limit, window_s
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def allow(self, key: str, now: float | None = None) -> bool:
        now = time.time() if now is None else now
        with self._lock:
            q = self._hits[key]
            while q and now - q[0] > self.window:
                q.popleft()
            if len(q) >= self.limit:
                return False
            q.append(now)
            return True
