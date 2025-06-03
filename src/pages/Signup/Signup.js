import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Signup.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',    
    password: ''
  });

  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    apiError: '' 
  });

  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    // Clear API error when user starts typing again
    if (errors.apiError) {
        setErrors(prev => ({ ...prev, apiError: '' }));
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { firstName: '', lastName: '', email: '', password: '', apiError: '' }; // Reset errors

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
      isValid = false;
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors(prev => ({ ...prev, apiError: '' }));

    try {
      const apiUrl = `/api/auth/signup`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            userEmail: formData.email,
            password: formData.password
        }),
      });

      const responseData = await response.json(); 

      if (!response.ok) {
        const errorMessage = responseData.message || `HTTP error! status: ${response.status}`;
        setErrors(prev => ({ ...prev, apiError: errorMessage }));
        console.error('Signup failed:', responseData);
        setIsLoading(false);
        return; 
      }

      // Handle successful signup
      console.log('Signup successful', responseData);
      navigate('/login', { state: { message: 'Signup successful! Please login.' } });
      
    } catch (error) {
      console.error('Signup network error or other issue:', error);
      setErrors(prev => ({ ...prev, apiError: error.message || 'An unexpected error occurred. Please try again.' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-page-content">
      <div className="welcome-message">Be a new adventurer!</div>
      
      <div className="signup-wrapper">
        <div className="signup-form-container">
          <h2>Sign Up</h2>
          
          {errors.apiError && <p className="error-message api-error">{errors.apiError}</p>}

          <form className="signup-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
                className={errors.firstName ? 'input-error' : ''}
              />
              {errors.firstName && <p className="error-message">{errors.firstName}</p>}
            </div>
            
            <div className="form-group">
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                className={errors.lastName ? 'input-error' : ''}
              />
              {errors.lastName && <p className="error-message">{errors.lastName}</p>}
            </div>
            
            <div className="form-group">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'input-error' : ''}
              />
              {errors.email && <p className="error-message">{errors.email}</p>}
            </div>
            
            <div className="form-group">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'input-error' : ''}
              />
              {errors.password && <p className="error-message">{errors.password}</p>}
            </div>
            
            <button
              type="submit"
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? 'Signing up...' : 'Sign Up'}
            </button>
          </form>
          
          <div className="login-link">
            <Link to="/login">Already have an account? Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;