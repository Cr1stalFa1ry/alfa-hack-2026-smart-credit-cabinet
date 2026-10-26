--
-- PostgreSQL database dump
--


-- Dumped from database version 16.15
-- Dumped by pg_dump version 18.4 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: synthetic; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA synthetic;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: synthetic_alfa_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.synthetic_alfa_accounts (
    "Id" uuid NOT NULL,
    "CustomerId" uuid NOT NULL,
    "AccountNumber" character varying(20) NOT NULL,
    "Currency" character varying(3) NOT NULL,
    "CurrentBalance" numeric(18,2) NOT NULL,
    "OpenDate" timestamp with time zone NOT NULL,
    "IsBlocked" boolean NOT NULL,
    "AccountType" text NOT NULL
);


--
-- Name: synthetic_alfa_customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.synthetic_alfa_customers (
    "Id" uuid NOT NULL,
    "Inn" character varying(12) NOT NULL,
    "OrganizationName" character varying(250) NOT NULL,
    "IsAlfaClient" boolean NOT NULL,
    "ClientSince" timestamp with time zone,
    "RelationshipMonths" integer,
    "Segment" text NOT NULL,
    "BranchOffice" text NOT NULL,
    "AverageMonthlyTurnover" numeric(18,2) NOT NULL,
    "AverageMonthlyExpenses" numeric(18,2) NOT NULL,
    "NetCashFlow" numeric(18,2) NOT NULL,
    "AnnualRevenue" numeric(18,2) NOT NULL,
    "CoefficientOfVariation" numeric(5,4) NOT NULL,
    "MonthlyLoanPaymentsInAlfa" numeric(18,2) NOT NULL,
    "ExistingLoansTotalBalance" numeric(18,2) NOT NULL,
    "ActiveOperatingMonths" integer NOT NULL,
    "Has115FzBlocks" boolean NOT NULL,
    "HasBankruptcySigns" boolean NOT NULL,
    "HasSuspensionByFns" boolean NOT NULL,
    "HasCourtBailiffEnforcements" boolean NOT NULL,
    "DaysWithoutOperations" integer NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone
);


--
-- Name: synthetic_alfa_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.synthetic_alfa_transactions (
    "Id" uuid NOT NULL,
    "CustomerId" uuid NOT NULL,
    "Date" timestamp with time zone NOT NULL,
    "Amount" numeric(18,2) NOT NULL,
    "OperationType" character varying(20) NOT NULL,
    "CounterpartyName" character varying(250) NOT NULL,
    "PaymentPurpose" text NOT NULL,
    "Category" character varying(50) NOT NULL,
    "ExcludedFromRevenue" boolean NOT NULL
);


--
-- Name: customer_profiles; Type: TABLE; Schema: synthetic; Owner: -
--

CREATE TABLE synthetic.customer_profiles (
    application_id character varying(50) NOT NULL,
    full_name character varying(255) NOT NULL,
    inn character varying(12) NOT NULL,
    ogrnip character varying(20),
    registration_date date,
    phone character varying(50),
    email character varying(100),
    own_bank_client character varying(50),
    stage character varying(50),
    purpose character varying(255),
    product_code character varying(50),
    amount_rub numeric(18,2),
    requested_term_months integer,
    equipment_price_rub numeric(18,2),
    own_contribution_rub numeric(18,2),
    available_own_funds_rub numeric(18,2),
    invoice_confirmed character varying(50),
    startup_budget_total_rub numeric(18,2),
    startup_own_funds_rub numeric(18,2),
    pd_consent character varying(50),
    automated_decision_consent character varying(50),
    registry_status character varying(50),
    applicant_match character varying(50),
    check_status character varying(50),
    failed_source character varying(100),
    bki_consent character varying(50),
    person_history character varying(50),
    business_history character varying(50),
    max_overdue_days_12m integer,
    current_overdue_rub numeric(18,2),
    tax_debt_rub numeric(18,2),
    kyc_risk_level character varying(50),
    fns_account_block character varying(50),
    bankruptcy_status character varying(50),
    business_facts_state character varying(50),
    activity_first_full_month character varying(20),
    household_expenses_monthly_rub numeric(18,2),
    other_income_state character varying(50),
    business_committed_costs_monthly_rub numeric(18,2),
    obligations_declaration_complete character varying(50),
    verification_status character varying(50),
    obligations_reconciled character varying(50),
    repayment_source_confirmed character varying(50),
    income_continuity_confirmed character varying(50),
    findings_complete character varying(50),
    supplier_inn character varying(12),
    equipment_category character varying(50),
    supplier_registration_date date,
    supplier_status character varying(50),
    supplier_mass_address character varying(50),
    supplier_linked_to_applicant character varying(50),
    equipment_reference_price_rub numeric(18,2),
    duplicate_contacts character varying(50),
    statement_unmatched_loan_payments character varying(50),
    statement_needs_review character varying(50),
    okved_main character varying(20),
    tax_regime character varying(100),
    region_name character varying(150),
    max_overdue_days12m integer GENERATED ALWAYS AS (max_overdue_days_12m) STORED
);


--
-- Name: efrsb_bankruptcies; Type: TABLE; Schema: synthetic; Owner: -
--

CREATE TABLE synthetic.efrsb_bankruptcies (
    id integer NOT NULL,
    inn character varying(12) NOT NULL,
    message_type character varying(100),
    procedure character varying(100),
    case_number character varying(50),
    start_date date,
    completed_date date
);


--
-- Name: efrsb_bankruptcies_id_seq; Type: SEQUENCE; Schema: synthetic; Owner: -
--

CREATE SEQUENCE synthetic.efrsb_bankruptcies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: efrsb_bankruptcies_id_seq; Type: SEQUENCE OWNED BY; Schema: synthetic; Owner: -
--

ALTER SEQUENCE synthetic.efrsb_bankruptcies_id_seq OWNED BY synthetic.efrsb_bankruptcies.id;


--
-- Name: egrip; Type: TABLE; Schema: synthetic; Owner: -
--

CREATE TABLE synthetic.egrip (
    inn character varying(12) NOT NULL,
    ogrnip character varying(15),
    last_name character varying(100),
    first_name character varying(100),
    patronymic character varying(100),
    full_name character varying(255),
    registration_date date,
    egrip_status character varying(50),
    termination_date date,
    termination_reason text,
    region_code character varying(10),
    region_name character varying(150),
    okved_main character varying(20),
    okved_main_name character varying(255),
    okved_additional text,
    tax_regime character varying(100),
    msp_category character varying(100),
    record_as_of date
);


--
-- Name: equipment_catalog; Type: TABLE; Schema: synthetic; Owner: -
--

CREATE TABLE synthetic.equipment_catalog (
    category character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    reference_price_rub numeric(18,2) NOT NULL
);


--
-- Name: fns_account_blocks; Type: TABLE; Schema: synthetic; Owner: -
--

CREATE TABLE synthetic.fns_account_blocks (
    id integer NOT NULL,
    inn character varying(12) NOT NULL,
    decision_number character varying(50),
    decision_date date,
    tax_office_code character varying(20),
    bank_bik character varying(20)
);


--
-- Name: fns_account_blocks_id_seq; Type: SEQUENCE; Schema: synthetic; Owner: -
--

CREATE SEQUENCE synthetic.fns_account_blocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fns_account_blocks_id_seq; Type: SEQUENCE OWNED BY; Schema: synthetic; Owner: -
--

ALTER SEQUENCE synthetic.fns_account_blocks_id_seq OWNED BY synthetic.fns_account_blocks.id;


--
-- Name: monthly_facts; Type: TABLE; Schema: synthetic; Owner: -
--

CREATE TABLE synthetic.monthly_facts (
    id integer NOT NULL,
    application_id character varying(50) NOT NULL,
    month character varying(20) NOT NULL,
    clean_receipts_rub numeric(18,2) NOT NULL,
    operating_outflow_rub numeric(18,2) NOT NULL
);


--
-- Name: monthly_facts_id_seq; Type: SEQUENCE; Schema: synthetic; Owner: -
--

CREATE SEQUENCE synthetic.monthly_facts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: monthly_facts_id_seq; Type: SEQUENCE OWNED BY; Schema: synthetic; Owner: -
--

ALTER SEQUENCE synthetic.monthly_facts_id_seq OWNED BY synthetic.monthly_facts.id;


--
-- Name: obligations; Type: TABLE; Schema: synthetic; Owner: -
--

CREATE TABLE synthetic.obligations (
    id integer NOT NULL,
    application_id character varying(50) NOT NULL,
    source character varying(50),
    obligation_ref character varying(100),
    kind character varying(50),
    monthly_max_payment_rub numeric(18,2)
);


--
-- Name: obligations_id_seq; Type: SEQUENCE; Schema: synthetic; Owner: -
--

CREATE SEQUENCE synthetic.obligations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: obligations_id_seq; Type: SEQUENCE OWNED BY; Schema: synthetic; Owner: -
--

ALTER SEQUENCE synthetic.obligations_id_seq OWNED BY synthetic.obligations.id;


--
-- Name: other_income; Type: TABLE; Schema: synthetic; Owner: -
--

CREATE TABLE synthetic.other_income (
    id integer NOT NULL,
    application_id character varying(50) NOT NULL,
    month character varying(20) NOT NULL,
    net_income_rub numeric(18,2) NOT NULL
);


--
-- Name: other_income_id_seq; Type: SEQUENCE; Schema: synthetic; Owner: -
--

CREATE SEQUENCE synthetic.other_income_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: other_income_id_seq; Type: SEQUENCE OWNED BY; Schema: synthetic; Owner: -
--

ALTER SEQUENCE synthetic.other_income_id_seq OWNED BY synthetic.other_income.id;


--
-- Name: passport_profiles; Type: TABLE; Schema: synthetic; Owner: -
--

CREATE TABLE synthetic.passport_profiles (
    applicant_inn character varying(12) NOT NULL,
    full_name character varying(255),
    birth_date date,
    series character varying(20),
    number character varying(20),
    issue_date date,
    issuer text,
    department_code character varying(20),
    document_status character varying(50),
    verified_at date,
    is_synthetic boolean
);


--
-- Name: property_registry; Type: TABLE; Schema: synthetic; Owner: -
--

CREATE TABLE synthetic.property_registry (
    property_id character varying(50) NOT NULL,
    cadastral_number character varying(50) NOT NULL,
    property_type character varying(50),
    address text,
    area_sqm numeric(18,2),
    ownership_type character varying(50),
    encumbrance_status character varying(50),
    encumbrance_note text,
    rights_coverage character varying(50),
    source_record_status character varying(50),
    source_as_of date,
    source_type character varying(100),
    is_synthetic boolean
);


--
-- Name: property_rights; Type: TABLE; Schema: synthetic; Owner: -
--

CREATE TABLE synthetic.property_rights (
    right_id character varying(50) NOT NULL,
    cadastral_number character varying(50) NOT NULL,
    owner_id character varying(50),
    owner_inn character varying(12),
    owner_full_name character varying(255),
    owner_bank_application_id character varying(50),
    ownership_type character varying(50),
    share_numerator integer,
    share_denominator integer,
    right_status character varying(50),
    registration_date date,
    termination_date date,
    identity_match_method character varying(50),
    source_as_of date,
    source_type character varying(100),
    is_synthetic boolean
);


--
-- Name: suppliers; Type: TABLE; Schema: synthetic; Owner: -
--

CREATE TABLE synthetic.suppliers (
    inn character varying(12) NOT NULL,
    ogrn character varying(20),
    name character varying(255) NOT NULL,
    registration_date date,
    status character varying(50),
    address text,
    mass_address boolean,
    phone character varying(50),
    email character varying(100),
    director_inn character varying(12)
);


--
-- Name: zsk_risk; Type: TABLE; Schema: synthetic; Owner: -
--

CREATE TABLE synthetic.zsk_risk (
    inn character varying(12) NOT NULL,
    risk_level character varying(20) NOT NULL,
    as_of date
);


--
-- Name: efrsb_bankruptcies id; Type: DEFAULT; Schema: synthetic; Owner: -
--

ALTER TABLE ONLY synthetic.efrsb_bankruptcies ALTER COLUMN id SET DEFAULT nextval('synthetic.efrsb_bankruptcies_id_seq'::regclass);


--
-- Name: fns_account_blocks id; Type: DEFAULT; Schema: synthetic; Owner: -
--

ALTER TABLE ONLY synthetic.fns_account_blocks ALTER COLUMN id SET DEFAULT nextval('synthetic.fns_account_blocks_id_seq'::regclass);


--
-- Name: monthly_facts id; Type: DEFAULT; Schema: synthetic; Owner: -
--

ALTER TABLE ONLY synthetic.monthly_facts ALTER COLUMN id SET DEFAULT nextval('synthetic.monthly_facts_id_seq'::regclass);


--
-- Name: obligations id; Type: DEFAULT; Schema: synthetic; Owner: -
--

ALTER TABLE ONLY synthetic.obligations ALTER COLUMN id SET DEFAULT nextval('synthetic.obligations_id_seq'::regclass);


--
-- Name: other_income id; Type: DEFAULT; Schema: synthetic; Owner: -
--

ALTER TABLE ONLY synthetic.other_income ALTER COLUMN id SET DEFAULT nextval('synthetic.other_income_id_seq'::regclass);


--
-- Data for Name: synthetic_alfa_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.synthetic_alfa_accounts ("Id", "CustomerId", "AccountNumber", "Currency", "CurrentBalance", "OpenDate", "IsBlocked", "AccountType") FROM stdin;
0e399002-4cf9-4397-893a-512fdeb99d09	11111111-aaaa-1111-aaaa-111111111111	40802810900000000011	RUB	1850000.00	2021-10-22 16:22:27.630608+00	f	Расчетный счет ИП
85164f02-4135-47e3-b580-a6d9445dc035	22222222-bbbb-2222-bbbb-222222222222	40802810900000000022	RUB	620000.00	2023-10-22 16:22:27.630632+00	f	Расчетный счет ИП
6384d82b-5265-40a3-8d24-81f1b728bb23	22222222-9929-2222-9929-222222222222	40802810992934509242	RUB	1500000.00	2024-10-25 15:25:11.776421+00	f	Расчетный
fae91067-c214-4e82-a46a-d8fa41dc2f4c	33333333-9907-3333-9907-333333333333	40802810990750786404	RUB	1500000.00	2024-10-25 15:25:11.776421+00	f	Расчетный
46068c5a-7710-407d-a4fe-7a28f9bfaf53	44444444-9985-4444-9985-444444444444	40802810998575834946	RUB	1500000.00	2024-10-25 15:25:11.776421+00	f	Расчетный
34c833a2-bb15-4ef1-ae71-9a435df3770d	55555555-9962-5555-9962-555555555555	40802810996230601785	RUB	1500000.00	2024-10-25 15:25:11.776421+00	f	Расчетный
11111111-0001-aaaa-0001-111111111111	11111111-aaaa-1111-aaaa-111111111111	40802810900000000011	RUB	1850000.00	2019-02-10 00:00:00+00	f	Расчетный счет
22222222-0002-bbbb-0002-222222222222	22222222-bbbb-2222-bbbb-222222222222	40802810900000000022	RUB	620000.00	2021-05-15 00:00:00+00	f	Расчетный счет
33333333-0003-cccc-0003-333333333333	33333333-cccc-3333-cccc-333333333333	40802810900000000033	RUB	940000.00	2018-09-01 00:00:00+00	f	Расчетный счет
44444444-0004-dddd-0004-444444444444	77777777-eeee-7777-eeee-777777777777	40802810900000000077	RUB	310000.00	2023-01-20 00:00:00+00	f	Расчетный счет
55555555-0005-eeee-0005-555555555555	55555555-eeee-5555-eeee-555555555555	40802810900000000115	RUB	2150000.00	2021-09-01 00:00:00+00	f	Расчетный счет
\.


--
-- Data for Name: synthetic_alfa_customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.synthetic_alfa_customers ("Id", "Inn", "OrganizationName", "IsAlfaClient", "ClientSince", "RelationshipMonths", "Segment", "BranchOffice", "AverageMonthlyTurnover", "AverageMonthlyExpenses", "NetCashFlow", "AnnualRevenue", "CoefficientOfVariation", "MonthlyLoanPaymentsInAlfa", "ExistingLoansTotalBalance", "ActiveOperatingMonths", "Has115FzBlocks", "HasBankruptcySigns", "HasSuspensionByFns", "HasCourtBailiffEnforcements", "DaysWithoutOperations", "CreatedAt", "UpdatedAt") FROM stdin;
22222222-9929-2222-9929-222222222222	992934509242	ИП Захаров Виктор Сергеевич	t	2023-10-25 15:25:11.773754+00	36	Производство мебели	ДО Нижегородский	650000.00	420000.00	230000.00	7800000.00	0.2500	27800.00	320000.00	36	f	f	f	f	0	2026-10-25 15:25:11.773754+00	\N
33333333-9907-3333-9907-333333333333	990750786404	ИП Соловьёв Алексей Андреевич	t	2022-10-25 15:25:11.773754+00	48	Услуги и сервис	ДО Екатеринбургский	450000.00	180000.00	270000.00	5400000.00	0.1800	0.00	0.00	48	f	f	f	f	0	2026-10-25 15:25:11.773754+00	\N
44444444-9985-4444-9985-444444444444	998575834946	ИП Николаева Екатерина Петровна	t	2021-10-25 15:25:11.773754+00	60	Розничная торговля	ДО Санкт-Петербургский	680000.00	490000.00	190000.00	8160000.00	0.3000	45000.00	540000.00	60	f	f	f	f	0	2026-10-25 15:25:11.773754+00	\N
55555555-9962-5555-9962-555555555555	996230601785	ИП Волков Андрей Юрьевич	t	2024-10-25 15:25:11.773754+00	24	Аренда недвижимости	ДО Московский	720000.00	210000.00	510000.00	8640000.00	0.1500	0.00	0.00	24	f	f	f	f	0	2026-10-25 15:25:11.773754+00	\N
11111111-aaaa-1111-aaaa-111111111111	500100000011	ИП Иванов Иван Иванович	t	2021-10-22 16:22:27.630485+00	60	Малый бизнес (Торговля)	Главный офис Альфа-Банк	700000.00	300000.00	400000.00	8400000.00	0.2000	30000.00	240000.00	60	f	f	f	f	0	2026-10-22 16:22:27.630444+00	\N
22222222-bbbb-2222-bbbb-222222222222	500100000022	ИП Сидорова Анна Сергеевна	t	2023-10-22 16:22:27.630631+00	36	Услуги для бизнеса	Главный офис Альфа-Банк	400000.00	150000.00	250000.00	4800000.00	0.4500	60000.00	540000.00	36	f	f	f	f	0	2026-10-22 16:22:27.630631+00	\N
33333333-cccc-3333-cccc-333333333333	500100000033	ИП Кузнецов Алексей Петрович	t	2020-10-22 16:22:27.630632+00	72	Производство	Главный офис Альфа-Банк	500000.00	420000.00	80000.00	6000000.00	0.6500	90000.00	1100000.00	72	f	f	f	f	0	2026-10-22 16:22:27.630632+00	\N
77777777-eeee-7777-eeee-777777777777	500100000077	ИП Петров Михаил Дмитриевич	t	2025-10-22 16:22:27.630633+00	12	Розничная торговля	Главный офис Альфа-Банк	350000.00	180000.00	170000.00	420000.00	0.2800	0.00	0.00	12	f	f	f	f	0	2026-10-22 16:22:27.630633+00	\N
55555555-eeee-5555-eeee-555555555555	990000000115	ИП Иванов Сергей Петрович	t	2021-09-01 00:00:00+00	37	Малый бизнес (Торговля)	Отделение «Центральное»	850000.00	380000.00	470000.00	10200000.00	0.1800	0.00	0.00	37	f	f	f	f	0	2026-10-25 14:20:02.748492+00	\N
\.


--
-- Data for Name: synthetic_alfa_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.synthetic_alfa_transactions ("Id", "CustomerId", "Date", "Amount", "OperationType", "CounterpartyName", "PaymentPurpose", "Category", "ExcludedFromRevenue") FROM stdin;
\.


--
-- Data for Name: customer_profiles; Type: TABLE DATA; Schema: synthetic; Owner: -
--

