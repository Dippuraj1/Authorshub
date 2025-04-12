import unittest
import requests
import os
import json
from pathlib import Path

class BookFormatterAPITest(unittest.TestCase):
    def setUp(self):
        self.base_url = os.environ.get('REACT_APP_BACKEND_URL', '')
        self.test_files_dir = Path(__file__).parent / "test_files"
        self.test_files_dir.mkdir(exist_ok=True)
        
        # Create test files
        self.create_test_files()

    def create_test_files(self):
        # Create a simple DOCX file for testing
        from docx import Document
        doc = Document()
        doc.add_paragraph("Test content for DOCX file")
        self.docx_path = self.test_files_dir / "test.docx"
        doc.save(self.docx_path)

        # Create a simple PDF file for testing
        from reportlab.pdfgen import canvas
        self.pdf_path = self.test_files_dir / "test.pdf"
        c = canvas.Canvas(str(self.pdf_path))
        c.drawString(100, 750, "Test content for PDF file")
        c.save()

    def test_api_root(self):
        """Test the root API endpoint"""
        response = requests.get(f"{self.base_url}/api")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"message": "Book Editor API"})

    def test_upload_docx(self):
        """Test uploading a DOCX file"""
        with open(self.docx_path, 'rb') as f:
            files = {'file': ('test.docx', f, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
            data = {
                'book_size': '6x9',
                'font': 'Times New Roman',
                'genre': 'novel'
            }
            response = requests.post(f"{self.base_url}/api/upload", files=files, data=data)
            
            self.assertEqual(response.status_code, 200)
            result = response.json()
            self.assertIn('file_id', result)
            self.assertIn('message', result)
            return result.get('file_id')

    def test_upload_pdf(self):
        """Test uploading a PDF file"""
        with open(self.pdf_path, 'rb') as f:
            files = {'file': ('test.pdf', f, 'application/pdf')}
            data = {
                'book_size': '5x8',
                'font': 'Arial',
                'genre': 'non-fiction'
            }
            response = requests.post(f"{self.base_url}/api/upload", files=files, data=data)
            
            self.assertEqual(response.status_code, 200)
            result = response.json()
            self.assertIn('file_id', result)
            self.assertIn('message', result)
            return result.get('file_id')

    def test_invalid_file_type(self):
        """Test uploading an invalid file type"""
        # Create a text file
        invalid_file = self.test_files_dir / "test.txt"
        with open(invalid_file, 'w') as f:
            f.write("Invalid file type")

        with open(invalid_file, 'rb') as f:
            files = {'file': ('test.txt', f, 'text/plain')}
            data = {
                'book_size': '6x9',
                'font': 'Times New Roman',
                'genre': 'novel'
            }
            response = requests.post(f"{self.base_url}/api/upload", files=files, data=data)
            
            self.assertEqual(response.status_code, 400)
            self.assertIn('Unsupported file format', response.json().get('detail', ''))

    def test_invalid_parameters(self):
        """Test uploading with invalid parameters"""
        with open(self.docx_path, 'rb') as f:
            files = {'file': ('test.docx', f, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
            data = {
                'book_size': 'invalid_size',
                'font': 'Invalid Font',
                'genre': 'invalid_genre'
            }
            response = requests.post(f"{self.base_url}/api/upload", files=files, data=data)
            
            self.assertEqual(response.status_code, 400)

    def test_full_workflow(self):
        """Test the complete workflow from upload to download"""
        # Upload file
        file_id = self.test_upload_docx()
        
        # Check status
        response = requests.get(f"{self.base_url}/api/status/{file_id}")
        self.assertEqual(response.status_code, 200)
        status_data = response.json()
        self.assertEqual(status_data['file_id'], file_id)
        self.assertIn(status_data['status'], ['processing', 'completed'])

        # If completed, try download
        if status_data['status'] == 'completed':
            response = requests.get(f"{self.base_url}/api/download/{file_id}")
            self.assertEqual(response.status_code, 200)
            self.assertTrue(response.headers['Content-Type'].startswith('application/'))

    def tearDown(self):
        """Clean up test files"""
        import shutil
        if self.test_files_dir.exists():
            shutil.rmtree(self.test_files_dir)

if __name__ == '__main__':
    unittest.main()