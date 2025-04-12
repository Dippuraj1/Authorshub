import unittest
import requests
import json
from datetime import datetime

class BookFormatterAPITest(unittest.TestCase):
    def setUp(self):
        self.base_url = "https://3f99b569-43a1-4409-b75b-97e6a1d67a11.preview.emergentagent.com/api"
        self.test_user = {
            "email": f"test_user_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "TestPass123!"
        }
        self.token = None

    def test_1_register(self):
        """Test user registration"""
        response = requests.post(
            f"{self.base_url}/register",
            json=self.test_user
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("success", response.json()["message"].lower())

    def test_2_login(self):
        """Test user login"""
        data = {
            "username": self.test_user["email"],
            "password": self.test_user["password"]
        }
        response = requests.post(
            f"{self.base_url}/token",
            data=data
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("access_token", data)
        self.assertIn("token_type", data)
        self.token = data["access_token"]

    def test_3_forgot_password(self):
        """Test forgot password functionality"""
        response = requests.post(
            f"{self.base_url}/forgot-password",
            json={"email": self.test_user["email"]}
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("reset", response.json()["message"].lower())

    def test_4_google_auth(self):
        """Test Google authentication"""
        response = requests.post(
            f"{self.base_url}/google-auth",
            json={"id_token": "simulate_valid_token"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("access_token", data)
        self.assertIn("token_type", data)

    def test_5_subscription_tiers(self):
        """Test getting subscription tiers"""
        response = requests.get(f"{self.base_url}/subscription/tiers")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(len(data) > 0)
        self.assertTrue(any(tier["name"] == "Free" for tier in data))

    def test_6_genres(self):
        """Test getting genres"""
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(f"{self.base_url}/genres", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(len(data) > 0)

    def test_7_file_upload_and_download(self):
        """Test file upload and download"""
        if not self.token:
            self.test_2_login()

        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Create a simple test DOCX file
        test_file = {
            'file': ('test.docx', b'test content', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        }
        
        data = {
            'book_size': '6x9',
            'font': 'Times New Roman',
            'genre': 'non_fiction'
        }

        response = requests.post(
            f"{self.base_url}/upload",
            headers=headers,
            files=test_file,
            data=data
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("file_id", data)
        
        # Test file download
        file_id = data["file_id"]
        response = requests.get(
            f"{self.base_url}/download/{file_id}",
            headers=headers
        )
        self.assertEqual(response.status_code, 200)

if __name__ == '__main__':
    unittest.main()