import React, { useState, useCallback, createContext, useContext, useEffect } from 'react';
import './Dashboard.css';
import { useAuth } from '../../data/AuthProvider'; // MAKE SURE THIS PATH IS CORRECT
import { productImages } from '../../utils/productImages'; // Your imported image utility
import cloud1 from '../../assets/cloud1.png'; // This path seems fine based on your CSS
import { useNavigate } from 'react-router-dom'; // <<<<<<<<< IMPORT THIS

const DashboardContext = createContext();

// Helper function for API calls
const fetchApi = async (url, options = {}, customerId) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (customerId) {
    headers['temp-user-id'] = customerId;
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }
  return response.json();
};


const DashboardProvider = ({ children }) => {
  const { user, isAuthenticated, handleLogout: authHandleLogout } = useAuth(); // Get user from AuthProvider
  const navigate = useNavigate(); // <<<<<<<<<<<<<< INITIALIZE useNavigate

  const [activeSection, setActiveSection] = useState('dashboard');
  const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '', phone: '', avatarUrl: '' });
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState({
    profile: false,
    orders: false,
    addresses: false,
  });
  const [error, setError] = useState({
    profile: null,
    orders: null,
    addresses: null,
  });

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null); // null for new, address object for editing

  const customerId = user?.CustomerID;

  // Fetch Profile
  useEffect(() => {
    if (isAuthenticated && customerId) {
      setIsLoading(prev => ({ ...prev, profile: true }));
      setError(prev => ({ ...prev, profile: null }));
      fetchApi('/api/user/profile', {}, customerId)
        .then(data => setProfile(data))
        .catch(err => setError(prev => ({ ...prev, profile: err.message })))
        .finally(() => setIsLoading(prev => ({ ...prev, profile: false })));
    }
  }, [isAuthenticated, customerId]);

  // Fetch Orders
  useEffect(() => {
    if (isAuthenticated && customerId) {
      setIsLoading(prev => ({ ...prev, orders: true }));
      setError(prev => ({ ...prev, orders: null }));
      fetchApi('/api/orders', {}, customerId)
        .then(data => {
          const updatedOrders = data.map(order => ({
            ...order,
            items: order.items.map(item => {
              const imageName = item.ImagePath;
              let resolvedImageSrc = productImages[imageName] || '/placeholder.png';
              if (imageName && !productImages.hasOwnProperty(imageName)) {
                // console.warn(`[Dashboard Image] WARNING: Image '${imageName}' for item '${item.ProductName}' NOT found in productImages. Using placeholder.`);
              } else if (!imageName) {
                //  console.warn(`[Dashboard Image] WARNING: No ImagePath provided from backend for item '${item.ProductName}'. Using placeholder.`);
              }
              return { ...item, image: resolvedImageSrc };
            })
          }));
          setOrders(updatedOrders);
        })
        .catch(err => {
            setError(prev => ({ ...prev, orders: err.message }));
            console.error("Error fetching or processing orders for dashboard:", err);
        })
        .finally(() => setIsLoading(prev => ({ ...prev, orders: false })));
    }
  }, [isAuthenticated, customerId]);

  // Fetch Addresses
  const fetchAddresses = useCallback(() => {
    if (isAuthenticated && customerId) {
      setIsLoading(prev => ({ ...prev, addresses: true }));
      setError(prev => ({ ...prev, addresses: null })); // Clear previous address errors on new fetch
      fetchApi('/api/user/addresses', {}, customerId)
        .then(data => setAddresses(data || []))
        .catch(err => setError(prev => ({ ...prev, addresses: err.message })))
        .finally(() => setIsLoading(prev => ({ ...prev, addresses: false })));
    }
  }, [isAuthenticated, customerId]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);


  const getStatusClass = useCallback((status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'status-completed';
      case 'shipped': return 'status-shipped';
      case 'processing': return 'status-processing';
      case 'pending': return 'status-processing'; // Also treat pending as processing for style
      default: return '';
    }
  }, []);

  const handleLogout = () => {
    authHandleLogout();
  };

  const handleAddAddressClick = () => {
    setEditingAddress(null);
    setShowAddressModal(true);
  };

  const handleEditAddressClick = (address) => {
    setEditingAddress(address);
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (addressData) => {
    if (!customerId) { alert("User not authenticated."); return; }
    setIsLoading(prev => ({ ...prev, addresses: true }));
    setError(prev => ({ ...prev, addresses: null })); 
    try {
      if (editingAddress && editingAddress.AddressID) {
        await fetchApi(`/api/user/addresses/${editingAddress.AddressID}`, { method: 'PUT', body: JSON.stringify(addressData), }, customerId);
        alert('Address updated successfully!');
      } else {
        await fetchApi('/api/user/addresses', { method: 'POST', body: JSON.stringify(addressData), }, customerId);
        alert('Address added successfully!');
      }
      setShowAddressModal(false); setEditingAddress(null); fetchAddresses(); 
    } catch (err) {
      setError(prev => ({ ...prev, addresses: err.message })); alert(`Error saving address: ${err.message}`);
    } finally { setIsLoading(prev => ({ ...prev, addresses: false })); }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!customerId) { alert("User not authenticated."); return; }
    if (window.confirm('Are you sure you want to delete this address?')) {
      setIsLoading(prev => ({ ...prev, addresses: true }));
      setError(prev => ({ ...prev, addresses: null })); 
      try {
        await fetchApi(`/api/user/addresses/${addressId}`, { method: 'DELETE' }, customerId);
        alert('Address deleted successfully!'); fetchAddresses(); 
      } catch (err) {
        setError(prev => ({ ...prev, addresses: err.message })); alert(`Error deleting address: ${err.message}`);
      } finally { setIsLoading(prev => ({ ...prev, addresses: false })); }
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    if (!customerId) { alert("User not authenticated."); return; }
    setIsLoading(prev => ({ ...prev, addresses: true }));
    setError(prev => ({ ...prev, addresses: null })); 
    try {
      await fetchApi(`/api/user/addresses/${addressId}/default`, { method: 'PUT' }, customerId);
      alert('Address set as default!'); fetchAddresses(); 
    } catch (err) {
      setError(prev => ({ ...prev, addresses: err.message })); alert(`Error setting default address: ${err.message}`);
    } finally { setIsLoading(prev => ({ ...prev, addresses: false })); }
  };

  const handleShopNow = () => { alert('Redirecting to shop page (not implemented)'); };
  const handleViewDetails = () => { alert('Showing product details (not implemented)'); };

  // <<<<<<<<<<<<<< MODIFIED handleTrackOrder >>>>>>>>>>>>>
  const handleTrackOrder = (orderId) => {
    if (!orderId) {
        console.error("Track Order: orderId is undefined.");
        alert("Cannot track order: Order ID is missing.");
        return;
    }
    // Navigate to '/ordertrack' and pass the orderId in the state object
    navigate('/ordertrack', { state: { orderId: orderId } });
  };
  // <<<<<<<<<<<<<< END OF MODIFICATION >>>>>>>>>>>>>

  const handleBuyAgain = (orderId) => { alert(`Adding items from order ${orderId} to cart (not implemented)`); };
  const handleCancelOrder = (orderId) => { alert(`Canceling order ${orderId} (not implemented)`); };
  
  const handleChangeAvatar = async () => {
    if (!customerId) {
      alert("User not authenticated.");
      return;
    }
    const newAvatarUrl = window.prompt("Enter the URL for your new avatar image:", profile.avatarUrl || '');
    if (newAvatarUrl !== null) { 
        if (newAvatarUrl.trim() === '' && !window.confirm("You entered an empty URL. This will remove your current avatar. Continue?")) {
            return; 
        }
      setIsLoading(prev => ({ ...prev, profile: true }));
      setError(prev => ({ ...prev, profile: null })); 
      try {
        const response = await fetchApi('/api/user/avatar', {
          method: 'PUT',
          body: JSON.stringify({ avatarUrl: newAvatarUrl.trim() })
        }, customerId);
        setProfile(prev => ({ ...prev, avatarUrl: response.avatarUrl })); 
        alert('Avatar updated successfully!');
      } catch (err) {
        setError(prev => ({ ...prev, profile: err.message }));
        alert(`Error updating avatar: ${err.message}`);
      } finally {
        setIsLoading(prev => ({ ...prev, profile: false }));
      }
    }
  };
  
  const handleSaveProfile = async (profileData) => {
    if (!customerId) { alert("User not authenticated."); return; }
    setIsLoading(prev => ({ ...prev, profile: true }));
    setError(prev => ({ ...prev, profile: null })); 
    try {
        const { firstName, lastName, phone } = profileData;
        const apiResponse = await fetchApi('/api/user/profile', {
            method: 'PUT',
            body: JSON.stringify({ firstName, lastName, phone })
        }, customerId);
        setProfile(apiResponse.user); 
        alert("Profile updated successfully!");
    } catch (err) {
        setError(prev => ({...prev, profile: err.message}));
        alert(`Error updating profile: ${err.message}`);
    } finally { setIsLoading(prev => ({ ...prev, profile: false })); }
  };

  const handleChangePassword = async (passwordData) => {
    if (!customerId) { alert("User not authenticated."); return; }
    setIsLoading(prev => ({ ...prev, profile: true }));
    setError(prev => ({ ...prev, profile: null })); 
    try {
        await fetchApi('/api/user/password', { method: 'PUT', body: JSON.stringify(passwordData) }, customerId);
        alert("Password changed successfully!");
    } catch (err) {
        setError(prev => ({...prev, profile: err.message}));
        alert(`Error changing password: ${err.message}`);
    } finally { setIsLoading(prev => ({ ...prev, profile: false })); }
  };

  const value = {
    profile, setProfile, orders, addresses, activeSection, setActiveSection,
    getStatusClass, handleLogout, handleShopNow, handleViewDetails, handleTrackOrder, // handleTrackOrder is now updated
    handleBuyAgain, handleCancelOrder, handleChangeAvatar, handleSaveProfile, handleChangePassword,
    handleAddAddressClick, handleEditAddressClick, handleDeleteAddress, handleSetDefaultAddress,
    showAddressModal, setShowAddressModal, editingAddress, setEditingAddress, handleSaveAddress,
    isLoading, error,
  };

  return (<DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>);
};

