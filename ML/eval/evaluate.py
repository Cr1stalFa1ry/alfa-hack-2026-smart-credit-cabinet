"""Задача 3: проверка качества на файлах с правильными ответами.

  python -m eval.evaluate            # без нейросети
  python -m eval.evaluate --llm      # правила + Qwen через Ollama

Выписка data/demo/<name>.csv|xlsx сравнивается с data/demo/<name>.expected.json:
показатель совпал, если расхождение ≤ 1% (или оба «не найдено»).
Также: все файлы data/bad/* должны давать «нужен ручной ввод»; точность категорий на data/labeled/descriptions.csv.
Отчёт: eval/report.json. Код выхода 1, если что-то не прошло.
"""

import argparse
import csv
import json
import sys
from datetime import date
from pathlib import Path

from app.analyzer import analyze
from app.categories import Category
from app.classifier import classify
from app.llm import OllamaClient

ROOT = Path(__file__).resolve().parent.parent
TOLERANCE = 0.01


def matches(pred, exp, tol: float = TOLERANCE) -> bool:
    if exp is None or pred is None:
        return exp is pred
    if exp == 0:
        return abs(pred) < 0.01
    return abs(pred - exp) <= tol * abs(exp)


def eval_statements(demo_dir: Path, llm) -> dict:
    files = []
    for exp_path in sorted(demo_dir.glob("*.expected.json")):
        name = exp_path.name.removesuffix(".expected.json")
        stmt = next((p for ext in (".csv", ".xlsx", ".xls") if (p := demo_dir / f"{name}{ext}").exists()), None)
        if stmt is None:
            continue
        expected = json.loads(exp_path.read_text(encoding="utf-8"))
        as_of = date.fromisoformat(expected["as_of"]) if expected.get("as_of") else None
        res = analyze(stmt.read_bytes(), stmt.name, as_of=as_of, llm=llm, owner_name=expected.get("owner_name"))
        rows = []
        for metric, exp in expected["metrics"].items():
            pred = res.get("metrics", {}).get(metric, {}).get("value") if res["status"] == "ok" else None
            err = None if pred is None or exp in (None, 0) else (pred - exp) / exp
            rows.append({"metric": metric, "expected": exp, "predicted": pred,
                         "rel_error": None if err is None else round(err, 6), "ok": matches(pred, exp)})
        files.append({"file": stmt.name, "status": res["status"], "metrics": rows,
                      "matched": sum(r["ok"] for r in rows), "total": len(rows)})
    return {"files": files, "matched": sum(f["matched"] for f in files), "total": sum(f["total"] for f in files)}


def eval_bad(bad_dir: Path) -> dict:
    rows = []
    for p in sorted(bad_dir.glob("*")):
        if p.is_file():
            res = analyze(p.read_bytes(), p.name, as_of=date(2026, 10, 21))
            rows.append({"file": p.name, "status": res["status"], "reason": (res.get("reason") or {}).get("code"),
                         "ok": res["status"] == "manual_input_required"})
    return {"files": rows, "passed": sum(r["ok"] for r in rows), "total": len(rows)}


def eval_labels(path: Path, llm, owner_name: str | None = None) -> dict:
    import pandas as pd

    with path.open(encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    df = pd.DataFrame({"description": [r["description"] for r in rows],
                       "counterparty": [r["counterparty"] for r in rows],
                       "amount": [1.0 if r["sign"] == "+" else -1.0 for r in rows]})
    pred = classify(df, llm, owner_name)
    truth = [r["category"] for r in rows]
    unclear = Category.UNCLEAR.value
    covered = [(t, p) for t, p in zip(truth, pred["category"]) if p != unclear]
    errors = [{"description": r["description"], "sign": r["sign"], "expected": t, "predicted": p, "source": s}
              for r, t, p, s in zip(rows, truth, pred["category"], pred["source"]) if t != p]
    return {"total": len(rows), "accuracy": round(sum(t == p for t, p in zip(truth, pred["category"])) / len(rows), 4),
            "coverage": round(len(covered) / len(rows), 4),
            "precision_on_covered": round(sum(t == p for t, p in covered) / len(covered), 4) if covered else None,
            "wrong_confident": sum(1 for t, p in covered if t != p), "errors": errors}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--llm", action="store_true", help="включить нейросеть (нужен Ollama)")
    ap.add_argument("--demo", default=str(ROOT / "data" / "demo"))
    ap.add_argument("--out", default=str(ROOT / "eval" / "report.json"))
    args = ap.parse_args()

    llm = OllamaClient(cache_path=str(ROOT / "cache" / "llm_cache.json")) if args.llm else None
    if llm and not llm.is_available():
        print(f"! Ollama/{llm.model} недоступна по {llm.url} — считаю только правилами")
    report = {
        "mode": "rules+llm" if llm and llm.is_available() else "rules",
        "statements": eval_statements(Path(args.demo), llm),
        "bad_files": eval_bad(ROOT / "data" / "bad"),
        "labels": eval_labels(ROOT / "data" / "labeled" / "descriptions.csv", llm),
        # Строки, которые правила не понимают: здесь видно, что даёт нейросеть. Владелец известен из профиля.
        "hard_cases": eval_labels(ROOT / "data" / "labeled" / "hard_cases.csv", llm, "Иванов Иван Иванович"),
    }
    Path(args.out).write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Режим: {report['mode']}")
    for f in report["statements"]["files"]:
        print(f"\n{f['file']}: {f['matched']}/{f['total']} показателей в пределах 1%")
        for r in f["metrics"]:
            err = "" if r["rel_error"] is None else f"{r['rel_error'] * 100:+.3f}%"
            print(f"  {'✓' if r['ok'] else '✗'} {r['metric']:<28} ожид. {r['expected']!s:>14}  получ. {r['predicted']!s:>14}  {err}")
    s, b = report["statements"], report["bad_files"]
    print(f"\nИтого показателей: {s['matched']}/{s['total']}")
    print(f"Плохие файлы → ручной ввод: {b['passed']}/{b['total']} "
          + ", ".join(f"{r['file']}={r['reason']}" for r in b["files"]))
    for title, lab in [("Классификация строк", report["labels"]), ("Трудные строки", report["hard_cases"])]:
        prec = "—" if lab["precision_on_covered"] is None else f"{lab['precision_on_covered']:.0%}"
        print(f"{title} ({lab['total']}): accuracy {lab['accuracy']:.0%}, покрытие {lab['coverage']:.0%}, "
              f"точность на понятых {prec}, уверенных ошибок {lab['wrong_confident']}")
        for e in lab["errors"]:
            print(f"  ✗ {e['sign']} {e['description']!r}: ожид. {e['expected']}, получ. {e['predicted']} ({e['source']})")
    ok = s["matched"] == s["total"] and b["passed"] == b["total"]
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
