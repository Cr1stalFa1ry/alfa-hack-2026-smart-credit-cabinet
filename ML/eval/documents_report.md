# Чтение документов: отчёт об ошибках (all)

Документов: 20; статус чтения верный: 20; решение «нужна проверка» верное: 20; флаги бэкенда верные: 20.
Поля и позиции: верно 208, null вместо значения 11, неверное значение 2, значение вместо null 0.
Заём / свои / возврат, ошибочно попавшие в выручку: 0.

| Документ | Набор | Статус (эталон → факт) | Проверка | Флаги бэкенда | Поля ok/всего | Операции | Мес. | с |
|---|---|---|---|---|---|---|---|---|
| S11_01 | development | EXTRACTED → EXTRACTED | ✓ | — | 11/11 | — | — | 0.03 |
| S11_02 | development | EXTRACTED → EXTRACTED | ✓ | — | 19/19 | — | — | 0.05 |
| S11_03 | development | EXTRACTED → EXTRACTED | ✓ | BUYER_MISMATCH | 11/11 | — | — | 0.03 |
| S11_04 | development | EXTRACTED → EXTRACTED | ✓ | AMOUNT_MISMATCH | 19/19 | — | — | 0.09 |
| M53_01 | reserved_template_test | EXTRACTED → EXTRACTED | ✓ | — | 19/19 | — | — | 0.05 |
| M53_02 | reserved_template_test | EXTRACTED → EXTRACTED | ✓ | — | 11/11 | — | — | 0.03 |
| M53_03 | reserved_template_test | PARTIAL → PARTIAL | ✓ | MISSING_PAGE | 19/19 | — | — | 0.03 |
| M53_04 | reserved_template_test | EXTRACTED → EXTRACTED | ✓ | SUPPLIER_MISMATCH | 11/11 | — | — | 0.02 |
| I01_statement | development | EXTRACTED → EXTRACTED | ✓ | — | 9/9 | 145/145, кат. 145, ошиб. 0 | 12/12 | 0.57 |
| S03_statement | reserved_template_test | EXTRACTED → EXTRACTED | ✓ | — | 9/9 | 123/123, кат. 123, ошиб. 0 | 12/12 | 0.5 |
| C01_operations | engineered_control_not_blind | EXTRACTED → EXTRACTED | ✓ | — | 0/0 | 12/12, кат. 12, ошиб. 0 | — | 0.05 |
| DOC-002-01 | seen_regression_only | EXTRACTED → EXTRACTED | ✓ | — | 8/8 | — | — | 0.02 |
| DOC-002-02 | seen_regression_only | EXTRACTED → EXTRACTED | ✓ | AMOUNT_MISMATCH | 8/8 | — | — | 0.02 |
| DOC-002-03 | seen_regression_only | EXTRACTED → EXTRACTED | ✓ | SUPPLIER_MISMATCH | 8/8 | — | — | 0.02 |
| DOC-002-04 | seen_regression_only | PARTIAL → PARTIAL | ✓ | MISSING_PAGE | 8/8 | — | — | 0.02 |
| S11_01_scan | development | EXTRACTED → EXTRACTED | ✓ | — | 10/11 | — | — | 1.47 |
| S03_statement_scan | reserved_template_test | EXTRACTED → EXTRACTED | ✓ | — | 9/9 | 123/123, кат. 123, ошиб. 0 | 12/12 | 5.25 |
| S11_01_low_resolution | development | NEEDS_REVIEW → NEEDS_REVIEW | ✓ | LOW_RESOLUTION | 0/11 | — | — | 0.66 |
| M53_02_photo | reserved_template_test | EXTRACTED → EXTRACTED | ✓ | — | 10/11 | — | — | 0.81 |
| I01_page1_photo | development | PARTIAL → PARTIAL | ✓ | MISSING_PAGE | 9/9 | 25/25, кат. 25, ошиб. 0 | — | 2.18 |

## Ошибки по документам

### S11_01_scan (documents/S11_01_scan.pdf)
- проблемы, найденные сервисом: нет
- `document_number`: wrong — эталон `СЧ-S11-01`, прочитано `СЧ-511-01`

### S03_statement_scan (documents/S03_statement_scan.pdf)
- проблемы, найденные сервисом: TRANSACTIONS_NEED_REVIEW
- операция DEMO-003-014: counterparty прочитан неверно — эталон `ООО "СеверТорг"`, получено `ООО "СевертТорг"`

### S11_01_low_resolution (documents/S11_01_low_resolution.pdf)
- проблемы, найденные сервисом: LOW_RESOLUTION, UNKNOWN_DOCUMENT_TYPE
- `document_number`: missing — эталон `СЧ-S11-01`, прочитано `None`
- `document_date`: missing — эталон `2026-10-23`, прочитано `None`
- `supplier_name`: missing — эталон `ООО «Техно-Комплект 571»`, прочитано `None`
- `supplier_inn`: missing — эталон `9937546571`, прочитано `None`
- `buyer_name`: missing — эталон `ИП Семёнов Илья Владимирович`, прочитано `None`
- `buyer_inn`: missing — эталон `991126723717`, прочитано `None`
- `total_amount_rub`: missing — эталон `3431000.00`, прочитано `None`
- `item1.description`: missing — эталон `Цифровая печатная машина`, прочитано `None`
- `item1.quantity`: missing — эталон `1`, прочитано `None`
- `item1.unit_price_rub`: missing — эталон `3431000.00`, прочитано `None`
- `item1.amount_rub`: missing — эталон `3431000.00`, прочитано `None`

### M53_02_photo (documents/M53_02_photo.jpg)
- проблемы, найденные сервисом: нет
- `document_number`: wrong — эталон `СЧ-M53-02`, прочитано `СЧ-М53-02`

### I01_page1_photo (documents/I01_page1_photo.jpg)
- проблемы, найденные сервисом: MISSING_PAGE, TOTALS_MISMATCH, TOTALS_MISMATCH, BALANCE_MISMATCH, PERIOD_NOT_COVERED, TRANSACTIONS_NEED_REVIEW
- операция DEMO-001-011: description прочитан неверно — эталон `Погашение основного долга по кредитному договору № DEBT-S1-A`, получено `Погашение основного долга по кредитному договору № ОЕВТ-51-А`
- операция DEMO-001-023: description прочитан неверно — эталон `Погашение основного долга по кредитному договору № DEBT-S1-A`, получено `Погашение основного долга по кредитному договору № РОЕВТ-51-А`
