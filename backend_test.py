import requests
import pytest
import os
from datetime import datetime

class BookFormatAITester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_email = f"test_user_{datetime.now().strftime('%H%M%S')}@test.com"
        self.test_password = "TestPass123!"

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    # Remove Content-Type for multipart/form-data
                    headers.pop('Content-Type', None)
                    response = requests.post(url, headers=headers, data=data, files=files)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                print(f"Response: {response.json()}")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.json()}")

            return success, response.json() if success else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_register(self):
        """Test user registration"""
        return self.run_test(
            "Register User",
            "POST",
            "register",
            200,
            data={"email": self.test_user_email, "password": self.test_password}
        )

    def test_login(self):
        """Test login and get token"""
        # For login, we need to send form data
        headers = {'Content-Type': 'application/x-www-form-urlencoded'}
        url = f"{self.base_url}/api/token"
        
        print(f"\n🔍 Testing Login...")
        try:
            data = {
                "username": self.test_user_email,
                "password": self.test_password
            }
            response = requests.post(url, data=data, headers=headers)
            
            success = response.status_code == 200
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                response_data = response.json()
                print(f"Response: {response_data}")
                if 'access_token' in response_data:
                    self.token = response_data['access_token']
                    return True
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                print(f"Response: {response.json()}")
            
            return False
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False
        if success and 'access_token' in response:
            self.token = response['access_token']
            return True
        return False

    def test_google_auth(self):
        """Test Google OAuth login"""
        success, response = self.run_test(
            "Google Auth",
            "POST",
            "google-auth",
            200,
            data={"id_token": "simulate_valid_token"}
        )
        return success

    def test_get_subscription_tiers(self):
        """Test getting subscription tiers"""
        return self.run_test(
            "Get Subscription Tiers",
            "GET",
            "subscription/tiers",
            200
        )

    def test_get_genres(self):
        """Test getting genres"""
        return self.run_test(
            "Get Genres",
            "GET",
            "genres",
            200
        )

    def test_get_formatting_standards(self):
        """Test getting formatting standards"""
        return self.run_test(
            "Get Formatting Standards",
            "GET",
            "formatting/standards",
            200
        )

    def test_get_usage(self):
        """Test getting current usage"""
        return self.run_test(
            "Get Current Usage",
            "GET",
            "usage/current",
            200
        )

    def test_get_history(self):
        """Test getting file history"""
        return self.run_test(
            "Get File History",
            "GET",
            "history",
            200
        )

    def test_upload_file(self):
        """Test file upload"""
        # Create a small test DOCX file
        test_file_path = "test.docx"
        with open(test_file_path, "w") as f:
            f.write("Test content")

        files = {
            'file': ('test.docx', open(test_file_path, 'rb'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        }
        data = {
            'book_size': '6x9',
            'font': 'Times New Roman',
            'genre': 'non_fiction'
        }

        success, response = self.run_test(
            "Upload File",
            "POST",
            "upload",
            200,
            data=data,
            files=files
        )

        # Cleanup
        os.remove(test_file_path)
        return success

def main():
    # Get backend URL from environment
    backend_url = os.environ.get('REACT_APP_BACKEND_URL')
    if not backend_url:
        print("❌ REACT_APP_BACKEND_URL environment variable not set")
        return 1

    print(f"🔧 Testing backend at: {backend_url}")
    tester = BookFormatAITester(backend_url)

    # Run tests
    print("\n🚀 Starting API Tests...")

    # Test registration and login flow
    if not tester.test_register():
        print("❌ Registration failed, stopping tests")
        return 1

    if not tester.test_login():
        print("❌ Login failed, stopping tests")
        return 1

    # Test Google auth
    tester.test_google_auth()

    # Test getting subscription tiers
    tester.test_get_subscription_tiers()

    # Test getting genres (requires auth)
    tester.test_get_genres()

    # Test getting formatting standards
    tester.test_get_formatting_standards()

    # Test getting usage (requires auth)
    tester.test_get_usage()

    # Test getting history (requires auth)
    tester.test_get_history()

    # Test file upload (requires auth)
    tester.test_upload_file()

    # Print results
    print(f"\n📊 Tests Summary:")
    print(f"Total tests: {tester.tests_run}")
    print(f"Passed: {tester.tests_passed}")
    print(f"Failed: {tester.tests_run - tester.tests_passed}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    exit(main())
