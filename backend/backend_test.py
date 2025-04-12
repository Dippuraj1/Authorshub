import unittest
import requests
import os
import tempfile
from pathlib import Path

# Get the backend URL from environment variable
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', '')

class TestBookFormatter(unittest.TestCase):
    def setUp(self):
        self.base_url = f"{BACKEND_URL}/api"
        # Create test files
        self.test_files = {}
        
        # Create a simple DOCX file
        with tempfile.NamedTemporaryFile(suffix='.docx', delete=False) as f:
            f.write(b'PK\x03\x04\x14\x00\x00\x00\x08\x00')  # Basic DOCX header
            self.test_files['docx'] = f.name
            
        # Create a simple PDF file
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as f:
            f.write(b'%PDF-1.4\n')  # Basic PDF header
            self.test_files['pdf'] = f.name

    def tearDown(self):
        # Clean up test files
        for file_path in self.test_files.values():
            try:
                os.unlink(file_path)
            except:
                pass

    def test_root_endpoint(self):
        response = requests.get(f"{self.base_url}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"message": "Book Editor API"})

    def test_upload_docx(self):
        # Test DOCX upload
        with open(self.test_files['docx'], 'rb') as f:
            files = {'file': ('test.docx', f)}
            data = {
                'book_size': '6x9',
                'font': 'Times New Roman',
                'genre': 'novel'
            }
            response = requests.post(f"{self.base_url}/upload", files=files, data=data)
            
            print("DOCX Upload Response:", response.text)
            self.assertEqual(response.status_code, 200)
            self.assertIn('file_id', response.json())
            
            # Store file_id for download test
            self.docx_file_id = response.json()['file_id']

    def test_upload_pdf(self):
        # Test PDF upload
        with open(self.test_files['pdf'], 'rb') as f:
            files = {'file': ('test.pdf', f)}
            data = {
                'book_size': '6x9',
                'font': 'Times New Roman',
                'genre': 'non-fiction'
            }
            response = requests.post(f"{self.base_url}/upload", files=files, data=data)
            
            print("PDF Upload Response:", response.text)
            self.assertEqual(response.status_code, 200)
            self.assertIn('file_id', response.json())
            
            # Store file_id for download test
            self.pdf_file_id = response.json()['file_id']

    def test_invalid_file_type(self):
        # Create a temporary text file
        with tempfile.NamedTemporaryFile(suffix='.txt') as f:
            f.write(b'test content')
            f.seek(0)
            files = {'file': ('test.txt', f)}
            data = {
                'book_size': '6x9',
                'font': 'Times New Roman',
                'genre': 'novel'
            }
            response = requests.post(f"{self.base_url}/upload", files=files, data=data)
            self.assertEqual(response.status_code, 400)

    def test_download_and_status(self):
        # First upload a file
        with open(self.test_files['docx'], 'rb') as f:
            files = {'file': ('test.docx', f)}
            data = {
                'book_size': '6x9',
                'font': 'Times New Roman',
                'genre': 'novel'
            }
            upload_response = requests.post(f"{self.base_url}/upload", files=files, data=data)
            file_id = upload_response.json()['file_id']

            # Test status endpoint
            status_response = requests.get(f"{self.base_url}/status/{file_id}")
            self.assertEqual(status_response.status_code, 200)
            self.assertIn('status', status_response.json())

            # Test download endpoint
            download_response = requests.get(f"{self.base_url}/download/{file_id}")
            print("Download Response Status:", download_response.status_code)
            if download_response.status_code == 200:
                self.assertTrue(len(download_response.content) > 0)
            else:
                print("Download Response Text:", download_response.text)

if __name__ == '__main__':
    unittest.main()