#!/usr/bin/env python3
import csv
import os
import sys

def main():
    base_dir = os.environ.get(
        "SYNTHETIC_DATA_DIR",
        os.path.abspath(
            os.path.join(
                os.path.dirname(__file__),
                "../../Все_данные_для_автоподстановки_—_2026_10_23/bank_data/registry"
            )
        )
    )
    
    if not os.path.exists(base_dir):
        # Fallback to absolute path on current system
        base_dir = "/Users/cr1stal/Desktop/projects/AlphaHack/Все_данные_для_автоподстановки_—_2026_10_23/bank_data/registry"

    output_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "seed_synthetic_data.sql")
    )

    def esc(val):
        if val is None or val == "":
            return "NULL"
        val = str(val).strip().replace("'", "''")
        return f"'{val}'"

    def num(val, default="NULL"):
        if val is None or val == "":
            return default
        try:
            float(val)
            return str(val).strip()
        except:
            return default

    lines = []
    lines.append("-- ================================================================")
    lines.append("-- СИНТЕТИЧЕСКАЯ БАЗА ДАННЫХ (SyntheticDb)")
    lines.append("-- Заполнение таблиц: efrsb_bankruptcies, egrip, equipment_catalog,")
    lines.append("-- fns_account_blocks, suppliers, zsk_risk")
    lines.append("-- Источник: Все_данные_для_автоподстановки_—_2026_10_23")
    lines.append("-- ================================================================\n")

    lines.append("CREATE SCHEMA IF NOT EXISTS synthetic;\n")

    # 1. efrsb_bankruptcies
    lines.append("""CREATE TABLE IF NOT EXISTS synthetic.efrsb_bankruptcies (
    id SERIAL PRIMARY KEY,
    inn VARCHAR(12) NOT NULL,
    message_type VARCHAR(100),
    procedure VARCHAR(100),
    case_number VARCHAR(50),
    start_date DATE,
    completed_date DATE
);""")

    # 2. egrip
    lines.append("""CREATE TABLE IF NOT EXISTS synthetic.egrip (
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
);""")

    # 3. equipment_catalog
    lines.append("""CREATE TABLE IF NOT EXISTS synthetic.equipment_catalog (
    category VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    reference_price_rub NUMERIC(18, 2) NOT NULL
);""")

    # 4. fns_account_blocks
    lines.append("""CREATE TABLE IF NOT EXISTS synthetic.fns_account_blocks (
    id SERIAL PRIMARY KEY,
    inn VARCHAR(12) NOT NULL,
    decision_number VARCHAR(50),
    decision_date DATE,
    tax_office_code VARCHAR(20),
    bank_bik VARCHAR(20)
);""")

    # 5. suppliers
    lines.append("""CREATE TABLE IF NOT EXISTS synthetic.suppliers (
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
);""")

    # 6. zsk_risk
    lines.append("""CREATE TABLE IF NOT EXISTS synthetic.zsk_risk (
    inn VARCHAR(12) PRIMARY KEY,
    risk_level VARCHAR(20) NOT NULL,
    as_of DATE
);\n""")

    # Truncate tables with restart identity
    lines.append("-- Очистка перед загрузкой для гарантии идемпотентности")
    lines.append("""TRUNCATE TABLE 
    synthetic.efrsb_bankruptcies,
    synthetic.egrip,
    synthetic.equipment_catalog,
    synthetic.fns_account_blocks,
    synthetic.suppliers,
    synthetic.zsk_risk
RESTART IDENTITY CASCADE;\n""")

    # 1. Заполнение efrsb_bankruptcies
    lines.append("-- 1. Реестр банкротств (efrsb_bankruptcies)")
    efrsb_file = os.path.join(base_dir, "efrsb.csv")
    with open(efrsb_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        val_rows = []
        for r in reader:
            val_rows.append(
                f"({esc(r.get('inn'))}, {esc(r.get('message_type'))}, {esc(r.get('procedure'))}, "
                f"{esc(r.get('case_number'))}, {esc(r.get('start_date'))}, {esc(r.get('completed_date'))})"
            )
        if val_rows:
            lines.append(
                "INSERT INTO synthetic.efrsb_bankruptcies (inn, message_type, procedure, case_number, start_date, completed_date)\nVALUES\n"
                + ",\n".join(val_rows)
                + ";\n"
            )

    # 2. Заполнение egrip
    lines.append("-- 2. Реестр ЕГРИП (egrip)")
    egrip_file = os.path.join(base_dir, "egrip.csv")
    with open(egrip_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        val_rows = []
        for r in reader:
            val_rows.append(
                f"({esc(r.get('inn'))}, {esc(r.get('ogrnip'))}, {esc(r.get('last_name'))}, "
                f"{esc(r.get('first_name'))}, {esc(r.get('patronymic'))}, {esc(r.get('full_name'))}, "
                f"{esc(r.get('registration_date'))}, {esc(r.get('egrip_status'))}, {esc(r.get('termination_date'))}, "
                f"{esc(r.get('termination_reason'))}, {esc(r.get('region_code'))}, {esc(r.get('region_name'))}, "
                f"{esc(r.get('okved_main'))}, {esc(r.get('okved_main_name'))}, {esc(r.get('okved_additional'))}, "
                f"{esc(r.get('tax_regime'))}, {esc(r.get('msp_category'))}, {esc(r.get('record_as_of'))})"
            )
        if val_rows:
            lines.append(
                "INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, "
                "registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, "
                "okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)\nVALUES\n"
                + ",\n".join(val_rows)
                + ";\n"
            )

    # 3. Заполнение equipment_catalog
    lines.append("-- 3. Каталог оборудования (equipment_catalog)")
    eq_file = os.path.join(base_dir, "equipment_catalog.csv")
    with open(eq_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        val_rows = []
        for r in reader:
            val_rows.append(
                f"({esc(r.get('category'))}, {esc(r.get('name'))}, {num(r.get('reference_price_rub'), '0')})"
            )
        if val_rows:
            lines.append(
                "INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)\nVALUES\n"
                + ",\n".join(val_rows)
                + ";\n"
            )

    # 4. Заполнение fns_account_blocks
    lines.append("-- 4. Блокировки счетов ФНС (fns_account_blocks)")
    fns_file = os.path.join(base_dir, "fns_account_blocks.csv")
    with open(fns_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        val_rows = []
        for r in reader:
            val_rows.append(
                f"({esc(r.get('inn'))}, {esc(r.get('decision_number'))}, {esc(r.get('decision_date'))}, "
                f"{esc(r.get('tax_office_code'))}, {esc(r.get('bank_bik'))})"
            )
        if val_rows:
            lines.append(
                "INSERT INTO synthetic.fns_account_blocks (inn, decision_number, decision_date, tax_office_code, bank_bik)\nVALUES\n"
                + ",\n".join(val_rows)
                + ";\n"
            )

    # 5. Заполнение suppliers
    lines.append("-- 5. Поставщики (suppliers)")
    sup_file = os.path.join(base_dir, "egrul_suppliers.csv")
    with open(sup_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        val_rows = []
        for r in reader:
            is_mass = "TRUE" if r.get("mass_address") == "да" else ("FALSE" if r.get("mass_address") == "нет" else "NULL")
            val_rows.append(
                f"({esc(r.get('inn'))}, {esc(r.get('ogrn'))}, {esc(r.get('name'))}, "
                f"{esc(r.get('registration_date'))}, {esc(r.get('status'))}, {esc(r.get('address'))}, "
                f"{is_mass}, {esc(r.get('phone'))}, {esc(r.get('email'))}, {esc(r.get('director_inn'))})"
            )
        if val_rows:
            lines.append(
                "INSERT INTO synthetic.suppliers (inn, ogrn, name, registration_date, status, address, mass_address, phone, email, director_inn)\nVALUES\n"
                + ",\n".join(val_rows)
                + ";\n"
            )

    # 6. Заполнение zsk_risk
    lines.append("-- 6. Уровни риска ЗСК ЦБ РФ (zsk_risk)")
    zsk_file = os.path.join(base_dir, "zsk_risk.csv")
    with open(zsk_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        val_rows = []
        for r in reader:
            val_rows.append(
                f"({esc(r.get('inn'))}, {esc(r.get('risk_level'))}, {esc(r.get('as_of'))})"
            )
        if val_rows:
            lines.append(
                "INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)\nVALUES\n"
                + ",\n".join(val_rows)
                + ";\n"
            )

    content = "\n".join(lines)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"Успешно сгенерирован SQL файл: {output_path} ({len(lines)} строк, {len(content)} байт)")

if __name__ == "__main__":
    main()
