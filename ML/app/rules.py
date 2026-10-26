"""Шаг 1 классификации: правила по ключевым словам в назначении платежа.

Правила зависят от знака суммы: «Оплата по счёту» с плюсом — выручка, с минусом — расход.
Порядок важен: сначала исключения (кредит, свои средства, возврат, налог), затем общие слова.
"""

import re
from dataclasses import dataclass

from .categories import Category

C = Category


@dataclass(frozen=True)
class Rule:
    id: str
    category: Category
    pattern: re.Pattern


def _r(rule_id: str, category: Category, *patterns: str) -> Rule:
    return Rule(rule_id, category, re.compile("|".join(f"(?:{p})" for p in patterns)))


INFLOW_RULES = [
    _r("IN_LOAN", C.LOAN_IN,
       r"кредитн\w*\s+средств",
       r"(выдач|предоставлен|поступлен|зачислен)\w*\s+(\w+\s+)?(кредит|займ|заем|транш)",
       r"по\s+кредитн\w*\s+договор", r"кредитн\w*\s+лини", r"\bза[йе]м", r"\bтранш", r"овердрафт",
       r"взнос\w*\s+в\s+капитал", r"совместн\w*\s+деятельност"),
    _r("IN_OWN", C.OWN_TRANSFER,
       r"собственн\w*\s+средств", r"\bсвоих\s+средств", r"с\s+(\w+\s+)?личн\w*\s+(карт|сч[её]т)",
       r"личн\w*\s+средств", r"между\s+(своими\s+)?сч[её]тами",
       r"(пополнени|внесени|взнос)\w*\s+(собственн|личн|учредител)", r"депозит", r"с\s+другого\s+сч[её]та"),
    _r("IN_REFUND", C.REFUND,
       r"возврат", r"ошибочн", r"сторно", r"отмен\w*\s+(платеж|операц|покупк)", r"чарджб[еэ]к|chargeback",
       r"недопоставк"),
    _r("IN_REVENUE", C.REVENUE,
       r"оплат", r"выручк", r"эквайринг", r"реализ(аци|ован)", r"за\s+товар", r"за\s+услуг", r"за\s+работ",
       r"по\s+сч[её]ту", r"предоплат", r"\bаванс", r"инкасс", r"оказани\w*\s+услуг", r"выплат\w*\s+продавц",
       r"\bопл\b", r"от\s+покупател",
       r"возмещени\w*\s+по\s+операци", r"маркетплейс|wildberries|вайлдберриз|ozon|озон|яндекс\s*маркет"),
]

# Личное, которое нельзя доказать одним текстом («покупка ПЯТЕРОЧКА», «ЖКУ»): категорию ставим, но отдаём человеку.
_BUSINESS_PLACE = r"помещени|офис|склад|цех|магазин|кофейн|производств|торгов\w*\s+точк"
REVIEW_RULES = {"OUT_PERSONAL_REVIEW"}

