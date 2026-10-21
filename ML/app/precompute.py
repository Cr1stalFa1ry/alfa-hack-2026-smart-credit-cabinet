"""Прогрев кэша для демо: один раз прогнать выписки через правила + нейросеть и сохранить ответы.

  python -m app.precompute data/demo/*.csv --as-of 2026-10-21

Для каждого файла кэшируются варианты с владельцем ИП (owner_name из <name>.expected.json) и без него.
После этого сервис отдаёт демо-файлы мгновенно, даже если Ollama выключена
(cache/results/*.json и cache/llm_cache.json кладутся в репозиторий).
"""

import argparse
import json
from datetime import date
from pathlib import Path

from .cache import ResultCache, cached_analyze
from .llm import OllamaClient


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="+")
    ap.add_argument("--as-of", type=date.fromisoformat, default=date.today())
    ap.add_argument("--no-llm", action="store_true")
    args = ap.parse_args()

    cache = ResultCache()
    llm = None if args.no_llm else OllamaClient(cache_path=str(cache.dir.parent / "llm_cache.json"))
    if llm and not llm.is_available():
        print(f"! {llm.model} недоступна по {llm.url}: результаты с нейросетью не будут сохранены")
    for f in args.files:
        p = Path(f)
        meta = p.with_name(p.stem + ".expected.json")
        owner = json.loads(meta.read_text(encoding="utf-8")).get("owner_name") if meta.exists() else None
        for tx in (False, True):
            for own in dict.fromkeys([None, owner]):
                res = cached_analyze(cache, p.read_bytes(), p.name, args.as_of, llm, include_transactions=tx,
                                     owner_name=own, force=True)
        rev = res.get("metrics", {}).get("avgMonthlyRevenueRub", {}).get("display")
        print(f"{p.name}: {res['status']}, выручка/мес {rev}, источники {res.get('classification', {}).get('by_source')}")


if __name__ == "__main__":
    main()
