import pytest
import requests
import os
import json
from pathlib import Path

# Get the backend URL from environment variable
BACKEND_URL = "https://3f99b569-43a1-4409-b75b-97e6a1d67a11.preview.emergentagent.com"

class TestBookFormatter:
    def setup_method(self):
        """Setup test data"""
        self.test_files = {
            'pdf': str(Path(__file__).parent / 'test.pdf'),
            'docx': str(Path(__file__).parent / 'test.docx')
        }
        self.test_data = {
            'book_size': '6x9',
            'font': 'Times New Roman',
            'genre': 'non-fiction'
        }

    def test_root_endpoint(self):
        """Test the root endpoint"""
        response = requests.get(f"{BACKEND_URL}/api")
        assert response.status_code == 200
        assert "message" in response.json()

    def test_upload_pdf(self):
        """Test PDF upload and processing"""
        # Create a test PDF file
        with open(self.test_files['pdf'], 'wb') as f:
            f.write(b'%PDF-1.4\nTest PDF content')

        files = {'file': ('test.pdf', open(self.test_files['pdf'], 'rb'), 'application/pdf')}
        response = requests.post(
            f"{BACKEND_URL}/api/upload",
            files=files,
            data=self.test_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "file_id" in data
        
        # Test status endpoint
        file_id = data["file_id"]
        status_response = requests.get(f"{BACKEND_URL}/api/status/{file_id}")
        assert status_response.status_code == 200
        assert "status" in status_response.json()

        # Test download endpoint
        download_response = requests.get(f"{BACKEND_URL}/api/download/{file_id}")
        assert download_response.status_code == 200

    def test_upload_docx(self):
        """Test DOCX upload and processing"""
        # Create a test DOCX file
        with open(self.test_files['docx'], 'wb') as f:
            f.write(b'PK\x03\x04\x14\x00\x00\x00\x08\x00')  # Basic DOCX signature

        files = {'file': ('test.docx', open(self.test_files['docx'], 'rb'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
        response = requests.post(
            f"{BACKEND_URL}/api/upload",
            files=files,
            data=self.test_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "file_id" in data

    def test_invalid_file_type(self):
        """Test upload with invalid file type"""
        files = {'file': ('test.txt', b'Invalid file content', 'text/plain')}
        response = requests.post(
            f"{BACKEND_URL}/api/upload",
            files=files,
            data=self.test_data
        )
        assert response.status_code == 400

    def test_invalid_parameters(self):
        """Test upload with invalid parameters"""
        files = {'file': ('test.pdf', open(self.test_files['pdf'], 'rb'), 'application/pdf')}
        
        # Test invalid book size
        invalid_data = self.test_data.copy()
        invalid_data['book_size'] = 'invalid'
        response = requests.post(
            f"{BACKEND_URL}/api/upload",
            files=files,
            data=invalid_data
        )
        assert response.status_code == 400

        # Test invalid font
        invalid_data = self.test_data.copy()
        invalid_data['font'] = 'invalid'
        response = requests.post(
            f"{BACKEND_URL}/api/upload",
            files=files,
            data=invalid_data
        )
        assert response.status_code == 400

        # Test invalid genre
        invalid_data = self.test_data.copy()
        invalid_data['genre'] = 'invalid'
        response = requests.post(
            f"{BACKEND_URL}/api/upload",
            files=files,
            data=invalid_data
        )
        assert response.status_code == 400

    def teardown_method(self):
        """Cleanup test files"""
        for file_path in self.test_files.values():
            if os.path.exists(file_path):
                os.remove(file_path)

if __name__ == "__main__":
    pytest.main([__file__, "-v"])