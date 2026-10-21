"""Чтение выписки из CSV/XLSX в единый вид: date, amount, counterparty, description.

Не падает на плохих файлах: бросает StatementError с кодом причины,
который сервис превращает в ответ «нужен ручной ввод».
"""

import csv
import io
import re
from datetime import date, datetime

import pandas as pd

# Варианты названий колонок (после lower/strip). Основной формат — date, amount, counterparty, description.
COLUMN_ALIASES = {
    "date": ["date", "дата", "дата операции", "дата проводки", "дата платежа", "operation_date"],
    "amount": ["amount", "сумма", "сумма операции", "сумма в валюте счета", "sum"],
    "counterparty": ["counterparty", "контрагент", "плательщик/получатель", "корреспондент",
                     "наименование контрагента", "payee", "payer"],
    "description": ["description", "назначение платежа", "назначение", "описание", "комментарий",
                    "purpose", "details"],
}
# Альтернатива одной колонке amount: отдельные колонки прихода и расхода.
CREDIT_ALIASES = ["приход", "поступление", "кредит", "credit", "income", "inflow"]
DEBIT_ALIASES = ["расход", "списание", "дебет", "debit", "outcome", "outflow"]

ENCODINGS = ["utf-8-sig", "cp1251", "utf-16"]
DATE_FORMATS = ["%Y-%m-%d", "%d.%m.%Y", "%d.%m.%y", "%d/%m/%Y", "%Y/%m/%d",
                "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%d.%m.%Y %H:%M:%S", "%d.%m.%Y %H:%M"]
MAX_BAD_ROW_SHARE = 0.2
HEADER_SEARCH_ROWS = 50
# Служебные строки выписки (итоги, остатки) — не операции и не ошибка.
SERVICE_ROW = re.compile(r"итого|остаток|оборот|сальдо|всего", re.I)


class StatementError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


def parse_amount(value) -> float | None:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    s = re.sub(r"\s", "", str(value))  # пробелы, в т.ч. неразрывные, — разделители разрядов
    s = s.replace("−", "-").replace("–", "-").replace("₽", "").replace("руб.", "").replace("руб", "")
    s = s.replace("RUB", "").replace("р.", "")
    negative = s.startswith("(") and s.endswith(")")
    s = s.strip("()")
    if not s:
        return None
    if "," in s and "." in s:  # 1,234.56 или 1.234,56 — десятичный знак последний
        s = s.replace(",", "") if s.rfind(".") > s.rfind(",") else s.replace(".", "").replace(",", ".")
    else:
        s = s.replace(",", ".")
    try:
        x = float(s)
    except ValueError:
        return None
    return -abs(x) if negative else x


def parse_date(value) -> date | None:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    s = str(value).strip()
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


def _decode(raw: bytes) -> str:
    for enc in ENCODINGS:
        try:
            text = raw.decode(enc)
        except UnicodeDecodeError:
            continue
        if "\x00" not in text:
            return text
    raise StatementError("UNREADABLE", "Не удалось прочитать файл: неизвестная кодировка или это не таблица.")


def _cell(v) -> str:
    return "" if v is None or (isinstance(v, float) and pd.isna(v)) else re.sub(r"\s+", " ", str(v)).strip().lower()


def _is_header(row: list) -> bool:
    cells = {_cell(v) for v in row}
    has_amount = bool(cells & set(COLUMN_ALIASES["amount"])) or (
        bool(cells & set(CREDIT_ALIASES)) and bool(cells & set(DEBIT_ALIASES)))
    return bool(cells & set(COLUMN_ALIASES["date"])) and has_amount


def _table(rows: list[list], header_idx: int) -> pd.DataFrame:
    """Таблица из строк: заголовок — строка header_idx, всё выше (шапка выписки) отбрасывается."""
    names, seen = [], set()
    for i, v in enumerate(rows[header_idx]):
        name = _cell(v) or f"col{i}"
        while name in seen:
            name += "_"
        seen.add(name)
        names.append(name)
    width = len(names)
    body = [(list(r) + [""] * width)[:width] for r in rows[header_idx + 1:] if any(_cell(v) for v in r)]
    return pd.DataFrame(body, columns=names, dtype=object)


def _find_header(rows: list[list]) -> int | None:
    return next((i for i, r in enumerate(rows[:HEADER_SEARCH_ROWS]) if _is_header(r)), None)


