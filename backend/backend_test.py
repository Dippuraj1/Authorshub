import pytest
import requests
import os
import tempfile
from pathlib import Path

# Get the backend URL from environment variable
BACKEND_URL = "https://3f99b569-43a1-4409-b75b-97e6a1d67a11.preview.emergentagent.com"

class TestBookFormatter:
    def setup_method(self):
        """Setup test files"""
        self.test_files = {
            'pdf': self.create_test_file('.pdf', b'%PDF-1.4\nTest PDF content'),
            'docx': self.create_test_file('.docx', b'Test DOCX content'),
            'invalid': self.create_test_file('.txt', b'Invalid file type')
        }
        
    def create_test_file(self, extension, content):
        """Create a temporary test file"""
        temp_file = tempfile.NamedTemporaryFile(suffix=extension, delete=False)
        temp_file.write(content)
        temp_file.close()
        return temp_file.name

    def test_api_root(self):
        """Test root endpoint"""
        response = requests.get(f"{BACKEND_URL}/api")
        assert response.status_code == 200
        assert "message" in response.json()

    def test_upload_pdf(self):
        """Test PDF file upload"""
        with open(self.test_files['pdf'], 'rb') as f:
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
            return result.get('file_id')

    def test_upload_docx(self):
        """Test DOCX file upload"""
        with open(self.test_files['docx'], 'rb') as f:
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
            return result.get('file_id')

    def test_invalid_file_type(self):
        """Test invalid file type upload"""
        with open(self.test_files['invalid'], 'rb') as f:
            files = {'file': ('test.txt', f, 'text/plain')}
            data = {
                'book_size': '6x9',
                'font': 'Times New Roman',
                'genre': 'non-fiction'
            }
            response = requests.post(f"{BACKEND_URL}/api/upload", files=files, data=data)
            assert response.status_code == 400
            assert "Unsupported file format" in response.json()['detail']

    def test_invalid_parameters(self):
        """Test invalid parameters"""
        with open(self.test_files['pdf'], 'rb') as f:
            files = {'file': ('test.pdf', f, 'application/pdf')}
            data = {
                'book_size': 'invalid',
                'font': 'Times New Roman',
                'genre': 'non-fiction'
            }
            response = requests.post(f"{BACKEND_URL}/api/upload", files=files, data=data)
            assert response.status_code == 400
            assert "Invalid book size" in response.json()['detail']

    def test_file_status_and_download(self):
        """Test file status check and download"""
        # First upload a file
        file_id = self.test_upload_pdf()
        
        # Check status
        status_response = requests.get(f"{BACKEND_URL}/api/status/{file_id}")
        assert status_response.status_code == 200
        status_data = status_response.json()
        assert status_data['file_id'] == file_id
        assert 'status' in status_data
        
        # Try to download if processing is complete
        if status_data['status'] == 'completed':
            download_response = requests.get(f"{BACKEND_URL}/api/download/{file_id}")
            assert download_response.status_code == 200
            assert download_response.headers['Content-Type'] == 'application/octet-stream'

    def test_invalid_file_id(self):
        """Test invalid file ID handling"""
        response = requests.get(f"{BACKEND_URL}/api/status/invalid_id")
        assert response.status_code == 404
        assert "File not found" in response.json()['detail']

    def teardown_method(self):
        """Cleanup test files"""
        for file_path in self.test_files.values():
            try:
                os.unlink(file_path)
            except:
                pass

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
