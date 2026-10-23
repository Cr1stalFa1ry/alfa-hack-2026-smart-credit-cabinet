import csv
import os

CSV_DIR = "/Users/cr1stal/Desktop/projects/AlphaHack/ip_credit_csv_export/ip_credit/data/synthetic"
OUTPUT_SQL = "/Users/cr1stal/Desktop/projects/AlphaHack/AlphaHack/backend/scripts/seed_synthetic_data.sql"

def esc(val):
    if val is None or val == "":
        return "NULL"
    val = str(val).replace("'", "''").strip()
    return f"'{val}'"

def num(val, default="NULL"):
    if val is None or val == "":
        return default
    try:
        float(val)
        return str(val)
    except:
        return default

lines = []
lines.append("-- ================================================================")
lines.append("-- СИНТЕТИЧЕСКАЯ БАЗА ДАННЫХ (РЕЕСТРЫ, СТОП-ФАКТОРЫ, ОБОРУДОВАНИЕ)")
lines.append("-- Для проекта Alfa-Hack «Умный кредитный кабинет предпринимателя»")
lines.append("-- ================================================================\n")

# 1. Схема
lines.append("CREATE SCHEMA IF NOT EXISTS synthetic;\n")

# 2. ЕГРИП (Автозаполнение анкеты)
lines.append("""
CREATE TABLE IF NOT EXISTS synthetic.egrip (
    inn VARCHAR(12) PRIMARY KEY,
    ogrnip VARCHAR(15),
    last_name VARCHAR(100),
    first_name VARCHAR(100),
    patronymic VARCHAR(100),
    full_name VARCHAR(255),
    registration_date DATE,
    egrip_status VARCHAR(50),
    termination_date DATE,
    termination_reason TEXT,
    region_code VARCHAR(10),
    region_name VARCHAR(150),
    okved_main VARCHAR(20),
    okved_main_name VARCHAR(255),
    okved_additional TEXT,
    tax_regime VARCHAR(100),
    msp_category VARCHAR(100),
    record_as_of DATE
);
""")

egrip_path = os.path.join(CSV_DIR, "registry/egrip.csv")
if os.path.exists(egrip_path):
    with open(egrip_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            sql = f"""INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ({esc(r.get('inn'))}, {esc(r.get('ogrnip'))}, {esc(r.get('last_name'))}, {esc(r.get('first_name'))}, {esc(r.get('patronymic'))}, {esc(r.get('full_name'))}, {esc(r.get('registration_date'))}, {esc(r.get('egrip_status'))}, {esc(r.get('termination_date'))}, {esc(r.get('termination_reason'))}, {esc(r.get('region_code'))}, {esc(r.get('region_name'))}, {esc(r.get('okved_main'))}, {esc(r.get('okved_main_name'))}, {esc(r.get('okved_additional'))}, {esc(r.get('tax_regime'))}, {esc(r.get('msp_category'))}, {esc(r.get('record_as_of'))})
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;"""
            lines.append(sql)

# 3. Блокировки счетов ФНС
lines.append("""
CREATE TABLE IF NOT EXISTS synthetic.fns_account_blocks (
    id SERIAL PRIMARY KEY,
    inn VARCHAR(12) NOT NULL,
    decision_number VARCHAR(50),
    decision_date DATE,
    tax_office_code VARCHAR(20),
    bank_bik VARCHAR(20)
);
""")
fns_path = os.path.join(CSV_DIR, "registry/fns_account_blocks.csv")
if os.path.exists(fns_path):
    with open(fns_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            sql = f"""INSERT INTO synthetic.fns_account_blocks (inn, decision_number, decision_date, tax_office_code, bank_bik)
VALUES ({esc(r.get('inn'))}, {esc(r.get('decision_number'))}, {esc(r.get('decision_date'))}, {esc(r.get('tax_office_code'))}, {esc(r.get('bank_bik'))});"""
            lines.append(sql)

# 4. ЗСК ЦБ РФ (Знай своего клиента - уровни риска)
lines.append("""
CREATE TABLE IF NOT EXISTS synthetic.zsk_risk (
    inn VARCHAR(12) PRIMARY KEY,
    risk_level VARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH
    as_of DATE
);
""")
zsk_path = os.path.join(CSV_DIR, "registry/zsk_risk.csv")
if os.path.exists(zsk_path):
    with open(zsk_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            sql = f"""INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ({esc(r.get('inn'))}, {esc(r.get('risk_level'))}, {esc(r.get('as_of'))})
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;"""
            lines.append(sql)

# 5. ЕФРСБ (Реестр банкротств)
lines.append("""
CREATE TABLE IF NOT EXISTS synthetic.efrsb_bankruptcies (
    id SERIAL PRIMARY KEY,
    inn VARCHAR(12) NOT NULL,
    message_type VARCHAR(100),
    procedure VARCHAR(100),
    case_number VARCHAR(50),
    start_date DATE,
    completed_date DATE
);
""")
efrsb_path = os.path.join(CSV_DIR, "registry/efrsb.csv")
if os.path.exists(efrsb_path):
    with open(efrsb_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            sql = f"""INSERT INTO synthetic.efrsb_bankruptcies (inn, message_type, procedure, case_number, start_date, completed_date)
VALUES ({esc(r.get('inn'))}, {esc(r.get('message_type'))}, {esc(r.get('procedure'))}, {esc(r.get('case_number'))}, {esc(r.get('start_date'))}, {esc(r.get('completed_date'))});"""
            lines.append(sql)

# 6. Каталог оборудования
lines.append("""
CREATE TABLE IF NOT EXISTS synthetic.equipment_catalog (
    category VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    reference_price_rub NUMERIC(18, 2) NOT NULL
);
""")
eq_path = os.path.join(CSV_DIR, "registry/equipment_catalog.csv")
if os.path.exists(eq_path):
    with open(eq_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            sql = f"""INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ({esc(r.get('category'))}, {esc(r.get('name'))}, {num(r.get('reference_price_rub'), '0')})
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;"""
            lines.append(sql)

# 7. Поставщики оборудования
lines.append("""
CREATE TABLE IF NOT EXISTS synthetic.suppliers (
    inn VARCHAR(12) PRIMARY KEY,
    ogrn VARCHAR(20),
    name VARCHAR(255) NOT NULL,
    registration_date DATE,
    status VARCHAR(50),
    address TEXT,
    mass_address BOOLEAN,
    phone VARCHAR(50),
    email VARCHAR(100),
    director_inn VARCHAR(12)
);
""")
sup_path = os.path.join(CSV_DIR, "registry/egrul_suppliers.csv")
if os.path.exists(sup_path):
    with open(sup_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            is_mass = "TRUE" if r.get('mass_address') == 'да' else "FALSE"
            sql = f"""INSERT INTO synthetic.suppliers (inn, ogrn, name, registration_date, status, address, mass_address, phone, email, director_inn)
VALUES ({esc(r.get('inn'))}, {esc(r.get('ogrn'))}, {esc(r.get('name'))}, {esc(r.get('registration_date'))}, {esc(r.get('status'))}, {esc(r.get('address'))}, {is_mass}, {esc(r.get('phone'))}, {esc(r.get('email'))}, {esc(r.get('director_inn'))})
ON CONFLICT (inn) DO UPDATE SET name = EXCLUDED.name, mass_address = EXCLUDED.mass_address;"""
            lines.append(sql)

with open(OUTPUT_SQL, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print(f"Generated {len(lines)} lines of SQL into {OUTPUT_SQL}")
