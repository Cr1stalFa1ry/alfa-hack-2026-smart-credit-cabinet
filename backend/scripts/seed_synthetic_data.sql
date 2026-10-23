-- ================================================================
-- СИНТЕТИЧЕСКАЯ БАЗА ДАННЫХ (РЕЕСТРЫ, СТОП-ФАКТОРЫ, ОБОРУДОВАНИЕ)
-- Для проекта Alfa-Hack «Умный кредитный кабинет предпринимателя»
-- ================================================================

CREATE SCHEMA IF NOT EXISTS synthetic;


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

INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('990000000115', '321504530351107', 'Иванов', 'Сергей', 'Петрович', 'Иванов Сергей Петрович', '2021-09-01', 'ACTIVE', NULL, NULL, '50', 'Московская область', '47.11', 'Торговля розничная преимущественно пищевыми продуктами в неспециализированных магазинах', '47.91;46.90', 'УСН (доходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('992934509242', '324527389082738', 'Захаров', 'Виктор', 'Сергеевич', 'Захаров Виктор Сергеевич', '2024-07-01', 'ACTIVE', NULL, NULL, '52', 'Нижегородская область', '31.01', 'Производство мебели для офисов и предприятий торговли', '49.41;18.12', 'ОСНО', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('990750786404', '322669799266838', 'Соловьёв', 'Алексей', 'Андреевич', 'Соловьёв Алексей Андреевич', '2022-05-28', 'ACTIVE', NULL, NULL, '66', 'Свердловская область', '96.02', 'Предоставление услуг парикмахерскими и салонами красоты', '47.91;56.10', 'УСН (доходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('998575834946', '318785520709328', 'Николаева', 'Екатерина', 'Петровна', 'Николаева Екатерина Петровна', '2018-01-28', 'ACTIVE', NULL, NULL, '78', 'г. Санкт-Петербург', '47.11', 'Торговля розничная преимущественно пищевыми продуктами в неспециализированных магазинах', '46.90;47.91', 'УСН (доходы минус расходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('997237475355', '321633185876049', 'Кузьмина', 'Дарья', 'Юрьевна', 'Кузьмина Дарья Юрьевна', '2021-09-08', 'ACTIVE', NULL, NULL, '63', 'Самарская область', '31.01', 'Производство мебели для офисов и предприятий торговли', '45.20;10.71', 'УСН (доходы минус расходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('994209132544', '324028773588868', 'Воробьёва', 'Татьяна', 'Сергеевна', 'Воробьёва Татьяна Сергеевна', '2024-03-01', 'ACTIVE', NULL, NULL, '02', 'Республика Башкортостан', '96.02', 'Предоставление услуг парикмахерскими и салонами красоты', '47.11;56.10', 'ОСНО', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('991802424801', '321239926606723', 'Лебедев', 'Павел', 'Викторович', 'Лебедев Павел Викторович', '2021-08-01', 'ACTIVE', NULL, NULL, '23', 'Краснодарский край', '47.11', 'Торговля розничная преимущественно пищевыми продуктами в неспециализированных магазинах', '56.10;46.90', 'ПСН', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('992136717200', '320233174573520', 'Попова', 'Светлана', 'Андреевна', 'Попова Светлана Андреевна', '2020-05-10', 'ACTIVE', NULL, NULL, '23', 'Краснодарский край', '49.41', 'Деятельность автомобильного грузового транспорта', '18.12;31.01', 'ОСНО', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('998924531779', '323774901221590', 'Соловьёв', 'Виктор', 'Сергеевич', 'Соловьёв Виктор Сергеевич', '2023-05-15', 'ACTIVE', NULL, NULL, '77', 'г. Москва', '96.02', 'Предоставление услуг парикмахерскими и салонами красоты', '47.91;47.11', 'УСН (доходы минус расходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('995940119912', '319526355400300', 'Морозов', 'Илья', 'Олегович', 'Морозов Илья Олегович', '2019-10-26', 'ACTIVE', NULL, NULL, '52', 'Нижегородская область', '47.91', 'Торговля розничная по почте или по информационно-коммуникационной сети Интернет', '47.11;56.10', 'ОСНО', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('991126723717', '317668403483050', 'Семёнов', 'Илья', 'Владимирович', 'Семёнов Илья Владимирович', '2017-10-01', 'ACTIVE', NULL, NULL, '66', 'Свердловская область', '18.12', 'Прочие виды полиграфической деятельности', '10.71;49.41', 'УСН (доходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('994973718155', '320522379373270', 'Попов', 'Андрей', 'Юрьевич', 'Попов Андрей Юрьевич', '2020-12-23', 'ACTIVE', NULL, NULL, '52', 'Нижегородская область', '47.11', 'Торговля розничная преимущественно пищевыми продуктами в неспециализированных магазинах', '47.91;56.10', 'АУСН', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('998911520579', '317521601996820', 'Алексеев', 'Максим', 'Александрович', 'Алексеев Максим Александрович', '2017-05-11', 'ACTIVE', NULL, NULL, '52', 'Нижегородская область', '47.11', 'Торговля розничная преимущественно пищевыми продуктами в неспециализированных магазинах', '47.91;96.02', 'ОСНО', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('993331162602', '321661335237201', 'Фёдорова', 'Светлана', 'Игоревна', 'Фёдорова Светлана Игоревна', '2021-08-01', 'ACTIVE', NULL, NULL, '66', 'Свердловская область', '18.12', 'Прочие виды полиграфической деятельности', '49.41;45.20', 'АУСН', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('995402377840', '317164704235699', 'Егоров', 'Александр', 'Владимирович', 'Егоров Александр Владимирович', '2017-05-24', 'ACTIVE', NULL, NULL, '16', 'Республика Татарстан', '56.10', 'Деятельность ресторанов и услуги по доставке продуктов питания', '47.91;96.02', 'АУСН', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('998456015803', '325526337014115', 'Григорьева', 'Ксения', 'Юрьевна', 'Григорьева Ксения Юрьевна', '2025-03-01', 'ACTIVE', NULL, NULL, '52', 'Нижегородская область', '10.71', 'Производство хлеба и мучных кондитерских изделий', '49.41;31.01', 'ПСН', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('997059195989', '325029801426950', 'Степанова', 'Елена', 'Петровна', 'Степанова Елена Петровна', '2025-02-05', 'ACTIVE', NULL, NULL, '02', 'Республика Башкортостан', '46.90', 'Торговля оптовая неспециализированная', '47.91;96.02', 'ОСНО', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('998561811040', '324029767054306', 'Соколов', 'Роман', 'Сергеевич', 'Соколов Роман Сергеевич', '2024-12-16', 'ACTIVE', NULL, NULL, '02', 'Республика Башкортостан', '49.41', 'Деятельность автомобильного грузового транспорта', '45.20;10.71', 'ПСН', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('992695022198', '323771246834177', 'Макаров', 'Дмитрий', 'Олегович', 'Макаров Дмитрий Олегович', '2023-12-07', 'ACTIVE', NULL, NULL, '77', 'г. Москва', '47.11', 'Торговля розничная преимущественно пищевыми продуктами в неспециализированных магазинах', '46.90;56.10', 'УСН (доходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('991379819032', '323024837455115', 'Семёнов', 'Кирилл', 'Петрович', 'Семёнов Кирилл Петрович', '2023-11-09', 'ACTIVE', NULL, NULL, '02', 'Республика Башкортостан', '31.01', 'Производство мебели для офисов и предприятий торговли', '45.20;10.71', 'УСН (доходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('999189653802', '322549341952978', 'Попова', 'Татьяна', 'Николаевна', 'Попова Татьяна Николаевна', '2022-04-28', 'ACTIVE', NULL, NULL, '54', 'Новосибирская область', '46.90', 'Торговля оптовая неспециализированная', '47.11;56.10', 'ПСН', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('998523591925', '325239291168513', 'Павлова', 'Мария', 'Николаевна', 'Павлова Мария Николаевна', '2025-04-08', 'ACTIVE', NULL, NULL, '23', 'Краснодарский край', '18.12', 'Прочие виды полиграфической деятельности', '31.01;10.71', 'УСН (доходы минус расходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('992138657644', '324773575997359', 'Лебедева', 'Ксения', 'Игоревна', 'Лебедева Ксения Игоревна', '2024-01-08', 'ACTIVE', NULL, NULL, '77', 'г. Москва', '47.11', 'Торговля розничная преимущественно пищевыми продуктами в неспециализированных магазинах', '56.10;46.90', 'АУСН', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('998137090900', '322634046125203', 'Андреев', 'Виктор', 'Олегович', 'Андреев Виктор Олегович', '2022-11-06', 'ACTIVE', NULL, NULL, '63', 'Самарская область', '49.41', 'Деятельность автомобильного грузового транспорта', '18.12;31.01', 'ПСН', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('990000000362', '323662646979081', 'Петров', 'Алексей', 'Николаевич', 'Петров Алексей Николаевич', '2023-09-01', 'ACTIVE', NULL, NULL, '66', 'Свердловская область', '18.12', 'Прочие виды полиграфической деятельности', '31.01;10.71', 'ПСН', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('993878947883', '324166935276091', 'Васильев', 'Роман', 'Игоревич', 'Васильев Роман Игоревич', '2024-08-11', 'ACTIVE', NULL, NULL, '16', 'Республика Татарстан', '56.10', 'Деятельность ресторанов и услуги по доставке продуктов питания', '46.90;47.91', 'УСН (доходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('995379892706', '323789651750956', 'Николаева', 'Ирина', 'Владимировна', 'Николаева Ирина Владимировна', '2023-07-04', 'ACTIVE', NULL, NULL, '78', 'г. Санкт-Петербург', '45.20', 'Техническое обслуживание и ремонт автотранспортных средств', '18.12;10.71', 'ОСНО', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('996085865370', '323161665603110', 'Соловьёв', 'Александр', 'Николаевич', 'Соловьёв Александр Николаевич', '2023-12-01', 'ACTIVE', NULL, NULL, '16', 'Республика Татарстан', '45.20', 'Техническое обслуживание и ремонт автотранспортных средств', '18.12;49.41', 'ПСН', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('990432413409', '322239119728837', 'Семёнов', 'Павел', 'Викторович', 'Семёнов Павел Викторович', '2022-06-01', 'ACTIVE', NULL, NULL, '23', 'Краснодарский край', '47.91', 'Торговля розничная по почте или по информационно-коммуникационной сети Интернет', '96.02;47.11', 'УСН (доходы минус расходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('994380553287', '322233233372343', 'Семёнова', 'Ксения', 'Сергеевна', 'Семёнова Ксения Сергеевна', '2022-12-26', 'ACTIVE', NULL, NULL, '23', 'Краснодарский край', '45.20', 'Техническое обслуживание и ремонт автотранспортных средств', '49.41;18.12', 'ПСН', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('992244219794', '323507072339805', 'Захаров', 'Андрей', 'Олегович', 'Захаров Андрей Олегович', '2023-08-04', 'ACTIVE', NULL, NULL, '50', 'Московская область', '49.41', 'Деятельность автомобильного грузового транспорта', '45.20;18.12', 'УСН (доходы минус расходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('992776526274', '324634214909160', 'Николаев', 'Максим', 'Андреевич', 'Николаев Максим Андреевич', '2024-08-16', 'ACTIVE', NULL, NULL, '63', 'Самарская область', '56.10', 'Деятельность ресторанов и услуги по доставке продуктов питания', '96.02;46.90', 'ОСНО', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('990950641484', '322631417155431', 'Кузьмина', 'Ксения', 'Владимировна', 'Кузьмина Ксения Владимировна', '2022-07-17', 'ACTIVE', NULL, NULL, '63', 'Самарская область', '10.71', 'Производство хлеба и мучных кондитерских изделий', '31.01;49.41', 'АУСН', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('991609452511', '324773800436781', 'Васильев', 'Александр', 'Олегович', 'Васильев Александр Олегович', '2024-07-10', 'ACTIVE', NULL, NULL, '77', 'г. Москва', '31.01', 'Производство мебели для офисов и предприятий торговли', '18.12;10.71', 'УСН (доходы минус расходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('993778538703', '318633208900080', 'Николаева', 'Елена', 'Петровна', 'Николаева Елена Петровна', '2018-12-23', 'ACTIVE', NULL, NULL, '63', 'Самарская область', '46.90', 'Торговля оптовая неспециализированная', '47.91;96.02', 'УСН (доходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('999161049252', '322520181365429', 'Борисова', 'Ольга', 'Викторовна', 'Борисова Ольга Викторовна', '2022-03-01', 'ACTIVE', NULL, NULL, '52', 'Нижегородская область', '46.90', 'Торговля оптовая неспециализированная', '96.02;47.91', 'АУСН', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('998609030311', '323504952797371', 'Степанов', 'Максим', 'Игоревич', 'Степанов Максим Игоревич', '2023-07-01', 'ACTIVE', NULL, NULL, '50', 'Московская область', '96.02', 'Предоставление услуг парикмахерскими и салонами красоты', '47.11;56.10', 'ОСНО', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('990904127612', '326525923531179', 'Макаров', 'Илья', 'Николаевич', 'Макаров Илья Николаевич', '2026-05-23', 'ACTIVE', NULL, NULL, '52', 'Нижегородская область', '56.10', 'Деятельность ресторанов и услуги по доставке продуктов питания', '46.90;47.91', 'УСН (доходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('993766363375', '323165043088583', 'Кузьмин', 'Андрей', 'Олегович', 'Кузьмин Андрей Олегович', '2023-11-01', 'ACTIVE', NULL, NULL, '16', 'Республика Татарстан', '96.02', 'Предоставление услуг парикмахерскими и салонами красоты', '56.10;47.91', 'АУСН', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('992222723768', '326785061763431', 'Воробьёва', 'Дарья', 'Викторовна', 'Воробьёва Дарья Викторовна', '2026-06-16', 'ACTIVE', NULL, NULL, '78', 'г. Санкт-Петербург', '47.91', 'Торговля розничная по почте или по информационно-коммуникационной сети Интернет', '96.02;46.90', 'АУСН', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('995513219350', '323509771967092', 'Борисов', 'Павел', 'Юрьевич', 'Борисов Павел Юрьевич', '2023-11-28', 'ACTIVE', NULL, NULL, '50', 'Московская область', '56.10', 'Деятельность ресторанов и услуги по доставке продуктов питания', '96.02;47.11', 'УСН (доходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('992536997142', '326636593047150', 'Васильев', 'Егор', 'Владимирович', 'Васильев Егор Владимирович', '2026-01-10', 'ACTIVE', NULL, NULL, '63', 'Самарская область', '46.90', 'Торговля оптовая неспециализированная', '56.10;96.02', 'УСН (доходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('992157389091', '321669982726322', 'Зайцев', 'Егор', 'Сергеевич', 'Зайцев Егор Сергеевич', '2021-03-01', 'ACTIVE', NULL, NULL, '66', 'Свердловская область', '47.91', 'Торговля розничная по почте или по информационно-коммуникационной сети Интернет', '56.10;96.02', 'АУСН', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('995464468400', '324787123461798', 'Зайцева', 'Екатерина', 'Николаевна', 'Зайцева Екатерина Николаевна', '2024-09-07', 'ACTIVE', NULL, NULL, '78', 'г. Санкт-Петербург', '10.71', 'Производство хлеба и мучных кондитерских изделий', '45.20;31.01', 'АУСН', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('996473214788', '324631565985178', 'Михайлова', 'Юлия', 'Игоревна', 'Михайлова Юлия Игоревна', '2024-10-01', 'ACTIVE', NULL, NULL, '63', 'Самарская область', '46.90', 'Торговля оптовая неспециализированная', '96.02;47.11', 'УСН (доходы минус расходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('992370382737', '319521796564501', 'Алексеева', 'Татьяна', 'Николаевна', 'Алексеева Татьяна Николаевна', '2019-10-01', 'ACTIVE', NULL, NULL, '52', 'Нижегородская область', '49.41', 'Деятельность автомобильного грузового транспорта', '18.12;45.20', 'УСН (доходы минус расходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('993149112877', '324230113342266', 'Лебедева', 'Наталья', 'Викторовна', 'Лебедева Наталья Викторовна', '2024-07-25', 'ACTIVE', NULL, NULL, '23', 'Краснодарский край', '56.10', 'Деятельность ресторанов и услуги по доставке продуктов питания', '47.91;96.02', 'УСН (доходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('993848857784', '319529057509427', 'Соколова', 'Анастасия', 'Олеговна', 'Соколова Анастасия Олеговна', '2019-03-13', 'ACTIVE', NULL, NULL, '52', 'Нижегородская область', '10.71', 'Производство хлеба и мучных кондитерских изделий', '31.01;45.20', 'УСН (доходы минус расходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('995266995933', '324168412501354', 'Макарова', 'Елена', 'Андреевна', 'Макарова Елена Андреевна', '2024-02-26', 'ACTIVE', NULL, NULL, '16', 'Республика Татарстан', '47.11', 'Торговля розничная преимущественно пищевыми продуктами в неспециализированных магазинах', '47.91;46.90', 'УСН (доходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('991200978947', '319545627156310', 'Макарова', 'Ирина', 'Юрьевна', 'Макарова Ирина Юрьевна', '2019-09-13', 'ACTIVE', NULL, NULL, '54', 'Новосибирская область', '47.11', 'Торговля розничная преимущественно пищевыми продуктами в неспециализированных магазинах', '96.02;47.91', 'АУСН', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('993800094277', '318784925474871', 'Николаев', 'Илья', 'Владимирович', 'Николаев Илья Владимирович', '2018-11-21', 'ACTIVE', NULL, NULL, '78', 'г. Санкт-Петербург', '18.12', 'Прочие виды полиграфической деятельности', '49.41;31.01', 'АУСН', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('992421241367', '323785242827888', 'Романова', 'Юлия', 'Владимировна', 'Романова Юлия Владимировна', '2023-08-27', 'ACTIVE', NULL, NULL, '78', 'г. Санкт-Петербург', '49.41', 'Деятельность автомобильного грузового транспорта', '18.12;10.71', 'ОСНО', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('998620195652', '326540542452324', 'Макаров', 'Илья', 'Александрович', 'Макаров Илья Александрович', '2026-08-20', 'ACTIVE', NULL, NULL, '54', 'Новосибирская область', '18.12', 'Прочие виды полиграфической деятельности', '45.20;10.71', 'НПД', 'Микропредприятие (вновь созданное)', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('995980959851', '326163472606002', 'Козлов', 'Михаил', 'Владимирович', 'Козлов Михаил Владимирович', '2026-10-13', 'ACTIVE', NULL, NULL, '16', 'Республика Татарстан', '10.71', 'Производство хлеба и мучных кондитерских изделий', '31.01;49.41', 'НПД', 'Микропредприятие (вновь созданное)', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('991510350302', '326774832499310', 'Зайцева', 'Вера', 'Сергеевна', 'Зайцева Вера Сергеевна', '2026-10-03', 'ACTIVE', NULL, NULL, '77', 'г. Москва', '49.41', 'Деятельность автомобильного грузового транспорта', '10.71;45.20', 'АУСН', 'Микропредприятие (вновь созданное)', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('992805278597', '326774087748052', 'Павлова', 'Светлана', 'Александровна', 'Павлова Светлана Александровна', '2026-08-11', 'ACTIVE', NULL, NULL, '77', 'г. Москва', '49.41', 'Деятельность автомобильного грузового транспорта', '18.12;10.71', 'ОСНО', 'Микропредприятие (вновь созданное)', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('991336858301', '326775958615871', 'Смирнов', 'Артём', 'Андреевич', 'Смирнов Артём Андреевич', '2026-08-24', 'ACTIVE', NULL, NULL, '77', 'г. Москва', '56.10', 'Деятельность ресторанов и услуги по доставке продуктов питания', '96.02;47.11', 'ПСН', 'Микропредприятие (вновь созданное)', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('992036192703', '326500728147719', 'Никитин', 'Павел', 'Владимирович', 'Никитин Павел Владимирович', '2026-07-09', 'ACTIVE', NULL, NULL, '50', 'Московская область', '96.02', 'Предоставление услуг парикмахерскими и салонами красоты', '47.91;46.90', 'ОСНО', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('994262722612', '326778373320601', 'Андреева', 'Юлия', 'Николаевна', 'Андреева Юлия Николаевна', '2026-09-03', 'ACTIVE', NULL, NULL, '77', 'г. Москва', '56.10', 'Деятельность ресторанов и услуги по доставке продуктов питания', '47.11;46.90', 'АУСН', 'Микропредприятие (вновь созданное)', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('996742086400', '326166527598210', 'Новикова', 'Мария', 'Игоревна', 'Новикова Мария Игоревна', '2026-07-06', 'ACTIVE', NULL, NULL, '16', 'Республика Татарстан', '46.90', 'Торговля оптовая неспециализированная', '96.02;47.11', 'УСН (доходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('995105295641', '326231787636258', 'Николаев', 'Илья', 'Викторович', 'Николаев Илья Викторович', '2026-08-28', 'ACTIVE', NULL, NULL, '23', 'Краснодарский край', '56.10', 'Деятельность ресторанов и услуги по доставке продуктов питания', '46.90;47.91', 'АУСН', 'Микропредприятие (вновь созданное)', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('990000000299', '326525375772138', 'Сидорова', 'Анна', 'Викторовна', 'Сидорова Анна Викторовна', '2026-10-01', 'ACTIVE', NULL, NULL, '52', 'Нижегородская область', '31.01', 'Производство мебели для офисов и предприятий торговли', '10.71;49.41', 'УСН (доходы)', 'Микропредприятие (вновь созданное)', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('999343085833', '326635909293972', 'Васильев', 'Дмитрий', 'Сергеевич', 'Васильев Дмитрий Сергеевич', '2026-08-19', 'ACTIVE', NULL, NULL, '63', 'Самарская область', '18.12', 'Прочие виды полиграфической деятельности', '45.20;31.01', 'АУСН', 'Микропредприятие (вновь созданное)', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('994498886107', '326164403966777', 'Соловьёва', 'Ольга', 'Александровна', 'Соловьёва Ольга Александровна', '2026-08-06', 'ACTIVE', NULL, NULL, '16', 'Республика Татарстан', '45.20', 'Техническое обслуживание и ремонт автотранспортных средств', '18.12;49.41', 'АУСН', 'Микропредприятие (вновь созданное)', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('998054434184', '326520999935846', 'Воробьёва', 'Мария', 'Александровна', 'Воробьёва Мария Александровна', '2026-08-20', 'ACTIVE', NULL, NULL, '52', 'Нижегородская область', '18.12', 'Прочие виды полиграфической деятельности', '49.41;10.71', 'ПСН', 'Микропредприятие (вновь созданное)', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('995086037890', '326026175547521', 'Макаров', 'Михаил', 'Сергеевич', 'Макаров Михаил Сергеевич', '2026-09-12', 'ACTIVE', NULL, NULL, '02', 'Республика Башкортостан', '49.41', 'Деятельность автомобильного грузового транспорта', '31.01;18.12', 'ОСНО', 'Микропредприятие (вновь созданное)', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('998244860543', '326163304682617', 'Андреева', 'Елена', 'Юрьевна', 'Андреева Елена Юрьевна', '2026-09-05', 'ACTIVE', NULL, NULL, '16', 'Республика Татарстан', '49.41', 'Деятельность автомобильного грузового транспорта', '31.01;10.71', 'ПСН', 'Микропредприятие (вновь созданное)', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('994347632171', '326026199759932', 'Романов', 'Олег', 'Викторович', 'Романов Олег Викторович', '2026-10-18', 'ACTIVE', NULL, NULL, '02', 'Республика Башкортостан', '49.41', 'Деятельность автомобильного грузового транспорта', '10.71;18.12', 'НПД', 'Микропредприятие (вновь созданное)', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('990888696312', '326508351460731', 'Романова', 'Екатерина', 'Андреевна', 'Романова Екатерина Андреевна', '2026-09-12', 'ACTIVE', NULL, NULL, '50', 'Московская область', '10.71', 'Производство хлеба и мучных кондитерских изделий', '31.01;45.20', 'УСН (доходы минус расходы)', 'Микропредприятие (вновь созданное)', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('996791345833', '326528226797091', 'Захаров', 'Олег', 'Викторович', 'Захаров Олег Викторович', '2026-08-15', 'ACTIVE', NULL, NULL, '52', 'Нижегородская область', '10.71', 'Производство хлеба и мучных кондитерских изделий', '45.20;31.01', 'НПД', 'Микропредприятие (вновь созданное)', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('990301724986', '326023343391092', 'Васильев', 'Андрей', 'Викторович', 'Васильев Андрей Викторович', '2026-10-10', 'ACTIVE', NULL, NULL, '02', 'Республика Башкортостан', '45.20', 'Техническое обслуживание и ремонт автотранспортных средств', '49.41;10.71', 'ОСНО', 'Микропредприятие (вновь созданное)', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('995954537846', '326522487797665', 'Воробьёв', 'Павел', 'Олегович', 'Воробьёв Павел Олегович', '2026-09-18', 'ACTIVE', NULL, NULL, '52', 'Нижегородская область', '49.41', 'Деятельность автомобильного грузового транспорта', '18.12;45.20', 'УСН (доходы минус расходы)', 'Микропредприятие (вновь созданное)', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('993463525531', '326634439298658', 'Орлова', 'Дарья', 'Викторовна', 'Орлова Дарья Викторовна', '2026-08-20', 'ACTIVE', NULL, NULL, '63', 'Самарская область', '31.01', 'Производство мебели для офисов и предприятий торговли', '18.12;49.41', 'УСН (доходы минус расходы)', 'Микропредприятие (вновь созданное)', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('997354447295', '326788740974800', 'Андреева', 'Наталья', 'Андреевна', 'Андреева Наталья Андреевна', '2026-10-08', 'ACTIVE', NULL, NULL, '78', 'г. Санкт-Петербург', '18.12', 'Прочие виды полиграфической деятельности', '10.71;49.41', 'ОСНО', 'Микропредприятие (вновь созданное)', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('996634317106', '326785480634644', 'Никитина', 'Татьяна', 'Николаевна', 'Никитина Татьяна Николаевна', '2026-09-11', 'ACTIVE', NULL, NULL, '78', 'г. Санкт-Петербург', '18.12', 'Прочие виды полиграфической деятельности', '10.71;49.41', 'АУСН', 'Микропредприятие (вновь созданное)', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('990837660300', '326549370928151', 'Егорова', 'Ирина', 'Владимировна', 'Егорова Ирина Владимировна', '2026-08-10', 'ACTIVE', NULL, NULL, '54', 'Новосибирская область', '31.01', 'Производство мебели для офисов и предприятий торговли', '45.20;18.12', 'НПД', 'Микропредприятие (вновь созданное)', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('990155729503', '326025387272022', 'Николаев', 'Олег', 'Олегович', 'Николаев Олег Олегович', '2026-08-05', 'ACTIVE', NULL, NULL, '02', 'Республика Башкортостан', '31.01', 'Производство мебели для офисов и предприятий торговли', '45.20;49.41', 'ПСН', 'Микропредприятие (вновь созданное)', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('997735670302', '326544875161246', 'Макарова', 'Полина', 'Сергеевна', 'Макарова Полина Сергеевна', '2026-09-18', 'ACTIVE', NULL, NULL, '54', 'Новосибирская область', '18.12', 'Прочие виды полиграфической деятельности', '10.71;45.20', 'ОСНО', 'Микропредприятие (вновь созданное)', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('994736738702', '319022838924975', 'Соловьёв', 'Илья', 'Юрьевич', 'Соловьёв Илья Юрьевич', '2019-09-15', 'ACTIVE', NULL, NULL, '02', 'Республика Башкортостан', '56.10', 'Деятельность ресторанов и услуги по доставке продуктов питания', '47.11;46.90', 'УСН (доходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('995351862130', '324021288244442', 'Лебедев', 'Андрей', 'Николаевич', 'Лебедев Андрей Николаевич', '2024-03-16', 'ACTIVE', NULL, NULL, '02', 'Республика Башкортостан', '47.91', 'Торговля розничная по почте или по информационно-коммуникационной сети Интернет', '47.11;46.90', 'УСН (доходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('998809979516', '318237597857823', 'Козлова', 'Дарья', 'Александровна', 'Козлова Дарья Александровна', '2018-04-14', 'ACTIVE', NULL, NULL, '23', 'Краснодарский край', '18.12', 'Прочие виды полиграфической деятельности', '10.71;49.41', 'АУСН', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('999767928999', '319771269024461', 'Макаров', 'Алексей', 'Олегович', 'Макаров Алексей Олегович', '2019-07-14', 'ACTIVE', NULL, NULL, '77', 'г. Москва', '49.41', 'Деятельность автомобильного грузового транспорта', '10.71;45.20', 'УСН (доходы минус расходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('996152142806', '326788637754064', 'Кузьмина', 'Ольга', 'Сергеевна', 'Кузьмина Ольга Сергеевна', '2026-10-17', 'ACTIVE', NULL, NULL, '78', 'г. Санкт-Петербург', '31.01', 'Производство мебели для офисов и предприятий торговли', '45.20;10.71', 'УСН (доходы минус расходы)', 'Микропредприятие (вновь созданное)', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('999904307315', '320783885885657', 'Попов', 'Роман', 'Николаевич', 'Попов Роман Николаевич', '2020-03-27', 'ACTIVE', NULL, NULL, '78', 'г. Санкт-Петербург', '18.12', 'Прочие виды полиграфической деятельности', '10.71;49.41', 'ОСНО', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('996230601785', '326778434156330', 'Волков', 'Андрей', 'Юрьевич', 'Волков Андрей Юрьевич', '2026-10-08', 'ACTIVE', NULL, NULL, '77', 'г. Москва', '96.02', 'Предоставление услуг парикмахерскими и салонами красоты', '47.91;47.11', 'УСН (доходы)', 'Микропредприятие (вновь созданное)', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('990439082241', '317662962912567', 'Андреева', 'Татьяна', 'Сергеевна', 'Андреева Татьяна Сергеевна', '2017-05-18', 'ACTIVE', NULL, NULL, '66', 'Свердловская область', '10.71', 'Производство хлеба и мучных кондитерских изделий', '45.20;18.12', 'УСН (доходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('992019950851', '317522202838913', 'Михайлова', 'Вера', 'Игоревна', 'Михайлова Вера Игоревна', '2017-04-17', 'ACTIVE', NULL, NULL, '52', 'Нижегородская область', '56.10', 'Деятельность ресторанов и услуги по доставке продуктов питания', '46.90;47.11', 'ОСНО', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('998932904939', '317787210796684', 'Андреева', 'Светлана', 'Владимировна', 'Андреева Светлана Владимировна', '2017-04-01', 'ACTIVE', NULL, NULL, '78', 'г. Санкт-Петербург', '96.02', 'Предоставление услуг парикмахерскими и салонами красоты', '46.90;56.10', 'УСН (доходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('996582914652', '319773223044451', 'Яковлев', 'Олег', 'Николаевич', 'Яковлев Олег Николаевич', '2019-03-08', 'TERMINATED', '2026-06-15', 'Прекращение деятельности по решению ИП (ст. 22.3 129-ФЗ)', '77', 'г. Москва', '10.71', 'Производство хлеба и мучных кондитерских изделий', '49.41;18.12', 'АУСН', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('992407494398', '323508362385542', 'Волков', 'Алексей', 'Андреевич', 'Волков Алексей Андреевич', '2023-06-15', 'TERMINATED', '2025-12-01', 'Исключение из ЕГРИП по решению регистрирующего органа (ст. 22.4 129-ФЗ)', '50', 'Московская область', '96.02', 'Предоставление услуг парикмахерскими и салонами красоты', '56.10;47.91', 'АУСН', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('991374629221', '320631276917543', 'Смирнова', 'Ксения', 'Олеговна', 'Смирнова Ксения Олеговна', '2020-05-07', 'ACTIVE', NULL, NULL, '63', 'Самарская область', '96.02', 'Предоставление услуг парикмахерскими и салонами красоты', '47.11;47.91', 'ПСН', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('994048621478', '324543045254710', 'Павлова', 'Мария', 'Викторовна', 'Павлова Мария Викторовна', '2024-05-01', 'ACTIVE', NULL, NULL, '54', 'Новосибирская область', '46.90', 'Торговля оптовая неспециализированная', '47.11;47.91', 'АУСН', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('995958674890', '318503250781411', 'Козлова', 'Екатерина', 'Игоревна', 'Козлова Екатерина Игоревна', '2018-05-23', 'ACTIVE', NULL, NULL, '50', 'Московская область', '46.90', 'Торговля оптовая неспециализированная', '56.10;47.11', 'ОСНО', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('991026997200', '318506270297758', 'Андреев', 'Роман', 'Андреевич', 'Андреев Роман Андреевич', '2018-03-01', 'ACTIVE', NULL, NULL, '50', 'Московская область', '56.10', 'Деятельность ресторанов и услуги по доставке продуктов питания', '46.90;96.02', 'УСН (доходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('990000000436', '326540606119122', 'Кузнецова', 'Мария', 'Олеговна', 'Кузнецова Мария Олеговна', '2026-10-01', 'ACTIVE', NULL, NULL, '54', 'Новосибирская область', '56.10', 'Деятельность ресторанов и услуги по доставке продуктов питания', '96.02;47.91', 'НПД', 'Микропредприятие (вновь созданное)', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('993149044345', '326027418095340', 'Захарова', 'Наталья', 'Петровна', 'Захарова Наталья Петровна', '2026-08-08', 'ACTIVE', NULL, NULL, '02', 'Республика Башкортостан', '47.11', 'Торговля розничная преимущественно пищевыми продуктами в неспециализированных магазинах', '96.02;47.91', 'УСН (доходы)', 'Микропредприятие (вновь созданное)', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('996667015950', '326662252057116', 'Орлова', 'Елена', 'Владимировна', 'Орлова Елена Владимировна', '2026-08-11', 'ACTIVE', NULL, NULL, '66', 'Свердловская область', '47.11', 'Торговля розничная преимущественно пищевыми продуктами в неспециализированных магазинах', '96.02;56.10', 'ПСН', 'Микропредприятие (вновь созданное)', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('996773157146', '326631586385802', 'Новиков', 'Роман', 'Олегович', 'Новиков Роман Олегович', '2026-08-10', 'ACTIVE', NULL, NULL, '63', 'Самарская область', '47.91', 'Торговля розничная по почте или по информационно-коммуникационной сети Интернет', '46.90;56.10', 'УСН (доходы минус расходы)', 'Микропредприятие (вновь созданное)', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('995843689392', '322232185687783', 'Никитина', 'Ксения', 'Николаевна', 'Никитина Ксения Николаевна', '2022-03-14', 'ACTIVE', NULL, NULL, '23', 'Краснодарский край', '56.10', 'Деятельность ресторанов и услуги по доставке продуктов питания', '47.11;46.90', 'АУСН', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('993441968459', '322021219325954', 'Волкова', 'Светлана', 'Игоревна', 'Волкова Светлана Игоревна', '2022-03-14', 'ACTIVE', NULL, NULL, '02', 'Республика Башкортостан', '47.91', 'Торговля розничная по почте или по информационно-коммуникационной сети Интернет', '96.02;47.11', 'УСН (доходы минус расходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('996229846036', '322526946272592', 'Фёдорова', 'Ксения', 'Николаевна', 'Фёдорова Ксения Николаевна', '2022-03-14', 'ACTIVE', NULL, NULL, '52', 'Нижегородская область', '96.02', 'Предоставление услуг парикмахерскими и салонами красоты', '46.90;47.91', 'УСН (доходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('993468143744', '322669153874785', 'Морозова', 'Дарья', 'Александровна', 'Морозова Дарья Александровна', '2022-03-14', 'ACTIVE', NULL, NULL, '66', 'Свердловская область', '96.02', 'Предоставление услуг парикмахерскими и салонами красоты', '47.91;56.10', 'УСН (доходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('990742590013', '322789669849140', 'Козлов', 'Павел', 'Александрович', 'Козлов Павел Александрович', '2022-03-14', 'ACTIVE', NULL, NULL, '78', 'г. Санкт-Петербург', '56.10', 'Деятельность ресторанов и услуги по доставке продуктов питания', '46.90;47.11', 'АУСН', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('995327035122', '322507886423301', 'Никитин', 'Роман', 'Сергеевич', 'Никитин Роман Сергеевич', '2022-03-14', 'ACTIVE', NULL, NULL, '50', 'Московская область', '96.02', 'Предоставление услуг парикмахерскими и салонами красоты', '47.11;46.90', 'НПД', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('993649050001', '326787916015102', 'Попов', 'Андрей', 'Петрович', 'Попов Андрей Петрович', '2026-10-01', 'ACTIVE', NULL, NULL, '78', 'г. Санкт-Петербург', '49.41', 'Деятельность автомобильного грузового транспорта', '31.01;18.12', 'АУСН', 'Микропредприятие (вновь созданное)', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('995606156286', '323235728090210', 'Новикова', 'Ольга', 'Олеговна', 'Новикова Ольга Олеговна', '2023-09-01', 'ACTIVE', NULL, NULL, '23', 'Краснодарский край', '49.41', 'Деятельность автомобильного грузового транспорта', '10.71;45.20', 'ПСН', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('996550203790', '323540226282564', 'Морозов', 'Виктор', 'Игоревич', 'Морозов Виктор Игоревич', '2023-09-01', 'ACTIVE', NULL, NULL, '54', 'Новосибирская область', '31.01', 'Производство мебели для офисов и предприятий торговли', '49.41;45.20', 'ОСНО', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('993458262326', '323784171175812', 'Волков', 'Роман', 'Андреевич', 'Волков Роман Андреевич', '2023-09-01', 'ACTIVE', NULL, NULL, '78', 'г. Санкт-Петербург', '18.12', 'Прочие виды полиграфической деятельности', '45.20;31.01', 'УСН (доходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('991098965976', '321549303377922', 'Романова', 'Дарья', 'Олеговна', 'Романова Дарья Олеговна', '2021-09-01', 'ACTIVE', NULL, NULL, '54', 'Новосибирская область', '46.90', 'Торговля оптовая неспециализированная', '47.11;47.91', 'УСН (доходы)', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;
INSERT INTO synthetic.egrip (inn, ogrnip, last_name, first_name, patronymic, full_name, registration_date, egrip_status, termination_date, termination_reason, region_code, region_name, okved_main, okved_main_name, okved_additional, tax_regime, msp_category, record_as_of)
VALUES ('994069375671', '323664519062931', 'Яковлев', 'Дмитрий', 'Игоревич', 'Яковлев Дмитрий Игоревич', '2023-09-01', 'ACTIVE', NULL, NULL, '66', 'Свердловская область', '18.12', 'Прочие виды полиграфической деятельности', '10.71;45.20', 'ОСНО', 'Микропредприятие', '2026-10-21')
ON CONFLICT (inn) DO UPDATE SET full_name = EXCLUDED.full_name, okved_main = EXCLUDED.okved_main;

CREATE TABLE IF NOT EXISTS synthetic.fns_account_blocks (
    id SERIAL PRIMARY KEY,
    inn VARCHAR(12) NOT NULL,
    decision_number VARCHAR(50),
    decision_date DATE,
    tax_office_code VARCHAR(20),
    bank_bik VARCHAR(20)
);

INSERT INTO synthetic.fns_account_blocks (inn, decision_number, decision_date, tax_office_code, bank_bik)
VALUES ('995843689392', '12345', '2026-09-30', '7701', '044525999');

CREATE TABLE IF NOT EXISTS synthetic.zsk_risk (
    inn VARCHAR(12) PRIMARY KEY,
    risk_level VARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH
    as_of DATE
);

INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('990000000115', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('992934509242', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('990750786404', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('998575834946', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('997237475355', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('994209132544', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('991802424801', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('992136717200', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('998924531779', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('995940119912', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('991126723717', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('994973718155', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('998911520579', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('993331162602', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('995402377840', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('998456015803', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('997059195989', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('998561811040', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('992695022198', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('991379819032', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('999189653802', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('998523591925', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('992138657644', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('998137090900', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('990000000362', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('993878947883', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('995379892706', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('996085865370', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('990432413409', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('994380553287', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('992244219794', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('992776526274', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('990950641484', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('991609452511', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('993778538703', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('999161049252', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('998609030311', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('990904127612', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('993766363375', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('992222723768', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('995513219350', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('992536997142', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('992157389091', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('995464468400', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('996473214788', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('992370382737', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('993149112877', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('993848857784', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('995266995933', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('991200978947', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('993800094277', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('992421241367', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('998620195652', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('995980959851', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('991510350302', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('992805278597', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('991336858301', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('992036192703', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('994262722612', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('996742086400', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('995105295641', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('990000000299', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('999343085833', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('994498886107', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('998054434184', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('995086037890', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('998244860543', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('994347632171', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('990888696312', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('996791345833', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('990301724986', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('995954537846', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('993463525531', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('997354447295', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('996634317106', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('990837660300', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('990155729503', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('997735670302', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('994736738702', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('995351862130', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('998809979516', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('999767928999', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('996152142806', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('999904307315', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('996230601785', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('990439082241', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('992019950851', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('998932904939', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('996582914652', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('992407494398', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('991374629221', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('994048621478', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('995958674890', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('991026997200', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('990000000436', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('993149044345', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('996667015950', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('996773157146', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('995843689392', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('993441968459', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('996229846036', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('993468143744', 'HIGH', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('990742590013', 'MEDIUM', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('995327035122', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('993649050001', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('995606156286', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('996550203790', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('993458262326', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('991098965976', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;
INSERT INTO synthetic.zsk_risk (inn, risk_level, as_of)
VALUES ('994069375671', 'LOW', '2026-10-20')
ON CONFLICT (inn) DO UPDATE SET risk_level = EXCLUDED.risk_level;

CREATE TABLE IF NOT EXISTS synthetic.efrsb_bankruptcies (
    id SERIAL PRIMARY KEY,
    inn VARCHAR(12) NOT NULL,
    message_type VARCHAR(100),
    procedure VARCHAR(100),
    case_number VARCHAR(50),
    start_date DATE,
    completed_date DATE
);

INSERT INTO synthetic.efrsb_bankruptcies (inn, message_type, procedure, case_number, start_date, completed_date)
VALUES ('993441968459', 'Сообщение о судебном акте', 'Реструктуризация долгов', 'А40-99999/2024', '2024-02-01', NULL);
INSERT INTO synthetic.efrsb_bankruptcies (inn, message_type, procedure, case_number, start_date, completed_date)
VALUES ('996229846036', 'Сообщение о судебном акте', 'Реализация имущества', 'А40-99999/2024', '2024-02-01', '2024-11-20');

CREATE TABLE IF NOT EXISTS synthetic.equipment_catalog (
    category VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    reference_price_rub NUMERIC(18, 2) NOT NULL
);

INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-001', 'Форматно-раскроечный станок', 2126000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-002', 'Форматно-раскроечный станок', 3407000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-003', 'Седельный тягач', 610000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-004', 'Цифровая печатная машина', 3397000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-005', 'Цифровая печатная машина', 4412000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-006', 'Ротационная хлебопекарная печь', 1460000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-007', 'Седельный тягач', 1308000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-008', 'Форматно-раскроечный станок', 2234000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-009', 'Цифровая печатная машина', 2131000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-010', 'Седельный тягач', 1107000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-011', 'Цифровая печатная машина', 2668000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-012', 'Подъёмник и стенд развал-схождения', 2610000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-013', 'Подъёмник и стенд развал-схождения', 5344000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-014', 'Подъёмник и стенд развал-схождения', 4554000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-015', 'Седельный тягач', 5066000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-016', 'Ротационная хлебопекарная печь', 2135000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-017', 'Форматно-раскроечный станок', 3902000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-018', 'Ротационная хлебопекарная печь', 5854000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-019', 'Седельный тягач', 654000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-020', 'Ротационная хлебопекарная печь', 1181000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-021', 'Цифровая печатная машина', 4296000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-022', 'Седельный тягач', 6407000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-023', 'Цифровая печатная машина', 2068000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-024', 'Ротационная хлебопекарная печь', 2662000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-025', 'Седельный тягач', 1159000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-026', 'Седельный тягач', 2826000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-027', 'Форматно-раскроечный станок', 1889000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-028', 'Цифровая печатная машина', 2332000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-029', 'Подъёмник и стенд развал-схождения', 3548000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-030', 'Цифровая печатная машина', 420000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-031', 'Седельный тягач', 3761000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-032', 'Седельный тягач', 3069000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-033', 'Седельный тягач', 2535000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-034', 'Ротационная хлебопекарная печь', 2589000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-035', 'Ротационная хлебопекарная печь', 390000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-036', 'Подъёмник и стенд развал-схождения', 3204000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-037', 'Седельный тягач', 568000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-038', 'Форматно-раскроечный станок', 4142000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-039', 'Цифровая печатная машина', 1309000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-040', 'Цифровая печатная машина', 2492000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-041', 'Форматно-раскроечный станок', 1990000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-042', 'Форматно-раскроечный станок', 690000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-043', 'Цифровая печатная машина', 2287000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-044', 'Цифровая печатная машина', 6862000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-045', 'Седельный тягач', 784000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-046', 'Форматно-раскроечный станок', 3035000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-047', 'Цифровая печатная машина', 1288000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-048', 'Ротационная хлебопекарная печь', 5881000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-049', 'Ротационная хлебопекарная печь', 1657000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-050', 'Ротационная хлебопекарная печь', 3901000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-051', 'Седельный тягач', 2000000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-052', 'Седельный тягач', 2500000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-053', 'Форматно-раскроечный станок', 2500000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-054', 'Цифровая печатная машина', 1250000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;
INSERT INTO synthetic.equipment_catalog (category, name, reference_price_rub)
VALUES ('EQ-055', 'Цифровая печатная машина', 2500000.00)
ON CONFLICT (category) DO UPDATE SET reference_price_rub = EXCLUDED.reference_price_rub;

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

INSERT INTO synthetic.suppliers (inn, ogrn, name, registration_date, status, address, mass_address, phone, email, director_inn)
VALUES ('9990927815', '1147750944870', 'ООО «Техно-Сервис 815»', '2014-09-15', 'ACTIVE', 'г. Москва, ул. Промышленная, д. 29', FALSE, '+7 495 396-13-38', 'sales7815@example.org', NULL)
ON CONFLICT (inn) DO UPDATE SET name = EXCLUDED.name, mass_address = EXCLUDED.mass_address;
INSERT INTO synthetic.suppliers (inn, ogrn, name, registration_date, status, address, mass_address, phone, email, director_inn)
VALUES ('9901477331', '1097768949419', 'ООО «Техно-Сервис 331»', '2009-10-15', 'ACTIVE', 'г. Москва, ул. Промышленная, д. 89', FALSE, '+7 495 410-98-91', 'sales7331@example.org', NULL)
ON CONFLICT (inn) DO UPDATE SET name = EXCLUDED.name, mass_address = EXCLUDED.mass_address;
INSERT INTO synthetic.suppliers (inn, ogrn, name, registration_date, status, address, mass_address, phone, email, director_inn)
VALUES ('9967955733', '1147709872174', 'ООО «Индустрия-Маркет 733»', '2014-10-15', 'ACTIVE', 'г. Москва, ул. Промышленная, д. 44', FALSE, '+7 495 961-46-89', 'sales5733@example.org', NULL)
ON CONFLICT (inn) DO UPDATE SET name = EXCLUDED.name, mass_address = EXCLUDED.mass_address;
INSERT INTO synthetic.suppliers (inn, ogrn, name, registration_date, status, address, mass_address, phone, email, director_inn)
VALUES ('9985733934', '1107736238993', 'ООО «Техно-Снаб 934»', '2010-02-15', 'ACTIVE', 'г. Москва, ул. Промышленная, д. 41', FALSE, '+7 495 210-90-47', 'sales3934@example.org', NULL)
ON CONFLICT (inn) DO UPDATE SET name = EXCLUDED.name, mass_address = EXCLUDED.mass_address;
INSERT INTO synthetic.suppliers (inn, ogrn, name, registration_date, status, address, mass_address, phone, email, director_inn)
VALUES ('9964739727', '1087763901929', 'ООО «Техно-Комплект 727»', '2008-06-15', 'ACTIVE', 'г. Москва, ул. Промышленная, д. 25', FALSE, '+7 495 293-26-43', 'sales9727@example.org', NULL)
ON CONFLICT (inn) DO UPDATE SET name = EXCLUDED.name, mass_address = EXCLUDED.mass_address;
INSERT INTO synthetic.suppliers (inn, ogrn, name, registration_date, status, address, mass_address, phone, email, director_inn)
VALUES ('9908255183', '1197795276032', 'ООО «Техно-Комплект 183»', '2019-04-15', 'ACTIVE', 'г. Москва, ул. Промышленная, д. 5', FALSE, '+7 495 856-98-93', 'sales5183@example.org', NULL)
ON CONFLICT (inn) DO UPDATE SET name = EXCLUDED.name, mass_address = EXCLUDED.mass_address;
INSERT INTO synthetic.suppliers (inn, ogrn, name, registration_date, status, address, mass_address, phone, email, director_inn)
VALUES ('9961994172', '1207779184917', 'ООО «Оборудование-Комплект 172»', '2020-06-15', 'ACTIVE', 'г. Москва, ул. Промышленная, д. 70', FALSE, '+7 495 254-39-71', 'sales4172@example.org', NULL)
ON CONFLICT (inn) DO UPDATE SET name = EXCLUDED.name, mass_address = EXCLUDED.mass_address;
INSERT INTO synthetic.suppliers (inn, ogrn, name, registration_date, status, address, mass_address, phone, email, director_inn)
VALUES ('9958033620', '1157721108322', 'ООО «Техно-Маркет 620»', '2015-12-15', 'ACTIVE', 'г. Москва, ул. Промышленная, д. 2', FALSE, '+7 495 328-11-84', 'sales3620@example.org', NULL)
ON CONFLICT (inn) DO UPDATE SET name = EXCLUDED.name, mass_address = EXCLUDED.mass_address;
INSERT INTO synthetic.suppliers (inn, ogrn, name, registration_date, status, address, mass_address, phone, email, director_inn)
VALUES ('9993280999', '1207775628782', 'ООО «Индустрия-Маркет 999»', '2020-10-15', 'ACTIVE', 'г. Москва, ул. Промышленная, д. 26', FALSE, '+7 495 514-24-56', 'sales0999@example.org', NULL)
ON CONFLICT (inn) DO UPDATE SET name = EXCLUDED.name, mass_address = EXCLUDED.mass_address;
INSERT INTO synthetic.suppliers (inn, ogrn, name, registration_date, status, address, mass_address, phone, email, director_inn)
VALUES ('9937546571', '1137706439988', 'ООО «Техно-Комплект 571»', '2013-02-15', 'ACTIVE', 'г. Москва, ул. Промышленная, д. 87', FALSE, '+7 495 738-70-25', 'sales6571@example.org', NULL)
ON CONFLICT (inn) DO UPDATE SET name = EXCLUDED.name, mass_address = EXCLUDED.mass_address;
INSERT INTO synthetic.suppliers (inn, ogrn, name, registration_date, status, address, mass_address, phone, email, director_inn)
VALUES ('9900905432', '1107736513811', 'ООО «Индустрия-Снаб 432»', '2010-03-15', 'ACTIVE', 'г. Москва, ул. Промышленная, д. 10', FALSE, '+7 495 106-65-45', 'sales5432@example.org', NULL)
ON CONFLICT (inn) DO UPDATE SET name = EXCLUDED.name, mass_address = EXCLUDED.mass_address;
INSERT INTO synthetic.suppliers (inn, ogrn, name, registration_date, status, address, mass_address, phone, email, director_inn)
VALUES ('9987862371', '1107737496927', 'ООО «Пром-Снаб 371»', '2010-12-15', 'ACTIVE', 'г. Москва, ул. Промышленная, д. 62', FALSE, '+7 495 368-18-75', 'sales2371@example.org', NULL)
ON CONFLICT (inn) DO UPDATE SET name = EXCLUDED.name, mass_address = EXCLUDED.mass_address;
INSERT INTO synthetic.suppliers (inn, ogrn, name, registration_date, status, address, mass_address, phone, email, director_inn)
VALUES ('9955348621', '1207738136442', 'ООО «Оборудование-Снаб 621»', '2020-10-15', 'ACTIVE', 'г. Москва, ул. Промышленная, д. 63', FALSE, '+7 495 407-61-61', 'sales8621@example.org', NULL)
ON CONFLICT (inn) DO UPDATE SET name = EXCLUDED.name, mass_address = EXCLUDED.mass_address;
INSERT INTO synthetic.suppliers (inn, ogrn, name, registration_date, status, address, mass_address, phone, email, director_inn)
VALUES ('9975461167', '1127733842664', 'ООО «Техно-Маркет 167»', '2012-09-15', 'ACTIVE', 'г. Москва, ул. Промышленная, д. 17', FALSE, '+7 495 235-94-26', 'sales1167@example.org', NULL)
ON CONFLICT (inn) DO UPDATE SET name = EXCLUDED.name, mass_address = EXCLUDED.mass_address;
INSERT INTO synthetic.suppliers (inn, ogrn, name, registration_date, status, address, mass_address, phone, email, director_inn)
VALUES ('9966429047', '1097711304785', 'ООО «Индустрия-Комплект 047»', '2009-08-15', 'ACTIVE', 'г. Москва, ул. Промышленная, д. 36', FALSE, '+7 495 689-27-45', 'sales9047@example.org', NULL)
ON CONFLICT (inn) DO UPDATE SET name = EXCLUDED.name, mass_address = EXCLUDED.mass_address;
INSERT INTO synthetic.suppliers (inn, ogrn, name, registration_date, status, address, mass_address, phone, email, director_inn)
VALUES ('9984416185', '1197704652559', 'ООО «Индустрия-Сервис 185»', '2019-09-15', 'ACTIVE', 'г. Москва, ул. Промышленная, д. 90', FALSE, '+7 495 339-81-72', 'sales6185@example.org', NULL)
ON CONFLICT (inn) DO UPDATE SET name = EXCLUDED.name, mass_address = EXCLUDED.mass_address;
INSERT INTO synthetic.suppliers (inn, ogrn, name, registration_date, status, address, mass_address, phone, email, director_inn)
VALUES ('9945587388', '1097760751033', 'ООО «Оборудование-Сервис 388»', '2009-09-15', 'ACTIVE', 'г. Москва, ул. Промышленная, д. 33', FALSE, '+7 495 234-39-86', 'sales7388@example.org', NULL)
ON CONFLICT (inn) DO UPDATE SET name = EXCLUDED.name, mass_address = EXCLUDED.mass_address;
INSERT INTO synthetic.suppliers (inn, ogrn, name, registration_date, status, address, mass_address, phone, email, director_inn)
VALUES ('9918934554', '1137766643680', 'ООО «Индустрия-Маркет 554»', '2013-09-15', 'ACTIVE', 'г. Москва, ул. Промышленная, д. 19', FALSE, '+7 495 104-20-61', 'sales4554@example.org', NULL)
ON CONFLICT (inn) DO UPDATE SET name = EXCLUDED.name, mass_address = EXCLUDED.mass_address;
INSERT INTO synthetic.suppliers (inn, ogrn, name, registration_date, status, address, mass_address, phone, email, director_inn)
VALUES ('9967526580', '1187729489808', 'ООО «Оборудование-Комплект 580»', '2018-11-15', 'ACTIVE', 'г. Москва, ул. Промышленная, д. 29', FALSE, '+7 495 260-98-28', 'sales6580@example.org', NULL)
ON CONFLICT (inn) DO UPDATE SET name = EXCLUDED.name, mass_address = EXCLUDED.mass_address;
INSERT INTO synthetic.suppliers (inn, ogrn, name, registration_date, status, address, mass_address, phone, email, director_inn)
VALUES ('9955995065', '1197771899234', 'ООО «Индустрия-Снаб 065»', '2019-01-15', 'ACTIVE', 'г. Москва, ул. Промышленная, д. 90', FALSE, '+7 495 316-87-26', 'sales5065@example.org', NULL)
ON CONFLICT (inn) DO UPDATE SET name = EXCLUDED.name, mass_address = EXCLUDED.mass_address;
INSERT INTO synthetic.suppliers (inn, ogrn, name, registration_date, status, address, mass_address, phone, email, director_inn)
VALUES ('9991205481', '1107716190353', 'ООО «Техно-Снаб 481»', '2010-04-15', 'ACTIVE', 'г. Москва, ул. Промышленная, д. 13', FALSE, '+7 495 500-78-74', 'sales5481@example.org', NULL)
ON CONFLICT (inn) DO UPDATE SET name = EXCLUDED.name, mass_address = EXCLUDED.mass_address;
INSERT INTO synthetic.suppliers (inn, ogrn, name, registration_date, status, address, mass_address, phone, email, director_inn)
VALUES ('9951695448', '1087737704771', 'ООО «Оборудование-Сервис 448»', '2008-11-15', 'ACTIVE', 'г. Москва, ул. Промышленная, д. 81', FALSE, '+7 495 265-96-89', 'sales5448@example.org', NULL)
ON CONFLICT (inn) DO UPDATE SET name = EXCLUDED.name, mass_address = EXCLUDED.mass_address;
INSERT INTO synthetic.suppliers (inn, ogrn, name, registration_date, status, address, mass_address, phone, email, director_inn)
VALUES ('9953994228', '1197702188712', 'ООО «Индустрия-Маркет 228»', '2019-02-15', 'ACTIVE', 'г. Москва, ул. Промышленная, д. 5', FALSE, '+7 495 914-36-24', 'sales4228@example.org', NULL)
ON CONFLICT (inn) DO UPDATE SET name = EXCLUDED.name, mass_address = EXCLUDED.mass_address;
INSERT INTO synthetic.suppliers (inn, ogrn, name, registration_date, status, address, mass_address, phone, email, director_inn)
VALUES ('9927819170', '1117775482987', 'ООО «Техно-Сервис 170»', '2011-01-15', 'ACTIVE', 'г. Москва, ул. Промышленная, д. 15', FALSE, '+7 495 978-30-64', 'sales9170@example.org', NULL)
ON CONFLICT (inn) DO UPDATE SET name = EXCLUDED.name, mass_address = EXCLUDED.mass_address;
INSERT INTO synthetic.suppliers (inn, ogrn, name, registration_date, status, address, mass_address, phone, email, director_inn)
VALUES ('9963393667', '1197778560395', 'ООО «Индустрия-Сервис 667»', '2019-05-15', 'ACTIVE', 'г. Москва, ул. Промышленная, д. 36', FALSE, '+7 495 252-48-43', 'sales3667@example.org', NULL)
ON CONFLICT (inn) DO UPDATE SET name = EXCLUDED.name, mass_address = EXCLUDED.mass_address;
INSERT INTO synthetic.suppliers (inn, ogrn, name, registration_date, status, address, mass_address, phone, email, director_inn)
VALUES ('9956830041', '1267764995729', 'ООО «Техно-Снаб 041»', '2026-08-03', 'ACTIVE', 'г. Москва, ул. Промышленная, д. 2', FALSE, '+7 495 217-46-25', 'sales0041@example.org', NULL)
ON CONFLICT (inn) DO UPDATE SET name = EXCLUDED.name, mass_address = EXCLUDED.mass_address;
INSERT INTO synthetic.suppliers (inn, ogrn, name, registration_date, status, address, mass_address, phone, email, director_inn)
VALUES ('9952183555', '1157718120891', 'ООО «Техно-Снаб 555»', '2015-04-17', 'ACTIVE', 'г. Москва, ул. Промышленная, д. 35', TRUE, '+7 495 914-29-37', 'sales3555@example.org', NULL)
ON CONFLICT (inn) DO UPDATE SET name = EXCLUDED.name, mass_address = EXCLUDED.mass_address;
INSERT INTO synthetic.suppliers (inn, ogrn, name, registration_date, status, address, mass_address, phone, email, director_inn)
VALUES ('9971871518', '1157719167026', 'ООО «Техно-Комплект 518»', '2015-04-17', 'ACTIVE', 'г. Москва, ул. Промышленная, д. 90', FALSE, '+7 495 158-14-32', 'sales1518@example.org', '996550203790')
ON CONFLICT (inn) DO UPDATE SET name = EXCLUDED.name, mass_address = EXCLUDED.mass_address;
INSERT INTO synthetic.suppliers (inn, ogrn, name, registration_date, status, address, mass_address, phone, email, director_inn)
VALUES ('9953798978', '1157797333729', 'ООО «Индустрия-Маркет 978»', '2015-04-17', 'ACTIVE', 'г. Москва, ул. Промышленная, д. 41', FALSE, '+7 495 196-62-21', 'sales8978@example.org', NULL)
ON CONFLICT (inn) DO UPDATE SET name = EXCLUDED.name, mass_address = EXCLUDED.mass_address;
INSERT INTO synthetic.suppliers (inn, ogrn, name, registration_date, status, address, mass_address, phone, email, director_inn)
VALUES ('9903562335', '1157751912259', 'ООО «Индустрия-Маркет 335»', '2015-04-17', 'ACTIVE', 'г. Москва, ул. Промышленная, д. 90', FALSE, '+7 495 997-77-94', 'sales2335@example.org', NULL)
ON CONFLICT (inn) DO UPDATE SET name = EXCLUDED.name, mass_address = EXCLUDED.mass_address;