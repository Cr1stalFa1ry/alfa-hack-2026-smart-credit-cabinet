--
-- PostgreSQL database dump
--


-- Dumped from database version 18.4
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
5a98fe0a-5075-4818-ab97-772b9dee75cd	e3bb8e66-8b28-4d09-aa81-915ffb16a282	JSzPgnz1mTsnXF+hY46EevbqQxvozz9/aPJg5M2bOvs=	2026-10-30 00:29:40.47841+03	2026-10-23 00:29:40.478382+03	2026-10-23 00:54:29.613289+03	\N
2f7774af-3956-4424-8c5c-4116c7e4c797	e3bb8e66-8b28-4d09-aa81-915ffb16a282	m30PU1OPQYDLAQ8RS9cW7kMgOkd4/jTzSoFXezmxEdQ=	2026-10-30 11:29:50.600896+03	2026-10-23 11:29:50.600865+03	2026-10-23 11:51:07.832042+03	\N
bdf63ebc-dbe2-44cb-be65-3a5056913c03	0cec1640-e32f-4382-80af-ab3432a242e2	4o9guHnXMy1QMW6X5ePLRhYtM9rNu2hOhK+q8GBmd2k=	2026-11-01 18:31:12.242595+03	2026-10-25 18:31:12.242595+03	2026-10-25 18:31:17.576299+03	\N
635095d5-9618-4aec-81aa-b15782e24ba3	e3bb8e66-8b28-4d09-aa81-915ffb16a282	hCZuwmWDGpGF9gwyCCgLlF32itkMrO9hDEMJnxDJJYs=	2026-10-31 01:21:13.01064+03	2026-10-24 01:21:13.01061+03	2026-10-24 01:26:49.072504+03	\N
3c84d021-aaa3-44f2-b3d2-00284986fc33	e3bb8e66-8b28-4d09-aa81-915ffb16a282	pVgBM5lZ4FpvlP9dEzZn9n0qEtPv0possqhyEV2LeoA=	2026-10-31 02:16:18.05778+03	2026-10-24 02:16:18.05778+03	2026-10-24 02:17:48.241317+03	\N
f9b5062a-7b95-49bc-a7b7-3910ba13eb6b	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	WSt0xEYnfFcDdOXWrj0ZLK7PmQkW8toILHU9SiReWSo=	2026-11-01 17:21:15.493813+03	2026-10-25 17:21:15.493813+03	\N	\N
29a382c5-41cd-4e01-8251-64796aff7460	e3bb8e66-8b28-4d09-aa81-915ffb16a282	VRxYiX348pL6GiNPzPUVNN/QA2FuiW5TZdIDA2/Sq3s=	2026-11-01 16:33:43.997588+03	2026-10-25 16:33:43.99756+03	2026-10-25 17:33:06.599163+03	\N
5a68747d-724d-46b9-8792-6fb541cbbfa5	cbbbd567-d079-415f-b90e-17526d451b86	RswP4kSG2DW15W09Y2telRJ6MU4xu0v1BfQAVg2oxJY=	2026-11-01 18:30:28.261166+03	2026-10-25 18:30:28.261166+03	\N	\N
06d70da8-b922-473e-a304-96f261420a45	cbbbd567-d079-415f-b90e-17526d451b86	DlBqqgBfnya8+A2GcZzTNCOLOWlWQLjZDIm0zOvFizc=	2026-11-01 18:43:56.438778+03	2026-10-25 18:43:56.438778+03	\N	\N
e55ce8e8-7650-422d-be9d-2193bec26ab4	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	5Okb4nHkBZ/Cz5fHNNs/Fetl8y2nr+t+APisAx7fCh4=	2026-11-01 18:43:56.642586+03	2026-10-25 18:43:56.642586+03	\N	\N
0d8842f3-e0e3-4c83-98a3-e716d78e05a9	cbbbd567-d079-415f-b90e-17526d451b86	GJoFYcpkiwiTkccxf1eLJArgGPSv96o5/8U/Xb4z/3o=	2026-11-01 18:44:07.493828+03	2026-10-25 18:44:07.493828+03	\N	\N
9541b08a-c0e0-4531-97d4-57067e96bc5c	511f94b1-8df6-4682-acd5-de06fa8e3e4d	g+zAE/EkU16/fYI3uZTjEo8a1WqdICAs+EX2kAx5I3g=	2026-11-01 18:31:34.767781+03	2026-10-25 18:31:34.767781+03	2026-10-25 18:47:37.065874+03	\N
4e79a5da-575a-408d-b9a5-8ae7637848a0	cbbbd567-d079-415f-b90e-17526d451b86	83lvN/U6/K+ujw7iv7/blSmGDZXs+GdcbcPZIM30gME=	2026-11-01 18:50:13.636877+03	2026-10-25 18:50:13.636877+03	\N	\N
c3cfe643-fd54-44f7-bcb5-c42274ab2614	cbbbd567-d079-415f-b90e-17526d451b86	A1qDwSOzwkWyb5Mv3Uvhidp8ELKcqdcT40pavCc3Uo4=	2026-11-01 18:50:25.83794+03	2026-10-25 18:50:25.83794+03	\N	\N
0879aa54-07dc-444e-b067-43aef8ac39e0	0cec1640-e32f-4382-80af-ab3432a242e2	fcQ7FysgIcKqfihjxCQyAlfs7NeroHs1+YAidGBO0Lo=	2026-11-01 18:47:53.174556+03	2026-10-25 18:47:53.174556+03	2026-10-25 18:57:06.756439+03	\N
91ecd1d9-18db-43ea-8221-16bf985a3730	cbbbd567-d079-415f-b90e-17526d451b86	oQtsvNQLaNuAMbksAt10oB+O6M3cUZg+ciiLrdr8ies=	2026-11-01 18:57:16.838139+03	2026-10-25 18:57:16.838139+03	2026-10-25 19:38:09.168596+03	\N
3af90e9f-fe8b-48a1-8bc7-d1c20a8f5181	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	HK9PN7vEANVUyaV2D74HuuBd1ac5ee4wyyNyocsPjok=	2026-11-01 19:38:22.206152+03	2026-10-25 19:38:22.206152+03	2026-10-25 19:40:22.361264+03	\N
be46a1c8-12de-47e8-a6ba-1be40a505863	0cec1640-e32f-4382-80af-ab3432a242e2	1PG9LZQq4jRJVwJFMC4XCX8IxSXJ3zfWoAD+UtxIGok=	2026-11-01 19:40:28.084944+03	2026-10-25 19:40:28.084944+03	\N	\N
85c0743a-a9e4-45e6-80cf-caca28855633	0cec1640-e32f-4382-80af-ab3432a242e2	nbENxoe5acLvfgWGOqi9/0FzEfhy9F0QPaZWhlZphmY=	2026-11-01 20:17:13.908951+03	2026-10-25 20:17:13.908901+03	\N	\N
23a2c878-b0e4-49d5-b944-7cbb4f36e0af	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	+MzMT9EdgHbP4V4bE2nLKcKMY2KIPiFyJJrHotb8L9Y=	2026-11-01 20:22:32.759014+03	2026-10-25 20:22:32.759014+03	2026-10-25 20:27:21.678272+03	\N
26be245d-235e-42ae-8915-074dae9df70f	0cec1640-e32f-4382-80af-ab3432a242e2	4KQgK3FP89uOCR+qFlT0v9t1eRYzlFrSF7mbg3iXNfc=	2026-11-01 20:27:30.128479+03	2026-10-25 20:27:30.128479+03	2026-10-25 20:28:03.387144+03	\N
6e15f7f6-dc3a-4765-b44a-c9d3c91feaae	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	iNruM0EK3p+a3ElqnzqiOJnS72CexbrM77Ew6P0swv0=	2026-11-01 20:28:36.210311+03	2026-10-25 20:28:36.210311+03	\N	\N
f8792d90-ea23-4f00-839b-e0e0cb1958f2	511f94b1-8df6-4682-acd5-de06fa8e3e4d	bmBag7F97O/BwMrXiyOjlirQeJCV6T3iNKNdPYEYky4=	2026-11-01 20:29:50.187423+03	2026-10-25 20:29:50.187423+03	2026-10-25 20:29:58.234836+03	\N
1132b1fd-c52c-4ac1-8a60-efca957ae9ff	0cec1640-e32f-4382-80af-ab3432a242e2	Aov0yMTOakGFAeRBQlOzMM3OKXWkv2A7muUqKARQpYY=	2026-11-01 20:30:03.273924+03	2026-10-25 20:30:03.273924+03	2026-10-25 21:37:30.817062+03	rzV1UPiSkSmggxAGNhAjAHRmzJwDrK9VVO9Qji6zeKE=
4e7de611-5688-45d6-91aa-4a529a517192	0cec1640-e32f-4382-80af-ab3432a242e2	rzV1UPiSkSmggxAGNhAjAHRmzJwDrK9VVO9Qji6zeKE=	2026-11-01 21:37:30.81692+03	2026-10-25 21:37:30.816888+03	2026-10-25 21:37:36.684864+03	\N
106bf151-da0b-43ab-bdf9-21276ec606e9	cbbbd567-d079-415f-b90e-17526d451b86	JFk6yuLtEYN9W1Rs257E20wHk8oWUONMb8yHrKerQ3I=	2026-11-01 21:37:52.260404+03	2026-10-25 21:37:52.260404+03	2026-10-25 21:37:58.053322+03	\N
14a11436-793b-4bf3-ad8a-f74563038257	511f94b1-8df6-4682-acd5-de06fa8e3e4d	DfeApiE+Se96EY9bGR5YP26iThByDXhKO6VQS7gGgfQ=	2026-11-01 21:38:02.683378+03	2026-10-25 21:38:02.683378+03	2026-10-25 22:39:46.344379+03	QrqUSpia8svbYgUpaCREgFoH7NTC4jGAeLoHh4ug4cE=
e7ba7eac-6a10-4166-bf89-030bc2012d8c	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	pW9Gi7j4Ii6aqu9CIOsUNI0Fx/qF048v1cjcyuJXH9U=	2026-11-01 22:45:19.867077+03	2026-10-25 22:45:19.867077+03	\N	\N
0567eab8-0757-460d-9719-c9b257b37468	511f94b1-8df6-4682-acd5-de06fa8e3e4d	s1hiiotcLMW/OM9dqtvFh4YDsEmVgcZomyl3t9UTKyo=	2026-11-01 18:45:02.811579+03	2026-10-25 18:45:02.811579+03	2026-10-25 23:45:29.180916+03	\N
0def9ff1-3a1c-4587-b321-d59f2f6f58e2	511f94b1-8df6-4682-acd5-de06fa8e3e4d	j9qpijuqUXFxOuvHvqygAfnqB/NwPCO5FCDqha8NDkU=	2026-11-01 19:16:42.815992+03	2026-10-25 19:16:42.815992+03	2026-10-25 23:45:29.180916+03	\N
17230a58-9b59-4783-b7e1-fe9d5fb12c25	511f94b1-8df6-4682-acd5-de06fa8e3e4d	0QVjH7HY6ln7yF7a1sVIfYno+urElK7MGskT0oH8RCY=	2026-11-01 18:29:28.896466+03	2026-10-25 18:29:28.896466+03	2026-10-25 23:45:29.180916+03	\N
19686598-9df3-4904-986e-e2f69dcd4077	511f94b1-8df6-4682-acd5-de06fa8e3e4d	R20HQhQHsFt7p/1ErlBl8CXET6DU32fnmcXj2YwguLg=	2026-11-01 19:17:03.327355+03	2026-10-25 19:17:03.327355+03	2026-10-25 23:45:29.180916+03	\N
1a786c6a-d066-4d9c-b68d-253370b298f0	511f94b1-8df6-4682-acd5-de06fa8e3e4d	kRXlQjH2O5Ex8OSayALoQk4kjLHsqj6p5gGpKfrrYio=	2026-11-01 18:43:56.229886+03	2026-10-25 18:43:56.229886+03	2026-10-25 23:45:29.180778+03	\N
26cca418-42e4-4f98-adc2-708b031be4e3	511f94b1-8df6-4682-acd5-de06fa8e3e4d	souy8Zkw91/YYjaLFYEqRUSzARTIsEG+BhKmJpm2apg=	2026-11-01 19:16:50.269644+03	2026-10-25 19:16:50.269644+03	2026-10-25 23:45:29.180916+03	\N
45b1501f-02f3-4546-a483-17a823f3ec3b	511f94b1-8df6-4682-acd5-de06fa8e3e4d	YLNuAB31Er5vofufkb1AmImQhHhD7fn8ekPYem5SfPE=	2026-11-01 23:37:20.554213+03	2026-10-25 23:37:20.554186+03	2026-10-25 23:45:29.180916+03	\N
add758e9-5188-4033-b676-e201046056ac	511f94b1-8df6-4682-acd5-de06fa8e3e4d	CtlCu4Vq7Epv6ovVjJnxBVnvXq8v3hqfNxlmvb6Iw2o=	2026-11-01 22:54:30.226138+03	2026-10-25 22:54:30.226138+03	2026-10-25 23:45:29.180916+03	\N
e5ab2509-f507-408c-a627-89f91a6f3fc6	511f94b1-8df6-4682-acd5-de06fa8e3e4d	QrqUSpia8svbYgUpaCREgFoH7NTC4jGAeLoHh4ug4cE=	2026-11-01 22:39:46.344199+03	2026-10-25 22:39:46.344169+03	2026-10-25 23:45:29.180916+03	\N
09181833-5c25-42c9-8395-2ebebf3d35a2	e3bb8e66-8b28-4d09-aa81-915ffb16a282	ina9U8WR92TIPP0A7L0G/sCEYIZEs3QX5boXjXqP8Zw=	2026-11-01 23:45:40.444823+03	2026-10-25 23:45:40.444823+03	2026-10-25 23:45:57.129226+03	\N
5fbef307-f2eb-47d0-a86c-7f8b17f0a5a9	e3bb8e66-8b28-4d09-aa81-915ffb16a282	Vsu97WJQFmjuV9SWG41dAlj2zV24nEOqyIIiYR3fzqI=	2026-10-29 19:26:53.055288+03	2026-10-22 19:26:53.05526+03	2026-10-25 23:45:57.129226+03	\N
a9cfd59a-38ac-49fc-a00a-da0b49772ebb	e3bb8e66-8b28-4d09-aa81-915ffb16a282	sF28Rn25MI5aM7ulhxrMxVjRgPGsbx7nGyAhKq5GCko=	2026-10-30 00:03:00.4532+03	2026-10-23 00:03:00.453172+03	2026-10-25 23:45:57.129226+03	\N
c6e27c57-5a50-4f1a-abac-67c90acd3dab	e3bb8e66-8b28-4d09-aa81-915ffb16a282	nJ/CIlSNWSrcG/MAi+Z1hz9nngkf+Kj4KOynChtwGPQ=	2026-10-31 01:53:22.140244+03	2026-10-24 01:53:22.140206+03	2026-10-25 23:45:57.129226+03	\N
d0b24334-ed3b-4b1f-a363-8b4b2f85a89f	e3bb8e66-8b28-4d09-aa81-915ffb16a282	DN9ZvGQvSE4DhiehJSxFG7ozMuD7Jt3bqdNeajxxI+I=	2026-10-29 15:01:53.985803+03	2026-10-22 15:01:53.985735+03	2026-10-25 23:45:57.129225+03	\N
ed6d226f-bf25-4bf8-8a2c-3f8c843b34c7	e3bb8e66-8b28-4d09-aa81-915ffb16a282	X1uo3vKBZha9fFpdKA+Con2onEpsPHb/spXybypK0oE=	2026-10-31 01:31:33.708157+03	2026-10-24 01:31:33.708157+03	2026-10-25 23:45:57.129226+03	\N
f67ea7f3-80e5-4453-a4a1-b0328ea5e2e6	e3bb8e66-8b28-4d09-aa81-915ffb16a282	WHvaEYN9Af+byMJulAkRpQSqkqVAecE9uQPa/6TAcF0=	2026-10-31 02:18:00.851825+03	2026-10-24 02:18:00.851825+03	2026-10-25 23:45:57.129226+03	\N
160d2c7f-1e6e-4420-bafc-59d385142265	cbbbd567-d079-415f-b90e-17526d451b86	NZxOKqmyiVbqiwag8sk6eT5DA756rqd0doWCyD5FWPE=	2026-11-01 23:02:57.707827+03	2026-10-25 23:02:57.707827+03	2026-10-26 00:03:29.02916+03	jUQFqcLaojZZeZc8A7+Ij8ZU6Cm0AatWywc8/tUN4w8=
690016d4-a4a7-42df-be79-6c499db685b8	cbbbd567-d079-415f-b90e-17526d451b86	U02/7Qbm5OAjYEO2pHFauGDCKg8mYy0tPC7KO/1gxfE=	2026-11-01 23:37:58.4487+03	2026-10-25 23:37:58.4487+03	2026-10-26 00:26:06.074116+03	\N
bf3c2183-39da-44d6-b1ef-14d3160448c9	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	y2gD5XzUxApg6ZXM0v2Je4X0RwEvWReDG2tAQA4aWZg=	2026-11-02 00:26:29.303939+03	2026-10-26 00:26:29.30391+03	2026-10-26 01:29:49.068652+03	m6A/Lfarq7/sMTIOHJ6symWn0A68xOIMYF4Txn2XSvI=
de1a08a9-816d-4b2a-a3c0-0020fa7f36c7	cbbbd567-d079-415f-b90e-17526d451b86	jUQFqcLaojZZeZc8A7+Ij8ZU6Cm0AatWywc8/tUN4w8=	2026-11-02 00:03:29.029157+03	2026-10-26 00:03:29.029157+03	2026-10-26 01:04:22.255254+03	Iz63iEgMTxxUbdGE6LsuekAoqlHFJ0GORj7F6fPdogM=
5c31c6b7-271a-4524-9eb4-af3e0608b2a2	cbbbd567-d079-415f-b90e-17526d451b86	Iz63iEgMTxxUbdGE6LsuekAoqlHFJ0GORj7F6fPdogM=	2026-11-02 01:04:22.255135+03	2026-10-26 01:04:22.255099+03	2026-10-26 02:15:12.953161+03	dy+riiUwLYunMTgzob1oLkIS5XZAiulcnecw40Nn0iU=
6895f5ff-cdb9-4c7d-b29d-dfe777cf6ccd	cbbbd567-d079-415f-b90e-17526d451b86	dy+riiUwLYunMTgzob1oLkIS5XZAiulcnecw40Nn0iU=	2026-11-02 02:15:12.953015+03	2026-10-26 02:15:12.952983+03	2026-10-26 02:15:22.508114+03	\N
4b1d0795-9e64-4eac-a859-3aa9f29d671c	0cec1640-e32f-4382-80af-ab3432a242e2	/qYsT6RwwMp1T6S6nkGmpHWxE9wxmhxDTwsZPP2/IpE=	2026-11-02 02:16:12.780186+03	2026-10-26 02:16:12.780186+03	\N	\N
7ea6edbb-f74c-4766-b711-d4dab14bbb69	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	m6A/Lfarq7/sMTIOHJ6symWn0A68xOIMYF4Txn2XSvI=	2026-11-02 01:29:49.068647+03	2026-10-26 01:29:49.068646+03	2026-10-26 10:48:48.375894+03	Mb02/jpdhCRbhMejwsbC//THfXVqhmoK7HOdXqAk/7M=
71b12349-0d61-475f-aad0-d1774d8f89b4	cbbbd567-d079-415f-b90e-17526d451b86	WyB1ryhUqKesc8xJo+r8zEQbWukuArFXO2nk5mVA1Aw=	2026-11-02 10:49:18.28396+03	2026-10-26 10:49:18.28396+03	2026-10-26 10:50:00.597327+03	\N
2e4afb37-353b-4b2d-a47d-6383147a04ef	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	Mb02/jpdhCRbhMejwsbC//THfXVqhmoK7HOdXqAk/7M=	2026-11-02 10:48:48.375765+03	2026-10-26 10:48:48.375735+03	2026-10-26 11:50:15.747112+03	r3Myoz1BOCX+bd30dI2jxQBLWKhlK/OKtmwirDbETJM=
2ada0019-54d5-4ca7-bae5-f358b051a45a	0cec1640-e32f-4382-80af-ab3432a242e2	TYZw8a1B+0+h9hP11hfhi0O92C1UiI5zIKx57+6YsY4=	2026-11-02 10:50:13.15681+03	2026-10-26 10:50:13.15681+03	2026-10-26 11:51:04.521945+03	5nBVe7vWkvC1Eqj5egn2dqt8/pjoKEALgAaqIbNSHzA=
a0db5f8c-4815-4f26-a657-8a0689df1327	55555555-5555-5555-5555-555555555555	xyv6nqH67WXTSElArN334jFkBFmTe/T0YnjbVGaKHU8=	2026-11-02 11:55:47.891715+03	2026-10-26 11:55:47.891715+03	\N	\N
d15e5669-9b6d-487e-b52c-7571e3b0e9d7	a160108c-fc90-47ad-b98c-0917189db9c2	Bam2VRDKwITg+ACQjNDVHIHI5F8kTrNe2AkoGMOCb9Y=	2026-11-02 11:56:05.24752+03	2026-10-26 11:56:05.24752+03	\N	\N
f420cfea-67bf-43d4-a98c-a8b9dcdefa00	ee6c39e8-2462-4da0-8823-db25d9a07c98	TSKE1NqC8YcbKrA75sqGd0//tY0uMWjgEVuCTZ4AO8A=	2026-11-02 11:56:20.897371+03	2026-10-26 11:56:20.897371+03	\N	\N
f5995859-feda-4030-af89-1b97fbc0b7bb	5aea8404-da47-4d2e-883d-ffc9b1157df3	MkYvlfoXgd2yQVMftQ1+BQR1oZuMgY/FEa9rN4zkJMU=	2026-11-02 11:56:21.014341+03	2026-10-26 11:56:21.014341+03	\N	\N
7655e6e9-96d0-48a2-a48b-270ad2383094	8404810d-bd0e-4160-85f9-df7e8ffd1a80	cxJr707x6YWIyCUvW0BmcVJc1bZPelAUejBOthvVXLY=	2026-11-02 11:56:21.159635+03	2026-10-26 11:56:21.159635+03	\N	\N
5d44e01a-3ea6-46d0-b8d5-05706fa3c05d	7c05c8f1-65f7-4e31-b4d5-6762d1a53250	roioAH3knSkWvCyhkQfJuinujwXqnn2npZgSR64TFRs=	2026-11-02 11:56:21.268588+03	2026-10-26 11:56:21.268588+03	\N	\N
7e3db350-a119-4419-9523-5cbff34e724f	8685faff-b338-48e7-a0f7-109c743017e3	H2Wv5NrMbpMzA/4aNKCXTlJMtfzzT67SDzWG3r5tgtA=	2026-11-02 11:56:21.374084+03	2026-10-26 11:56:21.374084+03	\N	\N
d92d88fd-c122-44d5-bc7a-2319e7385d04	66cb62bf-2ecc-4b73-aec8-705942437bc7	NO/hh3789jpleRPSkytm6TFLfK/CRS8F6dlIjQxiNjM=	2026-11-02 11:56:21.480741+03	2026-10-26 11:56:21.480741+03	\N	\N
6aace771-f557-486a-a5e7-f048d75a91ab	c6c29661-9eb2-4bfe-ac18-5f111512c381	qENsd5lwd+6ezPe9xCtXB5dqpbHi6w6N3RhwbOYAQyU=	2026-11-02 11:56:21.585249+03	2026-10-26 11:56:21.585249+03	\N	\N
7a3f2ff0-bda0-4b3a-954a-db937abcf9b4	d85b88ad-d296-4818-9e66-bc66102f6cdd	NlxjmYBOJVozogOhRdnAkapTEB2W/LAE8RGHHmWSMd0=	2026-11-02 11:56:21.693165+03	2026-10-26 11:56:21.693165+03	\N	\N
7f6ab9d1-af93-475b-b3e0-cec27abf185d	728802f8-3014-41c8-abac-22248a0b7445	2bLCfRECHV3ahP/Yv5ndIe08WDkBV9TS8/AwSS1ApSw=	2026-11-02 11:56:21.798453+03	2026-10-26 11:56:21.798453+03	\N	\N
ae8993e4-c457-49aa-9f49-53f6a7e28434	a160108c-fc90-47ad-b98c-0917189db9c2	0IsW1NDx9UHXEopu72lqDGtz17lspH4LxmlEmfK+3uE=	2026-11-02 11:56:26.676643+03	2026-10-26 11:56:26.676643+03	\N	\N
bb242fde-ae99-42b5-9b05-115b2c54958e	728802f8-3014-41c8-abac-22248a0b7445	RC/O8B2B/lBLuSz2uPNxZPCxBuqA1ikRC6mvXyb/Uhw=	2026-11-02 11:56:31.790784+03	2026-10-26 11:56:31.790784+03	\N	\N
68b2a6ba-d95e-4be7-ad48-fd31ac354d42	511f94b1-8df6-4682-acd5-de06fa8e3e4d	byYvKDtPp2xwNI+/IvD52KP9I+Ei3vPj2yZJQexhk2U=	2026-11-02 11:59:29.716371+03	2026-10-26 11:59:29.716371+03	\N	\N
f92d9da1-b257-4bed-ba13-440a5e49c5ad	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	owr+u59A9SR0DOyuX1kBmU9EmZqr+foi84Gh7D/3CJc=	2026-11-02 11:59:47.398391+03	2026-10-26 11:59:47.398391+03	\N	\N
7ae72b77-f219-4873-968d-8af80496f0aa	511f94b1-8df6-4682-acd5-de06fa8e3e4d	7pSi7OnHekvw/9TbIhgiHsAXjOYuukZ+cLCoVhLzBwQ=	2026-11-02 12:39:28.862334+03	2026-10-26 12:39:28.862327+03	\N	\N
2fa9d8ae-97cf-4411-b6b5-92a63927e858	511f94b1-8df6-4682-acd5-de06fa8e3e4d	0bu0n9NDGT3MseYY65eyJ7NaSL1HTJ4upfeX+QX/kdU=	2026-11-02 12:39:38.136487+03	2026-10-26 12:39:38.136487+03	\N	\N
46fdfadb-fcb9-48be-8ffa-18263e7c2994	cbbbd567-d079-415f-b90e-17526d451b86	HsK5KAEzkXHzLSTwdlaSD+WyDSNHs0ZF/xJIA7nGt4E=	2026-11-02 12:39:38.24438+03	2026-10-26 12:39:38.24438+03	\N	\N
b51e8bf8-47dd-4488-b8db-3175cff85591	0cec1640-e32f-4382-80af-ab3432a242e2	WpehQXQqif8fTdtQ7C0xuU5YW+AMrh6LghsRPNmxGg0=	2026-11-02 12:39:38.34877+03	2026-10-26 12:39:38.34877+03	\N	\N
59d8e710-df1a-4094-ac14-72a64742dd53	44444444-4444-4444-4444-444444444444	pB3YsC0tiR9fofBS+QbajnqXeATeTLMOsGi5KOHci6U=	2026-11-02 12:39:38.451775+03	2026-10-26 12:39:38.451775+03	\N	\N
729a53d2-1353-4110-aaf4-80d472a1b8cc	55555555-5555-5555-5555-555555555555	sUUBCbViD2pUj6fOAuPlRFrW3cmAPnGf2W3hBgNmyq4=	2026-11-02 12:39:38.558814+03	2026-10-26 12:39:38.558814+03	\N	\N
16185958-2abc-4c3a-9e4e-95741fb2327b	a160108c-fc90-47ad-b98c-0917189db9c2	6vnGPUUJrLrDxAd+pd/EHslKZR42roOLJzelPnOny0M=	2026-11-02 12:39:38.663841+03	2026-10-26 12:39:38.663841+03	\N	\N
c1c51177-863e-4708-9cba-38cbe545d57c	0cec1640-e32f-4382-80af-ab3432a242e2	5nBVe7vWkvC1Eqj5egn2dqt8/pjoKEALgAaqIbNSHzA=	2026-11-02 11:51:04.521941+03	2026-10-26 11:51:04.521941+03	2026-10-26 12:51:58.687083+03	XsEbPHuArsT7+8Eydk+pjjEmDByEMonvnTXPJWyP7Ig=
abd88b03-951f-4a42-81f2-86c841a6d14e	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	r3Myoz1BOCX+bd30dI2jxQBLWKhlK/OKtmwirDbETJM=	2026-11-02 11:50:15.74692+03	2026-10-26 11:50:15.746892+03	2026-10-26 12:54:13.275101+03	x3E5s3F94hmx70AU0qjUS/SVvUN2YRiEQbyabBQzDkk=
d572578f-1303-437e-96e8-20cd6aba0a7d	0cec1640-e32f-4382-80af-ab3432a242e2	XsEbPHuArsT7+8Eydk+pjjEmDByEMonvnTXPJWyP7Ig=	2026-11-02 12:51:58.687035+03	2026-10-26 12:51:58.687035+03	2026-10-26 13:54:48.488637+03	QktO68tJmgMy01MnSpAl57raRd7wC+2sqmdDrDFrZsw=
272e243f-0801-4134-8498-8af2a571e2b0	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	x3E5s3F94hmx70AU0qjUS/SVvUN2YRiEQbyabBQzDkk=	2026-11-02 12:54:13.275087+03	2026-10-26 12:54:13.275087+03	2026-10-26 13:56:07.209924+03	2UgcrBs6kw/rP7NMN24IsySee7R6dhbhF69o4xEnKhw=
9b5ae711-14aa-4812-a0e7-6f80af142e06	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	EY75mIkua1W+z8AA+YEkR/ByUwrpnduwAtQQoO6bWGo=	2026-11-02 14:24:57.954155+03	2026-10-26 14:24:57.954128+03	\N	\N
9ce72986-d441-484f-b9eb-c05c1be932bb	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	mN4tU0yTL+IvTymE0avrbg6dbJNoygB98PIEryvLoVQ=	2026-11-02 14:25:31.626583+03	2026-10-26 14:25:31.626583+03	\N	\N
2e5a9e54-8f70-464b-b039-a08b13bb4db3	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	ANhwmVyQ7Rj1T3J1QkKnvAKPpdzmUczsziuxEhoqq0o=	2026-11-02 14:26:55.142224+03	2026-10-26 14:26:55.142224+03	\N	\N
ddc8a9e6-9aaa-4ed7-8f43-2107415c45b4	0cec1640-e32f-4382-80af-ab3432a242e2	2ge5ApFgVRu2sL/3YiReZcnoZGB5yXcANHjbpE6Cn94=	2026-11-02 14:32:52.217559+03	2026-10-26 14:32:52.217559+03	\N	\N
8c37ec87-735e-443a-9dcf-a4502a24e686	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	trwR+lI2VogvCe+OEdg7xE2Q3n69vtCMkrtWE54Z6sY=	2026-11-02 14:33:22.263011+03	2026-10-26 14:33:22.263003+03	\N	\N
0e44284f-9452-4625-bc67-c772ff54a696	0cec1640-e32f-4382-80af-ab3432a242e2	+6IXCLjkOU4kpWNXYx/VV0Clp7mxh4azx0y3+W20t0k=	2026-11-02 14:33:22.746714+03	2026-10-26 14:33:22.746714+03	\N	\N
78e786dc-2ded-42b8-82d7-397f8f3f24e7	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	ZKvb4C+g6PVax5Mkt7FvVv8X/Iw231mlRif+LS+Be4I=	2026-11-02 14:34:20.525312+03	2026-10-26 14:34:20.525312+03	\N	\N
580697f6-34e6-41c6-ad34-33b099c541a6	0cec1640-e32f-4382-80af-ab3432a242e2	ih4TN39gmhswMEGv2HpBPC/BNEJ+SjgH2S3+6MARtQw=	2026-11-02 14:34:20.712575+03	2026-10-26 14:34:20.712575+03	\N	\N
ac9afb6f-f073-4ed8-9fea-820c8dda7829	0cec1640-e32f-4382-80af-ab3432a242e2	GWfM4aTCkzAoWQx8nyaSpBPHcgEXPdO2Azo2VP7lRwM=	2026-11-02 14:42:24.280674+03	2026-10-26 14:42:24.280667+03	\N	\N
f7b5c584-fb91-4495-b037-1f895c02441f	cbbbd567-d079-415f-b90e-17526d451b86	UjGDCVlXoGcwuNVQUz2h/RCGHAF0rMJR9Bk/Asg+cow=	2026-11-02 14:42:38.995222+03	2026-10-26 14:42:38.995222+03	\N	\N
8ada91d6-6afe-40a3-a827-14120640aaaa	0cec1640-e32f-4382-80af-ab3432a242e2	QktO68tJmgMy01MnSpAl57raRd7wC+2sqmdDrDFrZsw=	2026-11-02 13:54:48.488502+03	2026-10-26 13:54:48.488469+03	2026-10-26 14:55:50.364473+03	quNhfkqojiY+na7NqiK7bzQMb4XDScUZu1tcZIcnVD8=
f6676e64-9c41-4040-97e1-b553c50f8be5	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	2UgcrBs6kw/rP7NMN24IsySee7R6dhbhF69o4xEnKhw=	2026-11-02 13:56:07.209923+03	2026-10-26 13:56:07.209923+03	2026-10-26 14:57:20.364983+03	fEPYcu2iSxbzQ78uYXjE4yznWwP71pRhjyO4U1jaLdw=
30a209aa-25d1-4c91-b4cf-4d49caff8aaa	0cec1640-e32f-4382-80af-ab3432a242e2	6AtfcNdqWx97aoUv0mr4VM6Hir3o+8JYIyOTRSDQTT8=	2026-11-02 14:58:47.293145+03	2026-10-26 14:58:47.293145+03	\N	\N
51e229b1-d6e6-4643-987a-3840c57671a5	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	4+vfZ5Ic8MNWKaF+cLDsMCbzQvR/ziPof0GVu6sXZ7U=	2026-11-02 14:58:47.405515+03	2026-10-26 14:58:47.405515+03	\N	\N
4046148a-8c48-406a-9ace-4724fe2fbe0f	0cec1640-e32f-4382-80af-ab3432a242e2	quNhfkqojiY+na7NqiK7bzQMb4XDScUZu1tcZIcnVD8=	2026-11-02 14:55:50.364324+03	2026-10-26 14:55:50.36429+03	2026-10-26 15:28:24.372501+03	\N
5638f382-eef6-436b-9fd2-38f362a374d7	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	fEPYcu2iSxbzQ78uYXjE4yznWwP71pRhjyO4U1jaLdw=	2026-11-02 14:57:20.364972+03	2026-10-26 14:57:20.364972+03	2026-10-26 15:28:58.873672+03	\N
5b8eb776-6843-47d8-9c1b-1277c1911971	511f94b1-8df6-4682-acd5-de06fa8e3e4d	qoj0D7daG6IjehNj3gqgzPX8V+BvYG1LRg3cSat9j80=	2026-11-02 15:33:02.339883+03	2026-10-26 15:33:02.339862+03	\N	\N
656a8d8b-3ed6-4e84-b867-1ef740255710	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	gOgeWrgEiKxvxzXMFURPK9KiGDeny/7ENHGSXtegx7E=	2026-11-02 15:35:48.458438+03	2026-10-26 15:35:48.458438+03	\N	\N
\.


