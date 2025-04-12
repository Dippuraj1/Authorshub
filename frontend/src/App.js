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
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [bookSize, setBookSize] = useState('6x9');
  const [font, setFont] = useState('Times New Roman');
  const [genre, setGenre] = useState('non_fiction');
  const [template, setTemplate] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fileId, setFileId] = useState(null);
  const [showPaymentPage, setShowPaymentPage] = useState(false);
  const [pendingSubscription, setPendingSubscription] = useState(null);
  
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
  
  // Handle Google login
  const handleGoogleLogin = async () => {
    // In a real implementation, we would use the Google JavaScript SDK
    // For now, we'll simulate a successful Google authentication
    setLoading(true);
    setError(null);
    
    try {
      // Simulate Google login with a dummy token
      const response = await fetch(`${BACKEND_URL}/api/google-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id_token: 'simulate_valid_token' })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Google login failed');
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
      setError(err.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle forgot password request
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Password reset request failed');
      }
      
      setSuccess('If your email is registered, you will receive a password reset link.');
      // For demo purposes, we would show the reset token form
      // In a real app, the user would click a link in their email
      setResetToken(''); // Clear any previous token
      
    } catch (err) {
      setError(err.message || 'Password reset request failed');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle password reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          token: resetToken,
          new_password: newPassword
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Password reset failed');
      }
      
      setSuccess('Password has been reset successfully. Please log in with your new password.');
      setIsForgotPassword(false);
      
    } catch (err) {
      setError(err.message || 'Password reset failed');
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
      // Create a hidden form to post the authorization token to the download endpoint
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `${BACKEND_URL}/api/download/${fileToDownload}`;
      form.target = '_blank';
      
      // Add token as hidden input
      const tokenInput = document.createElement('input');
      tokenInput.type = 'hidden';
      tokenInput.name = 'token';
      tokenInput.value = token;
      form.appendChild(tokenInput);
      
      // Add form to document and submit
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    } catch (err) {
      setError('Error downloading file');
    }
  };
  
  // Render Landing Page
  const renderLandingPage = () => {
    return (
      <>
        <div className="hero-section">
          <div className="hero-content">
            <h1>Professional Book Formatting for Authors</h1>
            <p className="hero-subtitle">Format your manuscript for KDP and Google Books publishing in minutes</p>
            <div className="hero-cta-buttons">
              <button className="primary-button" onClick={() => setIsRegistering(false)}>Log In</button>
              <button className="secondary-button" onClick={() => setIsRegistering(true)}>Sign Up Free</button>
            </div>
          </div>
          <div className="hero-image">
            <img src="https://images.unsplash.com/photo-1739300293504-234817eead52" alt="Professional book formatting service" />
          </div>
        </div>
        
        <div className="features-section">
          <div className="section-heading">
            <h2>The Easiest Way to Format Your Books</h2>
            <p>Save time and publish faster with our intelligent formatting engine</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <img src="https://cdn-icons-png.flaticon.com/128/1056/1056289.png" alt="Book Formatting" />
              </div>
              <h3>Professional Formatting</h3>
              <p>Industry-standard formatting for all major publishing platforms</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <img src="https://cdn-icons-png.flaticon.com/128/4040/4040270.png" alt="Multiple Genres" />
              </div>
              <h3>10+ Genre Templates</h3>
              <p>Specialized templates for fiction, non-fiction, poetry, and more</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <img src="https://static.thenounproject.com/png/2124339-200.png" alt="Speed" />
              </div>
              <h3>Instant Results</h3>
              <p>Get your perfectly formatted manuscript in under 2 minutes</p>
            </div>
          </div>
        </div>
        
        <div className="testimonials-section">
          <div className="section-heading">
            <h2>Trusted by Thousands of Authors</h2>
            <p>See what authors are saying about our formatting tool</p>
          </div>
          
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="quote">"This tool saved me hours of frustration. My book looks professional and was accepted by KDP on the first try."</div>
              <div className="author">
                <div className="author-name">Sarah Johnson</div>
                <div className="author-title">Fiction Author</div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="quote">"The genre-specific formatting was exactly what I needed for my poetry collection. Worth every penny."</div>
              <div className="author">
                <div className="author-name">Michael Chen</div>
                <div className="author-title">Poet & Educator</div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="quote">"I've published 5 books using this tool. The time savings alone makes it invaluable to my business."</div>
              <div className="author">
                <div className="author-name">Jessica Williams</div>
                <div className="author-title">Non-Fiction Author</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="pricing-section">
          <div className="section-heading">
            <h2>Simple, Transparent Pricing</h2>
            <p>Choose the plan that works for your publishing needs</p>
          </div>
          
          <div className="pricing-cards">
            <div className="pricing-card">
              <div className="pricing-header">
                <h3>Free</h3>
                <p className="pricing-price">$0<span>/month</span></p>
              </div>
              <div className="pricing-features">
                <ul>
                  <li>Format 2 books per month</li>
                  <li>3 genre templates</li>
                  <li>Standard formatting options</li>
                  <li>Basic email support</li>
                </ul>
              </div>
              <button className="pricing-button" onClick={() => setIsRegistering(true)}>Get Started</button>
            </div>
            
            <div className="pricing-card featured">
              <div className="best-value">Most Popular</div>
              <div className="pricing-header">
                <h3>Creator</h3>
                <p className="pricing-price">$5<span>/month</span></p>
              </div>
              <div className="pricing-features">
                <ul>
                  <li>Format 10 books per month</li>
                  <li>All genre templates</li>
                  <li>Advanced formatting options</li>
                  <li>Priority email support</li>
                </ul>
              </div>
              <button className="pricing-button" 
                onClick={() => {
                  setPendingSubscription('creator');
                  setShowPaymentPage(true);
                }}
              >
                Subscribe Now
              </button>
            </div>
            
            <div className="pricing-card">
              <div className="pricing-header">
                <h3>Business</h3>
                <p className="pricing-price">$25<span>/month</span></p>
              </div>
              <div className="pricing-features">
                <ul>
                  <li>Format 50 books per month</li>
                  <li>All genre templates</li>
                  <li>Advanced formatting options</li>
                  <li>Dedicated support</li>
                </ul>
              </div>
              <button className="pricing-button"
                onClick={() => {
                  setPendingSubscription('business');
                  setShowPaymentPage(true);
                }}
              >
                Subscribe Now
              </button>
            </div>
          </div>
        </div>
        
        <div className="cta-section">
          <h2>Ready to publish your book?</h2>
          <p>Start formatting your manuscript in minutes</p>
          <button className="primary-button" onClick={() => setIsRegistering(true)}>Get Started for Free</button>
        </div>
      </>
    );
  };
  
  // Render Authentication Pages
  const renderAuthPage = () => {
    // Handle forgot password mode
    if (isForgotPassword) {
      return (
        <div className="auth-container">
          <div className="auth-form-container">
            <h2>Reset Your Password</h2>
            
            {/* Step 1: Enter email to get reset token */}
            {!resetToken && (
              <form className="auth-form" onSubmit={handleForgotPassword}>
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
                
                <button 
                  type="submit" 
                  className="auth-button"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Reset Password'}
                </button>
              </form>
            )}
            
            {/* Step 2: Enter reset token and new password */}
            {success && !resetToken && (
              <form className="auth-form" onSubmit={handleResetPassword}>
                <div className="form-group">
                  <label htmlFor="resetToken">Reset Token</label>
                  <input
                    type="text"
                    id="resetToken"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    required
                    className="form-input"
                    placeholder="Check your email or console log for token"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="form-input"
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="auth-button"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Set New Password'}
                </button>
              </form>
            )}
            
            <p className="auth-switch">
              <button
                className="auth-switch-button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError(null);
                  setSuccess(null);
                  setResetToken('');
                }}
              >
                Back to Login
              </button>
            </p>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
          </div>
          
          <div className="auth-image">
            <img src="https://images.unsplash.com/photo-1739300293504-234817eead52" alt="Professional book formatting" />
          </div>
        </div>
      );
    }
    
    // Handle register/login mode
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
            
            {!isRegistering && (
              <div className="forgot-password">
                <button
                  type="button"
                  className="forgot-password-link"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setError(null);
                    setSuccess(null);
                  }}
                >
                  Forgot Password?
                </button>
              </div>
            )}
            
            <button 
              type="submit" 
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Processing...' : isRegistering ? 'Register' : 'Log In'}
            </button>
          </form>
          
          <div className="auth-separator">
            <span>OR</span>
          </div>
          
          <button 
            type="button" 
            className="google-auth-button"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <span className="google-icon">G</span>
            {isRegistering ? 'Sign up with Google' : 'Sign in with Google'}
          </button>
          
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
        
        <div className="auth-image">
          <img src="https://images.unsplash.com/photo-1739300293504-234817eead52" alt="Professional book formatting" />
        </div>
      </div>
    );
  };
  
  // Render Upload Tab
  const renderUploadTab = () => {
    return (
      <section className="app-section upload-section">
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
          
          <div className="formatting-options">
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
            
            <div className="form-group">
              <label htmlFor="template">Template:</label>
              <select 
                id="template" 
                value={template} 
                onChange={(e) => setTemplate(e.target.value)}
                className="form-select"
              >
                <option value="standard">Standard Template</option>
                <option value="academic">Academic Template</option>
                <option value="modern">Modern Clean Template</option>
                <option value="classic">Classic Literary Template</option>
                <option value="minimalist">Minimalist Template</option>
              </select>
              <div className="form-help">
                Choose a pre-defined template to speed up your formatting process.
              </div>
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
      <section className="app-section history-section">
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
      <section className="app-section subscription-section">
        <h2>Subscription Plans</h2>
        <p>Choose the plan that's right for you.</p>
        
        <div className="pricing-cards">
          {subscriptionTiers.map(tier => (
            <div 
              key={tier.id} 
              className={`pricing-card ${tier.id === userTier ? 'current-plan' : ''} ${tier.id === 'creator' ? 'featured' : ''}`}
            >
              {tier.id === 'creator' && <div className="best-value">Most Popular</div>}
              {tier.id === userTier && <div className="current-plan-badge">Current Plan</div>}
              
              <div className="pricing-header">
                <h3>{tier.name}</h3>
                <p className="pricing-price">${tier.price}<span>/month</span></p>
              </div>
              
              <div className="pricing-features">
                <ul>
                  <li><strong>{tier.monthly_limit}</strong> books per month</li>
                  <li>
                    <strong>
                      {tier.id === 'free' ? '3' : 'All'}
                    </strong> genres available
                  </li>
                  <li>{tier.id === 'free' ? 'Standard' : 'Advanced'} formatting options</li>
                  <li>{tier.id === 'business' ? 'Dedicated' : tier.id === 'creator' ? 'Priority' : 'Basic'} support</li>
                </ul>
              </div>
              
              <div className="subscription-action">
                {tier.id !== userTier ? (
                  <>
                    {tier.price > 0 ? (
                      <button
                        className="pricing-button"
                        onClick={() => {
                          setPendingSubscription(tier.id);
                          setShowPaymentPage(true);
                        }}
                        disabled={loading}
                      >
                        Subscribe Now
                      </button>
                    ) : (
                      <button
                        className="pricing-button downgrade"
                        onClick={() => handleUpgrade(tier.id)}
                        disabled={loading}
                      >
                        Downgrade to Free
                      </button>
                    )}
                  </>
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
  
  // Render Payment Page
  const renderPaymentPage = () => {
    return (
      <div className="payment-container">
        <div className="payment-card">
          <h2>Complete Your Subscription</h2>
          <p>You're subscribing to our <strong>{pendingSubscription.charAt(0).toUpperCase() + pendingSubscription.slice(1)}</strong> plan.</p>
          
          <div className="payment-details">
            <div className="payment-summary">
              <h3>Subscription Summary</h3>
              <div className="payment-item">
                <span>Plan:</span>
                <span>{pendingSubscription === 'creator' ? 'Creator' : 'Business'}</span>
              </div>
              <div className="payment-item">
                <span>Price:</span>
                <span>${pendingSubscription === 'creator' ? '5' : '25'}/month</span>
              </div>
              <div className="payment-item">
                <span>Books per month:</span>
                <span>{pendingSubscription === 'creator' ? '10' : '50'}</span>
              </div>
              <div className="payment-total">
                <span>Total today:</span>
                <span>${pendingSubscription === 'creator' ? '5' : '25'}</span>
              </div>
            </div>
            
            <div className="payment-form">
              <p className="payment-note">For demo purposes, no payment information is required.</p>
              <button
                className="payment-button"
                onClick={() => {
                  handleUpgrade(pendingSubscription);
                  setShowPaymentPage(false);
                  setPendingSubscription(null);
                }}
              >
                Complete Subscription ($0 for Demo)
              </button>
              <button
                className="cancel-button"
                onClick={() => {
                  setShowPaymentPage(false);
                  setPendingSubscription(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main App Render
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <h1 onClick={() => {
              setCurrentTab('upload');
              if (!isLoggedIn) {
                window.scrollTo(0, 0);
              }
            }} style={{ cursor: 'pointer' }}>BookFormat<span>AI</span></h1>
          </div>
          
          <nav className="main-nav">
            {isLoggedIn ? (
              <>
                <button 
                  className={`nav-link ${currentTab === 'upload' && !window.location.hash ? 'active' : ''}`}
                  onClick={() => setCurrentTab('upload')}
                >
                  Home
                </button>
                <button 
                  className={`nav-link ${currentTab === 'upload' ? 'active' : ''}`}
                  onClick={() => setCurrentTab('upload')}
                >
                  Upload
                </button>
                <button 
                  className={`nav-link ${currentTab === 'history' ? 'active' : ''}`}
                  onClick={() => setCurrentTab('history')}
                >
                  History
                </button>
                <button 
                  className={`nav-link ${currentTab === 'subscription' ? 'active' : ''}`}
                  onClick={() => setCurrentTab('subscription')}
                >
                  Subscription
                </button>
                <button 
                  className={`nav-link ${currentTab === 'standards' ? 'active' : ''}`}
                  onClick={() => setCurrentTab('standards')}
                >
                  Standards
                </button>
                <button
                  className="logout-button"
                  onClick={handleLogout}
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <button 
                  className="nav-link"
                  onClick={() => {
                    window.scrollTo(0, 0);
                  }}
                >
                  Home
                </button>
                <button
                  className="nav-link"
                  onClick={() => {
                    setIsRegistering(false);
                    setIsForgotPassword(false);
                  }}
                >
                  Log In
                </button>
                <button
                  className="signup-button"
                  onClick={() => {
                    setIsRegistering(true);
                    setIsForgotPassword(false);
                  }}
                >
                  Sign Up Free
                </button>
              </>
            )}
          </nav>
        </div>
      </header>
      
      <main className="app-main">
        {showPaymentPage ? (
          renderPaymentPage()
        ) : !isLoggedIn ? (
          isRegistering || isForgotPassword ? renderAuthPage() : renderLandingPage()
        ) : (
          <div className="dashboard-container">
            {currentTab === 'upload' && renderUploadTab()}
            {currentTab === 'history' && renderHistoryTab()}
            {currentTab === 'subscription' && renderSubscriptionTab()}
            {currentTab === 'standards' && renderStandardsTab()}
          </div>
        )}
      </main>
      
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>BookFormatAI</h3>
            <p>Professional book formatting for authors and publishers.</p>
          </div>
          
          <div className="footer-section">
            <h3>Features</h3>
            <ul>
              <li>Genre-specific formatting</li>
              <li>KDP & Google Books compatible</li>
              <li>Multiple book sizes</li>
              <li>Custom fonts & styles</li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Resources</h3>
            <ul>
              <li>Formatting Standards</li>
              <li>Publishing Guide</li>
              <li>Help Center</li>
              <li>Contact Support</li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Legal</h3>
            <ul>
              <li>Terms of Service</li>
              <li>Privacy Policy</li>
              <li>Cookie Policy</li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 BookFormatAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;