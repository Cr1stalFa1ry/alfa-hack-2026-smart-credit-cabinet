import json
from datetime import date

import pandas as pd
import pytest

from app.analyzer import analyze
from app.categories import Category as C
from app.classifier import classify
from app.parser import parse_amount, parse_date
from app.rules import classify_by_rules, owner_matcher

from .conftest import BAD, DEMO, FakeLLM

AS_OF = date(2026, 10, 21)


@pytest.mark.parametrize("desc,amount,expected", [
    ("Оплата по счёту 15 от ООО Ромашка", 1000, C.REVENUE),
    ("Поступление кредитных средств по договору", 1000, C.LOAN_IN),
    ("Перевод собственных средств с личной карты", 1000, C.OWN_TRANSFER),
    ("Возврат ошибочно перечисленных средств", 1000, C.REFUND),
    ("Оплата аренды помещения", -1000, C.EXPENSE),
    ("Заработная плата за сентябрь", -1000, C.EXPENSE),
    ("Погашение кредита по договору", -1000, C.LOAN_PAYMENT),
    ("Уплата налога УСН", -1000, C.TAX),
])
def test_tz_examples(desc, amount, expected):
    assert classify_by_rules(desc, "", amount)[0] is expected


def test_sign_matters():
    assert classify_by_rules("Оплата по счёту 15", "ООО Ромашка", 500)[0] is C.REVENUE
    assert classify_by_rules("Оплата по счёту 15", "ООО Ромашка", -500)[0] is C.EXPENSE


def test_vat_phrase_is_not_tax():
    assert classify_by_rules("Оплата по счёту 7, без налога (НДС)", "", -100)[0] is C.EXPENSE


def test_counterparty_fallback_tax():
    assert classify_by_rules("Платёж по документу 12", "УФК по г. Москве", -100)[0] is C.TAX


@pytest.mark.parametrize("raw,value", [
    ("1 234,56", 1234.56), ("-1 234,56 ₽", -1234.56), ("1,234.56", 1234.56), ("1.234,56", 1234.56),
    ("−500", -500.0), ("(300)", -300.0), ("abc", None), ("", None), (12.5, 12.5),
])
def test_parse_amount(raw, value):
    assert parse_amount(raw) == value


@pytest.mark.parametrize("raw,value", [
    ("2026-03-05", date(2026, 3, 5)), ("05.03.2026", date(2026, 3, 5)), ("05.03.26", date(2026, 3, 5)),
    ("2026-03-05 10:11:12", date(2026, 3, 5)), ("вчера", None),
])
def test_parse_date(raw, value):
    assert parse_date(raw) == value


@pytest.mark.parametrize("name", ["ivanov", "sidorova"])
def test_demo_within_1_percent_without_llm(name):
    expected = json.loads((DEMO / f"{name}.expected.json").read_text(encoding="utf-8"))
    res = analyze((DEMO / f"{name}.csv").read_bytes(), f"{name}.csv", as_of=AS_OF, llm=None)
    assert res["status"] == "ok"
    for metric, exp in expected["metrics"].items():
        assert res["metrics"][metric]["value"] == pytest.approx(exp, rel=0.01), metric


def test_current_month_excluded():
    res = analyze((DEMO / "ivanov.csv").read_bytes(), "ivanov.csv", as_of=AS_OF)
    assert res["period"]["to"] == "2026-09" and res["period"]["excluded_not_closed"] == ["2026-10"]


@pytest.mark.parametrize("fname,code", [
    ("empty.csv", "EMPTY_FILE"), ("header_only.csv", "EMPTY_FILE"), ("garbage.csv", "UNREADABLE"),
    ("wrong_columns.csv", "MISSING_COLUMNS"), ("bad_values.csv", "UNREADABLE"),
    ("short_2_months.csv", "SHORT_HISTORY"), ("mostly_unclear.csv", "TOO_MANY_UNCLEAR"),
])
def test_bad_files_need_manual_input(fname, code):
    res = analyze((BAD / fname).read_bytes(), fname, as_of=AS_OF)
    assert res["status"] == "manual_input_required"
    assert res["display"] == "нужен ручной ввод"
    assert res["reason"]["code"] == code and res["reason"]["message"]


def test_missing_metric_is_not_zero():
    csv = "date,amount,counterparty,description\n" + "".join(
        f"2026-0{m}-10,100000,ООО Ромашка,Оплата по счёту {m}\n2026-0{m}-11,-20000,ООО А,Оплата аренды\n"
        for m in (5, 6, 7))
    res = analyze(csv.encode(), "x.csv", as_of=AS_OF)
    lp = res["metrics"]["avgMonthlyLoanPaymentsRub"]
    assert lp["value"] is None and lp["status"] == "not_found" and lp["display"] == "не найдено"
    assert res["metrics"]["annualRevenueRub"]["value"] is None  # 3 мес. — год не достраиваем


def test_cv_is_population_std_over_mean():
    # Выручка по месяцам 1000 / 0 / 0: месяцы без выручки входят в расчёт нулями.
    csv = "date,amount,counterparty,description\n" + "".join(
        f"2026-0{m}-11,-20000,ООО А,Оплата аренды\n" for m in (5, 6, 7)) + "2026-05-12,1000,ООО Б,Оплата по счёту 1\n"
    res = analyze(csv.encode(), "x.csv", as_of=AS_OF)
    assert res["metrics"]["avgMonthlyRevenueRub"]["value"] == pytest.approx(333.33, abs=0.01)
    assert res["metrics"]["revenueCV"]["value"] == pytest.approx(2 ** 0.5, rel=1e-5)