--
-- Data for Name: Users; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth."Users" ("UserId", "Username", "PasswordHash", "FirstName", "LastName", "MiddleName", "Inn", "Role", "IsActive", "LastLoginAt", "CreatedAt", "UpdatedAt") FROM stdin;
7c05c8f1-65f7-4e31-b4d5-6762d1a53250	client10	$2a$11$pdykdEpAvMdmjbvQ1RJ2eeIvBmzfp3YBLH0KYgFWN1PDP9VjNMPUu	Татьяна	Воробьёва	Сергеевна	994209132544	2	t	\N	2026-10-26 11:56:21.162651+03	\N
8685faff-b338-48e7-a0f7-109c743017e3	client11	$2a$11$K4fTcOLN07lmdty7ngNe3.tVPRZIkCzZficm0wwl6Mmm3C7lGuaIW	Павел	Лебедев	Викторович	991802424801	2	t	\N	2026-10-26 11:56:21.270935+03	\N
66cb62bf-2ecc-4b73-aec8-705942437bc7	client12	$2a$11$ON/MS3jTKc4c/RAwSZCcuezNr4ww5JR1nJiDomWL/mjGBJlzl3mKC	Светлана	Попова	Андреевна	992136717200	2	t	\N	2026-10-26 11:56:21.377554+03	\N
c6c29661-9eb2-4bfe-ac18-5f111512c381	client13	$2a$11$Q/3BVEBWCceNzZTh.jD3o.UsWN5B40VjJn07NogfDWz9VaY6UxYli	Виктор	Соловьёв	Сергеевич	998924531779	2	t	\N	2026-10-26 11:56:21.482949+03	\N
e3bb8e66-8b28-4d09-aa81-915ffb16a282	baclk	$2a$11$0lfuMDSpxuKDecdYPeUv5uVXzhTnf4M7iqfxNEwy4ipRZmoWMBFx.	Данила	Гриневич	Дмитриевич	111111111111	2	t	2026-10-25 23:45:40.439219+03	2026-10-22 15:01:53.767812+03	2026-10-25 23:45:40.43922+03
d85b88ad-d296-4818-9e66-bc66102f6cdd	client14	$2a$11$T5V2dvq5qNi.DL/Q/FM7NuKWvQPraoV.b.ih2CDTajsfQKSpiuHVO	Илья	Морозов	Олегович	995940119912	2	t	\N	2026-10-26 11:56:21.587511+03	\N
cbbbd567-d079-415f-b90e-17526d451b86	client2	$2a$11$qAakg2S8bGJxB0IQA0/kV.40T1h5Nd.qsilkqbYAjkhTbUn3N44iO	Анна	Сидорова	Сергеевна	500100000022	2	t	2026-10-26 14:42:38.993408+03	2026-10-25 18:30:28.130114+03	2026-10-26 14:42:38.993414+03
728802f8-3014-41c8-abac-22248a0b7445	client15	$2a$11$2qfew7SAs649H0nuxetIhe.Kk7K3fjFbkPSn6jw9/29DeC42qshvG	Илья	Семёнов	Владимирович	991126723717	2	t	2026-10-26 11:56:31.789261+03	2026-10-26 11:56:21.695625+03	2026-10-26 11:56:31.789261+03
0cec1640-e32f-4382-80af-ab3432a242e2	client3	$2a$11$qAakg2S8bGJxB0IQA0/kV.40T1h5Nd.qsilkqbYAjkhTbUn3N44iO	Алексей	Кузнецов	Петрович	500100000033	2	t	2026-10-26 14:58:47.291256+03	2026-10-25 18:31:12.103444+03	2026-10-26 14:58:47.291283+03
511f94b1-8df6-4682-acd5-de06fa8e3e4d	client1	$2a$11$qAakg2S8bGJxB0IQA0/kV.40T1h5Nd.qsilkqbYAjkhTbUn3N44iO	Иван	Иванов	Иванович	500100000011	2	t	2026-10-26 15:33:02.333312+03	2026-10-25 18:29:28.703786+03	2026-10-26 15:33:02.333342+03
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	analyst	$2a$11$qAakg2S8bGJxB0IQA0/kV.40T1h5Nd.qsilkqbYAjkhTbUn3N44iO	Андрей	Смирнов	Васильевич	\N	3	t	2026-10-26 15:35:48.456385+03	2026-10-25 17:15:36.0595+03	2026-10-26 15:35:48.456385+03
44444444-4444-4444-4444-444444444444	client4	$2a$11$qAakg2S8bGJxB0IQA0/kV.40T1h5Nd.qsilkqbYAjkhTbUn3N44iO	Михаил	Петров	Дмитриевич	500100000077	2	t	2026-10-26 12:39:38.450109+03	2026-10-25 18:49:44.004082+03	2026-10-26 12:39:38.450109+03
55555555-5555-5555-5555-555555555555	client5	$2a$11$qAakg2S8bGJxB0IQA0/kV.40T1h5Nd.qsilkqbYAjkhTbUn3N44iO	Сергей	Иванов	Петрович	990000000115	2	t	2026-10-26 12:39:38.557379+03	2026-10-25 18:49:44.004082+03	2026-10-26 12:39:38.55738+03
a160108c-fc90-47ad-b98c-0917189db9c2	client6	$2a$11$DEDvTT7M0cQfbCC5xvG2kO9F/O4cSjQNHzdiwcrfFP5btW1ddKhtm	Виктор	Захаров	Сергеевич	992934509242	2	t	2026-10-26 12:39:38.662375+03	2026-10-26 11:56:05.042091+03	2026-10-26 12:39:38.662375+03
ee6c39e8-2462-4da0-8823-db25d9a07c98	client7	$2a$11$CBHaL1Ho6HvDjtnGJvvYK.JI1OVO3meLe9gGeMmWaA/MtVAloi77C	Алексей	Соловьёв	Андреевич	990750786404	2	t	\N	2026-10-26 11:56:20.76863+03	\N
5aea8404-da47-4d2e-883d-ffc9b1157df3	client8	$2a$11$T1MWx6eK/lUpe8d4HYdcweB3PuR2oo2kfee77FsZlHbFWWIPG2Daq	Екатерина	Николаева	Петровна	998575834946	2	t	\N	2026-10-26 11:56:20.904015+03	\N
8404810d-bd0e-4160-85f9-df7e8ffd1a80	client9	$2a$11$e3KFk2iuO.P3jw5cYuRuqumZxFZSoxiIKHZRAlOR.4jTunTZBliim	Дарья	Кузьмина	Юрьевна	997237475355	2	t	\N	2026-10-26 11:56:21.050199+03	\N
\.