const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) { throw new Error('useDashboard must be used within a DashboardProvider'); }
  return context;
};

const AddressFormModal = ({ currentAddress, onSave, onClose }) => {
  const [formState, setFormState] = useState({ Nickname: '', RecipientName: '', ContactPhone: '', Line1: '', Line2: '', City: '', Region: '', PostalCode: '', Country: '', IsDefault: false, });
  useEffect(() => {
    if (currentAddress) { setFormState({ Nickname: currentAddress.Nickname || '', RecipientName: currentAddress.RecipientName || '', ContactPhone: currentAddress.ContactPhone || '', Line1: currentAddress.Line1 || '', Line2: currentAddress.Line2 || '', City: currentAddress.City || '', Region: currentAddress.Region || '', PostalCode: currentAddress.PostalCode || '', Country: currentAddress.Country || '', IsDefault: !!currentAddress.IsDefault, }); }
    else { setFormState({ Nickname: '', RecipientName: '', ContactPhone: '', Line1: '', Line2: '', City: '', Region: '', PostalCode: '', Country: '', IsDefault: false, }); }
  }, [currentAddress]);
  const handleChange = (e) => { const { name, value, type, checked } = e.target; setFormState(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value })); };
  const handleSubmit = (e) => { e.preventDefault(); if (!formState.RecipientName || !formState.Line1 || !formState.City || !formState.PostalCode || !formState.Country || !formState.ContactPhone) { alert("Please fill in all required fields for the address (Recipient Name, Line 1, City, Postal Code, Country, Phone)."); return; } onSave(formState); };
  const modalStyle = { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: '#2b2b2b', padding: '30px', borderRadius: '15px', zIndex: 1000, color: '#fff', border: '2px solid #89ce8c', boxShadow: '0 0 20px rgba(137, 206, 140, 0.3)', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' };
  const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 999 };
  return ( <> <div style={overlayStyle} onClick={onClose} /> <div style={modalStyle} className="address-form-modal"> <h2>{currentAddress ? 'Edit Address' : 'Add New Address'}</h2> <form onSubmit={handleSubmit}> <div className="form-group"><label htmlFor="addrNickname">Nickname</label><input id="addrNickname" type="text" name="Nickname" value={formState.Nickname} onChange={handleChange} /></div> <div className="form-group"><label htmlFor="addrRecipientName">Recipient Name*</label><input id="addrRecipientName" type="text" name="RecipientName" value={formState.RecipientName} onChange={handleChange} required /></div> <div className="form-group"><label htmlFor="addrContactPhone">Contact Phone*</label><input id="addrContactPhone" type="tel" name="ContactPhone" value={formState.ContactPhone} onChange={handleChange} required /></div> <div className="form-group"><label htmlFor="addrLine1">Address Line 1*</label><input id="addrLine1" type="text" name="Line1" value={formState.Line1} onChange={handleChange} required /></div> <div className="form-group"><label htmlFor="addrLine2">Address Line 2</label><input id="addrLine2" type="text" name="Line2" value={formState.Line2} onChange={handleChange} /></div> <div className="form-group"><label htmlFor="addrCity">City*</label><input id="addrCity" type="text" name="City" value={formState.City} onChange={handleChange} required /></div> <div className="form-group"><label htmlFor="addrRegion">Region/State</label><input id="addrRegion" type="text" name="Region" value={formState.Region} onChange={handleChange} /></div> <div className="form-group"><label htmlFor="addrPostalCode">Postal Code*</label><input id="addrPostalCode" type="text" name="PostalCode" value={formState.PostalCode} onChange={handleChange} required /></div> <div className="form-group"><label htmlFor="addrCountry">Country*</label><input id="addrCountry" type="text" name="Country" value={formState.Country} onChange={handleChange} required /></div> <div className="form-group" style={{ display: 'flex', alignItems: 'center' }}><input type="checkbox" name="IsDefault" id="isDefaultAddress" checked={formState.IsDefault} onChange={handleChange} style={{ marginRight: '10px', width: 'auto' }} /><label htmlFor="isDefaultAddress" style={{ marginBottom: 0, display: 'inline' }}>Set as default</label></div> <div className="form-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button">Save Address</button></div> </form> </div> </> );
};

