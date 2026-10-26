"""Чтение документа анкеты (счёт, КП, выписка; PDF, скан, фото, CSV/XLSX) → JSON для бэкенда.

status:
  EXTRACTED    — документ прочитан полностью (needs_review может быть true из-за отдельных операций);
  PARTIAL      — не хватает страниц: итоги и показатели за период не считаем;
  NEEDS_REVIEW — плохое качество, конфликт значений, нет критического поля, не сошлись обороты;
  FAILED       — файл не прочитан.
Кредитное решение здесь не принимается, с заявкой и реестрами данные не сравниваются — это делает бэкенд.

  python -m app.documents файл.pdf [--as-of 2026-10-24] [--out результат.json]
"""

import argparse
import hashlib
import json
import re
from datetime import date
from statistics import fmean

import pandas as pd

from . import PIPELINE_VERSION
from .analyzer import EVIDENCE_COLUMNS, analyze_transactions, manual_input
from .fields import MIN_CONF, PAGE_OF_RE, issue
from .invoice import extract_invoice
from .llm import OllamaClient
from .pages import LOW_DPI, Page, is_document, load_pages
from .parser import StatementError, read_statement
from .statement_pdf import extract_statement

SCHEMA_VERSION = "documents-1"
TYPES = [("BANK_STATEMENT", r"выписк"), ("COMMERCIAL_OFFER", r"коммерческ\w*\s+предложени"),
         ("INVOICE", r"сч[её]т(?:[\s-]+оферт|\s+на\s+оплату|\s*№)")]
TITLE_LINES = 6
PARTIAL_CODES = {"MISSING_PAGE"}
ROW_CODES = {"TRANSACTIONS_NEED_REVIEW"}  # меняют только needs_review, не статус чтения


def _doc_type(pages: list[Page]) -> str:
    head = " ".join(line.text for line in pages[0].lines[:TITLE_LINES]) if pages else ""
    return next((t for t, rx in TYPES if re.search(rx, head, re.I)), "UNKNOWN")


def _page_issues(pages: list[Page]) -> tuple[list[dict], int | None, set[int]]:
    """Нехватка страниц («Страница 1 из 6»), низкое разрешение, нет OCR. → (issues, заявлено страниц, плохие)."""
    issues, bad = [], set()
    marks = {int(m.group(1)): int(m.group(2)) for p in pages for line in p.lines if (m := PAGE_OF_RE.search(line.text))}
    declared = max(marks.values(), default=None)
    if declared and (missing := sorted(set(range(1, declared + 1)) - set(marks))) and declared > len(pages):
        issues.append(issue("MISSING_PAGE", f"Передано {len(pages)} стр. из {declared}: нет стр. "
                                            f"{', '.join(map(str, missing))}.", pages=missing))
    for p in pages:
        if p.source == "ocr_unavailable":
            issues.append(issue("OCR_UNAVAILABLE", "Страница без текстового слоя, а OCR недоступен.", page=p.number))
        elif p.dpi is not None and p.dpi < LOW_DPI:
            issues.append(issue("LOW_RESOLUTION", f"Разрешение {p.dpi:.0f} dpi: значения не принимаются без "
                                                  "сотрудника.", page=p.number))
        elif not p.lines:
            issues.append(issue("EMPTY_PAGE", "На странице не найден текст.", page=p.number))
        else:
            continue
        bad.add(p.number)
    return issues, declared, bad


def _page_info(p: Page) -> dict:
    confs = [w.conf for line in p.lines for w in line.words if w.conf is not None]
    return {"page": p.number, "text_source": p.source, "dpi": p.dpi,
            "ocr_confidence": round(fmean(confs), 3) if confs else None}


def _mask(fields: dict, items: list[dict], bad: set[int]) -> None:
    """Значения со страниц плохого качества не выдаём за факт: остаётся цитата для сотрудника."""
    for f in fields.values():
        if f["page"] in bad and f["value"] is not None:
            f.update(value=None, status="unclear")
    for it in items:
        if it["page"] in bad or (it["confidence"] is not None and it["confidence"] < MIN_CONF):
            it.update(quantity=None, unit_price_rub=None, amount_rub=None)


def _skeleton(raw: bytes, filename: str) -> dict:
    return {"schema_version": SCHEMA_VERSION, "pipeline_version": PIPELINE_VERSION,
            "file": {"sha256": hashlib.sha256(raw).hexdigest() if raw else None, "bytes": len(raw), "name": filename,
                     "format": None, "pages": None, "pages_declared": None},
            "document_type": "UNKNOWN", "status": "FAILED", "needs_review": True, "fields": {}, "issues": [],
            "pages": []}


def failed(code: str, message: str, raw: bytes = b"", filename: str = "") -> dict:
    return {**_skeleton(raw, filename), "issues": [issue(code, message)]}


