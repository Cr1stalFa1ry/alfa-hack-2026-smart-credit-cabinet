"""Чтение документов: сверка с эталоном пакета «документы и эталоны пяти ИП» (data/documents).

  python -m eval.documents                          # все документы
  python -m eval.documents --split development,seen_regression_only   # только перечисленные наборы

По каждому документу: статус чтения, поля, позиции, операции выписок и их категории. Сравнение с заявкой
(BUYER/SUPPLIER/AMOUNT_MISMATCH) — работа бэкенда; здесь оно смоделировано, чтобы проверить, что извлечённых
значений для него хватает. Отчёт: eval/documents_report.json и eval/documents_report.md (список ошибок).
"""

import argparse
import json
import re
import sys
import time
from collections import Counter
from datetime import date
from pathlib import Path

from app.categories import package_code
from app.documents import read_document

ROOT = Path(__file__).resolve().parent.parent
AS_OF = date(2026, 10, 24)
CRITICAL_IN = {"LOAN_IN", "OWN_TRANSFER", "REFUND_IN"}  # не выручка: ошибка «в выручку» завышает доход
# «Тестовый идентификатор счёта: DEMO-ACC-…» есть только в макете; настоящий номер счёта (20 цифр) — account_number.
IGNORED_FIELDS = {"test_account_id"}


def norm(v) -> str:
    s = str(v).lower().replace("ё", "е")
    return re.sub(r"\s+", " ", re.sub(r"[«»“”„\"]", '"', s)).strip()


def same(gt, pred) -> bool:
    if gt is None or pred is None:
        return gt is pred
    try:
        return abs(float(gt) - float(pred)) < 0.005
    except (TypeError, ValueError):
        return norm(gt) == norm(pred)


def outcome(gt, pred) -> str:
    """ok | missing (null вместо значения — безопасно) | wrong | invented (значение вместо null)."""
    if same(gt, pred):
        return "ok"
    return "missing" if pred is None else "invented" if gt is None else "wrong"


def backend_flags(res: dict, ref: dict | None) -> set[str]:
    """Как бэкенд сравнит прочитанное с заявкой: сумма счёта — со стоимостью покупки, а не с кредитом."""
    f = {k: v["value"] for k, v in res["fields"].items()}
    flags = {i["code"] for i in res["issues"]} & {"MISSING_PAGE", "LOW_RESOLUTION"}
    if ref:
        for flag, key, ref_key in [("SUPPLIER_MISMATCH", "supplier_inn", "supplier_inn"),
                                   ("BUYER_MISMATCH", "buyer_inn", "buyer_inn"),
                                   ("AMOUNT_MISMATCH", "total_amount_rub", "equipment_cost_rub")]:
            if f.get(key) is not None and ref.get(ref_key) and not same(ref[ref_key], f[key]):
                flags.add(flag)
    return flags


def eval_fields(gt: dict, res: dict) -> list[dict]:
    rows = []
    items = res.get("line_items") or []
    for key, g in gt.get("fields", {}).items():
        if key in IGNORED_FIELDS:
            continue
        pred = items[0]["description"] if key == "equipment_description" and items else \
            res["fields"].get(key, {}).get("value")
        rows.append({"field": key, "expected": g["value"], "predicted": pred, "outcome": outcome(g["value"], pred)})
    totals = {"credit_rub": "credit_total_rub", "debit_rub": "debit_total_rub",
              "synthetic_opening_balance_rub": "opening_balance_rub", "closing_balance_rub": "closing_balance_rub"}
    partial = gt["expected_status"] == "PARTIAL"
    for g_key, key in totals.items():  # обороты в шапке есть и на первой странице неполной выписки
        if g_key in gt.get("totals", {}):
            pred = res["fields"].get(key, {}).get("value")
            rows.append({"field": key, "expected": gt["totals"][g_key], "predicted": pred,
                         "outcome": outcome(gt["totals"][g_key], pred) if not partial or pred is not None else "ok"})
    return rows


