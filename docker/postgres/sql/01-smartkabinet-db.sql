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
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: bank_employee; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA bank_employee;


--
-- Name: client; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA client;


--
-- Name: credit_app; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA credit_app;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: RefreshTokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth."RefreshTokens" (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "Token" character varying(256) NOT NULL,
    "ExpiresAt" timestamp with time zone NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "RevokedAt" timestamp with time zone,
    "ReplacedByToken" text
);


--
-- Name: Users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth."Users" (
    "UserId" uuid NOT NULL,
    "Username" character varying(100) NOT NULL,
    "PasswordHash" text NOT NULL,
    "FirstName" text NOT NULL,
    "LastName" text NOT NULL,
    "MiddleName" text,
    "Inn" character varying(12),
    "Role" integer NOT NULL,
    "IsActive" boolean NOT NULL,
    "LastLoginAt" timestamp with time zone,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone
);


--
-- Name: Employees; Type: TABLE; Schema: bank_employee; Owner: -
--

CREATE TABLE bank_employee."Employees" (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "Username" text NOT NULL,
    "FirstName" text NOT NULL,
    "LastName" text NOT NULL,
    "Role" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL
);


--
-- Name: Clients; Type: TABLE; Schema: client; Owner: -
--

CREATE TABLE client."Clients" (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "Username" text NOT NULL,
    "Inn" text NOT NULL,
    "FirstName" text NOT NULL,
    "LastName" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL
);


--
-- Name: ApplicationDocuments; Type: TABLE; Schema: credit_app; Owner: -
--