--
-- Data for Name: Employees; Type: TABLE DATA; Schema: bank_employee; Owner: -
--

COPY bank_employee."Employees" ("Id", "UserId", "Username", "FirstName", "LastName", "Role", "CreatedAt") FROM stdin;
1f75d817-7c52-4618-98ac-51e1d162c983	9c5c55c1-2769-46c6-aa6b-5a13b804316b	analyst_test	Сергей	Андеррайтер	Analyst	2026-10-22 23:29:30.062817+03
90a53a2c-712b-466e-9458-0d0ed980b717	2902dcf6-bc13-4b87-92e8-09804fce1469	Cr1stal	Данила	Гриневич	Analyst	2026-10-23 12:24:50.837275+03
67eb8710-ce56-47ff-b205-ec1de1ba90f3	f259e55e-420d-4a55-ae72-0131f37e3536	analyst_demo	Андрей	Сидоров	Analyst	2026-10-23 19:06:54.643381+03
fb8511f8-2f16-4dde-966e-dd8d88c8d61d	037fce3c-873f-4c2b-bceb-c09899ea64b7	analyst	Сергей	Андеррайтер	Analyst	2026-10-24 02:00:03.219069+03
aaaaaaaa-eaaa-aaaa-eaaa-aaaaaaaaaaaa	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	analyst	Андрей	Смирнов	Analyst	2026-10-25 17:25:53.880151+03
cccccccc-eccc-cccc-eccc-cccccccccccc	cccccccc-cccc-cccc-cccc-cccccccccccc	analyst_test	Тест	Аналитиков	Analyst	2026-10-25 17:25:53.880151+03
\.


--
-- Data for Name: Clients; Type: TABLE DATA; Schema: client; Owner: -
--

