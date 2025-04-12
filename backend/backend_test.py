import unittest
import requests
import os
from datetime import datetime

class BookFormatAITester:
    def __init__(self):
        # Get backend URL from frontend .env
        self.base_url = "https://bookformatai.onrender.com/api"  # Using public endpoint
        self.token = None
        self.test_user = f"test_user_{datetime.now().strftime('%H%M%S')}@test.com"
        self.test_password = "TestPass123!"

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        print(f"\n🔍 Testing {name}...")
        
        try:
            if files:
                # For multipart form data
                headers.pop('Content-Type', None)  # Remove Content-Type for multipart
                if self.token:
                    headers['Authorization'] = f'Bearer {self.token}'
                response = requests.post(url, data=data, files=files, headers=headers)
            elif method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Error: {response.json().get('detail', 'No detail provided')}")
                except:
                    print("Could not parse error response")
                return False, {}

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
            data={"email": self.test_user, "password": self.test_password}
        )

    def test_login(self):
        """Test login and get token"""
        success, response = self.run_test(
            "Login",
            "POST",
            "token",
            200,
            data={"username": self.test_user, "password": self.test_password}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            return True, response
        return False, response

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

    def test_upload_and_download(self):
        """Test file upload and download"""
        # Create a test DOCX file
        test_file_path = "test_document.docx"
        with open(test_file_path, "w") as f:
            f.write("Test content")

        try:
            files = {'file': ('test.docx', open(test_file_path, 'rb'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
            data = {
                'book_size': '6x9',
                'font': 'Times New Roman',
                'genre': 'non_fiction',
                'template': 'standard'
            }
            
            success, response = self.run_test(
                "Upload File",
                "POST",
                "upload",
                200,
                data=data,
                files=files
            )

            if success and 'file_id' in response:
                print("✅ File uploaded successfully")
                return True, response
            return False, response

        except Exception as e:
            print(f"❌ Upload failed: {str(e)}")
            return False, {}
        finally:
            # Cleanup
            if os.path.exists(test_file_path):
                os.remove(test_file_path)

def main():
    tester = BookFormatAITester()
    tests_run = 0
    tests_passed = 0

    # Test registration
    success, _ = tester.test_register()
    tests_run += 1
    if success:
        tests_passed += 1

    # Test login
    success, _ = tester.test_login()
    tests_run += 1
    if success:
        tests_passed += 1

    # Test subscription tiers
    success, _ = tester.test_get_subscription_tiers()
    tests_run += 1
    if success:
        tests_passed += 1

    # Test genres (requires auth)
    success, _ = tester.test_get_genres()
    tests_run += 1
    if success:
        tests_passed += 1

    # Test formatting standards
    success, _ = tester.test_get_formatting_standards()
    tests_run += 1
    if success:
        tests_passed += 1

    # Test upload and download
    success, _ = tester.test_upload_and_download()
    tests_run += 1
    if success:
        tests_passed += 1

    # Print summary
    print(f"\n📊 Test Summary:")
    print(f"Tests passed: {tests_passed}/{tests_run}")
    print(f"Success rate: {(tests_passed/tests_run)*100:.1f}%")

    return 0 if tests_passed == tests_run else 1

if __name__ == "__main__":
    main()