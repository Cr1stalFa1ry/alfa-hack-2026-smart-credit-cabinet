"""HTTP-сервис ML. Swagger: /docs, схема: /openapi.json."""

import hashlib
import logging
import os
from datetime import date, datetime, timezone
from typing import Literal

from fastapi import FastAPI, File, Form, Query, UploadFile
from pydantic import BaseModel, Field

from . import PIPELINE_VERSION
from .analyzer import manual_input
from .cache import ResultCache, cached_analyze, cached_read
from .categories import RU_NAMES
from .documents import failed, statement_view
from .explain import Explainer
from .llm import OllamaClient
from .pages import is_document, tesseract_cmd

logging.basicConfig(level=logging.INFO)

MAX_FILE_BYTES = 20 * 1024 * 1024

app = FastAPI(title="Smart Credit Cabinet — ML", version=PIPELINE_VERSION,
              description="Чтение документов анкеты (счёт, КП, выписка), анализ выписки и объяснение решения.")
cache = ResultCache()
llm = OllamaClient(cache_path=os.getenv("LLM_CACHE_PATH", str(cache.dir.parent / "llm_cache.json")))
explainer = Explainer(llm)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "version": PIPELINE_VERSION, "llm": llm.info(), "ocr": tesseract_cmd() is not None}


@app.get("/v1/categories")
def categories() -> dict:
    return {c.value: name for c, name in RU_NAMES.items()}


async def _read(file: UploadFile) -> bytes | None:
    raw = await file.read(MAX_FILE_BYTES + 1)
    return None if len(raw) > MAX_FILE_BYTES else raw


@app.post("/v1/statement/analyze")
async def analyze_statement(
    file: UploadFile = File(..., description="Выписка: CSV, XLSX, PDF, скан или фото"),
    as_of: date | None = Query(None, description="Дата рассмотрения (F27). Текущий месяц не учитывается."),
    use_llm: bool = Query(True, description="Спрашивать нейросеть о непонятых строках"),
    include_transactions: bool = Query(False, description="Вернуть все операции с категориями"),
    owner_name: str | None = Query(None, description="ФИО владельца ИП (F01): переводы от/на его имя = свои средства"),
    as_of_form: date | None = Form(None, alias="as_of", description="То же, что as_of, полем формы"),
    owner_name_form: str | None = Form(None, alias="owner_name", description="То же, что owner_name, полем формы"),
) -> dict:
    if (raw := await _read(file)) is None:
        return manual_input("FILE_TOO_LARGE", f"Файл больше {MAX_FILE_BYTES // 2**20} МБ.")
    as_of, owner_name = as_of or as_of_form or date.today(), owner_name or owner_name_form
    model = llm if use_llm else None
    if is_document(raw):  # PDF, скан, фото: тот же разбор, что в /v1/documents/read
        doc = cached_read(cache, raw, file.filename or "", as_of, model, owner_name)
        return {**statement_view(doc, include_transactions), "cached": doc["cached"]}
    return cached_analyze(cache, raw, file.filename or "", as_of, model, include_transactions, owner_name)


@app.post("/v1/documents/read")
async def read_document(
    file: UploadFile = File(..., description="Счёт, КП или выписка: PDF, JPG/PNG/TIFF, CSV, XLSX"),
    document_id: str | None = Form(None, description="ID документа в бэкенде — возвращается как есть"),
    document_version: str | None = Form(None, description="Версия файла в бэкенде — возвращается как есть"),
    run_id: str | None = Form(None, description="ID запуска чтения — возвращается как есть"),
    expected_sha256: str | None = Form(None, description="sha256 версии по данным бэкенда; не совпал — FAILED"),
    as_of: date | None = Form(None, description="Дата рассмотрения: для показателей выписки"),
    owner_name: str | None = Form(None, description="ФИО владельца ИП: переводы от/на его имя = свои средства"),
    use_llm: bool = Form(True, description="Спрашивать нейросеть о непонятых операциях выписки"),
) -> dict:
    meta = {"document": {"document_id": document_id, "document_version": document_version},
            "run": {"run_id": run_id, "processed_at": datetime.now(timezone.utc).isoformat(timespec="seconds")}}
    if (raw := await _read(file)) is None:
        return {**failed("FILE_TOO_LARGE", f"Файл больше {MAX_FILE_BYTES // 2**20} МБ."), **meta}
    sha = hashlib.sha256(raw).hexdigest()
    meta["document"]["sha256"] = sha
    if expected_sha256 and expected_sha256.lower() != sha:
        return {**failed("FILE_VERSION_MISMATCH", "Файл не совпадает с версией, указанной бэкендом: результат "
                                                  "не применять.", raw, file.filename or ""), **meta}
    doc = cached_read(cache, raw, file.filename or "", as_of or date.today(), llm if use_llm else None, owner_name)
    return {**meta, **doc}


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