const DashboardContent = () => {
  const {
    activeSection, setActiveSection, handleLogout, isLoading, error,
    showAddressModal, setShowAddressModal, editingAddress, setEditingAddress,
    handleSaveAddress, profile, orders, addresses
  } = useDashboard();

  const isAnySectionLoading = isLoading.profile ||
                                (isLoading.orders && (activeSection === 'order-history' || activeSection === 'dashboard')) ||
                                (isLoading.addresses && activeSection === 'addresses');

  if (isAnySectionLoading &&
      ( (activeSection === 'dashboard' && !profile.firstName && (!orders || !orders.length)) ||
        (activeSection === 'order-history' && (!orders || !orders.length)) ||
        (activeSection === 'profile-details' && !profile.firstName) ||
        (activeSection === 'addresses' && (!addresses || !addresses.length)) )
     ) {
    return ( 
        <div className="loading-overlay" style={{ color: '#fff', textAlign: 'center', paddingTop: '100px', fontSize: '1.5rem' }}>
            <div className="loading-spinner" style={{ border: '5px solid #f3f3f3', borderTop: '5px solid #5a6d5a', borderRadius: '50%', width: '50px', height: '50px', animation: 'spin 1s linear infinite', margin: '20px auto' }}></div>
            <p>Loading {activeSection}...</p>
        </div>
    );
  }
  
  return ( 
    <div className="ds-dashboard-content">
      <div className="ds-sidebar">
        <div className="ds-nav-container">
          <ul className="ds-nav-menu">
            <li className={activeSection === 'dashboard' ? 'active' : ''} onClick={() => setActiveSection('dashboard')}><span className="ds-nav-icon" aria-hidden="true">⚔️</span> Dashboard</li>
            <li className={activeSection === 'order-history' ? 'active' : ''} onClick={() => setActiveSection('order-history')}><span className="ds-nav-icon" aria-hidden="true">📜</span> Order History</li>
            <li className={activeSection === 'profile-details' ? 'active' : ''} onClick={() => setActiveSection('profile-details')}><span className="ds-nav-icon" aria-hidden="true">👤</span> Profile Details</li>
            <li className={activeSection === 'addresses' ? 'active' : ''} onClick={() => setActiveSection('addresses')}><span className="ds-nav-icon" aria-hidden="true">🏰</span> Addresses</li>
          </ul>
        </div>
        <div className="ds-main-panel"><img src={cloud1} alt="Decorative cloud background" className="zoomed-full-image" /></div>
        <div className="forge-branding"><h3>MetalWorks</h3><p>Your trusted forge for tools and upgrades, crafted with skill, built for adventurers.</p></div>
      </div>
      <div className="ds-main-content">
        {error[activeSection] && <p className="error-message" style={{color: 'red', marginBottom: '15px'}}>Error: {error[activeSection]}</p>}
        {activeSection === 'dashboard' && <DashboardOverview />}
        {activeSection === 'order-history' && <OrderHistorySection />}
        {activeSection === 'profile-details' && <ProfileSection />}
        {activeSection === 'addresses' && <AddressesSection />}
      </div>
      {showAddressModal && (<AddressFormModal currentAddress={editingAddress} onSave={handleSaveAddress} onClose={() => { setShowAddressModal(false); setEditingAddress(null); }} /> )}
    </div>
  );
};

