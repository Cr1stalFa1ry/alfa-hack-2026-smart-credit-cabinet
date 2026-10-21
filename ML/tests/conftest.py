import json
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
DEMO = ROOT / "data" / "demo"
BAD = ROOT / "data" / "bad"


class FakeLLM:
    """Подменяет OllamaClient: отвечает заранее заданной функцией."""

    def __init__(self, responder=None, available=True):
        self.responder = responder or (lambda messages, schema: None)
        self.available = available
        self.calls = []
        self.enabled = True

    def is_available(self):
        return self.available

    def chat_json(self, messages, schema=None, options=None, timeout_s=None):
        self.calls.append(messages)
        return self.responder(messages, schema)

    def info(self):
        return {"enabled": True, "available": self.available, "model": "fake"}


@pytest.fixture
def fake_ollama_server():
    """Локальный HTTP-сервер с API как у Ollama: /api/tags и /api/chat."""
    state = {"reply": {"text": "ok"}, "requests": []}

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def _send(self, payload):
            body = json.dumps(payload).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            self._send({"models": [{"name": "qwen2.5:7b-instruct"}]})

        def do_POST(self):
            req = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
            state["requests"].append(req)
            self._send({"message": {"role": "assistant", "content": json.dumps(state["reply"], ensure_ascii=False)}})

    server = HTTPServer(("127.0.0.1", 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    state["url"] = f"http://127.0.0.1:{server.server_port}"
    yield state
    server.shutdown()
