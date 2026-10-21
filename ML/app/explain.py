"""Задача 2: код причины решения → 2–3 понятных предложения для клиента.

Шаблон — основа и запасной вариант. Нейросеть только переписывает его своими словами;
ответ проходит проверки (нет новых цифр, нет «одобрено» без одобрения, сохранён следующий шаг),
иначе показываем шаблон как есть.
"""

import json
import re
from pathlib import Path

from .llm import OllamaClient
from .metrics import money

TEMPLATES_PATH = Path(__file__).with_name("templates.json")
GENERIC = "Статус вашей заявки обновился. Подробности и следующий шаг — в кабинете."

REWRITE_PROMPT = """Ты помогаешь банку объяснять предпринимателю решение по заявке на кредит.
Перепиши текст своими словами: 2–3 коротких предложения, вежливо и просто, как живой человек, без канцелярита.
Обязательно сохрани смысл и следующий шаг для клиента.
Запрещено:
- добавлять цифры, суммы, сроки и проценты, которых нет в исходном тексте;
- писать, что кредит одобрен или будет одобрен, если этого нет в исходном тексте;
- обещать то, чего нет в исходном тексте.
Верни только JSON вида {"text": "..."}."""

BUREAUCRATIC = re.compile(r"в связи с|вышеуказанн|осуществлен|данн(ый|ая|ой|ую) заявк|в рамках|уведомляем", re.I)
OVERPROMISE = re.compile(r"гарантир|100\s*%|обязательно (одобр|выда)|точно (одобр|выда)", re.I)
APPROVAL = re.compile(r"одобр", re.I)
NUMBER = re.compile(r"\d[\d\s]*(?:[.,]\d+)?")


def load_templates(path: Path = TEMPLATES_PATH) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    return {k: v for k, v in data.items() if not k.startswith("_")}


def _fmt(key: str, value) -> str:
    if isinstance(value, (int, float)) and key in {"amount", "payment", "min_contribution"}:
        return money(float(value))
    if isinstance(value, (int, float)) and key == "rate":
        pct = value * 100 if value < 1 else value
        return f"{pct:g}%".replace(".", ",")
    if isinstance(value, list):
        return ", ".join(map(str, value))
    return str(value)


def render(template: dict, context: dict) -> str:
    try:
        return template["text"].format(**{k: _fmt(k, v) for k, v in (context or {}).items()})
    except (KeyError, IndexError, ValueError):
        return template.get("text_short", GENERIC)


def _numbers(text: str) -> set[float]:
    """Все числа текста: «800 000,00» и «800000» — одно и то же число."""
    return {float(re.sub(r"\s", "", n).replace(",", ".")) for n in NUMBER.findall(text)}


def _sentences(text: str) -> int:
    # Новое предложение — после .!? и пробела с заглавной буквы («12 мес. под 18%» — одно предложение).
    return len([s for s in re.split(r"(?<=[.!?])\s+(?=[А-ЯЁA-Z])", text.strip()) if s])


def check_rewrite(original: str, rewritten: str, decision: str | None) -> str | None:
    """Возвращает причину отклонения переписанного текста или None, если он допустим."""
    if not rewritten or not re.search(r"[а-яё]", rewritten, re.I):
        return "empty"
    if not 20 <= len(rewritten) <= 450:
        return "length"
    if not 1 <= _sentences(rewritten) <= 3:
        return "sentences"
    if not _numbers(rewritten) <= _numbers(original):
        return "new_numbers"
    if decision != "APPROVED" and APPROVAL.search(rewritten) and not APPROVAL.search(original):
        return "fake_approval"
    if OVERPROMISE.search(rewritten) and not OVERPROMISE.search(original):
        return "overpromise"
    if BUREAUCRATIC.search(rewritten):
        return "bureaucratic"
    if "кабинет" in original.lower() and "кабинет" not in rewritten.lower():
        return "lost_next_step"
    return None


class Explainer:
    def __init__(self, llm: OllamaClient | None = None, templates: dict | None = None):
        self.llm = llm
        self.templates = templates if templates is not None else load_templates()

    def explain(self, reason_code: str, decision: str | None = None, context: dict | None = None,
                use_llm: bool = True) -> dict:
        tpl = self.templates.get(reason_code)
        if tpl is None:
            return {"reason_code": reason_code, "text": GENERIC, "source": "generic", "rejected": None}
        if tpl.get("decision") and decision and tpl["decision"] != decision:
            # Код причины не соответствует решению — не показываем текст, который может ввести в заблуждение.
            return {"reason_code": reason_code, "text": GENERIC, "source": "generic", "rejected": "decision_mismatch"}
        decision = decision or tpl.get("decision")
        base = render(tpl, context or {})
        out = {"reason_code": reason_code, "text": base, "source": "template", "rejected": None}
        if not (use_llm and self.llm):
            return out
        answer = self.llm.chat_json(
            [{"role": "system", "content": REWRITE_PROMPT},
             {"role": "user", "content": json.dumps({"text": base}, ensure_ascii=False)}],
            schema={"type": "object", "properties": {"text": {"type": "string"}}, "required": ["text"]},
            options={"temperature": 0.3, "seed": 42, "num_predict": 220}, timeout_s=15)
        text = (answer or {}).get("text", "")
        text = re.sub(r"\s+", " ", text if isinstance(text, str) else "").strip()
        problem = check_rewrite(base, text, decision) if answer else "llm_unavailable"
        if problem is None:
            out.update(text=text, source="llm")
        else:
            out["rejected"] = problem
        return out
