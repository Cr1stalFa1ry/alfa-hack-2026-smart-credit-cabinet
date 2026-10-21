"""Расчёт показателей по классифицированным операциям.

Определения согласованы со словарём данных (лист «Данные» банковской логики):
  месяцы — закрытые календарные, текущий месяц на дату as_of не берётся, максимум 12 последних (F13);
  выручка = поступления без кредитов, своих переводов и возвратов (cleanReceiptsRub, F13);
  расходы = операционные + налоги, без долговых платежей и своих переводов (operatingOutflowRub, F13);
  чистый поток = среднее(выручка − расходы) (F33); CV = σ генеральной / среднее (F38, R19);
  годовая выручка — только при ровно 12 месяцах, без экстраполяции (F37).
Если показатель не найден — value=None и статус not_found/unclear, а не 0.
"""

from dataclasses import dataclass
from datetime import date
from statistics import fmean, pstdev

import pandas as pd

from .categories import Category

C = Category
MAX_MONTHS = 12
MIN_MONTHS = 3
TAXES_IN_OPERATING = True  # налоги входят в расходы бизнеса (F13 исключает только долги, личное и свои переводы)

STATUS_RU = {"not_found": "не найдено", "unclear": "неясно"}


@dataclass
class Period:
    months: list[str]
    excluded_current: list[str]  # незакрытые месяцы (>= месяца as_of)
    dropped_old: list[str]       # старше 12 последних
    empty_months: list[str]      # месяцы внутри периода без единой операции


def money(x: float) -> str:
    return f"{x:,.2f}".replace(",", " ").replace(".", ",") + " ₽"


def _metric(value, display=None, status="ok", note=None) -> dict:
    if value is None:
        return {"value": None, "status": status, "display": STATUS_RU.get(status, status), "note": note}
    return {"value": value, "status": "ok", "display": display if display is not None else str(value), "note": note}


def select_period(df: pd.DataFrame, as_of: date) -> Period:
    months_present = sorted(df["month"].unique())
    current = f"{as_of:%Y-%m}"
    excluded = [m for m in months_present if m >= current]
    closed = [m for m in months_present if m < current]
    if not closed:
        return Period([], excluded, [], [])
    full = [str(p) for p in pd.period_range(closed[0], closed[-1], freq="M")]
    dropped = full[:-MAX_MONTHS] if len(full) > MAX_MONTHS else []
    months = full[-MAX_MONTHS:]
    empty = [m for m in months if m not in set(closed)]
    return Period(months, excluded, dropped, empty)


def monthly_table(df: pd.DataFrame, months: list[str]) -> pd.DataFrame:
    df = df[df["month"].isin(months)]
    inflow = df[df["amount"] > 0]
    outflow = df[df["amount"] < 0]

    def by_month(frame: pd.DataFrame, cats: set[Category]) -> pd.Series:
        sel = frame[frame["category"].isin({c.value for c in cats})]
        return sel.groupby("month")["amount"].sum().abs().reindex(months, fill_value=0.0)

    t = pd.DataFrame(index=pd.Index(months, name="month"))
    t["revenue"] = by_month(inflow, {C.REVENUE})
    t["expenses"] = by_month(outflow, {C.EXPENSE})
    t["taxes"] = by_month(outflow, {C.TAX})
    t["operating_outflow"] = t["expenses"] + (t["taxes"] if TAXES_IN_OPERATING else 0.0)
    t["net"] = t["revenue"] - t["operating_outflow"]
    t["loan_payments"] = by_month(outflow, {C.LOAN_PAYMENT})
    t["loan_proceeds"] = by_month(inflow, {C.LOAN_IN})
    t["own_transfers_in"] = by_month(inflow, {C.OWN_TRANSFER})
    t["own_transfers_out"] = by_month(outflow, {C.OWN_TRANSFER})
    t["refunds_in"] = by_month(inflow, {C.REFUND})
    t["refunds_out"] = by_month(outflow, {C.REFUND})
    t["unclear_in"] = by_month(inflow, {C.UNCLEAR})
    t["unclear_out"] = by_month(outflow, {C.UNCLEAR})
    t["operations"] = df.groupby("month").size().reindex(months, fill_value=0)
    return t


def compute_metrics(df: pd.DataFrame, t: pd.DataFrame) -> dict:
    """df — операции выбранного периода, t — помесячная таблица."""
    n = len(t)
    has = lambda cat: bool((df["category"] == cat.value).any())  # noqa: E731
    unclear_in = float(t["unclear_in"].sum()) > 0
    unclear_out = float(t["unclear_out"].sum()) > 0
    missing_status = lambda unclear: "unclear" if unclear else "not_found"  # noqa: E731

    m: dict[str, dict] = {}
    revenue_found = has(C.REVENUE)
    expenses_found = has(C.EXPENSE) or (TAXES_IN_OPERATING and has(C.TAX))

    if revenue_found:
        rev = t["revenue"].tolist()
        mean_rev = fmean(rev)
        m["avgMonthlyRevenueRub"] = _metric(round(mean_rev, 2), money(mean_rev))
        if mean_rev > 0:
            cv = pstdev(rev) / mean_rev
            m["revenueCV"] = _metric(round(cv, 6), f"{cv * 100:.1f}%".replace(".", ","),
                                     note="σ/среднее по месяцам; ≤0,3 — стабильно, >0,6 — сильно скачет")
        else:
            m["revenueCV"] = _metric(None, status="unclear", note="Средняя выручка 0 — разброс не оценить.")
        m["annualRevenueRub"] = (_metric(round(sum(rev), 2), money(sum(rev))) if n == 12 else
                                 _metric(None, status="not_found", note=f"Данных {n} мес., год не достраиваем."))
    else:
        st = missing_status(unclear_in)
        m["avgMonthlyRevenueRub"] = _metric(None, status=st)
        m["revenueCV"] = _metric(None, status=st)
        m["annualRevenueRub"] = _metric(None, status=st)

    if expenses_found:
        mean_exp = float(t["operating_outflow"].mean())
        m["avgMonthlyExpensesRub"] = _metric(round(mean_exp, 2), money(mean_exp),
                                             note="аренда, зарплата, закупки, услуги" +
                                                  (" и налоги" if TAXES_IN_OPERATING else ""))
    else:
        m["avgMonthlyExpensesRub"] = _metric(None, status=missing_status(unclear_out))

    if revenue_found and expenses_found:
        net = float(t["net"].mean())
        m["avgMonthlyNetRub"] = _metric(round(net, 2), money(net))
    else:
        m["avgMonthlyNetRub"] = _metric(None, status="unclear", note="Нет выручки или расходов для расчёта.")

    if has(C.LOAN_PAYMENT):
        lp = float(t["loan_payments"].mean())
        m["avgMonthlyLoanPaymentsRub"] = _metric(round(lp, 2), money(lp))
    else:
        m["avgMonthlyLoanPaymentsRub"] = _metric(None, status=missing_status(unclear_out),
                                                 note="Платежей по кредитам в выписке не найдено.")

    m["monthsCount"] = _metric(n, f"{n} мес.")

    if has(C.TAX):
        tx = float(t["taxes"].mean())
        m["avgMonthlyTaxesRub"] = _metric(round(tx, 2), money(tx))
    else:
        m["avgMonthlyTaxesRub"] = _metric(None, status=missing_status(unclear_out))
    if has(C.LOAN_IN):
        lin = float(t["loan_proceeds"].sum())
        m["loanProceedsTotalRub"] = _metric(round(lin, 2), money(lin), note="кредиты, полученные за период")
    else:
        m["loanProceedsTotalRub"] = _metric(None, status="not_found")
    return m
