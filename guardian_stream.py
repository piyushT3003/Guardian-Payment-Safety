"""
Guardian Real-Time Server-Sent Events (SSE) Stream Bus
======================================================
Provides a thread-safe, resilient pub/sub event bus for streaming live transactions,
fraud alerts, family approvals, and 5-minute recovery timers to connected frontend clients.
"""

from __future__ import annotations

import json
import os
import queue
import threading
import time
from datetime import datetime, timezone
from typing import Any, Dict, Generator

IS_SERVERLESS = bool(
    os.environ.get("VERCEL")
    or os.environ.get("AWS_LAMBDA_FUNCTION_NAME")
    or os.environ.get("NOW_REGION")
)


class EventBus:
    """Thread-safe SSE publisher and subscriber registry."""

    def __init__(self):
        self._lock = threading.Lock()
        self._listeners: list[queue.Queue] = []

    def subscribe(self) -> queue.Queue:
        q: queue.Queue = queue.Queue(maxsize=100)
        with self._lock:
            self._listeners.append(q)
        return q

    def unsubscribe(self, q: queue.Queue):
        with self._lock:
            if q in self._listeners:
                self._listeners.remove(q)

    def publish(self, event_type: str, data: Dict[str, Any]):
        message = {
            "event": event_type,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        with self._lock:
            dead_queues = []
            for q in self._listeners:
                try:
                    q.put_nowait(message)
                except queue.Full:
                    dead_queues.append(q)
            for dead in dead_queues:
                if dead in self._listeners:
                    self._listeners.remove(dead)

    def get_listener_count(self) -> int:
        with self._lock:
            return len(self._listeners)


# Global singleton instance
stream_bus = EventBus()


def format_sse(data: str, event: str | None = None) -> str:
    """Formats payload as valid Server-Sent Event text."""
    msg = ""
    if event:
        msg += f"event: {event}\n"
    msg += f"data: {data}\n\n"
    return msg


def event_stream_generator(q: queue.Queue) -> Generator[str, None, None]:
    """Yields SSE events from queue or ping heartbeats to prevent connection timeout."""
    # Send initial connection handshake
    initial_payload = json.dumps({"connected": True, "server_time": datetime.now(timezone.utc).isoformat()})
    yield format_sse(initial_payload, event="handshake")

    start_time = time.time()
    max_duration = 20.0 if IS_SERVERLESS else None

    try:
        while True:
            if max_duration and (time.time() - start_time) > max_duration:
                # In serverless environments (Vercel/AWS Lambda), close stream gracefully
                # before function timeout; native browser EventSource will auto-reconnect.
                break
            try:
                # Wait for up to 5 seconds for an event
                message = q.get(timeout=5.0)
                event_name = message.get("event", "message")
                payload_str = json.dumps(message.get("data", {}))
                yield format_sse(payload_str, event=event_name)
            except queue.Empty:
                # Heartbeat keep-alive ping
                yield ": ping\n\n"
    except GeneratorExit:
        pass
    finally:
        stream_bus.unsubscribe(q)