CREATE TABLE credit_app."ApplicationDocuments" (
    "Id" uuid NOT NULL,
    "ApplicationId" uuid NOT NULL,
    "FileName" character varying(255) NOT NULL,
    "FileKey" character varying(500) NOT NULL,
    "FileType" character varying(100) DEFAULT 'other'::character varying NOT NULL,
    "FileSizeBytes" bigint DEFAULT 0 NOT NULL,
    "Status" character varying(50) DEFAULT 'uploaded'::character varying NOT NULL,
    "UploadedAt" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: Applications; Type: TABLE; Schema: credit_app; Owner: -
--

CREATE TABLE credit_app."Applications" (
    "Id" uuid NOT NULL,
    "ClientId" uuid NOT NULL,
    "Inn" character varying(12) NOT NULL,
    "Status" integer NOT NULL,
    "Decision" integer NOT NULL,
    "ReasonCodes" text[] NOT NULL,
    "Stage" integer NOT NULL,
    "Purpose" integer NOT NULL,
    "ProductCode" text NOT NULL,
    "RequestedAmount" numeric NOT NULL,
    "OwnContribution" numeric NOT NULL,
    "RequestedTermMonths" integer,
    "NeededByDate" timestamp with time zone,
    "AsSoonAsPossible" boolean NOT NULL,
    "BkiConsent" boolean NOT NULL,
    "PersonalDataConsent" boolean NOT NULL,
    "HistoryStartDate" timestamp with time zone,
    "HistoryMonths" integer,
    "StatementFilePath" text,
    "ExistingMonthlyObligations" numeric,
    "TaxRegime" integer NOT NULL,
    "EquipmentPrice" numeric,
    "EquipmentSupplier" text,
    "EquipmentList" text,
    "SupplierBillFilePath" text,
    "ChangeType" integer,
    "DowntimeMonths" integer,
    "ExpectedEffect" text,
    "UseOfFunds" integer,
    "IsRepeatRequirement" boolean,
    "SeasonalityComment" text,
    "PlannedLaunchDate" timestamp with time zone,
    "BusinessPlanFilePath" text,
    "ProjectedMonthlyRevenue" numeric,
    "ConservativeProjectedRevenue" numeric,
    "FinancialReserve" numeric,
    "PersonalIncome" numeric,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "MonthlyRevenue" numeric,
    "MonthlyExpenses" numeric,
    "HouseholdExpenses" numeric,
    "IsTaxRegimeActual" boolean,
    "DeclaredTaxRegime" text,
    "ReceiptCoverage" text[] DEFAULT '{}'::text[],
    "ExpensesCoverageStatus" text,
    "HasAdditionalIncome" boolean,
    "AdditionalIncomeAmount" numeric,
    "DebtsVerificationStatus" text,
    "RepaymentSourceDescription" text,
    "ExpensePeriod" text,
    "HasExpenseContract" boolean
);


--
-- Name: Offers; Type: TABLE; Schema: credit_app; Owner: -
--

CREATE TABLE credit_app."Offers" (
    "Id" uuid NOT NULL,
    "ApprovedAmount" numeric NOT NULL,
    "TermMonths" integer NOT NULL,
    "AnnualRatePercent" numeric NOT NULL,
    "MonthlyPayment" numeric NOT NULL,
    "IsCounterOffer" boolean NOT NULL,
    "ReasonCode" text,
    "CreatedAt" timestamp with time zone NOT NULL
);


--
-- Name: TransitionHistory; Type: TABLE; Schema: credit_app; Owner: -
--

CREATE TABLE credit_app."TransitionHistory" (
    "Id" uuid NOT NULL,
    "ApplicationId" uuid NOT NULL,
    "FromStatus" integer NOT NULL,
    "ToStatus" integer NOT NULL,
    "Actor" text NOT NULL,
    "ReasonCode" text,
    "Comment" text,
    "Timestamp" timestamp with time zone NOT NULL
);


--
-- Data for Name: RefreshTokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth."RefreshTokens" ("Id", "UserId", "Token", "ExpiresAt", "CreatedAt", "RevokedAt", "ReplacedByToken") FROM stdin;
5a98fe0a-5075-4818-ab97-772b9dee75cd	e3bb8e66-8b28-4d09-aa81-915ffb16a282	JSzPgnz1mTsnXF+hY46EevbqQxvozz9/aPJg5M2bOvs=	2026-10-29 21:29:40.47841+00	2026-10-22 21:29:40.478382+00	2026-10-22 21:54:29.613289+00	\N
2f7774af-3956-4424-8c5c-4116c7e4c797	e3bb8e66-8b28-4d09-aa81-915ffb16a282	m30PU1OPQYDLAQ8RS9cW7kMgOkd4/jTzSoFXezmxEdQ=	2026-10-30 08:29:50.600896+00	2026-10-23 08:29:50.600865+00	2026-10-23 08:51:07.832042+00	\N
bdf63ebc-dbe2-44cb-be65-3a5056913c03	0cec1640-e32f-4382-80af-ab3432a242e2	4o9guHnXMy1QMW6X5ePLRhYtM9rNu2hOhK+q8GBmd2k=	2026-11-01 15:31:12.242595+00	2026-10-25 15:31:12.242595+00	2026-10-25 15:31:17.576299+00	\N
635095d5-9618-4aec-81aa-b15782e24ba3	e3bb8e66-8b28-4d09-aa81-915ffb16a282	hCZuwmWDGpGF9gwyCCgLlF32itkMrO9hDEMJnxDJJYs=	2026-10-30 22:21:13.01064+00	2026-10-23 22:21:13.01061+00	2026-10-23 22:26:49.072504+00	\N
3c84d021-aaa3-44f2-b3d2-00284986fc33	e3bb8e66-8b28-4d09-aa81-915ffb16a282	pVgBM5lZ4FpvlP9dEzZn9n0qEtPv0possqhyEV2LeoA=	2026-10-30 23:16:18.05778+00	2026-10-23 23:16:18.05778+00	2026-10-23 23:17:48.241317+00	\N
f9b5062a-7b95-49bc-a7b7-3910ba13eb6b	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	WSt0xEYnfFcDdOXWrj0ZLK7PmQkW8toILHU9SiReWSo=	2026-11-01 14:21:15.493813+00	2026-10-25 14:21:15.493813+00	\N	\N
29a382c5-41cd-4e01-8251-64796aff7460	e3bb8e66-8b28-4d09-aa81-915ffb16a282	VRxYiX348pL6GiNPzPUVNN/QA2FuiW5TZdIDA2/Sq3s=	2026-11-01 13:33:43.997588+00	2026-10-25 13:33:43.99756+00	2026-10-25 14:33:06.599163+00	\N
5a68747d-724d-46b9-8792-6fb541cbbfa5	cbbbd567-d079-415f-b90e-17526d451b86	RswP4kSG2DW15W09Y2telRJ6MU4xu0v1BfQAVg2oxJY=	2026-11-01 15:30:28.261166+00	2026-10-25 15:30:28.261166+00	\N	\N
06d70da8-b922-473e-a304-96f261420a45	cbbbd567-d079-415f-b90e-17526d451b86	DlBqqgBfnya8+A2GcZzTNCOLOWlWQLjZDIm0zOvFizc=	2026-11-01 15:43:56.438778+00	2026-10-25 15:43:56.438778+00	\N	\N
e55ce8e8-7650-422d-be9d-2193bec26ab4	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	5Okb4nHkBZ/Cz5fHNNs/Fetl8y2nr+t+APisAx7fCh4=	2026-11-01 15:43:56.642586+00	2026-10-25 15:43:56.642586+00	\N	\N
0d8842f3-e0e3-4c83-98a3-e716d78e05a9	cbbbd567-d079-415f-b90e-17526d451b86	GJoFYcpkiwiTkccxf1eLJArgGPSv96o5/8U/Xb4z/3o=	2026-11-01 15:44:07.493828+00	2026-10-25 15:44:07.493828+00	\N	\N
9541b08a-c0e0-4531-97d4-57067e96bc5c	511f94b1-8df6-4682-acd5-de06fa8e3e4d	g+zAE/EkU16/fYI3uZTjEo8a1WqdICAs+EX2kAx5I3g=	2026-11-01 15:31:34.767781+00	2026-10-25 15:31:34.767781+00	2026-10-25 15:47:37.065874+00	\N
4e79a5da-575a-408d-b9a5-8ae7637848a0	cbbbd567-d079-415f-b90e-17526d451b86	83lvN/U6/K+ujw7iv7/blSmGDZXs+GdcbcPZIM30gME=	2026-11-01 15:50:13.636877+00	2026-10-25 15:50:13.636877+00	\N	\N
c3cfe643-fd54-44f7-bcb5-c42274ab2614	cbbbd567-d079-415f-b90e-17526d451b86	A1qDwSOzwkWyb5Mv3Uvhidp8ELKcqdcT40pavCc3Uo4=	2026-11-01 15:50:25.83794+00	2026-10-25 15:50:25.83794+00	\N	\N
0879aa54-07dc-444e-b067-43aef8ac39e0	0cec1640-e32f-4382-80af-ab3432a242e2	fcQ7FysgIcKqfihjxCQyAlfs7NeroHs1+YAidGBO0Lo=	2026-11-01 15:47:53.174556+00	2026-10-25 15:47:53.174556+00	2026-10-25 15:57:06.756439+00	\N
91ecd1d9-18db-43ea-8221-16bf985a3730	cbbbd567-d079-415f-b90e-17526d451b86	oQtsvNQLaNuAMbksAt10oB+O6M3cUZg+ciiLrdr8ies=	2026-11-01 15:57:16.838139+00	2026-10-25 15:57:16.838139+00	2026-10-25 16:38:09.168596+00	\N
3af90e9f-fe8b-48a1-8bc7-d1c20a8f5181	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	HK9PN7vEANVUyaV2D74HuuBd1ac5ee4wyyNyocsPjok=	2026-11-01 16:38:22.206152+00	2026-10-25 16:38:22.206152+00	2026-10-25 16:40:22.361264+00	\N
be46a1c8-12de-47e8-a6ba-1be40a505863	0cec1640-e32f-4382-80af-ab3432a242e2	1PG9LZQq4jRJVwJFMC4XCX8IxSXJ3zfWoAD+UtxIGok=	2026-11-01 16:40:28.084944+00	2026-10-25 16:40:28.084944+00	\N	\N
85c0743a-a9e4-45e6-80cf-caca28855633	0cec1640-e32f-4382-80af-ab3432a242e2	nbENxoe5acLvfgWGOqi9/0FzEfhy9F0QPaZWhlZphmY=	2026-11-01 17:17:13.908951+00	2026-10-25 17:17:13.908901+00	\N	\N
23a2c878-b0e4-49d5-b944-7cbb4f36e0af	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	+MzMT9EdgHbP4V4bE2nLKcKMY2KIPiFyJJrHotb8L9Y=	2026-11-01 17:22:32.759014+00	2026-10-25 17:22:32.759014+00	2026-10-25 17:27:21.678272+00	\N
26be245d-235e-42ae-8915-074dae9df70f	0cec1640-e32f-4382-80af-ab3432a242e2	4KQgK3FP89uOCR+qFlT0v9t1eRYzlFrSF7mbg3iXNfc=	2026-11-01 17:27:30.128479+00	2026-10-25 17:27:30.128479+00	2026-10-25 17:28:03.387144+00	\N
6e15f7f6-dc3a-4765-b44a-c9d3c91feaae	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	iNruM0EK3p+a3ElqnzqiOJnS72CexbrM77Ew6P0swv0=	2026-11-01 17:28:36.210311+00	2026-10-25 17:28:36.210311+00	\N	\N
f8792d90-ea23-4f00-839b-e0e0cb1958f2	511f94b1-8df6-4682-acd5-de06fa8e3e4d	bmBag7F97O/BwMrXiyOjlirQeJCV6T3iNKNdPYEYky4=	2026-11-01 17:29:50.187423+00	2026-10-25 17:29:50.187423+00	2026-10-25 17:29:58.234836+00	\N
1132b1fd-c52c-4ac1-8a60-efca957ae9ff	0cec1640-e32f-4382-80af-ab3432a242e2	Aov0yMTOakGFAeRBQlOzMM3OKXWkv2A7muUqKARQpYY=	2026-11-01 17:30:03.273924+00	2026-10-25 17:30:03.273924+00	2026-10-25 18:37:30.817062+00	rzV1UPiSkSmggxAGNhAjAHRmzJwDrK9VVO9Qji6zeKE=
4e7de611-5688-45d6-91aa-4a529a517192	0cec1640-e32f-4382-80af-ab3432a242e2	rzV1UPiSkSmggxAGNhAjAHRmzJwDrK9VVO9Qji6zeKE=	2026-11-01 18:37:30.81692+00	2026-10-25 18:37:30.816888+00	2026-10-25 18:37:36.684864+00	\N
106bf151-da0b-43ab-bdf9-21276ec606e9	cbbbd567-d079-415f-b90e-17526d451b86	JFk6yuLtEYN9W1Rs257E20wHk8oWUONMb8yHrKerQ3I=	2026-11-01 18:37:52.260404+00	2026-10-25 18:37:52.260404+00	2026-10-25 18:37:58.053322+00	\N
14a11436-793b-4bf3-ad8a-f74563038257	511f94b1-8df6-4682-acd5-de06fa8e3e4d	DfeApiE+Se96EY9bGR5YP26iThByDXhKO6VQS7gGgfQ=	2026-11-01 18:38:02.683378+00	2026-10-25 18:38:02.683378+00	2026-10-25 19:39:46.344379+00	QrqUSpia8svbYgUpaCREgFoH7NTC4jGAeLoHh4ug4cE=
e7ba7eac-6a10-4166-bf89-030bc2012d8c	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	pW9Gi7j4Ii6aqu9CIOsUNI0Fx/qF048v1cjcyuJXH9U=	2026-11-01 19:45:19.867077+00	2026-10-25 19:45:19.867077+00	\N	\N
0567eab8-0757-460d-9719-c9b257b37468	511f94b1-8df6-4682-acd5-de06fa8e3e4d	s1hiiotcLMW/OM9dqtvFh4YDsEmVgcZomyl3t9UTKyo=	2026-11-01 15:45:02.811579+00	2026-10-25 15:45:02.811579+00	2026-10-25 20:45:29.180916+00	\N
0def9ff1-3a1c-4587-b321-d59f2f6f58e2	511f94b1-8df6-4682-acd5-de06fa8e3e4d	j9qpijuqUXFxOuvHvqygAfnqB/NwPCO5FCDqha8NDkU=	2026-11-01 16:16:42.815992+00	2026-10-25 16:16:42.815992+00	2026-10-25 20:45:29.180916+00	\N
17230a58-9b59-4783-b7e1-fe9d5fb12c25	511f94b1-8df6-4682-acd5-de06fa8e3e4d	0QVjH7HY6ln7yF7a1sVIfYno+urElK7MGskT0oH8RCY=	2026-11-01 15:29:28.896466+00	2026-10-25 15:29:28.896466+00	2026-10-25 20:45:29.180916+00	\N
19686598-9df3-4904-986e-e2f69dcd4077	511f94b1-8df6-4682-acd5-de06fa8e3e4d	R20HQhQHsFt7p/1ErlBl8CXET6DU32fnmcXj2YwguLg=	2026-11-01 16:17:03.327355+00	2026-10-25 16:17:03.327355+00	2026-10-25 20:45:29.180916+00	\N
1a786c6a-d066-4d9c-b68d-253370b298f0	511f94b1-8df6-4682-acd5-de06fa8e3e4d	kRXlQjH2O5Ex8OSayALoQk4kjLHsqj6p5gGpKfrrYio=	2026-11-01 15:43:56.229886+00	2026-10-25 15:43:56.229886+00	2026-10-25 20:45:29.180778+00	\N
26cca418-42e4-4f98-adc2-708b031be4e3	511f94b1-8df6-4682-acd5-de06fa8e3e4d	souy8Zkw91/YYjaLFYEqRUSzARTIsEG+BhKmJpm2apg=	2026-11-01 16:16:50.269644+00	2026-10-25 16:16:50.269644+00	2026-10-25 20:45:29.180916+00	\N
45b1501f-02f3-4546-a483-17a823f3ec3b	511f94b1-8df6-4682-acd5-de06fa8e3e4d	YLNuAB31Er5vofufkb1AmImQhHhD7fn8ekPYem5SfPE=	2026-11-01 20:37:20.554213+00	2026-10-25 20:37:20.554186+00	2026-10-25 20:45:29.180916+00	\N
add758e9-5188-4033-b676-e201046056ac	511f94b1-8df6-4682-acd5-de06fa8e3e4d	CtlCu4Vq7Epv6ovVjJnxBVnvXq8v3hqfNxlmvb6Iw2o=	2026-11-01 19:54:30.226138+00	2026-10-25 19:54:30.226138+00	2026-10-25 20:45:29.180916+00	\N
e5ab2509-f507-408c-a627-89f91a6f3fc6	511f94b1-8df6-4682-acd5-de06fa8e3e4d	QrqUSpia8svbYgUpaCREgFoH7NTC4jGAeLoHh4ug4cE=	2026-11-01 19:39:46.344199+00	2026-10-25 19:39:46.344169+00	2026-10-25 20:45:29.180916+00	\N
09181833-5c25-42c9-8395-2ebebf3d35a2	e3bb8e66-8b28-4d09-aa81-915ffb16a282	ina9U8WR92TIPP0A7L0G/sCEYIZEs3QX5boXjXqP8Zw=	2026-11-01 20:45:40.444823+00	2026-10-25 20:45:40.444823+00	2026-10-25 20:45:57.129226+00	\N
5fbef307-f2eb-47d0-a86c-7f8b17f0a5a9	e3bb8e66-8b28-4d09-aa81-915ffb16a282	Vsu97WJQFmjuV9SWG41dAlj2zV24nEOqyIIiYR3fzqI=	2026-10-29 16:26:53.055288+00	2026-10-22 16:26:53.05526+00	2026-10-25 20:45:57.129226+00	\N
a9cfd59a-38ac-49fc-a00a-da0b49772ebb	e3bb8e66-8b28-4d09-aa81-915ffb16a282	sF28Rn25MI5aM7ulhxrMxVjRgPGsbx7nGyAhKq5GCko=	2026-10-29 21:03:00.4532+00	2026-10-22 21:03:00.453172+00	2026-10-25 20:45:57.129226+00	\N
c6e27c57-5a50-4f1a-abac-67c90acd3dab	e3bb8e66-8b28-4d09-aa81-915ffb16a282	nJ/CIlSNWSrcG/MAi+Z1hz9nngkf+Kj4KOynChtwGPQ=	2026-10-30 22:53:22.140244+00	2026-10-23 22:53:22.140206+00	2026-10-25 20:45:57.129226+00	\N
d0b24334-ed3b-4b1f-a363-8b4b2f85a89f	e3bb8e66-8b28-4d09-aa81-915ffb16a282	DN9ZvGQvSE4DhiehJSxFG7ozMuD7Jt3bqdNeajxxI+I=	2026-10-29 12:01:53.985803+00	2026-10-22 12:01:53.985735+00	2026-10-25 20:45:57.129225+00	\N
ed6d226f-bf25-4bf8-8a2c-3f8c843b34c7	e3bb8e66-8b28-4d09-aa81-915ffb16a282	X1uo3vKBZha9fFpdKA+Con2onEpsPHb/spXybypK0oE=	2026-10-30 22:31:33.708157+00	2026-10-23 22:31:33.708157+00	2026-10-25 20:45:57.129226+00	\N
f67ea7f3-80e5-4453-a4a1-b0328ea5e2e6	e3bb8e66-8b28-4d09-aa81-915ffb16a282	WHvaEYN9Af+byMJulAkRpQSqkqVAecE9uQPa/6TAcF0=	2026-10-30 23:18:00.851825+00	2026-10-23 23:18:00.851825+00	2026-10-25 20:45:57.129226+00	\N
160d2c7f-1e6e-4420-bafc-59d385142265	cbbbd567-d079-415f-b90e-17526d451b86	NZxOKqmyiVbqiwag8sk6eT5DA756rqd0doWCyD5FWPE=	2026-11-01 20:02:57.707827+00	2026-10-25 20:02:57.707827+00	2026-10-25 21:03:29.02916+00	jUQFqcLaojZZeZc8A7+Ij8ZU6Cm0AatWywc8/tUN4w8=
690016d4-a4a7-42df-be79-6c499db685b8	cbbbd567-d079-415f-b90e-17526d451b86	U02/7Qbm5OAjYEO2pHFauGDCKg8mYy0tPC7KO/1gxfE=	2026-11-01 20:37:58.4487+00	2026-10-25 20:37:58.4487+00	2026-10-25 21:26:06.074116+00	\N
bf3c2183-39da-44d6-b1ef-14d3160448c9	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	y2gD5XzUxApg6ZXM0v2Je4X0RwEvWReDG2tAQA4aWZg=	2026-11-01 21:26:29.303939+00	2026-10-25 21:26:29.30391+00	2026-10-25 22:29:49.068652+00	m6A/Lfarq7/sMTIOHJ6symWn0A68xOIMYF4Txn2XSvI=
de1a08a9-816d-4b2a-a3c0-0020fa7f36c7	cbbbd567-d079-415f-b90e-17526d451b86	jUQFqcLaojZZeZc8A7+Ij8ZU6Cm0AatWywc8/tUN4w8=	2026-11-01 21:03:29.029157+00	2026-10-25 21:03:29.029157+00	2026-10-25 22:04:22.255254+00	Iz63iEgMTxxUbdGE6LsuekAoqlHFJ0GORj7F6fPdogM=
5c31c6b7-271a-4524-9eb4-af3e0608b2a2	cbbbd567-d079-415f-b90e-17526d451b86	Iz63iEgMTxxUbdGE6LsuekAoqlHFJ0GORj7F6fPdogM=	2026-11-01 22:04:22.255135+00	2026-10-25 22:04:22.255099+00	2026-10-25 23:15:12.953161+00	dy+riiUwLYunMTgzob1oLkIS5XZAiulcnecw40Nn0iU=
6895f5ff-cdb9-4c7d-b29d-dfe777cf6ccd	cbbbd567-d079-415f-b90e-17526d451b86	dy+riiUwLYunMTgzob1oLkIS5XZAiulcnecw40Nn0iU=	2026-11-01 23:15:12.953015+00	2026-10-25 23:15:12.952983+00	2026-10-25 23:15:22.508114+00	\N
4b1d0795-9e64-4eac-a859-3aa9f29d671c	0cec1640-e32f-4382-80af-ab3432a242e2	/qYsT6RwwMp1T6S6nkGmpHWxE9wxmhxDTwsZPP2/IpE=	2026-11-01 23:16:12.780186+00	2026-10-25 23:16:12.780186+00	\N	\N
7ea6edbb-f74c-4766-b711-d4dab14bbb69	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	m6A/Lfarq7/sMTIOHJ6symWn0A68xOIMYF4Txn2XSvI=	2026-11-01 22:29:49.068647+00	2026-10-25 22:29:49.068646+00	2026-10-26 07:48:48.375894+00	Mb02/jpdhCRbhMejwsbC//THfXVqhmoK7HOdXqAk/7M=
71b12349-0d61-475f-aad0-d1774d8f89b4	cbbbd567-d079-415f-b90e-17526d451b86	WyB1ryhUqKesc8xJo+r8zEQbWukuArFXO2nk5mVA1Aw=	2026-11-02 07:49:18.28396+00	2026-10-26 07:49:18.28396+00	2026-10-26 07:50:00.597327+00	\N
2e4afb37-353b-4b2d-a47d-6383147a04ef	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	Mb02/jpdhCRbhMejwsbC//THfXVqhmoK7HOdXqAk/7M=	2026-11-02 07:48:48.375765+00	2026-10-26 07:48:48.375735+00	2026-10-26 08:50:15.747112+00	r3Myoz1BOCX+bd30dI2jxQBLWKhlK/OKtmwirDbETJM=
2ada0019-54d5-4ca7-bae5-f358b051a45a	0cec1640-e32f-4382-80af-ab3432a242e2	TYZw8a1B+0+h9hP11hfhi0O92C1UiI5zIKx57+6YsY4=	2026-11-02 07:50:13.15681+00	2026-10-26 07:50:13.15681+00	2026-10-26 08:51:04.521945+00	5nBVe7vWkvC1Eqj5egn2dqt8/pjoKEALgAaqIbNSHzA=
a0db5f8c-4815-4f26-a657-8a0689df1327	55555555-5555-5555-5555-555555555555	xyv6nqH67WXTSElArN334jFkBFmTe/T0YnjbVGaKHU8=	2026-11-02 08:55:47.891715+00	2026-10-26 08:55:47.891715+00	\N	\N
d15e5669-9b6d-487e-b52c-7571e3b0e9d7	a160108c-fc90-47ad-b98c-0917189db9c2	Bam2VRDKwITg+ACQjNDVHIHI5F8kTrNe2AkoGMOCb9Y=	2026-11-02 08:56:05.24752+00	2026-10-26 08:56:05.24752+00	\N	\N
f420cfea-67bf-43d4-a98c-a8b9dcdefa00	ee6c39e8-2462-4da0-8823-db25d9a07c98	TSKE1NqC8YcbKrA75sqGd0//tY0uMWjgEVuCTZ4AO8A=	2026-11-02 08:56:20.897371+00	2026-10-26 08:56:20.897371+00	\N	\N
f5995859-feda-4030-af89-1b97fbc0b7bb	5aea8404-da47-4d2e-883d-ffc9b1157df3	MkYvlfoXgd2yQVMftQ1+BQR1oZuMgY/FEa9rN4zkJMU=	2026-11-02 08:56:21.014341+00	2026-10-26 08:56:21.014341+00	\N	\N
7655e6e9-96d0-48a2-a48b-270ad2383094	8404810d-bd0e-4160-85f9-df7e8ffd1a80	cxJr707x6YWIyCUvW0BmcVJc1bZPelAUejBOthvVXLY=	2026-11-02 08:56:21.159635+00	2026-10-26 08:56:21.159635+00	\N	\N
5d44e01a-3ea6-46d0-b8d5-05706fa3c05d	7c05c8f1-65f7-4e31-b4d5-6762d1a53250	roioAH3knSkWvCyhkQfJuinujwXqnn2npZgSR64TFRs=	2026-11-02 08:56:21.268588+00	2026-10-26 08:56:21.268588+00	\N	\N
7e3db350-a119-4419-9523-5cbff34e724f	8685faff-b338-48e7-a0f7-109c743017e3	H2Wv5NrMbpMzA/4aNKCXTlJMtfzzT67SDzWG3r5tgtA=	2026-11-02 08:56:21.374084+00	2026-10-26 08:56:21.374084+00	\N	\N
d92d88fd-c122-44d5-bc7a-2319e7385d04	66cb62bf-2ecc-4b73-aec8-705942437bc7	NO/hh3789jpleRPSkytm6TFLfK/CRS8F6dlIjQxiNjM=	2026-11-02 08:56:21.480741+00	2026-10-26 08:56:21.480741+00	\N	\N
6aace771-f557-486a-a5e7-f048d75a91ab	c6c29661-9eb2-4bfe-ac18-5f111512c381	qENsd5lwd+6ezPe9xCtXB5dqpbHi6w6N3RhwbOYAQyU=	2026-11-02 08:56:21.585249+00	2026-10-26 08:56:21.585249+00	\N	\N
7a3f2ff0-bda0-4b3a-954a-db937abcf9b4	d85b88ad-d296-4818-9e66-bc66102f6cdd	NlxjmYBOJVozogOhRdnAkapTEB2W/LAE8RGHHmWSMd0=	2026-11-02 08:56:21.693165+00	2026-10-26 08:56:21.693165+00	\N	\N
7f6ab9d1-af93-475b-b3e0-cec27abf185d	728802f8-3014-41c8-abac-22248a0b7445	2bLCfRECHV3ahP/Yv5ndIe08WDkBV9TS8/AwSS1ApSw=	2026-11-02 08:56:21.798453+00	2026-10-26 08:56:21.798453+00	\N	\N
ae8993e4-c457-49aa-9f49-53f6a7e28434	a160108c-fc90-47ad-b98c-0917189db9c2	0IsW1NDx9UHXEopu72lqDGtz17lspH4LxmlEmfK+3uE=	2026-11-02 08:56:26.676643+00	2026-10-26 08:56:26.676643+00	\N	\N
bb242fde-ae99-42b5-9b05-115b2c54958e	728802f8-3014-41c8-abac-22248a0b7445	RC/O8B2B/lBLuSz2uPNxZPCxBuqA1ikRC6mvXyb/Uhw=	2026-11-02 08:56:31.790784+00	2026-10-26 08:56:31.790784+00	\N	\N
68b2a6ba-d95e-4be7-ad48-fd31ac354d42	511f94b1-8df6-4682-acd5-de06fa8e3e4d	byYvKDtPp2xwNI+/IvD52KP9I+Ei3vPj2yZJQexhk2U=	2026-11-02 08:59:29.716371+00	2026-10-26 08:59:29.716371+00	\N	\N
f92d9da1-b257-4bed-ba13-440a5e49c5ad	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	owr+u59A9SR0DOyuX1kBmU9EmZqr+foi84Gh7D/3CJc=	2026-11-02 08:59:47.398391+00	2026-10-26 08:59:47.398391+00	\N	\N
7ae72b77-f219-4873-968d-8af80496f0aa	511f94b1-8df6-4682-acd5-de06fa8e3e4d	7pSi7OnHekvw/9TbIhgiHsAXjOYuukZ+cLCoVhLzBwQ=	2026-11-02 09:39:28.862334+00	2026-10-26 09:39:28.862327+00	\N	\N
2fa9d8ae-97cf-4411-b6b5-92a63927e858	511f94b1-8df6-4682-acd5-de06fa8e3e4d	0bu0n9NDGT3MseYY65eyJ7NaSL1HTJ4upfeX+QX/kdU=	2026-11-02 09:39:38.136487+00	2026-10-26 09:39:38.136487+00	\N	\N
46fdfadb-fcb9-48be-8ffa-18263e7c2994	cbbbd567-d079-415f-b90e-17526d451b86	HsK5KAEzkXHzLSTwdlaSD+WyDSNHs0ZF/xJIA7nGt4E=	2026-11-02 09:39:38.24438+00	2026-10-26 09:39:38.24438+00	\N	\N
b51e8bf8-47dd-4488-b8db-3175cff85591	0cec1640-e32f-4382-80af-ab3432a242e2	WpehQXQqif8fTdtQ7C0xuU5YW+AMrh6LghsRPNmxGg0=	2026-11-02 09:39:38.34877+00	2026-10-26 09:39:38.34877+00	\N	\N
59d8e710-df1a-4094-ac14-72a64742dd53	44444444-4444-4444-4444-444444444444	pB3YsC0tiR9fofBS+QbajnqXeATeTLMOsGi5KOHci6U=	2026-11-02 09:39:38.451775+00	2026-10-26 09:39:38.451775+00	\N	\N
729a53d2-1353-4110-aaf4-80d472a1b8cc	55555555-5555-5555-5555-555555555555	sUUBCbViD2pUj6fOAuPlRFrW3cmAPnGf2W3hBgNmyq4=	2026-11-02 09:39:38.558814+00	2026-10-26 09:39:38.558814+00	\N	\N
16185958-2abc-4c3a-9e4e-95741fb2327b	a160108c-fc90-47ad-b98c-0917189db9c2	6vnGPUUJrLrDxAd+pd/EHslKZR42roOLJzelPnOny0M=	2026-11-02 09:39:38.663841+00	2026-10-26 09:39:38.663841+00	\N	\N
c1c51177-863e-4708-9cba-38cbe545d57c	0cec1640-e32f-4382-80af-ab3432a242e2	5nBVe7vWkvC1Eqj5egn2dqt8/pjoKEALgAaqIbNSHzA=	2026-11-02 08:51:04.521941+00	2026-10-26 08:51:04.521941+00	2026-10-26 09:51:58.687083+00	XsEbPHuArsT7+8Eydk+pjjEmDByEMonvnTXPJWyP7Ig=
abd88b03-951f-4a42-81f2-86c841a6d14e	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	r3Myoz1BOCX+bd30dI2jxQBLWKhlK/OKtmwirDbETJM=	2026-11-02 08:50:15.74692+00	2026-10-26 08:50:15.746892+00	2026-10-26 09:54:13.275101+00	x3E5s3F94hmx70AU0qjUS/SVvUN2YRiEQbyabBQzDkk=
d572578f-1303-437e-96e8-20cd6aba0a7d	0cec1640-e32f-4382-80af-ab3432a242e2	XsEbPHuArsT7+8Eydk+pjjEmDByEMonvnTXPJWyP7Ig=	2026-11-02 09:51:58.687035+00	2026-10-26 09:51:58.687035+00	2026-10-26 10:54:48.488637+00	QktO68tJmgMy01MnSpAl57raRd7wC+2sqmdDrDFrZsw=
272e243f-0801-4134-8498-8af2a571e2b0	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	x3E5s3F94hmx70AU0qjUS/SVvUN2YRiEQbyabBQzDkk=	2026-11-02 09:54:13.275087+00	2026-10-26 09:54:13.275087+00	2026-10-26 10:56:07.209924+00	2UgcrBs6kw/rP7NMN24IsySee7R6dhbhF69o4xEnKhw=
9b5ae711-14aa-4812-a0e7-6f80af142e06	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	EY75mIkua1W+z8AA+YEkR/ByUwrpnduwAtQQoO6bWGo=	2026-11-02 11:24:57.954155+00	2026-10-26 11:24:57.954128+00	\N	\N
9ce72986-d441-484f-b9eb-c05c1be932bb	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	mN4tU0yTL+IvTymE0avrbg6dbJNoygB98PIEryvLoVQ=	2026-11-02 11:25:31.626583+00	2026-10-26 11:25:31.626583+00	\N	\N
2e5a9e54-8f70-464b-b039-a08b13bb4db3	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	ANhwmVyQ7Rj1T3J1QkKnvAKPpdzmUczsziuxEhoqq0o=	2026-11-02 11:26:55.142224+00	2026-10-26 11:26:55.142224+00	\N	\N
ddc8a9e6-9aaa-4ed7-8f43-2107415c45b4	0cec1640-e32f-4382-80af-ab3432a242e2	2ge5ApFgVRu2sL/3YiReZcnoZGB5yXcANHjbpE6Cn94=	2026-11-02 11:32:52.217559+00	2026-10-26 11:32:52.217559+00	\N	\N
8c37ec87-735e-443a-9dcf-a4502a24e686	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	trwR+lI2VogvCe+OEdg7xE2Q3n69vtCMkrtWE54Z6sY=	2026-11-02 11:33:22.263011+00	2026-10-26 11:33:22.263003+00	\N	\N
0e44284f-9452-4625-bc67-c772ff54a696	0cec1640-e32f-4382-80af-ab3432a242e2	+6IXCLjkOU4kpWNXYx/VV0Clp7mxh4azx0y3+W20t0k=	2026-11-02 11:33:22.746714+00	2026-10-26 11:33:22.746714+00	\N	\N
78e786dc-2ded-42b8-82d7-397f8f3f24e7	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	ZKvb4C+g6PVax5Mkt7FvVv8X/Iw231mlRif+LS+Be4I=	2026-11-02 11:34:20.525312+00	2026-10-26 11:34:20.525312+00	\N	\N
580697f6-34e6-41c6-ad34-33b099c541a6	0cec1640-e32f-4382-80af-ab3432a242e2	ih4TN39gmhswMEGv2HpBPC/BNEJ+SjgH2S3+6MARtQw=	2026-11-02 11:34:20.712575+00	2026-10-26 11:34:20.712575+00	\N	\N
ac9afb6f-f073-4ed8-9fea-820c8dda7829	0cec1640-e32f-4382-80af-ab3432a242e2	GWfM4aTCkzAoWQx8nyaSpBPHcgEXPdO2Azo2VP7lRwM=	2026-11-02 11:42:24.280674+00	2026-10-26 11:42:24.280667+00	\N	\N
f7b5c584-fb91-4495-b037-1f895c02441f	cbbbd567-d079-415f-b90e-17526d451b86	UjGDCVlXoGcwuNVQUz2h/RCGHAF0rMJR9Bk/Asg+cow=	2026-11-02 11:42:38.995222+00	2026-10-26 11:42:38.995222+00	\N	\N
8ada91d6-6afe-40a3-a827-14120640aaaa	0cec1640-e32f-4382-80af-ab3432a242e2	QktO68tJmgMy01MnSpAl57raRd7wC+2sqmdDrDFrZsw=	2026-11-02 10:54:48.488502+00	2026-10-26 10:54:48.488469+00	2026-10-26 11:55:50.364473+00	quNhfkqojiY+na7NqiK7bzQMb4XDScUZu1tcZIcnVD8=
f6676e64-9c41-4040-97e1-b553c50f8be5	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	2UgcrBs6kw/rP7NMN24IsySee7R6dhbhF69o4xEnKhw=	2026-11-02 10:56:07.209923+00	2026-10-26 10:56:07.209923+00	2026-10-26 11:57:20.364983+00	fEPYcu2iSxbzQ78uYXjE4yznWwP71pRhjyO4U1jaLdw=
30a209aa-25d1-4c91-b4cf-4d49caff8aaa	0cec1640-e32f-4382-80af-ab3432a242e2	6AtfcNdqWx97aoUv0mr4VM6Hir3o+8JYIyOTRSDQTT8=	2026-11-02 11:58:47.293145+00	2026-10-26 11:58:47.293145+00	\N	\N
51e229b1-d6e6-4643-987a-3840c57671a5	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	4+vfZ5Ic8MNWKaF+cLDsMCbzQvR/ziPof0GVu6sXZ7U=	2026-11-02 11:58:47.405515+00	2026-10-26 11:58:47.405515+00	\N	\N
4046148a-8c48-406a-9ace-4724fe2fbe0f	0cec1640-e32f-4382-80af-ab3432a242e2	quNhfkqojiY+na7NqiK7bzQMb4XDScUZu1tcZIcnVD8=	2026-11-02 11:55:50.364324+00	2026-10-26 11:55:50.36429+00	2026-10-26 12:28:24.372501+00	\N
5638f382-eef6-436b-9fd2-38f362a374d7	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	fEPYcu2iSxbzQ78uYXjE4yznWwP71pRhjyO4U1jaLdw=	2026-11-02 11:57:20.364972+00	2026-10-26 11:57:20.364972+00	2026-10-26 12:28:58.873672+00	\N
5b8eb776-6843-47d8-9c1b-1277c1911971	511f94b1-8df6-4682-acd5-de06fa8e3e4d	qoj0D7daG6IjehNj3gqgzPX8V+BvYG1LRg3cSat9j80=	2026-11-02 12:33:02.339883+00	2026-10-26 12:33:02.339862+00	\N	\N
656a8d8b-3ed6-4e84-b867-1ef740255710	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	gOgeWrgEiKxvxzXMFURPK9KiGDeny/7ENHGSXtegx7E=	2026-11-02 12:35:48.458438+00	2026-10-26 12:35:48.458438+00	\N	\N
f4b6b5ec-a99b-4d11-b152-cf154547883d	511f94b1-8df6-4682-acd5-de06fa8e3e4d	qJrf5uJ4GxpexdrEo+89JF1iP2CS/LhokREbGjn+m5Y=	2026-11-02 14:04:52.546413+00	2026-10-26 14:04:52.546409+00	\N	\N
f3d39a57-b030-49c0-a21b-8c54631d6384	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	3QGrhmZA2JCyGR0pmvwgHvRqXOiemNyNQAs1cQdiBto=	2026-11-02 14:04:58.776106+00	2026-10-26 14:04:58.776106+00	\N	\N
\.


--
-- Data for Name: Users; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth."Users" ("UserId", "Username", "PasswordHash", "FirstName", "LastName", "MiddleName", "Inn", "Role", "IsActive", "LastLoginAt", "CreatedAt", "UpdatedAt") FROM stdin;
7c05c8f1-65f7-4e31-b4d5-6762d1a53250	client10	$2a$11$pdykdEpAvMdmjbvQ1RJ2eeIvBmzfp3YBLH0KYgFWN1PDP9VjNMPUu	Татьяна	Воробьёва	Сергеевна	994209132544	2	t	\N	2026-10-26 08:56:21.162651+00	\N
8685faff-b338-48e7-a0f7-109c743017e3	client11	$2a$11$K4fTcOLN07lmdty7ngNe3.tVPRZIkCzZficm0wwl6Mmm3C7lGuaIW	Павел	Лебедев	Викторович	991802424801	2	t	\N	2026-10-26 08:56:21.270935+00	\N
66cb62bf-2ecc-4b73-aec8-705942437bc7	client12	$2a$11$ON/MS3jTKc4c/RAwSZCcuezNr4ww5JR1nJiDomWL/mjGBJlzl3mKC	Светлана	Попова	Андреевна	992136717200	2	t	\N	2026-10-26 08:56:21.377554+00	\N
c6c29661-9eb2-4bfe-ac18-5f111512c381	client13	$2a$11$Q/3BVEBWCceNzZTh.jD3o.UsWN5B40VjJn07NogfDWz9VaY6UxYli	Виктор	Соловьёв	Сергеевич	998924531779	2	t	\N	2026-10-26 08:56:21.482949+00	\N
e3bb8e66-8b28-4d09-aa81-915ffb16a282	baclk	$2a$11$0lfuMDSpxuKDecdYPeUv5uVXzhTnf4M7iqfxNEwy4ipRZmoWMBFx.	Данила	Гриневич	Дмитриевич	111111111111	2	t	2026-10-25 20:45:40.439219+00	2026-10-22 12:01:53.767812+00	2026-10-25 20:45:40.43922+00
d85b88ad-d296-4818-9e66-bc66102f6cdd	client14	$2a$11$T5V2dvq5qNi.DL/Q/FM7NuKWvQPraoV.b.ih2CDTajsfQKSpiuHVO	Илья	Морозов	Олегович	995940119912	2	t	\N	2026-10-26 08:56:21.587511+00	\N
cbbbd567-d079-415f-b90e-17526d451b86	client2	$2a$11$qAakg2S8bGJxB0IQA0/kV.40T1h5Nd.qsilkqbYAjkhTbUn3N44iO	Анна	Сидорова	Сергеевна	500100000022	2	t	2026-10-26 11:42:38.993408+00	2026-10-25 15:30:28.130114+00	2026-10-26 11:42:38.993414+00
728802f8-3014-41c8-abac-22248a0b7445	client15	$2a$11$2qfew7SAs649H0nuxetIhe.Kk7K3fjFbkPSn6jw9/29DeC42qshvG	Илья	Семёнов	Владимирович	991126723717	2	t	2026-10-26 08:56:31.789261+00	2026-10-26 08:56:21.695625+00	2026-10-26 08:56:31.789261+00
0cec1640-e32f-4382-80af-ab3432a242e2	client3	$2a$11$qAakg2S8bGJxB0IQA0/kV.40T1h5Nd.qsilkqbYAjkhTbUn3N44iO	Алексей	Кузнецов	Петрович	500100000033	2	t	2026-10-26 11:58:47.291256+00	2026-10-25 15:31:12.103444+00	2026-10-26 11:58:47.291283+00
44444444-4444-4444-4444-444444444444	client4	$2a$11$qAakg2S8bGJxB0IQA0/kV.40T1h5Nd.qsilkqbYAjkhTbUn3N44iO	Михаил	Петров	Дмитриевич	500100000077	2	t	2026-10-26 09:39:38.450109+00	2026-10-25 15:49:44.004082+00	2026-10-26 09:39:38.450109+00
55555555-5555-5555-5555-555555555555	client5	$2a$11$qAakg2S8bGJxB0IQA0/kV.40T1h5Nd.qsilkqbYAjkhTbUn3N44iO	Сергей	Иванов	Петрович	990000000115	2	t	2026-10-26 09:39:38.557379+00	2026-10-25 15:49:44.004082+00	2026-10-26 09:39:38.55738+00
a160108c-fc90-47ad-b98c-0917189db9c2	client6	$2a$11$DEDvTT7M0cQfbCC5xvG2kO9F/O4cSjQNHzdiwcrfFP5btW1ddKhtm	Виктор	Захаров	Сергеевич	992934509242	2	t	2026-10-26 09:39:38.662375+00	2026-10-26 08:56:05.042091+00	2026-10-26 09:39:38.662375+00
ee6c39e8-2462-4da0-8823-db25d9a07c98	client7	$2a$11$CBHaL1Ho6HvDjtnGJvvYK.JI1OVO3meLe9gGeMmWaA/MtVAloi77C	Алексей	Соловьёв	Андреевич	990750786404	2	t	\N	2026-10-26 08:56:20.76863+00	\N
5aea8404-da47-4d2e-883d-ffc9b1157df3	client8	$2a$11$T1MWx6eK/lUpe8d4HYdcweB3PuR2oo2kfee77FsZlHbFWWIPG2Daq	Екатерина	Николаева	Петровна	998575834946	2	t	\N	2026-10-26 08:56:20.904015+00	\N
8404810d-bd0e-4160-85f9-df7e8ffd1a80	client9	$2a$11$e3KFk2iuO.P3jw5cYuRuqumZxFZSoxiIKHZRAlOR.4jTunTZBliim	Дарья	Кузьмина	Юрьевна	997237475355	2	t	\N	2026-10-26 08:56:21.050199+00	\N
511f94b1-8df6-4682-acd5-de06fa8e3e4d	client1	$2a$11$qAakg2S8bGJxB0IQA0/kV.40T1h5Nd.qsilkqbYAjkhTbUn3N44iO	Иван	Иванов	Иванович	500100000011	2	t	2026-10-26 14:04:52.540228+00	2026-10-25 15:29:28.703786+00	2026-10-26 14:04:52.540242+00
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	analyst	$2a$11$qAakg2S8bGJxB0IQA0/kV.40T1h5Nd.qsilkqbYAjkhTbUn3N44iO	Андрей	Смирнов	Васильевич	\N	3	t	2026-10-26 14:04:58.774812+00	2026-10-25 14:15:36.0595+00	2026-10-26 14:04:58.774813+00
\.


--
-- Data for Name: Employees; Type: TABLE DATA; Schema: bank_employee; Owner: -
--

COPY bank_employee."Employees" ("Id", "UserId", "Username", "FirstName", "LastName", "Role", "CreatedAt") FROM stdin;
1f75d817-7c52-4618-98ac-51e1d162c983	9c5c55c1-2769-46c6-aa6b-5a13b804316b	analyst_test	Сергей	Андеррайтер	Analyst	2026-10-22 20:29:30.062817+00
90a53a2c-712b-466e-9458-0d0ed980b717	2902dcf6-bc13-4b87-92e8-09804fce1469	Cr1stal	Данила	Гриневич	Analyst	2026-10-23 09:24:50.837275+00
67eb8710-ce56-47ff-b205-ec1de1ba90f3	f259e55e-420d-4a55-ae72-0131f37e3536	analyst_demo	Андрей	Сидоров	Analyst	2026-10-23 16:06:54.643381+00
fb8511f8-2f16-4dde-966e-dd8d88c8d61d	037fce3c-873f-4c2b-bceb-c09899ea64b7	analyst	Сергей	Андеррайтер	Analyst	2026-10-23 23:00:03.219069+00
aaaaaaaa-eaaa-aaaa-eaaa-aaaaaaaaaaaa	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	analyst	Андрей	Смирнов	Analyst	2026-10-25 14:25:53.880151+00
cccccccc-eccc-cccc-eccc-cccccccccccc	cccccccc-cccc-cccc-cccc-cccccccccccc	analyst_test	Тест	Аналитиков	Analyst	2026-10-25 14:25:53.880151+00
\.


--
-- Data for Name: Clients; Type: TABLE DATA; Schema: client; Owner: -
--

COPY client."Clients" ("Id", "UserId", "Username", "Inn", "FirstName", "LastName", "CreatedAt") FROM stdin;
8a0940dd-9454-4c74-8020-92f2f3c1f759	68bcab96-7d94-4d06-ab0f-a29eaf1d2c60	client_test_final	500100000088	Дмитрий	Смирнов	2026-10-22 12:10:33.295408+00
7367417e-7961-4cd8-a9d2-e06a7a064c1a	fea511e8-7830-498f-8805-4c29ad7f3d1f	client_test	500100000011	Иван	Иванов	2026-10-22 20:27:40.671239+00
15c3612c-a858-495f-b0f9-4e90282a81c0	f9f2222a-49c5-46d8-9c92-be328d8d1b32	hash_test_user	500100000011	Тест	Тестов	2026-10-25 14:14:29.392732+00
d85a6692-577e-4c59-9d0d-577bc59003c9	613ddbba-c4c6-4674-a546-bf2601888d1e	client	990000000436	Мария	Мария	2026-10-25 15:27:58.497912+00
828c879d-4b2f-4a03-b274-6fd18739ba45	511f94b1-8df6-4682-acd5-de06fa8e3e4d	client1	990000000436	Мария	Кузнецова	2026-10-25 15:29:28.901592+00
877b949f-8ab4-49d6-9605-01dca2c3902b	cbbbd567-d079-415f-b90e-17526d451b86	client2	998620195652	Илья	Макаров	2026-10-25 15:30:28.267508+00
68e1e57d-b89e-40ca-be44-5cd44428bc30	0cec1640-e32f-4382-80af-ab3432a242e2	client3	999904307315	Роман	Попов	2026-10-25 15:31:12.244793+00
11111111-c111-1111-c111-111111111111	11111111-1111-1111-1111-111111111111	client1	500100000011	Иван	Иванов	2026-10-25 14:25:53.880151+00
22222222-c222-2222-c222-222222222222	22222222-2222-2222-2222-222222222222	client2	500100000022	Анна	Сидорова	2026-10-25 14:25:53.880151+00
33333333-c333-3333-c333-333333333333	33333333-3333-3333-3333-333333333333	client3	500100000033	Алексей	Кузнецов	2026-10-25 14:25:53.880151+00
44444444-c444-4444-c444-444444444444	44444444-4444-4444-4444-444444444444	client4	500100000077	Михаил	Петров	2026-10-25 14:25:53.880151+00
55555555-c555-5555-c555-555555555555	55555555-5555-5555-5555-555555555555	client5	990000000115	Сергей	Иванов	2026-10-25 14:25:53.880151+00
bbbbbbbb-cbbb-bbbb-cbbb-bbbbbbbbbbbb	bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	client_test	500100000011	Иван	Иванов	2026-10-25 14:25:53.880151+00
50e24785-6403-42fb-971e-962bf68330dd	a160108c-fc90-47ad-b98c-0917189db9c2	client6	992934509242	Виктор	Захаров	2026-10-26 08:56:05.253492+00
3eb609d3-9f88-471a-aad5-d26375965762	ee6c39e8-2462-4da0-8823-db25d9a07c98	client7	990750786404	Алексей	Соловьёв	2026-10-26 08:56:20.900573+00
20062a1d-7835-4717-9a9d-bb0785972f9d	5aea8404-da47-4d2e-883d-ffc9b1157df3	client8	998575834946	Екатерина	Николаева	2026-10-26 08:56:21.020032+00
6de6d5be-1447-40ac-8e72-d27e0d7743b1	8404810d-bd0e-4160-85f9-df7e8ffd1a80	client9	997237475355	Дарья	Кузьмина	2026-10-26 08:56:21.161299+00
a8a6e9d1-96e7-4802-ad30-b4a4d56504a6	7c05c8f1-65f7-4e31-b4d5-6762d1a53250	client10	994209132544	Татьяна	Воробьёва	2026-10-26 08:56:21.269912+00
c6276bea-79c7-4749-afea-4c9c9dfb87a6	8685faff-b338-48e7-a0f7-109c743017e3	client11	991802424801	Павел	Лебедев	2026-10-26 08:56:21.376202+00
2a80943c-fd55-4650-b000-1dab8609b94d	66cb62bf-2ecc-4b73-aec8-705942437bc7	client12	992136717200	Светлана	Попова	2026-10-26 08:56:21.48187+00
fc5bc168-44b8-44a1-a179-27060a685458	c6c29661-9eb2-4bfe-ac18-5f111512c381	client13	998924531779	Виктор	Соловьёв	2026-10-26 08:56:21.5864+00
0232e4b3-9029-4233-90fb-f1b7d4c57165	d85b88ad-d296-4818-9e66-bc66102f6cdd	client14	995940119912	Илья	Морозов	2026-10-26 08:56:21.69467+00
07094c76-f752-4124-b561-94177127b44b	728802f8-3014-41c8-abac-22248a0b7445	client15	991126723717	Илья	Семёнов	2026-10-26 08:56:21.800138+00
\.


--
-- Data for Name: ApplicationDocuments; Type: TABLE DATA; Schema: credit_app; Owner: -
--

COPY credit_app."ApplicationDocuments" ("Id", "ApplicationId", "FileName", "FileKey", "FileType", "FileSizeBytes", "Status", "UploadedAt") FROM stdin;
\.


--
-- Data for Name: Applications; Type: TABLE DATA; Schema: credit_app; Owner: -
--

COPY credit_app."Applications" ("Id", "ClientId", "Inn", "Status", "Decision", "ReasonCodes", "Stage", "Purpose", "ProductCode", "RequestedAmount", "OwnContribution", "RequestedTermMonths", "NeededByDate", "AsSoonAsPossible", "BkiConsent", "PersonalDataConsent", "HistoryStartDate", "HistoryMonths", "StatementFilePath", "ExistingMonthlyObligations", "TaxRegime", "EquipmentPrice", "EquipmentSupplier", "EquipmentList", "SupplierBillFilePath", "ChangeType", "DowntimeMonths", "ExpectedEffect", "UseOfFunds", "IsRepeatRequirement", "SeasonalityComment", "PlannedLaunchDate", "BusinessPlanFilePath", "ProjectedMonthlyRevenue", "ConservativeProjectedRevenue", "FinancialReserve", "PersonalIncome", "CreatedAt", "UpdatedAt", "MonthlyRevenue", "MonthlyExpenses", "HouseholdExpenses", "IsTaxRegimeActual", "DeclaredTaxRegime", "ReceiptCoverage", "ExpensesCoverageStatus", "HasAdditionalIncome", "AdditionalIncomeAmount", "DebtsVerificationStatus", "RepaymentSourceDescription", "ExpensePeriod", "HasExpenseContract") FROM stdin;
\.


--
-- Data for Name: Offers; Type: TABLE DATA; Schema: credit_app; Owner: -
--

COPY credit_app."Offers" ("Id", "ApprovedAmount", "TermMonths", "AnnualRatePercent", "MonthlyPayment", "IsCounterOffer", "ReasonCode", "CreatedAt") FROM stdin;
\.


--
-- Data for Name: TransitionHistory; Type: TABLE DATA; Schema: credit_app; Owner: -
--

COPY credit_app."TransitionHistory" ("Id", "ApplicationId", "FromStatus", "ToStatus", "Actor", "ReasonCode", "Comment", "Timestamp") FROM stdin;
\.


--
-- Name: RefreshTokens PK_RefreshTokens; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth."RefreshTokens"
    ADD CONSTRAINT "PK_RefreshTokens" PRIMARY KEY ("Id");


--
-- Name: Users PK_Users; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth."Users"
    ADD CONSTRAINT "PK_Users" PRIMARY KEY ("UserId");


--
-- Name: Employees PK_Employees; Type: CONSTRAINT; Schema: bank_employee; Owner: -
--

ALTER TABLE ONLY bank_employee."Employees"
    ADD CONSTRAINT "PK_Employees" PRIMARY KEY ("Id");


--
-- Name: Clients PK_Clients; Type: CONSTRAINT; Schema: client; Owner: -
--

ALTER TABLE ONLY client."Clients"
    ADD CONSTRAINT "PK_Clients" PRIMARY KEY ("Id");


--
-- Name: ApplicationDocuments ApplicationDocuments_pkey; Type: CONSTRAINT; Schema: credit_app; Owner: -
--

ALTER TABLE ONLY credit_app."ApplicationDocuments"
    ADD CONSTRAINT "ApplicationDocuments_pkey" PRIMARY KEY ("Id");


--
-- Name: Applications PK_Applications; Type: CONSTRAINT; Schema: credit_app; Owner: -
--

ALTER TABLE ONLY credit_app."Applications"
    ADD CONSTRAINT "PK_Applications" PRIMARY KEY ("Id");


--
-- Name: Offers PK_Offers; Type: CONSTRAINT; Schema: credit_app; Owner: -
--

ALTER TABLE ONLY credit_app."Offers"
    ADD CONSTRAINT "PK_Offers" PRIMARY KEY ("Id");


--
-- Name: TransitionHistory PK_TransitionHistory; Type: CONSTRAINT; Schema: credit_app; Owner: -
--

ALTER TABLE ONLY credit_app."TransitionHistory"
    ADD CONSTRAINT "PK_TransitionHistory" PRIMARY KEY ("Id");


--
-- Name: IX_RefreshTokens_Token; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX "IX_RefreshTokens_Token" ON auth."RefreshTokens" USING btree ("Token");


--
-- Name: IX_RefreshTokens_UserId; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX "IX_RefreshTokens_UserId" ON auth."RefreshTokens" USING btree ("UserId");


--
-- Name: IX_Users_Inn; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX "IX_Users_Inn" ON auth."Users" USING btree ("Inn");


--
-- Name: IX_Users_Username; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX "IX_Users_Username" ON auth."Users" USING btree ("Username");


--
-- Name: IX_Employees_UserId; Type: INDEX; Schema: bank_employee; Owner: -
--

CREATE UNIQUE INDEX "IX_Employees_UserId" ON bank_employee."Employees" USING btree ("UserId");


--
-- Name: IX_Clients_Inn; Type: INDEX; Schema: client; Owner: -
--

CREATE INDEX "IX_Clients_Inn" ON client."Clients" USING btree ("Inn");


--
-- Name: IX_Clients_UserId; Type: INDEX; Schema: client; Owner: -
--

CREATE UNIQUE INDEX "IX_Clients_UserId" ON client."Clients" USING btree ("UserId");


--
-- Name: IX_ApplicationDocuments_ApplicationId; Type: INDEX; Schema: credit_app; Owner: -
--

CREATE INDEX "IX_ApplicationDocuments_ApplicationId" ON credit_app."ApplicationDocuments" USING btree ("ApplicationId");


--
-- Name: IX_ApplicationDocuments_UploadedAt; Type: INDEX; Schema: credit_app; Owner: -
--

CREATE INDEX "IX_ApplicationDocuments_UploadedAt" ON credit_app."ApplicationDocuments" USING btree ("UploadedAt");


--
-- Name: IX_Applications_ClientId; Type: INDEX; Schema: credit_app; Owner: -
--

CREATE INDEX "IX_Applications_ClientId" ON credit_app."Applications" USING btree ("ClientId");


--
-- Name: IX_Applications_Inn; Type: INDEX; Schema: credit_app; Owner: -
--

CREATE INDEX "IX_Applications_Inn" ON credit_app."Applications" USING btree ("Inn");


--
-- Name: IX_Applications_Status; Type: INDEX; Schema: credit_app; Owner: -
--

CREATE INDEX "IX_Applications_Status" ON credit_app."Applications" USING btree ("Status");


--
-- Name: IX_TransitionHistory_ApplicationId; Type: INDEX; Schema: credit_app; Owner: -
--

CREATE INDEX "IX_TransitionHistory_ApplicationId" ON credit_app."TransitionHistory" USING btree ("ApplicationId");


--
-- Name: IX_TransitionHistory_Timestamp; Type: INDEX; Schema: credit_app; Owner: -
--

CREATE INDEX "IX_TransitionHistory_Timestamp" ON credit_app."TransitionHistory" USING btree ("Timestamp");


--
-- Name: RefreshTokens FK_RefreshTokens_Users_UserId; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth."RefreshTokens"
    ADD CONSTRAINT "FK_RefreshTokens_Users_UserId" FOREIGN KEY ("UserId") REFERENCES auth."Users"("UserId") ON DELETE CASCADE;


--
-- Name: Offers FK_Offers_Applications_Id; Type: FK CONSTRAINT; Schema: credit_app; Owner: -
--

ALTER TABLE ONLY credit_app."Offers"
    ADD CONSTRAINT "FK_Offers_Applications_Id" FOREIGN KEY ("Id") REFERENCES credit_app."Applications"("Id") ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