def _read_csv(raw: bytes) -> pd.DataFrame:
    text = _decode(raw)
    try:
        sniffed = csv.Sniffer().sniff(text[:20000], delimiters=",;\t|").delimiter
    except csv.Error:
        sniffed = ";" if text.count(";") > text.count(",") else ","
    try:
        for sep in dict.fromkeys([sniffed, ";", ",", "\t", "|"]):
            rows = list(csv.reader(io.StringIO(text), delimiter=sep))
            if (h := _find_header(rows)) is not None:
                return _table(rows, h)
        rows = list(csv.reader(io.StringIO(text), delimiter=sniffed))
    except csv.Error as e:
        raise StatementError("UNREADABLE", "Не удалось разобрать таблицу.") from e
    if not rows:
        raise StatementError("EMPTY_FILE", "В файле нет ни одной операции.")
    return _table(rows, 0)  # заголовок не опознан — дальше будет понятная ошибка MISSING_COLUMNS


def _read_excel(raw: bytes) -> pd.DataFrame:
    try:
        sheet = pd.read_excel(io.BytesIO(raw), header=None, dtype=object)
    except Exception as e:  # битый xlsx может бросить что угодно из zip/openpyxl
        raise StatementError("UNREADABLE", "Не удалось открыть Excel-файл.") from e
    rows = sheet.values.tolist()
    if not rows:
        raise StatementError("EMPTY_FILE", "В файле нет ни одной операции.")
    h = _find_header(rows)
    return _table(rows, 0 if h is None else h)


def _find(columns: dict[str, str], aliases: list[str]) -> str | None:
    for alias in aliases:
        if alias in columns:
            return columns[alias]
    return None


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    columns = {c: c for c in df.columns}
    found = {key: _find(columns, aliases) for key, aliases in COLUMN_ALIASES.items()}

    if found["amount"] is None:
        credit, debit = _find(columns, CREDIT_ALIASES), _find(columns, DEBIT_ALIASES)
        if credit is not None and debit is not None:
            inflow = df[credit].map(parse_amount).fillna(0).abs()
            outflow = df[debit].map(parse_amount).fillna(0).abs()
            df = df.assign(__amount=inflow - outflow)
            found["amount"] = "__amount"

    missing = [k for k in ("date", "amount") if found[k] is None]
    if missing:
        raise StatementError("MISSING_COLUMNS",
                             f"В файле нет обязательных колонок: {', '.join(missing)}. "
                             "Нужны date, amount, counterparty, description.")

    raw_date = df[found["date"]].map(_cell)
    service = (raw_date == "") | (df.apply(lambda r: bool(SERVICE_ROW.search(" ".join(map(_cell, r)))), axis=1)
                                  & df[found["date"]].map(parse_date).isna())
    df = df[~service]
    out = pd.DataFrame({
        "date": df[found["date"]].map(parse_date),
        "amount": df[found["amount"]].map(parse_amount),
        "counterparty": df[found["counterparty"]].astype(str) if found["counterparty"] else "",
        "description": df[found["description"]].astype(str) if found["description"] else "",
    })
    if found["description"] is None:
        out.attrs["warning_no_description"] = True
    return out


def read_statement(raw: bytes, filename: str = "") -> tuple[pd.DataFrame, list[str]]:
    """Возвращает (операции, предупреждения). Нулевые суммы отбрасываются."""
    if not raw or not raw.strip():
        raise StatementError("EMPTY_FILE", "Файл пустой.")

    is_excel = filename.lower().endswith((".xlsx", ".xls")) or raw[:4] == b"PK\x03\x04"
    df = _read_excel(raw) if is_excel else _read_csv(raw)
    df = df.dropna(how="all")
    if df.empty:
        raise StatementError("EMPTY_FILE", "В файле нет ни одной операции.")

    df = _normalize_columns(df)
    warnings = []
    if df.attrs.get("warning_no_description"):
        warnings.append("Нет колонки с назначением платежа — классификация будет неточной.")

    if df.empty:
        raise StatementError("EMPTY_FILE", "В файле нет ни одной операции.")
    bad = df["date"].isna() | df["amount"].isna()
    if bad.all():
        raise StatementError("UNREADABLE", "Не удалось распознать ни одной даты или суммы.")
    if bad.mean() > MAX_BAD_ROW_SHARE:
        raise StatementError("UNREADABLE",
                             f"Не распознаны дата или сумма в {bad.sum()} из {len(df)} строк.")
    if bad.any():
        warnings.append(f"Пропущено строк с нераспознанной датой или суммой: {int(bad.sum())}.")

    df = df[~bad]
    zero = df["amount"] == 0
    if zero.any():
        warnings.append(f"Пропущено операций с нулевой суммой: {int(zero.sum())}.")
    df = df[~zero].reset_index(drop=True)
    if df.empty:
        raise StatementError("EMPTY_FILE", "В файле нет операций с ненулевой суммой.")

    df["counterparty"] = df["counterparty"].fillna("").astype(str).replace("nan", "")
    df["description"] = df["description"].fillna("").astype(str).replace("nan", "")
    return df, warnings
