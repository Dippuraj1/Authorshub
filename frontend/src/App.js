import React, { useState, useEffect } from 'react';
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
  { value: 'Garamond', label: 'Garamond', style: { fontFamily: 'Garamond, serif' } },
  { value: 'Baskerville', label: 'Baskerville', style: { fontFamily: 'Baskerville, serif' } },
  { value: 'Caslon', label: 'Caslon', style: { fontFamily: 'Caslon, serif' } }
];

function App() {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState('');
  const [userTier, setUserTier] = useState('free');
  
  // User input forms
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [bookSize, setBookSize] = useState('6x9');
  const [font, setFont] = useState('Times New Roman');
  const [genre, setGenre] = useState('non_fiction');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fileId, setFileId] = useState(null);
  
  // App data
  const [usageData, setUsageData] = useState(null);
  const [fileHistory, setFileHistory] = useState([]);
  const [genreOptions, setGenreOptions] = useState([]);
  const [subscriptionTiers, setSubscriptionTiers] = useState([]);
  const [currentTab, setCurrentTab] = useState('upload');
  const [formattingStandards, setFormattingStandards] = useState('');

  // Check if user is already logged in on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUserTier = localStorage.getItem('userTier');
    
    if (storedToken) {
      setToken(storedToken);
      setIsLoggedIn(true);
      setUserTier(storedUserTier || 'free');
      
      // Fetch initial data
      fetchUserData(storedToken);
    }
  }, []);
  
  // Fetch user data when logged in
  const fetchUserData = async (userToken) => {
    try {
      // Fetch subscription tiers
      const tiersResponse = await fetch(`${BACKEND_URL}/api/subscription/tiers`);
      const tiersData = await tiersResponse.json();
      setSubscriptionTiers(tiersData);
      
      // Fetch available genres
      const genresResponse = await fetch(`${BACKEND_URL}/api/genres`, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      const genresData = await genresResponse.json();
      setGenreOptions(genresData);
      
      // Set default genre to first allowed genre
      const firstAllowedGenre = genresData.find(g => g.allowed);
      if (firstAllowedGenre) {
        setGenre(firstAllowedGenre.id);
      }
      
      // Fetch usage data
      const usageResponse = await fetch(`${BACKEND_URL}/api/usage/current`, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      const usageData = await usageResponse.json();
      setUsageData(usageData);
      
      // Fetch file history
      const historyResponse = await fetch(`${BACKEND_URL}/api/history`, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      const historyData = await historyResponse.json();
      setFileHistory(historyData);
      
      // Fetch formatting standards
      const standardsResponse = await fetch(`${BACKEND_URL}/api/formatting/standards`);
      const standardsData = await standardsResponse.json();
      setFormattingStandards(standardsData.standards);
      
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Error fetching user data. Please try logging in again.");
    }
  };
  
  // Handle registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Registration failed');
      }
      
      setSuccess('Registration successful! Please log in.');
      setIsRegistering(false);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      
      const response = await fetch(`${BACKEND_URL}/api/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Login failed');
      }
      
      const data = await response.json();
      setToken(data.access_token);
      setUserTier(data.user_tier);
      setIsLoggedIn(true);
      
      // Store token in localStorage
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('userTier', data.user_tier);
      
      // Fetch user data
      fetchUserData(data.access_token);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    setToken('');
    setIsLoggedIn(false);
    setUserTier('free');
    setCurrentTab('upload');
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userTier');
  };
  
  // Handle subscription upgrade
  const handleUpgrade = async (tierId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/subscription/upgrade?tier=${tierId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Upgrade failed');
      }
      
      setUserTier(tierId);
      localStorage.setItem('userTier', tierId);
      setSuccess(`Subscription upgraded to ${tierId} successfully!`);
      
      // Refetch user data
      fetchUserData(token);
    } catch (err) {
      setError(err.message || 'Upgrade failed');
    } finally {
      setLoading(false);
    }
  };
  
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
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Error processing file');
      }
      
      setFileId(data.file_id);
      setSuccess('File processed successfully!');
      
      // Refetch usage data and file history
      fetchUserData(token);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle download
  const handleDownload = async (downloadFileId) => {
    const fileToDownload = downloadFileId || fileId;
    if (!fileToDownload) return;
    
    try {
      window.open(`${BACKEND_URL}/api/download/${fileToDownload}`, '_blank');
    } catch (err) {
      setError('Error downloading file');
    }
  };
  
  // Render Authentication Pages
  const renderAuthPage = () => {
    return (
      <div className="auth-container">
        <div className="auth-form-container">
          <h2>{isRegistering ? 'Create an Account' : 'Log In'}</h2>
          <form className="auth-form" onSubmit={isRegistering ? handleRegister : handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
              />
            </div>
            
            <button 
              type="submit" 
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Processing...' : isRegistering ? 'Register' : 'Log In'}
            </button>
          </form>
          
          <p className="auth-switch">
            {isRegistering ? 'Already have an account?' : 'Need an account?'}
            <button
              className="auth-switch-button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
                setSuccess(null);
              }}
            >
              {isRegistering ? 'Log In' : 'Register'}
            </button>
          </p>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
        </div>
        
        <div className="auth-info">
          <h2>AI-powered Book Formatter</h2>
          <p className="auth-description">
            Format your manuscript for KDP and Google Books publishing with our powerful AI formatting tool.
          </p>
          
          <div className="pricing-overview">
            <h3>Pricing Plans</h3>
            <div className="pricing-cards">
              <div className="pricing-card">
                <h4>Free</h4>
                <p className="price">$0/month</p>
                <ul>
                  <li>Format 2 books per month</li>
                  <li>Access to 3 genres</li>
                  <li>Standard formatting options</li>
                </ul>
              </div>
              
              <div className="pricing-card featured">
                <h4>Creator</h4>
                <p className="price">$5/month</p>
                <ul>
                  <li>Format 10 books per month</li>
                  <li>Access to all genres</li>
                  <li>Advanced formatting options</li>
                </ul>
              </div>
              
              <div className="pricing-card">
                <h4>Business</h4>
                <p className="price">$25/month</p>
                <ul>
                  <li>Format 50 books per month</li>
                  <li>Access to all genres</li>
                  <li>Priority processing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render Upload Tab
  const renderUploadTab = () => {
    return (
      <section className="app-section">
        <h2>Upload Your Manuscript</h2>
        <p>Upload your book in .docx or PDF format and we'll format it according to industry standards.</p>
        
        {usageData && (
          <div className="usage-info">
            <p>
              Your usage: <strong>{usageData.current_usage}</strong> of <strong>{usageData.limit}</strong> books this month
              ({usageData.tier} tier)
            </p>
            <div className="usage-bar">
              <div 
                className="usage-progress" 
                style={{ width: `${(usageData.current_usage / usageData.limit) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
        
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
              {genreOptions.map(option => (
                <option 
                  key={option.id} 
                  value={option.id}
                  disabled={!option.allowed}
                >
                  {option.name}{!option.allowed ? ' (Upgrade Required)' : ''}
                </option>
              ))}
            </select>
            {genreOptions.length > 0 && (
              <div className="form-help">
                {genreOptions.find(o => o.id === genre)?.description || ''}
                {!genreOptions.find(o => o.id === genre)?.allowed && (
                  <div className="upgrade-note">
                    This genre requires a subscription upgrade.
                    <button
                      type="button"
                      className="upgrade-button-small"
                      onClick={() => setCurrentTab('subscription')}
                    >
                      View Plans
                    </button>
                  </div>
                )}
              </div>
            )}
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
            <button onClick={() => handleDownload()} className="download-button">
              Download Formatted Document
            </button>
          </div>
        )}
      </section>
    );
  };
  
  // Render History Tab
  const renderHistoryTab = () => {
    return (
      <section className="app-section">
        <h2>Your Formatted Books</h2>
        <p>View and download your previously formatted books.</p>
        
        {fileHistory.length === 0 ? (
          <div className="empty-history">
            <p>You haven't formatted any books yet.</p>
            <button
              className="action-button"
              onClick={() => setCurrentTab('upload')}
            >
              Format Your First Book
            </button>
          </div>
        ) : (
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Genre</th>
                  <th>Book Size</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {fileHistory.map(file => (
                  <tr key={file.file_id}>
                    <td>{file.original_filename}</td>
                    <td>{file.genre}</td>
                    <td>{file.book_size}</td>
                    <td>{new Date(file.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge status-${file.status}`}>
                        {file.status}
                      </span>
                    </td>
                    <td>
                      {file.status === 'completed' && (
                        <button
                          className="download-button-small"
                          onClick={() => handleDownload(file.file_id)}
                        >
                          Download
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  };
  
  // Render Subscription Tab
  const renderSubscriptionTab = () => {
    return (
      <section className="app-section">
        <h2>Subscription Plans</h2>
        <p>Choose the plan that's right for you.</p>
        
        <div className="subscription-container">
          {subscriptionTiers.map(tier => (
            <div 
              key={tier.id} 
              className={`subscription-card ${tier.id === userTier ? 'current-plan' : ''}`}
            >
              <div className="subscription-header">
                <h3>{tier.name}</h3>
                <p className="subscription-price">${tier.price}/month</p>
                {tier.id === userTier && (
                  <div className="current-plan-badge">Current Plan</div>
                )}
              </div>
              
              <div className="subscription-features">
                <p><strong>Book Limit:</strong> {tier.monthly_limit} per month</p>
                <p><strong>Available Genres:</strong></p>
                <ul className="genre-list">
                  {tier.allowed_genres.map(genre => (
                    <li key={genre}>{genre}</li>
                  ))}
                </ul>
              </div>
              
              <div className="subscription-action">
                {tier.id !== userTier ? (
                  <button
                    className="upgrade-button"
                    onClick={() => handleUpgrade(tier.id)}
                    disabled={loading || tier.id === userTier}
                  >
                    {loading ? 'Processing...' : tier.price === 0 ? 'Downgrade' : 'Upgrade'}
                  </button>
                ) : (
                  <button className="current-plan-button" disabled>
                    Current Plan
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
      </section>
    );
  };
  
  // Render Standards Tab
  const renderStandardsTab = () => {
    return (
      <section className="app-section standards-section">
        <h2>Book Formatting Standards</h2>
        <p>Comprehensive formatting standards for different book genres.</p>
        
        <div className="standards-content">
          <pre>{formattingStandards}</pre>
        </div>
      </section>
    );
  };
  
  // Main App Render
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>AI-powered Book Formatter</h1>
        <p className="subtitle">Format your manuscript for KDP and Google Books publishing</p>
        
        {isLoggedIn && (
          <div className="user-controls">
            <button
              className="logout-button"
              onClick={handleLogout}
            >
              Log Out
            </button>
          </div>
        )}
      </header>
      
      <main className="app-main">
        <div className="app-content">
          {!isLoggedIn ? (
            renderAuthPage()
          ) : (
            <>
              <div className="tabs-container">
                <div className="tabs">
                  <button
                    className={`tab ${currentTab === 'upload' ? 'active' : ''}`}
                    onClick={() => setCurrentTab('upload')}
                  >
                    Upload & Format
                  </button>
                  <button
                    className={`tab ${currentTab === 'history' ? 'active' : ''}`}
                    onClick={() => setCurrentTab('history')}
                  >
                    History
                  </button>
                  <button
                    className={`tab ${currentTab === 'subscription' ? 'active' : ''}`}
                    onClick={() => setCurrentTab('subscription')}
                  >
                    Subscription
                  </button>
                  <button
                    className={`tab ${currentTab === 'standards' ? 'active' : ''}`}
                    onClick={() => setCurrentTab('standards')}
                  >
                    Formatting Standards
                  </button>
                </div>
              </div>
              
              {currentTab === 'upload' && renderUploadTab()}
              {currentTab === 'history' && renderHistoryTab()}
              {currentTab === 'subscription' && renderSubscriptionTab()}
              {currentTab === 'standards' && renderStandardsTab()}
            </>
          )}
        </div>
      </main>
      
      <footer className="app-footer">
        <p>&copy; 2025 AI-powered Book Formatter</p>
      </footer>
    </div>
  );
}

export default App;