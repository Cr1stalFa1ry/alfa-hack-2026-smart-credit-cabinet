"""Выписка в PDF/скане/фото: шапка (владелец, ИНН, период, обороты, остатки) и таблица операций.

Колонки берём из строки заголовка таблицы («Дата», «Сумма» или «Приход/Расход», «Контрагент», «Назначение»),
поэтому порядок колонок может быть любым. Операция начинается со строки с датой; перенос назначения
приклеивается к предыдущей операции. Обороты из шапки сверяются с суммой операций, номера строк — с их
количеством: расхождение = потерянные строки или ошибка OCR, такую выписку смотрит сотрудник.
"""

import re
from datetime import date, timedelta

from .fields import NOT_FOUND, cells, columns, find_inn, found, iso_date, issue, money
from .pages import Line, Page

COLUMNS = [("index", r"^(№|n|#)$"), ("date", r"^дата"), ("credit", r"^(приход|поступлени|кредит)"),
           ("debit", r"^(расход|списани|дебет)"), ("amount", r"^сумма"),
           ("counterparty", r"^(контрагент|корреспондент|плательщик|получатель)"),
           ("description", r"^(назначение|описание|основание|содержание)")]
TEXT = {"counterparty", "description"}
HOLDER_RE = re.compile(r"(?:владелец|клиент|организация)\w*\s*(?:сч[её]та)?\s*:?\s*"
                       r"((?:ООО|ОАО|ЗАО|ПАО|АО|ИП|Индивидуальный\s+предприниматель)\s+[^|,;]+?)\s*(?:$|[|,;])", re.I)
PERIOD_RE = re.compile(r"период\w*\s*:?\s*(?:с\s+)?(\d{2}\.\d{2}\.\d{4})\s*(?:-|—|–|по)\s*(\d{2}\.\d{2}\.\d{4})", re.I)
ACCOUNT_RE = re.compile(r"(?:сч[её]т|р/с)\D{0,15}(\d{20})(?!\d)", re.I)
TOTALS = {"credit_total_rub": r"поступлени\w*|приход\w*|обороты?\s+по\s+кредиту|кредитов\w*\s+оборот\w*",
          "debit_total_rub": r"списани\w*|расход\w*|обороты?\s+по\s+дебету|дебетов\w*\s+оборот\w*",
          "opening_balance_rub": r"(?:начальн|входящ)\w*\s+(?:остаток|сальдо)",
          "closing_balance_rub": r"(?:конечн|исходящ)\w*\s+(?:остаток|сальдо)"}
TOTAL_RES = {k: re.compile(rf"(?:{rx})\*?\s*:?\s*(?=[+\-−–]?\d)", re.I) for k, rx in TOTALS.items()}
PERIOD_SLACK = timedelta(days=45)  # операций нет дольше полутора месяцев от края периода — страницы потеряны?


def _is_header(cols) -> bool:
    kinds = {c.kind for c in cols}
    return "date" in kinds and bool(kinds & {"amount", "credit", "debit"}) and bool(kinds & TEXT)


def _amount(c: dict[str, str], kinds: set[str]) -> tuple[float | None, bool, str]:
    """(сумма со знаком, знак известен, фрагмент). Знак — из «+/−» в «Сумме» или из колонки «Приход/Расход»."""
    if kinds & {"credit", "debit"}:
        cr, db = money(c.get("credit")), money(c.get("debit"))
        if bool(cr) != bool(db):
            return (cr[0], True, cr[2]) if cr else (-db[0], True, db[2])
        return None, False, ""
    m = money(c.get("amount"))
    if not m:
        return None, False, ""
    return (-m[0] if m[1] == "-" else m[0]), m[1] != "", m[2]


def _rows(pages: list[Page]) -> tuple[list[dict], list[Line]]:
    rows, other, cols = [], [], None
    for page in pages:
        prev = None
        for line in page.lines:
            head = columns(line, COLUMNS)
            if _is_header(head):
                cols, prev = head, None
                continue
            if cols is None:
                other.append(line)
                continue
            c = cells(line, cols)
            day = iso_date(c.get("date"))
            amount, signed, raw = _amount(c, {col.kind for col in cols})
            if day and (amount is not None):
                index = re.match(r"\d+", c.get("index", ""))  # «55 —» со скана → 55
                prev = {"row": int(index.group()) if index else None, "date": day, "amount": amount,
                        "signed": signed, "counterparty": c.get("counterparty", "").strip(" -—"),
                        "description": c.get("description", ""), "lines": [line],
                        "confidence": line.conf_of(f"{c.get('date')} {raw}")}  # уверенность даты и суммы
                rows.append(prev)
            elif prev and set(c) <= TEXT and line.top - prev["lines"][-1].bottom < line.height:
                for k in TEXT & set(c):
                    prev[k] = (prev[k] + " " + c[k]).strip()
                prev["lines"].append(line)
            else:
                prev = None
                other.append(line)
    return rows, other


