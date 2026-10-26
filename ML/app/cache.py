"""Кэш готовых результатов по содержимому файла (sha256): демо-файлы отвечают мгновенно.

Ключ — хэш байтов файла, поэтому новая версия документа никогда не получит результат старой.
"""

import hashlib
import json
import os
from pathlib import Path

from . import PIPELINE_VERSION
from .analyzer import analyze
from .documents import read_document

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


def _cached(cache: ResultCache, raw: bytes, params: dict, compute, llm, force: bool) -> dict:
    use_llm = llm is not None and llm.enabled
    key = cache.key(raw, use_llm=use_llm, **params)
    if not force and (hit := cache.get(key)) is not None:
        return {**hit, "cached": True}
    result = compute(llm if use_llm else None)
    # Пока нейросеть недоступна, не кэшируем: когда она появится, ответ станет точнее.
    if not use_llm or llm.is_available():
        cache.put(key, result)
    return {**result, "cached": False}


def cached_analyze(cache: ResultCache, raw: bytes, filename: str, as_of, llm, include_transactions: bool = False,
                   owner_name: str | None = None, force: bool = False) -> dict:
    """analyze() с кэшем. Ключ зависит от файла и месяца as_of (только он влияет на выбор закрытых месяцев)."""
    return _cached(cache, raw, {"as_of_month": f"{as_of:%Y-%m}", "tx": include_transactions, "owner": owner_name or ""},
                   lambda m: analyze(raw, filename, as_of=as_of, llm=m, include_transactions=include_transactions,
                                     owner_name=owner_name), llm, force)


def cached_read(cache: ResultCache, raw: bytes, filename: str, as_of, llm, owner_name: str | None = None,
                force: bool = False) -> dict:
    """read_document() с тем же кэшем (OCR скана — секунды, повторный запрос — миллисекунды)."""
    return _cached(cache, raw, {"fn": "document", "as_of_month": f"{as_of:%Y-%m}", "owner": owner_name or ""},
                   lambda m: read_document(raw, filename, as_of=as_of, llm=m, owner_name=owner_name), llm, force)
