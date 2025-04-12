import pytest
import requests
import os
from pathlib import Path
import tempfile

# Get the backend URL from environment variable
BACKEND_URL = "https://3f99b569-43a1-4409-b75b-97e6a1d67a11.preview.emergentagent.com"

class TestBookFormatter:
    def setup_method(self):
        """Setup test data"""
        self.test_files_dir = Path(tempfile.gettempdir()) / "test_files"
        self.test_files_dir.mkdir(exist_ok=True)
        
        # Create a simple test DOCX file
        self.test_docx = self.test_files_dir / "test.docx"
        if not self.test_docx.exists():
            from docx import Document
            doc = Document()
            doc.add_paragraph("Test content")
            doc.save(self.test_docx)
        
        # Create a simple test PDF file
        self.test_pdf = self.test_files_dir / "test.pdf"
        if not self.test_pdf.exists():
            from reportlab.pdfgen import canvas
            c = canvas.Canvas(str(self.test_pdf))
            c.drawString(100, 750, "Test PDF content")
            c.save()

    def test_api_root(self):
        """Test the root endpoint"""
        response = requests.get(f"{BACKEND_URL}/api")
        assert response.status_code == 200
        assert response.json()["message"] == "Book Editor API"

    def test_upload_docx(self):
        """Test uploading a DOCX file"""
        with open(self.test_docx, 'rb') as f:
            files = {'file': ('test.docx', f, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
            data = {
                'book_size': '6x9',
                'font': 'Times New Roman',
                'genre': 'novel'
            }
            response = requests.post(f"{BACKEND_URL}/api/upload", files=files, data=data)
            
            assert response.status_code == 200
            result = response.json()
            assert 'file_id' in result
            assert 'message' in result
            return result.get('file_id')

    def test_upload_pdf(self):
        """Test uploading a PDF file"""
        with open(self.test_pdf, 'rb') as f:
            files = {'file': ('test.pdf', f, 'application/pdf')}
            data = {
                'book_size': '6x9',
                'font': 'Times New Roman',
                'genre': 'non-fiction'
            }
            response = requests.post(f"{BACKEND_URL}/api/upload", files=files, data=data)
            
            assert response.status_code == 200
            result = response.json()
            assert 'file_id' in result
            assert 'message' in result
            return result.get('file_id')

    def test_invalid_file_type(self):
        """Test uploading an invalid file type"""
        # Create a text file
        test_txt = self.test_files_dir / "test.txt"
        test_txt.write_text("Test content")
        
        with open(test_txt, 'rb') as f:
            files = {'file': ('test.txt', f, 'text/plain')}
            data = {
                'book_size': '6x9',
                'font': 'Times New Roman',
                'genre': 'novel'
            }
            response = requests.post(f"{BACKEND_URL}/api/upload", files=files, data=data)
            assert response.status_code == 400

    def test_invalid_parameters(self):
        """Test invalid parameters"""
        with open(self.test_docx, 'rb') as f:
            files = {'file': ('test.docx', f, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
            data = {
                'book_size': 'invalid',
                'font': 'Invalid Font',
                'genre': 'invalid'
            }
            response = requests.post(f"{BACKEND_URL}/api/upload", files=files, data=data)
            assert response.status_code == 400

    def test_download_flow(self):
        """Test the complete upload-download flow"""
        # First upload a file
        file_id = self.test_upload_docx()
        assert file_id is not None

        # Check status until complete
        max_retries = 10
        for _ in range(max_retries):
            response = requests.get(f"{BACKEND_URL}/api/status/{file_id}")
            assert response.status_code == 200
            status = response.json()['status']
            if status == 'completed':
                break
            elif status == 'failed':
                pytest.fail("Processing failed")

        # Try downloading
        response = requests.get(f"{BACKEND_URL}/api/download/{file_id}")
        assert response.status_code == 200
        assert response.headers['content-type'] == 'application/octet-stream'

    def test_invalid_download(self):
        """Test downloading with invalid file ID"""
        response = requests.get(f"{BACKEND_URL}/api/download/invalid_id")
        assert response.status_code == 404

    def teardown_method(self):
        """Cleanup test files"""
        import shutil
        shutil.rmtree(self.test_files_dir)

if __name__ == "__main__":
    pytest.main([__file__])