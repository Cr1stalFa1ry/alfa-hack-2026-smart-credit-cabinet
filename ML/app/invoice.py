"""Счёт на оплату / коммерческое предложение → номер, дата, поставщик и покупатель с ИНН, позиции, итог.

Бланки у поставщиков разные, поэтому опираемся на подписи («Поставщик», «ИНН покупателя», «Итого к оплате»)
и колонки таблицы, а не на координаты конкретного шаблона. Позиции с разных страниц склеиваются по названию
(состав на стр. 1, цены на стр. 2). Итог — общий («к оплате», «итоговая стоимость»), подытоги и НДС не берём;
доставку и работы заново не прибавляем: берём напечатанный итог и сверяем его с суммой позиций.
"""

import re

from .fields import NOT_FOUND, cells, columns, find_inn, found, iso_date, issue, money
from .pages import Line, Page

ROLES = {"supplier": r"поставщик|продав[её]ц|исполнител|подрядчик", "buyer": r"покупател|заказчик|плательщик"}
ROLE_RE = {role: re.compile(rf"^(?:инн\s+)?(?:{rx})", re.I) for role, rx in ROLES.items()}
ROLE_WORD_RE = {role: re.compile(rf"\b(?:{rx})", re.I) for role, rx in ROLES.items()}
ORG_RE = re.compile(r"(?:ООО|ОАО|ЗАО|ПАО|НАО|АО|ИП|Индивидуальный\s+предприниматель)\s+[^|,;]+?(?=\s*(?:$|[|,;]|ИНН))")
BLOCK_LINES = 8  # подпись стороны и её реквизиты — не дальше 8 строк вниз
NUMBER_RES = [
    re.compile(r"№\s*([\w\-/]*\d[\w\-/]*)\s+от\s+\d{2}\.\d{2}\.\d{4}"),
    re.compile(r"^([A-ZА-ЯЁ]{1,5}-[\w\-/]+)\s+от\s+\d{2}\.\d{2}\.\d{4}"),
    re.compile(r"(?:сч[её]т(?:\s+на\s+оплату)?|предложени[ея])\s+№?\s*([\w\-/]*\d[\w\-/]*)", re.I),
]
DATE_LABEL_RE = re.compile(r"(?:\bот|\bдата)\s*:?\s*\d{2}\.\d{2}\.\d{4}", re.I)
TOTAL_RE = re.compile(r"итог|всего|к\s+оплате", re.I)
MAIN_TOTAL_RE = re.compile(r"к\s+оплате|итогов\w*\s+(?:стоимост|сумм)|общ\w*\s+(?:стоимост|сумм)", re.I)
SUBTOTAL_RE = re.compile(r"подытог|промежуточ|итого\s+по\s|^\s*(?:в\s+т\.?\s?ч|в\s+том\s+числе|ндс)", re.I)
ITEM_COLUMNS = [("index", r"^№$"), ("description", r"^(наименование|товар|позиция|описание|оборудование)"),
                ("quantity", r"^(кол|количество)"), ("unit_price", r"^цена"), ("amount", r"^(сумма|стоимость|итого)")]
QTY_RE = re.compile(r"(\d+(?:[.,]\d+)?)\s*((?:шт|усл|ед|компл|кг|м|л|час|мес)\b\.?)", re.I)
ITEM_LABEL_RE = re.compile(r"^(?:оборудование|наименование|предмет)\b", re.I)
PRICE_LABEL_RE = re.compile(r"^(?:стоимость\s+за\s+ед\w*\.?|цена\w*)", re.I)
CRITICAL = ("supplier_inn", "buyer_inn", "total_amount_rub")


def _role(text: str) -> str | None:
    """Подпись стороны: «Поставщик: ООО…», «ИНН покупателя» или короткая подпись без цифр с одной ролью
    («Получатель предложения / Покупатель»)."""
    if role := next((r for r, rx in ROLE_RE.items() if rx.match(text)), None):
        return role
    roles = [r for r, rx in ROLE_WORD_RE.items() if rx.search(text)]
    return roles[0] if len(roles) == 1 and not re.search(r"\d", text) and len(text.split()) <= 6 else None


