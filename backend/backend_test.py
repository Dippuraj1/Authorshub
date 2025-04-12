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
    raise ValueError("BACKEND_URL not set in environment")

class TestBookFormatter:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.token = None
        self.file_id = None
        self.test_email = f"test_user_{datetime.now().strftime('%H%M%S')}@test.com"
        self.test_password = "TestPass123!"

    def test_register(self):
        """Test user registration"""
        logger.info(f"Testing registration with email: {self.test_email}")
        
        response = requests.post(
            f"{self.base_url}/api/register",
            json={"email": self.test_email, "password": self.test_password}
        )
        
        assert response.status_code == 200, f"Registration failed: {response.text}"
        logger.info("Registration successful")

    def test_login(self):
        """Test user login and token retrieval"""
        logger.info("Testing login")
        
        data = {
            "username": self.test_email,
            "password": self.test_password
        }
        
        response = requests.post(
            f"{self.base_url}/api/token",
            data=data
        )
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        self.token = data["access_token"]
        assert self.token, "No token received"
        logger.info("Login successful, token received")

    def test_file_upload(self):
        """Test file upload functionality"""
        logger.info("Testing file upload")
        
        # Create a simple test file
        test_file_path = "test_book.docx"
        with open(test_file_path, "w") as f:
            f.write("Test book content")

        try:
            with open(test_file_path, "rb") as f:
                files = {"file": ("test_book.docx", f)}
                data = {
                    "book_size": "6x9",
                    "font": "Times New Roman",
                    "genre": "non_fiction"
                }
                
                headers = {"Authorization": f"Bearer {self.token}"}
                
                response = requests.post(
                    f"{self.base_url}/api/upload",
                    files=files,
                    data=data,
                    headers=headers
                )
                
                assert response.status_code == 200, f"Upload failed: {response.text}"
                
                data = response.json()
                self.file_id = data["file_id"]
                assert self.file_id, "No file_id received"
                logger.info(f"Upload successful, file_id: {self.file_id}")

        finally:
            # Cleanup test file
            if os.path.exists(test_file_path):
                os.remove(test_file_path)

    def test_download(self):
        """Test file download functionality"""
        logger.info("Testing file download")
        
        assert self.file_id, "No file_id available for download test"
        
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(
            f"{self.base_url}/api/download/{self.file_id}",
            headers=headers
        )
        
        assert response.status_code == 200, f"Download failed: {response.text}"
        assert response.content, "No content received in download"
        logger.info("Download successful")

def main():
    """Run all tests"""
    tester = TestBookFormatter()
    
    try:
        # Run tests in sequence
        tester.test_register()
        tester.test_login()
        tester.test_file_upload()
        tester.test_download()
        
        logger.info("All tests passed successfully!")
        return 0
        
    except AssertionError as e:
        logger.error(f"Test failed: {str(e)}")
        return 1
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    exit(main())