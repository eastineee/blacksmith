import React, { useEffect, useState } from 'react'; 
import './ot.css'; 
import { useNavigate, useLocation, Link } from 'react-router-dom'; 
import { useAuth } from '../../data/AuthProvider'; 

const TrackOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoadingAuth } = useAuth(); // Get user details from AuthContext

  // State to hold order details, including what's passed via navigation
  const [orderDetails, setOrderDetails] = useState({
    orderId: 'N/A',
    recipientName: 'Loading...',
    recipientEmail: 'Loading...'
  });

  const [currentStatus, setCurrentStatus] = useState('sorting'); 
  
  const deliveryLogEntries = [
    { time: '18 Apr 2025 | 10:10 AM', location: '[Parañaque DC]', message: 'Your order has been picked up from our forge', status: 'picked'},
    { time: '18 Apr 2025 – 10:10 AM', location: '[Parañaque DC]', message: 'Package picked up by our dwarven couriers', status: 'picked'},
    { time: '18 Apr 2025 – 08:45 AM', location: '[Blacksmiths Workshop]', message: 'Item quenched and packaged', status: 'created'},
    { time: '17 Apr 2025 – 03:20 PM', location: '[Blacksmiths Workshop]', message: 'Steel passed the hammer test', status: 'created'},
    { time: '17 Apr 2025 – 09:00 AM', location: '[Blacksmiths Workshop]', message: 'Production completed', status: 'created'},
    { time: '16 Apr 2025 – 01:10 PM', location: null, message: 'Order confirmed with blood seal', status: 'created'},
  ];


  useEffect(() => {
    if (!isLoadingAuth) {
      if (!isAuthenticated) {
        // If user is not authenticated, redirect to login, optionally passing intended destination
        navigate('/login', { state: { from: location, message: "Please login to track your order." } });
        return;
      }

      // Get orderId from navigation state passed by OrderConfirmation.js
      const passedOrderId = location.state?.orderId;

      if (passedOrderId && user) {
        setOrderDetails({
          orderId: passedOrderId,
          recipientName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A',
          recipientEmail: user.email || user.userEmail || 'N/A' // Handle variations in email field name
        });
      } else if (!passedOrderId) {
        console.warn("TrackOrder: No orderId received in location state.");
        setOrderDetails(prev => ({ ...prev, orderId: "Not Provided", recipientName: "N/A", recipientEmail: "N/A" }));
      }
    }
  }, [location.state, user, isAuthenticated, isLoadingAuth, navigate]);

  const handleBack = () => {
    // Navigate back to order confirmation if orderId is known, otherwise to products or home
    if (orderDetails.orderId && orderDetails.orderId !== 'N/A' && orderDetails.orderId !== 'Not Provided') {
      navigate('/orderconfirm', { state: { orderData: { orderId: orderDetails.orderId } } }); // Pass back minimal state
    } else {
      navigate('/products'); // Fallback navigation
    }
  };

  const statusLevels = ['created', 'picked', 'sorting', 'delivery', 'delivered'];
  const currentStatusIndex = statusLevels.indexOf(currentStatus);

  const statusIcons = {
    created: '⚒️',
    picked: '📦',
    sorting: '🔍',
    delivery: '🏍️',
    delivered: '✅'
  };

  if (isLoadingAuth) {
    return <div className="track-order-container"><div className="track-order-content"><p>Loading authentication...</p></div></div>;
  }
  

  if (!isAuthenticated) {
     return (
        <div className="track-order-container">
            <div className="track-order-content">
                <p>You need to be logged in to track an order.</p>
                <Link to="/login">Go to Login</Link>
            </div>
        </div>
     );
  }


  return (
    <div className="track-order-container">
      <div className="track-order-content">
        <button className="back-button" onClick={handleBack}>
          ⬅ Back
        </button>

        <h2 className="pixel-title">⚔️ Order Tracking ⚔️</h2>
        
        <div className="status-bar">
          {statusLevels.map((status, index) => (
            <div 
              key={status} 
              className={`step ${index < currentStatusIndex ? 'completed' : ''} ${index === currentStatusIndex ? 'active' : ''}`}
            >
              {statusIcons[status]} {status.charAt(0).toUpperCase() + status.slice(1)}
            </div>
          ))}
        </div>

        <div className="metal-border">
          <div className="order-section">
            <div className="order-info">
              <h3>🔧 Order Information</h3>
              <p><strong>Order Number:</strong> {orderDetails.orderId}</p>
              <p><strong>Recipient Name:</strong> {orderDetails.recipientName}</p>
              <p><strong>Recipient Email:</strong> {orderDetails.recipientEmail}</p>
              <div className="anvil-icon">⚒️</div>
            </div>

            <div className="delivery-status">
              <h3>📜 Delivery Log</h3>
              <ul>
                {deliveryLogEntries
                  .filter(entry => statusLevels.indexOf(entry.status) <= currentStatusIndex) 
                  .map((log, index) => (
                  <li key={index}>
                    <span className="time">{log.time}</span> – 
                    {log.location && <strong> {log.location}</strong>} {log.message}
                  </li>
                ))}
                {currentStatusIndex < statusLevels.length -1 && <li><span className="time">Next update...</span> – Awaiting next scan</li>}
              </ul>
            </div>
          </div>
        </div>
        
        <div className="forge-effects">
          <div className="sparks"></div>
          <div className="sparks"></div>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