def _block(segs: list[Line], i: int) -> list[Line]:
    """Подпись стороны + ячейки правее на той же строке и под ней в той же колонке, до подписи другой стороны."""
    label, role = segs[i], _role(segs[i].text)
    h, out, right_open, below = label.height, [label], True, 0
    for s in segs[i + 1:]:
        other = _role(s.text)
        if abs(s.top - label.top) < h / 2:
            right_open = right_open and not (other and other != role)
            if right_open and not other:
                out.append(s)
        elif s.x0 < label.x1 + h and s.x1 > label.x0 - h:
            if (other and other != role) or below >= BLOCK_LINES:
                break
            out.append(s)
            below += 1
    return out


def _parties(pages: list[Page]) -> tuple[dict, list]:
    cands: dict[str, list[dict]] = {f"{r}_{k}": [] for r in ROLES for k in ("name", "inn")}
    for page in pages:
        segs = [s for line in page.lines for s in line.segments()]
        for i, seg in enumerate(segs):
            if not (role := _role(seg.text)):
                continue
            block = _block(segs, i)
            name = next(((m, s) for s in block if (m := ORG_RE.search(s.text))), None)
            if name:
                cands[f"{role}_name"].append(found(name[0].group(0).strip(), name[1], name[0].group(0)))
            if inn := find_inn(block):
                cands[f"{role}_inn"].append(inn)
    fields, issues = {}, []
    for key, items in cands.items():
        values = list(dict.fromkeys(c["value"] for c in items if c["value"]))
        if len(values) > 1:
            # Какое значение верное, решает сотрудник, а не мы.
            fields[key] = {**items[0], "value": None, "status": "unclear",
                           "note": "разные значения: " + "; ".join(values)}
            issues.append(issue("FIELD_CONFLICT", f"В документе разные значения поля: {', '.join(values)}.", field=key))
        else:
            fields[key] = next((c for c in items if c["value"]), items[0] if items else NOT_FOUND)
    return fields, issues


def _number_and_date(lines: list[Line]) -> tuple[dict, dict]:
    number = next((found(m.group(1), line, m.group(1))
                   for rx in NUMBER_RES for line in lines if (m := rx.search(line.text))), NOT_FOUND)
    day = next((found(iso_date(m.group(0)), line, m.group(0))
                for line in lines if (m := DATE_LABEL_RE.search(line.text))), NOT_FOUND)
    if number["confidence"] is not None:  # OCR (rus) не отличает латиницу: S↔5, M↔М, O↔0
        number = {**number, "note": "Номер прочитан OCR: похожие символы (S/5, M/М, O/0) могли перепутаться."}
    return number, day


def _qty(text: str) -> tuple[float | int | None, str | None, str]:
    """«1 шт.» → (1, 'шт.', '1 шт.')."""
    if not (m := QTY_RE.search(text or "")):
        return None, None, ""
    q = float(m.group(1).replace(",", "."))
    return (int(q) if q.is_integer() else q), m.group(2), m.group(0)


def _item(line: Line, description: str | None, qty_text: str, amount_text: str | None, price_text: str | None):
    qty, unit, qty_raw = _qty(qty_text)
    amount, price = money(amount_text), money(price_text)
    raw = " ".join([qty_raw] + [m[2] for m in (amount, price) if m])  # уверенность — по количеству и суммам
    return {"description": description or None, "quantity": qty, "unit": unit,
            "unit_price_rub": price[0] if price else None, "amount_rub": amount[0] if amount else None,
            "page": line.page, "quote": line.text, "bbox": line.bbox, "confidence": line.conf_of(raw)}


def _table_items(page: Page) -> list[dict]:
    """Строки таблицы под заголовком «Наименование … Кол-во / Цена / Сумма» до строки итога."""
    for i, header in enumerate(page.lines):
        cols = columns(header, ITEM_COLUMNS)
        kinds = {c.kind for c in cols}
        if "description" in kinds and kinds & {"quantity", "unit_price", "amount"}:
            break
    else:
        return []
    items: list[dict] = []
    for line in page.lines[i + 1:]:
        if TOTAL_RE.search(line.text):
            break
        c = cells(line, cols)
        desc = c.get("description", "")
        if not (QTY_RE.search(c.get("quantity", "")) or money(c.get("amount")) or money(c.get("unit_price"))):
            if items and desc and not c.get(""):  # перенос длинного названия на вторую строку
                items[-1]["description"] += " " + desc
                continue
            break
        items.append(_item(line, desc, c.get("quantity", ""), c.get("amount"), c.get("unit_price")))
    return items


