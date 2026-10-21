"""Категории операций выписки и их роль в расчёте показателей."""

from enum import Enum


class Category(str, Enum):
    REVENUE = "revenue"            # выручка от клиентов
    LOAN_IN = "loan_in"            # получение кредита / займа
    OWN_TRANSFER = "own_transfer"  # перевод своих средств (в обе стороны)
    REFUND = "refund"              # возврат платежа (в обе стороны)
    EXPENSE = "expense"            # операционные расходы: аренда, зарплата, закупки, услуги
    LOAN_PAYMENT = "loan_payment"  # погашение кредита, проценты, лизинг
    TAX = "tax"                    # налоги и страховые взносы
    UNCLEAR = "unclear"            # не удалось определить


RU_NAMES = {
    Category.REVENUE: "выручка",
    Category.LOAN_IN: "кредит/заём (поступление)",
    Category.OWN_TRANSFER: "перевод собственных средств",
    Category.REFUND: "возврат платежа",
    Category.EXPENSE: "операционный расход",
    Category.LOAN_PAYMENT: "платёж по кредиту",
    Category.TAX: "налог / взнос",
    Category.UNCLEAR: "неясно",
}

# Какие категории допустимы для прихода (+) и расхода (−).
INFLOW_CATEGORIES = {Category.REVENUE, Category.LOAN_IN, Category.OWN_TRANSFER, Category.REFUND}
OUTFLOW_CATEGORIES = {Category.EXPENSE, Category.LOAN_PAYMENT, Category.TAX, Category.OWN_TRANSFER, Category.REFUND}


def allowed_for_sign(category: Category, amount: float) -> bool:
    if category is Category.UNCLEAR:
        return True
    return category in (INFLOW_CATEGORIES if amount > 0 else OUTFLOW_CATEGORIES)