OUTFLOW_RULES = [
    _r("OUT_LOAN", C.LOAN_PAYMENT,
       r"погаш\w*\.?\s+(\w+\s+){0,2}(кредит|займ|заем|ссуд|основного\s+долга)",
       r"погашени\w*\s+задолженност\w*\s+по\s+(кредит|займ|заем|договор)",
       r"процент\w*\s+(\w+\s+){0,2}(кредит|займ|заем)", r"по\s+кредитн\w*\s+договор",
       r"(кредит|займ|заем)\w*.{0,30}(погашени|платеж|взнос)", r"возврат\s+(\w+\s+)?(займ|заем|кредит)",
       r"лизинг"),
    _r("OUT_TAX", C.TAX,
       r"налог", r"\bусн\b", r"\bндфл\b", r"\bенп\b", r"единый\s+налогов", r"уплата\s+ндс",
       r"страхов\w*\s+взнос", r"фиксированн\w*\s+взнос", r"взнос\w*\s+(\w+\s+)?(пфр|фсс|омс|опс|пенсионн)"),
    _r("OUT_OWN", C.OWN_TRANSFER,
       r"собственн\w*\s+средств", r"\bсвоих\s+средств", r"на\s+(свою\s+)?личн\w*\s+(карт|сч[её]т)",
       r"между\s+(своими\s+)?сч[её]тами", r"(вывод|сняти)\w*\s+(собственн|личн)",
       r"на\s+личные\s+(нужды|цели)", r"перевод\s+себе", r"на\s+сво\w+\s+(карт|сч[её]т)", r"депозит"),
    _r("OUT_REFUND", C.REFUND, r"возврат", r"ошибочн", r"сторно"),
    _r("OUT_PERSONAL", C.PERSONAL,
       r"личн\w*\s+(нужд|цел|расход|трат|лечени|покупк)", r"не\s+связан\w*\s+с\s+бизнес", r"ребен|детск",
       r"по\s+квартир"),
    _r("OUT_PERSONAL_REVIEW", C.PERSONAL,
       rf"^(?!.*(?:{_BUSINESS_PLACE})).*(?:пятерочк|магнит|перекрест|вкусвилл|ашан|\bлента\b|дикси|аптек|"
       r"супермаркет|продукт|ресторан|\bкафе\b|\bжку\b|\bжкх\b|коммунальн)"),
    _r("OUT_EXPENSE", C.EXPENSE,
       r"аренд", r"заработн|зарплат|\bз/п\b|\bзп\b|оплат\w*\s+труда|\bпреми|отпускн",
       r"закуп|поставк|за\s+товар|приобретени|покупк|\bтовар|материал|сырь|оборудовани|канцтовар",
       r"комисси", r"коммунальн|электроэнерг|водоснабж|отоплени|\bсвяз|интернет|телефон",
       r"транспорт|доставк|логистик|топлив|\bгсм\b|бензин", r"реклам|маркетинг|продвижени",
       r"обслуживани", r"бухгалтер", r"страхов\w*\s+(полис|преми|имуществ|каско|осаго)",
       r"канцеляр|хозтовар", r"ремонт", r"подряд", r"хостинг|подписк|лицензи|программн",
       r"услуг", r"оплат", r"\bопл\b", r"поставщик", r"по\s+сч[её]ту", r"по\s+договору", r"за\s+работ"),
]

# Контрагент проверяется, только если назначение ничего не дало, и только узким списком.
COUNTERPARTY_INFLOW_RULES = [
    _r("CP_IN_MARKETPLACE", C.REVENUE, r"маркетплейс|wildberries|вайлдберриз|ozon|озон|яндекс\s*маркет"),
]
COUNTERPARTY_OUTFLOW_RULES = [
    _r("CP_OUT_TAX", C.TAX, r"\bуфк\b|\bифнс\b|\bфнс\b|казначейств|социальн\w+\s+фонд"),
]

# Стандартные хвосты платёжек, которые не говорят о налоге: «Без налога (НДС)», «в т.ч. НДС 20%».
_VAT_NOISE = re.compile(
    r"без\s+налога\s*\(?\s*ндс\s*\)?|ндс\s+не\s+облагается|в\s+т\.?\s*ч\.?\s*ндс[^,;]*|"
    r"в\s+том\s+числе\s+ндс[^,;]*|без\s+ндс|ндс\s*\(?\d+\s*%\)?[^,;]*"
)


def normalize(text: str) -> str:
    text = str(text or "").lower().replace("ё", "е")
    text = _VAT_NOISE.sub(" ", text)
    return re.sub(r"\s+", " ", text).strip()


def classify_by_rules(description: str, counterparty: str, amount: float) -> tuple[Category, str | None]:
    """Возвращает (категория, id правила). Если ни одно правило не сработало — (UNCLEAR, None)."""
    if amount == 0:
        return C.UNCLEAR, None
    inflow = amount > 0
    desc = normalize(description)
    for rule in INFLOW_RULES if inflow else OUTFLOW_RULES:
        if rule.pattern.search(desc):
            return rule.category, rule.id
    cp = normalize(counterparty)
    for rule in COUNTERPARTY_INFLOW_RULES if inflow else COUNTERPARTY_OUTFLOW_RULES:
        if rule.pattern.search(cp):
            return rule.category, rule.id
    return C.UNCLEAR, None


_COMPANY = re.compile(r"\b(ооо|ао|пао|зао|оао|нко|банк)\b")


def owner_matcher(owner_name: str | None):
    """Предикат «контрагент — сам владелец ИП»: «Иванов Иван Иванович», «Иванов И.И.», «ИП Иванов И. И.»."""
    tokens = [t for t in re.findall(r"[а-яa-z]+", normalize(owner_name or "")) if t != "ип"]
    if not tokens:
        return lambda counterparty: False
    surname, first = tokens[0], tokens[1] if len(tokens) > 1 else None

    def match(counterparty: str) -> bool:
        cp = normalize(counterparty)
        if _COMPANY.search(cp):
            return False
        words = re.findall(r"[а-яa-z]+", cp)
        if surname not in words:
            return False
        return first is None or first in words or any(w == first[0] for w in words if len(w) == 1)

    return match
