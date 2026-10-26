from datetime import date

import pytest

from app.documents import read_document
from app.pages import tesseract_cmd

from .conftest import DOCS

AS_OF = date(2026, 10, 24)
needs_ocr = pytest.mark.skipif(tesseract_cmd() is None, reason="Tesseract не установлен")


def read(name: str) -> dict:
    return read_document((DOCS / name).read_bytes(), name, as_of=AS_OF)


def values(res: dict) -> dict:
    return {k: v["value"] for k, v in res["fields"].items()}


def codes(res: dict) -> set[str]:
    return {i["code"] for i in res["issues"]}


def test_invoice_fields_with_page_and_quote():
    res = read("S11_01.pdf")
    assert res["document_type"] == "INVOICE" and res["status"] == "EXTRACTED" and not res["needs_review"]
    assert values(res) == {"document_number": "СЧ-S11-01", "document_date": "2026-10-23",
                           "supplier_name": "ООО «Техно-Комплект 571»", "supplier_inn": "9937546571",
                           "buyer_name": "ИП Семёнов Илья Владимирович", "buyer_inn": "991126723717",
                           "total_amount_rub": 3431000.0}
    total = res["fields"]["total_amount_rub"]
    assert total["page"] == 1 and "3 431 000,00" in total["quote"] and total["confidence"] is None


def test_offer_total_from_second_page_without_adding_delivery_twice():
    res = read("S11_02.pdf")
    assert res["document_type"] == "COMMERCIAL_OFFER" and res["issues"] == []
    assert res["fields"]["total_amount_rub"]["value"] == 3431000.0 and res["fields"]["total_amount_rub"]["page"] == 2
    assert [(i["description"], i["quantity"], i["amount_rub"], i["page"]) for i in res["line_items"]] == [
        ("Цифровая печатная машина", 1, 3100000.0, 2), ("Доставка оборудования", 1, 80000.0, 2),
        ("Пусконаладочные работы", 1, 251000.0, 2)]


def test_missing_page_gives_null_total_and_partial_status():
    res = read("04_Неполный_документ.pdf")
    assert res["status"] == "PARTIAL" and res["needs_review"]
    assert res["fields"]["total_amount_rub"]["value"] is None
    assert {"MISSING_PAGE", "FIELD_NOT_FOUND"} <= codes(res)


def test_statement_pdf_reconciles_with_header_and_reference_months():
    res = read("I01_statement.pdf")
    assert res["status"] == "EXTRACTED" and codes(res) == {"TRANSACTIONS_NEED_REVIEW"}
    assert len(res["transactions"]) == 145 and all(t["page"] and t["quote"] for t in res["transactions"])
    assert values(res)["account_holder_inn"] == "990000000115" and values(res)["credit_total_rub"] == 8719117.0
    a = res["analysis"]
    assert a["status"] == "ok" and a["metrics"]["avgMonthlyRevenueRub"]["value"] == 700000.0
    assert [m["revenue"] for m in a["monthly"][:2]] == [560000.0, 840000.0]
    review = [t for t in res["transactions"] if t["needs_review"]]
    assert len(review) == 8 and {t["category"] for t in review} == {"personal"}  # магазины и ЖКУ — человеку


def test_control_operations_loans_own_and_refunds_are_not_revenue():
    res = read("C01_operations.pdf")
    tx = {t["row"]: t for t in res["transactions"]}
    assert [tx[i]["category"] for i in (1, 2, 3, 4, 5)] == ["loan_in", "own_transfer", "refund", "loan_payment",
                                                            "loan_payment"]
    assert tx[10]["category"] == "personal" and tx[11]["needs_review"] and tx[12]["needs_review"]
    assert res["analysis"]["status"] == "manual_input_required"  # одна дата — показателей за период нет


@needs_ocr
def test_scan_inn_is_reread_and_low_resolution_goes_to_review():
    scan = read("S11_01_scan.pdf")
    assert scan["status"] == "EXTRACTED" and values(scan)["buyer_inn"] == "991126723717"
    assert values(scan)["total_amount_rub"] == 3431000.0 and scan["pages"][0]["text_source"] == "ocr"
    low = read("S11_01_low_resolution.pdf")
    assert low["status"] == "NEEDS_REVIEW" and "LOW_RESOLUTION" in codes(low)
    assert all(v is None for v in values(low).values())


@needs_ocr
def test_photo_of_first_page_is_partial_and_not_aggregated():
    res = read("I01_page1_photo.jpg")
    assert res["status"] == "PARTIAL" and res["file"]["pages_declared"] == 6
    assert res["analysis"]["status"] == "manual_input_required" and res["analysis"]["reason"]["code"] == "MISSING_PAGE"
    assert len(res["transactions"]) == 25
