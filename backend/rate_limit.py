import time
from collections import defaultdict, deque
from typing import Deque

from fastapi import Header, HTTPException, Request


RATE_LIMIT = 100
RATE_LIMIT_WINDOW_SECONDS = 60

request_history: dict[str, Deque[float]] = defaultdict(deque)


def rate_limit(
    request: Request,
    current_user_id: str | None = Header(default=None, alias="X-User-Id"),
):
    now = time.monotonic()
    client_host = request.client.host if request.client else "unknown"
    client_key = f"user:{current_user_id}" if current_user_id else f"ip:{client_host}"
    history = request_history[client_key]

    while history and now - history[0] > RATE_LIMIT_WINDOW_SECONDS:
        history.popleft()

    if len(history) >= RATE_LIMIT:
        raise HTTPException(429, detail="Rate limit exceeded")

    history.append(now)
