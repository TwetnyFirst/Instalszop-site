import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import categories from '../../db/categories.json';

/**
 * Global Header Component
 * Overhauled to use clean vector graphics (inline SVGs) instead of emojis.
 * Aligns Logo, Search bar, and utility icons strictly in a single minimalist line.
 * Supports sticky scroll state to toggle compact layout.
 * Supports responsive burger menu navigation on mobile screens.
 * 
 * Props:
 * - cart: Array of SKU strings in the shopping cart.
 * - compare: Array of numeric product IDs selected for comparison.
 */
export default function Header({ cart = [], compare = [] }) {
  // Local state to track the active hovered master category ID
  const [activeMenu, setActiveMenu] = useState(null);

  // Track scrolled state for compact header transition
  const [isScrolled, setIsScrolled] = useState(false);

  // Track mobile navigation burger open state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 120) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close mobile menu on page transition
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [window.location.search, window.location.pathname]);

  // Dynamic lookup for top-level categories (master categories have parentId === null)
  const masterMenus = categories.filter((c) => c.parentId === null);

  /**
   * Helper: Resolves all subcategories (both active and inactive) for a parent ID from db/categories.json
   * @param {number} parentId - The unique numeric ID of the parent category
   * @returns {Array} List of matching subcategory items from the database
   */
  const getSubcategories = (parentId) => {
    if (!parentId || typeof parentId !== 'number') return [];
    return categories.filter((c) => c.parentId === parentId);
  };

  return (
    <header className={`header ${isScrolled ? 'header--scrolled' : ''}`}>
      
      {/* Main Bar: Logo, Search, Contact, Utilities in a balanced horizontal line */}
      <div className="header__main-bar">
        <div className="container header__main-container">
          
          {/* 1. Burger Toggle Button for Mobile Screens */}
          <button 
            className="header__burger-toggle" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            <span className={`burger-bar ${isMobileMenuOpen ? 'open' : ''}`}></span>
            <span className={`burger-bar ${isMobileMenuOpen ? 'open' : ''}`}></span>
            <span className={`burger-bar ${isMobileMenuOpen ? 'open' : ''}`}></span>
          </button>

          {/* 2. Brand Logo */}
          <Link to="/" className="header__logo">
            <span className="logo-text">INSTALSZOP</span>
            <span className="logo-subtitle">PROFESJONALNY SKLEP INSTALACYJNY</span>
          </Link>

          {/* 3. Search Bar with vector magnifying glass icon */}
          <form className="header__search-form" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="text" 
              placeholder="Szukaj..." 
              className="header__search-input" 
            />
            <button type="submit" className="header__search-btn">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="search-vector-icon">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </form>

          {/* 4. Contact Info with vector phone icon (Hidden on mobile via CSS) */}
          <div className="header__contact-info">
            <div className="contact-item">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="contact-vector-icon">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <div className="contact-text">
                <span className="contact-phone">+48 111 222 333</span>
                <span className="contact-email">sklep@instalszop.pl</span>
              </div>
            </div>
          </div>

          {/* 5. Utilities Actions (Logowanie, Porównywarka, Koszyk) with vector icons */}
          <div className="header__utilities">
             {/* Logowanie button with vector User icon */}
             <button className="header__utility-btn header__utility-btn--login" title="Logowanie">
               <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="utility-vector-icon">
                 <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                 <circle cx="12" cy="7" r="4"></circle>
               </svg>
             </button>

            {/* Compare Badge with vector bar chart icon */}
            <Link to="/compare" className="header__utility-item">
              <div className="utility-icon-wrapper">
                <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="utility-vector-icon">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
                <span className="utility-badge">{compare.length}</span>
              </div>
            </Link>

            {/* Cart Badge with vector shopping cart icon - Link to cart page */}
            <Link to="/cart" className="header__utility-item header__utility-item--cart">
              <div className="utility-icon-wrapper">
                <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="utility-vector-icon">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <span className="utility-badge">
                  {cart.reduce((sum, item) => sum + item.qty, 0)}
                </span>
              </div>
              <div className="cart-label-wrapper">
                <span className="cart-title">Koszyk</span>
                <span className="cart-status">
                  {cart.length === 0 ? 'Pusty' : `${cart.reduce((sum, item) => sum + item.qty, 0)} szt.`}
                </span>
              </div>
            </Link>
          </div>

        </div>
      </div>

      {/* Navigation Bar with full-width centered list of items */}
      <nav className={`header__nav ${isMobileMenuOpen ? 'header__nav--open' : ''}`}>
        <div className="container header__nav-container">
          <ul className="header__nav-list">
            
            {masterMenus.map((menu) => {
              const subItems = getSubcategories(menu.id);
              const isOpen = activeMenu === menu.id;

              return (
                <li 
                  key={menu.id} 
                  className="header__nav-item"
                  onMouseEnter={() => {
                    if (window.innerWidth > 992) setActiveMenu(menu.id);
                  }}
                  onMouseLeave={() => {
                    if (window.innerWidth > 992) setActiveMenu(null);
                  }}
                  onClick={() => {
                    if (window.innerWidth <= 992) {
                      setActiveMenu(activeMenu === menu.id ? null : menu.id);
                    }
                  }}
                >
                  <Link 
                    to={`/?category=${menu.id}`}
                    className={`header__nav-link ${isOpen ? 'active' : ''}`}
                    onClick={(e) => {
                      if (window.innerWidth <= 992 && subItems.length > 0) {
                        // Prevent navigation if toggling expandable sub-categories on mobile
                        e.preventDefault();
                      } else {
                        setActiveMenu(null);
                        setIsMobileMenuOpen(false);
                      }
                    }}
                  >
                    {menu.name}
                    {window.innerWidth <= 992 && subItems.length > 0 && (
                      <span className="nav-arrow">{isOpen ? ' ▲' : ' ▼'}</span>
                    )}
                  </Link>

                  {/* MEGAMENU DROPDOWN PANEL */}
                  {isOpen && subItems.length > 0 && (
                    <div className="megamenu">
                      <div className="container megamenu__container">
                        
                        {/* Unified Mapping Grid representing all categories inside the menu node */}
                        <div className="megamenu__unified-grid">
                          {subItems.map((sub) => {
                            const isNodeActive = sub.isActive === true;

                            return (
                              <Link 
                                key={sub.id} 
                                to={isNodeActive ? `/?category=${sub.id}` : '#'} 
                                className={`megamenu-card ${isNodeActive ? 'active' : 'inactive'}`}
                                onClick={(e) => {
                                  if (!isNodeActive) {
                                    e.preventDefault();
                                    return;
                                  }
                                  setActiveMenu(null);
                                  setIsMobileMenuOpen(false);
                                }}
                                style={!isNodeActive ? { cursor: 'not-allowed' } : {}}
                              >
                                {/* Graphic content container (Hidden on mobile via CSS for compactness) */}
                                <div className="megamenu-card__img-wrapper">
                                  <span className="megamenu-card__placeholder">
                                    {isNodeActive ? '🖼️' : '🔒'}
                                  </span>
                                </div>

                                {/* Text section with conditional styling and labels */}
                                <div className="megamenu-card__info">
                                  <span 
                                    className="megamenu-card__title"
                                    style={!isNodeActive ? { color: '#c92a2a' } : {}}
                                  >
                                    {sub.name}
                                  </span>
                                  {!isNodeActive && (
                                    <span className="megamenu-card__badge-soon">(Wkrótce)</span>
                                  )}
                                </div>
                              </Link>
                            );
                          })}
                        </div>

                      </div>
                    </div>
                  )}
                </li>
              );
            })}

            {/* Standalone Outlet node */}
            <li className="header__nav-item">
              <Link to="/" className="header__nav-link header__nav-link--outlet" onClick={() => setIsMobileMenuOpen(false)}>
                Outlet
              </Link>
            </li>

          </ul>
        </div>
      </nav>

    </header>
  );
}