const DashboardOverview = () => {
    const { handleShopNow, handleViewDetails, orders, profile, isLoading, error } = useDashboard();
    const totalOrders = orders.length; const loyaltyPoints = totalOrders * 75;
    const recentActivities = orders.slice(0, 2).map(order => ({ type: 'order', description: `Order #${order.id || order.OrderID} status: ${order.status}`, date: new Date(order.date || order.OrderDate).toLocaleDateString() }));
    return ( <div className="dashboard-overview"> <h2>Welcome, {profile.firstName || 'Adventurer'}!</h2> {isLoading.orders && !orders.length && <p>Loading overview data...</p>} {error.orders && !orders.length && <p>Error loading overview: {error.orders}</p>} <div className="stats-container"> <div className="stat-card" tabIndex="0" aria-label={`Orders placed: ${totalOrders}`}><h3>Orders Placed</h3><p className="stat-number">{totalOrders}</p></div> <div className="stat-card" tabIndex="0" aria-label={`Loyalty points: ${loyaltyPoints}`}><h3>Loyalty Points</h3><p className="stat-number">{loyaltyPoints}</p></div> </div> <div className="recent-activity"><h3>Recent Activity</h3>{isLoading.orders && recentActivities.length === 0 && <p>Loading activities...</p>}{!isLoading.orders && recentActivities.length === 0 && <p>No recent activity.</p>}{recentActivities.length > 0 && (<div className="activity-list">{recentActivities.map((activity, index) => (<div key={index} className="activity-item"><div className={`activity-icon ${activity.type === 'order' ? 'order-icon' : 'profile-icon'}`} aria-hidden="true">{activity.type === 'order' ? '📜' : '👤'}</div><div className="activity-details"><p>{activity.description}</p><p className="activity-date">{activity.date}</p></div></div>))}</div>)}</div> <div className="special-offers"><h3>Exclusive Offers</h3><div className="offers-grid"><div className="offer-card" tabIndex="0"><div className="offer-badge">15% OFF</div><h4>Seasonal Sale</h4><p>Premium steel products</p><button className="primary-button" onClick={handleShopNow}>Shop Now</button></div><div className="offer-card" tabIndex="0"><div className="offer-badge">NEW</div><h4>Dragon Scale Armor</h4><p>Limited edition</p><button className="primary-button" onClick={handleViewDetails}>View Details</button></div></div></div> </div> );
};

