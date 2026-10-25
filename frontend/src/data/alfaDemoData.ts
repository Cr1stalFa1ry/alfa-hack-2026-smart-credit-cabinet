// Auto-generated synthetic datasets from "Альфа — кабинет со скорингом.html"
export interface DemoApplication {
  application_id: string;
  full_name: string;
  inn: string;
  ogrnip: string;
  registration_date: string;
  okved_main?: string;
  registry_status?: string;
  phone?: string;
  email?: string;
  stage?: "operating" | "new" | "paused" | string;
  purpose?: string;
  amount_rub?: string | number;
  requested_term_months?: string | number;
  tax_regime?: string;
  own_bank_client?: string;
  applicant_match?: string;
  activity_first_full_month?: string;
  [key: string]: any;
}

export interface DemoPassport {
  applicant_inn: string;
  full_name: string;
  series: string;
  number: string;
  birth_date: string;
  issue_date: string;
  issuer: string;
  department_code: string;
  [key: string]: any;
}

export interface DemoFact {
  application_id: string;
  month: string;
  clean_receipts_rub: string | number;
  operating_outflow_rub: string | number;
  [key: string]: any;
}

export interface DemoDebt {
  application_id: string;
  source: string;
  obligation_ref: string;
  kind: string;
  monthly_max_payment_rub: string | number;
  [key: string]: any;
}

export interface DemoIncome {
  application_id: string;
  month: string;
  net_income_rub: string | number;
  [key: string]: any;
}

export interface DemoSupplier {
  inn: string;
  ogrn: string;
  name: string;
  registration_date: string;
  status: string;
  address: string;
  mass_address?: string;
  phone?: string;
  email?: string;
  director_inn?: string;
  [key: string]: any;
}

export interface DemoProperty {
  property_id: string;
  cadastral_number: string;
  property_type: string;
  address: string;
  area_sqm: string | number;
  ownership_type: string;
  encumbrance_status: string;
  [key: string]: any;
}

export interface DemoScoringConfig {
  version: string;
  source: string;
  assessmentAsOf: string;
  demonstrationOnly: boolean;
  parameters: any;
  products: any;
}