COPY synthetic.customer_profiles (application_id, full_name, inn, ogrnip, registration_date, phone, email, own_bank_client, stage, purpose, product_code, amount_rub, requested_term_months, equipment_price_rub, own_contribution_rub, available_own_funds_rub, invoice_confirmed, startup_budget_total_rub, startup_own_funds_rub, pd_consent, automated_decision_consent, registry_status, applicant_match, check_status, failed_source, bki_consent, person_history, business_history, max_overdue_days_12m, current_overdue_rub, tax_debt_rub, kyc_risk_level, fns_account_block, bankruptcy_status, business_facts_state, activity_first_full_month, household_expenses_monthly_rub, other_income_state, business_committed_costs_monthly_rub, obligations_declaration_complete, verification_status, obligations_reconciled, repayment_source_confirmed, income_continuity_confirmed, findings_complete, supplier_inn, equipment_category, supplier_registration_date, supplier_status, supplier_mass_address, supplier_linked_to_applicant, equipment_reference_price_rub, duplicate_contacts, statement_unmatched_loan_payments, statement_needs_review, okved_main, tax_regime, region_name) FROM stdin;
DEMO-001	Иванов Сергей Петрович	990000000115	321504530351107	2021-09-01	+7 981 214-13-45	ip000115@example.com	да	operating	working_capital	WC	800000.00	12	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	0	0.00	\N	LOW	нет	NONE	AVAILABLE	2021-10	50000.00	\N	\N	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	47.11	УСН (доходы)	Московская область
DEMO-002	Захаров Виктор Сергеевич	992934509242	324527389082738	2024-07-01	+7 977 750-31-78	ip509242@example.com	да	operating	equipment	EQ	1880000.00	35	2167000.00	287000.00	429000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	0	0.00	\N	LOW	нет	NONE	AVAILABLE	2024-07	62000.00	\N	\N	да	CONFIRMED	да	да	да	да	9963393667	EQ-001	2019-05-15	ACTIVE	нет	нет	2126000.00	нет	нет	нет	31.01	ОСНО	Нижегородская область
DEMO-003	Соловьёв Алексей Андреевич	990750786404	322669799266838	2022-05-28	+7 914 400-65-30	ip786404@example.com	да	operating	working_capital	WC	1000000.00	24	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	0	0.00	\N	LOW	нет	NONE	AVAILABLE	2022-06	8000.00	\N	\N	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	96.02	УСН (доходы)	Свердловская область
DEMO-004	Николаева Екатерина Петровна	998575834946	318785520709328	2018-01-28	+7 928 107-19-90	ip834946@example.com	да	operating	working_capital	WC	910000.00	\N	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	NONE	0	0.00	\N	LOW	нет	NONE	AVAILABLE	2018-02	88000.00	\N	\N	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	47.11	УСН (доходы минус расходы)	г. Санкт-Петербург
DEMO-005	Кузьмина Дарья Юрьевна	997237475355	321633185876049	2021-09-08	+7 900 499-43-68	ip475355@example.com	нет	operating	equipment	EQ	2650000.00	\N	3301000.00	651000.00	736000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	0	0.00	\N	LOW	нет	NONE	AVAILABLE	2021-11	102000.00	\N	\N	да	CONFIRMED	да	да	да	да	9908255183	EQ-002	2019-04-15	ACTIVE	нет	нет	3407000.00	нет	нет	нет	31.01	УСН (доходы минус расходы)	Самарская область
DEMO-006	Воробьёва Татьяна Сергеевна	994209132544	324028773588868	2024-03-01	+7 931 478-46-30	ip132544@example.com	нет	operating	working_capital	WC	1070000.00	5	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	0	0.00	\N	LOW	нет	NONE	AVAILABLE	2024-03	138000.00	\N	\N	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	96.02	ОСНО	Республика Башкортостан
DEMO-007	Лебедев Павел Викторович	991802424801	321239926606723	2021-08-01	+7 952 735-29-40	ip424801@example.com	да	operating	working_capital	WC	1510000.00	\N	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	0	0.00	\N	LOW	нет	NONE	AVAILABLE	2021-08	78000.00	\N	\N	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	47.11	ПСН	Краснодарский край
DEMO-008	Попова Светлана Андреевна	992136717200	320233174573520	2020-05-10	+7 979 421-94-25	ip717200@example.com	нет	operating	equipment	EQ	460000.00	40	612000.00	152000.00	420000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	0	0.00	\N	LOW	нет	NONE	AVAILABLE	2020-06	39000.00	\N	\N	да	CONFIRMED	да	да	да	да	9908255183	EQ-003	2019-04-15	ACTIVE	нет	нет	610000.00	нет	нет	нет	49.41	ОСНО	Краснодарский край
DEMO-009	Соловьёв Виктор Сергеевич	998924531779	323774901221590	2023-05-15	+7 999 535-38-32	ip531779@example.com	нет	operating	working_capital	WC	3000000.00	23	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	0	0.00	\N	LOW	нет	NONE	AVAILABLE	2023-06	121000.00	\N	\N	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	96.02	УСН (доходы минус расходы)	г. Москва
DEMO-010	Морозов Илья Олегович	995940119912	319526355400300	2019-10-26	+7 903 498-53-95	ip119912@example.com	да	operating	working_capital	WC	600000.00	20	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	NONE	0	0.00	\N	LOW	нет	NONE	AVAILABLE	2019-11	51000.00	\N	\N	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	47.91	ОСНО	Нижегородская область
DEMO-011	Семёнов Илья Владимирович	991126723717	317668403483050	2017-10-01	+7 909 706-98-90	ip723717@example.com	да	operating	equipment	EQ	3070000.00	24	3431000.00	361000.00	486000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	0	0.00	\N	LOW	нет	NONE	AVAILABLE	2017-10	39000.00	\N	\N	да	CONFIRMED	да	да	да	да	9937546571	EQ-004	2013-02-15	ACTIVE	нет	нет	3397000.00	нет	нет	нет	18.12	УСН (доходы)	Свердловская область
DEMO-012	Попов Андрей Юрьевич	994973718155	320522379373270	2020-12-23	+7 962 668-40-98	ip718155@example.com	нет	operating	working_capital	WC	1880000.00	11	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	0	0.00	\N	LOW	нет	NONE	AVAILABLE	2021-02	24000.00	\N	\N	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	47.11	АУСН	Нижегородская область
DEMO-013	Алексеев Максим Александрович	998911520579	317521601996820	2017-05-11	+7 932 982-71-24	ip520579@example.com	нет	operating	working_capital	WC	370000.00	3	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	0	0.00	\N	LOW	нет	NONE	AVAILABLE	2017-06	130000.00	\N	\N	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	47.11	ОСНО	Нижегородская область
DEMO-014	Фёдорова Светлана Игоревна	993331162602	321661335237201	2021-08-01	+7 934 946-28-19	ip162602@example.com	да	operating	equipment	EQ	3280000.00	22	4437000.00	1157000.00	1236000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	0	0.00	\N	LOW	нет	NONE	AVAILABLE	2021-08	131000.00	\N	\N	да	CONFIRMED	да	да	да	да	9984416185	EQ-005	2019-09-15	ACTIVE	нет	нет	4412000.00	нет	нет	нет	18.12	АУСН	Свердловская область
DEMO-015	Егоров Александр Владимирович	995402377840	317164704235699	2017-05-24	+7 966 470-89-73	ip377840@example.com	да	operating	working_capital	WC	810000.00	\N	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	0	0.00	\N	LOW	нет	NONE	AVAILABLE	2017-06	101000.00	\N	\N	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	56.10	АУСН	Республика Татарстан
DEMO-016	Григорьева Ксения Юрьевна	998456015803	325526337014115	2025-03-01	+7 905 425-70-58	ip015803@example.com	да	operating	equipment	EQ	990000.00	24	1407000.00	417000.00	513000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	NONE	7	0.00	\N	LOW	нет	NONE	AVAILABLE	2025-03	77000.00	\N	\N	да	CONFIRMED	да	да	да	да	9937546571	EQ-006	2013-02-15	ACTIVE	нет	нет	1460000.00	нет	нет	нет	10.71	ПСН	Нижегородская область
DEMO-017	Степанова Елена Петровна	997059195989	325029801426950	2025-02-05	+7 987 911-33-31	ip195989@example.com	да	operating	working_capital	WC	680000.00	12	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	NONE	7	0.00	\N	LOW	нет	NONE	AVAILABLE	2025-04	11000.00	\N	\N	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	46.90	ОСНО	Республика Башкортостан
DEMO-018	Соколов Роман Сергеевич	998561811040	324029767054306	2024-12-16	+7 980 761-15-49	ip811040@example.com	да	operating	equipment	EQ	980000.00	18	1309000.00	329000.00	636000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	NONE	15	0.00	\N	LOW	нет	NONE	AVAILABLE	2025-01	19000.00	\N	\N	да	CONFIRMED	да	да	да	да	9966429047	EQ-007	2009-08-15	ACTIVE	нет	нет	1308000.00	нет	нет	нет	49.41	ПСН	Республика Башкортостан
DEMO-019	Макаров Дмитрий Олегович	992695022198	323771246834177	2023-12-07	+7 989 409-93-62	ip022198@example.com	да	operating	working_capital	WC	2250000.00	22	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	7	0.00	\N	LOW	нет	NONE	AVAILABLE	2024-02	45000.00	\N	\N	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	47.11	УСН (доходы)	г. Москва
DEMO-020	Семёнов Кирилл Петрович	991379819032	323024837455115	2023-11-09	+7 970 910-15-67	ip819032@example.com	нет	operating	equipment	EQ	1580000.00	\N	2243000.00	663000.00	699000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	25	0.00	\N	LOW	нет	NONE	AVAILABLE	2023-12	79000.00	\N	\N	да	CONFIRMED	да	да	да	да	9955348621	EQ-008	2020-10-15	ACTIVE	нет	нет	2234000.00	нет	нет	нет	31.01	УСН (доходы)	Республика Башкортостан
DEMO-021	Попова Татьяна Николаевна	999189653802	322549341952978	2022-04-28	+7 939 556-87-64	ip653802@example.com	нет	operating	working_capital	WC	770000.00	\N	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	15	0.00	\N	LOW	нет	NONE	AVAILABLE	2022-05	160000.00	\N	\N	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	46.90	ПСН	Новосибирская область
DEMO-022	Павлова Мария Николаевна	998523591925	325239291168513	2025-04-08	+7 957 353-28-22	ip591925@example.com	нет	operating	equipment	EQ	1660000.00	24	2010000.00	350000.00	575000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	15	0.00	\N	LOW	нет	NONE	AVAILABLE	2025-05	55000.00	\N	\N	да	CONFIRMED	да	да	да	да	9985733934	EQ-009	2010-02-15	ACTIVE	нет	нет	2131000.00	нет	нет	нет	18.12	УСН (доходы минус расходы)	Краснодарский край
DEMO-023	Лебедева Ксения Игоревна	992138657644	324773575997359	2024-01-08	+7 925 716-75-61	ip657644@example.com	да	operating	working_capital	WC	1770000.00	12	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	25	0.00	\N	LOW	нет	NONE	AVAILABLE	2024-02	144000.00	\N	\N	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	47.11	АУСН	г. Москва
DEMO-024	Андреев Виктор Олегович	998137090900	322634046125203	2022-11-06	+7 994 844-17-27	ip090900@example.com	да	operating	equipment	EQ	890000.00	24	1089000.00	199000.00	281000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	NONE	25	0.00	\N	LOW	нет	NONE	AVAILABLE	2023-01	27000.00	\N	\N	да	CONFIRMED	да	да	да	да	9993280999	EQ-010	2020-10-15	ACTIVE	нет	нет	1107000.00	нет	нет	нет	49.41	ПСН	Самарская область
DEMO-025	Петров Алексей Николаевич	990000000362	323662646979081	2023-09-01	+7 922 570-78-53	ip000362@example.com	нет	operating	equipment	EQ	2250000.00	24	2500000.00	250000.00	350000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	10	0.00	\N	LOW	нет	NONE	AVAILABLE	2023-10	20000.00	\N	\N	да	CONFIRMED	да	да	да	да	9993280999	EQ-011	2020-10-15	ACTIVE	нет	нет	2668000.00	нет	нет	нет	18.12	ПСН	Свердловская область
DEMO-026	Васильев Роман Игоревич	993878947883	324166935276091	2024-08-11	+7 900 663-30-62	ip947883@example.com	нет	operating	working_capital	WC	2750000.00	12	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	NO_RECORD	NONE	0	0.00	\N	LOW	нет	NONE	AVAILABLE	2024-09	46000.00	\N	\N	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	56.10	УСН (доходы)	Республика Татарстан
DEMO-027	Николаева Ирина Владимировна	995379892706	323789651750956	2023-07-04	+7 973 649-29-31	ip892706@example.com	нет	operating	equipment	EQ	2140000.00	34	2420000.00	280000.00	506000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	20	0.00	\N	LOW	нет	NONE	AVAILABLE	2023-08	16000.00	\N	\N	да	CONFIRMED	да	да	да	да	9984416185	EQ-012	2019-09-15	ACTIVE	нет	нет	2610000.00	нет	нет	нет	45.20	ОСНО	г. Санкт-Петербург
DEMO-028	Соловьёв Александр Николаевич	996085865370	323161665603110	2023-12-01	+7 959 789-79-64	ip865370@example.com	нет	operating	equipment	EQ	5000000.00	17	5717000.00	717000.00	1108000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	10	0.00	\N	LOW	нет	NONE	AVAILABLE	2023-12	123000.00	\N	\N	да	CONFIRMED	да	да	да	да	9963393667	EQ-013	2019-05-15	ACTIVE	нет	нет	5344000.00	нет	нет	нет	45.20	ПСН	Республика Татарстан
DEMO-029	Семёнов Павел Викторович	990432413409	322239119728837	2022-06-01	+7 940 813-63-62	ip413409@example.com	нет	operating	working_capital	WC	2500000.00	6	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	0	0.00	\N	LOW	нет	NONE	AVAILABLE	2022-06	74000.00	\N	\N	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	47.91	УСН (доходы минус расходы)	Краснодарский край
DEMO-030	Семёнова Ксения Сергеевна	994380553287	322233233372343	2022-12-26	+7 992 672-41-83	ip553287@example.com	да	operating	equipment	EQ	3910000.00	11	4682000.00	772000.00	926000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	10	0.00	\N	LOW	нет	NONE	AVAILABLE	2023-02	207000.00	\N	\N	да	CONFIRMED	да	да	да	да	9901477331	EQ-014	2009-10-15	ACTIVE	нет	нет	4554000.00	нет	нет	нет	45.20	ПСН	Краснодарский край
DEMO-031	Захаров Андрей Олегович	992244219794	323507072339805	2023-08-04	+7 937 951-98-18	ip219794@example.com	нет	operating	equipment	EQ	4060000.00	\N	5139000.00	1079000.00	1460000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	NONE	20	0.00	\N	LOW	нет	NONE	AVAILABLE	2023-09	89000.00	\N	\N	да	CONFIRMED	да	да	да	да	9975461167	EQ-015	2012-09-15	ACTIVE	нет	нет	5066000.00	нет	нет	нет	49.41	УСН (доходы минус расходы)	Московская область
DEMO-032	Николаев Максим Андреевич	992776526274	324634214909160	2024-08-16	+7 941 301-68-24	ip526274@example.com	нет	operating	working_capital	WC	2800000.00	9	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	NONE	10	0.00	\N	LOW	нет	NONE	AVAILABLE	2024-09	23000.00	\N	\N	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	56.10	ОСНО	Самарская область
DEMO-033	Кузьмина Ксения Владимировна	990950641484	322631417155431	2022-07-17	+7 963 495-24-40	ip641484@example.com	да	operating	equipment	EQ	1550000.00	\N	1942000.00	392000.00	691000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	20	0.00	\N	LOW	нет	NONE	AVAILABLE	2022-08	42000.00	\N	\N	да	CONFIRMED	да	да	да	да	9901477331	EQ-016	2009-10-15	ACTIVE	нет	нет	2135000.00	нет	нет	нет	10.71	АУСН	Самарская область
DEMO-034	Васильев Александр Олегович	991609452511	324773800436781	2024-07-10	+7 906 272-83-65	ip452511@example.com	нет	operating	equipment	EQ	3160000.00	24	3584000.00	424000.00	763000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	20	0.00	\N	LOW	нет	NONE	AVAILABLE	2024-09	29000.00	\N	\N	да	CONFIRMED	да	да	да	да	9918934554	EQ-017	2013-09-15	ACTIVE	нет	нет	3902000.00	нет	нет	нет	31.01	УСН (доходы минус расходы)	г. Москва
DEMO-035	Николаева Елена Петровна	993778538703	318633208900080	2018-12-23	+7 929 666-17-59	ip538703@example.com	нет	operating	working_capital	WC	2910000.00	24	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	0	0.00	\N	LOW	нет	NONE	AVAILABLE	2019-01	24000.00	\N	\N	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	46.90	УСН (доходы)	Самарская область
DEMO-036	Борисова Ольга Викторовна	999161049252	322520181365429	2022-03-01	+7 909 688-39-43	ip049252@example.com	нет	operating	working_capital	WC	2080000.00	23	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	0	0.00	\N	LOW	нет	NONE	AVAILABLE	2022-03	71000.00	\N	\N	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	46.90	АУСН	Нижегородская область
DEMO-037	Степанов Максим Игоревич	998609030311	323504952797371	2023-07-01	+7 923 326-88-42	ip030311@example.com	да	operating	working_capital	WC	1360000.00	24	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	0	0.00	\N	LOW	нет	NONE	AVAILABLE	2023-07	5000.00	\N	\N	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	96.02	ОСНО	Московская область
DEMO-038	Макаров Илья Николаевич	990904127612	326525923531179	2026-05-23	+7 946 237-96-52	ip127612@example.com	нет	operating	working_capital	WC	2570000.00	\N	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	30	0.00	\N	LOW	нет	NONE	AVAILABLE	2026-06	39000.00	\N	\N	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	56.10	УСН (доходы)	Нижегородская область
DEMO-039	Кузьмин Андрей Олегович	993766363375	323165043088583	2023-11-01	+7 929 164-43-57	ip363375@example.com	да	operating	working_capital	WC	100000.00	7	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	NONE	0	0.00	\N	LOW	нет	NONE	AVAILABLE	2023-11	343000.00	\N	\N	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	96.02	АУСН	Республика Татарстан
DEMO-040	Воробьёва Дарья Викторовна	992222723768	326785061763431	2026-06-16	+7 951 713-82-91	ip723768@example.com	нет	operating	working_capital	WC	2480000.00	4	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	20	0.00	\N	LOW	нет	NONE	AVAILABLE	2026-07	37000.00	\N	\N	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	47.91	АУСН	г. Санкт-Петербург
DEMO-041	Борисов Павел Юрьевич	995513219350	323509771967092	2023-11-28	+7 944 703-99-83	ip219350@example.com	нет	operating	working_capital	WC	100000.00	12	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	0	0.00	\N	LOW	нет	NONE	AVAILABLE	2023-12	1293000.00	\N	\N	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	56.10	УСН (доходы)	Московская область
DEMO-042	Васильев Егор Владимирович	992536997142	326636593047150	2026-01-10	+7 957 901-99-30	ip997142@example.com	да	operating	working_capital	WC	1490000.00	15	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	10	0.00	\N	LOW	нет	NONE	AVAILABLE	2026-03	37000.00	\N	\N	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	46.90	УСН (доходы)	Самарская область
DEMO-043	Зайцев Егор Сергеевич	992157389091	321669982726322	2021-03-01	+7 911 662-46-81	ip389091@example.com	нет	operating	working_capital	WC	100000.00	12	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	0	0.00	\N	LOW	нет	NONE	AVAILABLE	2021-03	1394000.00	\N	\N	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	47.91	АУСН	Свердловская область
DEMO-044	Зайцева Екатерина Николаевна	995464468400	324787123461798	2024-09-07	+7 926 334-35-41	ip468400@example.com	да	operating	equipment	EQ	5000000.00	24	6367000.00	1367000.00	1440000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	0	25925.50	\N	LOW	нет	NONE	AVAILABLE	2024-10	147000.00	\N	\N	да	CONFIRMED	да	да	да	да	9975461167	EQ-018	2012-09-15	ACTIVE	нет	нет	5854000.00	нет	нет	нет	10.71	АУСН	г. Санкт-Петербург
DEMO-045	Михайлова Юлия Игоревна	996473214788	324631565985178	2024-10-01	+7 973 802-39-22	ip214788@example.com	да	operating	working_capital	WC	680000.00	16	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	NONE	77	0.00	\N	LOW	нет	NONE	AVAILABLE	2024-10	64000.00	\N	\N	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	46.90	УСН (доходы минус расходы)	Самарская область
DEMO-046	Алексеева Татьяна Николаевна	992370382737	319521796564501	2019-10-01	+7 990 373-87-92	ip382737@example.com	нет	operating	equipment	EQ	480000.00	24	617000.00	137000.00	299000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	0	10351.50	\N	LOW	нет	NONE	AVAILABLE	2019-10	26000.00	\N	\N	да	CONFIRMED	да	да	да	да	9958033620	EQ-019	2015-12-15	ACTIVE	нет	нет	654000.00	нет	нет	нет	49.41	УСН (доходы минус расходы)	Нижегородская область
DEMO-047	Лебедева Наталья Викторовна	993149112877	324230113342266	2024-07-25	+7 929 924-21-66	ip112877@example.com	нет	operating	working_capital	WC	3000000.00	23	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	112	0.00	\N	LOW	нет	NONE	AVAILABLE	2024-08	338000.00	\N	\N	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	56.10	УСН (доходы)	Краснодарский край
DEMO-048	Соколова Анастасия Олеговна	993848857784	319529057509427	2019-03-13	+7 927 450-63-49	ip857784@example.com	нет	operating	equipment	EQ	1150000.00	\N	1307000.00	157000.00	265000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	NONE	0	58464.50	\N	LOW	нет	NONE	AVAILABLE	2019-04	24000.00	\N	\N	да	CONFIRMED	да	да	да	да	9937546571	EQ-020	2013-02-15	ACTIVE	нет	нет	1181000.00	нет	нет	нет	10.71	УСН (доходы минус расходы)	Нижегородская область
DEMO-049	Макарова Елена Андреевна	995266995933	324168412501354	2024-02-26	+7 901 271-45-84	ip995933@example.com	нет	operating	working_capital	WC	370000.00	4	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	NO_RECORD	NONE	0	0.00	\N	LOW	нет	NONE	AVAILABLE	2024-03	\N	\N	\N	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	47.11	УСН (доходы)	Республика Татарстан
DEMO-050	Макарова Ирина Юрьевна	991200978947	319545627156310	2019-09-13	+7 993 289-12-89	ip978947@example.com	да	operating	working_capital	WC	690000.00	11	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	0	0.00	\N	LOW	нет	NONE	AVAILABLE	2019-10	94000.00	\N	\N	нет	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	47.11	АУСН	Новосибирская область
DEMO-051	Николаев Илья Владимирович	993800094277	318784925474871	2018-11-21	+7 924 638-94-41	ip094277@example.com	нет	operating	equipment	EQ	2960000.00	\N	4181000.00	1221000.00	1260000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	нет	\N	\N	\N	\N	\N	LOW	нет	NONE	AVAILABLE	2018-12	251000.00	\N	\N	да	CONFIRMED	да	да	да	да	9963393667	EQ-021	2019-05-15	ACTIVE	нет	нет	4296000.00	нет	нет	нет	18.12	АУСН	г. Санкт-Петербург
DEMO-052	Романова Юлия Владимировна	992421241367	323785242827888	2023-08-27	+7 929 362-48-21	ip241367@example.com	да	operating	equipment	EQ	5000000.00	\N	6189000.00	1189000.00	1251000.00	нет	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	NONE	0	0.00	\N	LOW	нет	NONE	AVAILABLE	2023-09	33000.00	\N	\N	да	CONFIRMED	да	да	да	да	9951695448	EQ-022	2008-11-15	ACTIVE	нет	нет	6407000.00	нет	нет	нет	49.41	ОСНО	г. Санкт-Петербург
DEMO-053	Макаров Илья Александрович	998620195652	326540542452324	2026-08-20	+7 939 636-15-50	ip195652@example.com	да	prelaunch	equipment	EQ	1250000.00	\N	1984000.00	734000.00	1105000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	NO_RECORD	NONE	0	0.00	\N	LOW	нет	NONE	NO_HISTORY	\N	\N	AVAILABLE	49000.00	да	CONFIRMED	да	да	да	да	9951695448	EQ-023	2008-11-15	ACTIVE	нет	нет	2068000.00	нет	\N	\N	18.12	НПД	Новосибирская область
DEMO-054	Козлов Михаил Владимирович	995980959851	326163472606002	2026-10-13	+7 962 504-93-83	ip959851@example.com	да	prelaunch	equipment	EQ	1920000.00	\N	2692000.00	772000.00	1051000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	NO_RECORD	NONE	0	0.00	\N	LOW	нет	NONE	NO_HISTORY	\N	101000.00	AVAILABLE	17000.00	нет	CONFIRMED	да	да	да	да	9900905432	EQ-024	2010-03-15	ACTIVE	нет	нет	2662000.00	нет	\N	\N	10.71	НПД	Республика Татарстан
DEMO-055	Зайцева Вера Сергеевна	991510350302	326774832499310	2026-10-03	+7 914 857-16-41	ip350302@example.com	нет	prelaunch	equipment	EQ	860000.00	\N	1142000.00	282000.00	556000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	нет	\N	\N	\N	\N	\N	LOW	нет	NONE	NO_HISTORY	\N	83000.00	AVAILABLE	11000.00	да	CONFIRMED	да	да	да	да	9990927815	EQ-025	2014-09-15	ACTIVE	нет	нет	1159000.00	нет	\N	\N	49.41	АУСН	г. Москва
DEMO-056	Павлова Светлана Александровна	992805278597	326774087748052	2026-08-11	+7 908 497-94-44	ip278597@example.com	да	prelaunch	equipment	EQ	2240000.00	\N	2948000.00	708000.00	987000.00	нет	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	NONE	0	0.00	\N	LOW	нет	NONE	NO_HISTORY	\N	79000.00	AVAILABLE	41000.00	да	CONFIRMED	да	да	да	да	9901477331	EQ-026	2009-10-15	ACTIVE	нет	нет	2826000.00	нет	\N	\N	49.41	ОСНО	г. Москва
DEMO-057	Смирнов Артём Андреевич	991336858301	326775958615871	2026-08-24	+7 945 740-48-40	ip858301@example.com	нет	operating	working_capital	WC	1460000.00	10	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	NO_RECORD	NONE	0	0.00	\N	LOW	нет	NONE	AVAILABLE	2026-09	48000.00	AVAILABLE	58000.00	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	56.10	ПСН	г. Москва
DEMO-058	Никитин Павел Владимирович	992036192703	326500728147719	2026-07-09	+7 917 416-98-77	ip192703@example.com	нет	operating	working_capital	WC	560000.00	12	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	0	0.00	\N	LOW	нет	NONE	AVAILABLE	2026-08	77000.00	AVAILABLE	44000.00	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	96.02	ОСНО	Московская область
DEMO-059	Андреева Юлия Николаевна	994262722612	326778373320601	2026-09-03	+7 977 680-88-39	ip722612@example.com	да	operating	working_capital	WC	1050000.00	\N	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	NO_RECORD	NONE	0	0.00	\N	LOW	нет	NONE	NO_HISTORY	\N	118000.00	AVAILABLE	58000.00	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	\N	\N	56.10	АУСН	г. Москва
DEMO-060	Новикова Мария Игоревна	996742086400	326166527598210	2026-07-06	+7 956 987-88-72	ip086400@example.com	нет	operating	working_capital	WC	1250000.00	12	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	NO_RECORD	NONE	0	0.00	\N	LOW	нет	NONE	AVAILABLE	2026-08	65000.00	AVAILABLE	34000.00	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	46.90	УСН (доходы)	Республика Татарстан
DEMO-061	Николаев Илья Викторович	995105295641	326231787636258	2026-08-28	+7 997 745-16-34	ip295641@example.com	нет	operating	working_capital	WC	1250000.00	\N	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	0	0.00	\N	LOW	нет	NONE	AVAILABLE	2026-09	78000.00	AVAILABLE	42000.00	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	56.10	АУСН	Краснодарский край
DEMO-062	Сидорова Анна Викторовна	990000000299	326525375772138	2026-10-01	+7 937 727-16-98	ip000299@example.com	да	prelaunch	equipment	EQ	1600000.00	24	2000000.00	400000.00	500000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	NO_RECORD	NONE	0	0.00	\N	LOW	нет	NONE	NO_HISTORY	\N	150000.00	AVAILABLE	20000.00	да	CONFIRMED	да	да	да	да	9991205481	EQ-027	2010-04-15	ACTIVE	нет	нет	1889000.00	нет	\N	\N	31.01	УСН (доходы)	Нижегородская область
DEMO-063	Васильев Дмитрий Сергеевич	999343085833	326635909293972	2026-08-19	+7 990 560-91-56	ip085833@example.com	нет	prelaunch	equipment	EQ	1490000.00	24	2409000.00	919000.00	1238000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	NONE	0	0.00	\N	LOW	нет	NONE	NO_HISTORY	\N	71000.00	AVAILABLE	55000.00	да	CONFIRMED	да	да	да	да	9967526580	EQ-028	2018-11-15	ACTIVE	нет	нет	2332000.00	нет	\N	\N	18.12	АУСН	Самарская область
DEMO-064	Соловьёва Ольга Александровна	994498886107	326164403966777	2026-08-06	+7 958 609-73-79	ip886107@example.com	нет	prelaunch	equipment	EQ	2440000.00	24	3934000.00	1494000.00	1878000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	NO_RECORD	NONE	0	0.00	\N	LOW	нет	NONE	NO_HISTORY	\N	46000.00	AVAILABLE	46000.00	да	CONFIRMED	да	да	да	да	9951695448	EQ-029	2008-11-15	ACTIVE	нет	нет	3548000.00	нет	\N	\N	45.20	АУСН	Республика Татарстан
DEMO-065	Воробьёва Мария Александровна	998054434184	326520999935846	2026-08-20	+7 913 526-32-30	ip434184@example.com	да	prelaunch	equipment	EQ	300000.00	\N	450000.00	150000.00	485000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	NO_RECORD	NONE	0	0.00	\N	LOW	нет	NONE	NO_HISTORY	\N	99000.00	AVAILABLE	20000.00	да	CONFIRMED	да	да	да	да	9987862371	EQ-030	2010-12-15	ACTIVE	нет	нет	420000.00	нет	\N	\N	18.12	ПСН	Нижегородская область
DEMO-066	Макаров Михаил Сергеевич	995086037890	326026175547521	2026-09-12	+7 961 841-98-87	ip037890@example.com	нет	prelaunch	equipment	EQ	2560000.00	\N	3778000.00	1218000.00	1262000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	NONE	0	0.00	\N	LOW	нет	NONE	NO_HISTORY	\N	72000.00	AVAILABLE	16000.00	да	CONFIRMED	да	да	да	да	9951695448	EQ-031	2008-11-15	ACTIVE	нет	нет	3761000.00	нет	\N	\N	49.41	ОСНО	Республика Башкортостан
DEMO-067	Андреева Елена Юрьевна	998244860543	326163304682617	2026-09-05	+7 905 441-54-81	ip860543@example.com	да	prelaunch	equipment	EQ	2150000.00	\N	3356000.00	1206000.00	1501000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	NONE	0	0.00	\N	LOW	нет	NONE	NO_HISTORY	\N	46000.00	AVAILABLE	40000.00	да	CONFIRMED	да	да	да	да	9953994228	EQ-032	2019-02-15	ACTIVE	нет	нет	3069000.00	нет	\N	\N	49.41	ПСН	Республика Татарстан
DEMO-068	Романов Олег Викторович	994347632171	326026199759932	2026-10-18	+7 942 573-62-17	ip632171@example.com	нет	prelaunch	equipment	EQ	1840000.00	24	2743000.00	903000.00	1096000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	NONE	0	0.00	\N	LOW	нет	NONE	NO_HISTORY	\N	81000.00	AVAILABLE	58000.00	да	CONFIRMED	да	да	да	да	9955348621	EQ-033	2020-10-15	ACTIVE	нет	нет	2535000.00	нет	\N	\N	49.41	НПД	Республика Башкортостан
DEMO-069	Романова Екатерина Андреевна	990888696312	326508351460731	2026-09-12	+7 957 949-48-37	ip696312@example.com	нет	prelaunch	equipment	EQ	1790000.00	25	2720000.00	930000.00	1039000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	NO_RECORD	NONE	0	0.00	\N	LOW	нет	NONE	NO_HISTORY	\N	86000.00	AVAILABLE	52000.00	да	CONFIRMED	да	да	да	да	9966429047	EQ-034	2009-08-15	ACTIVE	нет	нет	2589000.00	нет	\N	\N	10.71	УСН (доходы минус расходы)	Московская область
DEMO-070	Захаров Олег Викторович	996791345833	326528226797091	2026-08-15	+7 914 104-49-15	ip345833@example.com	нет	prelaunch	equipment	EQ	300000.00	12	388000.00	88000.00	378000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	NO_RECORD	NONE	0	0.00	\N	LOW	нет	NONE	NO_HISTORY	\N	78000.00	AVAILABLE	47000.00	да	CONFIRMED	да	да	нет	да	9958033620	EQ-035	2015-12-15	ACTIVE	нет	нет	390000.00	нет	\N	\N	10.71	НПД	Нижегородская область
DEMO-071	Васильев Андрей Викторович	990301724986	326023343391092	2026-10-10	+7 944 662-50-44	ip724986@example.com	нет	prelaunch	equipment	EQ	2720000.00	\N	3500000.00	780000.00	1163000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	NO_RECORD	NONE	0	0.00	\N	LOW	нет	NONE	NO_HISTORY	\N	47000.00	AVAILABLE	24000.00	да	CONFIRMED	да	нет	да	да	9987862371	EQ-036	2010-12-15	ACTIVE	нет	нет	3204000.00	нет	\N	\N	45.20	ОСНО	Республика Башкортостан
DEMO-072	Воробьёв Павел Олегович	995954537846	326522487797665	2026-09-18	+7 972 234-21-99	ip537846@example.com	да	prelaunch	equipment	EQ	410000.00	24	624000.00	214000.00	482000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	NO_RECORD	NONE	0	0.00	\N	LOW	нет	NONE	NO_HISTORY	\N	65000.00	CONFIRMED_NONE	14000.00	да	CONFIRMED	да	нет	нет	да	9901477331	EQ-037	2009-10-15	ACTIVE	нет	нет	568000.00	нет	\N	\N	49.41	УСН (доходы минус расходы)	Нижегородская область
DEMO-073	Орлова Дарья Викторовна	993463525531	326634439298658	2026-08-20	+7 913 515-23-51	ip525531@example.com	нет	prelaunch	equipment	EQ	2480000.00	24	3931000.00	1451000.00	1564000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	NO_RECORD	NONE	0	0.00	\N	LOW	нет	NONE	NO_HISTORY	\N	427500.00	AVAILABLE	54000.00	да	CONFIRMED	да	да	да	да	9918934554	EQ-038	2013-09-15	ACTIVE	нет	нет	4142000.00	нет	\N	\N	31.01	УСН (доходы минус расходы)	Самарская область
DEMO-074	Андреева Наталья Андреевна	997354447295	326788740974800	2026-10-08	+7 971 199-66-32	ip447295@example.com	нет	prelaunch	equipment	EQ	830000.00	48	1352000.00	522000.00	752000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	NONE	0	16445.00	\N	LOW	нет	NONE	NO_HISTORY	\N	92000.00	AVAILABLE	32000.00	да	CONFIRMED	да	да	да	да	9918934554	EQ-039	2013-09-15	ACTIVE	нет	нет	1309000.00	нет	\N	\N	18.12	ОСНО	г. Санкт-Петербург
DEMO-075	Никитина Татьяна Николаевна	996634317106	326785480634644	2026-09-11	+7 972 913-96-48	ip317106@example.com	нет	prelaunch	equipment	EQ	1850000.00	\N	2494000.00	644000.00	890000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	NONE	59	0.00	\N	LOW	нет	NONE	NO_HISTORY	\N	82000.00	AVAILABLE	48000.00	да	CONFIRMED	да	да	да	да	9991205481	EQ-040	2010-04-15	ACTIVE	нет	нет	2492000.00	нет	\N	\N	18.12	АУСН	г. Санкт-Петербург
DEMO-076	Егорова Ирина Владимировна	990837660300	326549370928151	2026-08-10	+7 984 277-70-27	ip660300@example.com	нет	prelaunch	equipment	EQ	1390000.00	33	2059000.00	669000.00	954000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	NONE	0	0.00	\N	LOW	нет	NONE	NO_HISTORY	\N	104000.00	MISSING	28000.00	да	CONFIRMED	да	да	да	да	9918934554	EQ-041	2013-09-15	ACTIVE	нет	нет	1990000.00	нет	\N	\N	31.01	НПД	Новосибирская область
DEMO-077	Николаев Олег Олегович	990155729503	326025387272022	2026-08-05	+7 949 463-38-33	ip729503@example.com	да	prelaunch	equipment	EQ	460000.00	35	643000.00	183000.00	255000.00	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	NO_RECORD	NONE	0	0.00	\N	LOW	нет	NONE	NO_HISTORY	\N	69000.00	AVAILABLE	\N	да	CONFIRMED	да	да	да	да	9958033620	EQ-042	2015-12-15	ACTIVE	нет	нет	690000.00	нет	\N	\N	31.01	ПСН	Республика Башкортостан
DEMO-078	Макарова Полина Сергеевна	997735670302	326544875161246	2026-09-18	+7 987 748-79-84	ip670302@example.com	да	prelaunch	equipment	EQ	1580000.00	24	2272000.00	692000.00	\N	да	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	NO_RECORD	NONE	0	0.00	\N	LOW	нет	NONE	NO_HISTORY	\N	40000.00	AVAILABLE	34000.00	да	CONFIRMED	да	да	да	да	9953994228	EQ-043	2019-02-15	ACTIVE	нет	нет	2287000.00	нет	\N	\N	18.12	ОСНО	Новосибирская область
DEMO-079	Соловьёв Илья Юрьевич	994736738702	319022838924975	2019-09-15	+7 930 776-66-91	ip738702@example.com	да	operating	working_capital	WC	79000.00	\N	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	\N	\N	\N	\N	\N	\N	\N	\N	LOW	нет	NONE	AVAILABLE	2019-10	121000.00	\N	\N	да	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	56.10	УСН (доходы)	Республика Башкортостан
DEMO-080	Лебедев Андрей Николаевич	995351862130	324021288244442	2024-03-16	+7 932 297-14-13	ip862130@example.com	да	operating	working_capital	WC	1320000.00	30	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	\N	\N	\N	\N	\N	\N	\N	\N	LOW	нет	NONE	AVAILABLE	2024-04	180000.00	\N	\N	да	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	47.91	УСН (доходы)	Республика Башкортостан
DEMO-081	Козлова Дарья Александровна	998809979516	318237597857823	2018-04-14	+7 904 780-59-44	ip979516@example.com	нет	operating	equipment	EQ	6417500.00	\N	7550000.00	1132500.00	685000.00	да	\N	\N	да	да	ACTIVE	PASS	\N	\N	\N	\N	\N	\N	\N	\N	LOW	нет	NONE	AVAILABLE	2018-05	118000.00	\N	\N	да	\N	\N	\N	\N	\N	9990927815	EQ-044	2014-09-15	ACTIVE	нет	нет	6862000.00	нет	нет	нет	18.12	АУСН	Краснодарский край
DEMO-082	Макаров Алексей Олегович	999767928999	319771269024461	2019-07-14	+7 968 954-67-12	ip928999@example.com	нет	operating	equipment	EQ	807240.00	7	868000.00	60760.00	284000.00	да	\N	\N	да	да	ACTIVE	PASS	\N	\N	\N	\N	\N	\N	\N	\N	LOW	нет	NONE	AVAILABLE	2019-09	124000.00	\N	\N	да	\N	\N	\N	\N	\N	9955348621	EQ-045	2020-10-15	ACTIVE	нет	нет	784000.00	нет	нет	нет	49.41	УСН (доходы минус расходы)	г. Москва
DEMO-083	Кузьмина Ольга Сергеевна	996152142806	326788637754064	2026-10-17	+7 958 725-31-85	ip142806@example.com	да	prelaunch	equipment	EQ	2550000.00	36	3000000.00	450000.00	2631000.00	да	\N	\N	да	да	ACTIVE	PASS	\N	\N	\N	\N	\N	\N	\N	\N	LOW	нет	NONE	NO_HISTORY	\N	51000.00	AVAILABLE	14000.00	да	\N	\N	\N	\N	\N	9927819170	EQ-046	2011-01-15	ACTIVE	нет	нет	3035000.00	нет	\N	\N	31.01	УСН (доходы минус расходы)	г. Санкт-Петербург
DEMO-084	Попов Роман Николаевич	999904307315	320783885885657	2020-03-27	+7 944 528-10-81	ip307315@example.com	да	operating	equipment	EQ	1140000.00	17	1396000.00	306000.00	593000.00	да	\N	\N	да	да	ACTIVE	PASS	\N	\N	\N	\N	\N	\N	\N	\N	LOW	нет	NONE	AVAILABLE	2020-04	113000.00	\N	\N	да	\N	\N	\N	\N	\N	9967955733	EQ-047	2014-10-15	ACTIVE	нет	нет	1288000.00	нет	нет	нет	18.12	ОСНО	г. Санкт-Петербург
DEMO-085	Волков Андрей Юрьевич	996230601785	326778434156330	2026-10-08	+7 932 442-88-68	ip601785@example.com	да	prelaunch	working_capital	START	700000.00	8	\N	\N	\N	\N	700000.00	0.00	да	да	ACTIVE	PASS	\N	\N	\N	\N	\N	\N	\N	\N	LOW	нет	NONE	NO_HISTORY	\N	102000.00	AVAILABLE	44000.00	да	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	нет	\N	\N	96.02	УСН (доходы)	г. Москва
DEMO-086	Орлов Михаил Владимирович	990951060066	\N	\N	+7 911 521-76-72	ip060066@example.com	нет	operating	equipment	EQ	4130000.00	24	5573000.00	1443000.00	1824000.00	да	\N	\N	да	да	NOT_FOUND	\N	\N	\N	\N	\N	\N	\N	\N	\N	LOW	нет	NONE	AVAILABLE	2019-08	50000.00	\N	\N	да	\N	\N	\N	\N	\N	9955995065	EQ-048	2019-01-15	ACTIVE	нет	нет	5881000.00	нет	нет	нет	\N	\N	\N
DEMO-087	Семёнов Максим Андреевич	999798132406	\N	\N	+7 980 575-91-10	ip132406@example.com	нет	operating	working_capital	WC	2400000.00	12	\N	\N	\N	\N	\N	\N	да	да	NOT_FOUND	\N	\N	\N	\N	\N	\N	\N	\N	\N	LOW	нет	NONE	AVAILABLE	2019-11	45000.00	\N	\N	да	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	\N	\N	\N
DEMO-088	Андреева Татьяна Сергеевна	990439082241	317662962912567	2017-05-18	+7 924 568-21-20	ip082241@example.com	да	operating	equipment	EQ	1240000.00	24	1622000.00	382000.00	595000.00	да	\N	\N	да	да	\N	\N	ERROR	EGRIP	\N	\N	\N	\N	\N	\N	LOW	нет	NONE	AVAILABLE	2017-06	209000.00	\N	\N	да	\N	\N	\N	\N	\N	9991205481	EQ-049	2010-04-15	ACTIVE	нет	нет	1657000.00	нет	нет	нет	10.71	УСН (доходы)	Свердловская область
DEMO-089	Михайлова Вера Игоревна	992019950851	317522202838913	2017-04-17	+7 920 343-24-15	ip950851@example.com	да	operating	working_capital	WC	1470000.00	8	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	INCOMPLETE	BKI	да	\N	\N	\N	\N	\N	LOW	нет	NONE	AVAILABLE	2017-05	80000.00	\N	\N	да	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	56.10	ОСНО	Нижегородская область
DEMO-090	Андреева Светлана Владимировна	998932904939	317787210796684	2017-04-01	+7 974 639-38-45	ip904939@example.com	да	operating	working_capital	WC	670000.00	12	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	ERROR	VERIFICATION	да	NO_RECORD	NONE	0	0.00	\N	LOW	нет	NONE	AVAILABLE	2017-04	93000.00	\N	\N	да	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	96.02	УСН (доходы)	г. Санкт-Петербург
DEMO-091	Яковлев Олег Николаевич	996582914652	319773223044451	2019-03-08	+7 974 411-73-81	ip914652@example.com	да	operating	equipment	EQ	2900000.00	\N	3953000.00	1053000.00	1169000.00	да	\N	\N	да	да	INACTIVE	PASS	\N	\N	\N	\N	\N	\N	\N	\N	LOW	нет	NONE	AVAILABLE	2019-05	168000.00	\N	\N	да	\N	\N	\N	\N	\N	9918934554	EQ-050	2013-09-15	ACTIVE	нет	нет	3901000.00	нет	нет	нет	10.71	АУСН	г. Москва
DEMO-092	Волков Алексей Андреевич	992407494398	323508362385542	2023-06-15	+7 912 647-84-55	ip494398@example.com	да	operating	working_capital	WC	510000.00	12	\N	\N	\N	\N	\N	\N	да	да	INACTIVE	PASS	\N	\N	\N	\N	\N	\N	\N	\N	LOW	нет	NONE	AVAILABLE	2023-07	97000.00	\N	\N	да	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	96.02	АУСН	Московская область
DEMO-093	Смирнова Ксения Олеговна	991374629221	320631276917543	2020-05-07	+7 996 541-15-35	ip629221@example.com	да	operating	working_capital	WC	990000.00	16	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	FAIL	\N	\N	\N	\N	\N	\N	\N	\N	LOW	нет	NONE	AVAILABLE	2020-06	73000.00	\N	\N	да	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	96.02	ПСН	Самарская область
DEMO-094	Павлова Мария Викторовна	994048621478	324543045254710	2024-05-01	+7 917 607-56-46	ip621478@example.com	да	operating	working_capital	WC	1640000.00	\N	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	0	0.00	\N	LOW	нет	NONE	AVAILABLE	2024-05	109000.00	\N	\N	да	CONFIRMED	нет	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	46.90	АУСН	Новосибирская область
DEMO-095	Козлова Екатерина Игоревна	995958674890	318503250781411	2018-05-23	+7 903 201-16-18	ip674890@example.com	да	operating	working_capital	WC	700000.00	12	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	UNKNOWN	UNKNOWN	\N	\N	\N	LOW	нет	NONE	AVAILABLE	2018-06	48000.00	\N	\N	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	46.90	ОСНО	Московская область
DEMO-096	Андреев Роман Андреевич	991026997200	318506270297758	2018-03-01	+7 998 391-51-17	ip997200@example.com	да	operating	working_capital	WC	1700000.00	12	\N	\N	\N	\N	\N	\N	да	да	ACTIVE	PASS	SUCCESS	\N	да	FOUND	PRESENT	0	0.00	\N	LOW	нет	NONE	AVAILABLE	2018-03	111000.00	\N	\N	да	CONFLICT	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	нет	нет	56.10	УСН (доходы)	Московская область
DEMO-097	Кузнецова Мария Олеговна	990000000436	326540606119122	2026-10-01	+7 997 740-53-58	ip000436@example.com	нет	prelaunch	working_capital	START	300000.00	12	\N	\N	\N	\N	300000.00	0.00	да	да	ACTIVE	PASS	SUCCESS	\N	да	NO_RECORD	NONE	0	0.00	\N	LOW	нет	NONE	NO_HISTORY	\N	30000.00	AVAILABLE	20000.00	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	\N	\N	56.10	НПД	Новосибирская область
DEMO-098	Захарова Наталья Петровна	993149044345	326027418095340	2026-08-08	+7 902 424-58-83	ip044345@example.com	нет	prelaunch	working_capital	START	500000.00	12	\N	\N	\N	\N	500000.00	0.00	да	да	ACTIVE	PASS	SUCCESS	\N	да	NO_RECORD	NONE	0	0.00	\N	LOW	нет	NONE	NO_HISTORY	\N	57000.00	AVAILABLE	27000.00	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	\N	\N	47.11	УСН (доходы)	Республика Башкортостан
DEMO-099	Орлова Елена Владимировна	996667015950	326662252057116	2026-08-11	+7 979 860-21-84	ip015950@example.com	нет	prelaunch	working_capital	START	500000.00	\N	\N	\N	\N	\N	500000.00	0.00	да	да	ACTIVE	PASS	SUCCESS	\N	да	NO_RECORD	NONE	0	0.00	\N	LOW	нет	NONE	NO_HISTORY	\N	63000.00	AVAILABLE	32000.00	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	\N	\N	47.11	ПСН	Свердловская область
DEMO-100	Новиков Роман Олегович	996773157146	326631586385802	2026-08-10	+7 934 753-78-88	ip157146@example.com	да	prelaunch	working_capital	START	500000.00	6	\N	\N	\N	\N	500000.00	0.00	да	да	ACTIVE	PASS	SUCCESS	\N	да	NO_RECORD	NONE	0	0.00	\N	LOW	нет	NONE	NO_HISTORY	\N	66000.00	AVAILABLE	41000.00	да	CONFIRMED	да	да	да	да	\N	\N	\N	\N	\N	\N	\N	нет	\N	\N	47.91	УСН (доходы минус расходы)	Самарская область
\.


