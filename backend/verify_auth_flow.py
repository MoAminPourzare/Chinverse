import sys
import json
import random
import string
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000/api/v1"

def generate_random_email():
    random_str = ''.join(random.choices(string.ascii_lowercase, k=8))
    return f"user_{random_str}@chinverse.com"

def make_request(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    
    if data:
        json_data = json.dumps(data).encode('utf-8')
        headers['Content-Type'] = 'application/json'
        req = urllib.request.Request(url, data=json_data, method=method, headers=headers)
    else:
        req = urllib.request.Request(url, method=method, headers=headers)
    
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()
    except urllib.error.URLError as e:
        print(f"❌ Connection Error: {e.reason}")
        return None, None

def run_test():
    print("🚀 Starting Auth Flow Test...")
    
    # 1. Signup
    email = generate_random_email()
    password = "securepassword123"
    print(f"\n1️⃣ Testing Signup for {email}...")
    
    signup_data = {
        "email": email,
        "password": password,
        "phone": f"+98{random.randint(9000000000, 9999999999)}",
        "display_name": "Test User"
    }
    
    status, response = make_request(f"{BASE_URL}/signup", "POST", signup_data)
    
    if status == 200:
        print("✅ Signup Successful!")
        print(f"   User ID: {response.get('id')}")
    else:
        print(f"❌ Signup Failed! Status: {status}")
        print(f"   Response: {response}")
        return

    # 2. Login
    print("\n2️⃣ Testing Login...")
    # Form-data login needs specific encoding, let's use a helper for urlencoded
    import urllib.parse
    login_data = urllib.parse.urlencode({
        "username": email,
        "password": password
    }).encode()
    
    req = urllib.request.Request(f"{BASE_URL}/login/access-token", data=login_data, method="POST")
    req.add_header('Content-Type', 'application/x-www-form-urlencoded')
    
    try:
        with urllib.request.urlopen(req) as res:
            login_resp = json.loads(res.read().decode())
            print("✅ Login Successful!")
            print(f"🔑 Token: {login_resp['access_token'][:20]}...")
    except urllib.error.HTTPError as e:
        print(f"❌ Login Failed! Status: {e.code}")
        print(f"   Response: {e.read().decode()}")

if __name__ == "__main__":
    run_test()