def _after_label(lines: list[Line], rx: re.Pattern, need=bool) -> Line | None:
    """Значение подписи: в той же строке после неё или в следующей строке."""
    for i, line in enumerate(lines):
        if m := rx.match(line.text):
            if need(line.text[m.end():].strip(" :")):
                return line
            if i + 1 < len(lines) and need(lines[i + 1].text):
                return lines[i + 1]
    return None


def _label_item(lines: list[Line]) -> list[dict]:
    """Бланк без таблицы: «Оборудование» / «Количество 1 шт.» / «Стоимость за единицу» — одна позиция."""
    desc = _after_label(lines, ITEM_LABEL_RE)
    if desc is None:
        return []
    price = _after_label(lines, PRICE_LABEL_RE, need=lambda t: money(t) is not None)
    qty = next((line.text for line in lines if re.search(r"количеств", line.text, re.I) and QTY_RE.search(line.text)),
               "")
    return [_item(price or desc, ITEM_LABEL_RE.sub("", desc.text).strip(" :"), qty, None,
                  price.text if price else None)]


def _norm(text: str | None) -> str:
    return re.sub(r"\W+", " ", (text or "").lower().replace("ё", "е")).strip()


def _merge(items: list[dict]) -> list[dict]:
    """Одна позиция на разных страницах (состав — на 1-й, цены — на 2-й) → одна запись со страницей цены."""
    merged: dict[str, dict] = {}
    for it in items:
        key = _norm(it["description"]) or f"#{len(merged)}"
        if key not in merged:
            merged[key] = dict(it)
            continue
        base = merged[key]
        base["quantity"], base["unit"] = base["quantity"] or it["quantity"], base["unit"] or it["unit"]
        if it["amount_rub"] is not None or it["unit_price_rub"] is not None:
            base.update({k: it[k] for k in ("unit_price_rub", "amount_rub", "page", "quote", "bbox", "confidence")})
    for it in merged.values():  # при количестве 1 цена и стоимость совпадают — это не догадка
        if it["quantity"] == 1:
            known = it["unit_price_rub"] if it["unit_price_rub"] is not None else it["amount_rub"]
            for k in ("unit_price_rub", "amount_rub"):
                it[k] = known if it[k] is None else it[k]
    return list(merged.values())


def _total(pages: list[Page]) -> tuple[dict, list]:
    cands = [(bool(MAIN_TOTAL_RE.search(line.text)), m[0], line, m[2]) for page in pages for line in page.lines
             if TOTAL_RE.search(line.text) and not SUBTOTAL_RE.search(line.text) and (m := money(line.text))]
    if not cands:
        return NOT_FOUND, []
    best = [c for c in cands if c[0] == max(c[0] for c in cands)]
    values = sorted({c[1] for c in best})
    if len(values) > 1:
        return ({**found(None, best[-1][2]), "note": f"несколько итогов: {values}"},
                [issue("FIELD_CONFLICT", f"В документе несколько разных итогов: {values}.", field="total_amount_rub")])
    return found(best[-1][1], best[-1][2], best[-1][3]), []


def extract_invoice(pages: list[Page]) -> dict:
    first = pages[0].lines if pages else []
    number, day = _number_and_date(first)
    parties, issues = _parties(pages)
    total, total_issues = _total(pages)
    items = _merge([it for p in pages for it in _table_items(p)]
                   or _label_item([line for p in pages for line in p.lines]))
    fields = {"document_number": number, "document_date": day, **{k: parties[k] for k in
              ("supplier_name", "supplier_inn", "buyer_name", "buyer_inn")}, "total_amount_rub": total}
    issues += total_issues
    for key in CRITICAL:
        if (status := fields[key]["status"]) != "ok" and not any(i.get("field") == key for i in issues):
            code, what = (("FIELD_NOT_FOUND", "не найдено") if status == "not_found"
                          else ("FIELD_UNCLEAR", "прочитано неуверенно"))
            issues.append(issue(code, f"Поле {key}: {what}.", field=key))
    amounts = [it["amount_rub"] for it in items]
    if items and None in amounts:
        issues.append(issue("ITEM_PRICES_MISSING", "У части позиций нет цены или стоимости."))
    elif items and total["value"] is not None and abs(sum(amounts) - total["value"]) > 0.01:
        issues.append(issue("ITEMS_TOTAL_MISMATCH",
                            f"Сумма позиций {sum(amounts):.2f} не равна итогу {total['value']:.2f}.",
                            field="total_amount_rub"))
    return {"fields": fields, "line_items": items, "issues": issues}