--
-- Data for Name: efrsb_bankruptcies; Type: TABLE DATA; Schema: synthetic; Owner: -
--

COPY synthetic.efrsb_bankruptcies (id, inn, message_type, procedure, case_number, start_date, completed_date) FROM stdin;
1	993441968459	Сообщение о судебном акте	Реструктуризация долгов	А40-99999/2024	2024-02-01	\N
2	996229846036	Сообщение о судебном акте	Реализация имущества	А40-99999/2024	2024-02-01	2024-11-20
\.


--
-- Data for Name: egrip; Type: TABLE DATA; Schema: synthetic; Owner: -
--

COPY synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of) FROM stdin;
992934509242	324527389082738	Захаров	Виктор	Сергеевич	Захаров Виктор Сергеевич	2024-07-01	ACTIVE	\N	\N	52	Нижегородская область	31.01	Производство мебели для офисов и предприятий торговли	49.41;18.12	ОСНО	Микропредприятие	2026-10-21
990750786404	322669799266838	Соловьёв	Алексей	Андреевич	Соловьёв Алексей Андреевич	2022-05-28	ACTIVE	\N	\N	66	Свердловская область	96.02	Предоставление услуг парикмахерскими и салонами красоты	47.91;56.10	УСН (доходы)	Микропредприятие	2026-10-21
998575834946	318785520709328	Николаева	Екатерина	Петровна	Николаева Екатерина Петровна	2018-01-28	ACTIVE	\N	\N	78	г. Санкт-Петербург	47.11	Торговля розничная преимущественно пищевыми продуктами в неспециализированных магазинах	46.90;47.91	УСН (доходы минус расходы)	Микропредприятие	2026-10-21
997237475355	321633185876049	Кузьмина	Дарья	Юрьевна	Кузьмина Дарья Юрьевна	2021-09-08	ACTIVE	\N	\N	63	Самарская область	31.01	Производство мебели для офисов и предприятий торговли	45.20;10.71	УСН (доходы минус расходы)	Микропредприятие	2026-10-21
994209132544	324028773588868	Воробьёва	Татьяна	Сергеевна	Воробьёва Татьяна Сергеевна	2024-03-01	ACTIVE	\N	\N	02	Республика Башкортостан	96.02	Предоставление услуг парикмахерскими и салонами красоты	47.11;56.10	ОСНО	Микропредприятие	2026-10-21
991802424801	321239926606723	Лебедев	Павел	Викторович	Лебедев Павел Викторович	2021-08-01	ACTIVE	\N	\N	23	Краснодарский край	47.11	Торговля розничная преимущественно пищевыми продуктами в неспециализированных магазинах	56.10;46.90	ПСН	Микропредприятие	2026-10-21
992136717200	320233174573520	Попова	Светлана	Андреевна	Попова Светлана Андреевна	2020-05-10	ACTIVE	\N	\N	23	Краснодарский край	49.41	Деятельность автомобильного грузового транспорта	18.12;31.01	ОСНО	Микропредприятие	2026-10-21
998924531779	323774901221590	Соловьёв	Виктор	Сергеевич	Соловьёв Виктор Сергеевич	2023-05-15	ACTIVE	\N	\N	77	г. Москва	96.02	Предоставление услуг парикмахерскими и салонами красоты	47.91;47.11	УСН (доходы минус расходы)	Микропредприятие	2026-10-21
995940119912	319526355400300	Морозов	Илья	Олегович	Морозов Илья Олегович	2019-10-26	ACTIVE	\N	\N	52	Нижегородская область	47.91	Торговля розничная по почте или по информационно-коммуникационной сети Интернет	47.11;56.10	ОСНО	Микропредприятие	2026-10-21
991126723717	317668403483050	Семёнов	Илья	Владимирович	Семёнов Илья Владимирович	2017-10-01	ACTIVE	\N	\N	66	Свердловская область	18.12	Прочие виды полиграфической деятельности	10.71;49.41	УСН (доходы)	Микропредприятие	2026-10-21
994973718155	320522379373270	Попов	Андрей	Юрьевич	Попов Андрей Юрьевич	2020-12-23	ACTIVE	\N	\N	52	Нижегородская область	47.11	Торговля розничная преимущественно пищевыми продуктами в неспециализированных магазинах	47.91;56.10	АУСН	Микропредприятие	2026-10-21
998911520579	317521601996820	Алексеев	Максим	Александрович	Алексеев Максим Александрович	2017-05-11	ACTIVE	\N	\N	52	Нижегородская область	47.11	Торговля розничная преимущественно пищевыми продуктами в неспециализированных магазинах	47.91;96.02	ОСНО	Микропредприятие	2026-10-21
993331162602	321661335237201	Фёдорова	Светлана	Игоревна	Фёдорова Светлана Игоревна	2021-08-01	ACTIVE	\N	\N	66	Свердловская область	18.12	Прочие виды полиграфической деятельности	49.41;45.20	АУСН	Микропредприятие	2026-10-21
995402377840	317164704235699	Егоров	Александр	Владимирович	Егоров Александр Владимирович	2017-05-24	ACTIVE	\N	\N	16	Республика Татарстан	56.10	Деятельность ресторанов и услуги по доставке продуктов питания	47.91;96.02	АУСН	Микропредприятие	2026-10-21
998456015803	325526337014115	Григорьева	Ксения	Юрьевна	Григорьева Ксения Юрьевна	2025-03-01	ACTIVE	\N	\N	52	Нижегородская область	10.71	Производство хлеба и мучных кондитерских изделий	49.41;31.01	ПСН	Микропредприятие	2026-10-21
997059195989	325029801426950	Степанова	Елена	Петровна	Степанова Елена Петровна	2025-02-05	ACTIVE	\N	\N	02	Республика Башкортостан	46.90	Торговля оптовая неспециализированная	47.91;96.02	ОСНО	Микропредприятие	2026-10-21
998561811040	324029767054306	Соколов	Роман	Сергеевич	Соколов Роман Сергеевич	2024-12-16	ACTIVE	\N	\N	02	Республика Башкортостан	49.41	Деятельность автомобильного грузового транспорта	45.20;10.71	ПСН	Микропредприятие	2026-10-21
992695022198	323771246834177	Макаров	Дмитрий	Олегович	Макаров Дмитрий Олегович	2023-12-07	ACTIVE	\N	\N	77	г. Москва	47.11	Торговля розничная преимущественно пищевыми продуктами в неспециализированных магазинах	46.90;56.10	УСН (доходы)	Микропредприятие	2026-10-21
991379819032	323024837455115	Семёнов	Кирилл	Петрович	Семёнов Кирилл Петрович	2023-11-09	ACTIVE	\N	\N	02	Республика Башкортостан	31.01	Производство мебели для офисов и предприятий торговли	45.20;10.71	УСН (доходы)	Микропредприятие	2026-10-21
999189653802	322549341952978	Попова	Татьяна	Николаевна	Попова Татьяна Николаевна	2022-04-28	ACTIVE	\N	\N	54	Новосибирская область	46.90	Торговля оптовая неспециализированная	47.11;56.10	ПСН	Микропредприятие	2026-10-21
998523591925	325239291168513	Павлова	Мария	Николаевна	Павлова Мария Николаевна	2025-04-08	ACTIVE	\N	\N	23	Краснодарский край	18.12	Прочие виды полиграфической деятельности	31.01;10.71	УСН (доходы минус расходы)	Микропредприятие	2026-10-21
992138657644	324773575997359	Лебедева	Ксения	Игоревна	Лебедева Ксения Игоревна	2024-01-08	ACTIVE	\N	\N	77	г. Москва	47.11	Торговля розничная преимущественно пищевыми продуктами в неспециализированных магазинах	56.10;46.90	АУСН	Микропредприятие	2026-10-21
998137090900	322634046125203	Андреев	Виктор	Олегович	Андреев Виктор Олегович	2022-11-06	ACTIVE	\N	\N	63	Самарская область	49.41	Деятельность автомобильного грузового транспорта	18.12;31.01	ПСН	Микропредприятие	2026-10-21
990000000362	323662646979081	Петров	Алексей	Николаевич	Петров Алексей Николаевич	2023-09-01	ACTIVE	\N	\N	66	Свердловская область	18.12	Прочие виды полиграфической деятельности	31.01;10.71	ПСН	Микропредприятие	2026-10-21
993878947883	324166935276091	Васильев	Роман	Игоревич	Васильев Роман Игоревич	2024-08-11	ACTIVE	\N	\N	16	Республика Татарстан	56.10	Деятельность ресторанов и услуги по доставке продуктов питания	46.90;47.91	УСН (доходы)	Микропредприятие	2026-10-21
995379892706	323789651750956	Николаева	Ирина	Владимировна	Николаева Ирина Владимировна	2023-07-04	ACTIVE	\N	\N	78	г. Санкт-Петербург	45.20	Техническое обслуживание и ремонт автотранспортных средств	18.12;10.71	ОСНО	Микропредприятие	2026-10-21
996085865370	323161665603110	Соловьёв	Александр	Николаевич	Соловьёв Александр Николаевич	2023-12-01	ACTIVE	\N	\N	16	Республика Татарстан	45.20	Техническое обслуживание и ремонт автотранспортных средств	18.12;49.41	ПСН	Микропредприятие	2026-10-21
990432413409	322239119728837	Семёнов	Павел	Викторович	Семёнов Павел Викторович	2022-06-01	ACTIVE	\N	\N	23	Краснодарский край	47.91	Торговля розничная по почте или по информационно-коммуникационной сети Интернет	96.02;47.11	УСН (доходы минус расходы)	Микропредприятие	2026-10-21
994380553287	322233233372343	Семёнова	Ксения	Сергеевна	Семёнова Ксения Сергеевна	2022-12-26	ACTIVE	\N	\N	23	Краснодарский край	45.20	Техническое обслуживание и ремонт автотранспортных средств	49.41;18.12	ПСН	Микропредприятие	2026-10-21
992244219794	323507072339805	Захаров	Андрей	Олегович	Захаров Андрей Олегович	2023-08-04	ACTIVE	\N	\N	50	Московская область	49.41	Деятельность автомобильного грузового транспорта	45.20;18.12	УСН (доходы минус расходы)	Микропредприятие	2026-10-21
992776526274	324634214909160	Николаев	Максим	Андреевич	Николаев Максим Андреевич	2024-08-16	ACTIVE	\N	\N	63	Самарская область	56.10	Деятельность ресторанов и услуги по доставке продуктов питания	96.02;46.90	ОСНО	Микропредприятие	2026-10-21
990950641484	322631417155431	Кузьмина	Ксения	Владимировна	Кузьмина Ксения Владимировна	2022-07-17	ACTIVE	\N	\N	63	Самарская область	10.71	Производство хлеба и мучных кондитерских изделий	31.01;49.41	АУСН	Микропредприятие	2026-10-21
991609452511	324773800436781	Васильев	Александр	Олегович	Васильев Александр Олегович	2024-07-10	ACTIVE	\N	\N	77	г. Москва	31.01	Производство мебели для офисов и предприятий торговли	18.12;10.71	УСН (доходы минус расходы)	Микропредприятие	2026-10-21
993778538703	318633208900080	Николаева	Елена	Петровна	Николаева Елена Петровна	2018-12-23	ACTIVE	\N	\N	63	Самарская область	46.90	Торговля оптовая неспециализированная	47.91;96.02	УСН (доходы)	Микропредприятие	2026-10-21
999161049252	322520181365429	Борисова	Ольга	Викторовна	Борисова Ольга Викторовна	2022-03-01	ACTIVE	\N	\N	52	Нижегородская область	46.90	Торговля оптовая неспециализированная	96.02;47.91	АУСН	Микропредприятие	2026-10-21
998609030311	323504952797371	Степанов	Максим	Игоревич	Степанов Максим Игоревич	2023-07-01	ACTIVE	\N	\N	50	Московская область	96.02	Предоставление услуг парикмахерскими и салонами красоты	47.11;56.10	ОСНО	Микропредприятие	2026-10-21
990904127612	326525923531179	Макаров	Илья	Николаевич	Макаров Илья Николаевич	2026-05-23	ACTIVE	\N	\N	52	Нижегородская область	56.10	Деятельность ресторанов и услуги по доставке продуктов питания	46.90;47.91	УСН (доходы)	Микропредприятие	2026-10-21
993766363375	323165043088583	Кузьмин	Андрей	Олегович	Кузьмин Андрей Олегович	2023-11-01	ACTIVE	\N	\N	16	Республика Татарстан	96.02	Предоставление услуг парикмахерскими и салонами красоты	56.10;47.91	АУСН	Микропредприятие	2026-10-21
992222723768	326785061763431	Воробьёва	Дарья	Викторовна	Воробьёва Дарья Викторовна	2026-06-16	ACTIVE	\N	\N	78	г. Санкт-Петербург	47.91	Торговля розничная по почте или по информационно-коммуникационной сети Интернет	96.02;46.90	АУСН	Микропредприятие	2026-10-21
995513219350	323509771967092	Борисов	Павел	Юрьевич	Борисов Павел Юрьевич	2023-11-28	ACTIVE	\N	\N	50	Московская область	56.10	Деятельность ресторанов и услуги по доставке продуктов питания	96.02;47.11	УСН (доходы)	Микропредприятие	2026-10-21
992536997142	326636593047150	Васильев	Егор	Владимирович	Васильев Егор Владимирович	2026-01-10	ACTIVE	\N	\N	63	Самарская область	46.90	Торговля оптовая неспециализированная	56.10;96.02	УСН (доходы)	Микропредприятие	2026-10-21
992157389091	321669982726322	Зайцев	Егор	Сергеевич	Зайцев Егор Сергеевич	2021-03-01	ACTIVE	\N	\N	66	Свердловская область	47.91	Торговля розничная по почте или по информационно-коммуникационной сети Интернет	56.10;96.02	АУСН	Микропредприятие	2026-10-21
995464468400	324787123461798	Зайцева	Екатерина	Николаевна	Зайцева Екатерина Николаевна	2024-09-07	ACTIVE	\N	\N	78	г. Санкт-Петербург	10.71	Производство хлеба и мучных кондитерских изделий	45.20;31.01	АУСН	Микропредприятие	2026-10-21
996473214788	324631565985178	Михайлова	Юлия	Игоревна	Михайлова Юлия Игоревна	2024-10-01	ACTIVE	\N	\N	63	Самарская область	46.90	Торговля оптовая неспециализированная	96.02;47.11	УСН (доходы минус расходы)	Микропредприятие	2026-10-21
992370382737	319521796564501	Алексеева	Татьяна	Николаевна	Алексеева Татьяна Николаевна	2019-10-01	ACTIVE	\N	\N	52	Нижегородская область	49.41	Деятельность автомобильного грузового транспорта	18.12;45.20	УСН (доходы минус расходы)	Микропредприятие	2026-10-21
993149112877	324230113342266	Лебедева	Наталья	Викторовна	Лебедева Наталья Викторовна	2024-07-25	ACTIVE	\N	\N	23	Краснодарский край	56.10	Деятельность ресторанов и услуги по доставке продуктов питания	47.91;96.02	УСН (доходы)	Микропредприятие	2026-10-21
993848857784	319529057509427	Соколова	Анастасия	Олеговна	Соколова Анастасия Олеговна	2019-03-13	ACTIVE	\N	\N	52	Нижегородская область	10.71	Производство хлеба и мучных кондитерских изделий	31.01;45.20	УСН (доходы минус расходы)	Микропредприятие	2026-10-21
995266995933	324168412501354	Макарова	Елена	Андреевна	Макарова Елена Андреевна	2024-02-26	ACTIVE	\N	\N	16	Республика Татарстан	47.11	Торговля розничная преимущественно пищевыми продуктами в неспециализированных магазинах	47.91;46.90	УСН (доходы)	Микропредприятие	2026-10-21
991200978947	319545627156310	Макарова	Ирина	Юрьевна	Макарова Ирина Юрьевна	2019-09-13	ACTIVE	\N	\N	54	Новосибирская область	47.11	Торговля розничная преимущественно пищевыми продуктами в неспециализированных магазинах	96.02;47.91	АУСН	Микропредприятие	2026-10-21
993800094277	318784925474871	Николаев	Илья	Владимирович	Николаев Илья Владимирович	2018-11-21	ACTIVE	\N	\N	78	г. Санкт-Петербург	18.12	Прочие виды полиграфической деятельности	49.41;31.01	АУСН	Микропредприятие	2026-10-21
992421241367	323785242827888	Романова	Юлия	Владимировна	Романова Юлия Владимировна	2023-08-27	ACTIVE	\N	\N	78	г. Санкт-Петербург	49.41	Деятельность автомобильного грузового транспорта	18.12;10.71	ОСНО	Микропредприятие	2026-10-21
998620195652	326540542452324	Макаров	Илья	Александрович	Макаров Илья Александрович	2026-08-20	ACTIVE	\N	\N	54	Новосибирская область	18.12	Прочие виды полиграфической деятельности	45.20;10.71	НПД	Микропредприятие (вновь созданное)	2026-10-21
995980959851	326163472606002	Козлов	Михаил	Владимирович	Козлов Михаил Владимирович	2026-10-13	ACTIVE	\N	\N	16	Республика Татарстан	10.71	Производство хлеба и мучных кондитерских изделий	31.01;49.41	НПД	Микропредприятие (вновь созданное)	2026-10-21
991510350302	326774832499310	Зайцева	Вера	Сергеевна	Зайцева Вера Сергеевна	2026-10-03	ACTIVE	\N	\N	77	г. Москва	49.41	Деятельность автомобильного грузового транспорта	10.71;45.20	АУСН	Микропредприятие (вновь созданное)	2026-10-21
992805278597	326774087748052	Павлова	Светлана	Александровна	Павлова Светлана Александровна	2026-08-11	ACTIVE	\N	\N	77	г. Москва	49.41	Деятельность автомобильного грузового транспорта	18.12;10.71	ОСНО	Микропредприятие (вновь созданное)	2026-10-21
991336858301	326775958615871	Смирнов	Артём	Андреевич	Смирнов Артём Андреевич	2026-08-24	ACTIVE	\N	\N	77	г. Москва	56.10	Деятельность ресторанов и услуги по доставке продуктов питания	96.02;47.11	ПСН	Микропредприятие (вновь созданное)	2026-10-21
992036192703	326500728147719	Никитин	Павел	Владимирович	Никитин Павел Владимирович	2026-07-09	ACTIVE	\N	\N	50	Московская область	96.02	Предоставление услуг парикмахерскими и салонами красоты	47.91;46.90	ОСНО	Микропредприятие	2026-10-21
994262722612	326778373320601	Андреева	Юлия	Николаевна	Андреева Юлия Николаевна	2026-09-03	ACTIVE	\N	\N	77	г. Москва	56.10	Деятельность ресторанов и услуги по доставке продуктов питания	47.11;46.90	АУСН	Микропредприятие (вновь созданное)	2026-10-21
996742086400	326166527598210	Новикова	Мария	Игоревна	Новикова Мария Игоревна	2026-07-06	ACTIVE	\N	\N	16	Республика Татарстан	46.90	Торговля оптовая неспециализированная	96.02;47.11	УСН (доходы)	Микропредприятие	2026-10-21
995105295641	326231787636258	Николаев	Илья	Викторович	Николаев Илья Викторович	2026-08-28	ACTIVE	\N	\N	23	Краснодарский край	56.10	Деятельность ресторанов и услуги по доставке продуктов питания	46.90;47.91	АУСН	Микропредприятие (вновь созданное)	2026-10-21
990000000299	326525375772138	Сидорова	Анна	Викторовна	Сидорова Анна Викторовна	2026-10-01	ACTIVE	\N	\N	52	Нижегородская область	31.01	Производство мебели для офисов и предприятий торговли	10.71;49.41	УСН (доходы)	Микропредприятие (вновь созданное)	2026-10-21
999343085833	326635909293972	Васильев	Дмитрий	Сергеевич	Васильев Дмитрий Сергеевич	2026-08-19	ACTIVE	\N	\N	63	Самарская область	18.12	Прочие виды полиграфической деятельности	45.20;31.01	АУСН	Микропредприятие (вновь созданное)	2026-10-21
994498886107	326164403966777	Соловьёва	Ольга	Александровна	Соловьёва Ольга Александровна	2026-08-06	ACTIVE	\N	\N	16	Республика Татарстан	45.20	Техническое обслуживание и ремонт автотранспортных средств	18.12;49.41	АУСН	Микропредприятие (вновь созданное)	2026-10-21
998054434184	326520999935846	Воробьёва	Мария	Александровна	Воробьёва Мария Александровна	2026-08-20	ACTIVE	\N	\N	52	Нижегородская область	18.12	Прочие виды полиграфической деятельности	49.41;10.71	ПСН	Микропредприятие (вновь созданное)	2026-10-21
995086037890	326026175547521	Макаров	Михаил	Сергеевич	Макаров Михаил Сергеевич	2026-09-12	ACTIVE	\N	\N	02	Республика Башкортостан	49.41	Деятельность автомобильного грузового транспорта	31.01;18.12	ОСНО	Микропредприятие (вновь созданное)	2026-10-21
998244860543	326163304682617	Андреева	Елена	Юрьевна	Андреева Елена Юрьевна	2026-09-05	ACTIVE	\N	\N	16	Республика Татарстан	49.41	Деятельность автомобильного грузового транспорта	31.01;10.71	ПСН	Микропредприятие (вновь созданное)	2026-10-21
994347632171	326026199759932	Романов	Олег	Викторович	Романов Олег Викторович	2026-10-18	ACTIVE	\N	\N	02	Республика Башкортостан	49.41	Деятельность автомобильного грузового транспорта	10.71;18.12	НПД	Микропредприятие (вновь созданное)	2026-10-21
990888696312	326508351460731	Романова	Екатерина	Андреевна	Романова Екатерина Андреевна	2026-09-12	ACTIVE	\N	\N	50	Московская область	10.71	Производство хлеба и мучных кондитерских изделий	31.01;45.20	УСН (доходы минус расходы)	Микропредприятие (вновь созданное)	2026-10-21
996791345833	326528226797091	Захаров	Олег	Викторович	Захаров Олег Викторович	2026-08-15	ACTIVE	\N	\N	52	Нижегородская область	10.71	Производство хлеба и мучных кондитерских изделий	45.20;31.01	НПД	Микропредприятие (вновь созданное)	2026-10-21
990301724986	326023343391092	Васильев	Андрей	Викторович	Васильев Андрей Викторович	2026-10-10	ACTIVE	\N	\N	02	Республика Башкортостан	45.20	Техническое обслуживание и ремонт автотранспортных средств	49.41;10.71	ОСНО	Микропредприятие (вновь созданное)	2026-10-21
995954537846	326522487797665	Воробьёв	Павел	Олегович	Воробьёв Павел Олегович	2026-09-18	ACTIVE	\N	\N	52	Нижегородская область	49.41	Деятельность автомобильного грузового транспорта	18.12;45.20	УСН (доходы минус расходы)	Микропредприятие (вновь созданное)	2026-10-21
993463525531	326634439298658	Орлова	Дарья	Викторовна	Орлова Дарья Викторовна	2026-08-20	ACTIVE	\N	\N	63	Самарская область	31.01	Производство мебели для офисов и предприятий торговли	18.12;49.41	УСН (доходы минус расходы)	Микропредприятие (вновь созданное)	2026-10-21
997354447295	326788740974800	Андреева	Наталья	Андреевна	Андреева Наталья Андреевна	2026-10-08	ACTIVE	\N	\N	78	г. Санкт-Петербург	18.12	Прочие виды полиграфической деятельности	10.71;49.41	ОСНО	Микропредприятие (вновь созданное)	2026-10-21
996634317106	326785480634644	Никитина	Татьяна	Николаевна	Никитина Татьяна Николаевна	2026-09-11	ACTIVE	\N	\N	78	г. Санкт-Петербург	18.12	Прочие виды полиграфической деятельности	10.71;49.41	АУСН	Микропредприятие (вновь созданное)	2026-10-21
990837660300	326549370928151	Егорова	Ирина	Владимировна	Егорова Ирина Владимировна	2026-08-10	ACTIVE	\N	\N	54	Новосибирская область	31.01	Производство мебели для офисов и предприятий торговли	45.20;18.12	НПД	Микропредприятие (вновь созданное)	2026-10-21
990155729503	326025387272022	Николаев	Олег	Олегович	Николаев Олег Олегович	2026-08-05	ACTIVE	\N	\N	02	Республика Башкортостан	31.01	Производство мебели для офисов и предприятий торговли	45.20;49.41	ПСН	Микропредприятие (вновь созданное)	2026-10-21
997735670302	326544875161246	Макарова	Полина	Сергеевна	Макарова Полина Сергеевна	2026-09-18	ACTIVE	\N	\N	54	Новосибирская область	18.12	Прочие виды полиграфической деятельности	10.71;45.20	ОСНО	Микропредприятие (вновь созданное)	2026-10-21
994736738702	319022838924975	Соловьёв	Илья	Юрьевич	Соловьёв Илья Юрьевич	2019-09-15	ACTIVE	\N	\N	02	Республика Башкортостан	56.10	Деятельность ресторанов и услуги по доставке продуктов питания	47.11;46.90	УСН (доходы)	Микропредприятие	2026-10-21
995351862130	324021288244442	Лебедев	Андрей	Николаевич	Лебедев Андрей Николаевич	2024-03-16	ACTIVE	\N	\N	02	Республика Башкортостан	47.91	Торговля розничная по почте или по информационно-коммуникационной сети Интернет	47.11;46.90	УСН (доходы)	Микропредприятие	2026-10-21
998809979516	318237597857823	Козлова	Дарья	Александровна	Козлова Дарья Александровна	2018-04-14	ACTIVE	\N	\N	23	Краснодарский край	18.12	Прочие виды полиграфической деятельности	10.71;49.41	АУСН	Микропредприятие	2026-10-21
999767928999	319771269024461	Макаров	Алексей	Олегович	Макаров Алексей Олегович	2019-07-14	ACTIVE	\N	\N	77	г. Москва	49.41	Деятельность автомобильного грузового транспорта	10.71;45.20	УСН (доходы минус расходы)	Микропредприятие	2026-10-21
996152142806	326788637754064	Кузьмина	Ольга	Сергеевна	Кузьмина Ольга Сергеевна	2026-10-17	ACTIVE	\N	\N	78	г. Санкт-Петербург	31.01	Производство мебели для офисов и предприятий торговли	45.20;10.71	УСН (доходы минус расходы)	Микропредприятие (вновь созданное)	2026-10-21
999904307315	320783885885657	Попов	Роман	Николаевич	Попов Роман Николаевич	2020-03-27	ACTIVE	\N	\N	78	г. Санкт-Петербург	18.12	Прочие виды полиграфической деятельности	10.71;49.41	ОСНО	Микропредприятие	2026-10-21
996230601785	326778434156330	Волков	Андрей	Юрьевич	Волков Андрей Юрьевич	2026-10-08	ACTIVE	\N	\N	77	г. Москва	96.02	Предоставление услуг парикмахерскими и салонами красоты	47.91;47.11	УСН (доходы)	Микропредприятие (вновь созданное)	2026-10-21
990439082241	317662962912567	Андреева	Татьяна	Сергеевна	Андреева Татьяна Сергеевна	2017-05-18	ACTIVE	\N	\N	66	Свердловская область	10.71	Производство хлеба и мучных кондитерских изделий	45.20;18.12	УСН (доходы)	Микропредприятие	2026-10-21
992019950851	317522202838913	Михайлова	Вера	Игоревна	Михайлова Вера Игоревна	2017-04-17	ACTIVE	\N	\N	52	Нижегородская область	56.10	Деятельность ресторанов и услуги по доставке продуктов питания	46.90;47.11	ОСНО	Микропредприятие	2026-10-21
998932904939	317787210796684	Андреева	Светлана	Владимировна	Андреева Светлана Владимировна	2017-04-01	ACTIVE	\N	\N	78	г. Санкт-Петербург	96.02	Предоставление услуг парикмахерскими и салонами красоты	46.90;56.10	УСН (доходы)	Микропредприятие	2026-10-21
996582914652	319773223044451	Яковлев	Олег	Николаевич	Яковлев Олег Николаевич	2019-03-08	TERMINATED	2026-06-15	Прекращение деятельности по решению ИП (ст. 22.3 129-ФЗ)	77	г. Москва	10.71	Производство хлеба и мучных кондитерских изделий	49.41;18.12	АУСН	Микропредприятие	2026-10-21
992407494398	323508362385542	Волков	Алексей	Андреевич	Волков Алексей Андреевич	2023-06-15	TERMINATED	2025-12-01	Исключение из ЕГРИП по решению регистрирующего органа (ст. 22.4 129-ФЗ)	50	Московская область	96.02	Предоставление услуг парикмахерскими и салонами красоты	56.10;47.91	АУСН	Микропредприятие	2026-10-21
991374629221	320631276917543	Смирнова	Ксения	Олеговна	Смирнова Ксения Олеговна	2020-05-07	ACTIVE	\N	\N	63	Самарская область	96.02	Предоставление услуг парикмахерскими и салонами красоты	47.11;47.91	ПСН	Микропредприятие	2026-10-21
994048621478	324543045254710	Павлова	Мария	Викторовна	Павлова Мария Викторовна	2024-05-01	ACTIVE	\N	\N	54	Новосибирская область	46.90	Торговля оптовая неспециализированная	47.11;47.91	АУСН	Микропредприятие	2026-10-21
995958674890	318503250781411	Козлова	Екатерина	Игоревна	Козлова Екатерина Игоревна	2018-05-23	ACTIVE	\N	\N	50	Московская область	46.90	Торговля оптовая неспециализированная	56.10;47.11	ОСНО	Микропредприятие	2026-10-21
991026997200	318506270297758	Андреев	Роман	Андреевич	Андреев Роман Андреевич	2018-03-01	ACTIVE	\N	\N	50	Московская область	56.10	Деятельность ресторанов и услуги по доставке продуктов питания	46.90;96.02	УСН (доходы)	Микропредприятие	2026-10-21
990000000436	326540606119122	Кузнецова	Мария	Олеговна	Кузнецова Мария Олеговна	2026-10-01	ACTIVE	\N	\N	54	Новосибирская область	56.10	Деятельность ресторанов и услуги по доставке продуктов питания	96.02;47.91	НПД	Микропредприятие (вновь созданное)	2026-10-21
993149044345	326027418095340	Захарова	Наталья	Петровна	Захарова Наталья Петровна	2026-08-08	ACTIVE	\N	\N	02	Республика Башкортостан	47.11	Торговля розничная преимущественно пищевыми продуктами в неспециализированных магазинах	96.02;47.91	УСН (доходы)	Микропредприятие (вновь созданное)	2026-10-21
996667015950	326662252057116	Орлова	Елена	Владимировна	Орлова Елена Владимировна	2026-08-11	ACTIVE	\N	\N	66	Свердловская область	47.11	Торговля розничная преимущественно пищевыми продуктами в неспециализированных магазинах	96.02;56.10	ПСН	Микропредприятие (вновь созданное)	2026-10-21
996773157146	326631586385802	Новиков	Роман	Олегович	Новиков Роман Олегович	2026-08-10	ACTIVE	\N	\N	63	Самарская область	47.91	Торговля розничная по почте или по информационно-коммуникационной сети Интернет	46.90;56.10	УСН (доходы минус расходы)	Микропредприятие (вновь созданное)	2026-10-21
995843689392	322232185687783	Никитина	Ксения	Николаевна	Никитина Ксения Николаевна	2022-03-14	ACTIVE	\N	\N	23	Краснодарский край	56.10	Деятельность ресторанов и услуги по доставке продуктов питания	47.11;46.90	АУСН	Микропредприятие	2026-10-21
993441968459	322021219325954	Волкова	Светлана	Игоревна	Волкова Светлана Игоревна	2022-03-14	ACTIVE	\N	\N	02	Республика Башкортостан	47.91	Торговля розничная по почте или по информационно-коммуникационной сети Интернет	96.02;47.11	УСН (доходы минус расходы)	Микропредприятие	2026-10-21
996229846036	322526946272592	Фёдорова	Ксения	Николаевна	Фёдорова Ксения Николаевна	2022-03-14	ACTIVE	\N	\N	52	Нижегородская область	96.02	Предоставление услуг парикмахерскими и салонами красоты	46.90;47.91	УСН (доходы)	Микропредприятие	2026-10-21
993468143744	322669153874785	Морозова	Дарья	Александровна	Морозова Дарья Александровна	2022-03-14	ACTIVE	\N	\N	66	Свердловская область	96.02	Предоставление услуг парикмахерскими и салонами красоты	47.91;56.10	УСН (доходы)	Микропредприятие	2026-10-21
990742590013	322789669849140	Козлов	Павел	Александрович	Козлов Павел Александрович	2022-03-14	ACTIVE	\N	\N	78	г. Санкт-Петербург	56.10	Деятельность ресторанов и услуги по доставке продуктов питания	46.90;47.11	АУСН	Микропредприятие	2026-10-21
995327035122	322507886423301	Никитин	Роман	Сергеевич	Никитин Роман Сергеевич	2022-03-14	ACTIVE	\N	\N	50	Московская область	96.02	Предоставление услуг парикмахерскими и салонами красоты	47.11;46.90	НПД	Микропредприятие	2026-10-21
993649050001	326787916015102	Попов	Андрей	Петрович	Попов Андрей Петрович	2026-10-01	ACTIVE	\N	\N	78	г. Санкт-Петербург	49.41	Деятельность автомобильного грузового транспорта	31.01;18.12	АУСН	Микропредприятие (вновь созданное)	2026-10-21
995606156286	323235728090210	Новикова	Ольга	Олеговна	Новикова Ольга Олеговна	2023-09-01	ACTIVE	\N	\N	23	Краснодарский край	49.41	Деятельность автомобильного грузового транспорта	10.71;45.20	ПСН	Микропредприятие	2026-10-21
996550203790	323540226282564	Морозов	Виктор	Игоревич	Морозов Виктор Игоревич	2023-09-01	ACTIVE	\N	\N	54	Новосибирская область	31.01	Производство мебели для офисов и предприятий торговли	49.41;45.20	ОСНО	Микропредприятие	2026-10-21
993458262326	323784171175812	Волков	Роман	Андреевич	Волков Роман Андреевич	2023-09-01	ACTIVE	\N	\N	78	г. Санкт-Петербург	18.12	Прочие виды полиграфической деятельности	45.20;31.01	УСН (доходы)	Микропредприятие	2026-10-21
991098965976	321549303377922	Романова	Дарья	Олеговна	Романова Дарья Олеговна	2021-09-01	ACTIVE	\N	\N	54	Новосибирская область	46.90	Торговля оптовая неспециализированная	47.11;47.91	УСН (доходы)	Микропредприятие	2026-10-21
994069375671	323664519062931	Яковлев	Дмитрий	Игоревич	Яковлев Дмитрий Игоревич	2023-09-01	ACTIVE	\N	\N	66	Свердловская область	18.12	Прочие виды полиграфической деятельности	10.71;45.20	ОСНО	Микропредприятие	2026-10-21
500100000011	320508100111111	Иванов	Иван	Иванович	ИП Иванов Иван Иванович	2019-02-10	ACTIVE	\N	\N	50	Московская область	47.11	Торговля розничная преимущественно пищевыми продуктами	47.91;46.90	УСН (доходы)	Микропредприятие	2026-10-21
500100000022	321508100222222	Сидорова	Анна	Сергеевна	ИП Сидорова Анна Сергеевна	2021-05-15	ACTIVE	\N	\N	50	Московская область	62.01	Разработка компьютерного программного обеспечения	62.02;63.11	УСН (доходы)	Микропредприятие	2026-10-21
500100000033	318508100333333	Кузнецов	Алексей	Петрович	ИП Кузнецов Алексей Петрович	2018-09-01	ACTIVE	\N	\N	50	Московская область	31.01	Производство мебели для офисов и предприятий торговли	49.41;18.12	ОСНО	Малое предприятие	2026-10-21
500100000077	323508100777777	Петров	Михаил	Дмитриевич	ИП Петров Михаил Дмитриевич	2023-01-20	ACTIVE	\N	\N	77	г. Москва	47.71	Торговля розничная одеждой в специализированных магазинах	47.91;46.42	УСН (доходы минус расходы)	Микропредприятие	2026-10-21
990000000115	321504530351107	Иванов	Сергей	Петрович	ИП Иванов Сергей Петрович	2021-09-01	ACTIVE	\N	\N	50	Московская область	47.11	Торговля розничная преимущественно пищевыми продуктами	47.91;46.90	УСН (доходы)	Микропредприятие	2026-10-21
\.


