import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Import local JSON databases to perform frontend data joins
import products from '../../db/products.json';
import producers from '../../db/producers.json';

/**
 * Compare Page Component
 * Renders a side-by-side comparison table/matrix of selected items.
 * Supports active variant selection dropdowns tracking performance metrics.
 * 
 * Props accepted:
 * - compare: Array of numeric product IDs currently marked for comparison.
 * - cart: Array of SKU strings currently in the cart.
 * - addToCart: Handler to add a variant SKU to the cart.
 * - toggleCompare: Handler to toggle/remove a product ID from comparison.
 */
export default function ComparePage({ compare = [], cart = [], addToCart, toggleCompare }) {
  
  // Local state tracking selected variant SKU per base product ID (e.g. { [productId]: selectedSku })
  const [selectedVariants, setSelectedVariants] = useState({});

  // Empty State Check: Redirect user if no products are in the comparison state
  if (compare.length === 0) {
    return (
      <div className="compare-empty">
        <span className="compare-empty__icon">⚖️</span>
        <h2 className="compare-empty__title">Brak produktów w porównywarce</h2>
        <p className="compare-empty__text">Wróć na stronę główną, aby wybrać produkty do porównania.</p>
        <Link to="/" className="compare-empty__btn">Przejdź do sklepu</Link>
      </div>
    );
  }

  /**
   * Helper function to match a product's producerId to its corresponding brand name
   * @param {number} producerId - The ID of the manufacturer
   * @returns {string} The brand name or a fallback string
   */
  const getProducerName = (producerId) => {
    // 1-2 basic sanity checks
    if (!producerId || typeof producerId !== 'number') return 'Nieznany producent';
    const brand = producers.find(p => p.id === producerId);
    return brand ? brand.name : 'Inny producent';
  };

  // Perform a frontend JOIN: Filter the full products array to only those present in the compare ID list
  const resolvedProducts = products.filter(p => compare.includes(p.id));

  return (
    <div className="compare-page-content">
      <div className="section-header">
        <h2 className="section-title">Porównywarka Produktów ({resolvedProducts.length})</h2>
        <Link to="/" className="section-link">Dodaj kolejne &rarr;</Link>
      </div>

      {/* Comparison Grid Matrix */}
      {/* Adapts columns dynamically based on the number of resolved products in state */}
      <div className="compare-matrix" style={{ '--compare-cols': resolvedProducts.length }}>
        {resolvedProducts.map((product) => {
          // Retrieve selected variant SKU or default to first variant in database
          const activeSku = selectedVariants[product.id] || product.variants[0]?.sku || '';
          const activeVariant = product.variants.find(v => v.sku === activeSku) || product.variants[0];
          
          const isInCart = cart.some(item => item.sku === activeVariant.sku);

          return (
            <div key={product.id} className="compare-column">
              
              {/* TOP ROW: Image & Eviction Trigger */}
              <div className="compare-row compare-row--header">
                <button 
                  onClick={() => toggleCompare(product.id)}
                  className="compare-column__remove-btn"
                  title="Usuń z porównania"
                >
                  ✕ Usuń
                </button>
                <div className="compare-column__img-wrapper">
                  {product.mainImage ? (
                    <img src={product.mainImage} alt={product.name} className="compare-column__img" />
                  ) : (
                    <span className="compare-column__placeholder-icon">🌀</span>
                  )}
                </div>
              </div>

              {/* METADATA ROWS */}
              <div className="compare-row compare-row--brand">
                <span className="compare-label">Producent</span>
                <strong className="compare-value">{getProducerName(product.producerId)}</strong>
              </div>

              <div className="compare-row compare-row--title">
                <span className="compare-label">Nazwa bazowa</span>
                <span className="compare-value">{product.name}</span>
              </div>

              {/* VARIANT CONFIG SELECTOR DROPDOWN */}
              {/* Maps variants list to selectable options updates columns content dynamically on change */}
              <div className="compare-row compare-row--variant">
                <span className="compare-label">Wybór wariantu (Model)</span>
                <select 
                  value={activeSku} 
                  onChange={(e) => setSelectedVariants({
                    ...selectedVariants,
                    [product.id]: e.target.value
                  })}
                  className="compare-variant-select"
                >
                  {product.variants.map((v) => (
                    <option key={v.sku} value={v.sku}>
                      {v.sku} (Ø {v.srednica} mm)
                    </option>
                  ))}
                </select>
              </div>

              {/* FINANCIALS & UTILITY ROW */}
              <div className="compare-row compare-row--price">
                <span className="compare-label">Cena netto</span>
                <span className="compare-value compare-value--price">{activeVariant.price} zł <span className="price-netto">netto</span></span>
              </div>

              {/* TECHNICAL PARAMETERS ROWS (Wydajność, Moc, Głośność) */}
              <div className="compare-row compare-row--spec">
                <span className="compare-label">Wydajność</span>
                <span className="compare-value">{activeVariant.specs?.wydajnosc || 'N/A'}</span>
              </div>

              <div className="compare-row compare-row--spec">
                <span className="compare-label">Moc silnika</span>
                <span className="compare-value">{activeVariant.specs?.moc || 'N/A'}</span>
              </div>

              <div className="compare-row compare-row--spec">
                <span className="compare-label">Poziom hałasu</span>
                <span className="compare-value">{activeVariant.specs?.glosnosc || 'N/A'}</span>
              </div>

              <div className="compare-row compare-row--action">
                <button 
                  onClick={() => addToCart(activeVariant.sku)}
                  className={`compare-column__cart-btn ${isInCart ? 'active' : ''}`}
                  disabled={isInCart}
                >
                  {isInCart ? '✓ W koszyku' : '🛒 Do koszyka'}
                </button>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
