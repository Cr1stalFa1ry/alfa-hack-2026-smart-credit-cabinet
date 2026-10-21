"""Генератор временных синтетических выписок и правильных ответов к ним.

Помесячные суммы взяты из фикстур FX01 (S1) и FX03 (S3) листа «Тесты» банковской логики.
Когда Data пришлёт свои выписки Иванова и Сидоровой — положить их в data/demo/ с файлами *.expected.json.

Ответы считаются здесь из «истинных» категорий, независимо от кода app/.
Запуск: python data/generate_synthetic.py
"""

import csv
import json
import random
from pathlib import Path
from statistics import fmean, pstdev

ROOT = Path(__file__).parent
AS_OF = "2026-10-21"
MONTHS = [f"{y}-{m:02d}" for y, m in [(2025, 10), (2025, 11), (2025, 12)] + [(2026, i) for i in range(1, 10)]]
RU_MONTH = {"01": "январь", "02": "февраль", "03": "март", "04": "апрель", "05": "май", "06": "июнь",
            "07": "июль", "08": "август", "09": "сентябрь", "10": "октябрь", "11": "ноябрь", "12": "декабрь"}
CLIENTS = ["ООО Ромашка", "ООО Вектор", "ИП Кузнецов А.В.", "ООО СтройДом", "АО Техносервис", "ООО Лето"]