const OrderHistorySection = () => {
    const { orders, getStatusClass, handleTrackOrder, handleBuyAgain, handleCancelOrder, isLoading, error } = useDashboard();
    if (isLoading.orders && !orders.length) return <p>Loading order history...</p>; if (error.orders && !orders.length) return <p>Error: {error.orders}</p>; if (!isLoading.orders && (!orders || orders.length === 0)) return <p>You have no past orders.</p>;
    return (<div className="order-history-section"><h2>Your Crafted Orders</h2><div className="orders-container">{orders.map((order) => (<div key={order.id || order.OrderID} className="order-card" tabIndex="0"><div className="order-header"><div><h3>Order #{(order.id || order.OrderID).toString().padStart(4, '0')}</h3><p>Ordered on: {new Date(order.date || order.OrderDate).toLocaleDateString()}</p><p>Total: ₱{(Number(order.total || order.TotalCost) || 0).toFixed(2)}</p></div><div className={`order-status ${getStatusClass(order.status)}`}>{order.status}</div></div><div className="order-items">{(order.items || []).map((item, index) => (<div key={item.ProductID || index} className="order-item"><div className="item-image" style={{ backgroundImage: `url(${item.image})`}} aria-label={`Image of ${item.name || item.ProductName}`}></div><div className="item-details"><p className="item-name">{item.name || item.ProductName}</p><p className="item-price">₱{(Number(item.price || item.UnitPrice) || 0).toFixed(2)}</p>{item.quantity && <p>Quantity: {item.quantity}</p>}</div></div>))}</div><div className="order-actions"><button className="secondary-button" onClick={() => handleTrackOrder(order.id || order.OrderID)}>Track Order</button>{order.status === 'Completed' || order.status === 'Shipped' ? (<button className="primary-button" onClick={() => handleBuyAgain(order.id || order.OrderID)}>Buy Again</button>) : null}</div></div>))}</div></div>);
};

const ProfileSection = () => {
  const { profile, handleSaveProfile, handleChangePassword, handleChangeAvatar, isLoading, error } = useDashboard();
  const [formData, setFormData] = useState({ firstName: '', lastName: '', phone: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || ''
      });
    }
  }, [profile]);

  const handleFormChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value });};
  const handlePasswordChange = (e) => { setPasswordData({ ...passwordData, [e.target.name]: e.target.value });};
  const handleSubmitProfile = (e) => { 
    e.preventDefault(); 
    if (!formData.firstName || !formData.lastName) { alert("First name and last name are required."); return; }
    handleSaveProfile(formData);
  };
  const handleSubmitPassword = (e) => {
    e.preventDefault(); 
    if (!passwordData.currentPassword || !passwordData.newPassword) { alert("Current and new password are required."); return; }
    if (passwordData.newPassword !== passwordData.confirmPassword) { alert("New passwords do not match!"); return; }
    if (passwordData.newPassword.length < 8) { alert("New password must be at least 8 characters long."); return;}
    handleChangePassword({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword });
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };
  
  if (isLoading.profile && !profile.firstName) return <p>Loading profile...</p>;
  if (error.profile && !profile.firstName) return <p>Error loading profile: {error.profile}</p>;

  return (
    <div className="profile-section">
      <h2>Blacksmith's Profile</h2>
      <div className="profile-card">
        <div className="profile-avatar"> 
          <div className="avatar-display-area"> 
            {profile.avatarUrl ? (
              <img 
                src={profile.avatarUrl} 
                alt={`${profile.firstName || 'User'}'s Avatar`} 
                className="avatar-image-tag" 
              />
            ) : (
              <div className="avatar-placeholder-content" aria-hidden="true">
                👤 
              </div>
            )}
          </div>
          <button 
            className="secondary-button" 
            onClick={handleChangeAvatar} 
            style={{marginTop: '10px'}} 
            disabled={isLoading.profile}
          >
            {isLoading.profile ? 'Updating...' : 'Change Avatar'}
          </button>
        </div>
        <form className="profile-form" onSubmit={handleSubmitProfile}>
          <div className="form-group"><label htmlFor="profFirstName">First Name</label><input id="profFirstName" name="firstName" type="text" value={formData.firstName} onChange={handleFormChange} /></div>
          <div className="form-group"><label htmlFor="profLastName">Last Name</label><input id="profLastName" name="lastName" type="text" value={formData.lastName} onChange={handleFormChange} /></div>
          <div className="form-group"><label htmlFor="profEmail">Email Address</label><input id="profEmail" type="email" value={profile.email || ''} readOnly disabled /></div>
          <div className="form-group"><label htmlFor="profPhone">Phone Number</label><input id="profPhone" name="phone" type="tel" value={formData.phone} onChange={handleFormChange} /></div>
          <div className="form-actions"><button type="submit" className="primary-button" disabled={isLoading.profile}>{isLoading.profile ? 'Saving...' : 'Save Profile Changes'}</button></div>
        </form>
      </div>
      <div className="profile-card" style={{marginTop: '30px'}}>
        <form className="profile-form" onSubmit={handleSubmitPassword}>
            <h3>Change Password</h3>
            <div className="form-group"><label htmlFor="profCurrentPassword">Current Password</label><input id="profCurrentPassword" name="currentPassword" type="password" placeholder="Enter current password" value={passwordData.currentPassword} onChange={handlePasswordChange} /></div>
            <div className="form-group"><label htmlFor="profNewPassword">New Password</label><input id="profNewPassword" name="newPassword" type="password" placeholder="Enter new password (min 8 chars)" value={passwordData.newPassword} onChange={handlePasswordChange} /></div>
            <div className="form-group"><label htmlFor="profConfirmPassword">Confirm Password</label><input id="profConfirmPassword" name="confirmPassword" type="password" placeholder="Confirm new password" value={passwordData.confirmPassword} onChange={handlePasswordChange} /></div>
            <div className="form-actions"><button type="submit" className="primary-button" disabled={isLoading.profile}>{isLoading.profile ? 'Changing...' : 'Change Password'}</button></div>
        </form>
      </div>
    </div>
  );
};

