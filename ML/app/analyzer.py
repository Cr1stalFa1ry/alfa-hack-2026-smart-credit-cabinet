"""Анализ выписки целиком: файл → операции → категории → показатели → ответ сервиса."""

import logging
from datetime import date

import pandas as pd

from . import PIPELINE_VERSION
from .categories import RU_NAMES, Category
from .classifier import classify
from .llm import OllamaClient
from .metrics import MIN_MONTHS, compute_metrics, monthly_table, select_period
from .parser import StatementError, read_statement

log = logging.getLogger(__name__)

MAX_UNCLEAR_INFLOW_SHARE = 0.5  # если не поняли больше половины поступлений — цифрам верить нельзя
UNCLEAR_EXAMPLES = 20
# Колонки, которые приходят из PDF/скана: номер строки, страница, исходный фрагмент, координаты, уверенность OCR.
EVIDENCE_COLUMNS = ["row", "page", "quote", "bbox", "confidence"]


def manual_input(code: str, message: str, **extra) -> dict:
    return {"status": "manual_input_required", "display": "нужен ручной ввод",
            "reason": {"code": code, "message": message}, "pipeline_version": PIPELINE_VERSION, **extra}


def _round_table(t: pd.DataFrame) -> list[dict]:
    rows = []
    for month, r in t.iterrows():
        row = {"month": month}
        row.update({k: (int(v) if k == "operations" else round(float(v), 2)) for k, v in r.items()})
        rows.append(row)
    return rows


def _plain(v):
    """NaN → None, числа numpy → обычные: ответ должен сериализоваться в JSON."""
    if isinstance(v, float) and v != v:
        return None
    return v.item() if hasattr(v, "item") else v


def _transactions(df: pd.DataFrame) -> list[dict]:
    evidence = [c for c in EVIDENCE_COLUMNS if c in df.columns]
    return [{"date": r["date"].isoformat(), "amount": round(float(r["amount"]), 2), "counterparty": r["counterparty"],
             "description": r["description"], "category": r["category"],
             "category_ru": RU_NAMES[Category(r["category"])], "source": r["source"],
             "needs_review": bool(r["needs_review"]), **{c: _plain(r[c]) for c in evidence}}
            for r in df.to_dict("records")]


def analyze(raw: bytes, filename: str = "", as_of: date | None = None, llm: OllamaClient | None = None,
            include_transactions: bool = False, owner_name: str | None = None) -> dict:
    try:
        df, warnings = read_statement(raw, filename)
    except StatementError as e:
        return manual_input(e.code, e.message, llm=llm.info() if llm else {"enabled": False, "available": False})
    except Exception:  # последний рубеж: сервис не должен падать на файле клиента
        log.exception("Unexpected error while reading statement")
        return manual_input("UNREADABLE", "Не удалось прочитать файл.")
    return analyze_transactions(df, warnings, as_of, llm, include_transactions, owner_name)


def analyze_transactions(df: pd.DataFrame, warnings: list[str], as_of: date | None = None,
                         llm: OllamaClient | None = None, include_transactions: bool = False,
                         owner_name: str | None = None) -> dict:
    """Операции (date, amount, counterparty, description) → категории и показатели за закрытые месяцы.

    Категории проставляются всем операциям документа, даже если показатели посчитать нельзя.
    """
    as_of = as_of or date.today()
    df = classify(df.reset_index(drop=True), llm, owner_name)
    extra = {"llm": llm.info() if llm else {"enabled": False, "available": False}}
    if include_transactions:
        extra["transactions"] = _transactions(df)

    df["month"] = [f"{d:%Y-%m}" for d in df["date"]]
    period = select_period(df, as_of)
    period_info = {"from": period.months[0] if period.months else None,
                   "to": period.months[-1] if period.months else None,
                   "months": len(period.months), "as_of": as_of.isoformat(),
                   "excluded_not_closed": period.excluded_current, "dropped_older": period.dropped_old,
                   "empty_months": period.empty_months}
    if len(period.months) < MIN_MONTHS:
        return manual_input("SHORT_HISTORY",
                            f"Данные только за {len(period.months)} закрытых мес., нужно минимум {MIN_MONTHS}.",
                            period=period_info, **extra)

    df = df[df["month"].isin(period.months)].reset_index(drop=True)
    t = monthly_table(df, period.months)
    total_in = float(df.loc[df["amount"] > 0, "amount"].sum())
    unclear_in = float(t["unclear_in"].sum())
    unclear_share = unclear_in / total_in if total_in > 0 else 0.0
    if unclear_share > MAX_UNCLEAR_INFLOW_SHARE:
        return manual_input("TOO_MANY_UNCLEAR",
                            f"Не удалось понять назначение {unclear_share:.0%} поступлений.",
                            period=period_info, **extra)

    if period.excluded_current:
        warnings.append(f"Незакрытый месяц не учитывается: {', '.join(period.excluded_current)}.")
    if period.dropped_old:
        warnings.append(f"Берём последние 12 мес., отброшены: {period.dropped_old[0]}…{period.dropped_old[-1]}.")
    if period.empty_months:
        warnings.append(f"Нет операций в месяцах: {', '.join(period.empty_months)} — считаем их нулевыми.")
    if unclear_share > 0:
        share = f"{unclear_share:.1%}".replace(".", ",")
        warnings.append(f"Не распознано {share} поступлений — они не включены в выручку.")

    unclear_rows = df[df["category"] == Category.UNCLEAR.value]
    unclear_rows = unclear_rows.reindex(unclear_rows["amount"].abs().sort_values(ascending=False).index)

    return {
        "status": "ok",
        "display": "показатели рассчитаны",
        "reason": None,
        "period": period_info,
        "metrics": compute_metrics(df, t),
        "monthly": _round_table(t),
        "classification": {
            "operations": int(len(df)),
            "by_source": {k: int(v) for k, v in df["source"].value_counts().items()},
            "by_category": {k: int(v) for k, v in df["category"].value_counts().items()},
            "needs_review": int(df["needs_review"].sum()),
            "unclear_inflow_share": round(unclear_share, 4),
            "unclear_examples": _transactions(unclear_rows.head(UNCLEAR_EXAMPLES)),
        },
        "warnings": warnings,
        "pipeline_version": PIPELINE_VERSION,
        **extra,
    }