--
-- Data for Name: equipment_catalog; Type: TABLE DATA; Schema: synthetic; Owner: -
--

COPY synthetic.equipment_catalog (category, name, reference_price_rub) FROM stdin;
EQ-001	Форматно-раскроечный станок	2126000.00
EQ-002	Форматно-раскроечный станок	3407000.00
EQ-003	Седельный тягач	610000.00
EQ-004	Цифровая печатная машина	3397000.00
EQ-005	Цифровая печатная машина	4412000.00
EQ-006	Ротационная хлебопекарная печь	1460000.00
EQ-007	Седельный тягач	1308000.00
EQ-008	Форматно-раскроечный станок	2234000.00
EQ-009	Цифровая печатная машина	2131000.00
EQ-010	Седельный тягач	1107000.00
EQ-011	Цифровая печатная машина	2668000.00
EQ-012	Подъёмник и стенд развал-схождения	2610000.00
EQ-013	Подъёмник и стенд развал-схождения	5344000.00
EQ-014	Подъёмник и стенд развал-схождения	4554000.00
EQ-015	Седельный тягач	5066000.00
EQ-016	Ротационная хлебопекарная печь	2135000.00
EQ-017	Форматно-раскроечный станок	3902000.00
EQ-018	Ротационная хлебопекарная печь	5854000.00
EQ-019	Седельный тягач	654000.00
EQ-020	Ротационная хлебопекарная печь	1181000.00
EQ-021	Цифровая печатная машина	4296000.00
EQ-022	Седельный тягач	6407000.00
EQ-023	Цифровая печатная машина	2068000.00
EQ-024	Ротационная хлебопекарная печь	2662000.00
EQ-025	Седельный тягач	1159000.00
EQ-026	Седельный тягач	2826000.00
EQ-027	Форматно-раскроечный станок	1889000.00
EQ-028	Цифровая печатная машина	2332000.00
EQ-029	Подъёмник и стенд развал-схождения	3548000.00
EQ-030	Цифровая печатная машина	420000.00
EQ-031	Седельный тягач	3761000.00
EQ-032	Седельный тягач	3069000.00
EQ-033	Седельный тягач	2535000.00
EQ-034	Ротационная хлебопекарная печь	2589000.00
EQ-035	Ротационная хлебопекарная печь	390000.00
EQ-036	Подъёмник и стенд развал-схождения	3204000.00
EQ-037	Седельный тягач	568000.00
EQ-038	Форматно-раскроечный станок	4142000.00
EQ-039	Цифровая печатная машина	1309000.00
EQ-040	Цифровая печатная машина	2492000.00
EQ-041	Форматно-раскроечный станок	1990000.00
EQ-042	Форматно-раскроечный станок	690000.00
EQ-043	Цифровая печатная машина	2287000.00
EQ-044	Цифровая печатная машина	6862000.00
EQ-045	Седельный тягач	784000.00
EQ-046	Форматно-раскроечный станок	3035000.00
EQ-047	Цифровая печатная машина	1288000.00
EQ-048	Ротационная хлебопекарная печь	5881000.00
EQ-049	Ротационная хлебопекарная печь	1657000.00
EQ-050	Ротационная хлебопекарная печь	3901000.00
EQ-051	Седельный тягач	2000000.00
EQ-052	Седельный тягач	2500000.00
EQ-053	Форматно-раскроечный станок	2500000.00
EQ-054	Цифровая печатная машина	1250000.00
EQ-055	Цифровая печатная машина	2500000.00
\.