def eval_items(gt: dict, res: dict) -> list[dict]:
    rows = []
    pred = res.get("line_items") or []
    for i, g in enumerate(gt.get("line_items", [])):
        p = pred[i] if i < len(pred) else {}
        for key, pkey in [("description", "description"), ("quantity", "quantity"),
                          ("unit_price_rub", "unit_price_rub"), ("amount_rub", "amount_rub")]:
            rows.append({"field": f"item{i + 1}.{key}", "expected": g[key], "predicted": p.get(pkey),
                         "outcome": outcome(g[key], p.get(pkey))})
    if len(pred) > len(gt.get("line_items", [])) and gt.get("line_items"):
        rows.append({"field": "items.count", "expected": len(gt["line_items"]), "predicted": len(pred),
                     "outcome": "invented"})
    return rows


def eval_transactions(gt: dict, res: dict) -> dict:
    pred = list(res.get("transactions") or [])
    pool: dict[tuple, list[dict]] = {}
    for t in pred:
        pool.setdefault((t["date"], round(t["amount"], 2)), []).append(t)
    matched, errors, critical = [], [], []
    cat = Counter()
    for g in gt["transactions"]:
        cands = pool.get((g["date"], round(float(g["amount"]), 2)))
        if not cands:
            errors.append({"row": g["row_id"], "error": "операция не извлечена", "expected": g["description"]})
            continue
        p = cands.pop(0)
        matched.append(p)
        for key in ("counterparty", "description"):
            if norm(p[key]) != norm(g[key]):
                cat["text_errors"] += 1
                errors.append({"row": g["row_id"], "error": f"{key} прочитан неверно",
                               "expected": g[key], "predicted": p[key]})
        code = package_code(p["category"], p["amount"])
        review_ok = g["semantic_review_required"] or g["category"] is None
        if code == g["category"] or (review_ok and p["needs_review"]):
            cat["correct"] += 1
        elif p["needs_review"]:
            cat["sent_to_review"] += 1
        else:
            cat["wrong_confident"] += 1
            errors.append({"row": g["row_id"], "error": "категория", "expected": g["category"],
                           "predicted": code, "description": g["description"]})
        if g["category"] in CRITICAL_IN and code == "BUSINESS_RECEIPT":
            critical.append({"row": g["row_id"], "expected": g["category"], "amount": float(g["amount"])})
    extra = sum(len(v) for v in pool.values())
    monthly = []
    if res.get("analysis", {}).get("status") == "ok":
        got = {m["month"]: m for m in res["analysis"]["monthly"]}
        for m in gt.get("monthly_reference_from_construction", []):
            g_m = got.get(m["month"], {})
            monthly.append({"month": m["month"],
                            "revenue_ok": same(m["clean_receipts_rub"], g_m.get("revenue")),
                            "outflow_ok": same(m["operating_outflow_rub"], g_m.get("operating_outflow"))})
    return {"expected": len(gt["transactions"]), "extracted": len(pred), "matched": len(matched),
            "not_in_document": extra, "category": dict(cat), "critical_to_revenue": critical,
            "monthly_ok": f"{sum(m['revenue_ok'] and m['outflow_ok'] for m in monthly)}/{len(monthly)}"
            if monthly else None, "errors": errors}


def evaluate(package: Path, split: str | None) -> dict:
    gt_all = json.loads((package / "labels" / "documents_ground_truth.json").read_text(encoding="utf-8"))
    docs = []
    for gt in gt_all["documents"]:
        if split and gt["split"] not in split.split(","):
            continue
        started = time.monotonic()
        res = read_document((package / gt["file"]).read_bytes(), Path(gt["file"]).name, as_of=AS_OF)
        flags = backend_flags(res, gt.get("reference_request"))
        rows = eval_fields(gt, res) + eval_items(gt, res)
        doc = {"document_id": gt["document_id"], "file": gt["file"], "split": gt["split"],
               "seconds": round(time.monotonic() - started, 2),
               "status": {"expected": gt["expected_status"], "predicted": res["status"],
                          "ok": gt["expected_status"] == res["status"]},
               "manual_review": {"expected": gt["requires_manual_clarification"],
                                 "predicted": res["needs_review"] or bool(flags),
                                 "ok": gt["requires_manual_clarification"] == (res["needs_review"] or bool(flags))},
               "backend_flags": {"expected": sorted(gt["expected_backend_flags"]), "predicted": sorted(flags),
                                 "ok": set(gt["expected_backend_flags"]) == flags},
               "issues": [i["code"] for i in res["issues"]],
               "fields": Counter(r["outcome"] for r in rows),
               "field_errors": [r for r in rows if r["outcome"] != "ok"]}
        if gt.get("transactions"):
            doc["transactions"] = eval_transactions(gt, res)
        docs.append(doc)
    total = Counter()
    for d in docs:
        total.update(d["fields"])
    return {"as_of": AS_OF.isoformat(), "split": split or "all", "documents": docs,
            "summary": {"documents": len(docs), "status_ok": sum(d["status"]["ok"] for d in docs),
                        "manual_review_ok": sum(d["manual_review"]["ok"] for d in docs),
                        "backend_flags_ok": sum(d["backend_flags"]["ok"] for d in docs),
                        "fields": dict(total),
                        "critical_to_revenue": sum(len(d.get("transactions", {}).get("critical_to_revenue", []))
                                                   for d in docs)}}


