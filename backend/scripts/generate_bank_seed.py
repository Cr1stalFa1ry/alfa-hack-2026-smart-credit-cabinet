#!/usr/bin/env python3
import csv
import os

def main():
    candidates = [
        os.environ.get("BANK_DATA_DIR", ""),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/bank_data")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/bank_data")),
        "/Users/cr1stal/Desktop/projects/AlphaHack/data/bank_data"
    ]
    base_dir = next((d for d in candidates if d and os.path.isdir(d)), None)
    if not base_dir:
        raise FileNotFoundError("Could not locate bank_data directory")

    output_file = os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "../../seed_bank_data.sql"
        )
    )

    def esc(val):
        if val is None or val == '':
            return 'NULL'
        val = str(val).strip().replace("'", "''")
        return f"'{val}'"

    def num(val):
        if val is None or val == '':
            return 'NULL'
        val = str(val).strip()
        try:
            float(val)
            return val
        except:
            return 'NULL'

    def bool_val(val):
        if val is None or val == '':
            return 'NULL'
        s = str(val).strip().lower()
        if s in ['true', '1', 't', 'yes', 'да']:
            return 'TRUE'
        if s in ['false', '0', 'f', 'no', 'нет']:
            return 'FALSE'
        return 'NULL'

    sql_parts = []
    sql_parts.append('''-- ================================================================
-- СИНТЕТИЧЕСКАЯ БАЗА ДАННЫХ (SyntheticDb)
-- Заполнение таблиц:
--   1. customer_profiles
--   2. passport_profiles
--   3. monthly_facts
--   4. obligations
--   5. other_income
--   6. property_registry
--   7. property_rights
-- Источник: bank_data
-- ================================================================

CREATE SCHEMA IF NOT EXISTS synthetic;
SET search_path TO synthetic, public;

-- 1. Таблица профилей клиентов (customer_profiles)
CREATE TABLE IF NOT EXISTS synthetic.customer_profiles (
    application_id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    inn VARCHAR(12) NOT NULL,
    ogrnip VARCHAR(20),
    registration_date DATE,
    phone VARCHAR(50),
    email VARCHAR(100),
    own_bank_client VARCHAR(50),
    stage VARCHAR(50),
    purpose VARCHAR(255),
    product_code VARCHAR(50),
    amount_rub NUMERIC(18, 2),
    requested_term_months INT,
    equipment_price_rub NUMERIC(18, 2),
    own_contribution_rub NUMERIC(18, 2),
    available_own_funds_rub NUMERIC(18, 2),
    invoice_confirmed VARCHAR(50),
    startup_budget_total_rub NUMERIC(18, 2),
    startup_own_funds_rub NUMERIC(18, 2),
    pd_consent VARCHAR(50),
    automated_decision_consent VARCHAR(50),
    registry_status VARCHAR(50),
    applicant_match VARCHAR(50),
    check_status VARCHAR(50),
    failed_source VARCHAR(100),
    bki_consent VARCHAR(50),
    person_history VARCHAR(50),
    business_history VARCHAR(50),
    max_overdue_days_12m INT,
    current_overdue_rub NUMERIC(18, 2),
    tax_debt_rub NUMERIC(18, 2),
    kyc_risk_level VARCHAR(50),
    fns_account_block VARCHAR(50),
    bankruptcy_status VARCHAR(50),
    business_facts_state VARCHAR(50),
    activity_first_full_month VARCHAR(20),
    household_expenses_monthly_rub NUMERIC(18, 2),
    other_income_state VARCHAR(50),
    business_committed_costs_monthly_rub NUMERIC(18, 2),
    obligations_declaration_complete VARCHAR(50),
    verification_status VARCHAR(50),
    obligations_reconciled VARCHAR(50),
    repayment_source_confirmed VARCHAR(50),
    income_continuity_confirmed VARCHAR(50),
    findings_complete VARCHAR(50),
    supplier_inn VARCHAR(12),
    equipment_category VARCHAR(50),
    supplier_registration_date DATE,
    supplier_status VARCHAR(50),
    supplier_mass_address VARCHAR(50),
    supplier_linked_to_applicant VARCHAR(50),
    equipment_reference_price_rub NUMERIC(18, 2),
    duplicate_contacts VARCHAR(50),
    statement_unmatched_loan_payments VARCHAR(50),
    statement_needs_review VARCHAR(50),
    okved_main VARCHAR(20),
    tax_regime VARCHAR(100),
    region_name VARCHAR(150)
);
CREATE INDEX IF NOT EXISTS ix_customer_profiles_inn ON synthetic.customer_profiles (inn);

-- 2. Таблица паспортных данных (passport_profiles)
CREATE TABLE IF NOT EXISTS synthetic.passport_profiles (
    applicant_inn VARCHAR(12) PRIMARY KEY,
    full_name VARCHAR(255),
    birth_date DATE,
    series VARCHAR(20),
    number VARCHAR(20),
    issue_date DATE,
    issuer TEXT,
    department_code VARCHAR(20),
    document_status VARCHAR(50),
    verified_at DATE,
    is_synthetic BOOLEAN
);

-- 3. Таблица помесячных фактов выручки и расходов (monthly_facts)
CREATE TABLE IF NOT EXISTS synthetic.monthly_facts (
    id SERIAL PRIMARY KEY,
    application_id VARCHAR(50) NOT NULL REFERENCES synthetic.customer_profiles(application_id) ON DELETE CASCADE,
    month VARCHAR(20) NOT NULL,
    clean_receipts_rub NUMERIC(18, 2) NOT NULL,
    operating_outflow_rub NUMERIC(18, 2) NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_monthly_facts_application_id ON synthetic.monthly_facts (application_id);

-- 4. Таблица обязательств / кредитов (obligations)
CREATE TABLE IF NOT EXISTS synthetic.obligations (
    id SERIAL PRIMARY KEY,
    application_id VARCHAR(50) NOT NULL REFERENCES synthetic.customer_profiles(application_id) ON DELETE CASCADE,
    source VARCHAR(50),
    obligation_ref VARCHAR(100),
    kind VARCHAR(50),
    monthly_max_payment_rub NUMERIC(18, 2)
);
CREATE INDEX IF NOT EXISTS ix_obligations_application_id ON synthetic.obligations (application_id);

-- 5. Таблица прочих доходов (other_income)
CREATE TABLE IF NOT EXISTS synthetic.other_income (
    id SERIAL PRIMARY KEY,
    application_id VARCHAR(50) NOT NULL REFERENCES synthetic.customer_profiles(application_id) ON DELETE CASCADE,
    month VARCHAR(20) NOT NULL,
    net_income_rub NUMERIC(18, 2) NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_other_income_application_id ON synthetic.other_income (application_id);

-- 6. Реестр недвижимости (property_registry)
CREATE TABLE IF NOT EXISTS synthetic.property_registry (
    property_id VARCHAR(50) PRIMARY KEY,
    cadastral_number VARCHAR(50) NOT NULL,
    property_type VARCHAR(50),
    address TEXT,
    area_sqm NUMERIC(18, 2),
    ownership_type VARCHAR(50),
    encumbrance_status VARCHAR(50),
    encumbrance_note TEXT,
    rights_coverage VARCHAR(50),
    source_record_status VARCHAR(50),
    source_as_of DATE,
    source_type VARCHAR(100),
    is_synthetic BOOLEAN
);
CREATE INDEX IF NOT EXISTS ix_property_registry_cadastral ON synthetic.property_registry (cadastral_number);

-- 7. Права на недвижимость (property_rights)
CREATE TABLE IF NOT EXISTS synthetic.property_rights (
    right_id VARCHAR(50) PRIMARY KEY,
    cadastral_number VARCHAR(50) NOT NULL,
    owner_id VARCHAR(50),
    owner_inn VARCHAR(12),
    owner_full_name VARCHAR(255),
    owner_bank_application_id VARCHAR(50),
    ownership_type VARCHAR(50),
    share_numerator INT,
    share_denominator INT,
    right_status VARCHAR(50),
    registration_date DATE,
    termination_date DATE,
    identity_match_method VARCHAR(50),
    source_as_of DATE,
    source_type VARCHAR(100),
    is_synthetic BOOLEAN
);
CREATE INDEX IF NOT EXISTS ix_property_rights_owner_inn ON synthetic.property_rights (owner_inn);
CREATE INDEX IF NOT EXISTS ix_property_rights_cadastral ON synthetic.property_rights (cadastral_number);

-- Очистка таблиц перед загрузкой для гарантии идемпотентности
TRUNCATE TABLE 
    synthetic.monthly_facts,
    synthetic.obligations,
    synthetic.other_income,
    synthetic.property_rights,
    synthetic.property_registry,
    synthetic.passport_profiles,
    synthetic.customer_profiles
RESTART IDENTITY CASCADE;
''')

    # 1. customer_profiles
    with open(os.path.join(base_dir, 'applications.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = [c.lstrip('\ufeff') for c in reader.fieldnames]
        rows = []
        for r in reader:
            r_clean = {k.lstrip('\ufeff'): v for k, v in r.items()}
            values = []
            for col in fieldnames:
                v = r_clean.get(col, '')
                if col in ['amount_rub', 'requested_term_months', 'equipment_price_rub', 'own_contribution_rub',
                           'available_own_funds_rub', 'startup_budget_total_rub', 'startup_own_funds_rub',
                           'max_overdue_days_12m', 'current_overdue_rub', 'tax_debt_rub',
                           'household_expenses_monthly_rub', 'business_committed_costs_monthly_rub',
                           'equipment_reference_price_rub']:
                    values.append(num(v))
                else:
                    values.append(esc(v))
            rows.append(f"({', '.join(values)})")

    sql_parts.append(f'-- 1. Заполнение customer_profiles ({len(rows)} записей)')
    sql_parts.append(f"INSERT INTO synthetic.customer_profiles ({', '.join(fieldnames)})\nVALUES\n" + ",\n".join(rows) + ";\n")

    # 2. passport_profiles
    with open(os.path.join(base_dir, 'passport_profiles.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = [c.lstrip('\ufeff') for c in reader.fieldnames]
        rows = []
        for r in reader:
            r_clean = {k.lstrip('\ufeff'): v for k, v in r.items()}
            values = []
            for col in fieldnames:
                v = r_clean.get(col, '')
                if col == 'is_synthetic':
                    values.append(bool_val(v))
                else:
                    values.append(esc(v))
            rows.append(f"({', '.join(values)})")

    sql_parts.append(f'-- 2. Заполнение passport_profiles ({len(rows)} записей)')
    sql_parts.append(f"INSERT INTO synthetic.passport_profiles ({', '.join(fieldnames)})\nVALUES\n" + ",\n".join(rows) + ";\n")

    # 3. monthly_facts
    with open(os.path.join(base_dir, 'monthly_facts.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = [c.lstrip('\ufeff') for c in reader.fieldnames]
        rows = []
        for r in reader:
            r_clean = {k.lstrip('\ufeff'): v for k, v in r.items()}
            values = [
                esc(r_clean['application_id']),
                esc(r_clean['month']),
                num(r_clean['clean_receipts_rub']),
                num(r_clean['operating_outflow_rub'])
            ]
            rows.append(f"({', '.join(values)})")

    sql_parts.append(f'-- 3. Заполнение monthly_facts ({len(rows)} записей)')
    sql_parts.append(f"INSERT INTO synthetic.monthly_facts ({', '.join(fieldnames)})\nVALUES\n" + ",\n".join(rows) + ";\n")

    # 4. obligations
    with open(os.path.join(base_dir, 'obligations.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = [c.lstrip('\ufeff') for c in reader.fieldnames]
        rows = []
        for r in reader:
            r_clean = {k.lstrip('\ufeff'): v for k, v in r.items()}
            values = [
                esc(r_clean['application_id']),
                esc(r_clean['source']),
                esc(r_clean['obligation_ref']),
                esc(r_clean['kind']),
                num(r_clean['monthly_max_payment_rub'])
            ]
            rows.append(f"({', '.join(values)})")

    sql_parts.append(f'-- 4. Заполнение obligations ({len(rows)} записей)')
    sql_parts.append(f"INSERT INTO synthetic.obligations ({', '.join(fieldnames)})\nVALUES\n" + ",\n".join(rows) + ";\n")

    # 5. other_income
    with open(os.path.join(base_dir, 'other_income.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = [c.lstrip('\ufeff') for c in reader.fieldnames]
        rows = []
        for r in reader:
            r_clean = {k.lstrip('\ufeff'): v for k, v in r.items()}
            values = [
                esc(r_clean['application_id']),
                esc(r_clean['month']),
                num(r_clean['net_income_rub'])
            ]
            rows.append(f"({', '.join(values)})")

    sql_parts.append(f'-- 5. Заполнение other_income ({len(rows)} записей)')
    sql_parts.append(f"INSERT INTO synthetic.other_income ({', '.join(fieldnames)})\nVALUES\n" + ",\n".join(rows) + ";\n")

    # 6. property_registry
    with open(os.path.join(base_dir, 'property_registry.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = [c.lstrip('\ufeff') for c in reader.fieldnames]
        rows = []
        for r in reader:
            r_clean = {k.lstrip('\ufeff'): v for k, v in r.items()}
            values = []
            for col in fieldnames:
                v = r_clean.get(col, '')
                if col == 'area_sqm':
                    values.append(num(v))
                elif col == 'is_synthetic':
                    values.append(bool_val(v))
                else:
                    values.append(esc(v))
            rows.append(f"({', '.join(values)})")

    sql_parts.append(f'-- 6. Заполнение property_registry ({len(rows)} записей)')
    sql_parts.append(f"INSERT INTO synthetic.property_registry ({', '.join(fieldnames)})\nVALUES\n" + ",\n".join(rows) + ";\n")

    # 7. property_rights
    with open(os.path.join(base_dir, 'property_rights.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = [c.lstrip('\ufeff') for c in reader.fieldnames]
        rows = []
        for r in reader:
            r_clean = {k.lstrip('\ufeff'): v for k, v in r.items()}
            values = []
            for col in fieldnames:
                v = r_clean.get(col, '')
                if col in ['share_numerator', 'share_denominator']:
                    values.append(num(v))
                elif col == 'is_synthetic':
                    values.append(bool_val(v))
                else:
                    values.append(esc(v))
            rows.append(f"({', '.join(values)})")

    sql_parts.append(f'-- 7. Заполнение property_rights ({len(rows)} записей)')
    sql_parts.append(f"INSERT INTO synthetic.property_rights ({', '.join(fieldnames)})\nVALUES\n" + ",\n".join(rows) + ";\n")

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_parts))

    print(f"Generated {output_file} ({os.path.getsize(output_file)} bytes)")

if __name__ == '__main__':
    main()