COPY client."Clients" ("Id", "UserId", "Username", "Inn", "FirstName", "LastName", "CreatedAt") FROM stdin;
8a0940dd-9454-4c74-8020-92f2f3c1f759	68bcab96-7d94-4d06-ab0f-a29eaf1d2c60	client_test_final	500100000088	Дмитрий	Смирнов	2026-10-22 15:10:33.295408+03
7367417e-7961-4cd8-a9d2-e06a7a064c1a	fea511e8-7830-498f-8805-4c29ad7f3d1f	client_test	500100000011	Иван	Иванов	2026-10-22 23:27:40.671239+03
15c3612c-a858-495f-b0f9-4e90282a81c0	f9f2222a-49c5-46d8-9c92-be328d8d1b32	hash_test_user	500100000011	Тест	Тестов	2026-10-25 17:14:29.392732+03
d85a6692-577e-4c59-9d0d-577bc59003c9	613ddbba-c4c6-4674-a546-bf2601888d1e	client	990000000436	Мария	Мария	2026-10-25 18:27:58.497912+03
828c879d-4b2f-4a03-b274-6fd18739ba45	511f94b1-8df6-4682-acd5-de06fa8e3e4d	client1	990000000436	Мария	Кузнецова	2026-10-25 18:29:28.901592+03
877b949f-8ab4-49d6-9605-01dca2c3902b	cbbbd567-d079-415f-b90e-17526d451b86	client2	998620195652	Илья	Макаров	2026-10-25 18:30:28.267508+03
68e1e57d-b89e-40ca-be44-5cd44428bc30	0cec1640-e32f-4382-80af-ab3432a242e2	client3	999904307315	Роман	Попов	2026-10-25 18:31:12.244793+03
11111111-c111-1111-c111-111111111111	11111111-1111-1111-1111-111111111111	client1	500100000011	Иван	Иванов	2026-10-25 17:25:53.880151+03
22222222-c222-2222-c222-222222222222	22222222-2222-2222-2222-222222222222	client2	500100000022	Анна	Сидорова	2026-10-25 17:25:53.880151+03
33333333-c333-3333-c333-333333333333	33333333-3333-3333-3333-333333333333	client3	500100000033	Алексей	Кузнецов	2026-10-25 17:25:53.880151+03
44444444-c444-4444-c444-444444444444	44444444-4444-4444-4444-444444444444	client4	500100000077	Михаил	Петров	2026-10-25 17:25:53.880151+03
55555555-c555-5555-c555-555555555555	55555555-5555-5555-5555-555555555555	client5	990000000115	Сергей	Иванов	2026-10-25 17:25:53.880151+03
bbbbbbbb-cbbb-bbbb-cbbb-bbbbbbbbbbbb	bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	client_test	500100000011	Иван	Иванов	2026-10-25 17:25:53.880151+03
50e24785-6403-42fb-971e-962bf68330dd	a160108c-fc90-47ad-b98c-0917189db9c2	client6	992934509242	Виктор	Захаров	2026-10-26 11:56:05.253492+03
3eb609d3-9f88-471a-aad5-d26375965762	ee6c39e8-2462-4da0-8823-db25d9a07c98	client7	990750786404	Алексей	Соловьёв	2026-10-26 11:56:20.900573+03
20062a1d-7835-4717-9a9d-bb0785972f9d	5aea8404-da47-4d2e-883d-ffc9b1157df3	client8	998575834946	Екатерина	Николаева	2026-10-26 11:56:21.020032+03
6de6d5be-1447-40ac-8e72-d27e0d7743b1	8404810d-bd0e-4160-85f9-df7e8ffd1a80	client9	997237475355	Дарья	Кузьмина	2026-10-26 11:56:21.161299+03
a8a6e9d1-96e7-4802-ad30-b4a4d56504a6	7c05c8f1-65f7-4e31-b4d5-6762d1a53250	client10	994209132544	Татьяна	Воробьёва	2026-10-26 11:56:21.269912+03
c6276bea-79c7-4749-afea-4c9c9dfb87a6	8685faff-b338-48e7-a0f7-109c743017e3	client11	991802424801	Павел	Лебедев	2026-10-26 11:56:21.376202+03
2a80943c-fd55-4650-b000-1dab8609b94d	66cb62bf-2ecc-4b73-aec8-705942437bc7	client12	992136717200	Светлана	Попова	2026-10-26 11:56:21.48187+03
fc5bc168-44b8-44a1-a179-27060a685458	c6c29661-9eb2-4bfe-ac18-5f111512c381	client13	998924531779	Виктор	Соловьёв	2026-10-26 11:56:21.5864+03
0232e4b3-9029-4233-90fb-f1b7d4c57165	d85b88ad-d296-4818-9e66-bc66102f6cdd	client14	995940119912	Илья	Морозов	2026-10-26 11:56:21.69467+03
07094c76-f752-4124-b561-94177127b44b	728802f8-3014-41c8-abac-22248a0b7445	client15	991126723717	Илья	Семёнов	2026-10-26 11:56:21.800138+03
\.


--
-- Data for Name: ApplicationDocuments; Type: TABLE DATA; Schema: credit_app; Owner: -
--

COPY credit_app."ApplicationDocuments" ("Id", "ApplicationId", "FileName", "FileKey", "FileType", "FileSizeBytes", "Status", "UploadedAt") FROM stdin;
5f122a4f-1434-4a44-a5cc-f641d742e7ab	40fd27b7-7515-45e1-8c5d-e2867b6c3c50	Идеи стартапов.docx	applications/40fd27b7-7515-45e1-8c5d-e2867b6c3c50/60b0a23e22fe4467b7089212015716ee_Идеи стартапов.docx	other	18490	uploaded	2026-10-25 22:34:52.528633+03
184865fc-3434-4d53-b621-e63162a8f627	40fd27b7-7515-45e1-8c5d-e2867b6c3c50	Идеи стартапов.pdf	applications/40fd27b7-7515-45e1-8c5d-e2867b6c3c50/3750e828b90144d28ed6252bcda10df0_Идеи стартапов.pdf	bank_statement	88595	uploaded	2026-10-25 22:34:52.576638+03
06b089aa-569d-4bc5-ac78-5069fedb87bc	64c01ac5-24bc-4558-aa01-9c846293cac5	Идеи стартапов.docx	applications/64c01ac5-24bc-4558-aa01-9c846293cac5/e2e66dc058ff4358aff41ae22071fef5_Идеи стартапов.docx	other	18490	uploaded	2026-10-25 23:11:49.010411+03
de84c328-b212-4437-b85b-50dd5fa6aafd	64c01ac5-24bc-4558-aa01-9c846293cac5	Идеи стартапов.pdf	applications/64c01ac5-24bc-4558-aa01-9c846293cac5/b80a969013264acba91d30a22f5fd8ed_Идеи стартапов.pdf	bank_statement	88595	uploaded	2026-10-25 23:11:49.051739+03
d87eeb8f-1ee6-447f-9196-fbf6cca0477e	64c01ac5-24bc-4558-aa01-9c846293cac5	Резюме_Гриневич.pdf	applications/64c01ac5-24bc-4558-aa01-9c846293cac5/5a0df6d1495a49a5b9731312fcd37ff1_Резюме_Гриневич.pdf	bank_statement	60830	uploaded	2026-10-25 23:11:49.072089+03
210f99a6-6d1d-4277-a809-3eb8fec521ef	64c01ac5-24bc-4558-aa01-9c846293cac5	Снимок экрана — 2026-09-04 в 21.08.37.png	applications/64c01ac5-24bc-4558-aa01-9c846293cac5/4d2121f92192487a95bc036c172c1175_Снимок экрана — 2026-09-04 в 21.08.37.png	other	2870087	uploaded	2026-10-25 23:11:49.122174+03
5e2098ae-dc32-4c9d-8605-4d420e6064f8	84fb8f5b-6b11-4b5d-9d78-d7e6c3a32a5a	statement_template (1).csv	applications/84fb8f5b-6b11-4b5d-9d78-d7e6c3a32a5a/0f98de680bd5485f8e0041b7a1787bd3_statement_template (1).csv	other	2027	uploaded	2026-10-26 00:03:29.279136+03
525f126d-ed62-43a5-9b4a-1edc7d35a46f	84fb8f5b-6b11-4b5d-9d78-d7e6c3a32a5a	ivanov.csv	applications/84fb8f5b-6b11-4b5d-9d78-d7e6c3a32a5a/a470770c23ce45f6a73e21f69a966519_ivanov.csv	other	17484	uploaded	2026-10-26 00:03:29.30721+03
d5abd78c-01de-421d-a3af-d6ce4e1a567b	70c10451-62e5-4dee-83fc-a8688924e315	sidorova.csv	applications/70c10451-62e5-4dee-83fc-a8688924e315/8f791da428c849aa8af9443ffd3cd823_sidorova.csv	other	8344	uploaded	2026-10-26 00:08:32.466998+03
d27e39b6-4e61-4f91-bddf-e2dcad79f264	4615f8e4-a867-428a-86e4-d6cb7a72dc35	sidorova.csv	applications/4615f8e4-a867-428a-86e4-d6cb7a72dc35/81eeb422d4f64190b42c2a3f022aeffb_sidorova.csv	other	8344	uploaded	2026-10-26 00:43:03.641499+03
14670840-4ba3-4677-b51e-aaef6b5a374b	4615f8e4-a867-428a-86e4-d6cb7a72dc35	Идеи стартапов.pdf	applications/4615f8e4-a867-428a-86e4-d6cb7a72dc35/61b2bc5428f04ae1a518b85a74f70f5d_Идеи стартапов.pdf	bank_statement	88595	uploaded	2026-10-26 00:43:03.684476+03
b0acd207-988c-41a7-ae44-328b4ba82838	4615f8e4-a867-428a-86e4-d6cb7a72dc35	Резюме_Гриневич.pdf	applications/4615f8e4-a867-428a-86e4-d6cb7a72dc35/66a94f65fc0440cda1efc273cacb8bb7_Резюме_Гриневич.pdf	bank_statement	60830	uploaded	2026-10-26 00:47:10.133256+03
391cc9df-b0c0-420e-afec-295afb67d1bb	6e7b65cf-971c-4add-ba50-63fb2ee9933f	Юнит-Экономика Бабкин Гриневчи.pdf	applications/6e7b65cf-971c-4add-ba50-63fb2ee9933f/e3360855c76c426b8058884895630b3a_Юнит-Экономика Бабкин Гриневчи.pdf	bank_statement	676983	uploaded	2026-10-26 14:15:32.122893+03
f26a71ff-3955-4f28-a35c-1190976e69b9	6e7b65cf-971c-4add-ba50-63fb2ee9933f	sidorova.csv	applications/6e7b65cf-971c-4add-ba50-63fb2ee9933f/7259349cb73043dfb851357325cd3222_sidorova.csv	other	8344	uploaded	2026-10-26 14:15:32.144796+03
9eba434c-d84f-4450-ae5e-245000117c67	6e7b65cf-971c-4add-ba50-63fb2ee9933f	1yOcz6W-4b_hKWdXGg8wjeX1Hq1KHCGQym0IjRYG2F8VW33OQF7aqKfZHNH2giDiJUpo7atRQxxOucsOXMI-atlI.jpg	applications/6e7b65cf-971c-4add-ba50-63fb2ee9933f/825858f9ae3d43da812d97bbf2077d04_1yOcz6W-4b_hKWdXGg8wjeX1Hq1KHCGQym0IjRYG2F8VW33OQF7aqKfZHNH2giDiJUpo7atRQxxOucsOXMI-atlI.jpg	other	4751014	uploaded	2026-10-26 14:48:37.769519+03
d0de2897-8039-458e-a079-778c62b4443e	f12b2728-c291-47d6-8aac-f86c1f7684b4	DEMO-039_bad_negative_ncf.csv	applications/f12b2728-c291-47d6-8aac-f86c1f7684b4/fd6ca3fae6164defb103c20677cd9de5_DEMO-039_bad_negative_ncf.csv	bank_statement	16088	uploaded	2026-10-26 15:15:01.697734+03
bf0a972c-cb4b-4219-8348-d20cfad1a19b	38b06cf1-00f7-4eaa-925c-1a4003d2360b	DEMO-001_good_clean_revenue.csv	applications/38b06cf1-00f7-4eaa-925c-1a4003d2360b/ecb9854b126d4d09b08e69c1256684bd_DEMO-001_good_clean_revenue.csv	bank_statement	19340	uploaded	2026-10-26 15:18:13.978104+03
a3ff92af-562a-4b31-901e-6817091199b9	42aabaca-e04b-4c4e-9830-2e849f5b07b5	DEMO-036_bad_heavy_loan_payments.csv	applications/42aabaca-e04b-4c4e-9830-2e849f5b07b5/645c953836584d2bb58115ca13461921_DEMO-036_bad_heavy_loan_payments.csv	bank_statement	19014	uploaded	2026-10-26 15:35:28.590427+03
\.


--
-- Data for Name: Applications; Type: TABLE DATA; Schema: credit_app; Owner: -
--