export const ALFA_DATA: {
  applications: DemoApplication[];
  passports: DemoPassport[];
  facts: DemoFact[];
  debts: DemoDebt[];
  income: DemoIncome[];
  suppliers: DemoSupplier[];
  properties: DemoProperty[];
  scoringConfig: any;
} = {
  "applications": [
    {
      "application_id": "DEMO-001",
      "full_name": "Иванов Сергей Петрович",
      "inn": "990000000115",
      "ogrnip": "321504530351107",
      "registration_date": "2021-09-01",
      "phone": "+7 981 214-13-45",
      "email": "ip000115@example.com",
      "own_bank_client": "да",
      "stage": "operating",
      "purpose": "working_capital",
      "product_code": "WC",
      "amount_rub": "800000.00",
      "requested_term_months": "12",
      "equipment_price_rub": "",
      "own_contribution_rub": "",
      "available_own_funds_rub": "",
      "invoice_confirmed": "",
      "startup_budget_total_rub": "",
      "startup_own_funds_rub": "",
      "pd_consent": "да",
      "automated_decision_consent": "да",
      "registry_status": "ACTIVE",
      "applicant_match": "PASS",
      "check_status": "SUCCESS",
      "failed_source": "",
      "bki_consent": "да",
      "person_history": "FOUND",
      "business_history": "PRESENT",
      "max_overdue_days_12m": "0",
      "current_overdue_rub": "0.00",
      "tax_debt_rub": "",
      "kyc_risk_level": "LOW",
      "fns_account_block": "нет",
      "bankruptcy_status": "NONE",
      "business_facts_state": "AVAILABLE",
      "activity_first_full_month": "2021-10",
      "household_expenses_monthly_rub": "50000.00",
      "other_income_state": "",
      "business_committed_costs_monthly_rub": "",
      "obligations_declaration_complete": "да",
      "verification_status": "CONFIRMED",
      "obligations_reconciled": "да",
      "repayment_source_confirmed": "да",
      "income_continuity_confirmed": "да",
      "findings_complete": "да",
      "supplier_inn": "",
      "equipment_category": "",
      "supplier_registration_date": "",
      "supplier_status": "",
      "supplier_mass_address": "",
      "supplier_linked_to_applicant": "",
      "equipment_reference_price_rub": "",
      "duplicate_contacts": "нет",
      "statement_unmatched_loan_payments": "нет",
      "statement_needs_review": "нет",
      "okved_main": "47.11",
      "tax_regime": "УСН (доходы)",
      "region_name": "Московская область"
    },
    {
      "application_id": "DEMO-025",
      "full_name": "Петров Алексей Николаевич",
      "inn": "990000000362",
      "ogrnip": "323662646979081",
      "registration_date": "2023-09-01",
      "phone": "+7 922 570-78-53",
      "email": "ip000362@example.com",
      "own_bank_client": "нет",
      "stage": "operating",
      "purpose": "equipment",
      "product_code": "EQ",
      "amount_rub": "2250000.00",
      "requested_term_months": "24",
      "equipment_price_rub": "2500000.00",
      "own_contribution_rub": "250000.00",
      "available_own_funds_rub": "350000.00",
      "invoice_confirmed": "да",
      "startup_budget_total_rub": "",
      "startup_own_funds_rub": "",
      "pd_consent": "да",
      "automated_decision_consent": "да",
      "registry_status": "ACTIVE",
      "applicant_match": "PASS",
      "check_status": "SUCCESS",
      "failed_source": "",
      "bki_consent": "да",
      "person_history": "FOUND",
      "business_history": "PRESENT",
      "max_overdue_days_12m": "10",
      "current_overdue_rub": "0.00",
      "tax_debt_rub": "",
      "kyc_risk_level": "LOW",
      "fns_account_block": "нет",
      "bankruptcy_status": "NONE",
      "business_facts_state": "AVAILABLE",
      "activity_first_full_month": "2023-10",
      "household_expenses_monthly_rub": "20000.00",
      "other_income_state": "",
      "business_committed_costs_monthly_rub": "",
      "obligations_declaration_complete": "да",
      "verification_status": "CONFIRMED",
      "obligations_reconciled": "да",
      "repayment_source_confirmed": "да",
      "income_continuity_confirmed": "да",
      "findings_complete": "да",
      "supplier_inn": "9993280999",
      "equipment_category": "EQ-011",
      "supplier_registration_date": "2020-10-15",
      "supplier_status": "ACTIVE",
      "supplier_mass_address": "нет",
      "supplier_linked_to_applicant": "нет",
      "equipment_reference_price_rub": "2668000.00",
      "duplicate_contacts": "нет",
      "statement_unmatched_loan_payments": "нет",
      "statement_needs_review": "нет",
      "okved_main": "18.12",
      "tax_regime": "ПСН",
      "region_name": "Свердловская область"
    },
    {
      "application_id": "DEMO-062",
      "full_name": "Сидорова Анна Викторовна",
      "inn": "990000000299",
      "ogrnip": "326525375772138",
      "registration_date": "2026-10-01",
      "phone": "+7 937 727-16-98",
      "email": "ip000299@example.com",
      "own_bank_client": "да",
      "stage": "prelaunch",
      "purpose": "equipment",
      "product_code": "EQ",
      "amount_rub": "1600000.00",
      "requested_term_months": "24",
      "equipment_price_rub": "2000000.00",
      "own_contribution_rub": "400000.00",
      "available_own_funds_rub": "500000.00",
      "invoice_confirmed": "да",
      "startup_budget_total_rub": "",
      "startup_own_funds_rub": "",
      "pd_consent": "да",
      "automated_decision_consent": "да",
      "registry_status": "ACTIVE",
      "applicant_match": "PASS",
      "check_status": "SUCCESS",
      "failed_source": "",
      "bki_consent": "да",
      "person_history": "NO_RECORD",
      "business_history": "NONE",
      "max_overdue_days_12m": "0",
      "current_overdue_rub": "0.00",
      "tax_debt_rub": "",
      "kyc_risk_level": "LOW",
      "fns_account_block": "нет",
      "bankruptcy_status": "NONE",
      "business_facts_state": "NO_HISTORY",
      "activity_first_full_month": "",
      "household_expenses_monthly_rub": "150000.00",
      "other_income_state": "AVAILABLE",
      "business_committed_costs_monthly_rub": "20000.00",
      "obligations_declaration_complete": "да",
      "verification_status": "CONFIRMED",
      "obligations_reconciled": "да",
      "repayment_source_confirmed": "да",
      "income_continuity_confirmed": "да",
      "findings_complete": "да",
      "supplier_inn": "9991205481",
      "equipment_category": "EQ-027",
      "supplier_registration_date": "2010-04-15",
      "supplier_status": "ACTIVE",
      "supplier_mass_address": "нет",
      "supplier_linked_to_applicant": "нет",
      "equipment_reference_price_rub": "1889000.00",
      "duplicate_contacts": "нет",
      "statement_unmatched_loan_payments": "",
      "statement_needs_review": "",
      "okved_main": "31.01",
      "tax_regime": "УСН (доходы)",
      "region_name": "Нижегородская область"
    },
    {
      "application_id": "DEMO-097",
      "full_name": "Кузнецова Мария Олеговна",
      "inn": "990000000436",
      "ogrnip": "326540606119122",
      "registration_date": "2026-10-01",
      "phone": "+7 997 740-53-58",
      "email": "ip000436@example.com",
      "own_bank_client": "нет",
      "stage": "prelaunch",
      "purpose": "working_capital",
      "product_code": "START",
      "amount_rub": "300000.00",
      "requested_term_months": "12",
      "equipment_price_rub": "",
      "own_contribution_rub": "",
      "available_own_funds_rub": "",
      "invoice_confirmed": "",
      "startup_budget_total_rub": "300000.00",
      "startup_own_funds_rub": "0.00",
      "pd_consent": "да",
      "automated_decision_consent": "да",
      "registry_status": "ACTIVE",
      "applicant_match": "PASS",
      "check_status": "SUCCESS",
      "failed_source": "",
      "bki_consent": "да",
      "person_history": "NO_RECORD",
      "business_history": "NONE",
      "max_overdue_days_12m": "0",
      "current_overdue_rub": "0.00",
      "tax_debt_rub": "",
      "kyc_risk_level": "LOW",
      "fns_account_block": "нет",
      "bankruptcy_status": "NONE",
      "business_facts_state": "NO_HISTORY",
      "activity_first_full_month": "",
      "household_expenses_monthly_rub": "30000.00",
      "other_income_state": "AVAILABLE",
      "business_committed_costs_monthly_rub": "20000.00",
      "obligations_declaration_complete": "да",
      "verification_status": "CONFIRMED",
      "obligations_reconciled": "да",
      "repayment_source_confirmed": "да",
      "income_continuity_confirmed": "да",
      "findings_complete": "да",
      "supplier_inn": "",
      "equipment_category": "",
      "supplier_registration_date": "",
      "supplier_status": "",
      "supplier_mass_address": "",
      "supplier_linked_to_applicant": "",
      "equipment_reference_price_rub": "",
      "duplicate_contacts": "нет",
      "statement_unmatched_loan_payments": "",
      "statement_needs_review": "",
      "okved_main": "56.10",
      "tax_regime": "НПД",
      "region_name": "Новосибирская область"
    }
  ],
  "passports": [
    {
      "applicant_inn": "990000000115",
      "full_name": "Иванов Сергей Петрович",
      "birth_date": "1983-01-09",
      "series": "9900",
      "number": "000001",
      "issue_date": "2026-03-25",
      "issuer": "СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 001 — НЕ ДЕЙСТВИТЕЛЬНО",
      "department_code": "000-000",
      "document_status": "ON_FILE",
      "verified_at": "2026-10-21",
      "is_synthetic": "true"
    },
    {
      "applicant_inn": "990000000362",
      "full_name": "Петров Алексей Николаевич",
      "birth_date": "1976-01-27",
      "series": "9900",
      "number": "000025",
      "issue_date": "2011-03-11",
      "issuer": "СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 025 — НЕ ДЕЙСТВИТЕЛЬНО",
      "department_code": "000-000",
      "document_status": "ON_FILE",
      "verified_at": "2024-10-21",
      "is_synthetic": "true"
    },
    {
      "applicant_inn": "990000000299",
      "full_name": "Сидорова Анна Викторовна",
      "birth_date": "1980-01-06",
      "series": "9900",
      "number": "000062",
      "issue_date": "2026-03-09",
      "issuer": "СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 062 — НЕ ДЕЙСТВИТЕЛЬНО",
      "department_code": "000-000",
      "document_status": "ON_FILE",
      "verified_at": "2026-10-21",
      "is_synthetic": "true"
    },
    {
      "applicant_inn": "990000000436",
      "full_name": "Кузнецова Мария Олеговна",
      "birth_date": "1979-01-24",
      "series": "9900",
      "number": "000097",
      "issue_date": "2026-03-17",
      "issuer": "СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 097 — НЕ ДЕЙСТВИТЕЛЬНО",
      "department_code": "000-000",
      "document_status": "ON_FILE",
      "verified_at": "2026-10-21",
      "is_synthetic": "true"
    }
  ],
  "facts": [
    {
      "application_id": "DEMO-001",
      "month": "2025-10",
      "clean_receipts_rub": "560000.00",
      "operating_outflow_rub": "110000.00"
    },
    {
      "application_id": "DEMO-001",
      "month": "2025-11",
      "clean_receipts_rub": "840000.00",
      "operating_outflow_rub": "390000.00"
    },
    {
      "application_id": "DEMO-001",
      "month": "2025-12",
      "clean_receipts_rub": "560000.00",
      "operating_outflow_rub": "110000.00"
    },
    {
      "application_id": "DEMO-001",
      "month": "2026-01",
      "clean_receipts_rub": "840000.00",
      "operating_outflow_rub": "390000.00"
    },
    {
      "application_id": "DEMO-001",
      "month": "2026-02",
      "clean_receipts_rub": "560000.00",
      "operating_outflow_rub": "110000.00"
    },
    {
      "application_id": "DEMO-001",
      "month": "2026-03",
      "clean_receipts_rub": "840000.00",
      "operating_outflow_rub": "390000.00"
    },
    {
      "application_id": "DEMO-001",
      "month": "2026-04",
      "clean_receipts_rub": "560000.00",
      "operating_outflow_rub": "110000.00"
    },
    {
      "application_id": "DEMO-001",
      "month": "2026-05",
      "clean_receipts_rub": "840000.00",
      "operating_outflow_rub": "390000.00"
    },
    {
      "application_id": "DEMO-001",
      "month": "2026-06",
      "clean_receipts_rub": "560000.00",
      "operating_outflow_rub": "110000.00"
    },
    {
      "application_id": "DEMO-001",
      "month": "2026-07",
      "clean_receipts_rub": "840000.00",
      "operating_outflow_rub": "390000.00"
    },
    {
      "application_id": "DEMO-001",
      "month": "2026-08",
      "clean_receipts_rub": "560000.00",
      "operating_outflow_rub": "110000.00"
    },
    {
      "application_id": "DEMO-001",
      "month": "2026-09",
      "clean_receipts_rub": "840000.00",
      "operating_outflow_rub": "390000.00"
    },
    {
      "application_id": "DEMO-025",
      "month": "2025-10",
      "clean_receipts_rub": "220000.00",
      "operating_outflow_rub": "130000.00"
    },
    {
      "application_id": "DEMO-025",
      "month": "2025-11",
      "clean_receipts_rub": "580000.00",
      "operating_outflow_rub": "130000.00"
    },
    {
      "application_id": "DEMO-025",
      "month": "2025-12",
      "clean_receipts_rub": "220000.00",
      "operating_outflow_rub": "130000.00"
    },
    {
      "application_id": "DEMO-025",
      "month": "2026-01",
      "clean_receipts_rub": "580000.00",
      "operating_outflow_rub": "130000.00"
    },
    {
      "application_id": "DEMO-025",
      "month": "2026-02",
      "clean_receipts_rub": "220000.00",
      "operating_outflow_rub": "130000.00"
    },
    {
      "application_id": "DEMO-025",
      "month": "2026-03",
      "clean_receipts_rub": "580000.00",
      "operating_outflow_rub": "130000.00"
    },
    {
      "application_id": "DEMO-025",
      "month": "2026-04",
      "clean_receipts_rub": "220000.00",
      "operating_outflow_rub": "130000.00"
    },
    {
      "application_id": "DEMO-025",
      "month": "2026-05",
      "clean_receipts_rub": "580000.00",
      "operating_outflow_rub": "130000.00"
    },
    {
      "application_id": "DEMO-025",
      "month": "2026-06",
      "clean_receipts_rub": "220000.00",
      "operating_outflow_rub": "130000.00"
    },
    {
      "application_id": "DEMO-025",
      "month": "2026-07",
      "clean_receipts_rub": "580000.00",
      "operating_outflow_rub": "130000.00"
    },
    {
      "application_id": "DEMO-025",
      "month": "2026-08",
      "clean_receipts_rub": "220000.00",
      "operating_outflow_rub": "130000.00"
    },
    {
      "application_id": "DEMO-025",
      "month": "2026-09",
      "clean_receipts_rub": "580000.00",
      "operating_outflow_rub": "130000.00"
    }
  ],
  "debts": [
    {
      "application_id": "DEMO-001",
      "source": "declared",
      "obligation_ref": "DEBT-S1-A",
      "kind": "loan",
      "monthly_max_payment_rub": "30000.00"
    },
    {
      "application_id": "DEMO-001",
      "source": "bki",
      "obligation_ref": "DEBT-S1-A",
      "kind": "loan",
      "monthly_max_payment_rub": "30000.00"
    },
    {
      "application_id": "DEMO-025",
      "source": "declared",
      "obligation_ref": "DEBT-S3-A",
      "kind": "loan",
      "monthly_max_payment_rub": "60000.00"
    },
    {
      "application_id": "DEMO-025",
      "source": "bki",
      "obligation_ref": "DEBT-S3-A",
      "kind": "loan",
      "monthly_max_payment_rub": "60000.00"
    }
  ],
  "income": [
    {
      "application_id": "DEMO-062",
      "month": "2026-07",
      "net_income_rub": "300000.00"
    },
    {
      "application_id": "DEMO-062",
      "month": "2026-08",
      "net_income_rub": "300000.00"
    },
    {
      "application_id": "DEMO-062",
      "month": "2026-09",
      "net_income_rub": "300000.00"
    },
    {
      "application_id": "DEMO-097",
      "month": "2026-07",
      "net_income_rub": "100000.00"
    },
    {
      "application_id": "DEMO-097",
      "month": "2026-08",
      "net_income_rub": "100000.00"
    },
    {
      "application_id": "DEMO-097",
      "month": "2026-09",
      "net_income_rub": "100000.00"
    }
  ],
  "suppliers": [
    {
      "inn": "9990927815",
      "ogrn": "1147750944870",
      "name": "ООО «Техно-Сервис 815»",
      "registration_date": "2014-09-15",
      "status": "ACTIVE",
      "address": "г. Москва, ул. Промышленная, д. 29",
      "mass_address": "нет",
      "phone": "+7 495 396-13-38",
      "email": "sales7815@example.org",
      "director_inn": ""
    },
    {
      "inn": "9901477331",
      "ogrn": "1097768949419",
      "name": "ООО «Техно-Сервис 331»",
      "registration_date": "2009-10-15",
      "status": "ACTIVE",
      "address": "г. Москва, ул. Промышленная, д. 89",
      "mass_address": "нет",
      "phone": "+7 495 410-98-91",
      "email": "sales7331@example.org",
      "director_inn": ""
    },
    {
      "inn": "9967955733",
      "ogrn": "1147709872174",
      "name": "ООО «Индустрия-Маркет 733»",
      "registration_date": "2014-10-15",
      "status": "ACTIVE",
      "address": "г. Москва, ул. Промышленная, д. 44",
      "mass_address": "нет",
      "phone": "+7 495 961-46-89",
      "email": "sales5733@example.org",
      "director_inn": ""
    },
    {
      "inn": "9985733934",
      "ogrn": "1107736238993",
      "name": "ООО «Техно-Снаб 934»",
      "registration_date": "2010-02-15",
      "status": "ACTIVE",
      "address": "г. Москва, ул. Промышленная, д. 41",
      "mass_address": "нет",
      "phone": "+7 495 210-90-47",
      "email": "sales3934@example.org",
      "director_inn": ""
    },
    {
      "inn": "9964739727",
      "ogrn": "1087763901929",
      "name": "ООО «Техно-Комплект 727»",
      "registration_date": "2008-06-15",
      "status": "ACTIVE",
      "address": "г. Москва, ул. Промышленная, д. 25",
      "mass_address": "нет",
      "phone": "+7 495 293-26-43",
      "email": "sales9727@example.org",
      "director_inn": ""
    },
    {
      "inn": "9908255183",
      "ogrn": "1197795276032",
      "name": "ООО «Техно-Комплект 183»",
      "registration_date": "2019-04-15",
      "status": "ACTIVE",
      "address": "г. Москва, ул. Промышленная, д. 5",
      "mass_address": "нет",
      "phone": "+7 495 856-98-93",
      "email": "sales5183@example.org",
      "director_inn": ""
    },
    {
      "inn": "9961994172",
      "ogrn": "1207779184917",
      "name": "ООО «Оборудование-Комплект 172»",
      "registration_date": "2020-06-15",
      "status": "ACTIVE",
      "address": "г. Москва, ул. Промышленная, д. 70",
      "mass_address": "нет",
      "phone": "+7 495 254-39-71",
      "email": "sales4172@example.org",
      "director_inn": ""
    },
    {
      "inn": "9958033620",
      "ogrn": "1157721108322",
      "name": "ООО «Техно-Маркет 620»",
      "registration_date": "2015-12-15",
      "status": "ACTIVE",
      "address": "г. Москва, ул. Промышленная, д. 2",
      "mass_address": "нет",
      "phone": "+7 495 328-11-84",
      "email": "sales3620@example.org",
      "director_inn": ""
    },
    {
      "inn": "9993280999",
      "ogrn": "1207775628782",
      "name": "ООО «Индустрия-Маркет 999»",
      "registration_date": "2020-10-15",
      "status": "ACTIVE",
      "address": "г. Москва, ул. Промышленная, д. 26",
      "mass_address": "нет",
      "phone": "+7 495 514-24-56",
      "email": "sales0999@example.org",
      "director_inn": ""
    },
    {
      "inn": "9937546571",
      "ogrn": "1137706439988",
      "name": "ООО «Техно-Комплект 571»",
      "registration_date": "2013-02-15",
      "status": "ACTIVE",
      "address": "г. Москва, ул. Промышленная, д. 87",
      "mass_address": "нет",
      "phone": "+7 495 738-70-25",
      "email": "sales6571@example.org",
      "director_inn": ""
    }
  ],
  "properties": [
    {
      "property_id": "PROP-001",
      "cadastral_number": "99:99:9900001:1001",
      "property_type": "APARTMENT",
      "address": "Синтетический город, Тестовая улица, дом 1, помещение 1",
      "area_sqm": "47.5",
      "ownership_type": "SOLE",
      "encumbrance_status": "NONE_RECORDED",
      "encumbrance_note": "В синтетическом ответе ограничения не указаны",
      "rights_coverage": "COMPLETE_DEMO",
      "source_record_status": "CURRENT_DEMO",
      "source_as_of": "2026-10-23",
      "source_type": "SYNTHETIC_AUTHORIZED_REGISTRY_RESPONSE",
      "is_synthetic": "true"
    },
    {
      "property_id": "PROP-002",
      "cadastral_number": "99:99:9900001:1002",
      "property_type": "NON_RESIDENTIAL",
      "address": "Синтетический город, Тестовая улица, дом 2, помещение 2",
      "area_sqm": "55",
      "ownership_type": "SOLE",
      "encumbrance_status": "NONE_RECORDED",
      "encumbrance_note": "В синтетическом ответе ограничения не указаны",
      "rights_coverage": "COMPLETE_DEMO",
      "source_record_status": "CURRENT_DEMO",
      "source_as_of": "2026-10-23",
      "source_type": "SYNTHETIC_AUTHORIZED_REGISTRY_RESPONSE",
      "is_synthetic": "true"
    },
    {
      "property_id": "PROP-003",
      "cadastral_number": "99:99:9900001:1003",
      "property_type": "NON_RESIDENTIAL",
      "address": "Синтетический город, Тестовая улица, дом 3, помещение 3",
      "area_sqm": "62.5",
      "ownership_type": "SHARED",
      "encumbrance_status": "NONE_RECORDED",
      "encumbrance_note": "В синтетическом ответе ограничения не указаны",
      "rights_coverage": "COMPLETE_DEMO",
      "source_record_status": "CURRENT_DEMO",
      "source_as_of": "2026-10-23",
      "source_type": "SYNTHETIC_AUTHORIZED_REGISTRY_RESPONSE",
      "is_synthetic": "true"
    },
    {
      "property_id": "PROP-004",
      "cadastral_number": "99:99:9900001:1004",
      "property_type": "APARTMENT",
      "address": "Синтетический город, Тестовая улица, дом 4, помещение 4",
      "area_sqm": "70",
      "ownership_type": "SOLE",
      "encumbrance_status": "MORTGAGE",
      "encumbrance_note": "Тестовая ипотека в пользу DEMO-BANK",
      "rights_coverage": "COMPLETE_DEMO",
      "source_record_status": "CURRENT_DEMO",
      "source_as_of": "2026-10-23",
      "source_type": "SYNTHETIC_AUTHORIZED_REGISTRY_RESPONSE",
      "is_synthetic": "true"
    },
    {
      "property_id": "PROP-005",
      "cadastral_number": "99:99:9900001:1005",
      "property_type": "NON_RESIDENTIAL",
      "address": "Синтетический город, Тестовая улица, дом 5, помещение 5",
      "area_sqm": "77.5",
      "ownership_type": "SOLE",
      "encumbrance_status": "NONE_RECORDED",
      "encumbrance_note": "В синтетическом ответе ограничения не указаны",
      "rights_coverage": "COMPLETE_DEMO",
      "source_record_status": "STALE_DEMO",
      "source_as_of": "2024-10-01",
      "source_type": "SYNTHETIC_AUTHORIZED_REGISTRY_RESPONSE",
      "is_synthetic": "true"
    },
    {
      "property_id": "PROP-006",
      "cadastral_number": "99:99:9900001:1006",
      "property_type": "APARTMENT",
      "address": "Синтетический город, Тестовая улица, дом 6, помещение 6",
      "area_sqm": "85",
      "ownership_type": "JOINT",
      "encumbrance_status": "NONE_RECORDED",
      "encumbrance_note": "В синтетическом ответе ограничения не указаны",
      "rights_coverage": "COMPLETE_DEMO",
      "source_record_status": "CURRENT_DEMO",
      "source_as_of": "2026-10-23",
      "source_type": "SYNTHETIC_AUTHORIZED_REGISTRY_RESPONSE",
      "is_synthetic": "true"
    },
    {
      "property_id": "PROP-007",
      "cadastral_number": "99:99:9900001:1007",
      "property_type": "NON_RESIDENTIAL",
      "address": "Синтетический город, Тестовая улица, дом 7, помещение 7",
      "area_sqm": "92.5",
      "ownership_type": "UNKNOWN",
      "encumbrance_status": "UNKNOWN",
      "encumbrance_note": "Сведения об обременениях не получены",
      "rights_coverage": "UNAVAILABLE",
      "source_record_status": "PARTIAL_DEMO",
      "source_as_of": "2026-10-23",
      "source_type": "SYNTHETIC_AUTHORIZED_REGISTRY_RESPONSE",
      "is_synthetic": "true"
    },
    {
      "property_id": "PROP-008",
      "cadastral_number": "99:99:9900001:1008",
      "property_type": "APARTMENT",
      "address": "Синтетический город, Тестовая улица, дом 8, помещение 8",
      "area_sqm": "100",
      "ownership_type": "SOLE",
      "encumbrance_status": "ARREST",
      "encumbrance_note": "Тестовая запись об аресте",
      "rights_coverage": "COMPLETE_DEMO",
      "source_record_status": "CURRENT_DEMO",
      "source_as_of": "2026-10-23",
      "source_type": "SYNTHETIC_AUTHORIZED_REGISTRY_RESPONSE",
      "is_synthetic": "true"
    },
    {
      "property_id": "PROP-009",
      "cadastral_number": "99:99:9900001:1009",
      "property_type": "NON_RESIDENTIAL",
      "address": "Синтетический город, Тестовая улица, дом 9, помещение 9",
      "area_sqm": "107.5",
      "ownership_type": "SOLE",
      "encumbrance_status": "NONE_RECORDED",
      "encumbrance_note": "В синтетическом ответе ограничения не указаны",
      "rights_coverage": "COMPLETE_DEMO",
      "source_record_status": "CURRENT_DEMO",
      "source_as_of": "2026-10-23",
      "source_type": "SYNTHETIC_AUTHORIZED_REGISTRY_RESPONSE",
      "is_synthetic": "true"
    }
  ],
  "scoringConfig": {
    "version": "demo-rules-2026-10-23-v1",
    "source": "Банковская_логика_MVP_с_тестами.xlsx — Параметры, Правила",
    "assessmentAsOf": "2026-10-23",
    "demonstrationOnly": true,
    "parameters": {
      "RATE_REF": 0.24,
      "RATE_HIGH": 0.18,
      "RATE_STANDARD": 0.21,
      "RATE_COUNTER": 0.24,
      "FEES": 0,
      "MIN_FACT_MONTHS": 3,
      "MAX_FACT_MONTHS": 12,
      "OTHER_INCOME_MONTHS": 3,
      "COVER_APPROVE": 1.5,
      "COVER_MIDDLE": 1.2,
      "COVER_LOW": 1,
      "PTS_COVER_HIGH": 40,
      "PTS_COVER_MIDDLE": 25,
      "PTS_COVER_LOW": 10,
      "PTS_COVER_DEFICIT": 0,
      "PTS_NO_ADVERSE": 25,
      "PTS_MINOR_ADVERSE": 10,
      "STOP_OVERDUE_DAYS": 30,
      "HISTORY_LONG": 24,
      "HISTORY_MIDDLE": 12,
      "HISTORY_SHORT": 6,
      "PTS_HISTORY_LONG": 15,
      "PTS_HISTORY_MIDDLE": 10,
      "PTS_HISTORY_SHORT": 5,
      "PTS_HISTORY_NEW": 0,
      "CV_LOW": 0.3,
      "CV_MIDDLE": 0.6,
      "PTS_CV_LOW": 15,
      "PTS_CV_MIDDLE": 8,
      "PTS_CV_HIGH": 0,
      "AMOUNT_ANNUAL_RATIO": 0.25,
      "PTS_ANNUAL_RATIO": 5,
      "SCORE_HIGH": 85,
      "SCORE_OFFER": 70,
      "SCORE_COUNTER": 50,
      "TERM_STEP": 6,
      "TAX_CHECK_ENABLED": false,
      "TAX_DEBT_LIMIT": 50000
    },
    "products": {
      "WC": {
        "minAmount": 100000,
        "maxAmount": 3000000,
        "minTerm": 3,
        "maxTerm": 24,
        "defaultTerm": 12,
        "minContribution": 0
      },
      "EQ": {
        "minAmount": 300000,
        "maxAmount": 5000000,
        "minTerm": 6,
        "maxTerm": 48,
        "defaultTerm": 24,
        "minContribution": 0.1
      }
    }
  }
};
