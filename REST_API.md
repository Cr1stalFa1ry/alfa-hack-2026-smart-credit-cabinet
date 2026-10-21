# RESTful API Спецификация: «Умный кредитный кабинет предпринимателя»

Документация RESTful API модульного монолита кредитного контура ИП и рабочего места аналитика (Альфа-Хакатон 2026).

---

## 1. Общие принципы и архитектура

* **Архитектурный стиль**: Vertical Slice Architecture (VSA) + Minimal APIs.
* **Базовый URL бэкенда**: `http://localhost:5000` (или `https://localhost:7001`).
* **Базовый URL ML-сервиса**: `http://localhost:8000`.
* **Формат данных**: `application/json` (кодировка UTF-8), загрузка файлов — `multipart/form-data`.
* **Аутентификация**: 
  * Заголовок `Authorization: Bearer <JWT>` или HttpOnly Cookie (`auth-token`).
  * Роли доступа (`UserRole`):
    * `client` — заёмщик (ИП), доступ строго изолирован по ИНН.
    * `analyst` — кредитный аналитик / андеррайтер банка.
    * `admin` — системный администратор.

---

## 2. Модуль аутентификации (`SmartKabinet.Auth`)

### 2.1. Вход в систему (Login)
* **POST** `/api/auth/login`
* **Доступ**: Анонимный
* **Описание**: Аутентификация тестовых и созданных пользователей (`client1`–`client5`, `analyst`, `admin`).
* **Тело запроса**:
```json
{
  "username": "client1",
  "password": "password123"
}
```
* **Ответ `200 OK`**:
```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIs...",
  "refreshToken": "3ybWCam73jQr...",
  "expiresInSeconds": 3600,
  "user": {
    "userId": "11111111-1111-1111-1111-111111111111",
    "username": "client1",
    "firstName": "Иван",
    "lastName": "Иванов",
    "middleName": null,
    "inn": "500100000011",
    "role": "client"
  }
}
```

### 2.2. Регистрация нового ИП (Register)
* **POST** `/api/auth/register`
* **Доступ**: Анонимный
* **Описание**: Регистрация нового предпринимателя с обязательным указанием 12-значного ИНН.
* **Тело запроса**:
```json
{
  "username": "ip_smirnov",
  "password": "SecurePassword123!",
  "inn": "770123456789",
  "firstName": "Дмитрий",
  "lastName": "Смирнов",
  "middleName": "Алексеевич"
}
```
* **Ответ `201 Created`**: возвращает аналогичный `AuthResponse`.

### 2.3. Обновление токена (Refresh Token)
* **POST** `/api/auth/refresh`
* **Доступ**: Анонимный (токен передаётся в теле или куки `refresh-token`)
* **Тело запроса**:
```json
{
  "refreshToken": "3ybWCam73jQr..."
}
```
* **Ответ `200 OK`**: новая пара `accessToken` и `refreshToken` (с ротацией старого токена).

### 2.4. Выход из системы (Logout)
* **POST** `/api/auth/logout`
* **Доступ**: Авторизованный
* **Описание**: Отзыв активных Refresh-токенов в БД и очистка cookie.

### 2.5. Профиль текущего пользователя (Me)
* **GET** `/api/auth/me`
* **Доступ**: Авторизованный (`client`, `analyst`, `admin`)
* **Ответ `200 OK`**: объект `UserProfileDto`.

### 2.6. Открытые ключи JWKS
* **GET** `/.well-known/jwks.json`
* **Доступ**: Анонимный
* **Описание**: Набор открытых RSA-ключей для проверки подписи JWT другими сервисами и фронтендом.

---

## 3. Модуль личного кабинета заёмщика (`SmartKabinet.Client`)

### 3.1. Создать черновик заявки (T01)
* **POST** `/api/client/applications`
* **Доступ**: Роль `client`
* **Описание**: Инициализирует черновик (`draft`). Автоматически подтягивает карточку ИП по ИНН из симулятора ЕГРИП/АБС.
* **Тело запроса**:
```json
{
  "stage": "Operating",
  "purpose": "WorkingCapital",
  "productCode": "WC",
  "requestedAmount": 800000,
  "ownContribution": 0,
  "requestedTermMonths": 12,
  "asSoonAsPossible": true
}
```
* **Ответ `201 Created`**:
```json
{
  "id": "e4b2d354-9467-4ab2-b258-204123547890",
  "inn": "500100000011",
  "status": "Draft",
  "inputVersion": 1,
  "createdAt": "2026-10-21T20:00:00Z"
}
```

### 3.2. Сохранить изменения черновика (T02)
* **PUT** `/api/client/applications/{id}`
* **Доступ**: Роль `client` (только владелец)
* **Описание**: Позволяет сохранять неполные данные с пропусками в статусе `Draft`.