--
-- Data for Name: fns_account_blocks; Type: TABLE DATA; Schema: synthetic; Owner: -
--

COPY synthetic.fns_account_blocks (id, inn, decision_number, decision_date, tax_office_code, bank_bik) FROM stdin;
1	995843689392	12345	2026-09-30	7701	044525999
\.


--
-- Data for Name: monthly_facts; Type: TABLE DATA; Schema: synthetic; Owner: -
--

COPY synthetic.monthly_facts (id, application_id, month, clean_receipts_rub, operating_outflow_rub) FROM stdin;
1	DEMO-001	2025-10	560000.00	110000.00
2	DEMO-001	2025-11	840000.00	390000.00
3	DEMO-001	2025-12	560000.00	110000.00
4	DEMO-001	2026-01	840000.00	390000.00
5	DEMO-001	2026-02	560000.00	110000.00
6	DEMO-001	2026-03	840000.00	390000.00
7	DEMO-001	2026-04	560000.00	110000.00
8	DEMO-001	2026-05	840000.00	390000.00
9	DEMO-001	2026-06	560000.00	110000.00
10	DEMO-001	2026-07	840000.00	390000.00
11	DEMO-001	2026-08	560000.00	110000.00
12	DEMO-001	2026-09	840000.00	390000.00
13	DEMO-002	2025-10	2117900.00	1693600.00
14	DEMO-002	2025-11	1640900.00	1306500.00
15	DEMO-002	2025-12	1867000.00	1482000.00
16	DEMO-002	2026-01	2462000.00	1922200.00
17	DEMO-002	2026-02	2107500.00	1569100.00
18	DEMO-002	2026-03	3046000.00	2475400.00
19	DEMO-002	2026-04	2263000.00	1715000.00
20	DEMO-002	2026-05	2013900.00	1789400.00
21	DEMO-002	2026-06	1964000.00	1473600.00
22	DEMO-002	2026-07	2401100.00	1885900.00
23	DEMO-002	2026-08	2397100.00	2014600.00
24	DEMO-002	2026-09	2914600.00	2572100.00
25	DEMO-003	2025-10	481400.00	377500.00
26	DEMO-003	2025-11	524500.00	436700.00
27	DEMO-003	2025-12	594400.00	449200.00
28	DEMO-003	2026-01	445000.00	323900.00
29	DEMO-003	2026-02	453000.00	384100.00
30	DEMO-003	2026-03	561800.00	434100.00
31	DEMO-003	2026-04	386000.00	273300.00
32	DEMO-003	2026-05	562500.00	394500.00
33	DEMO-003	2026-06	442700.00	314700.00
34	DEMO-003	2026-07	497100.00	393100.00
35	DEMO-003	2026-08	487300.00	397700.00
36	DEMO-003	2026-09	558500.00	424000.00
37	DEMO-004	2025-10	1112900.00	692800.00
38	DEMO-004	2025-11	1213200.00	863000.00
39	DEMO-004	2025-12	1197400.00	865400.00
40	DEMO-004	2026-01	816700.00	608300.00
41	DEMO-004	2026-02	830200.00	568100.00
42	DEMO-004	2026-03	863800.00	543300.00
43	DEMO-004	2026-04	1039700.00	729400.00
44	DEMO-004	2026-05	1025800.00	759700.00
45	DEMO-004	2026-06	1175600.00	745600.00
46	DEMO-004	2026-07	927600.00	634100.00
47	DEMO-004	2026-08	954800.00	662900.00
48	DEMO-004	2026-09	1041700.00	773900.00
49	DEMO-005	2025-12	1919800.00	1669800.00
50	DEMO-005	2026-01	2253500.00	1987200.00
51	DEMO-005	2026-02	2548500.00	1954200.00
52	DEMO-005	2026-03	2436200.00	1901500.00
53	DEMO-005	2026-04	2027300.00	1698600.00
54	DEMO-005	2026-05	2435200.00	1879900.00
55	DEMO-005	2026-06	2266500.00	1766000.00
56	DEMO-005	2026-07	2133400.00	1761300.00
57	DEMO-005	2026-08	1972300.00	1763500.00
58	DEMO-005	2026-09	1869800.00	1423200.00
59	DEMO-006	2025-12	1759600.00	1080500.00
60	DEMO-006	2026-01	1916400.00	1187700.00
61	DEMO-006	2026-02	819200.00	571500.00
62	DEMO-006	2026-03	1899200.00	1301200.00
63	DEMO-006	2026-04	2153700.00	1403100.00
64	DEMO-006	2026-05	2046300.00	1317700.00
65	DEMO-006	2026-06	2337900.00	1634900.00
66	DEMO-006	2026-07	1503100.00	978800.00
67	DEMO-006	2026-08	2661200.00	1715500.00
68	DEMO-006	2026-09	1683700.00	1054700.00
69	DEMO-007	2025-10	3769200.00	3049000.00
70	DEMO-007	2025-11	3945000.00	3057300.00
71	DEMO-007	2025-12	3583600.00	3286400.00
72	DEMO-007	2026-01	4117200.00	3212000.00
73	DEMO-007	2026-02	2801200.00	2316700.00
74	DEMO-007	2026-03	1949900.00	1698700.00
75	DEMO-007	2026-04	2792600.00	2365200.00
76	DEMO-007	2026-05	3382600.00	2610800.00
77	DEMO-007	2026-06	3620800.00	3299500.00
78	DEMO-007	2026-07	3261800.00	2833700.00
79	DEMO-007	2026-08	2399000.00	1866500.00
80	DEMO-007	2026-09	2274400.00	1726600.00
81	DEMO-008	2025-10	790800.00	623100.00
82	DEMO-008	2025-11	616000.00	462500.00
83	DEMO-008	2025-12	791500.00	664900.00
84	DEMO-008	2026-01	534700.00	412700.00
85	DEMO-008	2026-02	606400.00	505500.00
86	DEMO-008	2026-03	1005800.00	711400.00
87	DEMO-008	2026-04	717800.00	601800.00
88	DEMO-008	2026-05	750400.00	538000.00
89	DEMO-008	2026-06	767100.00	642200.00
90	DEMO-008	2026-07	858800.00	627200.00
91	DEMO-008	2026-08	1013400.00	715700.00
92	DEMO-008	2026-09	368300.00	278500.00
93	DEMO-009	2025-10	2085400.00	1280400.00
94	DEMO-009	2025-11	2147500.00	1162600.00
95	DEMO-009	2025-12	2612500.00	1388600.00
96	DEMO-009	2026-01	2628800.00	1528500.00
97	DEMO-009	2026-02	2424200.00	1442500.00
98	DEMO-009	2026-03	3533900.00	1980900.00
99	DEMO-009	2026-04	1524100.00	939700.00
100	DEMO-009	2026-05	2025000.00	1232700.00
101	DEMO-009	2026-06	1718700.00	1030700.00
102	DEMO-009	2026-07	2841300.00	1556200.00
103	DEMO-009	2026-08	2858900.00	1557400.00
104	DEMO-009	2026-09	3595800.00	1886000.00
105	DEMO-010	2025-10	2996000.00	2370800.00
106	DEMO-010	2025-11	2151200.00	1697300.00
107	DEMO-010	2025-12	3344600.00	2665500.00
108	DEMO-010	2026-01	2204800.00	1837500.00
109	DEMO-010	2026-02	2317400.00	1777400.00
110	DEMO-010	2026-03	2755200.00	2155400.00
111	DEMO-010	2026-04	2706900.00	2324800.00
112	DEMO-010	2026-05	3397400.00	2924800.00
113	DEMO-010	2026-06	2754100.00	2078500.00
114	DEMO-010	2026-07	2098900.00	1703200.00
115	DEMO-010	2026-08	2418300.00	2016400.00
116	DEMO-010	2026-09	2412200.00	1960700.00
117	DEMO-011	2025-10	946400.00	504900.00
118	DEMO-011	2025-11	850300.00	481700.00
119	DEMO-011	2025-12	836200.00	485800.00
120	DEMO-011	2026-01	936600.00	530800.00
121	DEMO-011	2026-02	814200.00	470600.00
122	DEMO-011	2026-03	653700.00	391900.00
123	DEMO-011	2026-04	807200.00	417300.00
124	DEMO-011	2026-05	512900.00	255000.00
125	DEMO-011	2026-06	802700.00	410800.00
126	DEMO-011	2026-07	867200.00	441300.00
127	DEMO-011	2026-08	993800.00	565100.00
128	DEMO-011	2026-09	826900.00	460600.00
129	DEMO-012	2025-11	1527300.00	1062800.00
130	DEMO-012	2025-12	1274000.00	939600.00
131	DEMO-012	2026-01	1996700.00	1342400.00
132	DEMO-012	2026-02	1305200.00	984800.00
133	DEMO-012	2026-03	1742500.00	1309600.00
134	DEMO-012	2026-04	891000.00	576200.00
135	DEMO-012	2026-05	844700.00	640900.00
136	DEMO-012	2026-06	1701400.00	1138000.00
137	DEMO-012	2026-07	1754900.00	1228400.00
138	DEMO-012	2026-08	1375700.00	991200.00
139	DEMO-012	2026-09	1622400.00	1116000.00
140	DEMO-013	2025-10	1378600.00	1078900.00
141	DEMO-013	2025-11	1262800.00	1035900.00
142	DEMO-013	2025-12	2076600.00	1785700.00
143	DEMO-013	2026-01	1526200.00	1204100.00
144	DEMO-013	2026-02	2301400.00	1728400.00
145	DEMO-013	2026-03	1766800.00	1276300.00
146	DEMO-013	2026-04	2079300.00	1532600.00
147	DEMO-013	2026-05	1977100.00	1467600.00
148	DEMO-013	2026-06	1967900.00	1445900.00
149	DEMO-013	2026-07	2134600.00	1513000.00
150	DEMO-013	2026-08	2112700.00	1670000.00
151	DEMO-013	2026-09	1821200.00	1365300.00
152	DEMO-014	2026-01	1998200.00	1397000.00
153	DEMO-014	2026-02	2332900.00	1695600.00
154	DEMO-014	2026-03	2746400.00	1725100.00
155	DEMO-014	2026-04	1839000.00	1155900.00
156	DEMO-014	2026-05	2392200.00	1647100.00
157	DEMO-014	2026-06	3045600.00	1892400.00
158	DEMO-014	2026-07	1307300.00	815200.00
159	DEMO-014	2026-08	2064500.00	1260200.00
160	DEMO-014	2026-09	2790200.00	1676200.00
161	DEMO-015	2025-10	2026600.00	1415400.00
162	DEMO-015	2025-11	1993400.00	1611800.00
163	DEMO-015	2025-12	1712700.00	1309500.00
164	DEMO-015	2026-01	2061200.00	1633400.00
165	DEMO-015	2026-02	1951900.00	1626200.00
166	DEMO-015	2026-03	2082800.00	1499900.00
167	DEMO-015	2026-04	2503300.00	1958300.00
168	DEMO-015	2026-05	1817700.00	1435800.00
169	DEMO-015	2026-06	1300200.00	998400.00
170	DEMO-015	2026-07	1619000.00	1143400.00
171	DEMO-015	2026-08	2397800.00	1788200.00
172	DEMO-015	2026-09	1951000.00	1450600.00
173	DEMO-016	2025-10	907500.00	596400.00
174	DEMO-016	2025-11	1034800.00	588600.00
175	DEMO-016	2025-12	1508500.00	913700.00
176	DEMO-016	2026-01	1370200.00	802400.00
177	DEMO-016	2026-02	1247900.00	811300.00
178	DEMO-016	2026-03	1006300.00	604400.00
179	DEMO-016	2026-04	1318700.00	850700.00
180	DEMO-016	2026-05	1298700.00	835400.00
181	DEMO-016	2026-06	846700.00	484900.00
182	DEMO-016	2026-07	1100300.00	698000.00
183	DEMO-016	2026-08	971600.00	572600.00
184	DEMO-016	2026-09	1090700.00	710800.00
185	DEMO-017	2025-10	545500.00	389100.00
186	DEMO-017	2025-11	334000.00	220600.00
187	DEMO-017	2025-12	530300.00	353900.00
188	DEMO-017	2026-01	487100.00	330000.00
189	DEMO-017	2026-02	435000.00	272700.00
190	DEMO-017	2026-03	521000.00	357600.00
191	DEMO-017	2026-04	424000.00	268700.00
192	DEMO-017	2026-05	456300.00	285600.00
193	DEMO-017	2026-06	402400.00	244600.00
194	DEMO-017	2026-07	517000.00	375000.00
195	DEMO-017	2026-08	305300.00	212600.00
196	DEMO-017	2026-09	413000.00	284500.00
197	DEMO-018	2025-10	1381900.00	1011700.00
198	DEMO-018	2025-11	925700.00	644300.00
199	DEMO-018	2025-12	1219000.00	908300.00
200	DEMO-018	2026-01	1174400.00	875600.00
201	DEMO-018	2026-02	1119100.00	903100.00
202	DEMO-018	2026-03	1316400.00	927400.00
203	DEMO-018	2026-04	1059900.00	853000.00
204	DEMO-018	2026-05	1138000.00	862400.00
205	DEMO-018	2026-06	1149900.00	806600.00
206	DEMO-018	2026-07	1319400.00	982000.00
207	DEMO-018	2026-08	1324100.00	1008800.00
208	DEMO-018	2026-09	1170400.00	901800.00
209	DEMO-019	2025-12	2297900.00	1997900.00
210	DEMO-019	2026-01	2816500.00	2202500.00
211	DEMO-019	2026-02	3567600.00	3056000.00
212	DEMO-019	2026-03	4074300.00	3488700.00
213	DEMO-019	2026-04	4438400.00	3597000.00
214	DEMO-019	2026-05	2231300.00	1973900.00
215	DEMO-019	2026-06	2450400.00	2050700.00
216	DEMO-019	2026-07	4098700.00	3113400.00
217	DEMO-019	2026-08	3069500.00	2486200.00
218	DEMO-019	2026-09	2125700.00	1676000.00
219	DEMO-020	2026-03	988300.00	595100.00
220	DEMO-020	2026-04	910900.00	585100.00
221	DEMO-020	2026-05	1232300.00	695900.00
222	DEMO-020	2026-06	905700.00	580100.00
223	DEMO-020	2026-07	751700.00	423900.00
224	DEMO-020	2026-08	1037600.00	600100.00
225	DEMO-020	2026-09	738400.00	429600.00
226	DEMO-021	2025-10	2608400.00	2121200.00
227	DEMO-021	2025-11	1846700.00	1341100.00
228	DEMO-021	2025-12	2681500.00	2016100.00
229	DEMO-021	2026-01	621300.00	507900.00
230	DEMO-021	2026-02	2257500.00	1875200.00
231	DEMO-021	2026-03	2854800.00	2135400.00
232	DEMO-021	2026-04	2536000.00	1815500.00
233	DEMO-021	2026-05	2838200.00	2138800.00
234	DEMO-021	2026-06	4168600.00	3477900.00
235	DEMO-021	2026-07	1596000.00	1295400.00
236	DEMO-021	2026-08	4409600.00	3682400.00
237	DEMO-021	2026-09	2249800.00	1701900.00
238	DEMO-022	2025-10	1222700.00	1100100.00
239	DEMO-022	2025-11	1240300.00	1079500.00
240	DEMO-022	2025-12	1005800.00	791300.00
241	DEMO-022	2026-01	925600.00	720000.00
242	DEMO-022	2026-02	1137200.00	952500.00
243	DEMO-022	2026-03	1237900.00	1046200.00
244	DEMO-022	2026-04	717600.00	536800.00
245	DEMO-022	2026-05	721800.00	642300.00
246	DEMO-022	2026-06	861900.00	718100.00
247	DEMO-022	2026-07	2180600.00	1851500.00
248	DEMO-022	2026-08	2178800.00	1727700.00
249	DEMO-022	2026-09	1579400.00	1237500.00
250	DEMO-023	2025-10	2078800.00	1531700.00
251	DEMO-023	2025-11	2312500.00	1571300.00
252	DEMO-023	2025-12	3076400.00	2281700.00
253	DEMO-023	2026-01	1809600.00	1303500.00
254	DEMO-023	2026-02	2712200.00	1967300.00
255	DEMO-023	2026-03	2023000.00	1356500.00
256	DEMO-023	2026-04	1981800.00	1338300.00
257	DEMO-023	2026-05	2358400.00	1647800.00
258	DEMO-023	2026-06	417500.00	270100.00
259	DEMO-023	2026-07	2199200.00	1531400.00
260	DEMO-023	2026-08	1610900.00	1015200.00
261	DEMO-023	2026-09	1367500.00	943000.00
262	DEMO-024	2025-10	861700.00	692400.00
263	DEMO-024	2025-11	1615700.00	1269400.00
264	DEMO-024	2025-12	285000.00	251500.00
265	DEMO-024	2026-01	367700.00	322800.00
266	DEMO-024	2026-02	536000.00	449300.00
267	DEMO-024	2026-03	722900.00	602100.00
268	DEMO-024	2026-04	440000.00	342700.00
269	DEMO-024	2026-05	1058700.00	892000.00
270	DEMO-024	2026-06	503000.00	449800.00
271	DEMO-024	2026-07	850200.00	705600.00
272	DEMO-024	2026-08	1606700.00	1241300.00
273	DEMO-024	2026-09	1152300.00	857100.00
274	DEMO-025	2025-10	220000.00	130000.00
275	DEMO-025	2025-11	580000.00	130000.00
276	DEMO-025	2025-12	220000.00	130000.00
277	DEMO-025	2026-01	580000.00	130000.00
278	DEMO-025	2026-02	220000.00	130000.00
279	DEMO-025	2026-03	580000.00	130000.00
280	DEMO-025	2026-04	220000.00	130000.00
281	DEMO-025	2026-05	580000.00	130000.00
282	DEMO-025	2026-06	220000.00	130000.00
283	DEMO-025	2026-07	580000.00	130000.00
284	DEMO-025	2026-08	220000.00	130000.00
285	DEMO-025	2026-09	580000.00	130000.00
286	DEMO-026	2025-10	1500600.00	1371000.00
287	DEMO-026	2025-11	2910200.00	2231800.00
288	DEMO-026	2025-12	4191200.00	3807300.00
289	DEMO-026	2026-01	2121800.00	1832200.00
290	DEMO-026	2026-02	2448900.00	2152100.00
291	DEMO-026	2026-03	3997700.00	3156100.00
292	DEMO-026	2026-04	737200.00	657800.00
293	DEMO-026	2026-05	2190500.00	1750300.00
294	DEMO-026	2026-06	2037800.00	1727600.00
295	DEMO-026	2026-07	3307100.00	2642800.00
296	DEMO-026	2026-08	2830600.00	2185000.00
297	DEMO-026	2026-09	2203400.00	1934000.00
298	DEMO-027	2025-10	877200.00	686900.00
299	DEMO-027	2025-11	1122300.00	896900.00
300	DEMO-027	2025-12	946700.00	771500.00
301	DEMO-027	2026-01	1135700.00	998200.00
302	DEMO-027	2026-02	972900.00	824700.00
303	DEMO-027	2026-03	358300.00	280800.00
304	DEMO-027	2026-04	834400.00	627600.00
305	DEMO-027	2026-05	1326000.00	1170000.00
306	DEMO-027	2026-06	1310300.00	1023500.00
307	DEMO-027	2026-07	984100.00	820000.00
308	DEMO-027	2026-08	928300.00	713700.00
309	DEMO-027	2026-09	877600.00	662400.00
310	DEMO-028	2026-01	1134700.00	680500.00
311	DEMO-028	2026-02	2260700.00	1139900.00
312	DEMO-028	2026-03	1955800.00	1172800.00
313	DEMO-028	2026-04	1532600.00	766400.00
314	DEMO-028	2026-05	2387600.00	1293400.00
315	DEMO-028	2026-06	1263500.00	734700.00
316	DEMO-028	2026-07	1904000.00	1106400.00
317	DEMO-028	2026-08	1968100.00	1189800.00
318	DEMO-028	2026-09	1937600.00	1100300.00
319	DEMO-029	2025-10	2023800.00	1089700.00
320	DEMO-029	2025-11	1763800.00	1043000.00
321	DEMO-029	2025-12	1376900.00	779300.00
322	DEMO-029	2026-01	1753600.00	1101600.00
323	DEMO-029	2026-02	2244400.00	1387600.00
324	DEMO-029	2026-03	3595800.00	2047700.00
325	DEMO-029	2026-04	1995700.00	1202300.00
326	DEMO-029	2026-05	1418700.00	867200.00
327	DEMO-029	2026-06	1093200.00	622800.00
328	DEMO-029	2026-07	1466700.00	832300.00
329	DEMO-029	2026-08	0.00	0.00
330	DEMO-029	2026-09	1665800.00	1015800.00
331	DEMO-030	2026-02	2641700.00	1875300.00
332	DEMO-030	2026-03	3094900.00	2290400.00
333	DEMO-030	2026-04	4885100.00	3700200.00
334	DEMO-030	2026-05	2056700.00	1686800.00
335	DEMO-030	2026-06	3554800.00	2568000.00
336	DEMO-030	2026-07	1421400.00	1078700.00
337	DEMO-030	2026-08	1977600.00	1492000.00
338	DEMO-030	2026-09	2999700.00	2137800.00
339	DEMO-031	2025-10	931100.00	676300.00
340	DEMO-031	2025-11	2188000.00	1747200.00
341	DEMO-031	2025-12	1920100.00	1546000.00
342	DEMO-031	2026-01	1649200.00	1356300.00
343	DEMO-031	2026-02	2795200.00	1946800.00
344	DEMO-031	2026-03	1165500.00	844100.00
345	DEMO-031	2026-04	1317500.00	1078200.00
346	DEMO-031	2026-05	2182000.00	1540900.00
347	DEMO-031	2026-06	2068000.00	1495600.00
348	DEMO-031	2026-07	2337100.00	1918600.00
349	DEMO-031	2026-08	1386600.00	1139200.00
350	DEMO-031	2026-09	524700.00	377700.00
351	DEMO-032	2025-10	994300.00	657500.00
352	DEMO-032	2025-11	1541000.00	1039200.00
353	DEMO-032	2025-12	1156000.00	785200.00
354	DEMO-032	2026-01	1743800.00	1264600.00
355	DEMO-032	2026-02	1677900.00	1178200.00
356	DEMO-032	2026-03	1601600.00	1027400.00
357	DEMO-032	2026-04	1534400.00	1083200.00
358	DEMO-032	2026-05	1509100.00	1011300.00
359	DEMO-032	2026-06	1798100.00	1289100.00
360	DEMO-032	2026-07	1933300.00	1424600.00
361	DEMO-032	2026-08	674100.00	456700.00
362	DEMO-032	2026-09	1593100.00	1075000.00
363	DEMO-033	2025-10	332800.00	233600.00
364	DEMO-033	2025-11	964100.00	753600.00
365	DEMO-033	2025-12	902000.00	728100.00
366	DEMO-033	2026-01	607000.00	462500.00
367	DEMO-033	2026-02	1022200.00	752400.00
368	DEMO-033	2026-03	973200.00	683700.00
369	DEMO-033	2026-04	76200.00	61200.00
370	DEMO-033	2026-05	389200.00	268900.00
371	DEMO-033	2026-06	314900.00	216800.00
372	DEMO-033	2026-07	1101000.00	857600.00
373	DEMO-033	2026-08	887900.00	641500.00
374	DEMO-033	2026-09	552700.00	405800.00
375	DEMO-034	2025-11	1317000.00	1145800.00
376	DEMO-034	2025-12	1194500.00	1020600.00
377	DEMO-034	2026-01	1277500.00	1030600.00
378	DEMO-034	2026-02	1756700.00	1415600.00
379	DEMO-034	2026-03	1262800.00	925800.00
380	DEMO-034	2026-04	1144300.00	840300.00
381	DEMO-034	2026-05	0.00	0.00
382	DEMO-034	2026-06	1382200.00	1019300.00
383	DEMO-034	2026-07	1657700.00	1206600.00
384	DEMO-034	2026-08	1191300.00	1003900.00
385	DEMO-034	2026-09	2634000.00	1984800.00
386	DEMO-035	2025-10	620100.00	405200.00
387	DEMO-035	2025-11	690000.00	516300.00
388	DEMO-035	2025-12	730900.00	514400.00
389	DEMO-035	2026-01	725900.00	554500.00
390	DEMO-035	2026-02	871300.00	587800.00
391	DEMO-035	2026-03	814100.00	592700.00
392	DEMO-035	2026-04	647800.00	448300.00
393	DEMO-035	2026-05	647700.00	446700.00
394	DEMO-035	2026-06	775300.00	535800.00
395	DEMO-035	2026-07	759500.00	504000.00
396	DEMO-035	2026-08	557700.00	358900.00
397	DEMO-035	2026-09	527700.00	369100.00
398	DEMO-036	2025-10	2389900.00	1813000.00
399	DEMO-036	2025-11	1909700.00	1724700.00
400	DEMO-036	2025-12	1874800.00	1631800.00
401	DEMO-036	2026-01	1637700.00	1360600.00
402	DEMO-036	2026-02	1556800.00	1317400.00
403	DEMO-036	2026-03	904300.00	703100.00
404	DEMO-036	2026-04	1574000.00	1332700.00
405	DEMO-036	2026-05	1132100.00	880700.00
406	DEMO-036	2026-06	1606700.00	1375200.00
407	DEMO-036	2026-07	1286700.00	1133200.00
408	DEMO-036	2026-08	1684200.00	1308100.00
409	DEMO-036	2026-09	1429900.00	1257700.00
410	DEMO-037	2025-10	457800.00	347100.00
411	DEMO-037	2025-11	847700.00	714400.00
412	DEMO-037	2025-12	648800.00	552000.00
413	DEMO-037	2026-01	454100.00	390200.00
414	DEMO-037	2026-02	705400.00	543300.00
415	DEMO-037	2026-03	509000.00	419700.00
416	DEMO-037	2026-04	788900.00	608000.00
417	DEMO-037	2026-05	469600.00	406300.00
418	DEMO-037	2026-06	489700.00	429900.00
419	DEMO-037	2026-07	698700.00	602300.00
420	DEMO-037	2026-08	500100.00	413500.00
421	DEMO-037	2026-09	582600.00	510700.00
422	DEMO-038	2026-06	2250300.00	1679000.00
423	DEMO-038	2026-07	0.00	0.00
424	DEMO-038	2026-08	1095600.00	801800.00
425	DEMO-038	2026-09	1409600.00	1095900.00
426	DEMO-039	2025-10	957500.00	723400.00
427	DEMO-039	2025-11	666400.00	455200.00
428	DEMO-039	2025-12	1155700.00	837600.00
429	DEMO-039	2026-01	780400.00	521700.00
430	DEMO-039	2026-02	743800.00	482700.00
431	DEMO-039	2026-03	960800.00	696000.00
432	DEMO-039	2026-04	734200.00	527900.00
433	DEMO-039	2026-05	985500.00	648700.00
434	DEMO-039	2026-06	759900.00	518300.00
435	DEMO-039	2026-07	463900.00	319300.00
436	DEMO-039	2026-08	867000.00	583300.00
437	DEMO-039	2026-09	932900.00	641100.00
438	DEMO-040	2026-07	0.00	0.00
439	DEMO-040	2026-08	1492800.00	887600.00
440	DEMO-040	2026-09	1932100.00	1129100.00
441	DEMO-041	2025-10	3640000.00	2502400.00
442	DEMO-041	2025-11	3109800.00	2020500.00
443	DEMO-041	2025-12	3844000.00	2468900.00
444	DEMO-041	2026-01	2346000.00	1631200.00
445	DEMO-041	2026-02	4109400.00	2937100.00
446	DEMO-041	2026-03	1882800.00	1194200.00
447	DEMO-041	2026-04	3421800.00	2526500.00
448	DEMO-041	2026-05	1878600.00	1313400.00
449	DEMO-041	2026-06	2100100.00	1355100.00
450	DEMO-041	2026-07	2129400.00	1482500.00
451	DEMO-041	2026-08	2813300.00	1820300.00
452	DEMO-041	2026-09	3084600.00	2199800.00
453	DEMO-042	2026-03	875100.00	586400.00
454	DEMO-042	2026-04	631600.00	452600.00
455	DEMO-042	2026-05	215300.00	159300.00
456	DEMO-042	2026-06	0.00	0.00
457	DEMO-042	2026-07	152700.00	111900.00
458	DEMO-042	2026-08	374900.00	276200.00
459	DEMO-042	2026-09	818600.00	608700.00
460	DEMO-043	2025-10	3047900.00	1558400.00
461	DEMO-043	2025-11	1705900.00	1009300.00
462	DEMO-043	2025-12	2295400.00	1204000.00
463	DEMO-043	2026-01	2378800.00	1332900.00
464	DEMO-043	2026-02	2533000.00	1281800.00
465	DEMO-043	2026-03	3453600.00	2073100.00
466	DEMO-043	2026-04	1500800.00	914400.00
467	DEMO-043	2026-05	1702500.00	958500.00
468	DEMO-043	2026-06	3416300.00	1799300.00
469	DEMO-043	2026-07	2224700.00	1318800.00
470	DEMO-043	2026-08	2198200.00	1235700.00
471	DEMO-043	2026-09	1997700.00	1165100.00
472	DEMO-044	2025-10	2035800.00	1302400.00
473	DEMO-044	2025-11	2367400.00	1577300.00
474	DEMO-044	2025-12	1794000.00	1187700.00
475	DEMO-044	2026-01	2133500.00	1312300.00
476	DEMO-044	2026-02	1333300.00	783200.00
477	DEMO-044	2026-03	1962700.00	1183200.00
478	DEMO-044	2026-04	2164100.00	1413100.00
479	DEMO-044	2026-05	2685400.00	1565000.00
480	DEMO-044	2026-06	1767900.00	1135300.00
481	DEMO-044	2026-07	2550900.00	1669300.00
482	DEMO-044	2026-08	2183100.00	1324100.00
483	DEMO-044	2026-09	2602900.00	1559600.00
484	DEMO-045	2025-10	1723400.00	1403800.00
485	DEMO-045	2025-11	1062700.00	957300.00
486	DEMO-045	2025-12	1345400.00	1192800.00
487	DEMO-045	2026-01	1605200.00	1337200.00
488	DEMO-045	2026-02	1418900.00	1101700.00
489	DEMO-045	2026-03	954500.00	804900.00
490	DEMO-045	2026-04	903500.00	731200.00
491	DEMO-045	2026-05	1737100.00	1316100.00
492	DEMO-045	2026-06	1683100.00	1463400.00
493	DEMO-045	2026-07	1695700.00	1390400.00
494	DEMO-045	2026-08	630000.00	487100.00
495	DEMO-045	2026-09	1774000.00	1449300.00
496	DEMO-046	2025-10	520000.00	447900.00
497	DEMO-046	2025-11	504600.00	394400.00
498	DEMO-046	2025-12	614300.00	490300.00
499	DEMO-046	2026-01	993100.00	824800.00
500	DEMO-046	2026-02	726700.00	633700.00
501	DEMO-046	2026-03	1222100.00	972200.00
502	DEMO-046	2026-04	838300.00	676200.00
503	DEMO-046	2026-05	763300.00	608100.00
504	DEMO-046	2026-06	819600.00	697200.00
505	DEMO-046	2026-07	878100.00	736200.00
506	DEMO-046	2026-08	716900.00	597700.00
507	DEMO-046	2026-09	1205400.00	1019400.00
508	DEMO-047	2025-10	3771000.00	2654500.00
509	DEMO-047	2025-11	3416000.00	2147400.00
510	DEMO-047	2025-12	3413400.00	2118100.00
511	DEMO-047	2026-01	3308000.00	2068600.00
512	DEMO-047	2026-02	4341400.00	2909100.00
513	DEMO-047	2026-03	1683400.00	1019100.00
514	DEMO-047	2026-04	4460700.00	3112700.00
515	DEMO-047	2026-05	3228900.00	1911300.00
516	DEMO-047	2026-06	3040100.00	2051800.00
517	DEMO-047	2026-07	2362700.00	1655400.00
518	DEMO-047	2026-08	2913900.00	1837800.00
519	DEMO-047	2026-09	3845000.00	2500900.00
520	DEMO-048	2025-10	578100.00	355500.00
521	DEMO-048	2025-11	315800.00	193800.00
522	DEMO-048	2025-12	575000.00	344500.00
523	DEMO-048	2026-01	394200.00	244000.00
524	DEMO-048	2026-02	348200.00	207600.00
525	DEMO-048	2026-03	509800.00	337600.00
526	DEMO-048	2026-04	558200.00	379800.00
527	DEMO-048	2026-05	391200.00	261100.00
528	DEMO-048	2026-06	185800.00	121200.00
529	DEMO-048	2026-07	505500.00	304200.00
530	DEMO-048	2026-08	297900.00	196400.00
531	DEMO-048	2026-09	449600.00	300200.00
532	DEMO-049	2026-01	853800.00	493700.00
533	DEMO-049	2026-02	1093900.00	711400.00
534	DEMO-049	2026-03	1515200.00	898100.00
535	DEMO-049	2026-04	906400.00	557800.00
536	DEMO-049	2026-05	800800.00	550500.00
537	DEMO-049	2026-06	618600.00	423300.00
538	DEMO-049	2026-07	1036100.00	607600.00
539	DEMO-049	2026-08	825000.00	543000.00
540	DEMO-049	2026-09	1017000.00	671400.00
541	DEMO-050	2025-10	2016200.00	1621500.00
542	DEMO-050	2025-11	1423700.00	1111300.00
543	DEMO-050	2025-12	2996500.00	2020900.00
544	DEMO-050	2026-01	2035200.00	1480800.00
545	DEMO-050	2026-02	1874300.00	1460600.00
546	DEMO-050	2026-03	1872400.00	1326800.00
547	DEMO-050	2026-04	2222900.00	1505200.00
548	DEMO-050	2026-05	1825500.00	1417700.00
549	DEMO-050	2026-06	1979400.00	1493700.00
550	DEMO-050	2026-07	1650100.00	1241200.00
551	DEMO-050	2026-08	2054900.00	1529500.00
552	DEMO-050	2026-09	1445900.00	1092700.00
553	DEMO-051	2025-10	2347600.00	1428200.00
554	DEMO-051	2025-11	2396000.00	1491500.00
555	DEMO-051	2025-12	2498600.00	1632000.00
556	DEMO-051	2026-01	2604200.00	1522700.00
557	DEMO-051	2026-02	2367900.00	1644800.00
558	DEMO-051	2026-03	2670100.00	1608300.00
559	DEMO-051	2026-04	2359400.00	1506500.00
560	DEMO-051	2026-05	2367700.00	1632400.00
561	DEMO-051	2026-06	2529900.00	1482200.00
562	DEMO-051	2026-07	1954900.00	1325600.00
563	DEMO-051	2026-08	2247700.00	1311300.00
564	DEMO-051	2026-09	2297700.00	1486700.00
565	DEMO-052	2025-10	1878200.00	1256800.00
566	DEMO-052	2025-11	1781400.00	1234900.00
567	DEMO-052	2025-12	2115700.00	1523100.00
568	DEMO-052	2026-01	2843700.00	1897000.00
569	DEMO-052	2026-02	1925800.00	1309100.00
570	DEMO-052	2026-03	1167500.00	875000.00
571	DEMO-052	2026-04	1869300.00	1154700.00
572	DEMO-052	2026-05	2394500.00	1490400.00
573	DEMO-052	2026-06	1932800.00	1269300.00
574	DEMO-052	2026-07	1804200.00	1118500.00
575	DEMO-052	2026-08	1760000.00	1119800.00
576	DEMO-052	2026-09	2101400.00	1554800.00
577	DEMO-057	2026-09	517400.00	310400.00
578	DEMO-058	2026-08	248800.00	149300.00
579	DEMO-058	2026-09	639400.00	383600.00
580	DEMO-060	2026-08	316900.00	190100.00
581	DEMO-060	2026-09	653500.00	392100.00
582	DEMO-061	2026-09	446700.00	268000.00
583	DEMO-079	2025-10	2941000.00	2059200.00
584	DEMO-079	2025-11	3377800.00	2583400.00
585	DEMO-079	2025-12	2894000.00	2366300.00
586	DEMO-079	2026-01	2751300.00	2008500.00
587	DEMO-079	2026-02	2297000.00	1625800.00
588	DEMO-079	2026-03	2660100.00	1943200.00
589	DEMO-079	2026-04	2713700.00	2221500.00
590	DEMO-079	2026-05	2583100.00	1781600.00
591	DEMO-079	2026-06	2781800.00	1960100.00
592	DEMO-079	2026-07	3570200.00	2550000.00
593	DEMO-079	2026-08	3027700.00	2355500.00
594	DEMO-079	2026-09	2896100.00	2058100.00
595	DEMO-080	2025-10	1138100.00	589400.00
596	DEMO-080	2025-11	2477100.00	1403900.00
597	DEMO-080	2025-12	1799600.00	984000.00
598	DEMO-080	2026-01	1757100.00	1057800.00
599	DEMO-080	2026-02	1409900.00	811700.00
600	DEMO-080	2026-03	1967300.00	1141800.00
601	DEMO-080	2026-04	2876300.00	1546400.00
602	DEMO-080	2026-05	1514200.00	813700.00
603	DEMO-080	2026-06	2260400.00	1350100.00
604	DEMO-080	2026-07	2231700.00	1195500.00
605	DEMO-080	2026-08	1389900.00	796000.00
606	DEMO-080	2026-09	1695500.00	947500.00
607	DEMO-081	2025-10	3026300.00	2470000.00
608	DEMO-081	2025-11	2582100.00	1906600.00
609	DEMO-081	2025-12	2701900.00	1905300.00
610	DEMO-081	2026-01	2649800.00	2002100.00
611	DEMO-081	2026-02	2854500.00	2424800.00
612	DEMO-081	2026-03	2389400.00	1757200.00
613	DEMO-081	2026-04	2330300.00	1913500.00
614	DEMO-081	2026-05	999000.00	722300.00
615	DEMO-081	2026-06	2939300.00	2075900.00
616	DEMO-081	2026-07	2578900.00	2184100.00
617	DEMO-081	2026-08	1764600.00	1282000.00
618	DEMO-081	2026-09	2086000.00	1577400.00
619	DEMO-082	2025-10	2343400.00	1765000.00
620	DEMO-082	2025-11	3846500.00	2430000.00
621	DEMO-082	2025-12	2926700.00	2002000.00
622	DEMO-082	2026-01	3087000.00	2242300.00
623	DEMO-082	2026-02	2512100.00	1783600.00
624	DEMO-082	2026-03	2100200.00	1354700.00
625	DEMO-082	2026-04	2544400.00	1593000.00
626	DEMO-082	2026-05	2545200.00	1714500.00
627	DEMO-082	2026-06	3350900.00	2168000.00
628	DEMO-082	2026-07	2473000.00	1772200.00
629	DEMO-082	2026-08	3220100.00	2396700.00
630	DEMO-082	2026-09	3066700.00	2170100.00
631	DEMO-084	2025-10	1409800.00	1099000.00
632	DEMO-084	2025-11	1223400.00	798200.00
633	DEMO-084	2025-12	1340400.00	885900.00
634	DEMO-084	2026-01	1926100.00	1479800.00
635	DEMO-084	2026-02	703000.00	516400.00
636	DEMO-084	2026-03	1525800.00	1157000.00
637	DEMO-084	2026-04	795400.00	516100.00
638	DEMO-084	2026-05	1335400.00	956900.00
639	DEMO-084	2026-06	1684500.00	1090700.00
640	DEMO-084	2026-07	1794000.00	1206200.00
641	DEMO-084	2026-08	1868900.00	1232300.00
642	DEMO-084	2026-09	1254800.00	928800.00
643	DEMO-086	2025-10	1915000.00	1454800.00
644	DEMO-086	2025-11	2466500.00	1614700.00
645	DEMO-086	2025-12	3020900.00	2310900.00
646	DEMO-086	2026-01	2412100.00	1684500.00
647	DEMO-086	2026-02	2163800.00	1490400.00
648	DEMO-086	2026-03	2754900.00	1800100.00
649	DEMO-086	2026-04	2115400.00	1556200.00
650	DEMO-086	2026-05	3480700.00	2517500.00
651	DEMO-086	2026-06	3239800.00	2500200.00
652	DEMO-086	2026-07	3065700.00	2031700.00
653	DEMO-086	2026-08	2218000.00	1446400.00
654	DEMO-086	2026-09	2783300.00	2036700.00
655	DEMO-087	2025-10	3353500.00	2605800.00
656	DEMO-087	2025-11	2847400.00	2165400.00
657	DEMO-087	2025-12	3116300.00	2096900.00
658	DEMO-087	2026-01	3659100.00	2674900.00
659	DEMO-087	2026-02	2728200.00	1829800.00
660	DEMO-087	2026-03	3561300.00	2737700.00
661	DEMO-087	2026-04	2717100.00	2064900.00
662	DEMO-087	2026-05	2959100.00	2124700.00
663	DEMO-087	2026-06	3077100.00	2124500.00
664	DEMO-087	2026-07	3501500.00	2489500.00
665	DEMO-087	2026-08	3008700.00	2086600.00
666	DEMO-087	2026-09	2731400.00	2198000.00
667	DEMO-088	2025-10	2684300.00	1731800.00
668	DEMO-088	2025-11	2026500.00	1401200.00
669	DEMO-088	2025-12	2125200.00	1554500.00
670	DEMO-088	2026-01	2978200.00	2202400.00
671	DEMO-088	2026-02	3699500.00	2660000.00
672	DEMO-088	2026-03	2256000.00	1690300.00
673	DEMO-088	2026-04	2280900.00	1503200.00
674	DEMO-088	2026-05	3448200.00	2368700.00
675	DEMO-088	2026-06	2365500.00	1693800.00
676	DEMO-088	2026-07	3249700.00	2377400.00
677	DEMO-088	2026-08	2356600.00	1753600.00
678	DEMO-088	2026-09	3336900.00	2490100.00
679	DEMO-089	2025-10	2021200.00	1303700.00
680	DEMO-089	2025-11	1640500.00	1043300.00
681	DEMO-089	2025-12	2854100.00	1928700.00
682	DEMO-089	2026-01	1712800.00	1085600.00
683	DEMO-089	2026-02	1853500.00	1239700.00
684	DEMO-089	2026-03	1674000.00	1142400.00
685	DEMO-089	2026-04	2236200.00	1568700.00
686	DEMO-089	2026-05	1714300.00	1113300.00
687	DEMO-089	2026-06	1660300.00	1047400.00
688	DEMO-089	2026-07	2602000.00	1582700.00
689	DEMO-089	2026-08	2195800.00	1525200.00
690	DEMO-089	2026-09	2004900.00	1230000.00
691	DEMO-090	2025-10	1858300.00	1452200.00
692	DEMO-090	2025-11	1289600.00	962900.00
693	DEMO-090	2025-12	1371300.00	986100.00
694	DEMO-090	2026-01	1263200.00	1032400.00
695	DEMO-090	2026-02	1805100.00	1485200.00
696	DEMO-090	2026-03	1214700.00	925200.00
697	DEMO-090	2026-04	1525700.00	1064400.00
698	DEMO-090	2026-05	1528000.00	1161900.00
699	DEMO-090	2026-06	1566100.00	1271200.00
700	DEMO-090	2026-07	1391900.00	1032700.00
701	DEMO-090	2026-08	1415400.00	1102600.00
702	DEMO-090	2026-09	1362000.00	1069700.00
703	DEMO-091	2025-10	829700.00	653300.00
704	DEMO-091	2025-11	2486700.00	1890600.00
705	DEMO-091	2025-12	1869100.00	1283000.00
706	DEMO-091	2026-01	2665400.00	2027200.00
707	DEMO-091	2026-02	2853400.00	2237500.00
708	DEMO-091	2026-03	1800800.00	1271000.00
709	DEMO-091	2026-04	2445000.00	1891400.00
710	DEMO-091	2026-05	2017200.00	1341600.00
711	DEMO-091	2026-06	2540600.00	1852700.00
712	DEMO-091	2026-07	3063300.00	2013800.00
713	DEMO-091	2026-08	1976800.00	1334000.00
714	DEMO-091	2026-09	2760800.00	1968700.00
715	DEMO-092	2025-10	2905400.00	2053300.00
716	DEMO-092	2025-11	2821500.00	2100100.00
717	DEMO-092	2025-12	2808200.00	1823300.00
718	DEMO-092	2026-01	2749600.00	1745400.00
719	DEMO-092	2026-02	2622700.00	1760200.00
720	DEMO-092	2026-03	2614900.00	1958400.00
721	DEMO-092	2026-04	2192100.00	1415000.00
722	DEMO-092	2026-05	2018400.00	1310700.00
723	DEMO-092	2026-06	2361100.00	1569200.00
724	DEMO-092	2026-07	2366900.00	1621400.00
725	DEMO-092	2026-08	2356900.00	1776200.00
726	DEMO-092	2026-09	2569900.00	1737700.00
727	DEMO-093	2025-10	2029500.00	1662400.00
728	DEMO-093	2025-11	2381900.00	2089100.00
729	DEMO-093	2025-12	1710000.00	1340300.00
730	DEMO-093	2026-01	1843100.00	1538900.00
731	DEMO-093	2026-02	1258500.00	1166800.00
732	DEMO-093	2026-03	2610200.00	2215300.00
733	DEMO-093	2026-04	1679400.00	1552100.00
734	DEMO-093	2026-05	2004800.00	1582600.00
735	DEMO-093	2026-06	1501100.00	1218600.00
736	DEMO-093	2026-07	1411400.00	1250600.00
737	DEMO-093	2026-08	2698500.00	2105800.00
738	DEMO-093	2026-09	2397500.00	1875000.00
739	DEMO-094	2025-10	2913300.00	1744600.00
740	DEMO-094	2025-11	3092600.00	1980200.00
741	DEMO-094	2025-12	2404100.00	1396300.00
742	DEMO-094	2026-01	3036900.00	1947600.00
743	DEMO-094	2026-02	2370100.00	1351100.00
744	DEMO-094	2026-03	2453900.00	1461800.00
745	DEMO-094	2026-04	2910200.00	1724200.00
746	DEMO-094	2026-05	3658500.00	2209300.00
747	DEMO-094	2026-06	1178500.00	803900.00
748	DEMO-094	2026-07	3304000.00	2101700.00
749	DEMO-094	2026-08	2429500.00	1679400.00
750	DEMO-094	2026-09	3117700.00	1810600.00
751	DEMO-095	2025-10	2075000.00	1654000.00
752	DEMO-095	2025-11	957500.00	810000.00
753	DEMO-095	2025-12	2020500.00	1802300.00
754	DEMO-095	2026-01	2246100.00	1917200.00
755	DEMO-095	2026-02	1226500.00	1077000.00
756	DEMO-095	2026-03	2030900.00	1544100.00
757	DEMO-095	2026-04	1528500.00	1210600.00
758	DEMO-095	2026-05	2274900.00	1740800.00
759	DEMO-095	2026-06	1721200.00	1317400.00
760	DEMO-095	2026-07	1482100.00	1289800.00
761	DEMO-095	2026-08	1315000.00	1050200.00
762	DEMO-095	2026-09	1072800.00	826800.00
763	DEMO-096	2025-10	2132000.00	1631900.00
764	DEMO-096	2025-11	1932200.00	1365600.00
765	DEMO-096	2025-12	2261600.00	1466900.00
766	DEMO-096	2026-01	1809000.00	1209800.00
767	DEMO-096	2026-02	2208100.00	1629000.00
768	DEMO-096	2026-03	1619200.00	1222400.00
769	DEMO-096	2026-04	2043500.00	1573400.00
770	DEMO-096	2026-05	2142200.00	1428700.00
771	DEMO-096	2026-06	2187100.00	1542000.00
772	DEMO-096	2026-07	2291900.00	1577200.00
773	DEMO-096	2026-08	1190400.00	832200.00
774	DEMO-096	2026-09	2325000.00	1750100.00
\.


