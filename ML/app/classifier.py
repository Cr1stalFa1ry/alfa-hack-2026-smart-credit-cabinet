"""Классификация операций: сначала правила, затем (по желанию) нейросеть для непонятых строк."""

import json
import time

import pandas as pd

from .categories import RU_NAMES, Category, allowed_for_sign
from .llm import OllamaClient
from .rules import REVIEW_RULES, classify_by_rules, owner_matcher

LLM_BATCH = 15
LLM_BUDGET_S = 25.0  # общий лимит на нейросеть в одном запросе, чтобы сервис отвечал быстро

# Примеры из ТЗ; список из 20 строк от бизнес-аналитика добавить сюда же (data/labeled/descriptions.csv).
FEW_SHOT = [
    ("Оплата по счёту 15 от ООО Ромашка", "+", Category.REVENUE),
    ("Поступление кредитных средств по договору", "+", Category.LOAN_IN),
    ("Перевод собственных средств с личной карты", "+", Category.OWN_TRANSFER),
    ("Возврат ошибочно перечисленных средств", "+", Category.REFUND),
    ("Оплата аренды помещения", "-", Category.EXPENSE),
    ("Заработная плата за сентябрь", "-", Category.EXPENSE),
    ("Погашение кредита по договору", "-", Category.LOAN_PAYMENT),
    ("Уплата налога УСН", "-", Category.TAX),
]

SYSTEM_PROMPT = """Ты классифицируешь операции по банковскому счёту индивидуального предпринимателя.
Для каждой операции выбери ровно одну категорию из списка:
{categories}

Знак "+" — деньги пришли на счёт, "-" — ушли со счёта.
Правила:
- revenue только для прихода от покупателей и заказчиков за товары, работы, услуги.
- Кредиты, займы, переводы своих денег и возвраты — НЕ выручка.
- Погашение кредита, проценты по нему и лизинг — loan_payment, это не расход бизнеса.
- Личные траты владельца (продукты, ЖКУ квартиры, лечение) — personal, это не расход бизнеса.
- Если не уверен или данных мало (например, просто «Перевод» от физлица) — ставь unclear. Ничего не выдумывай.
Отвечай только JSON по схеме, без пояснений.

Примеры:
{examples}"""


def _schema(n_items: int) -> dict:
    return {
        "type": "object",
        "properties": {"items": {"type": "array", "minItems": n_items, "maxItems": n_items, "items": {
            "type": "object",
            "properties": {"id": {"type": "integer"}, "category": {"type": "string", "enum": [c.value for c in Category]}},
            "required": ["id", "category"]}}},
        "required": ["items"],
    }


def _system_prompt() -> str:
    cats = "\n".join(f"- {c.value}: {RU_NAMES[c]}" for c in Category)
    examples = "\n".join(f'{sign} "{d}" -> {c.value}' for d, sign, c in FEW_SHOT)
    return SYSTEM_PROMPT.format(categories=cats, examples=examples)


def _llm_classify(items: list[tuple[str, str, float]], llm: OllamaClient,
                  owner_name: str | None = None) -> dict[int, Category]:
    """items: (description, counterparty, amount). Возвращает {индекс: категория} только для валидных ответов."""
    out: dict[int, Category] = {}
    started = time.monotonic()
    system = _system_prompt()
    if owner_name:
        system += f"\n\nВладелец счёта: ИП {owner_name}. Переводы от него самого или ему самому — own_transfer."
    for start in range(0, len(items), LLM_BATCH):
        if time.monotonic() - started > LLM_BUDGET_S:
            break
        batch = items[start:start + LLM_BATCH]
        lines = [{"id": i, "sign": "+" if a > 0 else "-", "description": d, "counterparty": cp}
                 for i, (d, cp, a) in enumerate(batch)]
        messages = [{"role": "system", "content": system},
                    {"role": "user", "content": json.dumps(lines, ensure_ascii=False)}]
        answer = llm.chat_json(messages, schema=_schema(len(batch)), options={"num_predict": 40 * len(batch)})
        if not answer or not isinstance(answer.get("items"), list):
            continue
        for item in answer["items"]:
            try:
                idx, cat = int(item["id"]), Category(item["category"])
            except (KeyError, TypeError, ValueError):
                continue  # категория не из списка — игнорируем ответ
            if 0 <= idx < len(batch) and allowed_for_sign(cat, batch[idx][2]):
                out[start + idx] = cat
    return out


def classify(df: pd.DataFrame, llm: OllamaClient | None = None, owner_name: str | None = None) -> pd.DataFrame:
    """Добавляет колонки category, source (rules|llm|none), rule_id и needs_review.

    owner_name — ФИО владельца ИП из профиля: непонятный перевод от/на его имя = свои средства.
    needs_review — операцию смотрит сотрудник: правила не поняли её, категорию предложила нейросеть
    или правило помечено как неоднозначное (REVIEW_RULES).
    """
    is_owner = owner_matcher(owner_name)
    res = []
    for d, cp, a in zip(df["description"], df["counterparty"], df["amount"]):
        cat, rule_id = classify_by_rules(d, cp, a)
        if cat is Category.UNCLEAR and is_owner(cp):
            cat, rule_id = Category.OWN_TRANSFER, "OWNER_NAME"
        res.append((cat, rule_id))
    df = df.assign(category=[c.value for c, _ in res], rule_id=[r or "" for _, r in res],
                   source=["rules" if c is not Category.UNCLEAR else "none" for c, _ in res])

    unclear = df.index[df["category"] == Category.UNCLEAR.value]
    if llm is not None and len(unclear):  # кэш ответов работает и без живой модели
        # Уникальные пары (назначение, контрагент, знак) — чтобы не спрашивать модель дважды.
        keys = {}
        for i in unclear:
            key = (df.at[i, "description"].strip(), df.at[i, "counterparty"].strip(), df.at[i, "amount"] > 0)
            keys.setdefault(key, []).append(i)
        uniq = list(keys)
        answers = _llm_classify([(d, cp, 1.0 if pos else -1.0) for d, cp, pos in uniq], llm, owner_name)
        for j, cat in answers.items():
            if cat is Category.UNCLEAR:
                continue
            for i in keys[uniq[j]]:
                df.at[i, "category"] = cat.value
                df.at[i, "source"] = "llm"
    return df.assign(needs_review=(df["source"] != "rules") | df["rule_id"].isin(REVIEW_RULES))
