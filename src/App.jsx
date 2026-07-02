import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import ComparePage from './pages/ComparePage';
import Cart from './pages/Cart';

export default function App() {
  // Initialize state from local storage or empty array
  // Cart stores objects { sku, qty } for exact variant tracking
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('instalszop_cart');
    if (!savedCart) return [];
    try {
      const parsed = JSON.parse(savedCart);
      return parsed.map(item => {
        if (typeof item === 'string') return { sku: item, qty: 1 };
        if (item && typeof item === 'object' && item.sku) return item;
        return null;
      }).filter(Boolean);
    } catch (e) {
      return [];
    }
  });

  // Compare continues to store base product ID integers
  const [compare, setCompare] = useState(() => {
    const savedCompare = localStorage.getItem('instalszop_compare');
    return savedCompare ? JSON.parse(savedCompare) : [];
  });

  // Sync cart to local storage
  useEffect(() => {
    localStorage.setItem('instalszop_cart', JSON.stringify(cart));
  }, [cart]);

  // Sync compare to local storage
  useEffect(() => {
    localStorage.setItem('instalszop_compare', JSON.stringify(compare));
  }, [compare]);

  // Add SKU to cart with quantity tracking
  const addToCart = (sku) => {
    if (!sku || typeof sku !== 'string') return;
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.sku === sku);
      if (existing) {
        return prevCart.map((item) => 
          item.sku === sku ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prevCart, { sku, qty: 1 }];
    });
  };

  // Remove SKU from cart entirely
  const removeFromCart = (sku) => {
    if (!sku || typeof sku !== 'string') return;
    setCart((prevCart) => prevCart.filter((item) => item.sku !== sku));
  };

  // Update SKU quantity in cart
  const updateQty = (sku, delta) => {
    if (!sku || typeof sku !== 'string') return;
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.sku === sku) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : item;
        }
        return item;
      })
    );
  };

  // Clear shopping cart on checkout completion
  const clearCart = () => {
    setCart([]);
  };

  // Toggle base product ID in comparison list
  const toggleCompare = (productId) => {
    if (!productId || typeof productId !== 'number') return;
    setCompare((prevCompare) => {
      if (prevCompare.includes(productId)) {
        return prevCompare.filter((id) => id !== productId);
      }
      return [...prevCompare, productId];
    });
  };

  return (
    <Router>
      <div className="app-container">
        <Header cart={cart} compare={compare} />
        
        <main className="container">
          <Routes>
            <Route 
              path="/" 
              element={
                <Home 
                  cart={cart} 
                  addToCart={addToCart} 
                  removeFromCart={removeFromCart} 
                  compare={compare} 
                  toggleCompare={toggleCompare} 
                />
              } 
            />
            <Route 
              path="/product/:slug" 
              element={
                <ProductDetail 
                  cart={cart} 
                  addToCart={addToCart} 
                  removeFromCart={removeFromCart} 
                  compare={compare} 
                  toggleCompare={toggleCompare} 
                />
              } 
            />
            <Route 
              path="/compare" 
              element={
                <ComparePage 
                  compare={compare} 
                  toggleCompare={toggleCompare} 
                  addToCart={addToCart} 
                  cart={cart}
                />
              } 
            />
            <Route 
              path="/cart" 
              element={
                <Cart 
                  cart={cart} 
                  removeFromCart={removeFromCart} 
                  updateQty={updateQty} 
                  clearCart={clearCart}
                />
              } 
            />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}