--
-- Data for Name: obligations; Type: TABLE DATA; Schema: synthetic; Owner: -
--

COPY synthetic.obligations (id, application_id, source, obligation_ref, kind, monthly_max_payment_rub) FROM stdin;
1	DEMO-001	declared	DEBT-S1-A	loan	30000.00
2	DEMO-001	bki	DEBT-S1-A	loan	30000.00
3	DEMO-002	declared	DEBT-9242-A	loan	27800.00
4	DEMO-002	bki	DEBT-9242-A	loan	29000.00
5	DEMO-004	declared	DEBT-4946-A	mortgage	29600.00
6	DEMO-004	bki	DEBT-4946-A	mortgage	29600.00
7	DEMO-008	declared	DEBT-7200-A	loan	22000.00
8	DEMO-008	bki	DEBT-7200-A	loan	22000.00
9	DEMO-009	declared	DEBT-1779-A	mortgage	212400.00
10	DEMO-009	bki	DEBT-1779-A	mortgage	212400.00
11	DEMO-010	declared	DEBT-9912-A	mortgage	26200.00
12	DEMO-010	bki	DEBT-9912-A	mortgage	26200.00
13	DEMO-010	declared	DEBT-9912-B	mortgage	55600.00
14	DEMO-010	bki	DEBT-9912-B	mortgage	56900.00
15	DEMO-012	declared	DEBT-8155-A	leasing	29500.00
16	DEMO-012	bki	DEBT-8155-A	leasing	29500.00
17	DEMO-014	declared	DEBT-2602-A	mortgage	31900.00
18	DEMO-014	bki	DEBT-2602-A	mortgage	31900.00
19	DEMO-015	declared	DEBT-7840-A	car_loan	14100.00
20	DEMO-015	bki	DEBT-7840-A	car_loan	14100.00
21	DEMO-015	declared	DEBT-7840-B	leasing	19200.00
22	DEMO-015	bki	DEBT-7840-B	leasing	20500.00
23	DEMO-016	declared	DEBT-5803-A	credit_card	36000.00
24	DEMO-016	bki	DEBT-5803-A	credit_card	36000.00
25	DEMO-016	declared	DEBT-5803-B	leasing	39100.00
26	DEMO-016	bki	DEBT-5803-B	leasing	39100.00
27	DEMO-018	declared	DEBT-1040-A	car_loan	79100.00
28	DEMO-018	bki	DEBT-1040-A	car_loan	79100.00
29	DEMO-019	declared	DEBT-2198-A	loan	119000.00
30	DEMO-019	bki	DEBT-2198-A	loan	119000.00
31	DEMO-020	declared	DEBT-9032-A	mortgage	36600.00
32	DEMO-020	bki	DEBT-9032-A	mortgage	36600.00
33	DEMO-021	declared	DEBT-3802-A	loan	91100.00
34	DEMO-021	bki	DEBT-3802-A	loan	91100.00
35	DEMO-022	declared	DEBT-1925-A	mortgage	1200.00
36	DEMO-022	bki	DEBT-1925-A	mortgage	1200.00
37	DEMO-022	declared	DEBT-1925-B	car_loan	1000.00
38	DEMO-022	bki	DEBT-1925-B	car_loan	2000.00
39	DEMO-024	declared	DEBT-0900-A	loan	13400.00
40	DEMO-024	bki	DEBT-0900-A	loan	14100.00
41	DEMO-025	declared	DEBT-S3-A	loan	60000.00
42	DEMO-025	bki	DEBT-S3-A	loan	60000.00
43	DEMO-026	declared	DEBT-7883-A	credit_card	54200.00
44	DEMO-027	declared	DEBT-2706-A	car_loan	18200.00
45	DEMO-027	bki	DEBT-2706-A	car_loan	20500.00
46	DEMO-027	declared	DEBT-2706-B	car_loan	19000.00
47	DEMO-027	bki	DEBT-2706-B	car_loan	19000.00
48	DEMO-028	declared	DEBT-5370-A	mortgage	51200.00
49	DEMO-028	bki	DEBT-5370-A	mortgage	53800.00
50	DEMO-028	declared	DEBT-5370-B	credit_card	86600.00
51	DEMO-028	bki	DEBT-5370-B	credit_card	86600.00
52	DEMO-029	declared	DEBT-3409-A	mortgage	96900.00
53	DEMO-029	bki	DEBT-3409-A	mortgage	96900.00
54	DEMO-030	declared	DEBT-3287-A	mortgage	5900.00
55	DEMO-030	bki	DEBT-3287-A	mortgage	5900.00
56	DEMO-030	declared	DEBT-3287-B	loan	3500.00
57	DEMO-030	bki	DEBT-3287-B	loan	3500.00
58	DEMO-031	declared	DEBT-9794-A	mortgage	22600.00
59	DEMO-031	bki	DEBT-9794-A	mortgage	23300.00
60	DEMO-033	declared	DEBT-1484-A	loan	22900.00
61	DEMO-033	bki	DEBT-1484-A	loan	22900.00
62	DEMO-034	declared	DEBT-2511-A	loan	26300.00
63	DEMO-034	bki	DEBT-2511-A	loan	26300.00
64	DEMO-036	declared	DEBT-9252-A	loan	43500.00
65	DEMO-036	bki	DEBT-9252-A	loan	43500.00
66	DEMO-037	declared	DEBT-0311-A	car_loan	1000.00
67	DEMO-037	bki	DEBT-0311-A	car_loan	1000.00
68	DEMO-037	declared	DEBT-0311-B	credit_card	1000.00
69	DEMO-037	bki	DEBT-0311-B	credit_card	2100.00
70	DEMO-038	declared	DEBT-7612-A	leasing	49400.00
71	DEMO-038	bki	DEBT-7612-A	leasing	49400.00
72	DEMO-039	declared	DEBT-3375-A	credit_card	1000.00
73	DEMO-039	bki	DEBT-3375-A	credit_card	1000.00
74	DEMO-040	declared	DEBT-3768-A	loan	6900.00
75	DEMO-040	bki	DEBT-3768-A	loan	6900.00
76	DEMO-040	declared	DEBT-3768-B	car_loan	6400.00
77	DEMO-040	bki	DEBT-3768-B	car_loan	6400.00
78	DEMO-042	declared	DEBT-7142-A	credit_card	7700.00
79	DEMO-042	bki	DEBT-7142-A	credit_card	7700.00
80	DEMO-042	declared	DEBT-7142-B	leasing	12000.00
81	DEMO-042	bki	DEBT-7142-B	leasing	12000.00
82	DEMO-043	declared	DEBT-9091-A	loan	1000.00
83	DEMO-043	bki	DEBT-9091-A	loan	2100.00
84	DEMO-044	declared	DEBT-8400-A	loan	15800.00
85	DEMO-044	bki	DEBT-8400-A	loan	15800.00
86	DEMO-045	declared	DEBT-4788-A	leasing	15600.00
87	DEMO-045	bki	DEBT-4788-A	leasing	15600.00
88	DEMO-046	declared	DEBT-2737-A	mortgage	12800.00
89	DEMO-046	bki	DEBT-2737-A	mortgage	12800.00
90	DEMO-046	declared	DEBT-2737-B	leasing	9500.00
91	DEMO-046	bki	DEBT-2737-B	leasing	12100.00
92	DEMO-047	declared	DEBT-2877-A	car_loan	29600.00
93	DEMO-047	bki	DEBT-2877-A	car_loan	29600.00
94	DEMO-048	declared	DEBT-7784-A	car_loan	1700.00
95	DEMO-048	bki	DEBT-7784-A	car_loan	3200.00
96	DEMO-048	declared	DEBT-7784-B	leasing	1100.00
97	DEMO-048	bki	DEBT-7784-B	leasing	1100.00
98	DEMO-049	declared	DEBT-5933-A	credit_card	31000.00
99	DEMO-050	declared	DEBT-8947-A	loan	88200.00
100	DEMO-050	bki	DEBT-8947-A	loan	88200.00
101	DEMO-051	declared	DEBT-4277-A	car_loan	5800.00
102	DEMO-052	declared	DEBT-1367-A	car_loan	3400.00
103	DEMO-052	bki	DEBT-1367-A	car_loan	3400.00
104	DEMO-054	declared	DEBT-9851-A	loan	25000.00
105	DEMO-055	declared	DEBT-0302-A	mortgage	54800.00
106	DEMO-056	declared	DEBT-8597-A	loan	31600.00
107	DEMO-056	bki	DEBT-8597-A	loan	33200.00
108	DEMO-058	declared	DEBT-2703-A	credit_card	10200.00
109	DEMO-058	bki	DEBT-2703-A	credit_card	10200.00
110	DEMO-059	declared	DEBT-2612-A	leasing	22900.00
111	DEMO-069	declared	DEBT-6312-A	loan	30200.00
112	DEMO-072	declared	DEBT-7846-A	mortgage	12800.00
113	DEMO-074	declared	DEBT-7295-A	leasing	14000.00
114	DEMO-074	bki	DEBT-7295-A	leasing	14000.00
115	DEMO-078	declared	DEBT-0302-A	car_loan	7600.00
116	DEMO-079	declared	DEBT-8702-A	car_loan	47800.00
117	DEMO-080	declared	DEBT-2130-A	leasing	113100.00
118	DEMO-081	declared	DEBT-9516-A	credit_card	32400.00
119	DEMO-081	declared	DEBT-9516-B	loan	39400.00
120	DEMO-082	declared	DEBT-8999-A	credit_card	75700.00
121	DEMO-084	declared	DEBT-7315-A	car_loan	15000.00
122	DEMO-086	declared	DEBT-0066-A	mortgage	56200.00
123	DEMO-086	declared	DEBT-0066-B	leasing	59100.00
124	DEMO-088	declared	DEBT-2241-A	leasing	41400.00
125	DEMO-088	declared	DEBT-2241-B	mortgage	63600.00
126	DEMO-089	declared	DEBT-0851-A	leasing	7000.00
127	DEMO-090	declared	DEBT-4939-A	loan	31000.00
128	DEMO-091	declared	DEBT-4652-A	loan	20600.00
129	DEMO-091	declared	DEBT-4652-B	leasing	31700.00
130	DEMO-092	declared	DEBT-4398-A	loan	143900.00
131	DEMO-094	declared	DEBT-1478-A	loan	51900.00
132	DEMO-094	bki	DEBT-1478-A	loan	51900.00
133	DEMO-094	declared	DEBT-1478-B	mortgage	65500.00
134	DEMO-094	bki	DEBT-1478-B	mortgage	65500.00
135	DEMO-094	bki	BKI-1478-Z	loan	15000.00
136	DEMO-095	declared	DEBT-4890-A	leasing	25600.00
137	DEMO-095	declared	DEBT-4890-B	mortgage	36400.00
\.