def _frame(rows: list[dict]) -> pd.DataFrame:
    """Операции из PDF → таблица для анализа. Сумма без прочитанного знака в расчёт не идёт."""
    rows = [r for r in rows if r["amount"] is not None]
    df = pd.DataFrame({k: pd.Series([r[k] for r in rows], dtype=None if k == "amount" else object)
                       for k in ("date", "amount", "counterparty", "description", *EVIDENCE_COLUMNS)})
    df["date"] = [date.fromisoformat(d) for d in df["date"]]
    return df


def _statement(df: pd.DataFrame, warnings: list[str], fields: dict, as_of, llm, owner_name) -> tuple[dict, list]:
    holder = (fields.get("account_holder_name") or {}).get("value")
    if df.empty:
        return manual_input("EMPTY_FILE", "В документе не найдено операций."), []
    analysis = analyze_transactions(df, warnings, as_of, llm, True, owner_name or holder)
    return analysis, analysis.pop("transactions")


def read_document(raw: bytes, filename: str = "", as_of: date | None = None, llm: OllamaClient | None = None,
                  owner_name: str | None = None) -> dict:
    out = _skeleton(raw, filename)
    pages, issues, bad, fields, df, warnings = [], [], set(), {}, None, []
    try:
        if is_document(raw):
            pages = load_pages(raw)
            out["file"].update(format="pdf" if raw[:5] == b"%PDF-" else "image", pages=len(pages))
            issues, out["file"]["pages_declared"], bad = _page_issues(pages)
            out["document_type"] = _doc_type(pages)
        else:  # CSV/XLSX бывает только выпиской
            out["file"]["format"], out["document_type"] = "table", "BANK_STATEMENT"
            df, warnings = read_statement(raw, filename)
    except StatementError as e:
        return {**out, "issues": [issue(e.code, e.message)]}

    if out["document_type"] in ("INVOICE", "COMMERCIAL_OFFER"):
        extracted = extract_invoice(pages)
        out["line_items"], fields, issues = extracted["line_items"], extracted["fields"], issues + extracted["issues"]
    elif pages:
        st = extract_statement(pages)
        if out["document_type"] == "BANK_STATEMENT" or st["rows"]:  # «список операций» без слова «выписка»
            out["document_type"], df, fields, issues = "BANK_STATEMENT", _frame(st["rows"]), st["fields"], \
                issues + st["issues"]
        else:
            issues.append(issue("UNKNOWN_DOCUMENT_TYPE", "Не похоже ни на счёт/КП, ни на выписку."))
    out["fields"] = fields

    if out["document_type"] == "BANK_STATEMENT":
        analysis, out["transactions"] = _statement(df, warnings, fields, as_of, llm, owner_name)
        for t in out["transactions"]:
            t["needs_review"] = t["needs_review"] or t.get("page") in bad or \
                (t.get("confidence") is not None and t["confidence"] < MIN_CONF)
        if n := sum(t["needs_review"] for t in out["transactions"]):
            issues.append(issue("TRANSACTIONS_NEED_REVIEW", f"{n} операций нужно проверить сотруднику: "
                                                            "неоднозначное назначение или неуверенное чтение."))
    _mask(fields, out.get("line_items", []), bad)

    codes = {i["code"] for i in issues}
    out["status"] = "PARTIAL" if codes & PARTIAL_CODES else "NEEDS_REVIEW" if codes - ROW_CODES else "EXTRACTED"
    out["needs_review"], out["issues"] = bool(issues), issues
    if out["document_type"] == "BANK_STATEMENT":
        blocking = next((i for i in issues if i["code"] not in ROW_CODES), None)
        # Показатели за период — только по полностью и уверенно прочитанной выписке.
        out["analysis"] = manual_input(blocking["code"], blocking["message"]) if blocking else analysis
    out["pages"] = [_page_info(p) for p in pages]
    return out


def statement_view(doc: dict, include_transactions: bool = False) -> dict:
    """Ответ /v1/statement/analyze (старый формат) для выписки, пришедшей PDF, сканом или фото."""
    if doc.get("analysis") is None:
        first = doc["issues"][0] if doc["document_type"] == "UNKNOWN" and doc["issues"] else \
            issue("NOT_A_STATEMENT", "Это не выписка по счёту.")
        return manual_input(first["code"], first["message"])
    res = dict(doc["analysis"])
    if include_transactions:
        res["transactions"] = doc.get("transactions", [])
    return res


def main() -> None:
    ap = argparse.ArgumentParser(description="Прочитать документ и напечатать JSON ответа.")
    ap.add_argument("file")
    ap.add_argument("--as-of", type=date.fromisoformat, default=None)
    ap.add_argument("--owner-name", default=None)
    ap.add_argument("--out", default=None)
    args = ap.parse_args()
    with open(args.file, "rb") as f:
        res = read_document(f.read(), args.file, as_of=args.as_of, owner_name=args.owner_name)
    text = json.dumps(res, ensure_ascii=False, indent=1)
    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(text)
    else:
        print(text)


if __name__ == "__main__":
    main()
