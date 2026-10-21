"""Кэш готовых результатов анализа по содержимому файла (sha256): демо-выписки отвечают мгновенно."""

import hashlib
import json
import os
from pathlib import Path

from . import PIPELINE_VERSION
from .analyzer import analyze

DEFAULT_DIR = Path(__file__).resolve().parent.parent / "cache" / "results"


class ResultCache:
    def __init__(self, directory: str | Path | None = None):
        self.dir = Path(directory or os.getenv("RESULT_CACHE_DIR", DEFAULT_DIR))

    @staticmethod
    def key(raw: bytes, **params) -> str:
        h = hashlib.sha256(raw)
        h.update(json.dumps({"v": PIPELINE_VERSION, **params}, sort_keys=True, default=str).encode())
        return h.hexdigest()

    def get(self, key: str) -> dict | None:
        path = self.dir / f"{key}.json"
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return None

    def put(self, key: str, result: dict) -> None:
        try:
            self.dir.mkdir(parents=True, exist_ok=True)
            tmp = self.dir / f"{key}.tmp"
            tmp.write_text(json.dumps(result, ensure_ascii=False, indent=1), encoding="utf-8")
            os.replace(tmp, self.dir / f"{key}.json")
        except OSError:
            pass  # кэш — ускорение, а не обязательная часть


def cached_analyze(cache: ResultCache, raw: bytes, filename: str, as_of, llm, include_transactions: bool = False,
                   owner_name: str | None = None, force: bool = False) -> dict:
    """analyze() с кэшем. Ключ зависит от файла и месяца as_of (только он влияет на выбор закрытых месяцев)."""
    use_llm = llm is not None and llm.enabled
    key = cache.key(raw, as_of_month=f"{as_of:%Y-%m}", use_llm=use_llm, tx=include_transactions,
                    owner=owner_name or "")
    if not force and (hit := cache.get(key)) is not None:
        return {**hit, "cached": True}
    result = analyze(raw, filename, as_of=as_of, llm=llm if use_llm else None,
                     include_transactions=include_transactions, owner_name=owner_name)
    # Пока нейросеть недоступна, не кэшируем: когда она появится, ответ станет точнее.
    if not use_llm or result.get("llm", {}).get("available"):
        cache.put(key, result)
    return {**result, "cached": False}
