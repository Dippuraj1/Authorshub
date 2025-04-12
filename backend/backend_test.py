import unittest
import requests
import json
import os
from datetime import datetime

BACKEND_URL = "https://3f99b569-43a1-4409-b75b-97e6a1d67a11.preview.emergentagent.com"

class BookFormatterAPITest(unittest.TestCase):
    def setUp(self):
        self.base_url = BACKEND_URL
        self.test_user = {
            'email': f'test_user_{datetime.now().strftime("%H%M%S")}@test.com',
            'password': 'TestPass123!'
        }
        self.token = None

    def test_01_register(self):
        """Test user registration"""
        response = requests.post(
            f"{self.base_url}/api/register",
            json=self.test_user
        )
        self.assertEqual(response.status_code, 200)
        print("✅ Registration test passed")

    def test_02_login(self):
        """Test user login"""
        response = requests.post(
            f"{self.base_url}/api/token",
            data={
                'username': self.test_user['email'],
                'password': self.test_user['password']
            }
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('access_token', data)
        self.token = data['access_token']
        print("✅ Login test passed")

    def test_03_google_auth(self):
        """Test Google authentication"""
        response = requests.post(
            f"{self.base_url}/api/google-auth",
            json={'id_token': 'simulate_valid_token'}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('access_token', data)
        print("✅ Google auth test passed")

    def test_04_forgot_password(self):
        """Test forgot password functionality"""
        response = requests.post(
            f"{self.base_url}/api/forgot-password",
            json={'email': self.test_user['email']}
        )
        self.assertEqual(response.status_code, 200)
        print("✅ Forgot password test passed")

    def test_05_subscription_tiers(self):
        """Test getting subscription tiers"""
        response = requests.get(f"{self.base_url}/api/subscription/tiers")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(len(data) > 0)
        print("✅ Subscription tiers test passed")

    def test_06_genres(self):
        """Test getting genres"""
        headers = {'Authorization': f'Bearer {self.token}'}
        response = requests.get(
            f"{self.base_url}/api/genres",
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(len(data) > 0)
        print("✅ Genres test passed")

    def test_07_formatting_standards(self):
        """Test getting formatting standards"""
        response = requests.get(f"{self.base_url}/api/formatting/standards")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('standards', data)
        print("✅ Formatting standards test passed")

if __name__ == '__main__':
    unittest.main()