const AddressesSection = () => {
  const { 
    addresses, 
    handleAddAddressClick, 
    handleEditAddressClick,
    handleDeleteAddress, 
    handleSetDefaultAddress, 
    isLoading, 
    error 
  } = useDashboard();

  if (isLoading.addresses && (!addresses || addresses.length === 0)) {
    return <p>Loading addresses...</p>;
  }

  if (error.addresses && (!addresses || addresses.length === 0)) {
    return <p>Error loading addresses: {error.addresses}</p>;
  }
  return (
    <div className="addresses-section">
      <h2>Delivery Strongholds</h2>
      <button 
        className="primary-button add-address" 
        onClick={handleAddAddressClick} 
        style={{ marginBottom: '20px' }} 
        disabled={isLoading.addresses} 
      >
        {isLoading.addresses ? "Processing..." : "Add New Address"}
      </button>

      {error.addresses && addresses && addresses.length > 0 && (
        <p className="error-message" style={{color: 'red', marginBottom: '15px'}}>Error with address operation: {error.addresses}</p>
      )}

      {!isLoading.addresses && (!addresses || addresses.length === 0) && (
        <p>No addresses saved. Add one to get started!</p>
      )}

      <div className="addresses-container">
        {addresses && addresses.length > 0 && addresses.map((address) => (
          <div key={address.AddressID} className={`address-card ${address.IsDefault ? 'default-address' : ''}`} tabIndex="0">
            {address.IsDefault && <div className="default-badge">Default</div>}
            <h3>{address.Nickname || `Address`}</h3>
            <div className="address-details">
              <p><strong>Recipient:</strong> {address.RecipientName}</p>
              <p>{address.Line1}</p>
              {address.Line2 && <p>{address.Line2}</p>}
              <p>{address.City}, {address.Region && `${address.Region}, `}{address.PostalCode}</p>
              <p>{address.Country}</p>
              <p><strong>Phone:</strong> {address.ContactPhone}</p>
            </div>
            <div className="address-actions">
              <button className="secondary-button" onClick={() => handleEditAddressClick(address)} disabled={isLoading.addresses}>Edit</button>
              <button className="secondary-button delete-btn" onClick={() => handleDeleteAddress(address.AddressID)} disabled={isLoading.addresses}>Delete</button>
              {!address.IsDefault && (
                <button className="secondary-button" onClick={() => handleSetDefaultAddress(address.AddressID)} disabled={isLoading.addresses}>Set as Default</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Dashboard = () => {
  return ( <DashboardProvider><DashboardContent /></DashboardProvider> );
};

export default Dashboard;