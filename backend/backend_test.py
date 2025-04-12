import requests
import pytest
from datetime import datetime
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get backend URL from environment
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', '')
if not BACKEND_URL:
    raise ValueError("BACKEND_URL environment variable not set")

class TestBookFormatter:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.token = None
        self.user_email = f"test_user_{datetime.now().strftime('%H%M%S')}@test.com"
        self.password = "TestPass123!"
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        self.tests_run += 1
        logger.info(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, headers=headers, data=data, files=files)
                else:
                    headers['Content-Type'] = 'application/json'
                    response = requests.post(url, headers=headers, json=data)
            elif method == 'PUT':
                headers['Content-Type'] = 'application/json'
                response = requests.put(url, headers=headers, json=data)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                logger.info(f"✅ Passed - Status: {response.status_code}")
                if response.text:
                    try:
                        logger.info(f"Response: {response.json()}")
                    except:
                        logger.info(f"Response: {response.text}")
            else:
                logger.error(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.text:
                    logger.error(f"Error response: {response.text}")

            return success, response.json() if success and response.text else {}

        except Exception as e:
            logger.error(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_registration(self):
        """Test user registration"""
        return self.run_test(
            "User Registration",
            "POST",
            "register",
            200,
            data={"email": self.user_email, "password": self.password}
        )

    def test_login(self):
        """Test login and get token"""
        url = f"{self.base_url}/api/token"
        headers = {'Content-Type': 'application/x-www-form-urlencoded'}
        data = {
            'username': self.user_email,
            'password': self.password
        }
        
        logger.info("\n🔍 Testing Login...")
        try:
            response = requests.post(url, data=data, headers=headers)
            success = response.status_code == 200
            
            if success:
                self.tests_passed += 1
                logger.info(f"✅ Passed - Status: {response.status_code}")
                response_data = response.json()
                logger.info(f"Response: {response_data}")
                if 'access_token' in response_data:
                    self.token = response_data['access_token']
                    return True
            else:
                logger.error(f"❌ Failed - Expected 200, got {response.status_code}")
                if response.text:
                    logger.error(f"Error response: {response.text}")
            return False
            
        except Exception as e:
            logger.error(f"❌ Failed - Error: {str(e)}")
            return False

    def test_get_subscription_tiers(self):
        """Test getting subscription tiers"""
        return self.run_test(
            "Get Subscription Tiers",
            "GET",
            "subscription/tiers",
            200
        )

    def test_get_genres(self):
        """Test getting available genres"""
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

    def test_file_upload(self):
        """Test file upload with a sample DOCX file"""
        # Create a simple test DOCX file
        test_file_path = "/tmp/test.docx"
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

        return self.run_test(
            "File Upload",
            "POST",
            "upload",
            200,
            data=data,
            files=files
        )

def main():
    tester = TestBookFormatter()
    
    # Test registration and login flow
    logger.info("\n🔄 Testing Authentication Flow...")
    if not tester.test_registration()[0]:
        logger.error("❌ Registration failed, stopping tests")
        return 1
    
    if not tester.test_login():
        logger.error("❌ Login failed, stopping tests")
        return 1
    
    # Test getting subscription tiers
    logger.info("\n🔄 Testing Subscription and Genre Features...")
    tester.test_get_subscription_tiers()
    
    # Test getting genres (requires auth)
    tester.test_get_genres()
    
    # Test getting formatting standards
    tester.test_get_formatting_standards()
    
    # Test getting usage data (requires auth)
    tester.test_get_usage()
    
    # Test file upload (requires auth)
    logger.info("\n🔄 Testing File Upload...")
    tester.test_file_upload()
    
    # Print results
    logger.info(f"\n📊 Tests Summary:")
    logger.info(f"Total tests run: {tester.tests_run}")
    logger.info(f"Tests passed: {tester.tests_passed}")
    logger.info(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.2f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    exit(main())