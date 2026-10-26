"""Общее для счетов и выписок: поле со ссылкой на источник, суммы, даты, ИНН, колонки таблиц.

Поле: {value, status: ok|not_found|unclear, page, quote, bbox, confidence}. Не нашли — value=None, а не 0.
Значение OCR с низкой уверенностью не выдаём за факт: value=None, status=unclear, quote остаётся для сотрудника.
"""

import re
from collections import Counter
from dataclasses import dataclass
from datetime import date

from .pages import Line, reread

MIN_CONF = 0.6
# Сумма: «3 431 000,00», «1.984.000,00», «+140 334,37», «-183,32», «126 747 ,84» (пробел от OCR).
# Дата «06.10.2025» и «3431 000.00» (OCR потерял разделитель разряда) не подходят.
MONEY_RE = re.compile(r"([+\-−–]?)\s?(?<![\d.,])(\d{1,3}(?:[  .]\d{3})+|\d+)\s?[,.](\d{2})(?![\d.,])")
DATE_RE = re.compile(r"(?<!\d)(\d{2})\.(\d{2})\.(\d{4})(?!\d)")
INN_RE = re.compile(r"ИНН\D{0,25}?(\d(?:[  ]?\d){8,12})(?!\d)", re.I)
INN_LABEL_RE = re.compile(r"^ИНН\b\D*$", re.I)
DIGITS_RE = re.compile(r"\d(?:[  ]?\d){8,12}")
PAGE_OF_RE = re.compile(r"(?:страница|стр\.?|лист)\s*(\d{1,3})\s*(?:из|/)\s*(\d{1,3})", re.I)

NOT_FOUND = {"value": None, "status": "not_found", "page": None, "quote": None, "bbox": None, "confidence": None}


def issue(code: str, message: str, **context) -> dict:
    """Причина отправить документ сотруднику: code для бэкенда, message для человека, page/field — где смотреть."""
    return {"code": code, "message": message, **context}


def found(value, line: Line, raw: str = "") -> dict:
    """raw — фрагмент строки со значением: по его словам считается уверенность OCR."""
    conf = line.conf_of(raw)
    ok = value is not None and (conf is None or conf >= MIN_CONF)
    return {"value": value if ok else None, "status": "ok" if ok else "unclear", "page": line.page,
            "quote": line.text, "bbox": line.bbox, "confidence": conf}


def money(text: str | None) -> tuple[float, str, str] | None:
    """Первая сумма в тексте → (абсолютное значение, знак '+' | '-' | '', исходный фрагмент)."""
    m = MONEY_RE.search(text or "")
    if not m:
        return None
    value = float(re.sub(r"\D", "", m.group(2)) + "." + m.group(3))
    return value, ("-" if m.group(1) in ("-", "−", "–") else m.group(1)), m.group(0)


def iso_date(text: str | None) -> str | None:
    m = DATE_RE.search(text or "")
    if not m:
        return None
    try:
        return date(int(m.group(3)), int(m.group(2)), int(m.group(1))).isoformat()
    except ValueError:
        return None


def inn_valid(inn: str) -> bool:
    """Контрольное число ИНН (10 цифр — организация, 12 — ИП и физлицо)."""
    if not inn.isdigit() or len(inn) not in (10, 12):
        return False
    n = list(map(int, inn))
    check = lambda w: sum(a * b for a, b in zip(w, n)) % 11 % 10  # noqa: E731
    if len(n) == 10:
        return check([2, 4, 10, 3, 5, 9, 4, 6, 8]) == n[9]
    return check([7, 2, 4, 10, 3, 5, 9, 4, 6, 8]) == n[10] and check([3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8]) == n[11]


def inn_field(raw: str, line: Line) -> dict:
    digits = re.sub(r"\D", "", raw)
    if inn_valid(digits):
        return found(digits, line, raw)
    # Скан: перечитываем фрагмент в других масштабах. Принимаем ИНН, только если два перечитывания совпали
    # и контрольное число верно; уверенность OCR тут не показатель (с белым списком символов она 0), поэтому None.
    # Перечитываем только слова с цифрами ИНН: соседний текст строки с белым списком цифр дал бы мусор.
    words = [w for w in line.words if (d := re.sub(r"\D", "", w.text)) and d in digits]
    target = Line(line.page, words, line.image) if words else line
    votes = Counter(d for again in reread(target, "0123456789")
                    if (m := DIGITS_RE.search(again.text)) and inn_valid(d := re.sub(r"\D", "", m.group(0))))
    value, n = votes.most_common(1)[0] if votes else (None, 0)
    if n >= 2:
        return {**found(None, line), "value": value, "status": "ok", "confidence": None,
                "note": f"Первое чтение «{raw}» не прошло проверку ИНН; перечитано {n} раза, контрольное число верно."}
    return {**found(None, line), "note": f"Прочитано «{raw}»: не ИНН (длина или контрольное число)."}


def find_inn(lines: list[Line]) -> dict | None:
    """ИНН в «ИНН 7701…» или в строке под подписью «ИНН покупателя»."""
    for i, line in enumerate(lines):
        if m := INN_RE.search(line.text):
            return inn_field(m.group(1), line)
        if INN_LABEL_RE.match(line.text) and i + 1 < len(lines) and DIGITS_RE.fullmatch(lines[i + 1].text):
            return inn_field(lines[i + 1].text, lines[i + 1])
    return None


@dataclass
class Column:
    kind: str
    x0: float
    text: str


def columns(header: Line, kinds: list[tuple[str, str]]) -> list[Column]:
    """Колонки по строке заголовка: новое слово-ключ или широкий пробел начинает колонку."""
    cols: list[Column] = []
    prev = None
    for w in header.words:
        kind = next((k for k, rx in kinds if re.match(rx, w.text, re.I)), None)
        if kind or not cols or w.x0 - prev.x1 > 1.2 * header.height:
            cols.append(Column(kind or "", w.x0, w.text))
        else:
            cols[-1].text += " " + w.text
        prev = w
    return cols


def cells(line: Line, cols: list[Column]) -> dict[str, str]:
    """Слова строки по колонкам: колонка — последняя, чей левый край не правее слова (таблицы выровнены влево).
    Слова левее первой колонки попадают в ключ ''."""
    tol = 0.6 * line.height
    out: dict[str, str] = {}
    for w in line.words:
        col = next((c for c in reversed(cols) if c.x0 <= w.x0 + tol), None)
        key = col.kind if col else ""
        out[key] = (out.get(key, "") + " " + w.text).strip()
    return out
