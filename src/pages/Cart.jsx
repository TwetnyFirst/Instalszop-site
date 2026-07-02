import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import products from '../../db/products.json';
import producers from '../../db/producers.json';

/**
 * Shopping Cart Page Component
 * Allows users to review selected items, manage quantities, choose shipping & payment options,
 * fill in delivery details, and submit a checkout order.
 * 
 * Props:
 * - cart: Array of { sku, qty } objects
 * - removeFromCart: Function to remove a variant SKU from the cart
 * - updateQty: Function to adjust quantity by delta (+1 or -1)
 * - clearCart: Function to empty the cart after a successful checkout
 */
export default function Cart({ cart = [], removeFromCart, updateQty, clearCart }) {
  // Shipping options
  const shippingMethods = [
    { id: 'dpd', name: 'Kurier DPD', price: 15.00, desc: 'Dostawa kurierska pod wskazany adres' },
    { id: 'inpost', name: 'InPost Paczkomaty', price: 12.00, desc: 'Odbiór w wybranym Paczkomacie 24/7' },
    { id: 'odbior', name: 'Odbiór osobisty', price: 0.00, desc: 'Odbierz w naszym punkcie stacjonarnym' },
  ];

  // Payment methods
  const paymentMethods = [
    { id: 'blik', name: 'BLIK', desc: 'Szybka płatność kodem mobilnym' },
    { id: 'przelewy24', name: 'Przelewy24', desc: 'Przelew natychmiastowy lub karta płatnicza' },
    { id: 'przelew', name: 'Przelew tradycyjny', desc: 'Standardowy przelew na konto bankowe' },
  ];

  // Selected configurations state
  const [selectedShipping, setSelectedShipping] = useState('dpd');
  const [selectedPayment, setSelectedPayment] = useState('blik');

  // Checkout form details state
  const [formData, setFormData] = useState({
    name: '',
    street: '',
    zip: '',
    city: '',
    email: '',
    phone: '',
    paczkomatId: '', // Optional: InPost Paczkomat code
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [orderSummary, setOrderSummary] = useState(null);

  /**
   * Helper: Find base product and specific variant based on variant SKU
   */
  const getProductBySku = (sku) => {
    if (!sku || typeof sku !== 'string') return null;
    for (const product of products) {
      const variant = product.variants.find((v) => v.sku === sku);
      if (variant) {
        return { product, variant };
      }
    }
    return null;
  };

  /**
   * Helper: Resolve manufacturer name from database using ID
   */
  const getProducerName = (producerId) => {
    if (!producerId || typeof producerId !== 'number') return 'Inny';
    const brand = producers.find((p) => p.id === producerId);
    return brand ? brand.name : 'Inny';
  };

  // Build list of resolved items currently in the cart
  const resolvedItems = cart
    .map((item) => {
      const resolved = getProductBySku(item.sku);
      if (!resolved) return null;
      return {
        ...resolved,
        qty: item.qty,
      };
    })
    .filter(Boolean);

  // Calculate costs
  const productsSubtotal = resolvedItems.reduce((sum, item) => sum + (item.variant.price * item.qty), 0);
  const selectedShippingPrice = shippingMethods.find((m) => m.id === selectedShipping)?.price || 0;
  
  // Free delivery over 500 zł
  const finalShippingPrice = productsSubtotal >= 500 ? 0 : selectedShippingPrice;
  const grandTotal = productsSubtotal + finalShippingPrice;

  // Handle form changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Validate form and submit order
  const handleCheckout = (e) => {
    e.preventDefault();

    if (resolvedItems.length === 0) return;

    // Validate fields
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Wymagane imię i nazwisko';
    if (!formData.street.trim() && selectedShipping !== 'odbior') errors.street = 'Wymagany adres dostawy';
    if (!formData.zip.trim() && selectedShipping !== 'odbior') errors.zip = 'Wymagany kod pocztowy';
    if (!formData.city.trim() && selectedShipping !== 'odbior') errors.city = 'Wymagane miasto';
    if (!formData.email.trim() || !formData.email.includes('@')) errors.email = 'Wprowadź prawidłowy e-mail';
    if (!formData.phone.trim()) errors.phone = 'Wymagany numer telefonu';
    if (selectedShipping === 'inpost' && !formData.paczkomatId.trim()) errors.paczkomatId = 'Wymagany kod paczkomatu (np. WAW01M)';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Capture order data for the confirmation screen
    const shippingMethodName = shippingMethods.find((m) => m.id === selectedShipping)?.name;
    const paymentMethodName = paymentMethods.find((m) => m.id === selectedPayment)?.name;

    setOrderSummary({
      items: resolvedItems,
      totals: {
        subtotal: productsSubtotal,
        shipping: finalShippingPrice,
        total: grandTotal,
      },
      shipping: shippingMethodName,
      payment: paymentMethodName,
      customer: { ...formData },
      orderNumber: `IS-${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toLocaleDateString('pl-PL'),
    });

    // Reset local state and clear global cart state
    setIsSubmitted(true);
    clearCart();
  };

  // Success view
  if (isSubmitted && orderSummary) {
    return (
      <div className="checkout-success">
        <div className="checkout-success__card">
          <div className="checkout-success__icon">✓</div>
          <h2 className="checkout-success__title">Dziękujemy za zamówienie!</h2>
          <p className="checkout-success__subtitle">
            Twoje zamówienie <strong>{orderSummary.orderNumber}</strong> zostało pomyślnie złożone.
          </p>

          <div className="checkout-success__details">
            <h3 className="details-title">Szczegóły zamówienia ({orderSummary.date}):</h3>
            <ul className="details-list">
              <li><strong>Dostawa:</strong> {orderSummary.shipping} {orderSummary.totals.shipping === 0 ? '(Darmowa)' : `(${orderSummary.totals.shipping.toFixed(2)} zł)`}</li>
              <li><strong>Płatność:</strong> {orderSummary.payment}</li>
              {orderSummary.customer.paczkomatId && (
                <li><strong>Kod Paczkomatu:</strong> {orderSummary.customer.paczkomatId}</li>
              )}
              {orderSummary.customer.street && (
                <li><strong>Adres dostawy:</strong> {orderSummary.customer.street}, {orderSummary.customer.zip} {orderSummary.customer.city}</li>
              )}
              <li><strong>Odbiorca:</strong> {orderSummary.customer.name} (tel. {orderSummary.customer.phone}, e-mail: {orderSummary.customer.email})</li>
            </ul>

            <h3 className="details-title mt-4">Kupione produkty:</h3>
            <table className="checkout-success__products-table">
              <thead>
                <tr>
                  <th>Nazwa</th>
                  <th>Ilość</th>
                  <th>Cena</th>
                </tr>
              </thead>
              <tbody>
                {orderSummary.items.map((item) => (
                  <tr key={item.variant.sku}>
                    <td>{item.product.name} ({item.variant.sku})</td>
                    <td>{item.qty} szt.</td>
                    <td>{(item.variant.price * item.qty).toFixed(2)} zł</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="checkout-success__total-price">
              Razem zapłacono: <strong>{orderSummary.totals.total.toFixed(2)} zł brutto</strong>
            </div>
          </div>

          <div className="checkout-success__actions">
            <Link to="/" className="btn-primary">Wróć do sklepu</Link>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart view
  if (resolvedItems.length === 0) {
    return (
      <div className="cart-empty">
        <span className="cart-empty__icon">🛒</span>
        <h2 className="cart-empty__title">Twój koszyk jest pusty</h2>
        <p className="cart-empty__text">Nie dodałeś jeszcze żadnego produktu do koszyka.</p>
        <Link to="/" className="btn-primary">Przejdź do sklepu</Link>
      </div>
    );
  }

  return (
    <div className="cart-page-wrapper">
      <div className="section-header">
        <h2 className="section-title">Koszyk Zakupowy ({resolvedItems.length} pozycji)</h2>
      </div>

      <div className="cart-grid">
        {/* Left Column: Products List & Delivery Options */}
        <div className="cart-main-column">
          
          {/* Products List Block */}
          <div className="cart-card cart-products-block">
            <h3 className="cart-card__title">Wybrane produkty</h3>
            <div className="cart-products-list">
              {resolvedItems.map((item) => (
                <div key={item.variant.sku} className="cart-product-item">
                  <div className="product-thumb">
                    {item.product.mainImage ? (
                      <img src={item.product.mainImage} alt={item.product.name} className="product-thumb-img" />
                    ) : (
                      <span>🌀</span>
                    )}
                  </div>
                  <div className="product-details">
                    <span className="product-brand">{getProducerName(item.product.producerId)}</span>
                    <h4 className="product-title">
                      <Link to={`/product/${item.product.slug}`}>{item.product.name}</Link>
                    </h4>
                    <span className="product-sku">SKU: {item.variant.sku} (Ø {item.variant.srednica} mm)</span>
                  </div>
                  <div className="product-qty-control">
                    <button 
                      onClick={() => updateQty(item.variant.sku, -1)}
                      className="qty-btn"
                      disabled={item.qty <= 1}
                    >
                      -
                    </button>
                    <span className="qty-value">{item.qty}</span>
                    <button 
                      onClick={() => updateQty(item.variant.sku, 1)}
                      className="qty-btn"
                    >
                      +
                    </button>
                  </div>
                  <div className="product-price-block">
                    <span className="product-total-price">{(item.variant.price * item.qty).toFixed(2)} zł</span>
                    <span className="product-unit-price">{item.variant.price.toFixed(2)} zł / szt.</span>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.variant.sku)}
                    className="product-remove-btn"
                    title="Usuń z koszyka"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Payment Selection Block */}
          <div className="cart-card cart-shipping-payment">
            <div className="shipping-payment-grid">
              
              {/* Shipping Section */}
              <div className="shipping-section">
                <h3 className="cart-card__title">1. Sposób dostawy</h3>
                <div className="options-group">
                  {shippingMethods.map((method) => {
                    const priceText = method.price === 0 ? 'Bezpłatnie' : `${method.price.toFixed(2)} zł`;
                    const finalPriceText = productsSubtotal >= 500 ? 'Bezpłatnie (Promocja)' : priceText;
                    return (
                      <label key={method.id} className={`option-label ${selectedShipping === method.id ? 'active' : ''}`}>
                        <input 
                          type="radio" 
                          name="shippingMethod" 
                          value={method.id}
                          checked={selectedShipping === method.id}
                          onChange={() => setSelectedShipping(method.id)}
                        />
                        <div className="option-info">
                          <span className="option-name">{method.name}</span>
                          <span className="option-desc">{method.desc}</span>
                        </div>
                        <span className="option-price">{finalPriceText}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Payment Section */}
              <div className="payment-section">
                <h3 className="cart-card__title">2. Metoda płatności</h3>
                <div className="options-group">
                  {paymentMethods.map((method) => (
                    <label key={method.id} className={`option-label ${selectedPayment === method.id ? 'active' : ''}`}>
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value={method.id}
                        checked={selectedPayment === method.id}
                        onChange={() => setSelectedPayment(method.id)}
                      />
                      <div className="option-info">
                        <span className="option-name">{method.name}</span>
                        <span className="option-desc">{method.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Column: Address Form & Price Summary */}
        <div className="cart-sidebar-column">
          
          {/* Address Form Block */}
          <div className="cart-card checkout-form-block">
            <h3 className="cart-card__title">3. Dane do wysyłki</h3>
            <form onSubmit={handleCheckout} className="checkout-form">
              <div className="form-group">
                <label htmlFor="name">Imię i nazwisko / Firma</label>
                <input 
                  type="text" 
                  id="name"
                  name="name" 
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="np. Jan Kowalski"
                  className={formErrors.name ? 'input-error' : ''}
                />
                {formErrors.name && <span className="error-text">{formErrors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Adres e-mail</label>
                <input 
                  type="email" 
                  id="email"
                  name="email" 
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="np. jan.kowalski@gmail.com"
                  className={formErrors.email ? 'input-error' : ''}
                />
                {formErrors.email && <span className="error-text">{formErrors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Numer telefonu</label>
                <input 
                  type="tel" 
                  id="phone"
                  name="phone" 
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="np. +48 500 600 700"
                  className={formErrors.phone ? 'input-error' : ''}
                />
                {formErrors.phone && <span className="error-text">{formErrors.phone}</span>}
              </div>

              {selectedShipping === 'inpost' && (
                <div className="form-group animate-fade-in">
                  <label htmlFor="paczkomatId">Kod paczkomatu InPost</label>
                  <input 
                    type="text" 
                    id="paczkomatId"
                    name="paczkomatId" 
                    value={formData.paczkomatId}
                    onChange={handleInputChange}
                    placeholder="np. KRA01M, WAW12A"
                    className={formErrors.paczkomatId ? 'input-error' : ''}
                  />
                  {formErrors.paczkomatId && <span className="error-text">{formErrors.paczkomatId}</span>}
                </div>
              )}

              {selectedShipping !== 'odbior' && (
                <>
                  <div className="form-group">
                    <label htmlFor="street">Ulica i numer budynku</label>
                    <input 
                      type="text" 
                      id="street"
                      name="street" 
                      value={formData.street}
                      onChange={handleInputChange}
                      placeholder="np. Marszałkowska 10/2"
                      className={formErrors.street ? 'input-error' : ''}
                    />
                    {formErrors.street && <span className="error-text">{formErrors.street}</span>}
                  </div>

                  <div className="form-row">
                    <div className="form-group col-4">
                      <label htmlFor="zip">Kod pocztowy</label>
                      <input 
                        type="text" 
                        id="zip"
                        name="zip" 
                        value={formData.zip}
                        onChange={handleInputChange}
                        placeholder="00-001"
                        className={formErrors.zip ? 'input-error' : ''}
                      />
                      {formErrors.zip && <span className="error-text">{formErrors.zip}</span>}
                    </div>

                    <div className="form-group col-8">
                      <label htmlFor="city">Miasto</label>
                      <input 
                        type="text" 
                        id="city"
                        name="city" 
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="np. Warszawa"
                        className={formErrors.city ? 'input-error' : ''}
                      />
                      {formErrors.city && <span className="error-text">{formErrors.city}</span>}
                    </div>
                  </div>
                </>
              )}
            </form>
          </div>

          {/* Pricing Summary Block */}
          <div className="cart-card summary-block">
            <h3 className="cart-card__title">Podsumowanie zamówienia</h3>
            
            <div className="summary-lines">
              <div className="summary-line">
                <span>Wartość koszyka</span>
                <span>{productsSubtotal.toFixed(2)} zł</span>
              </div>
              <div className="summary-line">
                <span>Koszt dostawy</span>
                <span>
                  {productsSubtotal >= 500 ? (
                    <>
                      <span className="line-through-text mr-2">{(selectedShippingPrice).toFixed(2)} zł</span>
                      <strong className="text-green-success">Gratis!</strong>
                    </>
                  ) : (
                    `${selectedShippingPrice.toFixed(2)} zł`
                  )}
                </span>
              </div>
              
              {productsSubtotal < 500 && (
                <div className="summary-alert-promo">
                  Dodaj produkty za <strong>{(500 - productsSubtotal).toFixed(2)} zł</strong>, aby otrzymać <strong>darmową dostawę!</strong>
                </div>
              )}

              <div className="summary-line summary-line--total">
                <span>Razem do zapłaty</span>
                <span>{grandTotal.toFixed(2)} zł</span>
              </div>
            </div>

            <button 
              onClick={handleCheckout}
              className="checkout-btn btn-primary"
            >
              Kupuję i płacę ({grandTotal.toFixed(2)} zł)
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
