import subprocess
import time
import json
import urllib.request
import urllib.error
import sys

def make_req(url, method="GET", data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req_body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=req_body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            return response.status, json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        return e.code, json.loads(err_body) if err_body else {}

def main():
    print("Starting backend...")
    proc = subprocess.Popen(
        ["dotnet", "run", "--project", "SmartKabinet.Host/SmartKabinet.Host.csproj", "--no-build"],
        cwd="/Users/cr1stal/Desktop/projects/AlphaHack/AlphaHack/backend",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    try:
        base_url = "http://localhost:5189"
        ready = False
        for _ in range(30):
            try:
                status, _ = make_req(f"{base_url}/health")
                if status == 200:
                    ready = True
                    break
            except Exception:
                time.sleep(1)

        if not ready:
            print("Server failed to start!")
            proc.terminate()
            sys.exit(1)

        print("Server is UP!")

        # 1. Test GET /api/client/products
        status, products = make_req(f"{base_url}/api/client/products")
        print(f"GET /api/client/products: {status}")
        assert status == 200, f"Expected 200, got {status}"
        print(f"Found {len(products)} products:")
        codes = [p["code"] for p in products]
        print(f"Codes: {codes}")
        assert "WC" in codes
        assert "EQ" in codes
        assert "START" in codes

        # 2. Test GET /api/client/products/START
        status, start_p = make_req(f"{base_url}/api/client/products/START")
        assert status == 200
        assert start_p["maxAmount"] == 500000
        assert start_p["code"] == "START"
        print("START product details verified:", start_p["name"], start_p["maxAmount"])

        # 3. Test GET /api/products alias
        status, alias_products = make_req(f"{base_url}/api/products")
        assert status == 200
        assert len(alias_products) == 3
        print("GET /api/products alias verified.")

        # 4. Login to test draft creation
        status, login_res = make_req(f"{base_url}/api/auth/login", method="POST", data={
            "phone": "+79990001122",
            "password": "Password123!"
        })
        if status != 200:
            make_req(f"{base_url}/api/auth/register", method="POST", data={
                "phone": "+79990001122",
                "password": "Password123!",
                "fullName": "Иванов Иван Иванович",
                "inn": "7701234567"
            })
            status, login_res = make_req(f"{base_url}/api/auth/login", method="POST", data={
                "phone": "+79990001122",
                "password": "Password123!"
            })

        token = login_res["token"]

        # 5. Create Draft (Prelaunch + WorkingCapital => START)
        status, draft_start = make_req(f"{base_url}/api/client/applications/draft", method="POST", data={
            "inn": "7701234567",
            "stage": 2, # Prelaunch
            "purpose": 2, # WorkingCapital
            "requestedAmount": 400000,
            "requestedTermMonths": 12
        }, token=token)
        app_id = draft_start["applicationId"]

        # Get application by id
        status, app_data = make_req(f"{base_url}/api/client/applications/{app_id}", token=token)
        print(f"Created Prelaunch/WorkingCapital draft, resolved ProductCode: {app_data.get('productCode')}")
        assert app_data.get("productCode") == "START"

        # 6. Create Draft (Operating + Equipment => EQ)
        status, draft_eq = make_req(f"{base_url}/api/client/applications/draft", method="POST", data={
            "inn": "7701234567",
            "stage": 1, # Operating
            "purpose": 1, # Equipment
            "requestedAmount": 2000000,
            "ownContribution": 500000,
            "requestedTermMonths": 36
        }, token=token)
        app_id_eq = draft_eq["applicationId"]
        status, app_data_eq = make_req(f"{base_url}/api/client/applications/{app_id_eq}", token=token)
        print(f"Created Operating/Equipment draft, resolved ProductCode: {app_data_eq.get('productCode')}")
        assert app_data_eq.get("productCode") == "EQ"

        # 7. Create Draft (Operating + WorkingCapital => WC)
        status, draft_wc = make_req(f"{base_url}/api/client/applications/draft", method="POST", data={
            "inn": "7701234567",
            "stage": 1, # Operating
            "purpose": 2, # WorkingCapital
            "requestedAmount": 1500000,
            "requestedTermMonths": 18
        }, token=token)
        app_id_wc = draft_wc["applicationId"]
        status, app_data_wc = make_req(f"{base_url}/api/client/applications/{app_id_wc}", token=token)
        print(f"Created Operating/WorkingCapital draft, resolved ProductCode: {app_data_wc.get('productCode')}")
        assert app_data_wc.get("productCode") == "WC"

        print("ALL TESTS PASSED SUCCESSFULLY! 🚀")

    finally:
        proc.terminate()
        proc.wait()

if __name__ == "__main__":
    main()