def split(total: int, parts: int, rnd: random.Random) -> list[int]:
    """Делит сумму на части, кратные 100 ₽, сумма частей ровно total."""
    cuts = sorted(rnd.sample(range(1, total // 100), parts - 1))
    return [(b - a) * 100 for a, b in zip([0] + cuts, cuts + [total // 100])]


def ivanov(rnd: random.Random) -> list[tuple]:
    """FX01: поступления 560/840 тыс., расходы 110/390 тыс., кредит 30 тыс./мес."""
    rows = []  # (date, amount, counterparty, description, true_category)
    for i, m in enumerate(MONTHS):
        mon = RU_MONTH[m[5:]]
        revenue = 560_000 if i % 2 == 0 else 840_000
        for k, part in enumerate(split(revenue - 120_000, 4, rnd)):
            rows.append((f"{m}-{5 + k * 6:02d}", part, rnd.choice(CLIENTS),
                         f"Оплата по счёту {100 + i * 10 + k} от {rnd.choice(CLIENTS)} за товар, без налога (НДС)",
                         "revenue"))
        rows.append((f"{m}-27", 120_000, "АО Альфа-Банк", "Зачисление средств по операциям эквайринга", "revenue"))

        rows.append((f"{m}-02", -50_000, "ООО Арендодатель", f"Оплата аренды помещения за {mon}", "expense"))
        rows.append((f"{m}-10", -40_000, "Сотрудники", f"Заработная плата за {mon}", "expense"))
        rows.append((f"{m}-28", -2_000, "АО Альфа-Банк", "Комиссия за обслуживание счёта", "expense"))
        if i % 2 == 0:
            rows.append((f"{m}-25", -18_000, "УФК по г. Москве", "Уплата налога УСН (авансовый платёж)", "tax"))
        else:
            rows.append((f"{m}-14", -270_000, "ООО Альфа-Опт", f"Оплата поставщику по счёту {500 + i} за товар",
                         "expense"))
            rows.append((f"{m}-25", -28_000, "УФК по г. Москве",
                         "Страховые взносы ИП на обязательное пенсионное страхование", "tax"))
        rows.append((f"{m}-20", -30_000, "АО Альфа-Банк", "Погашение кредита по договору КД-2024-118", "loan_payment"))

    # Не выручка и не расходы бизнеса:
    rows.append(("2025-11-03", 500_000, "АО Альфа-Банк", "Поступление кредитных средств по договору КД-2025-077", "loan_in"))
    rows.append(("2026-02-11", 100_000, "Иванов Иван Иванович", "Перевод собственных средств с личной карты", "own_transfer"))
    rows.append(("2026-04-16", 12_000, "ООО Вектор", "Возврат ошибочно перечисленных средств", "refund"))
    rows.append(("2026-06-30", -150_000, "Иванов Иван Иванович", "Перевод собственных средств на личную карту", "own_transfer"))
    rows.append(("2026-09-30", -150_000, "Иванов Иван Иванович", "Перевод собственных средств на личную карту", "own_transfer"))
    # Неоднозначная строка: правила её не поймут (по факту — перевод самому себе).
    rows.append(("2026-07-18", 20_000, "Иванов Иван Иванович", "Перевод по номеру телефона", "own_transfer"))
    # Незакрытый месяц на дату AS_OF — не должен попасть в расчёт.
    rows.append(("2026-10-06", 310_000, "ООО Ромашка", "Оплата по счёту 231 от ООО Ромашка", "revenue"))
    rows.append(("2026-10-02", -50_000, "ООО Арендодатель", "Оплата аренды помещения за октябрь", "expense"))
    return sorted(rows)


def sidorova(rnd: random.Random) -> list[tuple]:
    """FX03: поступления 220/580 тыс., расходы 130 тыс., кредит 60 тыс./мес. Маркетплейс + розница."""
    rows = []
    for i, m in enumerate(MONTHS):
        mon = RU_MONTH[m[5:]]
        revenue = 220_000 if i % 2 == 0 else 580_000
        wb, shop = split(revenue, 2, rnd)
        rows.append((f"{m}-08", wb, "ООО Вайлдберриз", "Выплата за реализованный товар по договору оферты", "revenue"))
        rows.append((f"{m}-22", shop, "ПАО Сбербанк", "Возмещение по операциям эквайринга за период", "revenue"))

        rows.append((f"{m}-01", -40_000, "ИП Морозов П.П.", f"Арендная плата за {mon} по договору 7/23", "expense"))
        rows.append((f"{m}-05", -60_000, "Сотрудники", f"Перечисление зарплаты за {mon}", "expense"))
        rows.append((f"{m}-12", -13_500, "ООО ТкаНИИ", f"Оплата за материалы по счёту {40 + i}", "expense"))
        rows.append((f"{m}-28", -1_500, "АО Альфа-Банк", "Комиссия банка за перевод", "expense"))
        rows.append((f"{m}-26", -15_000, "Казначейство России (ФНС России)", "Единый налоговый платёж", "tax"))
        rows.append((f"{m}-15", -50_000, "АО Альфа-Банк", "Погашение основного долга по кредиту", "loan_payment"))
        rows.append((f"{m}-15", -10_000, "АО Альфа-Банк", "Уплата процентов за пользование кредитом", "loan_payment"))
    rows.append(("2026-01-19", 300_000, "Сидорова Мария Петровна", "Пополнение счёта собственными средствами", "own_transfer"))
    rows.append(("2026-05-07", 8_900, "ООО Вайлдберриз", "Возврат излишне удержанной комиссии", "refund"))
    rows.append(("2026-08-29", -80_000, "Сидорова Мария Петровна", "Перевод собственных средств на личную карту", "own_transfer"))
    rows.append(("2026-03-03", 3_500, "Сидорова Мария Петровна", "Перевод", "own_transfer"))
    return sorted(rows)


def truth(rows: list[tuple]) -> dict:
    """Правильные ответы по истинным категориям (только закрытые месяцы MONTHS)."""
    per = {m: {"revenue": 0.0, "out": 0.0, "loan": 0.0} for m in MONTHS}
    for d, a, _, _, cat in rows:
        m = d[:7]
        if m not in per:
            continue
        if cat == "revenue":
            per[m]["revenue"] += a
        elif cat in ("expense", "tax"):
            per[m]["out"] += -a
        elif cat == "loan_payment":
            per[m]["loan"] += -a
    rev = [per[m]["revenue"] for m in MONTHS]
    out = [per[m]["out"] for m in MONTHS]
    return {
        "as_of": AS_OF,
        "metrics": {
            "avgMonthlyRevenueRub": round(fmean(rev), 2),
            "avgMonthlyExpensesRub": round(fmean(out), 2),
            "avgMonthlyNetRub": round(fmean(rev) - fmean(out), 2),
            "avgMonthlyLoanPaymentsRub": round(fmean(per[m]["loan"] for m in MONTHS), 2),
            "revenueCV": round(pstdev(rev) / fmean(rev), 6),
            "monthsCount": len(MONTHS),
            "annualRevenueRub": round(sum(rev), 2),
        },
    }


def write_csv(path: Path, rows: list[tuple], ru_format: bool = False) -> None:
    """ru_format: «;», cp1251, даты дд.мм.гггг и запятая в суммах — как выгрузка из 1С."""
    if ru_format:
        with path.open("w", encoding="cp1251", newline="") as f:
            w = csv.writer(f, delimiter=";")
            w.writerow(["Дата", "Сумма", "Контрагент", "Назначение платежа"])
            for d, a, cp, desc, _ in rows:
                w.writerow([f"{d[8:]}.{d[5:7]}.{d[:4]}", f"{a:.2f}".replace(".", ","), cp, desc])
    else:
        with path.open("w", encoding="utf-8", newline="") as f:
            w = csv.writer(f)
            w.writerow(["date", "amount", "counterparty", "description"])
            for d, a, cp, desc, _ in rows:
                w.writerow([d, f"{a:.2f}", cp, desc])


def write_bad(dirpath: Path, rnd: random.Random) -> None:
    dirpath.mkdir(parents=True, exist_ok=True)
    (dirpath / "empty.csv").write_bytes(b"")
    (dirpath / "header_only.csv").write_text("date,amount,counterparty,description\n", encoding="utf-8")
    (dirpath / "garbage.csv").write_bytes(bytes(rnd.randrange(256) for _ in range(2048)))
    (dirpath / "wrong_columns.csv").write_text("a,b,c\n1,2,3\n4,5,6\n", encoding="utf-8")
    (dirpath / "bad_values.csv").write_text(
        "date,amount,counterparty,description\n" + "вчера,много,ООО Ромашка,Оплата\n" * 10, encoding="utf-8")
    two = [r for r in ivanov(random.Random(1)) if r[0][:7] in ("2026-08", "2026-09")]
    write_csv(dirpath / "short_2_months.csv", two)
    unclear = [(f"{m}-10", 100_000, "Петров П.П.", "Перевод", "?") for m in MONTHS]
    write_csv(dirpath / "mostly_unclear.csv", unclear)


def main() -> None:
    rnd = random.Random(2026)
    demo = ROOT / "demo"
    demo.mkdir(parents=True, exist_ok=True)
    for name, owner, rows, ru in [("ivanov", "Иванов Иван Иванович", ivanov(rnd), False),
                                  ("sidorova", "Сидорова Мария Петровна", sidorova(rnd), True)]:
        write_csv(demo / f"{name}.csv", rows, ru_format=ru)
        t = {"owner_name": owner, **truth(rows)}
        t["note"] = "Временная синтетика ML (FX01/FX03), заменить файлами Data."
        (demo / f"{name}.expected.json").write_text(json.dumps(t, ensure_ascii=False, indent=2), encoding="utf-8")
        print(name, t["metrics"])
    write_bad(ROOT / "bad", rnd)


if __name__ == "__main__":
    main()
