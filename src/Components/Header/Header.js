import React, { useState } from 'react'; 
import './Header.css'; 

import logo from './Headerassets/logo.png'; 
import avatarIcon from './Headerassets/avatar.svg';
import { ReactComponent as CartIcon } from './Headerassets/cart.svg'; 
import { FaSearch } from 'react-icons/fa';
import { useNavigate, Link, useLocation } from 'react-router-dom'; 
import { useAuth } from '../../data/AuthProvider'; 
import { useCart } from '../../data/CartProvider'; 

const Header = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false); 
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get state and functions from AuthProvider and CartProvider
  const { isAuthenticated, user, logout, isLoadingAuth } = useAuth(); 
  const { itemCount } = useCart(); 


  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim() !== '') {
      // Navigate to your dedicated SearchResultsPage with the search query
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`); 
      setSearchTerm(''); // Clear search term after navigation
    } else {
      console.log("Search term is empty.");
    }
  };

  const handleCartClick = () => {
    navigate('/ShoppingCart'); 
  };

  const handleLogout = () => {
    logout(); // Call logout from AuthContext
    setShowProfileDropdown(false);  
    navigate('/login');             
  };


  const profile = () => { // This will be navigateToProfileDashboard
    setShowProfileDropdown(false); 
    navigate('/dashboard'); 
  };

  const products = () => { // This will be navigateToProducts
    setShowProfileDropdown(false);
    navigate('/product'); 
  };

  const FAQ = () => { // This will be navigateToFAQ
    setShowProfileDropdown(false);
    navigate('/Faq'); 
  };

  const isHome = location.pathname === '/';

  // Loading state from AuthProvider
  if (isLoadingAuth) {
    return (
        <header className="the-header">
            <div className="the-header-left">
                <Link to="/" className="home-link">
                <img src={logo} alt="Logo" className="logo" />
                <span className={`site-title ${isHome ? 'active' : ''}`}>Metalworks</span>
                </Link>
            </div>
           
            <div className="the-header-right" style={{ minWidth: '200px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>

            </div>
        </header>
    );
  }

  return (
    <header className="the-header">
      <div className="the-header-left">
        <Link to="/" className="home-link">
          <img src={logo} alt="Logo" className="logo" />
          <span className={`site-title ${isHome ? 'active' : ''}`}>Metalworks</span>
        </Link>
      </div>

      <div className="the-header-right">


        <button className="cart-btn" onClick={handleCartClick}>
          <CartIcon className="cart-icon" />
         
          {isAuthenticated && itemCount > 0 && (
            <span className="cart-item-count">{itemCount}</span>
          )}
        </button>

        {/* Conditional rendering based on isAuthenticated from AuthProvider */}
        {isAuthenticated && user ? ( 
          <div className="profile-container">
            <button className="profile-btn" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
              <img src={avatarIcon} alt="Profile" className="profile-icon" />
            </button>
            {showProfileDropdown && (
              <div className="profile-dropdown">
                {/* Use user data from AuthContext */}
                <p className="profile-name">{user.firstName} {user.lastName}</p>
                <p className="profile-email">{user.email || user.userEmail /* Handle variations */}</p>
                <button className="logout-btn" onClick={profile}>Profile</button>
                <button className="logout-btn" onClick={products}>Products</button>
                <button className="logout-btn" onClick={FAQ}>FAQ</button>
                <button className="logout-btn" onClick={handleLogout}>Log out</button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="login-link-header" style={{color: 'white', textDecoration: 'none', marginLeft: '15px'}}>Login</Link>
        )}
      </div>
    </header>
  );
};

export default Header;
