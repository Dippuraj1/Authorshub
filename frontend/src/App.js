import React, { useState } from 'react';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Book size options with descriptions
const BOOK_SIZES = [
  { value: '5x8', label: '5" x 8" (Trade Paperback)' },
  { value: '6x9', label: '6" x 9" (Standard Book)' },
  { value: '7x10', label: '7" x 10" (Textbook/Workbook)' },
  { value: '8.5x11', label: '8.5" x 11" (Letter Size)' }
];

// Font options with preview styles
const FONT_OPTIONS = [
  { value: 'Times New Roman', label: 'Times New Roman', style: { fontFamily: 'Times New Roman, serif' } },
  { value: 'Arial', label: 'Arial', style: { fontFamily: 'Arial, sans-serif' } },
  { value: 'Georgia', label: 'Georgia', style: { fontFamily: 'Georgia, serif' } },
  { value: 'Garamond', label: 'Garamond', style: { fontFamily: 'Garamond, serif' } }
];

// Genre options with descriptions
const GENRE_OPTIONS = [
  { value: 'novel', label: 'Novel', description: 'Fiction narrative with character development and plot.' },
  { value: 'non-fiction', label: 'Non-Fiction', description: 'Factual content like textbooks, memoirs, or guides.' },
  { value: 'poetry', label: 'Poetry', description: 'Verse with emphasis on rhythm, imagery, and form.' }
];

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [bookSize, setBookSize] = useState('6x9');
  const [font, setFont] = useState('Times New Roman');
  const [genre, setGenre] = useState('non-fiction');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fileId, setFileId] = useState(null);
  
  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      const fileExt = file.name.split('.').pop().toLowerCase();
      if (fileExt !== 'docx' && fileExt !== 'pdf') {
        setError('Please upload only .docx or .pdf files');
        setSelectedFile(null);
        e.target.value = null;
        return;
      }
      
      setSelectedFile(file);
      setError(null);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('book_size', bookSize);
    formData.append('font', font);
    formData.append('genre', genre);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Error processing file');
      }
      
      setFileId(data.file_id);
      setSuccess('File processed successfully!');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle download
  const handleDownload = async () => {
    if (!fileId) return;
    
    try {
      window.open(`${BACKEND_URL}/api/download/${fileId}`, '_blank');
    } catch (err) {
      setError('Error downloading file');
    }
  };
  
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>AI-powered Book Formatter</h1>
        <p className="subtitle">Format your manuscript for KDP and Google Books publishing</p>
      </header>
      
      <main className="app-main">
        <div className="app-content">
          <section className="app-section">
            <h2>Upload Your Manuscript</h2>
            <p>Upload your book in .docx or PDF format and we'll format it according to industry standards.</p>
            
            <form className="upload-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="file-input-label">
                  <div className="file-input-button">Choose File</div>
                  <input 
                    type="file" 
                    onChange={handleFileChange} 
                    accept=".docx,.pdf"
                    className="file-input" 
                  />
                  <span className="file-name">
                    {selectedFile ? selectedFile.name : 'No file selected'}
                  </span>
                </label>
              </div>
              
              <div className="form-group">
                <label htmlFor="bookSize">Book Size:</label>
                <select 
                  id="bookSize" 
                  value={bookSize} 
                  onChange={(e) => setBookSize(e.target.value)}
                  className="form-select"
                >
                  {BOOK_SIZES.map(size => (
                    <option key={size.value} value={size.value}>{size.label}</option>
                  ))}
                </select>
                <div className="form-help">
                  Choose the dimensions for your book. Different sizes work better for different genres.
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="font">Font:</label>
                <select 
                  id="font" 
                  value={font} 
                  onChange={(e) => setFont(e.target.value)}
                  className="form-select"
                >
                  {FONT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value} style={option.style}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="font-preview" style={{ fontFamily: font }}>
                  This is a preview of the selected font.
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="genre">Genre:</label>
                <select 
                  id="genre" 
                  value={genre} 
                  onChange={(e) => setGenre(e.target.value)}
                  className="form-select"
                >
                  {GENRE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="form-help">
                  {GENRE_OPTIONS.find(o => o.value === genre)?.description}
                </div>
              </div>
              
              <button 
                type="submit" 
                className="submit-button" 
                disabled={loading || !selectedFile}
              >
                {loading ? 'Processing...' : 'Format Document'}
              </button>
            </form>
            
            {error && <div className="error-message">{error}</div>}
            
            {success && (
              <div className="success-message">
                <p>{success}</p>
                <button onClick={handleDownload} className="download-button">
                  Download Formatted Document
                </button>
              </div>
            )}
          </section>
          
          <section className="app-section info-section">
            <h2>About Our Formatter</h2>
            <div className="info-container">
              <div className="info-card">
                <h3>Non-Fiction Formatting</h3>
                <ul>
                  <li>1" margins on all sides</li>
                  <li>12pt font size</li>
                  <li>1.2 line spacing</li>
                  <li>Justified alignment</li>
                  <li>Properly formatted headers and footers</li>
                </ul>
              </div>
              
              <div className="info-card">
                <h3>Novel Formatting</h3>
                <ul>
                  <li>1" margins on all sides</li>
                  <li>12pt font size</li>
                  <li>1.3 line spacing</li>
                  <li>Justified alignment</li>
                  <li>Chapter breaks with proper spacing</li>
                </ul>
              </div>
              
              <div className="info-card">
                <h3>Poetry Formatting</h3>
                <ul>
                  <li>1" margins on all sides</li>
                  <li>12pt font size</li>
                  <li>Preserves line breaks and spacing</li>
                  <li>Maintains original alignment</li>
                  <li>Respects stanza structure</li>
                </ul>
              </div>
            </div>
            
            <div className="publishing-info">
              <h3>Ready for Publishing</h3>
              <p>
                Our formatter prepares your document according to the requirements of
                popular self-publishing platforms like Kindle Direct Publishing (KDP)
                and Google Books. The formatted document will have the correct margins,
                font size, and spacing for your selected book size and genre.
              </p>
            </div>
          </section>
        </div>
      </main>
      
      <footer className="app-footer">
        <p>&copy; 2025 AI-powered Book Formatter</p>
      </footer>
    </div>
  );
}

export default App;