--
-- Data for Name: other_income; Type: TABLE DATA; Schema: synthetic; Owner: -
--

COPY synthetic.other_income (id, application_id, month, net_income_rub) FROM stdin;
1	DEMO-053	2026-07	245700.00
2	DEMO-053	2026-08	241900.00
3	DEMO-053	2026-09	230000.00
4	DEMO-054	2026-07	378700.00
5	DEMO-054	2026-08	360400.00
6	DEMO-054	2026-09	373300.00
7	DEMO-055	2026-07	348800.00
8	DEMO-055	2026-08	346200.00
9	DEMO-055	2026-09	345200.00
10	DEMO-056	2026-07	361300.00
11	DEMO-056	2026-08	373700.00
12	DEMO-056	2026-09	381300.00
13	DEMO-057	2026-07	420500.00
14	DEMO-057	2026-08	425300.00
15	DEMO-057	2026-09	403800.00
16	DEMO-058	2026-07	249800.00
17	DEMO-058	2026-08	243400.00
18	DEMO-058	2026-09	258300.00
19	DEMO-059	2026-07	387600.00
20	DEMO-059	2026-08	382900.00
21	DEMO-059	2026-09	394600.00
22	DEMO-060	2026-07	402600.00
23	DEMO-060	2026-08	409900.00
24	DEMO-060	2026-09	391100.00
25	DEMO-061	2026-07	362200.00
26	DEMO-061	2026-08	382100.00
27	DEMO-061	2026-09	368700.00
28	DEMO-062	2026-07	300000.00
29	DEMO-062	2026-08	300000.00
30	DEMO-062	2026-09	300000.00
31	DEMO-063	2026-07	310600.00
32	DEMO-063	2026-08	308400.00
33	DEMO-063	2026-09	299000.00
34	DEMO-064	2026-07	324700.00
35	DEMO-064	2026-08	308500.00
36	DEMO-064	2026-09	331400.00
37	DEMO-065	2026-07	157800.00
38	DEMO-065	2026-08	148600.00
39	DEMO-065	2026-09	153900.00
40	DEMO-066	2026-07	406300.00
41	DEMO-066	2026-08	409700.00
42	DEMO-066	2026-09	378800.00
43	DEMO-067	2026-07	319400.00
44	DEMO-067	2026-08	323000.00
45	DEMO-067	2026-09	318600.00
46	DEMO-068	2026-07	365400.00
47	DEMO-068	2026-08	373800.00
48	DEMO-068	2026-09	376200.00
49	DEMO-069	2026-07	431200.00
50	DEMO-069	2026-08	420200.00
51	DEMO-069	2026-09	462200.00
52	DEMO-070	2026-07	157200.00
53	DEMO-070	2026-08	157500.00
54	DEMO-070	2026-09	152600.00
55	DEMO-071	2026-07	317200.00
56	DEMO-071	2026-08	335900.00
57	DEMO-071	2026-09	317500.00
58	DEMO-073	2026-07	419300.00
59	DEMO-073	2026-08	432300.00
60	DEMO-073	2026-09	430900.00
61	DEMO-074	2026-07	197400.00
62	DEMO-074	2026-08	189100.00
63	DEMO-074	2026-09	191900.00
64	DEMO-075	2026-07	328400.00
65	DEMO-075	2026-08	333800.00
66	DEMO-075	2026-09	331100.00
67	DEMO-077	2026-07	163200.00
68	DEMO-077	2026-08	175300.00
69	DEMO-077	2026-09	171300.00
70	DEMO-078	2026-07	272500.00
71	DEMO-078	2026-08	261900.00
72	DEMO-078	2026-09	265400.00
73	DEMO-083	2026-07	448000.00
74	DEMO-083	2026-08	433600.00
75	DEMO-083	2026-09	442400.00
76	DEMO-085	2026-07	387200.00
77	DEMO-085	2026-08	372600.00
78	DEMO-085	2026-09	369400.00
79	DEMO-097	2026-07	100000.00
80	DEMO-097	2026-08	100000.00
81	DEMO-097	2026-09	100000.00
82	DEMO-098	2026-07	347600.00
83	DEMO-098	2026-08	358600.00
84	DEMO-098	2026-09	329500.00
85	DEMO-099	2026-07	308800.00
86	DEMO-099	2026-08	296000.00
87	DEMO-099	2026-09	304300.00
88	DEMO-100	2026-07	388600.00
89	DEMO-100	2026-08	392800.00
90	DEMO-100	2026-09	379500.00
\.


--
-- Data for Name: passport_profiles; Type: TABLE DATA; Schema: synthetic; Owner: -
--

COPY synthetic.passport_profiles (applicant_inn, full_name, birth_date, series, number, issue_date, issuer, department_code, document_status, verified_at, is_synthetic) FROM stdin;
990000000115	Иванов Сергей Петрович	1983-01-09	9900	000001	2026-03-25	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 001 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
992934509242	Захаров Виктор Сергеевич	1981-01-18	9900	000002	2026-03-12	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 002 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
990750786404	Соловьёв Алексей Андреевич	1982-01-19	9900	000003	2026-03-12	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 003 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
998575834946	Николаева Екатерина Петровна	1975-01-14	9900	000004	2026-03-03	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 004 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
997237475355	Кузьмина Дарья Юрьевна	1987-01-26	9900	000005	2011-03-07	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 005 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2024-10-21	t
994209132544	Воробьёва Татьяна Сергеевна	1984-01-12	9900	000006	2026-03-10	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 006 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
991802424801	Лебедев Павел Викторович	1983-01-19	9900	000007	2026-03-28	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 007 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
992136717200	Попова Светлана Андреевна	1986-01-02	9900	000008	2026-03-19	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 008 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
998924531779	Соловьёв Виктор Сергеевич	1987-01-01	9900	000009	2026-03-05	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 009 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
995940119912	Морозов Илья Олегович	1977-01-16	9900	000010	2026-03-06	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 010 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
991126723717	Семёнов Илья Владимирович	1989-01-28	9900	000011	2026-03-20	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 011 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
994973718155	Попов Андрей Юрьевич	1987-01-05	9900	000012	2026-03-10	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 012 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
998911520579	Алексеев Максим Александрович	1976-01-10	9900	000013	2026-03-08	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 013 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
993331162602	Фёдорова Светлана Игоревна	1988-01-09	9900	000014	2026-03-27	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 014 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
995402377840	Егоров Александр Владимирович	1986-01-23	9900	000015	2011-03-11	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 015 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2024-10-21	t
998456015803	Григорьева Ксения Юрьевна	1976-01-19	9900	000016	2026-03-01	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 016 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
997059195989	Степанова Елена Петровна	1983-01-09	9900	000017	2026-03-28	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 017 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
998561811040	Соколов Роман Сергеевич	1979-01-24	9900	000018	2026-03-17	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 018 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
992695022198	Макаров Дмитрий Олегович	1982-01-11	9900	000019	2026-03-17	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 019 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
991379819032	Семёнов Кирилл Петрович	1976-01-16	9900	000020	2026-03-04	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 020 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
999189653802	Попова Татьяна Николаевна	1983-01-10	9900	000021	2026-03-25	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 021 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
998523591925	Павлова Мария Николаевна	1986-01-01	9900	000022	2026-03-09	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 022 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
992138657644	Лебедева Ксения Игоревна	1979-01-09	9900	000023	2026-03-27	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 023 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
998137090900	Андреев Виктор Олегович	1982-01-07	9900	000024	2026-03-04	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 024 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
990000000362	Петров Алексей Николаевич	1976-01-27	9900	000025	2011-03-11	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 025 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2024-10-21	t
993878947883	Васильев Роман Игоревич	1979-01-21	9900	000026	2026-03-20	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 026 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
995379892706	Николаева Ирина Владимировна	1976-01-24	9900	000027	2026-03-18	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 027 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
996085865370	Соловьёв Александр Николаевич	1980-01-01	9900	000028	2026-03-27	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 028 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
990432413409	Семёнов Павел Викторович	1982-01-21	9900	000029	2026-03-22	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 029 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
994380553287	Семёнова Ксения Сергеевна	1986-01-01	9900	000030	2026-03-17	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 030 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
992244219794	Захаров Андрей Олегович	1977-01-21	9900	000031	2026-03-05	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 031 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
992776526274	Николаев Максим Андреевич	1985-01-09	9900	000032	2026-03-26	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 032 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
990950641484	Кузьмина Ксения Владимировна	1983-01-02	9900	000033	2026-03-15	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 033 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
991609452511	Васильев Александр Олегович	1987-01-16	9900	000034	2026-03-13	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 034 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
993778538703	Николаева Елена Петровна	1987-01-03	9900	000035	2011-03-19	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 035 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2024-10-21	t
999161049252	Борисова Ольга Викторовна	1980-01-21	9900	000036	2026-03-11	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 036 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
998609030311	Степанов Максим Игоревич	1979-01-07	9900	000037	2026-03-15	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 037 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
990904127612	Макаров Илья Николаевич	1983-01-14	9900	000038	2026-03-17	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 038 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
993766363375	Кузьмин Андрей Олегович	1989-01-01	9900	000039	2026-03-27	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 039 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
992222723768	Воробьёва Дарья Викторовна	1975-01-26	9900	000040	2026-03-28	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 040 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
995513219350	Борисов Павел Юрьевич	1981-01-04	9900	000041	2026-03-18	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 041 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
992536997142	Васильев Егор Владимирович	1990-01-19	9900	000042	2026-03-08	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 042 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
992157389091	Зайцев Егор Сергеевич	1984-01-01	9900	000043	2026-03-08	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 043 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
995464468400	Зайцева Екатерина Николаевна	1980-01-21	9900	000044	2026-03-26	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 044 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
996473214788	Михайлова Юлия Игоревна	1985-01-15	9900	000045	2011-03-28	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 045 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2024-10-21	t
992370382737	Алексеева Татьяна Николаевна	1980-01-12	9900	000046	2026-03-15	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 046 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
993149112877	Лебедева Наталья Викторовна	1977-01-18	9900	000047	2026-03-21	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 047 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
993848857784	Соколова Анастасия Олеговна	1982-01-12	9900	000048	2026-03-06	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 048 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
995266995933	Макарова Елена Андреевна	1986-01-15	9900	000049	2026-03-24	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 049 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
991200978947	Макарова Ирина Юрьевна	1984-01-24	9900	000050	2026-03-22	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 050 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
993800094277	Николаев Илья Владимирович	1976-01-21	9900	000051	2026-03-26	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 051 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
992421241367	Романова Юлия Владимировна	1976-01-14	9900	000052	2026-03-16	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 052 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
998620195652	Макаров Илья Александрович	1976-01-04	9900	000053	2026-03-21	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 053 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
995980959851	Козлов Михаил Владимирович	1976-01-09	9900	000054	2026-03-14	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 054 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
991510350302	Зайцева Вера Сергеевна	1985-01-25	9900	000055	2011-03-19	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 055 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2024-10-21	t
992805278597	Павлова Светлана Александровна	1976-01-26	9900	000056	2026-03-10	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 056 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
991336858301	Смирнов Артём Андреевич	1982-01-28	9900	000057	2026-03-19	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 057 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
992036192703	Никитин Павел Владимирович	1978-01-15	9900	000058	2026-03-09	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 058 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
994262722612	Андреева Юлия Николаевна	1978-01-10	9900	000059	2026-03-12	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 059 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
996742086400	Новикова Мария Игоревна	1976-01-24	9900	000060	2026-03-12	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 060 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
995105295641	Николаев Илья Викторович	1978-01-03	9900	000061	2026-03-11	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 061 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
990000000299	Сидорова Анна Викторовна	1980-01-06	9900	000062	2026-03-09	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 062 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
999343085833	Васильев Дмитрий Сергеевич	1986-01-08	9900	000063	2026-03-27	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 063 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
994498886107	Соловьёва Ольга Александровна	1977-01-26	9900	000064	2026-03-06	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 064 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
998054434184	Воробьёва Мария Александровна	1977-01-07	9900	000065	2011-03-24	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 065 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2024-10-21	t
995086037890	Макаров Михаил Сергеевич	1983-01-04	9900	000066	2026-03-06	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 066 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
998244860543	Андреева Елена Юрьевна	1977-01-13	9900	000067	2026-03-27	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 067 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
994347632171	Романов Олег Викторович	1986-01-27	9900	000068	2026-03-26	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 068 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
990888696312	Романова Екатерина Андреевна	1975-01-25	9900	000069	2026-03-02	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 069 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
996791345833	Захаров Олег Викторович	1976-01-13	9900	000070	2026-03-15	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 070 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
990301724986	Васильев Андрей Викторович	1980-01-17	9900	000071	2026-03-21	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 071 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
995954537846	Воробьёв Павел Олегович	1981-01-24	9900	000072	2026-03-25	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 072 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
993463525531	Орлова Дарья Викторовна	1981-01-17	9900	000073	2026-03-17	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 073 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
997354447295	Андреева Наталья Андреевна	1976-01-12	9900	000074	2026-03-18	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 074 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
996634317106	Никитина Татьяна Николаевна	1982-01-01	9900	000075	2011-03-09	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 075 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2024-10-21	t
990837660300	Егорова Ирина Владимировна	1988-01-17	9900	000076	2026-03-28	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 076 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
990155729503	Николаев Олег Олегович	1984-01-28	9900	000077	2026-03-18	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 077 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
997735670302	Макарова Полина Сергеевна	1984-01-23	9900	000078	2026-03-21	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 078 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
994736738702	Соловьёв Илья Юрьевич	1976-01-21	9900	000079	2026-03-01	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 079 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
995351862130	Лебедев Андрей Николаевич	1978-01-26	9900	000080	2026-03-12	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 080 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
998809979516	Козлова Дарья Александровна	1984-01-22	9900	000081	2026-03-14	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 081 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
999767928999	Макаров Алексей Олегович	1982-01-03	9900	000082	2026-03-15	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 082 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
996152142806	Кузьмина Ольга Сергеевна	1987-01-16	9900	000083	2026-03-15	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 083 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
999904307315	Попов Роман Николаевич	1985-01-27	9900	000084	2026-03-20	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 084 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
996230601785	Волков Андрей Юрьевич	1976-01-25	9900	000085	2011-03-07	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 085 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2024-10-21	t
990951060066	Орлов Михаил Владимирович	1986-01-07	9900	000086	2026-03-10	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 086 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
999798132406	Семёнов Максим Андреевич	1990-01-26	9900	000087	2026-03-11	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 087 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
990439082241	Андреева Татьяна Сергеевна	1980-01-11	9900	000088	2026-03-17	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 088 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
992019950851	Михайлова Вера Игоревна	1986-01-19	9900	000089	2026-03-17	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 089 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
998932904939	Андреева Светлана Владимировна	1989-01-09	9900	000090	2026-03-01	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 090 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
996582914652	Яковлев Олег Николаевич	1978-01-15	9900	000091	2026-03-05	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 091 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
992407494398	Волков Алексей Андреевич	1978-01-12	9900	000092	2026-03-19	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 092 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
991374629221	Смирнова Ксения Олеговна	1983-01-11	9900	000093	2026-03-15	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 093 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
994048621478	Павлова Мария Викторовна	1989-01-23	9900	000094	2026-03-09	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 094 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
995958674890	Козлова Екатерина Игоревна	1976-01-02	9900	000095	2011-03-05	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 095 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2024-10-21	t
991026997200	Андреев Роман Андреевич	1990-01-18	9900	000096	2026-03-13	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 096 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
990000000436	Кузнецова Мария Олеговна	1979-01-24	9900	000097	2026-03-17	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 097 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
993149044345	Захарова Наталья Петровна	1988-01-10	9900	000098	2026-03-12	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 098 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
996667015950	Орлова Елена Владимировна	1987-01-23	9900	000099	2026-03-10	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 099 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
996773157146	Новиков Роман Олегович	1988-01-07	9900	000100	2026-03-11	СИНТЕТИЧЕСКИЙ ОРГАН ВЫДАЧИ ДЕМО 100 — НЕ ДЕЙСТВИТЕЛЬНО	000-000	ON_FILE	2026-10-21	t
500100000011	Иванов Иван Иванович	1985-05-14	4510	123456	2015-06-20	ОУФМС РОССИИ ПО МОСКОВСКОЙ ОБЛ.	500-001	ON_FILE	2026-10-25	t
500100000022	Сидорова Анна Сергеевна	1990-08-22	4512	234567	2017-09-10	ГУ МВД РОССИИ ПО Г. МОСКВЕ	770-002	ON_FILE	2026-10-25	t
500100000033	Кузнецов Алексей Петрович	1982-11-03	4514	345678	2018-12-05	ОТДЕЛОМ УФМС ПО Г. САНКТ-ПЕТЕРБУРГУ	780-003	ON_FILE	2026-10-25	t
500100000077	Петров Михаил Дмитриевич	1988-03-30	4516	456789	2019-04-18	ГУ МВД РОССИИ ПО Г. МОСКВЕ	770-004	ON_FILE	2026-10-25	t
\.


--
-- Data for Name: property_registry; Type: TABLE DATA; Schema: synthetic; Owner: -
--

