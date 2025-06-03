import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import './Login.css'; 
import { useAuth } from '../../data/AuthProvider';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',    
    password: ''
  });
  
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    server: '' 
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); 
  const { login } = useAuth(); 

  // Frontend email validation 
  const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '', server: '' })); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let newErrors = { email: '', password: '', server: '' };
    let isValid = true;
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
      isValid = false;
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } 
    setErrors(newErrors);
    
    if (isValid) {
      setIsSubmitting(true);
      setErrors(prev => ({ ...prev, server: '' })); 

      try {
        const apiUrl = `/api/auth/login`; // Your backend login endpoint
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            userEmail: formData.email, // Send as userEmail if backend expects that
            password: formData.password 
          }),
        });
        
        const responseData = await response.json(); 
        if (!response.ok) {
          setErrors(prev => ({ ...prev, server: responseData.message || `Login failed. Status: ${response.status}` }));
        } else {
          // Login successful
          console.log('Login successful:', responseData);
      
          if (responseData.user && responseData.token) {
            login(responseData.user, responseData.token); // This updates the global auth state

            // Redirect to the page user was trying to access, or to homepage
            const from = location.state?.from?.pathname || "/";
            navigate(from, { replace: true });
          } else {
            setErrors(prev => ({ ...prev, server: 'Login response from server was incomplete.' }));
          }
        }
      } catch (error) {
        console.error("Login API error:", error);
        setErrors(prev => ({ ...prev, server: error.message || 'Connection error. Please try again later.'}));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

 
  return (
    <div className="login-page-content"> 
      <div className="welcome-message">Welcome back adventurer!</div>
      <div className="login-wrapper">
        <div className="login-form-container">
          <h2>Please Login</h2>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <input
                type="text" // Use type="email" for better semantics and mobile keyboards
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className={errors.email ? 'input-error' : ''}
              />
              {errors.email && <div className="error-message">{errors.email}</div>}
            </div>
            
            <div className="form-group">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className={errors.password ? 'input-error' : ''}
              />
              {errors.password && <div className="error-message">{errors.password}</div>}
            </div>
            
            {errors.server && <div className="error-message server-error" style={{color: 'red', textAlign: 'center', marginBottom: '10px'}}>{errors.server}</div>}
            
            <div className="button-wrapper">
              <button 
                type="submit" // This button submits the form
                className="submit-button" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Logging in...' : 'Login'} {/* Changed from 'Submit' to 'Login' */}
              </button>
            </div>
            <div className="signup-link" style={{textAlign: 'center', marginTop: '15px'}}>
              {/* Use React Router Link for internal navigation */}
              <Link to="/signup">Don't have an account? Sign up</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
