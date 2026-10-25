-- ==============================================================================
-- Скрипт инициализации пользователей (auth.Users) и связки с SyntheticDb
-- Пользователи:
--   client1 (ИНН 500100000011) - ИП Иванов Иван Иванович (Торговля, выручка 8.4 млн ₽, счет в Альфа-Банке)
--   client2 (ИНН 500100000022) - ИП Сидорова Анна Сергеевна (IT/Услуги, выручка 4.8 млн ₽, счет в Альфа-Банке)
--   client3 (ИНН 500100000033) - ИП Кузнецов Алексей Петрович (Производство, выручка 6.0 млн ₽, есть кредиты)
--   client4 (ИНН 500100000077) - ИП Петров Михаил Дмитриевич (Розница, выручка 4.2 млн ₽)
--   client5 (ИНН 990000000115) - ИП Иванов Сергей Петрович (Эталонный кейс S1, выручка 10.2 млн ₽)
--   analyst                    - Смирнов Андрей Васильевич (Кредитный аналитик банка)
--
-- Пароль для всех учетных записей: password123
-- ==============================================================================

-- 1. Пользователи в схеме auth (база данных SmartKabinet)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'auth' AND table_name = 'Users'
    ) THEN
        INSERT INTO auth."Users" (
            "UserId",
            "Username",
            "PasswordHash",
            "FirstName",
            "LastName",
            "MiddleName",
            "Inn",
            "Role",
            "IsActive",
            "CreatedAt"
        ) VALUES
        (
            '11111111-1111-1111-1111-111111111111',
            'client1',
            '$2a$11$qAakg2S8bGJxB0IQA0/kV.40T1h5Nd.qsilkqbYAjkhTbUn3N44iO',
            'Иван',
            'Иванов',
            'Иванович',
            '500100000011',
            2, -- Client
            true,
            NOW()
        ),
        (
            '22222222-2222-2222-2222-222222222222',
            'client2',
            '$2a$11$qAakg2S8bGJxB0IQA0/kV.40T1h5Nd.qsilkqbYAjkhTbUn3N44iO',
            'Анна',
            'Сидорова',
            'Сергеевна',
            '500100000022',
            2, -- Client
            true,
            NOW()
        ),
        (
            '33333333-3333-3333-3333-333333333333',
            'client3',
            '$2a$11$qAakg2S8bGJxB0IQA0/kV.40T1h5Nd.qsilkqbYAjkhTbUn3N44iO',
            'Алексей',
            'Кузнецов',
            'Петрович',
            '500100000033',
            2, -- Client
            true,
            NOW()
        ),
        (
            '44444444-4444-4444-4444-444444444444',
            'client4',
            '$2a$11$qAakg2S8bGJxB0IQA0/kV.40T1h5Nd.qsilkqbYAjkhTbUn3N44iO',
            'Михаил',
            'Петров',
            'Дмитриевич',
            '500100000077',
            2, -- Client
            true,
            NOW()
        ),
        (
            '55555555-5555-5555-5555-555555555555',
            'client5',
            '$2a$11$qAakg2S8bGJxB0IQA0/kV.40T1h5Nd.qsilkqbYAjkhTbUn3N44iO',
            'Сергей',
            'Иванов',
            'Петрович',
            '990000000115',
            2, -- Client
            true,
            NOW()
        ),
        (
            'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            'analyst',
            '$2a$11$qAakg2S8bGJxB0IQA0/kV.40T1h5Nd.qsilkqbYAjkhTbUn3N44iO',
            'Андрей',
            'Смирнов',
            'Васильевич',
            NULL,
            3, -- Analyst
            true,
            NOW()
        ),
        (
            'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            'client_test',
            '$2a$11$qAakg2S8bGJxB0IQA0/kV.40T1h5Nd.qsilkqbYAjkhTbUn3N44iO',
            'Иван',
            'Иванов',
            'Иванович',
            '500100000011',
            2, -- Client
            true,
            NOW()
        ),
        (
            'cccccccc-cccc-cccc-cccc-cccccccccccc',
            'analyst_test',
            '$2a$11$qAakg2S8bGJxB0IQA0/kV.40T1h5Nd.qsilkqbYAjkhTbUn3N44iO',
            'Тест',
            'Аналитиков',
            'Тестович',
            NULL,
            3, -- Analyst
            true,
            NOW()
        )
        ON CONFLICT ("Username") DO UPDATE SET
            "PasswordHash" = EXCLUDED."PasswordHash",
            "FirstName" = EXCLUDED."FirstName",
            "LastName" = EXCLUDED."LastName",
            "MiddleName" = EXCLUDED."MiddleName",
            "Inn" = EXCLUDED."Inn",
            "Role" = EXCLUDED."Role",
            "IsActive" = EXCLUDED."IsActive";
    END IF;

    -- Заполнение профилей клиентов в client.Clients
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'client' AND table_name = 'Clients'
    ) THEN
        INSERT INTO client."Clients" ("Id", "UserId", "Username", "Inn", "FirstName", "LastName", "CreatedAt")
        VALUES
        ('11111111-c111-1111-c111-111111111111', '11111111-1111-1111-1111-111111111111', 'client1', '500100000011', 'Иван', 'Иванов', NOW()),
        ('22222222-c222-2222-c222-222222222222', '22222222-2222-2222-2222-222222222222', 'client2', '500100000022', 'Анна', 'Сидорова', NOW()),
        ('33333333-c333-3333-c333-333333333333', '33333333-3333-3333-3333-333333333333', 'client3', '500100000033', 'Алексей', 'Кузнецов', NOW()),
        ('44444444-c444-4444-c444-444444444444', '44444444-4444-4444-4444-444444444444', 'client4', '500100000077', 'Михаил', 'Петров', NOW()),
        ('55555555-c555-5555-c555-555555555555', '55555555-5555-5555-5555-555555555555', 'client5', '990000000115', 'Сергей', 'Иванов', NOW()),
        ('bbbbbbbb-cbbb-bbbb-cbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'client_test', '500100000011', 'Иван', 'Иванов', NOW())
        ON CONFLICT ("UserId") DO UPDATE SET
            "Username" = EXCLUDED."Username",
            "Inn" = EXCLUDED."Inn",
            "FirstName" = EXCLUDED."FirstName",
            "LastName" = EXCLUDED."LastName";
    END IF;

    -- Заполнение профилей аналитиков в bank_employee.Employees
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'bank_employee' AND table_name = 'Employees'
    ) THEN
        INSERT INTO bank_employee."Employees" ("Id", "UserId", "Username", "FirstName", "LastName", "Role", "CreatedAt")
        VALUES
        ('aaaaaaaa-eaaa-aaaa-eaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'analyst', 'Андрей', 'Смирнов', 'Analyst', NOW()),
        ('cccccccc-eccc-cccc-eccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'analyst_test', 'Тест', 'Аналитиков', 'Analyst', NOW())
        ON CONFLICT ("UserId") DO UPDATE SET
            "Username" = EXCLUDED."Username",
            "FirstName" = EXCLUDED."FirstName",
            "LastName" = EXCLUDED."LastName",
            "Role" = EXCLUDED."Role";
    END IF;
END $$;

-- 2. Обогащение реестра ЕГРИП (synthetic.egrip) для всех добавленных клиентов
CREATE SCHEMA IF NOT EXISTS synthetic;

INSERT INTO synthetic.egrip (
    inn, ogrnip, last_name, first_name, patronymic, full_name,
    registration_date, egrip_status, region_code, region_name,
    okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of
) VALUES
(
    '500100000011',
    '320508100111111',
    'Иванов',
    'Иван',
    'Иванович',
    'ИП Иванов Иван Иванович',
    '2019-02-10',
    'ACTIVE',
    '50',
    'Московская область',
    '47.11',
    'Торговля розничная преимущественно пищевыми продуктами',
    '47.91;46.90',
    'УСН (доходы)',
    'Микропредприятие',
    '2026-10-21'
),
(
    '500100000022',
    '321508100222222',
    'Сидорова',
    'Анна',
    'Сергеевна',
    'ИП Сидорова Анна Сергеевна',
    '2021-05-15',
    'ACTIVE',
    '50',
    'Московская область',
    '62.01',
    'Разработка компьютерного программного обеспечения',
    '62.02;63.11',
    'УСН (доходы)',
    'Микропредприятие',
    '2026-10-21'
),
(
    '500100000033',
    '318508100333333',
    'Кузнецов',
    'Алексей',
    'Петрович',
    'ИП Кузнецов Алексей Петрович',
    '2018-09-01',
    'ACTIVE',
    '50',
    'Московская область',
    '31.01',
    'Производство мебели для офисов и предприятий торговли',
    '49.41;18.12',
    'ОСНО',
    'Малое предприятие',
    '2026-10-21'
),
(
    '500100000077',
    '323508100777777',
    'Петров',
    'Михаил',
    'Дмитриевич',
    'ИП Петров Михаил Дмитриевич',
    '2023-01-20',
    'ACTIVE',
    '77',
    'г. Москва',
    '47.71',
    'Торговля розничная одеждой в специализированных магазинах',
    '47.91;46.42',
    'УСН (доходы минус расходы)',
    'Микропредприятие',
    '2026-10-21'
),
(
    '990000000115',
    '321504530351107',
    'Иванов',
    'Сергей',
    'Петрович',
    'ИП Иванов Сергей Петрович',
    '2021-09-01',
    'ACTIVE',
    '50',
    'Московская область',
    '47.11',
    'Торговля розничная преимущественно пищевыми продуктами',
    '47.91;46.90',
    'УСН (доходы)',
    'Микропредприятие',
    '2026-10-21'
)
ON CONFLICT (inn) DO UPDATE SET
    ogrnip = EXCLUDED.ogrnip,
    full_name = EXCLUDED.full_name,
    okved_main = EXCLUDED.okved_main,
    okved_main_name = EXCLUDED.okved_main_name,
    tax_regime = EXCLUDED.tax_regime,
    egrip_status = EXCLUDED.egrip_status;

-- 3. Данные клиентов Альфа-Банка (synthetic_alfa_customers)
INSERT INTO public.synthetic_alfa_customers (
    "Id",
    "Inn",
    "OrganizationName",
    "IsAlfaClient",
    "ClientSince",
    "RelationshipMonths",
    "Segment",
    "BranchOffice",
    "AverageMonthlyTurnover",
    "AverageMonthlyExpenses",
    "NetCashFlow",
    "AnnualRevenue",
    "CoefficientOfVariation",
    "MonthlyLoanPaymentsInAlfa",
    "ExistingLoansTotalBalance",
    "ActiveOperatingMonths",
    "Has115FzBlocks",
    "HasBankruptcySigns",
    "HasSuspensionByFns",
    "HasCourtBailiffEnforcements",
    "DaysWithoutOperations",
    "CreatedAt"
) VALUES
(
    '11111111-aaaa-1111-aaaa-111111111111',
    '500100000011',
    'ИП Иванов Иван Иванович',
    true,
    '2019-02-10 00:00:00+00',
    68,
    'Малый бизнес (Торговля)',
    'Отделение «Красная Пресня»',
    700000.00,
    300000.00,
    400000.00,
    8400000.00,
    0.2000,
    30000.00,
    240000.00,
    60,
    false,
    false,
    false,
    false,
    0,
    NOW()
),
(
    '22222222-bbbb-2222-bbbb-222222222222',
    '500100000022',
    'ИП Сидорова Анна Сергеевна',
    true,
    '2021-05-15 00:00:00+00',
    41,
    'Услуги для бизнеса (IT)',
    'Отделение «Тверское»',
    400000.00,
    150000.00,
    250000.00,
    4800000.00,
    0.4500,
    60000.00,
    540000.00,
    36,
    false,
    false,
    false,
    false,
    0,
    NOW()
),
(
    '33333333-cccc-3333-cccc-333333333333',
    '500100000033',
    'ИП Кузнецов Алексей Петрович',
    true,
    '2018-09-01 00:00:00+00',
    73,
    'Производство мебели',
    'Отделение «Сокольники»',
    500000.00,
    420000.00,
    80000.00,
    6000000.00,
    0.6500,
    90000.00,
    1100000.00,
    72,
    false,
    false,
    false,
    false,
    0,
    NOW()
),
(
    '44444444-dddd-4444-dddd-444444444444',
    '500100000077',
    'ИП Петров Михаил Дмитриевич',
    true,
    '2023-01-20 00:00:00+00',
    21,
    'Розничная торговля',
    'Отделение «Арбатское»',
    350000.00,
    180000.00,
    170000.00,
    420000.00,
    0.2800,
    0.00,
    0.00,
    12,
    false,
    false,
    false,
    false,
    0,
    NOW()
),
(
    '55555555-eeee-5555-eeee-555555555555',
    '990000000115',
    'ИП Иванов Сергей Петрович',
    true,
    '2021-09-01 00:00:00+00',
    37,
    'Малый бизнес (Торговля)',
    'Отделение «Центральное»',
    850000.00,
    380000.00,
    470000.00,
    10200000.00,
    0.1800,
    0.00,
    0.00,
    37,
    false,
    false,
    false,
    false,
    0,
    NOW()
)
ON CONFLICT ("Inn") DO UPDATE SET
    "OrganizationName" = EXCLUDED."OrganizationName",
    "AverageMonthlyTurnover" = EXCLUDED."AverageMonthlyTurnover",
    "AverageMonthlyExpenses" = EXCLUDED."AverageMonthlyExpenses",
    "NetCashFlow" = EXCLUDED."NetCashFlow",
    "AnnualRevenue" = EXCLUDED."AnnualRevenue",
    "IsAlfaClient" = EXCLUDED."IsAlfaClient";

-- 4. Расчетные счета клиентов Альфа-Банка (synthetic_alfa_accounts)
INSERT INTO public.synthetic_alfa_accounts (
    "Id", "CustomerId", "AccountNumber", "Currency", "CurrentBalance", "OpenDate", "IsBlocked", "AccountType"
) VALUES
(
    '11111111-0001-aaaa-0001-111111111111',
    (SELECT "Id" FROM public.synthetic_alfa_customers WHERE "Inn" = '500100000011' LIMIT 1),
    '40802810900000000011',
    'RUB',
    1850000.00,
    '2019-02-10 00:00:00+00',
    false,
    'Расчетный счет'
),
(
    '22222222-0002-bbbb-0002-222222222222',
    (SELECT "Id" FROM public.synthetic_alfa_customers WHERE "Inn" = '500100000022' LIMIT 1),
    '40802810900000000022',
    'RUB',
    620000.00,
    '2021-05-15 00:00:00+00',
    false,
    'Расчетный счет'
),
(
    '33333333-0003-cccc-0003-333333333333',
    (SELECT "Id" FROM public.synthetic_alfa_customers WHERE "Inn" = '500100000033' LIMIT 1),
    '40802810900000000033',
    'RUB',
    940000.00,
    '2018-09-01 00:00:00+00',
    false,
    'Расчетный счет'
),
(
    '44444444-0004-dddd-0004-444444444444',
    (SELECT "Id" FROM public.synthetic_alfa_customers WHERE "Inn" = '500100000077' LIMIT 1),
    '40802810900000000077',
    'RUB',
    310000.00,
    '2023-01-20 00:00:00+00',
    false,
    'Расчетный счет'
),
(
    '55555555-0005-eeee-0005-555555555555',
    (SELECT "Id" FROM public.synthetic_alfa_customers WHERE "Inn" = '990000000115' LIMIT 1),
    '40802810900000000115',
    'RUB',
    2150000.00,
    '2021-09-01 00:00:00+00',
    false,
    'Расчетный счет'
)
ON CONFLICT ("Id") DO UPDATE SET
    "CurrentBalance" = EXCLUDED."CurrentBalance",
    "AccountNumber" = EXCLUDED."AccountNumber",
    "AccountType" = EXCLUDED."AccountType";

-- 5. Стоп-факторы ЗСК (synthetic.zsk_risk)
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of) VALUES
('500100000011', 'LOW', '2026-10-21'),
('500100000022', 'LOW', '2026-10-21'),
('500100000033', 'LOW', '2026-10-21'),
('500100000077', 'LOW', '2026-10-21'),
('990000000115', 'LOW', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET
    risk_level = EXCLUDED.risk_level;