COPY synthetic.property_registry (property_id, cadastral_number, property_type, address, area_sqm, ownership_type, encumbrance_status, encumbrance_note, rights_coverage, source_record_status, source_as_of, source_type, is_synthetic) FROM stdin;
PROP-001	99:99:9900001:1001	APARTMENT	Синтетический город, Тестовая улица, дом 1, помещение 1	47.50	SOLE	NONE_RECORDED	В синтетическом ответе ограничения не указаны	COMPLETE_DEMO	CURRENT_DEMO	2026-10-23	SYNTHETIC_AUTHORIZED_REGISTRY_RESPONSE	t
PROP-002	99:99:9900001:1002	NON_RESIDENTIAL	Синтетический город, Тестовая улица, дом 2, помещение 2	55.00	SOLE	NONE_RECORDED	В синтетическом ответе ограничения не указаны	COMPLETE_DEMO	CURRENT_DEMO	2026-10-23	SYNTHETIC_AUTHORIZED_REGISTRY_RESPONSE	t
PROP-003	99:99:9900001:1003	NON_RESIDENTIAL	Синтетический город, Тестовая улица, дом 3, помещение 3	62.50	SHARED	NONE_RECORDED	В синтетическом ответе ограничения не указаны	COMPLETE_DEMO	CURRENT_DEMO	2026-10-23	SYNTHETIC_AUTHORIZED_REGISTRY_RESPONSE	t
PROP-004	99:99:9900001:1004	APARTMENT	Синтетический город, Тестовая улица, дом 4, помещение 4	70.00	SOLE	MORTGAGE	Тестовая ипотека в пользу DEMO-BANK	COMPLETE_DEMO	CURRENT_DEMO	2026-10-23	SYNTHETIC_AUTHORIZED_REGISTRY_RESPONSE	t
PROP-005	99:99:9900001:1005	NON_RESIDENTIAL	Синтетический город, Тестовая улица, дом 5, помещение 5	77.50	SOLE	NONE_RECORDED	В синтетическом ответе ограничения не указаны	COMPLETE_DEMO	STALE_DEMO	2024-10-01	SYNTHETIC_AUTHORIZED_REGISTRY_RESPONSE	t
PROP-006	99:99:9900001:1006	APARTMENT	Синтетический город, Тестовая улица, дом 6, помещение 6	85.00	JOINT	NONE_RECORDED	В синтетическом ответе ограничения не указаны	COMPLETE_DEMO	CURRENT_DEMO	2026-10-23	SYNTHETIC_AUTHORIZED_REGISTRY_RESPONSE	t
PROP-007	99:99:9900001:1007	NON_RESIDENTIAL	Синтетический город, Тестовая улица, дом 7, помещение 7	92.50	UNKNOWN	UNKNOWN	Сведения об обременениях не получены	UNAVAILABLE	PARTIAL_DEMO	2026-10-23	SYNTHETIC_AUTHORIZED_REGISTRY_RESPONSE	t
PROP-008	99:99:9900001:1008	APARTMENT	Синтетический город, Тестовая улица, дом 8, помещение 8	100.00	SOLE	ARREST	Тестовая запись об аресте	COMPLETE_DEMO	CURRENT_DEMO	2026-10-23	SYNTHETIC_AUTHORIZED_REGISTRY_RESPONSE	t
PROP-009	99:99:9900001:1009	NON_RESIDENTIAL	Синтетический город, Тестовая улица, дом 9, помещение 9	107.50	SOLE	NONE_RECORDED	В синтетическом ответе ограничения не указаны	COMPLETE_DEMO	CURRENT_DEMO	2026-10-23	SYNTHETIC_AUTHORIZED_REGISTRY_RESPONSE	t
\.


--
-- Data for Name: property_rights; Type: TABLE DATA; Schema: synthetic; Owner: -
--

COPY synthetic.property_rights (right_id, cadastral_number, owner_id, owner_inn, owner_full_name, owner_bank_application_id, ownership_type, share_numerator, share_denominator, right_status, registration_date, termination_date, identity_match_method, source_as_of, source_type, is_synthetic) FROM stdin;
RIGHT-001	99:99:9900001:1001	CLIENT-DEMO-085	996230601785	Волков Андрей Юрьевич	DEMO-085	SOLE	1	1	ACTIVE	2024-01-15	\N	EXACT_SYNTHETIC_INN	2026-10-23	SYNTHETIC_AUTHORIZED_REGISTRY_RESPONSE	t
RIGHT-002	99:99:9900001:1002	EXT-DEMO-001	\N	Тестовый Собственник Один	\N	SOLE	1	1	ACTIVE	2024-01-15	\N	EXTERNAL_DEMO_PERSON_ID	2026-10-23	SYNTHETIC_AUTHORIZED_REGISTRY_RESPONSE	t
RIGHT-003	99:99:9900001:1003	CLIENT-DEMO-085	996230601785	Волков Андрей Юрьевич	DEMO-085	SHARED	1	2	ACTIVE	2024-01-15	\N	EXACT_SYNTHETIC_INN	2026-10-23	SYNTHETIC_AUTHORIZED_REGISTRY_RESPONSE	t
RIGHT-004	99:99:9900001:1003	CLIENT-DEMO-097	990000000436	Кузнецова Мария Олеговна	DEMO-097	SHARED	1	2	ACTIVE	2024-01-15	\N	EXACT_SYNTHETIC_INN	2026-10-23	SYNTHETIC_AUTHORIZED_REGISTRY_RESPONSE	t
RIGHT-005	99:99:9900001:1004	CLIENT-DEMO-085	996230601785	Волков Андрей Юрьевич	DEMO-085	SOLE	1	1	ACTIVE	2024-01-15	\N	EXACT_SYNTHETIC_INN	2026-10-23	SYNTHETIC_AUTHORIZED_REGISTRY_RESPONSE	t
RIGHT-006	99:99:9900001:1005	CLIENT-DEMO-085	996230601785	Волков Андрей Юрьевич	DEMO-085	SOLE	1	1	ACTIVE	2024-01-15	\N	EXACT_SYNTHETIC_INN	2024-10-01	SYNTHETIC_AUTHORIZED_REGISTRY_RESPONSE	t
RIGHT-007	99:99:9900001:1006	CLIENT-DEMO-085	996230601785	Волков Андрей Юрьевич	DEMO-085	JOINT	\N	\N	ACTIVE	2024-01-15	\N	EXACT_SYNTHETIC_INN	2026-10-23	SYNTHETIC_AUTHORIZED_REGISTRY_RESPONSE	t
RIGHT-008	99:99:9900001:1006	EXT-DEMO-001	\N	Тестовый Собственник Один	\N	JOINT	\N	\N	ACTIVE	2024-01-15	\N	EXTERNAL_DEMO_PERSON_ID	2026-10-23	SYNTHETIC_AUTHORIZED_REGISTRY_RESPONSE	t
RIGHT-009	99:99:9900001:1008	CLIENT-DEMO-085	996230601785	Волков Андрей Юрьевич	DEMO-085	SOLE	1	1	ACTIVE	2024-01-15	\N	EXACT_SYNTHETIC_INN	2026-10-23	SYNTHETIC_AUTHORIZED_REGISTRY_RESPONSE	t
RIGHT-010	99:99:9900001:1009	CLIENT-DEMO-085	996230601785	Волков Андрей Юрьевич	DEMO-085	SOLE	1	1	TERMINATED	2024-01-15	2025-01-31	EXACT_SYNTHETIC_INN	2026-10-23	SYNTHETIC_AUTHORIZED_REGISTRY_RESPONSE	t
RIGHT-011	99:99:9900001:1009	EXT-DEMO-001	\N	Тестовый Собственник Один	\N	SOLE	1	1	ACTIVE	2024-01-15	\N	EXTERNAL_DEMO_PERSON_ID	2026-10-23	SYNTHETIC_AUTHORIZED_REGISTRY_RESPONSE	t
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: synthetic; Owner: -
--

COPY synthetic.suppliers (inn, ogrn, name, registration_date, status, address, mass_address, phone, email, director_inn) FROM stdin;
9990927815	1147750944870	ООО «Техно-Сервис 815»	2014-09-15	ACTIVE	г. Москва, ул. Промышленная, д. 29	f	+7 495 396-13-38	sales7815@example.org	\N
9901477331	1097768949419	ООО «Техно-Сервис 331»	2009-10-15	ACTIVE	г. Москва, ул. Промышленная, д. 89	f	+7 495 410-98-91	sales7331@example.org	\N
9967955733	1147709872174	ООО «Индустрия-Маркет 733»	2014-10-15	ACTIVE	г. Москва, ул. Промышленная, д. 44	f	+7 495 961-46-89	sales5733@example.org	\N
9985733934	1107736238993	ООО «Техно-Снаб 934»	2010-02-15	ACTIVE	г. Москва, ул. Промышленная, д. 41	f	+7 495 210-90-47	sales3934@example.org	\N
9964739727	1087763901929	ООО «Техно-Комплект 727»	2008-06-15	ACTIVE	г. Москва, ул. Промышленная, д. 25	f	+7 495 293-26-43	sales9727@example.org	\N
9908255183	1197795276032	ООО «Техно-Комплект 183»	2019-04-15	ACTIVE	г. Москва, ул. Промышленная, д. 5	f	+7 495 856-98-93	sales5183@example.org	\N
9961994172	1207779184917	ООО «Оборудование-Комплект 172»	2020-06-15	ACTIVE	г. Москва, ул. Промышленная, д. 70	f	+7 495 254-39-71	sales4172@example.org	\N
9958033620	1157721108322	ООО «Техно-Маркет 620»	2015-12-15	ACTIVE	г. Москва, ул. Промышленная, д. 2	f	+7 495 328-11-84	sales3620@example.org	\N
9993280999	1207775628782	ООО «Индустрия-Маркет 999»	2020-10-15	ACTIVE	г. Москва, ул. Промышленная, д. 26	f	+7 495 514-24-56	sales0999@example.org	\N
9937546571	1137706439988	ООО «Техно-Комплект 571»	2013-02-15	ACTIVE	г. Москва, ул. Промышленная, д. 87	f	+7 495 738-70-25	sales6571@example.org	\N
9900905432	1107736513811	ООО «Индустрия-Снаб 432»	2010-03-15	ACTIVE	г. Москва, ул. Промышленная, д. 10	f	+7 495 106-65-45	sales5432@example.org	\N
9987862371	1107737496927	ООО «Пром-Снаб 371»	2010-12-15	ACTIVE	г. Москва, ул. Промышленная, д. 62	f	+7 495 368-18-75	sales2371@example.org	\N
9955348621	1207738136442	ООО «Оборудование-Снаб 621»	2020-10-15	ACTIVE	г. Москва, ул. Промышленная, д. 63	f	+7 495 407-61-61	sales8621@example.org	\N
9975461167	1127733842664	ООО «Техно-Маркет 167»	2012-09-15	ACTIVE	г. Москва, ул. Промышленная, д. 17	f	+7 495 235-94-26	sales1167@example.org	\N
9966429047	1097711304785	ООО «Индустрия-Комплект 047»	2009-08-15	ACTIVE	г. Москва, ул. Промышленная, д. 36	f	+7 495 689-27-45	sales9047@example.org	\N
9984416185	1197704652559	ООО «Индустрия-Сервис 185»	2019-09-15	ACTIVE	г. Москва, ул. Промышленная, д. 90	f	+7 495 339-81-72	sales6185@example.org	\N
9945587388	1097760751033	ООО «Оборудование-Сервис 388»	2009-09-15	ACTIVE	г. Москва, ул. Промышленная, д. 33	f	+7 495 234-39-86	sales7388@example.org	\N
9918934554	1137766643680	ООО «Индустрия-Маркет 554»	2013-09-15	ACTIVE	г. Москва, ул. Промышленная, д. 19	f	+7 495 104-20-61	sales4554@example.org	\N
9967526580	1187729489808	ООО «Оборудование-Комплект 580»	2018-11-15	ACTIVE	г. Москва, ул. Промышленная, д. 29	f	+7 495 260-98-28	sales6580@example.org	\N
9955995065	1197771899234	ООО «Индустрия-Снаб 065»	2019-01-15	ACTIVE	г. Москва, ул. Промышленная, д. 90	f	+7 495 316-87-26	sales5065@example.org	\N
9991205481	1107716190353	ООО «Техно-Снаб 481»	2010-04-15	ACTIVE	г. Москва, ул. Промышленная, д. 13	f	+7 495 500-78-74	sales5481@example.org	\N
9951695448	1087737704771	ООО «Оборудование-Сервис 448»	2008-11-15	ACTIVE	г. Москва, ул. Промышленная, д. 81	f	+7 495 265-96-89	sales5448@example.org	\N
9953994228	1197702188712	ООО «Индустрия-Маркет 228»	2019-02-15	ACTIVE	г. Москва, ул. Промышленная, д. 5	f	+7 495 914-36-24	sales4228@example.org	\N
9927819170	1117775482987	ООО «Техно-Сервис 170»	2011-01-15	ACTIVE	г. Москва, ул. Промышленная, д. 15	f	+7 495 978-30-64	sales9170@example.org	\N
9963393667	1197778560395	ООО «Индустрия-Сервис 667»	2019-05-15	ACTIVE	г. Москва, ул. Промышленная, д. 36	f	+7 495 252-48-43	sales3667@example.org	\N
9956830041	1267764995729	ООО «Техно-Снаб 041»	2026-08-03	ACTIVE	г. Москва, ул. Промышленная, д. 2	f	+7 495 217-46-25	sales0041@example.org	\N
9952183555	1157718120891	ООО «Техно-Снаб 555»	2015-04-17	ACTIVE	г. Москва, ул. Промышленная, д. 35	t	+7 495 914-29-37	sales3555@example.org	\N
9971871518	1157719167026	ООО «Техно-Комплект 518»	2015-04-17	ACTIVE	г. Москва, ул. Промышленная, д. 90	f	+7 495 158-14-32	sales1518@example.org	996550203790
9953798978	1157797333729	ООО «Индустрия-Маркет 978»	2015-04-17	ACTIVE	г. Москва, ул. Промышленная, д. 41	f	+7 495 196-62-21	sales8978@example.org	\N
9903562335	1157751912259	ООО «Индустрия-Маркет 335»	2015-04-17	ACTIVE	г. Москва, ул. Промышленная, д. 90	f	+7 495 997-77-94	sales2335@example.org	\N
\.


--
-- Data for Name: zsk_risk; Type: TABLE DATA; Schema: synthetic; Owner: -
--

COPY synthetic.zsk_risk (inn, risk_level, as_of) FROM stdin;
992934509242	LOW	2026-10-20
990750786404	LOW	2026-10-20
998575834946	LOW	2026-10-20
997237475355	LOW	2026-10-20
994209132544	LOW	2026-10-20
991802424801	LOW	2026-10-20
992136717200	LOW	2026-10-20
998924531779	LOW	2026-10-20
995940119912	LOW	2026-10-20
991126723717	LOW	2026-10-20
994973718155	LOW	2026-10-20
998911520579	LOW	2026-10-20
993331162602	LOW	2026-10-20
995402377840	LOW	2026-10-20
998456015803	LOW	2026-10-20
997059195989	LOW	2026-10-20
998561811040	LOW	2026-10-20
992695022198	LOW	2026-10-20
991379819032	LOW	2026-10-20
999189653802	LOW	2026-10-20
998523591925	LOW	2026-10-20
992138657644	LOW	2026-10-20
998137090900	LOW	2026-10-20
990000000362	LOW	2026-10-20
993878947883	LOW	2026-10-20
995379892706	LOW	2026-10-20
996085865370	LOW	2026-10-20
990432413409	LOW	2026-10-20
994380553287	LOW	2026-10-20
992244219794	LOW	2026-10-20
992776526274	LOW	2026-10-20
990950641484	LOW	2026-10-20
991609452511	LOW	2026-10-20
993778538703	LOW	2026-10-20
999161049252	LOW	2026-10-20
998609030311	LOW	2026-10-20
990904127612	LOW	2026-10-20
993766363375	LOW	2026-10-20
992222723768	LOW	2026-10-20
995513219350	LOW	2026-10-20
992536997142	LOW	2026-10-20
992157389091	LOW	2026-10-20
995464468400	LOW	2026-10-20
996473214788	LOW	2026-10-20
992370382737	LOW	2026-10-20
993149112877	LOW	2026-10-20
993848857784	LOW	2026-10-20
995266995933	LOW	2026-10-20
991200978947	LOW	2026-10-20
993800094277	LOW	2026-10-20
992421241367	LOW	2026-10-20
998620195652	LOW	2026-10-20
995980959851	LOW	2026-10-20
991510350302	LOW	2026-10-20
992805278597	LOW	2026-10-20
991336858301	LOW	2026-10-20
992036192703	LOW	2026-10-20
994262722612	LOW	2026-10-20
996742086400	LOW	2026-10-20
995105295641	LOW	2026-10-20
990000000299	LOW	2026-10-20
999343085833	LOW	2026-10-20
994498886107	LOW	2026-10-20
998054434184	LOW	2026-10-20
995086037890	LOW	2026-10-20
998244860543	LOW	2026-10-20
994347632171	LOW	2026-10-20
990888696312	LOW	2026-10-20
996791345833	LOW	2026-10-20
990301724986	LOW	2026-10-20
995954537846	LOW	2026-10-20
993463525531	LOW	2026-10-20
997354447295	LOW	2026-10-20
996634317106	LOW	2026-10-20
990837660300	LOW	2026-10-20
990155729503	LOW	2026-10-20
997735670302	LOW	2026-10-20
994736738702	LOW	2026-10-20
995351862130	LOW	2026-10-20
998809979516	LOW	2026-10-20
999767928999	LOW	2026-10-20
996152142806	LOW	2026-10-20
999904307315	LOW	2026-10-20
996230601785	LOW	2026-10-20
990439082241	LOW	2026-10-20
992019950851	LOW	2026-10-20
998932904939	LOW	2026-10-20
996582914652	LOW	2026-10-20
992407494398	LOW	2026-10-20
991374629221	LOW	2026-10-20
994048621478	LOW	2026-10-20
995958674890	LOW	2026-10-20
991026997200	LOW	2026-10-20
990000000436	LOW	2026-10-20
993149044345	LOW	2026-10-20
996667015950	LOW	2026-10-20
996773157146	LOW	2026-10-20
995843689392	LOW	2026-10-20
993441968459	LOW	2026-10-20
996229846036	LOW	2026-10-20
993468143744	HIGH	2026-10-20
990742590013	MEDIUM	2026-10-20
995327035122	LOW	2026-10-20
993649050001	LOW	2026-10-20
995606156286	LOW	2026-10-20
996550203790	LOW	2026-10-20
993458262326	LOW	2026-10-20
991098965976	LOW	2026-10-20
994069375671	LOW	2026-10-20
500100000011	LOW	2026-10-21
500100000022	LOW	2026-10-21
500100000033	LOW	2026-10-21
500100000077	LOW	2026-10-21
990000000115	LOW	2026-10-20
\.


--
-- Name: efrsb_bankruptcies_id_seq; Type: SEQUENCE SET; Schema: synthetic; Owner: -
--

SELECT pg_catalog.setval('synthetic.efrsb_bankruptcies_id_seq', 2, true);


--
-- Name: fns_account_blocks_id_seq; Type: SEQUENCE SET; Schema: synthetic; Owner: -
--

SELECT pg_catalog.setval('synthetic.fns_account_blocks_id_seq', 1, true);


--
-- Name: monthly_facts_id_seq; Type: SEQUENCE SET; Schema: synthetic; Owner: -
--

SELECT pg_catalog.setval('synthetic.monthly_facts_id_seq', 774, true);


--
-- Name: obligations_id_seq; Type: SEQUENCE SET; Schema: synthetic; Owner: -
--

SELECT pg_catalog.setval('synthetic.obligations_id_seq', 137, true);


--
-- Name: other_income_id_seq; Type: SEQUENCE SET; Schema: synthetic; Owner: -
--

SELECT pg_catalog.setval('synthetic.other_income_id_seq', 90, true);


--
-- Name: synthetic_alfa_accounts PK_synthetic_alfa_accounts; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.synthetic_alfa_accounts
    ADD CONSTRAINT "PK_synthetic_alfa_accounts" PRIMARY KEY ("Id");


--
-- Name: synthetic_alfa_customers PK_synthetic_alfa_customers; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.synthetic_alfa_customers
    ADD CONSTRAINT "PK_synthetic_alfa_customers" PRIMARY KEY ("Id");


--
-- Name: synthetic_alfa_transactions PK_synthetic_alfa_transactions; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.synthetic_alfa_transactions
    ADD CONSTRAINT "PK_synthetic_alfa_transactions" PRIMARY KEY ("Id");


--
-- Name: customer_profiles customer_profiles_pkey; Type: CONSTRAINT; Schema: synthetic; Owner: -
--

ALTER TABLE ONLY synthetic.customer_profiles
    ADD CONSTRAINT customer_profiles_pkey PRIMARY KEY (application_id);


--
-- Name: efrsb_bankruptcies efrsb_bankruptcies_pkey; Type: CONSTRAINT; Schema: synthetic; Owner: -
--

ALTER TABLE ONLY synthetic.efrsb_bankruptcies
    ADD CONSTRAINT efrsb_bankruptcies_pkey PRIMARY KEY (id);


--
-- Name: egrip egrip_pkey; Type: CONSTRAINT; Schema: synthetic; Owner: -
--

ALTER TABLE ONLY synthetic.egrip
    ADD CONSTRAINT egrip_pkey PRIMARY KEY (inn);


--
-- Name: equipment_catalog equipment_catalog_pkey; Type: CONSTRAINT; Schema: synthetic; Owner: -
--

ALTER TABLE ONLY synthetic.equipment_catalog
    ADD CONSTRAINT equipment_catalog_pkey PRIMARY KEY (category);


--
-- Name: fns_account_blocks fns_account_blocks_pkey; Type: CONSTRAINT; Schema: synthetic; Owner: -
--

ALTER TABLE ONLY synthetic.fns_account_blocks
    ADD CONSTRAINT fns_account_blocks_pkey PRIMARY KEY (id);


--
-- Name: monthly_facts monthly_facts_pkey; Type: CONSTRAINT; Schema: synthetic; Owner: -
--

ALTER TABLE ONLY synthetic.monthly_facts
    ADD CONSTRAINT monthly_facts_pkey PRIMARY KEY (id);


--
-- Name: obligations obligations_pkey; Type: CONSTRAINT; Schema: synthetic; Owner: -
--

ALTER TABLE ONLY synthetic.obligations
    ADD CONSTRAINT obligations_pkey PRIMARY KEY (id);


--
-- Name: other_income other_income_pkey; Type: CONSTRAINT; Schema: synthetic; Owner: -
--

ALTER TABLE ONLY synthetic.other_income
    ADD CONSTRAINT other_income_pkey PRIMARY KEY (id);


--
-- Name: passport_profiles passport_profiles_pkey; Type: CONSTRAINT; Schema: synthetic; Owner: -
--

ALTER TABLE ONLY synthetic.passport_profiles
    ADD CONSTRAINT passport_profiles_pkey PRIMARY KEY (applicant_inn);


--
-- Name: property_registry property_registry_pkey; Type: CONSTRAINT; Schema: synthetic; Owner: -
--

ALTER TABLE ONLY synthetic.property_registry
    ADD CONSTRAINT property_registry_pkey PRIMARY KEY (property_id);


--
-- Name: property_rights property_rights_pkey; Type: CONSTRAINT; Schema: synthetic; Owner: -
--

ALTER TABLE ONLY synthetic.property_rights
    ADD CONSTRAINT property_rights_pkey PRIMARY KEY (right_id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: synthetic; Owner: -
--

ALTER TABLE ONLY synthetic.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (inn);


--
-- Name: zsk_risk zsk_risk_pkey; Type: CONSTRAINT; Schema: synthetic; Owner: -
--

ALTER TABLE ONLY synthetic.zsk_risk
    ADD CONSTRAINT zsk_risk_pkey PRIMARY KEY (inn);


--
-- Name: IX_synthetic_alfa_accounts_AccountNumber; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_synthetic_alfa_accounts_AccountNumber" ON public.synthetic_alfa_accounts USING btree ("AccountNumber");


--
-- Name: IX_synthetic_alfa_accounts_CustomerId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_synthetic_alfa_accounts_CustomerId" ON public.synthetic_alfa_accounts USING btree ("CustomerId");


--
-- Name: IX_synthetic_alfa_customers_Inn; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IX_synthetic_alfa_customers_Inn" ON public.synthetic_alfa_customers USING btree ("Inn");


--
-- Name: IX_synthetic_alfa_transactions_CustomerId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_synthetic_alfa_transactions_CustomerId" ON public.synthetic_alfa_transactions USING btree ("CustomerId");


--
-- Name: IX_synthetic_alfa_transactions_Date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_synthetic_alfa_transactions_Date" ON public.synthetic_alfa_transactions USING btree ("Date");


--
-- Name: ix_customer_profiles_inn; Type: INDEX; Schema: synthetic; Owner: -
--

CREATE INDEX ix_customer_profiles_inn ON synthetic.customer_profiles USING btree (inn);


--
-- Name: ix_monthly_facts_application_id; Type: INDEX; Schema: synthetic; Owner: -
--

CREATE INDEX ix_monthly_facts_application_id ON synthetic.monthly_facts USING btree (application_id);


--
-- Name: ix_obligations_application_id; Type: INDEX; Schema: synthetic; Owner: -
--

CREATE INDEX ix_obligations_application_id ON synthetic.obligations USING btree (application_id);


--
-- Name: ix_other_income_application_id; Type: INDEX; Schema: synthetic; Owner: -
--

CREATE INDEX ix_other_income_application_id ON synthetic.other_income USING btree (application_id);


--
-- Name: ix_property_registry_cadastral; Type: INDEX; Schema: synthetic; Owner: -
--

CREATE INDEX ix_property_registry_cadastral ON synthetic.property_registry USING btree (cadastral_number);


--
-- Name: ix_property_rights_cadastral; Type: INDEX; Schema: synthetic; Owner: -
--

CREATE INDEX ix_property_rights_cadastral ON synthetic.property_rights USING btree (cadastral_number);


--
-- Name: ix_property_rights_owner_inn; Type: INDEX; Schema: synthetic; Owner: -
--

CREATE INDEX ix_property_rights_owner_inn ON synthetic.property_rights USING btree (owner_inn);


--
-- Name: synthetic_alfa_accounts FK_synthetic_alfa_accounts_synthetic_alfa_customers_CustomerId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.synthetic_alfa_accounts
    ADD CONSTRAINT "FK_synthetic_alfa_accounts_synthetic_alfa_customers_CustomerId" FOREIGN KEY ("CustomerId") REFERENCES public.synthetic_alfa_customers("Id") ON DELETE CASCADE;


--
-- Name: synthetic_alfa_transactions FK_synthetic_alfa_transactions_synthetic_alfa_customers_Custom~; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.synthetic_alfa_transactions
    ADD CONSTRAINT "FK_synthetic_alfa_transactions_synthetic_alfa_customers_Custom~" FOREIGN KEY ("CustomerId") REFERENCES public.synthetic_alfa_customers("Id") ON DELETE CASCADE;


--
-- Name: monthly_facts monthly_facts_application_id_fkey; Type: FK CONSTRAINT; Schema: synthetic; Owner: -
--

ALTER TABLE ONLY synthetic.monthly_facts
    ADD CONSTRAINT monthly_facts_application_id_fkey FOREIGN KEY (application_id) REFERENCES synthetic.customer_profiles(application_id) ON DELETE CASCADE;


--
-- Name: obligations obligations_application_id_fkey; Type: FK CONSTRAINT; Schema: synthetic; Owner: -
--

ALTER TABLE ONLY synthetic.obligations
    ADD CONSTRAINT obligations_application_id_fkey FOREIGN KEY (application_id) REFERENCES synthetic.customer_profiles(application_id) ON DELETE CASCADE;


--
-- Name: other_income other_income_application_id_fkey; Type: FK CONSTRAINT; Schema: synthetic; Owner: -
--

ALTER TABLE ONLY synthetic.other_income
    ADD CONSTRAINT other_income_application_id_fkey FOREIGN KEY (application_id) REFERENCES synthetic.customer_profiles(application_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


