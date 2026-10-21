"""HTTP-сервис ML. Swagger: /docs, схема: /openapi.json."""

import logging
import os
from datetime import date
from typing import Literal

from fastapi import FastAPI, File, Query, UploadFile
from pydantic import BaseModel, Field

from . import PIPELINE_VERSION
from .cache import ResultCache, cached_analyze
from .categories import RU_NAMES
from .explain import Explainer
from .llm import OllamaClient

logging.basicConfig(level=logging.INFO)

MAX_FILE_BYTES = 10 * 1024 * 1024

app = FastAPI(title="Smart Credit Cabinet — ML", version=PIPELINE_VERSION,
              description="Анализ выписки по счёту ИП и объяснение решения клиенту.")
cache = ResultCache()
llm = OllamaClient(cache_path=os.getenv("LLM_CACHE_PATH", str(cache.dir.parent / "llm_cache.json")))
explainer = Explainer(llm)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "version": PIPELINE_VERSION, "llm": llm.info()}


@app.get("/v1/categories")
def categories() -> dict:
    return {c.value: name for c, name in RU_NAMES.items()}


@app.post("/v1/statement/analyze")
async def analyze_statement(
    file: UploadFile = File(..., description="CSV или XLSX: date, amount, counterparty, description"),
    as_of: date | None = Query(None, description="Дата рассмотрения (F27). Текущий месяц не учитывается."),
    use_llm: bool = Query(True, description="Спрашивать нейросеть о непонятых строках"),
    include_transactions: bool = Query(False, description="Вернуть все операции с категориями"),
    owner_name: str | None = Query(None, description="ФИО владельца ИП (F01): переводы от/на его имя = свои средства"),
) -> dict:
    raw = await file.read(MAX_FILE_BYTES + 1)
    if len(raw) > MAX_FILE_BYTES:
        return {"status": "manual_input_required", "display": "нужен ручной ввод",
                "reason": {"code": "FILE_TOO_LARGE", "message": "Файл больше 10 МБ."},
                "pipeline_version": PIPELINE_VERSION}
    return cached_analyze(cache, raw, file.filename or "", as_of or date.today(),
                          llm if use_llm else None, include_transactions, owner_name)


class ExplainRequest(BaseModel):
    reason_codes: list[str] = Field(..., min_length=1, examples=[["NO_FEASIBLE_TERMS"]])
    decision: Literal["APPROVED", "DECLINED"] | None = Field(None, description="null — решения пока нет")
    context: dict = Field(default_factory=dict, examples=[{"amount": 800000, "term": 12, "rate": 0.18,
                                                           "payment": 73344.0}])
    use_llm: bool = True


@app.post("/v1/explain")
def explain(req: ExplainRequest) -> dict:
    items = [explainer.explain(code, req.decision, req.context, req.use_llm) for code in req.reason_codes]
    return {"text": items[0]["text"], "items": items}
