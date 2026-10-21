"""Клиент Ollama (Qwen2.5 7B Instruct). Необязательный слой: любая ошибка = «нейросеть недоступна».

Настройки через переменные окружения:
  LLM_ENABLED=1|0, OLLAMA_URL, OLLAMA_MODEL, LLM_TIMEOUT_S, LLM_BUDGET_S, LLM_CACHE_PATH
"""

import hashlib
import json
import logging
import os
import threading
import time
import urllib.error
import urllib.request

log = logging.getLogger(__name__)


def _env_bool(name: str, default: bool) -> bool:
    return os.getenv(name, str(int(default))).strip().lower() in {"1", "true", "yes", "on"}


class OllamaClient:
    def __init__(self, url: str | None = None, model: str | None = None, enabled: bool | None = None,
                 timeout_s: float | None = None, cache_path: str | None = None):
        self.url = (url or os.getenv("OLLAMA_URL", "http://localhost:11434")).rstrip("/")
        self.model = model or os.getenv("OLLAMA_MODEL", "qwen2.5:7b-instruct")
        self.enabled = _env_bool("LLM_ENABLED", True) if enabled is None else enabled
        self.timeout_s = timeout_s or float(os.getenv("LLM_TIMEOUT_S", "20"))
        self.cache_path = cache_path if cache_path is not None else os.getenv("LLM_CACHE_PATH", "")
        self._available: tuple[float, bool] | None = None
        self._lock = threading.Lock()
        self._cache: dict[str, dict] = self._load_cache()

    # --- кэш ответов: один и тот же запрос к модели не повторяется (демо без ожидания) ---
    def _load_cache(self) -> dict:
        if self.cache_path and os.path.exists(self.cache_path):
            try:
                with open(self.cache_path, encoding="utf-8") as f:
                    return json.load(f)
            except (OSError, json.JSONDecodeError):
                log.warning("LLM cache %s is broken, ignoring", self.cache_path)
        return {}

    def _save_cache(self) -> None:
        if not self.cache_path:
            return
        try:
            os.makedirs(os.path.dirname(self.cache_path) or ".", exist_ok=True)
            tmp = self.cache_path + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(self._cache, f, ensure_ascii=False, indent=1, sort_keys=True)
            os.replace(tmp, self.cache_path)
        except OSError:
            log.warning("Cannot write LLM cache %s", self.cache_path)

    def _key(self, messages: list[dict], schema: dict | None, options: dict) -> str:
        payload = json.dumps([self.model, messages, schema, options], ensure_ascii=False, sort_keys=True)
        return hashlib.sha256(payload.encode()).hexdigest()

    # --- доступность ---
    def is_available(self) -> bool:
        if not self.enabled:
            return False
        now = time.monotonic()
        if self._available and now - self._available[0] < 30:
            return self._available[1]
        ok = False
        try:
            with urllib.request.urlopen(f"{self.url}/api/tags", timeout=1.5) as r:
                tags = json.load(r)
            names = {m.get("name", "") for m in tags.get("models", [])}
            ok = self.model in names or f"{self.model}:latest" in names
            if not ok:
                log.warning("Ollama is up but model %s is not pulled", self.model)
        except (urllib.error.URLError, OSError, ValueError):
            ok = False
        self._available = (now, ok)
        return ok

    def chat_json(self, messages: list[dict], schema: dict | None = None,
                  options: dict | None = None, timeout_s: float | None = None) -> dict | None:
        """Запрос к /api/chat с ответом в JSON. None, если модель недоступна или ответ не JSON."""
        if not self.enabled:
            return None
        options = {"temperature": 0, **(options or {})}
        key = self._key(messages, schema, options)
        with self._lock:
            if key in self._cache:
                return self._cache[key]
        if not self.is_available():
            return None
        body = {"model": self.model, "messages": messages, "stream": False,
                "format": schema or "json", "options": options, "keep_alive": "30m"}
        req = urllib.request.Request(f"{self.url}/api/chat", data=json.dumps(body).encode(),
                                     headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=timeout_s or self.timeout_s) as r:
                content = json.load(r)["message"]["content"]
            result = json.loads(content)
        except (urllib.error.URLError, OSError, ValueError, KeyError, TypeError) as e:
            log.warning("Ollama request failed: %s", e)
            self._available = (time.monotonic(), False)
            return None
        if not isinstance(result, dict):
            return None
        with self._lock:
            self._cache[key] = result
            self._save_cache()
        return result

    def info(self) -> dict:
        return {"enabled": self.enabled, "available": self.is_available(), "model": self.model, "url": self.url}