COPY credit_app."Applications" ("Id", "ClientId", "Inn", "Status", "Decision", "ReasonCodes", "Stage", "Purpose", "ProductCode", "RequestedAmount", "OwnContribution", "RequestedTermMonths", "NeededByDate", "AsSoonAsPossible", "BkiConsent", "PersonalDataConsent", "HistoryStartDate", "HistoryMonths", "StatementFilePath", "ExistingMonthlyObligations", "TaxRegime", "EquipmentPrice", "EquipmentSupplier", "EquipmentList", "SupplierBillFilePath", "ChangeType", "DowntimeMonths", "ExpectedEffect", "UseOfFunds", "IsRepeatRequirement", "SeasonalityComment", "PlannedLaunchDate", "BusinessPlanFilePath", "ProjectedMonthlyRevenue", "ConservativeProjectedRevenue", "FinancialReserve", "PersonalIncome", "CreatedAt", "UpdatedAt", "MonthlyRevenue", "MonthlyExpenses", "HouseholdExpenses", "IsTaxRegimeActual", "DeclaredTaxRegime", "ReceiptCoverage", "ExpensesCoverageStatus", "HasAdditionalIncome", "AdditionalIncomeAmount", "DebtsVerificationStatus", "RepaymentSourceDescription", "ExpensePeriod", "HasExpenseContract") FROM stdin;
003fe858-2705-4d14-b7f7-470d01cd3066	0cec1640-e32f-4382-80af-ab3432a242e2	500100000033	0	0	{}	1	2	WC	1000000	0	12	\N	t	f	t	\N	\N	\N	90000	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-26 13:14:56.351062+03	2026-10-26 13:15:02.719427+03	\N	\N	50000	t	ОСНО	{all}	yes	f	\N	yes	За счёт регулярной выручки от текущей операционной деятельности		t
0a1bee99-45e5-4c5f-a28b-8adf3742e8c9	0cec1640-e32f-4382-80af-ab3432a242e2	500100000033	16	1	{SCORE_BELOW_MIN}	1	2	WC	1000000	0	12	\N	t	t	t	\N	\N	\N	90000	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-26 02:23:03.978752+03	2026-10-26 12:45:38.807356+03	\N	\N	50000	t	ОСНО	{all}	yes	f	\N	yes	За счёт регулярной выручки от текущей операционной деятельности		f
3ded2f03-f53e-47c5-9afb-48f38286bfd2	0cec1640-e32f-4382-80af-ab3432a242e2	500100000033	0	0	{}	1	2	WC	1000000	0	12	\N	t	f	t	\N	\N	\N	90000	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-26 12:50:45.316629+03	2026-10-26 12:53:58.262843+03	\N	\N	50000	t	ОСНО	{all}	yes	f	\N	yes	За счёт регулярной выручки от текущей операционной деятельности		t
54c56fb1-097a-4cf6-9239-7847dcd9cc1a	0cec1640-e32f-4382-80af-ab3432a242e2	500100000033	0	0	{}	1	2	WC	1000000	0	12	\N	t	f	f	\N	\N	\N	90000	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-26 14:32:52.34313+03	2026-10-26 14:32:55.021263+03	\N	\N	50000	t	ОСНО	{all}	yes	f	\N	yes	За счёт регулярной выручки от текущей операционной деятельности		t
4615f8e4-a867-428a-86e4-d6cb7a72dc35	cbbbd567-d079-415f-b90e-17526d451b86	500100000022	7	1	{OFFER_ORIGINAL}	1	2	WC	888888	0	12	2026-10-15 00:00:00+03	t	t	t	\N	12	sidorova.csv	60000	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	400000.0	\N	\N	\N	2026-10-26 00:41:34.593136+03	2026-10-26 01:39:11.28759+03	400000.0	130000.0	20000	t	УСН (доходы)	{all}	yes	f	\N	yes	За счёт регулярной выручки от текущей операционной деятельности		t
403f07b5-87f7-43ac-842e-cb80d7ca0be5	cbbbd567-d079-415f-b90e-17526d451b86	500100000022	0	0	{}	1	2	WC	1000000	0	12	\N	t	f	f	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-26 02:15:15.441566+03	\N	\N	\N	\N	t	\N	{}	\N	\N	\N	\N	\N	\N	f
172196c8-0642-4543-8077-548ab54ee022	0cec1640-e32f-4382-80af-ab3432a242e2	500100000033	16	4	{SCORE_BELOW_MIN}	1	2	WC	1000000	0	12	\N	t	t	t	\N	\N	\N	90000	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-26 13:54:51.884331+03	2026-10-26 13:59:25.418766+03	0	0	50000	t	ОСНО	{all}	yes	f	\N	yes	Личные сбережения; Детали: За счёт регулярной выручки от текущей операционной деятельности		t
3a2d4ea8-6bd6-4a04-9046-20c93d424be1	0cec1640-e32f-4382-80af-ab3432a242e2	500100000033	6	4	{SCORE_BELOW_MIN}	1	2	WC	1000000	0	12	\N	t	t	t	\N	\N	\N	90000	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-26 13:06:39.573392+03	2026-10-26 13:10:28.904444+03	\N	\N	50000	t	ОСНО	{all}	yes	f	\N	yes	За счёт регулярной выручки от текущей операционной деятельности		t
93f1b427-1006-49d2-a70e-f896ae6ee210	0cec1640-e32f-4382-80af-ab3432a242e2	500100000033	16	4	{OFFER_ORIGINAL}	1	2	WC	100000	0	6	\N	t	t	t	\N	\N	\N	90000	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-26 13:59:27.574279+03	2026-10-26 14:13:22.564063+03	0	0	50000	t	ОСНО	{all}	yes	f	\N	yes	Другое / пока нет стабильного источника; Детали: За счёт регулярной выручки от текущей операционной деятельности		t
6e7b65cf-971c-4add-ba50-63fb2ee9933f	0cec1640-e32f-4382-80af-ab3432a242e2	500100000033	7	1	{OFFER_COUNTER,DSCR_LOW}	1	2	WC	1567000	0	18	2026-10-31 00:00:00+03	t	t	t	\N	12	sidorova.csv	90000	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	400000.0	\N	\N	20000	2026-10-26 14:13:28.714492+03	2026-10-26 14:49:38.235019+03	400000.0	130000.0	20000	t	ОСНО	{unsure}	yes	t	20000	yes	За счёт регулярной выручки от текущей операционной деятельности	за 2027 год	t
795afdfc-ee35-46cd-a453-e6bd7b2c9ab4	0cec1640-e32f-4382-80af-ab3432a242e2	500100000033	0	0	{}	1	2	WC	1000000	0	12	\N	t	f	f	\N	\N	\N	90000	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-26 11:17:19.335547+03	2026-10-26 11:17:47.213117+03	\N	\N	50000	t	ОСНО	{all}	yes	f	\N	yes	За счёт регулярной выручки от текущей операционной деятельности		t
4d86290a-cb67-40e9-bdf1-89ab2614152f	0cec1640-e32f-4382-80af-ab3432a242e2	500100000033	0	0	{}	1	2	WC	1000000	0	12	\N	t	f	f	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-26 14:53:57.582716+03	\N	\N	\N	\N	t	\N	{}	\N	\N	\N	\N	\N	\N	f
f12b2728-c291-47d6-8aac-f86c1f7684b4	0cec1640-e32f-4382-80af-ab3432a242e2	500100000033	14	3	{HIGH_RISK_SCORE}	1	2	WC	2345900	0	25	2026-10-31 00:00:00+03	t	t	t	\N	12	DEMO-039_bad_negative_ncf.csv	90000	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	834000.0	\N	\N	\N	2026-10-26 15:12:52.654402+03	2026-10-26 15:15:58.132377+03	834000.0	579600.0	100000	t	ОСНО	{all}	yes	f	\N	yes	За счёт регулярной выручки от текущей операционной деятельности	вава	t
38b06cf1-00f7-4eaa-925c-1a4003d2360b	0cec1640-e32f-4382-80af-ab3432a242e2	500100000033	14	3	{HIGH_RISK_SCORE}	1	2	WC	1500000	0	20	2026-10-31 00:00:00+03	t	t	t	\N	12	DEMO-001_good_clean_revenue.csv	90000	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	700000.0	\N	\N	\N	2026-10-26 15:17:30.714551+03	2026-10-26 15:28:03.926104+03	700000.0	250000.0	100000	t	ОСНО	{all}	yes	f	\N	yes	За счёт регулярной выручки от текущей операционной деятельности	ыв	t
42aabaca-e04b-4c4e-9830-2e849f5b07b5	511f94b1-8df6-4682-acd5-de06fa8e3e4d	500100000011	14	3	{HIGH_RISK_SCORE}	1	2	WC	1567000	0	21	2026-10-31 00:00:00+03	t	t	t	\N	12	DEMO-036_bad_heavy_loan_payments.csv	30000	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1582233.33	\N	\N	\N	2026-10-26 15:33:14.137892+03	2026-10-26 15:37:20.501178+03	1582233.33	1319850.0	100000	t	УСН (доходы)	{all}	yes	f	\N	yes	За счёт регулярной выручки от текущей операционной деятельности	за 2027 год	t
e2867858-63ef-4d78-ab76-79bdc43c3710	511f94b1-8df6-4682-acd5-de06fa8e3e4d	500100000011	0	0	{}	1	2	WC	1000000	0	12	\N	t	f	f	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-10-26 16:00:07.908254+03	\N	\N	\N	\N	t	\N	{}	\N	\N	\N	\N	\N	\N	f
\.


--
-- Data for Name: Offers; Type: TABLE DATA; Schema: credit_app; Owner: -
--

COPY credit_app."Offers" ("Id", "ApprovedAmount", "TermMonths", "AnnualRatePercent", "MonthlyPayment", "IsCounterOffer", "ReasonCode", "CreatedAt") FROM stdin;
4615f8e4-a867-428a-86e4-d6cb7a72dc35	888888	12	21	82767.72	f	OFFER_ORIGINAL	2026-10-26 01:39:11.287498+03
0a1bee99-45e5-4c5f-a28b-8adf3742e8c9	1000000	12	18	91679.99	f	OFFER_APPROVED_BY_ANALYST	2026-10-26 12:45:15.249689+03
93f1b427-1006-49d2-a70e-f896ae6ee210	100000	6	21	17702.26	f	OFFER_ORIGINAL	2026-10-26 14:00:02.120629+03
6e7b65cf-971c-4add-ba50-63fb2ee9933f	1567000	24	21	80521.32	t	OFFER_COUNTER	2026-10-26 14:49:38.234958+03
38b06cf1-00f7-4eaa-925c-1a4003d2360b	1500000	26	21	72304.03	t	CLIENT_REQUESTED_REVISION	2026-10-26 15:27:19.885337+03
\.


--
-- Data for Name: TransitionHistory; Type: TABLE DATA; Schema: credit_app; Owner: -
--