### 3.3. Отправить заявку на проверку (T03)
* **POST** `/api/client/applications/{id}/submit`
* **Доступ**: Роль `client`
* **Заголовки**: `X-Idempotency-Key: <UUID>` (защита от повторной отправки)
* **Условие**: Заполнены обязательные поля, даны согласия `bkiConsent: true` и `personalDataConsent: true`.
* **Тело запроса**:
```json
{
  "bkiConsent": true,
  "personalDataConsent": true
}
```
* **Переход**: `Draft` ➔ `Submitted` ➔ `Checking`. Клиент больше не может редактировать заявку.

### 3.4. Получить список своих заявок
* **GET** `/api/client/applications`
* **Доступ**: Роль `client` (возвращает только заявки с ИНН текущего пользователя).

### 3.5. Детали заявки для клиента
* **GET** `/api/client/applications/{id}`
* **Доступ**: Роль `client`
* **Описание**: Возвращает статус, условия оферты (если есть), понятный текст отказа или перечень запрошенных сведений (`need_info`). **Не отдает** внутренний расчет DSCR и скоринговые баллы.

### 3.6. Загрузить выписку стороннего банка
* **POST** `/api/client/applications/{id}/statement`
* **Content-Type**: `multipart/form-data`
* **Файлы**: CSV, XLSX или PDF выписка за последние 3–12 месяцев.
* **Примечание**: Для действующих клиентов Альфа-Банка выписка формируется автоматически из АБС.

### 3.7. Ответить на запрос сведений (T10)
* **POST** `/api/client/applications/{id}/respond-info`
* **Доступ**: Роль `client`
* **Условие**: Заявка находится в статусе `NeedInfo`.
* **Переход**: `NeedInfo` ➔ `InfoReceived` ➔ `Checking`. Инкрементирует `inputVersion = inputVersion + 1`.

### 3.8. Повторить проверку при сбое источника (T06)
* **POST** `/api/client/applications/{id}/retry-check`
* **Условие**: Заявка в статусе `WaitingCheck` (после ошибки 503).
* **Переход**: `WaitingCheck` ➔ `Checking`.

### 3.9. Отозвать заявку (T17)
* **POST** `/api/client/applications/{id}/withdraw`
* **Переход**: Из любого активного статуса ➔ `Closed`.

### 3.10. Принятие и подписание оферты (T21–T28)
* **POST** `/api/client/applications/{id}/accept-offer` — согласие с условиями оферты (`Offer` ➔ `Accepted`).
* **POST** `/api/client/applications/{id}/sign-sim` — симуляция подписания договора по СМС/ПЭП (`Accepted` ➔ `SignedSim`).
* **POST** `/api/client/applications/{id}/disburse-sim` — симуляция перечисления кредитных средств (`ReadyToDisburse` ➔ `DisbursedSim`). Защищено идемпотентностью: повторный клик не создает второй платеж.

---

## 4. Модуль аналитика банка (`SmartKabinet.BankEmployee`)

### 4.1. Очередь заявок на ручной разбор
* **GET** `/api/analyst/queue`
* **Доступ**: Роль `analyst`
* **Описание**: Заявки в статусе `Review` (новый бизнес `Prelaunch`, расхождения в анкете/выписке, подозрение на скрытые долги).
* **Параметры**: `?stage=Prelaunch&product=EQ&page=1&limit=20`.

### 4.2. Полная карточка заявки для аналитика
* **GET** `/api/analyst/applications/{id}`
* **Доступ**: Роль `analyst`
* **Описание**: Все данные анкеты, результаты симуляторов (БКИ, ЕГРИП, ФНС), расчет чистого потока, коэффициента покрытия долга (DSCR), скоринговые баллы (0–100), светофор расхождений и журнал переходов.

### 4.3. Запросить сведения у клиента (T11)
* **POST** `/api/analyst/applications/{id}/request-info`
* **Доступ**: Роль `analyst`
* **Тело запроса**:
```json
{
  "reasonCode": "NEED_STATEMENT",
  "comment": "Предоставлена выписка только за 1 месяц. Необходима выписка минимум за 3 месяца.",
  "requestedFields": ["statementFile", "taxRegime"]
}
```
* **Переход**: `Review` ➔ `NeedInfo`.

### 4.4. Ручное одобрение заявки (T12)
* **POST** `/api/analyst/applications/{id}/approve`
* **Доступ**: Роль `analyst`
* **Тело запроса**:
```json
{
  "approvedAmount": 1600000,
  "termMonths": 24,
  "annualRate": 0.24,
  "comment": "Одобрено на основании подтверждения личного дохода и резерва."
}
```
* **Переход**: `Review` ➔ `Offer`.