def _header_fields(lines: list[Line]) -> dict:
    def first(rx, group=1, convert=lambda v: v):
        return next((found(convert(m.group(group)), line, m.group(group)) for line in lines
                     if (m := rx.search(line.text))), NOT_FOUND)

    def total(rx):
        return next((found(m[0], line, m[2]) for line in lines
                     if (t := rx.search(line.text)) and (m := money(line.text[t.end():]))), NOT_FOUND)

    return {"account_holder_name": first(HOLDER_RE), "account_holder_inn": find_inn(lines) or NOT_FOUND,
            "period_from": first(PERIOD_RE, 1, iso_date), "period_to": first(PERIOD_RE, 2, iso_date),
            "account_number": first(ACCOUNT_RE), **{k: total(rx) for k, rx in TOTAL_RES.items()}}


def _checks(rows: list[dict], fields: dict) -> list[dict]:
    issues = []
    unsigned = [r for r in rows if not r["signed"]]
    if unsigned:
        issues.append(issue("AMOUNT_SIGN_UNKNOWN", f"У {len(unsigned)} операций не прочитан знак суммы.",
                            page=unsigned[0]["page"]))
    known = [r for r in rows if r["signed"]]
    credit = round(sum(r["amount"] for r in known if r["amount"] > 0), 2)
    debit = round(-sum(r["amount"] for r in known if r["amount"] < 0), 2)
    for key, value in (("credit_total_rub", credit), ("debit_total_rub", debit)):
        printed = fields[key]["value"]
        if printed is not None and abs(printed - value) > 0.005:
            issues.append(issue("TOTALS_MISMATCH", f"Оборот в шапке {printed:.2f}, сумма операций {value:.2f}.",
                                field=key))
    opening, closing = fields["opening_balance_rub"]["value"], fields["closing_balance_rub"]["value"]
    if opening is not None and closing is not None and abs(opening + credit - debit - closing) > 0.005:
        issues.append(issue("BALANCE_MISMATCH", "Начальный остаток + поступления − списания ≠ конечный остаток."))
    numbered = [(i, r) for i, r in enumerate(rows) if r["row"] is not None]
    for (i, a), (j, b) in zip(numbered, numbered[1:]):
        if b["row"] - a["row"] != j - i:
            issues.append(issue("ROW_NUMBER_GAP", f"После операции № {a['row']} идёт № {b['row']}.", page=b["page"]))
    dates = [date.fromisoformat(r["date"]) for r in rows]
    start, end = fields["period_from"]["value"], fields["period_to"]["value"]
    if dates and start and end and (min(dates) - date.fromisoformat(start) > PERIOD_SLACK
                                    or date.fromisoformat(end) - max(dates) > PERIOD_SLACK):
        issues.append(issue("PERIOD_NOT_COVERED", f"Операции за {min(dates)}…{max(dates)}, а период выписки "
                                                  f"{start}…{end}: возможно, часть страниц отсутствует."))
    return issues


def extract_statement(pages: list[Page]) -> dict:
    """→ {fields, rows, issues}. rows: row, date, amount (None, если знак не прочитан), counterparty, description,
    page, quote, bbox, confidence."""
    rows, other = _rows(pages)
    for r in rows:
        lines = r.pop("lines")
        r.update(page=lines[0].page, quote=" ".join(l.text for l in lines),
                 bbox=[min(l.x0 for l in lines), lines[0].top, max(l.x1 for l in lines), lines[-1].bottom])
        r["bbox"] = [round(v, 1) for v in r["bbox"]]
    fields = _header_fields(other)
    issues = _checks(rows, fields) if rows else [issue("TABLE_NOT_FOUND", "Не найдена таблица операций.")]
    for r in rows:
        if not r.pop("signed"):
            r["amount"] = None
    return {"fields": fields, "rows": rows, "issues": issues}
