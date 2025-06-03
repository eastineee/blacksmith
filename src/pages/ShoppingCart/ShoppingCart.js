import React, { useMemo, useState, useEffect, useCallback } from 'react';
import './ShoppingCart.css'; 
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../data/CartProvider';
import { productImages } from '../../utils/productImages';

export default function ShoppingCart() {
  const { 
    cartItems, 
    cartTotal,
    itemCount,
    handleQuantityChange, 
    handleRemoveItem, 
    handleAddToCart 
  } = useCart();

  const navigate = useNavigate();

  const [allProducts, setAllProducts] = useState([]);
  const [recommendedItems, setRecommendedItems] = useState([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(true);
  const [errorRecs, setErrorRecs] = useState(null);

  // Fetch all products for recommendations
  useEffect(() => {
    const fetchAllProducts = async () => {
      setIsLoadingRecs(true);
      setErrorRecs(null);
      try {
        const apiUrl = `/api/products`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAllProducts(data);
      } catch (err) {
        console.error("ShoppingCart: Failed to fetch all products for recommendations:", err);
        setErrorRecs(err.message || "Could not load recommendations.");
      } finally {
        setIsLoadingRecs(false);
      }
    };
    fetchAllProducts();
  }, []);

  // Select random recommended items once allProducts are fetched
  useEffect(() => {
    if (allProducts.length > 0) {
      const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
      const currentCartProductIds = cartItems.map(item => item.id); // item.id here is ProductID
      const potentialRecs = shuffled.filter(p => !currentCartProductIds.includes(p.ProductID));
      const selected = potentialRecs.slice(0, 4); 

      const itemsWithCorrectImages = selected.map(prod => ({
        ...prod, // Spread all properties from the fetched product
        id: prod.ProductID,
        image: productImages[prod.ImagePath] || productImages['default_placeholder.png']
      }));
      setRecommendedItems(itemsWithCorrectImages);
    }
  }, [allProducts, cartItems]); 
  
  const subtotal = useMemo(() => (
    cartItems.reduce((total, item) => total + ((Number(item.price) || 0) * (item.quantity || 0)), 0)
  ), [cartItems]);

  const shipping = cartItems.length > 0 ? 100.00 : 0; // Example shipping
  const tax = 0;    // Example tax

  return (
    <div className="shopping-cart-container">
      <header className="cart-header">
        <h1>Your Shopping Cart</h1>
       
      </header>
      
      <div className="main-container">
        <div className="cart-layout">
          <div className="cart-items-section">
            {cartItems.length === 0 ? (
              <p className="empty-cart-message">Your cart is currently empty. <Link to="/product">Continue Shopping</Link></p>
            ) : (
              cartItems.map(item => (
                <CartItem 
                  key={`${item.id}-${item.rushOrder || false}`} 
                  item={item}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemoveItem}
                />
              ))
            )}
          </div>
          
          {cartItems.length > 0 && (
            <OrderSummary 
              subtotal={subtotal} 
              shipping={shipping}
              tax={tax}
              total={cartTotal} 
            />
          )}
        </div>
        
        {isLoadingRecs && <p>Loading recommendations...</p>}
        {errorRecs && <p style={{color: 'red'}}>Error loading recommendations: {errorRecs}</p>}
        {!isLoadingRecs && !errorRecs && recommendedItems.length > 0 && (
          <RecommendedItems 
            items={recommendedItems}
            onAddToCart={handleAddToCart} 
          />
        )}
      </div>
    </div>
  );
}

const CartItem = ({ item, onQuantityChange, onRemove }) => (
  <div className="cart-item">
    <div className="item-image">
      <div className="image-placeholder">
        <img src={item.image || '/placeholder.png'} alt={item.name} style={{ width: '100px', height: '100px', objectFit: 'contain' }} />
      </div>
    </div>
    <div className="item-details">
      <h3>{item.name}</h3>
      <p className="item-description">{item.description}</p>
      {item.rushOrder && <p className="rush-order-tag">Rush Order (+20%)</p>}
      <div className="quantity-control">
        <button className="quantity-btn decrease" onClick={() => onQuantityChange(item.cartItemId || {productId: item.id, rushOrder: item.rushOrder}, -1)} >−</button>
        <span className="quantity-display">{item.quantity}</span>
        <button className="quantity-btn increase" onClick={() => onQuantityChange(item.cartItemId || {productId: item.id, rushOrder: item.rushOrder}, 1)} >+</button>
        <button className="remove-btn" onClick={() => onRemove(item.cartItemId || {productId: item.id, rushOrder: item.rushOrder})}>Remove</button>
      </div>
    </div>
    <div className="item-price">
      ₱{(item.totalPrice || 0).toFixed(2)}
    </div>
  </div>
);

const OrderSummary = ({ subtotal, shipping, tax, total }) => {
  const navigate = useNavigate();
  return (
    <div className="summary-section">
      <div className="summary-container">
        <h2 className="summary-title">Order Summary</h2>
        <div className="summary-details">
          <div className="summary-row"><span>Subtotal</span><span>₱{subtotal.toFixed(2)}</span></div>
          <div className="summary-row"><span>Estimated Shipping</span><span>₱{shipping.toFixed(2)}</span></div>
          <div className="summary-row"><span>Tax</span><span>₱{tax.toFixed(2)}</span></div>
          <div className="summary-divider"></div>
          <div className="summary-row total"><span>Total</span><span>₱{total.toFixed(2)}</span></div>
        </div>
        <button className="checkout-btn">
          <Link to="/checkout">Proceed to Checkout</Link>
        </button>
        <button className="continue-btn" onClick={() => navigate('/product')}>
          Continue Shopping
        </button>
      </div>
    </div>
  );
};

const RecommendedItems = ({ items, onAddToCart }) => (
  <div className="recommended-section">
    <h2 className="recommended-title">You Might Also Like</h2>
    <div className="recommended-grid">
      {items.map(item => (
        <div key={item.ProductID || item.id} className="recommended-item">
          <div className="recommended-image">
            <img src={item.image} alt={item.Name || item.name} style={{ width: '100px', height: '100px', objectFit: 'contain' }} />
          </div>
          <div className="recommended-details">
            <h3>{item.Name || item.name}</h3>
            <p className="recommended-price">₱{(Number(item.Price || item.price || 0)).toFixed(2)}</p>
            <button 
              className="add-to-cart-btn"
              onClick={() => onAddToCart({
                  id: item.ProductID || item.id, 
                  name: item.Name || item.name,
                  price: item.Price || item.price, // Unit price
                  quantity: 1, 
                  image: item.image, // This is the mapped image variable
                  description: item.Description || item.description,
                  rushOrder: false, // Default for recommended items
                  // Pass other original product fields if CartProvider needs them when adding to cart
                  ItemType: item.ItemType,
                  Material: item.Material,
                  Stock: item.Stock,
                  Rating: item.Rating,
                  CraftedBy: item.CraftedBy,
                  ImagePath: item.ImagePath // Original filename
              })}
            >
              <span className="icon-bag">🛍️</span> Add to Cart
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);
