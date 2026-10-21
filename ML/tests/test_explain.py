import pytest

from app.explain import Explainer, check_rewrite, load_templates
from app.llm import OllamaClient

from .conftest import FakeLLM

OFFER_CTX = {"amount": 800000, "term": 12, "rate": 0.18, "payment": 73344.0}


def test_all_templates_render_without_llm():
    ex = Explainer(llm=None)
    for code, tpl in load_templates().items():
        out = ex.explain(code, tpl.get("decision"), OFFER_CTX | {"fields": ["личные расходы"], "min_contribution": 250000})
        assert out["source"] == "template" and "{" not in out["text"], code


def test_offer_template_has_real_numbers():
    out = Explainer().explain("OFFER_ORIGINAL", "APPROVED", OFFER_CTX, use_llm=False)
    assert "800 000,00 ₽" in out["text"] and "18%" in out["text"] and "73 344,00 ₽" in out["text"]


def test_missing_placeholders_use_short_text():
    out = Explainer().explain("OFFER_ORIGINAL", "APPROVED", {}, use_llm=False)
    assert "{" not in out["text"] and "кабинет" in out["text"]


def test_unknown_code_and_decision_mismatch_are_safe():
    ex = Explainer()
    assert ex.explain("SOMETHING_NEW")["source"] == "generic"
    out = ex.explain("OFFER_ORIGINAL", "DECLINED", OFFER_CTX)
    assert out["source"] == "generic" and "одобр" not in out["text"].lower()


@pytest.mark.parametrize("rewritten,decision,problem", [
    ("Платёж слишком большой для вашего дохода. Подайте заявку на меньшую сумму в кабинете.", "DECLINED", None),
    ("Платёж больше 50 000 ₽ в месяц. Подайте заявку на меньшую сумму в кабинете.", "DECLINED", "new_numbers"),
    ("Ваша заявка одобрена! Посмотрите в кабинете.", "DECLINED", "fake_approval"),
    ("Мы гарантируем выдачу после исправления. Зайдите в кабинет.", None, "overpromise"),
    ("В связи с вышеуказанным заявка отклонена. Кабинет.", "DECLINED", "bureaucratic"),
    ("Платёж слишком большой. Попробуйте меньшую сумму.", "DECLINED", "lost_next_step"),
    ("Раз. Два. Три. Четыре в кабинете.", "DECLINED", "sentences"),
])
def test_guard(rewritten, decision, problem):
    original = "Мы не можем выдать кредит на эту сумму: платёж слишком большой. Подайте новую заявку в кабинете."
    assert check_rewrite(original, rewritten, decision) == problem


def test_same_number_other_format_is_allowed():
    original = "Предлагаем 800 000,00 ₽ на 12 мес. под 18% годовых. Посмотрите условия в кабинете."
    assert check_rewrite(original, "Готовы дать 800000 ₽ на 12 месяцев под 18%. Условия — в кабинете.", "APPROVED") is None


def test_llm_rewrite_used_or_rejected():
    good = "Платёж по такой сумме выходит слишком большим для вашего дохода, даже на самый долгий срок. Попробуйте подать новую заявку на меньшую сумму в кабинете."
    out = Explainer(FakeLLM(lambda m, s: {"text": good})).explain("NO_FEASIBLE_TERMS", "DECLINED")
    assert out["source"] == "llm" and out["text"] == good

    bad = "Кредит одобрен на 1 000 000 ₽!"
    out = Explainer(FakeLLM(lambda m, s: {"text": bad})).explain("NO_FEASIBLE_TERMS", "DECLINED")
    assert out["source"] == "template" and out["rejected"] in {"new_numbers", "fake_approval", "lost_next_step"}

    out = Explainer(FakeLLM(available=False)).explain("NO_FEASIBLE_TERMS", "DECLINED")
    assert out["source"] == "template"


def test_real_client_http_and_cache(fake_ollama_server, tmp_path):
    srv = fake_ollama_server
    srv["reply"] = {"text": "Сейчас проверка временно недоступна, и решение немного задержится. Это не отказ: повторите проверку в кабинете позже."}
    client = OllamaClient(url=srv["url"], enabled=True, cache_path=str(tmp_path / "llm.json"))
    out = Explainer(client).explain("SOURCE_UNAVAILABLE")
    assert out["source"] == "llm"
    req = srv["requests"][0]
    assert req["model"] == "qwen2.5:7b-instruct" and req["stream"] is False and req["format"]["required"] == ["text"]

    # Второй раз — из кэша, без запроса к модели.
    client2 = OllamaClient(url="http://127.0.0.1:1", enabled=True, cache_path=str(tmp_path / "llm.json"))
    assert Explainer(client2).explain("SOURCE_UNAVAILABLE")["source"] == "llm"
    assert len(srv["requests"]) == 1


def test_real_client_unreachable_is_fast():
    client = OllamaClient(url="http://127.0.0.1:1", enabled=True, cache_path="")
    assert client.is_available() is False
    assert Explainer(client).explain("SOURCE_UNAVAILABLE")["source"] == "template"