### 4.5. Ручной отказ аналитика (T13)
* **POST** `/api/analyst/applications/{id}/decline`
* **Доступ**: Роль `analyst`
* **Тело запроса**:
```json
{
  "reasonCode": "OVERDUE_GT_30",
  "comment": "Наличие просроченной задолженности свыше 30 дней в бюро кредитных историй."
}
```
* **Переход**: `Review` ➔ `Declined`. Код причины обязателен.

### 4.6. Уточнены факты — вернуть на автопроверку (T14)
* **POST** `/api/analyst/applications/{id}/recheck`
* **Переход**: `Review` ➔ `Checking`.

---

## 5. Модуль интеграций и синтетических данных (`SmartKabinet.Intergrations`)

### 5.1. Получить профиль и выписку клиента Альфа-Банка по ИНН
* **GET** `/api/integrations/alfa-customer/{inn}`
* **Доступ**: Внутренний / Сервисный
* **Описание**: Поиск в PostgreSQL-базе синтетических клиентов Альфа-Банка.
* **Пример ответа `200 OK` (Клиент найден: Иванов `500100000011`)**:
```json
{
  "success": true,
  "isFound": true,
  "isAlfaClient": true,
  "data": {
    "inn": "500100000011",
    "organizationName": "ИП Иванов Иван Иванович",
    "isAlfaClient": true,
    "relationshipMonths": 60,
    "accounts": [
      {
        "accountNumber": "40802810900000000011",
        "currentBalance": 1850000,
        "isBlocked": false
      }
    ],
    "financialAggregates": {
      "averageMonthlyTurnover": 700000,
      "averageMonthlyExpenses": 300000,
      "netCashFlow": 400000,
      "annualRevenue": 8400000,
      "coefficientOfVariation": 0.20,
      "monthlyLoanPaymentsInAlfa": 30000,
      "existingLoansTotalBalance": 240000,
      "activeOperatingMonths": 60
    }
  }
}
```
* **Пример `404 Not Found` (Новикова `500100000044`)**: `isAlfaClient: false` (предлагается загрузить внешнюю выписку).
* **Пример `503 Service Unavailable` (`500100000066`)**: имитация сбоя для тестирования перехода `waiting_check`.

### 5.2. Синтезировать нового клиента в PostgreSQL
* **POST** `/api/integrations/synthesize-customer`
* **Тело запроса**:
```json
{
  "inn": "500199999999",
  "organizationName": "ИП Тестовый Бизнес",
  "isAlfaClient": true,
  "averageMonthlyTurnover": 950000,
  "netCashFlow": 450000,
  "existingLoans": 100000,
  "monthlyLoanPayments": 15000,
  "coefficientOfVariation": 0.18,
  "activeMonths": 36,
  "generateSampleTransactions": true
}
```

---

## 6. ML Сервис анализа выписок (`FastAPI: 8000`)

### 6.1. Анализ и классификация выписки
* **POST** `http://localhost:8000/api/v1/statement/analyze`
* **Content-Type**: `multipart/form-data`
* **Параметры**: `file` (CSV / XLSX выписка)
* **Ответ `200 OK`**:
  * Выделение истинной выручки (очистка от собственных средств, займов и возвратов).
  * Расчет среднемесячного чистого денежного потока, сезонности и коэффициента вариации CV.
  * Текстовое объяснение (SHAP/LLM) для клиента и сотрудника банка.

---

## 7. Коды причин решений и ошибок

| Код | Описание для клиента | Влияние на статус |
| :--- | :--- | :--- |
| `OVERDUE_GT_30` | В кредитной истории есть просрочка более 30 дней. Подайте заявку после погашения. | `Declined` |
| `TAX_DEBT` | Налоговая задолженность выше допустимого лимита (50 000 ₽). | `Declined` |
| `DSCR_LOW` | Ежемесячный платёж высок относительно чистого денежного потока. Предложен другой срок. | Встречное предложение (`Offer`) |
| `NEED_STATEMENT` | Необходима выписка минимум за 3 месяца. Загрузите файл или укажите данные вручную. | `NeedInfo` |
| `PRODUCT_NA_AMOUNT` | Сумма превышает лимит продукта для вашей стадии бизнеса. Измените сумму или цель. | Возврат к подбору (без кредитного отказа) |
| `CONTRIBUTION_LOW` | Требуется собственный взнос от 10% (для operating) или от 20% (для prelaunch). | Возврат к подбору (без кредитного отказа) |
| `SOURCE_UNAVAILABLE` | Не удалось получить данные из внешнего источника. Повторите проверку позже. | `WaitingCheck` (не является отказом!) |
| `IP_NOT_FOUND` | Индивидуальный предприниматель с указанным ИНН не найден в ЕГРИП. | Заявка не создаётся / `Closed` |