def test_no_revenue_found_is_not_zero():
    csv = "date,amount,counterparty,description\n" + "".join(
        f"2026-0{m}-11,-20000,ООО А,Оплата аренды\n2026-0{m}-12,50000,Банк,Поступление кредитных средств\n"
        for m in (5, 6, 7))
    res = analyze(csv.encode(), "x.csv", as_of=AS_OF)
    rev = res["metrics"]["avgMonthlyRevenueRub"]
    assert rev["value"] is None and rev["status"] == "not_found" and rev["display"] == "не найдено"
    assert res["metrics"]["avgMonthlyNetRub"]["value"] is None


def test_semicolon_cp1251_xlsx_and_debit_credit(tmp_path):
    rows = [("01.07.2026", "", "50 000,00", "Оплата аренды"), ("05.07.2026", "100 000,00", "", "Оплата по счёту 1"),
            ("05.08.2026", "100 000,00", "", "Оплата по счёту 2"), ("05.09.2026", "100 000,00", "", "Оплата по счёту 3")]
    text = "Дата;Приход;Расход;Назначение платежа\n" + "\n".join(";".join(r) for r in rows)
    res = analyze(text.encode("cp1251"), "x.csv", as_of=AS_OF)
    assert res["status"] == "ok"
    assert res["metrics"]["avgMonthlyRevenueRub"]["value"] == 100000.0
    assert res["metrics"]["avgMonthlyExpensesRub"]["value"] == pytest.approx(50000 / 3, rel=1e-6)

    df = pd.read_csv(DEMO / "ivanov.csv")
    path = tmp_path / "ivanov.xlsx"
    df.to_excel(path, index=False)
    res = analyze(path.read_bytes(), "ivanov.xlsx", as_of=AS_OF)
    assert res["metrics"]["avgMonthlyRevenueRub"]["value"] == 700000.0


def test_llm_only_for_unclear_and_validated():
    df = pd.DataFrame({"description": ["Оплата по счёту 1", "Перевод по номеру телефона", "Перевод", "Странное"],
                       "counterparty": ["ООО А", "Иванов И.И.", "Петров", "?"],
                       "amount": [100.0, 200.0, 300.0, -50.0]})

    def responder(messages, schema):
        items = json.loads(messages[-1]["content"])
        assert all("Оплата" not in i["description"] for i in items)  # правило уже поняло — модель не спрашиваем
        answers = {"Перевод по номеру телефона": "own_transfer", "Перевод": "tax", "Странное": "выдумка"}
        return {"items": [{"id": i["id"], "category": answers[i["description"]]} for i in items]}

    out = classify(df, FakeLLM(responder))
    assert list(out["category"]) == ["revenue", "own_transfer", "unclear", "unclear"]  # tax для прихода и выдумка отброшены
    assert list(out["source"]) == ["rules", "llm", "none", "none"]


def test_works_when_llm_down():
    res = analyze((DEMO / "ivanov.csv").read_bytes(), "ivanov.csv", as_of=AS_OF, llm=FakeLLM(available=False))
    assert res["status"] == "ok" and res["metrics"]["avgMonthlyRevenueRub"]["value"] == 700000.0


BANK_EXPORT = """Выписка по счёту 40802810000000000001;;;;
ИП Иванов Иван Иванович;;;;
Период: 01.07.2026 - 30.09.2026;;;;
Входящий остаток;;;;150 000,00
;;;;
Дата операции;Приход;Расход;Контрагент;Назначение платежа
01.07.2026;;50 000,00;ООО Арендодатель;Оплата аренды за июль
05.07.2026;100 000,00;;ООО Ромашка;Оплата по счёту 1
05.08.2026;100 000,00;;ООО Ромашка;Оплата по счёту 2
05.09.2026;100 000,00;;ООО Ромашка;Оплата по счёту 3
Итого обороты;300 000,00;50 000,00;;
Исходящий остаток;;;;400 000,00
"""


def test_bank_export_with_preamble_and_totals(tmp_path):
    res = analyze(BANK_EXPORT.encode("cp1251"), "export.csv", as_of=AS_OF)
    assert res["status"] == "ok", res.get("reason")
    assert res["metrics"]["avgMonthlyRevenueRub"]["value"] == 100000.0
    assert res["classification"]["operations"] == 4 and not any("Пропущено" in w for w in res["warnings"])

    rows = [line.split(";") for line in BANK_EXPORT.strip().splitlines()]
    path = tmp_path / "export.xlsx"
    pd.DataFrame(rows).to_excel(path, index=False, header=False)
    res = analyze(path.read_bytes(), "export.xlsx", as_of=AS_OF)
    assert res["status"] == "ok" and res["metrics"]["avgMonthlyRevenueRub"]["value"] == 100000.0


@pytest.mark.parametrize("cp,ok", [
    ("Иванов Иван Иванович", True), ("ИВАНОВ И.И.", True), ("ИП Иванов И. И.", True), ("Иванов Иван", True),
    ("Иванова Мария", False), ("Иванов Пётр Сергеевич", False), ("ООО Иванов и партнёры", False), ("", False),
])
def test_owner_matcher(cp, ok):
    assert owner_matcher("Иванов Иван Иванович")(cp) is ok


def test_owner_transfer_without_llm():
    plain = analyze((DEMO / "ivanov.csv").read_bytes(), "ivanov.csv", as_of=AS_OF)
    owned = analyze((DEMO / "ivanov.csv").read_bytes(), "ivanov.csv", as_of=AS_OF, owner_name="Иванов Иван Иванович")
    assert plain["classification"]["unclear_inflow_share"] > 0
    assert owned["classification"]["unclear_inflow_share"] == 0 and not owned["classification"]["unclear_examples"]