def markdown(report: dict) -> str:
    s = report["summary"]
    f = s["fields"]
    out = [f"# Чтение документов: отчёт об ошибках ({report['split']})", "",
           f"Документов: {s['documents']}; статус чтения верный: {s['status_ok']}; решение «нужна проверка» верное: "
           f"{s['manual_review_ok']}; флаги бэкенда верные: {s['backend_flags_ok']}.",
           f"Поля и позиции: верно {f.get('ok', 0)}, null вместо значения {f.get('missing', 0)}, "
           f"неверное значение {f.get('wrong', 0)}, значение вместо null {f.get('invented', 0)}.",
           f"Заём / свои / возврат, ошибочно попавшие в выручку: {s['critical_to_revenue']}.", "",
           "| Документ | Набор | Статус (эталон → факт) | Проверка | Флаги бэкенда | Поля ok/всего | Операции | Мес. | с |",
           "|---|---|---|---|---|---|---|---|---|"]
    for d in report["documents"]:
        tx = d.get("transactions")
        tx_cell = (f"{tx['matched']}/{tx['expected']}, кат. {tx['category'].get('correct', 0)}, "
                   f"ошиб. {tx['category'].get('wrong_confident', 0)}") if tx else "—"
        out.append(f"| {d['document_id']} | {d['split']} | {d['status']['expected']} → {d['status']['predicted']}"
                   f"{'' if d['status']['ok'] else ' ✗'} | {'✓' if d['manual_review']['ok'] else '✗'} | "
                   f"{', '.join(d['backend_flags']['predicted']) or '—'}{'' if d['backend_flags']['ok'] else ' ✗'} | "
                   f"{d['fields'].get('ok', 0)}/{sum(d['fields'].values())} | {tx_cell} | "
                   f"{(tx or {}).get('monthly_ok') or '—'} | {d['seconds']} |")
    out += ["", "## Ошибки по документам", ""]
    for d in report["documents"]:
        errs = d["field_errors"] + (d.get("transactions") or {}).get("errors", [])[:15]
        if not errs and d["status"]["ok"] and d["backend_flags"]["ok"]:
            continue
        out.append(f"### {d['document_id']} ({d['file']})")
        out.append(f"- проблемы, найденные сервисом: {', '.join(d['issues']) or 'нет'}")
        for e in d["field_errors"]:
            out.append(f"- `{e['field']}`: {e['outcome']} — эталон `{e['expected']}`, прочитано `{e['predicted']}`")
        tx = d.get("transactions") or {}
        for e in tx.get("errors", [])[:15]:
            out.append(f"- операция {e['row']}: {e['error']} — эталон `{e.get('expected')}`, "
                       f"получено `{e.get('predicted')}`")
        if len(tx.get("errors", [])) > 15:
            out.append(f"- … ещё {len(tx['errors']) - 15} ошибок операций (полный список в JSON)")
        out.append("")
    return "\n".join(out)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--package", default=str(ROOT / "data" / "documents"))
    ap.add_argument("--split", default=None)
    ap.add_argument("--out", default=str(ROOT / "eval" / "documents_report.json"))
    args = ap.parse_args()
    report = evaluate(Path(args.package), args.split)
    Path(args.out).write_text(json.dumps(report, ensure_ascii=False, indent=1, default=str), encoding="utf-8")
    Path(args.out).with_suffix(".md").write_text(markdown(report), encoding="utf-8")
    print(json.dumps(report["summary"], ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
