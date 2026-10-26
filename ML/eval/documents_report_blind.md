# Чтение документов: СЛЕПОЙ прогон отложенного набора (код зафиксирован до первого просмотра M53 и S03)

Документов: 7; статус чтения верный: 2; решение «нужна проверка» верное: 4; флаги бэкенда верные: 7.
Поля и позиции: верно 61, null вместо значения 27, неверное значение 1, значение вместо null 0.
Заём / свои / возврат, ошибочно попавшие в выручку: 0.

| Документ | Набор | Статус (эталон → факт) | Проверка | Флаги бэкенда | Поля ok/всего | Операции | Мес. | с |
|---|---|---|---|---|---|---|---|---|
| M53_01 | reserved_template_test | EXTRACTED → NEEDS_REVIEW ✗ | ✗ | — | 10/19 | — | — | 0.04 |
| M53_02 | reserved_template_test | EXTRACTED → NEEDS_REVIEW ✗ | ✗ | — | 6/11 | — | — | 0.02 |
| M53_03 | reserved_template_test | PARTIAL → PARTIAL | ✓ | MISSING_PAGE | 17/19 | — | — | 0.03 |
| M53_04 | reserved_template_test | EXTRACTED → NEEDS_REVIEW ✗ | ✓ | SUPPLIER_MISMATCH | 6/11 | — | — | 0.02 |
| S03_statement | reserved_template_test | EXTRACTED → EXTRACTED | ✓ | — | 9/9 | 123/123, кат. 123, ошиб. 0 | 12/12 | 0.44 |
| S03_statement_scan | reserved_template_test | EXTRACTED → NEEDS_REVIEW ✗ | ✓ | — | 8/9 | 122/123, кат. 122, ошиб. 0 | — | 4.96 |
| M53_02_photo | reserved_template_test | EXTRACTED → NEEDS_REVIEW ✗ | ✗ | — | 5/11 | — | — | 0.83 |

## Ошибки по документам

### M53_01 (documents/M53_01.pdf)
- проблемы, найденные сервисом: FIELD_NOT_FOUND, FIELD_NOT_FOUND, ITEM_PRICES_MISSING
- `buyer_name`: missing — эталон `ИП Макаров Илья Александрович`, прочитано `None`
- `buyer_inn`: missing — эталон `998620195652`, прочитано `None`
- `total_amount_rub`: missing — эталон `1984000.00`, прочитано `None`
- `item1.unit_price_rub`: missing — эталон `1800000.00`, прочитано `None`
- `item1.amount_rub`: missing — эталон `1800000.00`, прочитано `None`
- `item2.unit_price_rub`: missing — эталон `40000`, прочитано `None`
- `item2.amount_rub`: missing — эталон `40000`, прочитано `None`
- `item3.unit_price_rub`: missing — эталон `144000`, прочитано `None`
- `item3.amount_rub`: missing — эталон `144000`, прочитано `None`

### M53_02 (documents/M53_02.pdf)
- проблемы, найденные сервисом: FIELD_NOT_FOUND, FIELD_NOT_FOUND, ITEM_PRICES_MISSING
- `buyer_name`: missing — эталон `ИП Макаров Илья Александрович`, прочитано `None`
- `buyer_inn`: missing — эталон `998620195652`, прочитано `None`
- `total_amount_rub`: missing — эталон `1984000.00`, прочитано `None`
- `item1.unit_price_rub`: missing — эталон `1984000.00`, прочитано `None`
- `item1.amount_rub`: missing — эталон `1984000.00`, прочитано `None`

### M53_03 (documents/M53_03.pdf)
- проблемы, найденные сервисом: MISSING_PAGE, FIELD_NOT_FOUND, FIELD_NOT_FOUND, ITEM_PRICES_MISSING
- `buyer_name`: missing — эталон `ИП Макаров Илья Александрович`, прочитано `None`
- `buyer_inn`: missing — эталон `998620195652`, прочитано `None`

### M53_04 (documents/M53_04.pdf)
- проблемы, найденные сервисом: FIELD_NOT_FOUND, FIELD_NOT_FOUND, ITEM_PRICES_MISSING
- `buyer_name`: missing — эталон `ИП Макаров Илья Александрович`, прочитано `None`
- `buyer_inn`: missing — эталон `998620195652`, прочитано `None`
- `total_amount_rub`: missing — эталон `1984000.00`, прочитано `None`
- `item1.unit_price_rub`: missing — эталон `1984000.00`, прочитано `None`
- `item1.amount_rub`: missing — эталон `1984000.00`, прочитано `None`

### S03_statement_scan (documents/S03_statement_scan.pdf)
- проблемы, найденные сервисом: TOTALS_MISMATCH, BALANCE_MISMATCH, ROW_NUMBER_GAP, TRANSACTIONS_NEED_REVIEW
- `account_holder_inn`: missing — эталон `990750786404`, прочитано `None`
- операция DEMO-003-014: counterparty прочитан неверно — эталон `ООО "СеверТорг"`, получено `ООО "СевертТорг"`
- операция DEMO-003-057: операция не извлечена — эталон `ОПЛАТА ПО ДОГ 1990 ЗА УСЛУГИ БЕЗ НДС`, получено `None`

### M53_02_photo (documents/M53_02_photo.jpg)
- проблемы, найденные сервисом: FIELD_NOT_FOUND, FIELD_NOT_FOUND, ITEM_PRICES_MISSING
- `document_number`: wrong — эталон `СЧ-M53-02`, прочитано `СЧ-М53-02`
- `buyer_name`: missing — эталон `ИП Макаров Илья Александрович`, прочитано `None`
- `buyer_inn`: missing — эталон `998620195652`, прочитано `None`
- `total_amount_rub`: missing — эталон `1984000.00`, прочитано `None`
- `item1.unit_price_rub`: missing — эталон `1984000.00`, прочитано `None`
- `item1.amount_rub`: missing — эталон `1984000.00`, прочитано `None`
