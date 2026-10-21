import time

import pytest
from fastapi.testclient import TestClient

from .conftest import BAD, DEMO


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


def test_explain(client):
    r = client.post("/v1/explain", json={"reason_codes": ["NO_FEASIBLE_TERMS", "SCORE_BELOW_MIN"],
                                         "decision": "DECLINED"}).json()
    assert len(r["items"]) == 2 and r["text"] == r["items"][0]["text"] and r["items"][0]["source"] == "template"