COPY credit_app."TransitionHistory" ("Id", "ApplicationId", "FromStatus", "ToStatus", "Actor", "ReasonCode", "Comment", "Timestamp") FROM stdin;
0ef846bd-5500-4bdd-a017-2ccdc5ef89b3	32417c17-bbf2-43c5-a96d-6be4268a98ea	0	0	client	\N	Создан черновик заявки (T01)	2026-10-22 19:27:11.643866+03
59e2df0d-7050-4ac8-8f0a-cd63588341f2	04341283-c5e3-4e0f-9b9d-0064dbb5fd7a	0	0	client	\N	Создан черновик заявки (T01)	2026-10-22 19:27:31.426299+03
72bda6cc-0cfb-4ac1-b30e-951dbc920eba	cd100db2-bde4-40ca-a78b-557f5b8d18b4	0	0	client	\N	Создан черновик заявки (T01)	2026-10-22 23:31:29.975951+03
f7e7e4ae-d719-490c-ba88-2e5d3e4d28da	cd100db2-bde4-40ca-a78b-557f5b8d18b4	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-22 23:31:30.036218+03
66abf55f-af97-4d0c-a9b8-64467474e8d4	cd100db2-bde4-40ca-a78b-557f5b8d18b4	0	1	client	\N	Заявка отправлена клиентом на проверку (T03)	2026-10-22 23:31:30.042927+03
b1aadc64-6e84-40ee-9f40-c138858b17fd	cd100db2-bde4-40ca-a78b-557f5b8d18b4	1	2	system	\N	Заявка передана на скоринг и проверку стоп-факторов	2026-10-22 23:31:30.042985+03
f9fc4479-3c3a-476f-9973-83b7f0c16541	cd100db2-bde4-40ca-a78b-557f5b8d18b4	2	7	system	\N	\N	2026-10-22 23:31:30.314653+03
bfabf041-b769-4f0c-88d6-0db08fcfbece	748e8b1f-775e-4e7c-ab28-1d00aa12a2dd	0	0	client	\N	Создан черновик заявки (T01)	2026-10-23 00:30:50.984279+03
0e11e1e9-0912-48be-a98c-8585b4e145fb	04341283-c5e3-4e0f-9b9d-0064dbb5fd7a	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-23 11:31:46.758056+03
c4d396c6-afdc-4923-b854-5324843246d0	04341283-c5e3-4e0f-9b9d-0064dbb5fd7a	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-23 11:49:57.814784+03
f7f04e8e-8bd8-40a8-be62-dba0d2acca75	cf08e533-41de-49e7-8620-c3bca078e070	0	0	client	\N	Создан черновик заявки (T01)	2026-10-23 16:58:11.00976+03
6268cda5-4963-4ecb-a646-766e7fa33daf	cf08e533-41de-49e7-8620-c3bca078e070	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-23 16:58:11.059817+03
975912fb-51d2-4539-b46c-15bda7492b43	cf08e533-41de-49e7-8620-c3bca078e070	0	1	client	\N	Заявка отправлена клиентом на проверку (T03)	2026-10-23 16:58:11.064449+03
f1e08c7b-77d6-4021-a60a-14a4a32cae3f	cf08e533-41de-49e7-8620-c3bca078e070	1	2	system	\N	Заявка передана на скоринг и проверку стоп-факторов	2026-10-23 16:58:11.064473+03
b6d2fc66-ed96-476d-ac6e-e3774684b275	cf08e533-41de-49e7-8620-c3bca078e070	2	7	system	\N	\N	2026-10-23 16:58:11.710874+03
333192ab-7744-46fb-841a-2888a24f71c9	748e8b1f-775e-4e7c-ab28-1d00aa12a2dd	0	16	client	\N	Заявка отозвана клиентом (T17)	2026-10-24 01:21:24.480788+03
34e03244-c1b5-44f6-80d0-5ea8a79ab77a	339731d9-d594-45c5-a4d4-62478e412a7f	0	0	client	\N	Создан черновик заявки (T01)	2026-10-24 01:23:33.653985+03
940ef071-d07b-4000-ad6f-400003bd86b0	339731d9-d594-45c5-a4d4-62478e412a7f	1	2	system	\N	Заявка передана на скоринг и проверку стоп-факторов	2026-10-24 01:23:33.68895+03
c7a38c89-2703-4627-b7e5-41e6b0678e07	339731d9-d594-45c5-a4d4-62478e412a7f	0	1	client	\N	Заявка отправлена клиентом на проверку (T03)	2026-10-24 01:23:33.688884+03
6f75852b-0312-4186-8444-299fe9d84d1c	339731d9-d594-45c5-a4d4-62478e412a7f	2	6	system	\N	\N	2026-10-24 01:23:34.569778+03
4a1ccaef-1698-4493-b88b-dbfd361625e1	339731d9-d594-45c5-a4d4-62478e412a7f	6	16	client	\N	Заявка отозвана клиентом (T17)	2026-10-24 02:21:37.859737+03
7fcfc414-c094-478f-a897-5052f14b081d	c96b7995-f6cd-41c4-be7f-b4302c1b867d	0	0	client	\N	Создан черновик заявки (T01)	2026-10-24 02:23:37.644556+03
4c5f6758-7231-4bc9-bab5-719392b7b2a2	c96b7995-f6cd-41c4-be7f-b4302c1b867d	0	1	client	\N	Заявка отправлена клиентом на проверку (T03)	2026-10-24 02:23:37.688137+03
91db3d54-6d3c-45c7-ac97-1c1679d6de06	c96b7995-f6cd-41c4-be7f-b4302c1b867d	1	2	system	\N	Заявка передана на скоринг и проверку стоп-факторов	2026-10-24 02:23:37.688192+03
9ef27672-4251-423e-bfdf-4c365573e029	c96b7995-f6cd-41c4-be7f-b4302c1b867d	2	7	system	\N	\N	2026-10-24 02:23:38.592811+03
745b0d9d-e138-429f-8d6c-8c04de4232c6	32016f85-d7a4-4581-918d-77808efa7e2c	0	0	client	\N	Создан черновик заявки (T01)	2026-10-25 17:23:00.818533+03
cadb1d4f-671b-4ff0-9304-8237a1311509	32016f85-d7a4-4581-918d-77808efa7e2c	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 17:23:00.844523+03
7b7d3f49-4a4c-4c50-9d26-37c182060f0a	32016f85-d7a4-4581-918d-77808efa7e2c	1	2	system	\N	Заявка передана на скоринг и проверку стоп-факторов	2026-10-25 17:23:00.855893+03
a5d1ad5a-158a-4ca2-8cbd-8d81c4c9355a	32016f85-d7a4-4581-918d-77808efa7e2c	0	1	client	\N	Заявка отправлена клиентом на проверку (T03)	2026-10-25 17:23:00.855863+03
165bc47a-804d-49dd-9e10-e6374ea928ed	a9838375-3e5a-4037-aea1-92059a47a6e2	0	0	client	\N	Создан черновик заявки (T01)	2026-10-25 17:23:53.35595+03
71cb073e-9b11-4812-b815-7809926ed9a6	a9838375-3e5a-4037-aea1-92059a47a6e2	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 17:23:53.359705+03
5c8cea3b-e975-4566-9ad7-a9e00b2f7f95	a9838375-3e5a-4037-aea1-92059a47a6e2	0	1	client	\N	Заявка отправлена клиентом на проверку (T03)	2026-10-25 17:23:53.36237+03
b8ea0279-84ec-413c-973d-6f8081f36752	a9838375-3e5a-4037-aea1-92059a47a6e2	1	2	system	\N	Заявка передана на скоринг и проверку стоп-факторов	2026-10-25 17:23:53.36238+03
635b4f9b-1d24-447e-9c5e-9136d4c5ad03	92c1c54a-3416-4389-8b30-0014f5f7b256	0	0	client	\N	Создан черновик заявки (T01)	2026-10-25 17:26:07.414808+03
7fdee525-90b5-428c-be1c-f4959f93b41e	92c1c54a-3416-4389-8b30-0014f5f7b256	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 17:26:07.419055+03
a36715dc-35d5-4c7c-b304-fdb38c04feeb	92c1c54a-3416-4389-8b30-0014f5f7b256	1	2	system	\N	Заявка передана на скоринг и проверку стоп-факторов	2026-10-25 17:26:07.421776+03
ccf8666c-1fe6-400d-a079-7faa58e1fb19	92c1c54a-3416-4389-8b30-0014f5f7b256	0	1	client	\N	Заявка отправлена клиентом на проверку (T03)	2026-10-25 17:26:07.421766+03
4160adda-031c-411a-a063-580b38f63219	e8c4b68e-55be-4ac3-9885-aa89e09844e7	0	0	client	\N	Создан черновик заявки (T01)	2026-10-25 18:44:07.498068+03
b942cba9-8e95-45b0-a673-86fadc188a65	ce9a8292-8f53-4efa-b1d9-b896f2df97c4	0	0	client	\N	Создан черновик заявки (T01)	2026-10-25 18:45:02.81839+03
4029fe06-b6af-4e29-9836-fa3e439009f6	ce9a8292-8f53-4efa-b1d9-b896f2df97c4	0	1	client	\N	Заявка отправлена клиентом на проверку (T03)	2026-10-25 18:45:02.838982+03
fe626b58-9216-4172-96fd-7a9171327474	ce9a8292-8f53-4efa-b1d9-b896f2df97c4	1	2	system	\N	Заявка передана на скоринг и проверку стоп-факторов	2026-10-25 18:45:02.839014+03
e3af8c1e-557d-44bc-af4b-171270580251	ce7d51c3-4ba2-42a8-b9bd-0c3eb749f9a8	0	0	client	\N	Создан черновик заявки (T01)	2026-10-25 18:47:06.458705+03
c76bb903-2588-46b6-8e7e-a8fb6c7aecc2	7e3495d1-a42b-481a-9cf9-116e0e66d15d	0	0	client	\N	Создан черновик заявки (T01)	2026-10-25 18:50:25.841184+03
aeb0f318-6c3d-41d9-ac84-be6610770d15	7e3495d1-a42b-481a-9cf9-116e0e66d15d	1	2	system	\N	Заявка передана на скоринг и проверку стоп-факторов	2026-10-25 18:50:25.845077+03
ff584717-71d0-4f21-9977-4d5282e9dd45	7e3495d1-a42b-481a-9cf9-116e0e66d15d	0	1	client	\N	Заявка отправлена клиентом на проверку (T03)	2026-10-25 18:50:25.845057+03
65a39b31-1030-4a8b-93ad-a60be1a09c11	1f00f0e9-a28f-4410-a783-8aaea063e238	0	0	client	\N	Создан черновик заявки (T01)	2026-10-25 18:58:03.856461+03
fc0f1ae7-2ef4-4515-9cbe-8fca259ca27d	1f00f0e9-a28f-4410-a783-8aaea063e238	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 19:01:28.145668+03
8af8cd8d-2cf3-43ca-8595-cb262bf0209c	99fa896d-7b4f-41c2-b439-aa873c8ac30d	0	0	client	\N	Создан черновик заявки (T01)	2026-10-25 19:02:32.767754+03
b7014eda-452c-4688-b6a7-04e0b4f7f978	99fa896d-7b4f-41c2-b439-aa873c8ac30d	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 19:02:39.574728+03
b9cd9215-6a23-45ee-bf29-486ef9bc4677	99fa896d-7b4f-41c2-b439-aa873c8ac30d	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 19:02:43.909776+03
f556d2d9-a967-4519-9fed-9ca716483fad	99fa896d-7b4f-41c2-b439-aa873c8ac30d	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 19:02:53.116917+03
71cd1ccb-67cb-4805-aa14-6d175100bd26	5d3d0b83-6653-4d42-aaac-61b5a095a1b0	0	0	client	\N	Создан черновик заявки (T01)	2026-10-25 19:12:13.013921+03
c1a36cb0-174c-4e4c-b7c4-a933587b5e9e	5d3d0b83-6653-4d42-aaac-61b5a095a1b0	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 19:12:14.609009+03
5027f464-6a65-4228-80a1-3b337ff80c88	f242cfc9-ebb2-4053-b936-b2c0f5b96a09	0	0	client	\N	Создан черновик заявки (T01)	2026-10-25 19:16:42.823668+03
70ffd060-0f8e-4da8-ae96-267f44b04e6d	ed927fb3-8299-47d8-8733-d20c70edd503	0	0	client	\N	Создан черновик заявки (T01)	2026-10-25 19:16:50.271786+03
902a0078-2672-4716-a076-c05b2901b0d2	309da48d-217e-4044-a93b-eae27337a3f8	0	0	client	\N	Создан черновик заявки (T01)	2026-10-25 19:17:03.334436+03
2b915ff6-6a4e-43c2-ba5d-c8cc36ca63d8	309da48d-217e-4044-a93b-eae27337a3f8	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 19:17:03.33873+03
73c4e05b-9b4c-461e-9cbc-29f811c0d09c	5d3d0b83-6653-4d42-aaac-61b5a095a1b0	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 19:21:52.24955+03
3745e391-d334-4d06-8613-4c58b9372c10	5d3d0b83-6653-4d42-aaac-61b5a095a1b0	0	1	client	\N	Заявка отправлена клиентом на проверку (T03)	2026-10-25 19:21:52.266626+03
63700c1c-d6e0-4e46-adbc-d08ec4c1bc85	5d3d0b83-6653-4d42-aaac-61b5a095a1b0	1	2	system	\N	Заявка передана на скоринг и проверку стоп-факторов	2026-10-25 19:21:52.266732+03
425ab492-2d46-493a-ad6a-718f9cbfe981	b25f7527-4860-4543-bbfc-a22358c0a768	0	0	client	\N	Создан черновик заявки (T01)	2026-10-25 19:26:22.392773+03
f6da78b2-0a2d-45ca-8f90-ae4b9d184519	b25f7527-4860-4543-bbfc-a22358c0a768	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 19:26:38.691198+03
992b1768-70a4-4f5b-858d-1758bc233eda	b25f7527-4860-4543-bbfc-a22358c0a768	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 19:26:43.812041+03
0ee6a424-2cf7-4422-8af2-923fac526a97	b25f7527-4860-4543-bbfc-a22358c0a768	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 19:27:08.879277+03
87228d67-3bdb-43c3-b64a-3803de843601	b25f7527-4860-4543-bbfc-a22358c0a768	0	1	client	\N	Заявка отправлена клиентом на проверку (T03)	2026-10-25 19:27:08.888701+03
9cc10eb1-4eeb-47ea-8b44-d0e3d235218e	b25f7527-4860-4543-bbfc-a22358c0a768	1	2	system	\N	Заявка передана на скоринг и проверку стоп-факторов	2026-10-25 19:27:08.888747+03
b228f9c4-0eeb-437e-bb8b-347af7912f02	94cff59c-5592-4290-b27f-16c5620660a9	0	0	client	\N	Создан черновик заявки (T01)	2026-10-25 19:40:39.045273+03
ba51704a-da7a-474c-a1e5-ac10c4fe94df	94cff59c-5592-4290-b27f-16c5620660a9	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 19:40:45.546641+03
737fac51-3bd6-47ad-92a0-98cc77b1dfc7	94cff59c-5592-4290-b27f-16c5620660a9	0	1	client	\N	Заявка отправлена клиентом на проверку (T03)	2026-10-25 19:40:45.560227+03
eb7a7b66-e8e4-4e32-b49b-fa4d2e6d0a67	94cff59c-5592-4290-b27f-16c5620660a9	1	2	system	\N	Заявка передана на скоринг и проверку стоп-факторов	2026-10-25 19:40:45.560278+03
a1b4651c-42b2-4ab3-b733-770e8b03187d	14f2939d-e46e-4409-8b12-50cc7dbfb52f	0	0	client	\N	Создан черновик заявки (T01)	2026-10-25 21:38:28.02913+03
e1e0e237-8496-4fbc-8eac-777cbafdff20	d5174d4e-b24a-4b26-ab3b-2a254e1e213c	0	0	client	\N	Создан черновик заявки (T01)	2026-10-25 22:01:09.516521+03
bf8c2d69-8a1e-4d3c-a261-e071be7c6706	d5174d4e-b24a-4b26-ab3b-2a254e1e213c	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 22:07:20.363174+03
9cface0b-1068-43f5-9ac5-3931a7f3f563	d5174d4e-b24a-4b26-ab3b-2a254e1e213c	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 22:07:26.53995+03
0bc2c620-0bff-4676-923c-21a75c536906	d5174d4e-b24a-4b26-ab3b-2a254e1e213c	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 22:07:58.207812+03
4540aadc-ef4e-427b-a323-de5b995273d2	d5174d4e-b24a-4b26-ab3b-2a254e1e213c	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 22:18:05.719402+03
bdf2d0bf-f4f0-4b84-a5ef-f5fbeb218d6d	d5174d4e-b24a-4b26-ab3b-2a254e1e213c	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 22:18:23.686685+03
8d56d2cf-572f-4321-8d49-dc68c2010f21	d5174d4e-b24a-4b26-ab3b-2a254e1e213c	1	2	system	\N	Заявка передана на скоринг и проверку стоп-факторов	2026-10-25 22:18:23.714855+03
9ab472e9-31a2-415e-9ff7-591d8c8c98c3	d5174d4e-b24a-4b26-ab3b-2a254e1e213c	0	1	client	\N	Заявка отправлена клиентом на проверку (T03)	2026-10-25 22:18:23.714723+03
41fb8cc0-a2f6-4d8b-be02-6c5b6708d0aa	d5174d4e-b24a-4b26-ab3b-2a254e1e213c	2	16	client	\N	Заявка отозвана клиентом (T17)	2026-10-25 22:18:33.442058+03
76e13f44-e630-434b-b0ee-9d099398e1f7	14f2939d-e46e-4409-8b12-50cc7dbfb52f	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 22:22:27.428673+03
8fad8321-f95c-42c4-9d2f-cd91188bb8d5	14f2939d-e46e-4409-8b12-50cc7dbfb52f	1	2	system	\N	Заявка передана на скоринг и проверку стоп-факторов	2026-10-25 22:22:27.448074+03
ca94412f-b8b9-4537-beb0-00fde3029fed	14f2939d-e46e-4409-8b12-50cc7dbfb52f	0	1	client	\N	Заявка отправлена клиентом на проверку (T03)	2026-10-25 22:22:27.447979+03
ff9e9bc0-f57c-4d71-a106-437d23c7f1cc	2bb5db07-8e5c-4027-b90e-2d40659128c0	0	0	client	\N	Создан черновик заявки (T01)	2026-10-25 22:24:34.122621+03
b50563ef-cd9a-430b-9db1-eb20ee620032	2bb5db07-8e5c-4027-b90e-2d40659128c0	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 22:24:36.15932+03
447670ba-1607-415e-aeb7-40488a029db9	40fd27b7-7515-45e1-8c5d-e2867b6c3c50	0	0	client	\N	Создан черновик заявки (T01)	2026-10-25 22:30:14.877171+03
de839784-a1bb-4bcf-9424-35c694086415	40fd27b7-7515-45e1-8c5d-e2867b6c3c50	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 22:30:17.660876+03
7bfc21af-1f6c-4b1f-8203-528625226d26	7ea61021-d2ba-4d32-95f9-627ee639294b	0	0	client	\N	Создан черновик заявки (T01)	2026-10-25 22:30:28.571663+03
940c2567-b729-4472-b93c-a5c4e602baec	7ea61021-d2ba-4d32-95f9-627ee639294b	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 22:30:46.924368+03
8fa59463-94a5-4dd6-b800-4eedead51d45	40fd27b7-7515-45e1-8c5d-e2867b6c3c50	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 22:31:26.033597+03
9b9c2eb9-3804-4c92-bf16-53784ca511b0	40fd27b7-7515-45e1-8c5d-e2867b6c3c50	1	2	system	\N	Заявка передана на скоринг и проверку стоп-факторов	2026-10-25 22:31:26.046955+03
b63048c2-6128-496a-86aa-45d3e191e68b	40fd27b7-7515-45e1-8c5d-e2867b6c3c50	0	1	client	\N	Заявка отправлена клиентом на проверку (T03)	2026-10-25 22:31:26.04688+03
c6be0655-495b-4a12-b86d-83003c1be13d	44dcb5c3-cd67-4526-adfe-8a5dbe974deb	0	0	client	\N	Создан черновик заявки (T01)	2026-10-25 22:39:50.947859+03
a58ae63b-5249-48ac-abff-158feb717371	44dcb5c3-cd67-4526-adfe-8a5dbe974deb	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 22:39:58.338811+03
65b08ce8-e27a-4552-920c-132d53b2e4ea	44dcb5c3-cd67-4526-adfe-8a5dbe974deb	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 22:40:26.92298+03
46b3678a-232f-4371-9c60-c823bdbfc9b4	da5c492c-c2b6-4900-95f3-e78c7fc14984	0	0	client	\N	Создан черновик заявки (T01)	2026-10-25 22:58:36.071818+03
cefc14ce-b3d0-4892-b3ad-70d6c57822dd	da5c492c-c2b6-4900-95f3-e78c7fc14984	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 22:58:38.902032+03
278dfd21-b11c-40a9-a1ba-a6facb4bdc63	da5c492c-c2b6-4900-95f3-e78c7fc14984	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 22:58:40.535642+03
abe7f453-7cf6-4b06-ba16-10fd9e9538fc	da5c492c-c2b6-4900-95f3-e78c7fc14984	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 22:58:51.507886+03
47c75c4d-25e6-436a-b450-649879d06528	0cc7e5e4-ef5f-4dca-9528-47bf767ba767	0	0	client	\N	Создан черновик заявки (T01)	2026-10-25 23:03:03.574362+03
9ed63b14-e81c-4164-9924-401f926b78f0	0cc7e5e4-ef5f-4dca-9528-47bf767ba767	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 23:03:15.483741+03
d5205be4-df5c-45ba-bc70-a9e3a9fe8b85	0cc7e5e4-ef5f-4dca-9528-47bf767ba767	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 23:03:17.165456+03
e3e2e7fc-1be1-4eba-931e-56842cb4ead2	0cc7e5e4-ef5f-4dca-9528-47bf767ba767	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 23:03:27.297933+03
5a353656-5ee0-416c-a47a-d1e09ba1ca6a	64c01ac5-24bc-4558-aa01-9c846293cac5	0	0	client	\N	Создан черновик заявки (T01)	2026-10-25 23:09:03.842832+03
0cd8dba4-3df3-404d-891b-dc3d2003afc9	64c01ac5-24bc-4558-aa01-9c846293cac5	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 23:09:12.043001+03
ef17491c-f56d-4242-a144-7610f69b253f	64c01ac5-24bc-4558-aa01-9c846293cac5	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 23:09:13.409375+03
042c5046-7d1a-4bbb-a4fa-9afbf546df4f	64c01ac5-24bc-4558-aa01-9c846293cac5	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 23:09:23.549051+03
30928c2d-d410-474b-beb8-55b1519114a8	64c01ac5-24bc-4558-aa01-9c846293cac5	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 23:09:26.39961+03
0c1acd18-4852-4b02-b00e-79b23fdc3614	64c01ac5-24bc-4558-aa01-9c846293cac5	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 23:09:54.181509+03
f6ab0a9f-27bb-47e3-b1e8-1ecbf18e31ec	64c01ac5-24bc-4558-aa01-9c846293cac5	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 23:10:34.644762+03
d3ad2483-48a7-4e0b-9d0c-0547cdbb1f3b	64c01ac5-24bc-4558-aa01-9c846293cac5	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 23:11:05.655864+03
ba4bf43e-de1e-4fe1-8d30-40efda99102e	64c01ac5-24bc-4558-aa01-9c846293cac5	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 23:11:43.884934+03
077fd023-6b1e-4627-978c-9cb128e28770	64c01ac5-24bc-4558-aa01-9c846293cac5	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 23:11:48.763609+03
3c2fb8ce-ea9f-4b9c-b0e3-c8697dbcdbb1	64c01ac5-24bc-4558-aa01-9c846293cac5	0	1	client	\N	Заявка отправлена клиентом на проверку (T03)	2026-10-25 23:11:49.138274+03
ef894ae2-ed22-433a-b161-5555556f8ef2	64c01ac5-24bc-4558-aa01-9c846293cac5	1	2	system	\N	Заявка передана на скоринг и проверку стоп-факторов	2026-10-25 23:11:49.138298+03
dd693244-ed81-4096-ba16-60b35223f8e4	ff9cf264-5b37-4c3e-ba63-5e5ceaa477ad	0	0	client	\N	Создан черновик заявки (T01)	2026-10-25 23:16:55.249387+03
f64cf02c-5891-4088-b2a2-7234200ed5bc	ff9cf264-5b37-4c3e-ba63-5e5ceaa477ad	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 23:16:58.143517+03
1089dd33-1b48-4858-9f50-774b06f8ef90	ff9cf264-5b37-4c3e-ba63-5e5ceaa477ad	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 23:17:00.474881+03
8d2bb89f-d21f-43dc-a7ad-1a0554c2bf53	ff9cf264-5b37-4c3e-ba63-5e5ceaa477ad	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 23:17:14.75157+03
36c70327-32a5-4ca8-bce6-9c31ad4c5fc3	ff9cf264-5b37-4c3e-ba63-5e5ceaa477ad	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 23:18:16.312426+03
7f021e02-5b52-44e2-bab3-764dc260eeb1	ff9cf264-5b37-4c3e-ba63-5e5ceaa477ad	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 23:18:28.179422+03
96b434ae-86c1-49aa-91e1-dd7f0671f6bc	ff9cf264-5b37-4c3e-ba63-5e5ceaa477ad	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 23:18:30.409393+03
2ab8f932-1d25-4b91-8c1a-fcb6276d024e	ff9cf264-5b37-4c3e-ba63-5e5ceaa477ad	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-25 23:18:35.481412+03
4c2cc3ee-8d34-4275-b878-1778091c5ec2	ff9cf264-5b37-4c3e-ba63-5e5ceaa477ad	1	2	system	\N	Заявка передана на скоринг и проверку стоп-факторов	2026-10-25 23:18:35.502066+03
d83113a4-ddd5-42b1-8d1e-7a218bdf8aba	ff9cf264-5b37-4c3e-ba63-5e5ceaa477ad	0	1	client	\N	Заявка отправлена клиентом на проверку (T03)	2026-10-25 23:18:35.501998+03
ac76abd7-83c5-461c-baaa-b0a704de44a1	84fb8f5b-6b11-4b5d-9d78-d7e6c3a32a5a	0	0	client	\N	Создан черновик заявки (T01)	2026-10-25 23:20:20.212003+03
6f77e078-d5c7-416e-acd7-80e630450e95	2f9f9426-526f-4665-a224-b6643fcc7397	0	0	client	\N	Создан черновик заявки (T01)	2026-10-25 23:45:51.095702+03
e9827812-fe19-4039-9661-47c9863dcfb2	84fb8f5b-6b11-4b5d-9d78-d7e6c3a32a5a	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-26 00:01:17.863205+03
a92eb198-0392-4b91-9be1-6fb26502d992	84fb8f5b-6b11-4b5d-9d78-d7e6c3a32a5a	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-26 00:01:19.382598+03
6984cc22-716d-4c82-951d-426e1bc85ee9	84fb8f5b-6b11-4b5d-9d78-d7e6c3a32a5a	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-26 00:01:29.917885+03
6ee31bb1-7425-4838-bf9a-ace849a11b3c	84fb8f5b-6b11-4b5d-9d78-d7e6c3a32a5a	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-26 00:01:34.508438+03
26e50983-046f-4f4c-97df-0d132990f861	84fb8f5b-6b11-4b5d-9d78-d7e6c3a32a5a	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-26 00:01:38.585692+03
58b14acd-b523-46e4-a1aa-a88bcc76d01a	84fb8f5b-6b11-4b5d-9d78-d7e6c3a32a5a	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-26 00:03:26.057262+03
913737fc-affc-488d-a1cc-d4e77cdd971d	84fb8f5b-6b11-4b5d-9d78-d7e6c3a32a5a	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-26 00:03:29.053719+03
a47915af-35d2-4257-922a-c9c724d37f6a	84fb8f5b-6b11-4b5d-9d78-d7e6c3a32a5a	1	2	system	\N	Заявка передана на скоринг и проверку стоп-факторов	2026-10-26 00:03:29.319206+03
df6f710d-a963-40a2-bc17-1e88db9a5d73	84fb8f5b-6b11-4b5d-9d78-d7e6c3a32a5a	0	1	client	\N	Заявка отправлена клиентом на проверку (T03)	2026-10-26 00:03:29.319177+03
28f5c5b9-0628-4c3e-9909-0129eb838dab	70c10451-62e5-4dee-83fc-a8688924e315	0	0	client	\N	Создан черновик заявки (T01)	2026-10-26 00:06:13.887363+03
6273cde2-a9d1-43bf-9f43-84981933659e	70c10451-62e5-4dee-83fc-a8688924e315	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-26 00:06:19.38766+03
16598dc1-102c-42d5-bfa2-633a05ce9a47	70c10451-62e5-4dee-83fc-a8688924e315	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-26 00:06:21.056686+03
2c5b8174-b373-420c-b98f-478dbddf47ba	70c10451-62e5-4dee-83fc-a8688924e315	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-26 00:06:40.933069+03
d3bd247f-3847-4605-80c8-e117ca7363e9	70c10451-62e5-4dee-83fc-a8688924e315	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-26 00:06:48.548772+03
0d3d0d06-7bdb-475b-a08e-8178481fafae	70c10451-62e5-4dee-83fc-a8688924e315	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-26 00:07:20.857642+03
a8ed8f1d-3b59-49f5-9b3a-3a890a88f4ec	70c10451-62e5-4dee-83fc-a8688924e315	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-26 00:07:23.398798+03
ded7e0c6-7847-46b1-ad40-312e309473e2	70c10451-62e5-4dee-83fc-a8688924e315	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-26 00:07:28.000885+03
7fe88aa5-a1ff-40f8-b470-8fab0ad396c9	70c10451-62e5-4dee-83fc-a8688924e315	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-26 00:08:26.526351+03
35d1d8ae-5404-4768-b05a-d3fabdd1d68c	70c10451-62e5-4dee-83fc-a8688924e315	0	0	client	\N	Сохранены изменения в черновике (T02)	2026-10-26 00:08:32.404867+03
b0ade4b8-0ef8-4a5d-bb0e-9328394e42c5	70c10451-62e5-4dee-83fc-a8688924e315	1	2	system	\N	Заявка передана на скоринг и проверку стоп-факторов	2026-10-26 00:08:32.484565+03
c0420def-33d6-4ee2-b46b-415cd942c797	70c10451-62e5-4dee-83fc-a8688924e315	0	1	client	\N	Заявка отправлена клиентом на проверку (T03)	2026-10-26 00:08:32.484464+03
7fb1f6ff-df65-4a76-b231-b75bc38a482c	5a53914c-5a56-4d52-8337-0723b45da106	0	0	client	\N	Создан черновик заявки (T01)	2026-10-26 00:11:31.002701+03
6bd5328e-136f-4b60-b649-72ab15da394a	6efcc508-991d-42a2-a671-28e6bff366fb	0	0	client	T01	Создан черновик заявки (T01)	2026-10-26 00:24:07.734285+03
db37dfa3-0e6f-4a6f-988e-6b10419be4c1	6efcc508-991d-42a2-a671-28e6bff366fb	1	2	system	T03	Заявка передана на скоринг и проверку стоп-факторов	2026-10-26 00:25:00.677403+03
e259667b-fcbc-4b5b-96cf-ae659d7528c8	6efcc508-991d-42a2-a671-28e6bff366fb	0	1	client	T03	Заявка отправлена клиентом на проверку (T03)	2026-10-26 00:25:00.677075+03
ea28f401-d694-4baf-8dc4-191fe9a87782	6efcc508-991d-42a2-a671-28e6bff366fb	2	6	system	SCORE_BELOW_MIN	Скоринг рассчитан (рекомендован отказ): передано на рассмотрение аналитику банка (T07)	2026-10-26 00:25:01.654221+03
070e9525-0f5a-473e-89ef-032b6593443a	93c2a144-4884-494c-87c0-9e58d5fe3e35	0	0	client	T01	Создан черновик заявки (T01)	2026-10-26 00:35:09.849057+03
49029209-e515-45d6-b251-4f68a7ea190e	93c2a144-4884-494c-87c0-9e58d5fe3e35	1	2	system	T03	Заявка передана на скоринг и проверку стоп-факторов	2026-10-26 00:35:09.85655+03
fb46d3fb-9827-455c-9d9b-1df752406094	93c2a144-4884-494c-87c0-9e58d5fe3e35	0	1	client	T03	Заявка отправлена клиентом на проверку (T03)	2026-10-26 00:35:09.856532+03
1c9d6a5b-2d0c-4b2a-9244-9a1d8f667346	93c2a144-4884-494c-87c0-9e58d5fe3e35	2	6	system	OFFER_ORIGINAL	Скоринг рассчитан (рекомендовано одобрение): передано на утверждение аналитику банка (T07)	2026-10-26 00:35:09.868585+03
eb7aefd4-ba37-46bb-bd3a-3f3848179c4f	93c2a144-4884-494c-87c0-9e58d5fe3e35	6	7	analyst	\N	Одобрено на основании финансовой устойчивости	2026-10-26 00:35:10.01113+03
4a9eae37-ebcd-448a-b12e-ac702ba2b9ba	9f6f7ea2-7dec-4b93-8368-7da105d4bca5	0	0	client	T01	Создан черновик заявки (T01)	2026-10-26 00:37:48.276338+03
e9bc690d-2de1-4908-a9d4-52023f252842	4615f8e4-a867-428a-86e4-d6cb7a72dc35	0	0	client	T01	Создан черновик заявки (T01)	2026-10-26 00:41:34.605586+03
79d6b797-532a-488e-946f-529d8aea3c83	4615f8e4-a867-428a-86e4-d6cb7a72dc35	0	1	client	T03	Заявка отправлена клиентом на проверку (T03)	2026-10-26 00:43:03.692997+03
c772a92a-5d71-463e-b52c-54dcec9eda2d	4615f8e4-a867-428a-86e4-d6cb7a72dc35	1	2	system	T03	Заявка передана на скоринг и проверку стоп-факторов	2026-10-26 00:43:03.693078+03
e147cd32-4b09-43ac-9b44-c933c8732925	4615f8e4-a867-428a-86e4-d6cb7a72dc35	2	6	system	OFFER_ORIGINAL	Скоринг рассчитан (рекомендовано одобрение): передано на утверждение аналитику банка (T07)	2026-10-26 00:43:04.70335+03
db2c5170-91e2-481d-81c3-9cb905998a2b	4615f8e4-a867-428a-86e4-d6cb7a72dc35	6	2	analyst	\N	Уточнены факты аналитиком, возврат на проверку (T14)	2026-10-26 00:45:08.920879+03
651cb6b9-13a2-405c-98a7-1aa538e3745e	4615f8e4-a867-428a-86e4-d6cb7a72dc35	2	4	system	NEED_STATEMENT	Необходимо подтверждение лизинговых обязательств.	2026-10-26 00:45:08.957677+03
47190d1e-0877-466e-9e54-2a0f6cc58069	4615f8e4-a867-428a-86e4-d6cb7a72dc35	5	2	system	\N	Заявка возвращена на повторную автопроверку	2026-10-26 00:47:19.734485+03
c260cb49-63ee-4912-bf4f-df5c82b35a7e	4615f8e4-a867-428a-86e4-d6cb7a72dc35	4	5	client	\N	Клиент предоставил запрошенные банком сведения (T10)	2026-10-26 00:47:19.734135+03
2113ce75-c8c6-4a22-8c75-16e784b26d8f	4615f8e4-a867-428a-86e4-d6cb7a72dc35	2	6	system	OFFER_ORIGINAL	Скоринг рассчитан (рекомендовано одобрение): передано на утверждение аналитику банка (T07)	2026-10-26 00:47:19.749819+03
462f7e7e-0876-4cdd-ae87-6f7b3aa88dd7	4615f8e4-a867-428a-86e4-d6cb7a72dc35	6	7	analyst	\N	все по кайфу уцы\n	2026-10-26 01:39:11.287595+03
68cceeb7-d9a0-4ef9-a80a-6cce5969af8d	403f07b5-87f7-43ac-842e-cb80d7ca0be5	0	0	client	T01	Создан черновик заявки (T01)	2026-10-26 02:15:15.452512+03
32842296-077a-4e9e-aa92-5162b55344f5	0a1bee99-45e5-4c5f-a28b-8adf3742e8c9	0	0	client	T01	Создан черновик заявки (T01)	2026-10-26 02:23:03.987372+03
6bf757ce-319f-46a0-92b1-d5ba4a1b0b25	795afdfc-ee35-46cd-a453-e6bd7b2c9ab4	0	0	client	T01	Создан черновик заявки (T01)	2026-10-26 11:17:19.336246+03
4863139d-0cc2-4e34-9e4d-4ae77e18fd48	0a1bee99-45e5-4c5f-a28b-8adf3742e8c9	0	1	client	T03	Заявка отправлена клиентом на проверку (T03)	2026-10-26 12:44:44.531521+03
9ea93ee6-6009-4510-a404-5714974fa93a	0a1bee99-45e5-4c5f-a28b-8adf3742e8c9	1	2	system	T03	Заявка передана на скоринг и проверку стоп-факторов	2026-10-26 12:44:44.531824+03
60f559da-305d-4bc6-af6b-a76a3ea60663	0a1bee99-45e5-4c5f-a28b-8adf3742e8c9	2	6	system	SCORE_BELOW_MIN	Скоринг рассчитан (рекомендован отказ): передано на рассмотрение аналитику банка (T07)	2026-10-26 12:44:44.540883+03
82e5c6ce-042d-4181-a352-ad3f73a10115	0a1bee99-45e5-4c5f-a28b-8adf3742e8c9	6	7	analyst	\N		2026-10-26 12:45:15.250111+03
9a06acad-1e86-4935-bdd9-5393e279a06c	0a1bee99-45e5-4c5f-a28b-8adf3742e8c9	7	16	client	\N	Заявка отозвана клиентом (T17)	2026-10-26 12:45:38.807365+03
22c1343c-f43e-4a6e-bbb5-763e24dcd059	3ded2f03-f53e-47c5-9afb-48f38286bfd2	0	0	client	T01	Создан черновик заявки (T01)	2026-10-26 12:50:45.317846+03
01b03c46-2f64-4d84-a847-5e16733a928e	3a2d4ea8-6bd6-4a04-9046-20c93d424be1	0	0	client	T01	Создан черновик заявки (T01)	2026-10-26 13:06:39.574009+03
34b2ba46-4590-4dd1-9d56-e28d97e1bd64	3a2d4ea8-6bd6-4a04-9046-20c93d424be1	1	2	system	T03	Заявка передана на скоринг и проверку стоп-факторов	2026-10-26 13:10:28.893526+03
b25de983-5eef-47e0-a20d-bb2d1d8569ef	3a2d4ea8-6bd6-4a04-9046-20c93d424be1	0	1	client	T03	Заявка отправлена клиентом на проверку (T03)	2026-10-26 13:10:28.893249+03
a989e778-12cf-4e03-ad99-f3cd3222b305	3a2d4ea8-6bd6-4a04-9046-20c93d424be1	2	6	system	SCORE_BELOW_MIN	Скоринг рассчитан (рекомендован отказ): передано на рассмотрение аналитику банка (T07)	2026-10-26 13:10:28.904448+03
5fcceb26-b444-4154-9fd5-15708020ab19	003fe858-2705-4d14-b7f7-470d01cd3066	0	0	client	T01	Создан черновик заявки (T01)	2026-10-26 13:14:56.351935+03
45209ab4-f862-4153-90a5-efdd9d89dcfd	172196c8-0642-4543-8077-548ab54ee022	0	0	client	T01	Создан черновик заявки (T01)	2026-10-26 13:54:51.885198+03
50e0587c-c76a-4993-a374-4c6c9b94d42b	172196c8-0642-4543-8077-548ab54ee022	1	2	system	T03	Заявка передана на скоринг и проверку стоп-факторов	2026-10-26 13:55:51.827555+03
d643a7de-5c4e-4893-979f-b522a109789a	172196c8-0642-4543-8077-548ab54ee022	0	1	client	T03	Заявка отправлена клиентом на проверку (T03)	2026-10-26 13:55:51.827405+03
60674420-417c-4635-81dc-b2b3e765b461	172196c8-0642-4543-8077-548ab54ee022	2	6	system	SCORE_BELOW_MIN	Скоринг рассчитан (рекомендован отказ): передано на рассмотрение аналитику банка (T07)	2026-10-26 13:55:52.851159+03
12a26349-f0df-4fb5-a720-0c6e434ce070	172196c8-0642-4543-8077-548ab54ee022	6	16	client	\N	Заявка отозвана клиентом (T17)	2026-10-26 13:59:25.418777+03
b428d13e-2718-4aac-b5c6-4a9b3ebf2e0a	93f1b427-1006-49d2-a70e-f896ae6ee210	0	0	client	T01	Создан черновик заявки (T01)	2026-10-26 13:59:27.574586+03
029ba3ad-d2bc-4a6e-95a2-7baf56cac89b	93f1b427-1006-49d2-a70e-f896ae6ee210	0	1	client	T03	Заявка отправлена клиентом на проверку (T03)	2026-10-26 14:00:02.097845+03
16e6d411-9bbd-4d20-8674-8206a99ebe8e	93f1b427-1006-49d2-a70e-f896ae6ee210	1	2	system	T03	Заявка передана на скоринг и проверку стоп-факторов	2026-10-26 14:00:02.097954+03
8c7b22c4-7bfe-4cc9-918a-074c9e6c7709	93f1b427-1006-49d2-a70e-f896ae6ee210	2	6	system	OFFER_ORIGINAL	Скоринг рассчитан (рекомендовано одобрение): передано на утверждение аналитику банка (T07)	2026-10-26 14:00:02.121642+03
1109f1de-7f72-4476-964d-8427a7d79878	93f1b427-1006-49d2-a70e-f896ae6ee210	6	16	client	\N	Заявка отозвана клиентом (T17)	2026-10-26 14:13:22.564077+03
4a791299-516d-4667-b08d-b00bb77f56a0	6e7b65cf-971c-4add-ba50-63fb2ee9933f	0	0	client	T01	Создан черновик заявки (T01)	2026-10-26 14:13:28.714738+03
0b39c5cd-83fe-488e-843e-6231816c0a56	6e7b65cf-971c-4add-ba50-63fb2ee9933f	0	1	client	T03	Заявка отправлена клиентом на проверку (T03)	2026-10-26 14:15:32.161136+03
ab5635b3-7352-4001-ac01-4922931e6984	6e7b65cf-971c-4add-ba50-63fb2ee9933f	1	2	system	T03	Заявка передана на скоринг и проверку стоп-факторов	2026-10-26 14:15:32.163332+03
01aac0e5-77e0-4d7d-9cb8-55d1ecf08627	6e7b65cf-971c-4add-ba50-63fb2ee9933f	2	6	system	OFFER_COUNTER	Скоринг рассчитан (встречные условия): передано на утверждение аналитику банка (T07)	2026-10-26 14:15:32.180364+03
43e30504-e5df-4213-8e4e-cbb96f951bfc	6e7b65cf-971c-4add-ba50-63fb2ee9933f	6	4	analyst	NEED_INFO	Требуется подтвердить полноту поступлений по счетам в других банках	2026-10-26 14:22:10.284899+03
e1164f0b-638f-4e43-923d-eebbcaf09ca9	54c56fb1-097a-4cf6-9239-7847dcd9cc1a	0	0	client	T01	Создан черновик заявки (T01)	2026-10-26 14:32:52.343458+03
c8a3d319-79ac-46c0-b94b-9f216d1130fd	6e7b65cf-971c-4add-ba50-63fb2ee9933f	5	2	system	\N	Заявка возвращена на повторную автопроверку	2026-10-26 14:48:40.868971+03
c8bbdf73-c1a4-4bfc-acde-7d3e591b5582	6e7b65cf-971c-4add-ba50-63fb2ee9933f	4	5	client	\N	ывыв\nПрикрепленные документы (1): 1yOcz6W-4b_hKWdXGg8wjeX1Hq1KHCGQym0IjRYG2F8VW33OQF7aqKfZHNH2giDiJUpo7atRQxxOucsOXMI-atlI.jpg	2026-10-26 14:48:40.867149+03
920b9864-24a2-40f8-ac46-f3a8a8e8ecda	6e7b65cf-971c-4add-ba50-63fb2ee9933f	2	6	system	OFFER_COUNTER	Скоринг рассчитан (встречные условия): передано на утверждение аналитику банка (T07)	2026-10-26 14:48:41.847079+03
b109b3a5-bb4b-4b7b-b96a-3b1e1be4c50f	6e7b65cf-971c-4add-ba50-63fb2ee9933f	6	7	analyst	\N	Утверждён альтернативный срок с пониженным платежом	2026-10-26 14:49:38.235047+03
3dfeecd5-ad83-4a52-87be-c94610ae51f4	4d86290a-cb67-40e9-bdf1-89ab2614152f	0	0	client	T01	Создан черновик заявки (T01)	2026-10-26 14:53:57.584469+03
36d1aa3d-bea5-4bd1-8967-16349d0d8156	f12b2728-c291-47d6-8aac-f86c1f7684b4	0	0	client	T01	Создан черновик заявки (T01)	2026-10-26 15:12:52.673784+03
0fdf76b8-aeaf-4f02-9c3a-f9da40bd4f1d	f12b2728-c291-47d6-8aac-f86c1f7684b4	0	1	client	T03	Заявка отправлена клиентом на проверку (T03)	2026-10-26 15:15:01.72364+03
2729dff5-713d-4ece-bc6c-010b6cbbef76	f12b2728-c291-47d6-8aac-f86c1f7684b4	1	2	system	T03	Заявка передана на скоринг и проверку стоп-факторов	2026-10-26 15:15:01.723948+03
79ffbb2f-b391-42a7-977b-fa88111df900	f12b2728-c291-47d6-8aac-f86c1f7684b4	2	6	system	SCORE_BELOW_MIN	Скоринг рассчитан (рекомендован отказ): передано на рассмотрение аналитику банка (T07)	2026-10-26 15:15:02.721172+03
4cf4e40c-8ed0-495a-992d-54141dbc85f7	f12b2728-c291-47d6-8aac-f86c1f7684b4	6	14	analyst	HIGH_RISK_SCORE	иди ты	2026-10-26 15:15:58.132419+03
44147722-c422-4831-9971-0b8a56976b09	38b06cf1-00f7-4eaa-925c-1a4003d2360b	0	0	client	T01	Создан черновик заявки (T01)	2026-10-26 15:17:30.717295+03
a45fc60b-5680-4a69-bbda-6c03bb13f359	38b06cf1-00f7-4eaa-925c-1a4003d2360b	1	2	system	T03	Заявка передана на скоринг и проверку стоп-факторов	2026-10-26 15:18:14.002077+03
afa28c8d-23f3-4154-b578-390abe7d9390	38b06cf1-00f7-4eaa-925c-1a4003d2360b	0	1	client	T03	Заявка отправлена клиентом на проверку (T03)	2026-10-26 15:18:14.001591+03
a4d2711f-e42c-45d0-a7d3-2f07207064ed	38b06cf1-00f7-4eaa-925c-1a4003d2360b	2	6	system	OFFER_ORIGINAL	Скоринг рассчитан (рекомендовано одобрение): передано на утверждение аналитику банка (T07)	2026-10-26 15:18:14.031452+03
a2921ed3-42be-485f-877c-985088c1145f	38b06cf1-00f7-4eaa-925c-1a4003d2360b	6	7	analyst	\N	Индивидуальные условия, скорректированные аналитиком.	2026-10-26 15:27:19.885903+03
71eccee4-fac8-4271-b617-bde014154d87	38b06cf1-00f7-4eaa-925c-1a4003d2360b	7	6	client	CLIENT_COUNTER_OFFER_REQUEST	Клиент запросил пересмотр условий: Запрос альтернативных условий кредитования; желаемая сумма: 1 500 000 ₽; желаемый срок: 18 мес.; желаемый платёж: 70 000 ₽/мес.	2026-10-26 15:27:42.275516+03
489319e1-2851-4ac4-9a9d-af0258b27ace	38b06cf1-00f7-4eaa-925c-1a4003d2360b	6	14	analyst	HIGH_RISK_SCORE	Отказ в пересмотре условий по заявке заёмщика	2026-10-26 15:28:03.926136+03
03cef3d3-3243-4d06-8df6-2e27ed54741d	42aabaca-e04b-4c4e-9830-2e849f5b07b5	0	0	client	T01	Создан черновик заявки (T01)	2026-10-26 15:33:14.139449+03
7a1667bf-742d-415a-a31a-f12102341e76	42aabaca-e04b-4c4e-9830-2e849f5b07b5	0	1	client	T03	Заявка отправлена клиентом на проверку (T03)	2026-10-26 15:35:28.610926+03
b155041b-fcee-4c84-90ca-52b14e203c70	42aabaca-e04b-4c4e-9830-2e849f5b07b5	1	2	system	T03	Заявка передана на скоринг и проверку стоп-факторов	2026-10-26 15:35:28.611024+03
664eff86-f1e5-43cd-a7d7-7470450c1fe0	42aabaca-e04b-4c4e-9830-2e849f5b07b5	2	6	system	NO_FEASIBLE_TERMS	Скоринг рассчитан (рекомендован отказ): передано на рассмотрение аналитику банка (T07)	2026-10-26 15:35:29.558308+03
8f485e7a-8480-4533-b5c8-84edd09164c9	42aabaca-e04b-4c4e-9830-2e849f5b07b5	6	4	analyst	NEED_INFO	Просим прислать выписку по счетам за последние 6 месяцев для подтверждения оборотов	2026-10-26 15:36:36.078635+03
a175b5e1-0220-4541-9a26-54c898289d15	42aabaca-e04b-4c4e-9830-2e849f5b07b5	5	2	system	\N	Заявка возвращена на повторную автопроверку	2026-10-26 15:36:52.627253+03
eb79575c-94e8-4d38-b49a-f69f03ab5932	42aabaca-e04b-4c4e-9830-2e849f5b07b5	4	5	client	\N	нуууу не знаю	2026-10-26 15:36:52.626819+03
e6e81bfa-cf6c-490b-b92c-2b6673ebb254	42aabaca-e04b-4c4e-9830-2e849f5b07b5	2	6	system	NO_FEASIBLE_TERMS	Скоринг рассчитан (рекомендован отказ): передано на рассмотрение аналитику банка (T07)	2026-10-26 15:36:52.663814+03
fb9d4df0-d2eb-4414-b102-574e16010a6c	42aabaca-e04b-4c4e-9830-2e849f5b07b5	6	14	analyst	HIGH_RISK_SCORE	ну не знаю\n	2026-10-26 15:37:20.501185+03
c4c31318-e87f-43af-8ff5-643bd5af992c	e2867858-63ef-4d78-ab76-79bdc43c3710	0	0	client	T01	Создан черновик заявки (T01)	2026-10-26 16:00:07.910537+03
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


