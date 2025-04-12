import unittest
import requests
import os
from pathlib import Path

BACKEND_URL = "https://3f99b569-43a1-4409-b75b-97e6a1d67a11.preview.emergentagent.com"

class BookFormatterAPITest(unittest.TestCase):
    def setUp(self):
        self.api_url = f"{BACKEND_URL}/api"
        self.test_files_dir = Path(__file__).parent / "test_files"
        self.test_files_dir.mkdir(exist_ok=True)

    def test_root_endpoint(self):
        """Test the root endpoint"""
        response = requests.get(f"{self.api_url}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"message": "Book Editor API"})

    def test_upload_invalid_file_type(self):
        """Test uploading an invalid file type"""
        # Create a test text file
        test_file_path = self.test_files_dir / "test.txt"
        with open(test_file_path, "w") as f:
            f.write("Test content")

        with open(test_file_path, "rb") as f:
            files = {"file": ("test.txt", f)}
            data = {
                "book_size": "6x9",
                "font": "Times New Roman",
                "genre": "novel"
            }
            response = requests.post(f"{self.api_url}/upload", files=files, data=data)
            
        self.assertEqual(response.status_code, 400)
        self.assertIn("Unsupported file format", response.json()["detail"])

    def test_upload_large_file(self):
        """Test uploading a file larger than 10MB"""
        # Create a large test file (11MB)
        test_file_path = self.test_files_dir / "large.pdf"
        with open(test_file_path, "wb") as f:
            f.write(b"0" * (11 * 1024 * 1024))  # 11MB of zeros

        with open(test_file_path, "rb") as f:
            files = {"file": ("large.pdf", f)}
            data = {
                "book_size": "6x9",
                "font": "Times New Roman",
                "genre": "novel"
            }
            response = requests.post(f"{self.api_url}/upload", files=files, data=data)
            
        self.assertEqual(response.status_code, 400)
        self.assertIn("File too large", response.json()["detail"])

    def test_upload_valid_pdf(self):
        """Test uploading a valid PDF file"""
        # Create a small valid PDF file
        test_file_path = self.test_files_dir / "test.pdf"
        with open(test_file_path, "wb") as f:
            f.write(b"%PDF-1.4\n%EOF")  # Minimal valid PDF

        with open(test_file_path, "rb") as f:
            files = {"file": ("test.pdf", f)}
            data = {
                "book_size": "6x9",
                "font": "Times New Roman",
                "genre": "novel"
            }
            response = requests.post(f"{self.api_url}/upload", files=files, data=data)
            
        self.assertEqual(response.status_code, 200)
        self.assertIn("file_id", response.json())

    def test_invalid_book_size(self):
        """Test uploading with invalid book size"""
        test_file_path = self.test_files_dir / "test.pdf"
        with open(test_file_path, "wb") as f:
            f.write(b"%PDF-1.4\n%EOF")

        with open(test_file_path, "rb") as f:
            files = {"file": ("test.pdf", f)}
            data = {
                "book_size": "invalid_size",
                "font": "Times New Roman",
                "genre": "novel"
            }
            response = requests.post(f"{self.api_url}/upload", files=files, data=data)
            
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid book size", response.json()["detail"])

    def tearDown(self):
        """Clean up test files"""
        import shutil
        if self.test_files_dir.exists():
            shutil.rmtree(self.test_files_dir)

if __name__ == "__main__":
    unittest.main()