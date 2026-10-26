import hashlib
import time

import pytest
from fastapi.testclient import TestClient

from .conftest import BAD, DEMO, DOCS


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("LLM_ENABLED", "0")
    monkeypatch.setenv("RESULT_CACHE_DIR", str(tmp_path / "results"))
    import importlib

    import app.api
    importlib.reload(app.api)
    return TestClient(app.api.app)


def test_health(client):
    r = client.get("/health").json()
    assert r["status"] == "ok" and r["llm"]["enabled"] is False


def test_analyze_fast_and_cached(client):
    files = {"file": ("ivanov.csv", (DEMO / "ivanov.csv").read_bytes(), "text/csv")}
    t = time.monotonic()
    r = client.post("/v1/statement/analyze?as_of=2026-10-21", files=files).json()
    assert time.monotonic() - t < 3
    assert r["status"] == "ok" and r["cached"] is False
    assert r["metrics"]["avgMonthlyRevenueRub"]["value"] == 700000.0
    r2 = client.post("/v1/statement/analyze?as_of=2026-10-21", files=files).json()
    assert r2["cached"] is True and r2["metrics"] == r["metrics"]


def test_analyze_bad_file(client):
    r = client.post("/v1/statement/analyze", files={"file": ("empty.csv", (BAD / "empty.csv").read_bytes())}).json()
    assert r["status"] == "manual_input_required" and r["reason"]["code"] == "EMPTY_FILE"


def test_statement_accepts_form_fields_and_pdf(client):
    """Бэкенд шлёт as_of и owner_name полями формы, а не в query; PDF-выписка идёт через чтение документов."""
    r = client.post("/v1/statement/analyze", data={"as_of": "2026-10-21", "owner_name": "Иванов Иван Иванович"},
                    files={"file": ("ivanov.csv", (DEMO / "ivanov.csv").read_bytes(), "text/csv")}).json()
    assert r["status"] == "ok" and r["period"]["as_of"] == "2026-10-21"
    r = client.post("/v1/statement/analyze", data={"as_of": "2026-10-24"},
                    files={"file": ("I01.pdf", (DOCS / "I01_statement.pdf").read_bytes(), "application/pdf")}).json()
    assert r["status"] == "ok" and r["metrics"]["avgMonthlyRevenueRub"]["value"] == 700000.0
    r = client.post("/v1/statement/analyze", files={"file": ("s.pdf", (DOCS / "S11_01.pdf").read_bytes())}).json()
    assert r["status"] == "manual_input_required" and r["reason"]["code"] == "NOT_A_STATEMENT"


def test_read_document_is_bound_to_file_version(client):
    raw = (DOCS / "S11_01.pdf").read_bytes()
    form = {"document_id": "doc-1", "document_version": "3", "run_id": "run-7"}
    r = client.post("/v1/documents/read", data=form, files={"file": ("S11_01.pdf", raw)}).json()
    assert r["document"] == {**{k: form[k] for k in ("document_id", "document_version")},
                             "sha256": hashlib.sha256(raw).hexdigest()}
    assert r["run"]["run_id"] == "run-7" and r["status"] == "EXTRACTED" and r["cached"] is False
    again = client.post("/v1/documents/read", data={**form, "document_version": "4"},
                        files={"file": ("S11_01.pdf", raw)}).json()
    assert again["cached"] is True and again["document"]["document_version"] == "4"  # метаданные — из запроса
    r = client.post("/v1/documents/read", data={**form, "expected_sha256": "0" * 64},
                    files={"file": ("S11_01.pdf", raw)}).json()
    assert r["status"] == "FAILED" and r["issues"][0]["code"] == "FILE_VERSION_MISMATCH"


def test_explain(client):
    r = client.post("/v1/explain", json={"reason_codes": ["NO_FEASIBLE_TERMS", "SCORE_BELOW_MIN"],
                                         "decision": "DECLINED"}).json()
    assert len(r["items"]) == 2 and r["text"] == r["items"][0]["text"] and r["items"][0]["source"] == "template"
