import urllib.request
import json
import time

BASE_URL = "http://localhost:5189"

def req(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    body = json.dumps(data).encode("utf-8") if data is not None else None
    request = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request) as response:
            res_body = response.read().decode("utf-8")
            return response.status, json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            parsed = json.loads(err_body)
        except:
            parsed = err_body
        return e.code, parsed

results = []

# 1. Swagger
s, b = req("/swagger/v1/swagger.json")
results.append(("1. Swagger OpenAPI v1", s == 200, f"Status: {s}"))

# 2. JWKS
s, b = req("/.well-known/jwks.json")
results.append(("2. JWKS RSA Public Keys", s == 200 and "keys" in b, f"Keys: {len(b.get('keys', []))}"))

# 3. Client Login
s, b = req("/api/auth/login", method="POST", data={"username": "client_test", "password": "password123"})
client_token = b.get("accessToken")
results.append(("3. Client Login (JWT RS256)", s == 200 and client_token is not None, f"Inn: {b.get('user', {}).get('inn')}"))

# 4. Analyst Login
s, b = req("/api/auth/login", method="POST", data={"username": "analyst_test", "password": "password123"})
analyst_token = b.get("accessToken")
results.append(("4. Bank Analyst Login", s == 200 and analyst_token is not None, f"Role: {b.get('user', {}).get('role')}"))

# 5. Client Profile
s, b = req("/api/client/profile", token=client_token)
results.append(("5. Get Client Profile", s == 200, f"Client: {b.get('lastName')} {b.get('firstName')} (INN: {b.get('inn')})"))

# 6. T01: Create Draft Application
draft_payload = {
    "inn": "500100000011",
    "stage": 1,
    "purpose": 2,
    "requestedAmount": 600000.0,
    "ownContribution": 0.0,
    "requestedTermMonths": 12,
    "bkiConsent": True,
    "personalDataConsent": True
}
s, b = req("/api/client/applications/draft", method="POST", data=draft_payload, token=client_token)
app_id = b.get("applicationId")
results.append(("6. T01 Create Application Draft", s == 201 and app_id is not None, f"ApplicationId: {app_id}"))

# 7. T02: Save / Update Draft
if app_id:
    save_payload = {
        "requestedAmount": 500000.0,
        "ownContribution": 0.0,
        "requestedTermMonths": 12,
        "bkiConsent": True,
        "personalDataConsent": True
    }
    s, b = req(f"/api/client/applications/{app_id}/draft", method="PUT", data=save_payload, token=client_token)
    results.append(("7. T02 Save Application Draft", s == 200, f"Status: {b.get('status')}"))

# 8. T03: Submit Application
if app_id:
    s, b = req(f"/api/client/applications/{app_id}/submit", method="POST", token=client_token)
    results.append(("8. T03 Submit Application", s == 200, f"Status: {b.get('status')}"))

    # Пауза для выполнения Scoring Engine через Wolverine Event Pipeline
    time.sleep(2.0)

# 9. Get Application Decision & Offer
if app_id:
    s, b = req(f"/api/client/applications/{app_id}", token=client_token)
    app_status = b.get("status")
    decision = b.get("decision")
    offer = b.get("offer")
    has_offer = offer is not None
    offer_info = f"Amount: {offer.get('approvedAmount')} ₽, Rate: {offer.get('annualRatePercent')}%, Pay: {offer.get('monthlyPayment')} ₽" if has_offer else "No offer"
    results.append(("9. Scoring Engine Decision (S1)", s == 200 and app_status in ["offer", "checking"], f"Status: {app_status}, Decision: {decision}, {offer_info}"))

# 10. Get Application Explanation (ML / Fallback)
if app_id:
    s, b = req(f"/api/client/applications/{app_id}/explanation", token=client_token)
    results.append(("10. Application Explanation (ML/LLM)", s == 200, f"Source: {b.get('source')}, Explanation: {b.get('explanation')[:45]}..."))

# 11. List Client Applications
s, b = req("/api/client/applications", token=client_token)
results.append(("11. List Client Applications", s == 200 and isinstance(b, list), f"Total applications: {len(b)}"))

# 12. Bank Employee Queue
s, b = req("/api/employee/applications/queue", token=analyst_token)
results.append(("12. Bank Analyst Review Queue", s == 200 and isinstance(b, list), f"Queue items: {len(b)}"))

# 13. ML Direct Integration
s, b = req("/api/integrations/ml/explain", method="POST", data={"reasonCode": "DSCR_LOW"})
results.append(("13. ML Direct Reason Explanation", s == 200, f"Source: {b.get('source')}, Text: {b.get('text', '')[:45]}..."))

print("\n" + "=" * 65)
print("           ПЛАТФОРМА: ОТЧЕТ О ВЕРИФИКАЦИИ РАБОТОСПОСОБНОСТИ")
print("=" * 65)
all_ok = True
for name, passed, detail in results:
    icon = "✅" if passed else "❌"
    if not passed: all_ok = False
    print(f"{icon} {name:<35} | {detail}")
print("=" * 65)
print("ИТОГ: ВСЕ СЦЕНАРИИ И ПЕРЕХОДЫ УСПЕШНО ПРОЙДЕНЫ!" if all_ok else "ИТОГ: ОБНАРУЖЕНЫ ОШИБКИ!")
print("=" * 65)
