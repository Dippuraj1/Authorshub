import pytest
import requests
import os
from pathlib import Path
from reportlab.pdfgen import canvas
from io import BytesIO

# Get backend URL from environment
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', '')
if not BACKEND_URL:
    raise ValueError("REACT_APP_BACKEND_URL environment variable not set")

class TestBookFormatter:
    def create_minimal_pdf(self):
        """Create a minimal valid PDF file with just a signature"""
        buffer = BytesIO()
        c = canvas.Canvas(buffer)
        c.drawString(100, 750, "Test Signature")
        c.save()
        buffer.seek(0)
        return buffer

    def test_root_endpoint(self):
        """Test the root endpoint"""
        response = requests.get(f"{BACKEND_URL}/api")
        assert response.status_code == 200
        assert response.json()["message"] == "Book Editor API"

    def test_file_upload_validation(self):
        """Test file upload with various validation scenarios"""
        # Test with invalid file type
        files = {'file': ('test.txt', b'test content', 'text/plain')}
        data = {
            'book_size': '6x9',
            'font': 'Times New Roman',
            'genre': 'novel'
        }
        response = requests.post(f"{BACKEND_URL}/api/upload", files=files, data=data)
        assert response.status_code == 400
        assert "Unsupported file format" in response.json()["detail"]

        # Test with invalid book size
        files = {'file': ('test.pdf', self.create_minimal_pdf().getvalue(), 'application/pdf')}
        data = {
            'book_size': 'invalid',
            'font': 'Times New Roman',
            'genre': 'novel'
        }
        response = requests.post(f"{BACKEND_URL}/api/upload", files=files, data=data)
        assert response.status_code == 400
        assert "Invalid book size" in response.json()["detail"]

        # Test with invalid font
        data = {
            'book_size': '6x9',
            'font': 'InvalidFont',
            'genre': 'novel'
        }
        response = requests.post(f"{BACKEND_URL}/api/upload", files=files, data=data)
        assert response.status_code == 400
        assert "Invalid font" in response.json()["detail"]

        # Test with invalid genre
        data = {
            'book_size': '6x9',
            'font': 'Times New Roman',
            'genre': 'invalid'
        }
        response = requests.post(f"{BACKEND_URL}/api/upload", files=files, data=data)
        assert response.status_code == 400
        assert "Invalid genre" in response.json()["detail"]

    def test_pdf_upload_and_processing(self):
        """Test PDF upload with minimal valid PDF"""
        files = {'file': ('test.pdf', self.create_minimal_pdf().getvalue(), 'application/pdf')}
        data = {
            'book_size': '6x9',
            'font': 'Times New Roman',
            'genre': 'novel'
        }
        response = requests.post(f"{BACKEND_URL}/api/upload", files=files, data=data)
        assert response.status_code == 200
        result = response.json()
        assert "file_id" in result
        
        # Test status endpoint
        file_id = result["file_id"]
        status_response = requests.get(f"{BACKEND_URL}/api/status/{file_id}")
        assert status_response.status_code == 200
        assert status_response.json()["status"] in ["processing", "completed"]

        # If processing completed, test download
        if status_response.json()["status"] == "completed":
            download_response = requests.get(f"{BACKEND_URL}/api/download/{file_id}")
            assert download_response.status_code == 200
            assert download_response.headers['Content-Type'] == 'application/octet-stream'

    def test_file_size_validation(self):
        """Test file size validation"""
        # Create a PDF larger than 10MB
        large_buffer = BytesIO()
        c = canvas.Canvas(large_buffer)
        for i in range(1000):  # Create many pages to increase file size
            c.drawString(100, 750, "A" * 10000)
            c.showPage()
        c.save()
        large_buffer.seek(0)

        files = {'file': ('large.pdf', large_buffer.getvalue(), 'application/pdf')}
        data = {
            'book_size': '6x9',
            'font': 'Times New Roman',
            'genre': 'novel'
        }
        response = requests.post(f"{BACKEND_URL}/api/upload", files=files, data=data)
        assert response.status_code == 400
        assert "File too large" in response.json()["detail"]

if __name__ == "__main__":
    # Create test instance
    tester = TestBookFormatter()
    
    print("Running API tests...")
    
    try:
        print("\n1. Testing root endpoint...")
        tester.test_root_endpoint()
        print("✅ Root endpoint test passed")
        
        print("\n2. Testing file validation...")
        tester.test_file_upload_validation()
        print("✅ File validation tests passed")
        
        print("\n3. Testing PDF upload and processing...")
        tester.test_pdf_upload_and_processing()
        print("✅ PDF upload and processing test passed")
        
        print("\n4. Testing file size validation...")
        tester.test_file_size_validation()
        print("✅ File size validation test passed")
        
        print("\n✅ All tests completed successfully!")
        
    except AssertionError as e:
        print(f"\n❌ Test failed: {str(e)}")
    except Exception as e:
        print(f"\n❌ Error during testing: {str(e)}")
