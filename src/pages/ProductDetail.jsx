import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';

// Direct data imports simulating external database records
import categories from '../../db/categories.json';
import producers from '../../db/producers.json';
import products from '../../db/products.json';
import ProductCard from '../components/ProductCard';

/**
 * Product Detail Page Component
 * Renders detail information for a specific product and its variants.
 * Overhauled to incorporate:
 * 1. Compact configuration options in the Buybox.
 * 2. Variant models list moved directly inside the buybox column.
 * 3. Filter buttons filter the list of variants, but selecting a variant does NOT override filter states.
 * 4. "Show more / Expand" toggle button for filter lists with more than 7 choices.
 * 5. Show ALL variants initially when no filters are selected.
 * 6. "Reset filters" button to clear selections back to 'all'.
 * 7. Tabbed detail sections: Parametry, Opis, Wymiary, Dane techniczne, Do pobrania.
 * 8. Responsive filters: pills on Desktop, clean select dropdowns on Mobile.
 */
export default function ProductDetail({ cart = [], addToCart, removeFromCart, compare = [], toggleCompare }) {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // State slice tracking active lower tab ("parametry", "opis", "wymiary", "dane", "pobierz")
  const [activeTab, setActiveTab] = useState('parametry');

  // Resolve the primary product record from products.json using slug
  const product = products.find(p => p.slug === slug);

  // Fallback: If no product matches the parsed slug, show product not found screen
  if (!product) {
    return (
      <div className="product-not-found">
        <h2>Produkt nie został znaleziony</h2>
        <p>Przejdź na stronę główną, aby przenieść się do нашей oferty.</p>
        <Link to="/" className="btn-primary">Wróć do sklepu</Link>
      </div>
    );
  }

  /**
   * Helper function to match a product's producerId to its corresponding brand name
   */
  const getProducerName = (producerId) => {
    if (!producerId || typeof producerId !== 'number') return 'Nieznany producent';
    const brand = producers.find(p => p.id === producerId);
    return brand ? brand.name : 'Inny producent';
  };

  /**
   * Helper function to resolve the category name from categories.json
   */
  const getCategoryName = (categoryId) => {
    if (!categoryId || typeof categoryId !== 'number') return 'Wentylacja';
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : 'Wentylacja';
  };

  /**
   * Dynamic Filter Configurator:
   * Returns parameter configurations based on product name or category properties.
   */
  const getFilterConfig = (prod) => {
    const catName = getCategoryName(prod.categoryId).toLowerCase();
    const prodName = prod.name.toLowerCase();

    if (prodName.includes('kanałowy') || prodName.includes('promieniowy') || catName.includes('kanałowe') || catName.includes('kuchenne')) {
      return {
        param1: { label: 'Średnica przyłącza', key: 'srednica', isSpec: false },
        param2: { label: 'Wydajność', key: 'wydajnosc', isSpec: true }
      };
    }
    if (prodName.includes('łazienkowy') || catName.includes('ścienne') || catName.includes('łazienkowe')) {
      return {
        param1: { label: 'Średnica przyłącza', key: 'srednica', isSpec: false },
        param2: { label: 'Głośność', key: 'glosnosc', isSpec: true }
      };
    }
    return {
      param1: { label: 'Średnica przyłącza', key: 'srednica', isSpec: false },
      param2: { label: 'Cena', key: 'price', isSpec: false, isPrice: true }
    };
  };

  const filterConfig = getFilterConfig(product);

  // Helper: extract digit value from spec strings (e.g. "1600 m3/h" -> 1600)
  const parseNumericValue = (str) => {
    if (!str) return null;
    const match = String(str).match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  };

  // Determine pricing limits and slider limits for parameter 2
  const specNumbers = product.variants.map(v => {
    const val = filterConfig.param2.isSpec ? v.specs?.[filterConfig.param2.key] : String(v.price);
    return parseNumericValue(val);
  }).filter(v => v !== null);

  const absMinSpec = specNumbers.length > 0 ? Math.min(...specNumbers) : 0;
  const absMaxSpec = specNumbers.length > 0 ? Math.max(...specNumbers) : 10000;

  // Filter state values (multiselect arrays)
  const [selectedDiameters, setSelectedDiameters] = useState([]);
  const [selectedSpecs, setSelectedSpecs] = useState([]);
  const [sliderValue, setSliderValue] = useState(absMaxSpec);

  // Filter lists expansion states (collapses options if count > 7)
  const [isFilter1Expanded, setIsFilter1Expanded] = useState(false);
  const [isFilter2Expanded, setIsFilter2Expanded] = useState(false);

  // Reset values when product changes
  useEffect(() => {
    setSelectedDiameters([]);
    setSelectedSpecs([]);
    setSliderValue(absMaxSpec);
    setIsFilter1Expanded(false);
    setIsFilter2Expanded(false);
    setActiveTab('parametry');
  }, [slug, absMaxSpec]);

  // Generate unique values for Filter 1 (Średnica)
  const uniqueValues1 = Array.from(
    new Set(
      product.variants
        .map(v => v.srednica)
        .filter(val => val !== undefined && val !== null)
    )
  ).sort((a, b) => a - b);

  // Generate unique values for Filter 2 (Wydajność, Głośność, or Price)
  const uniqueValues2 = Array.from(
    new Set(
      product.variants
        .map(v => {
          if (filterConfig.param2.isSpec) {
            return v.specs?.[filterConfig.param2.key];
          }
          if (filterConfig.param2.isPrice) {
            return v.price;
          }
          return null;
        }).filter(val => val !== undefined && val !== null && val !== 'N/A')
    )
  ).sort((a, b) => {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    const numA = parseInt(a, 10);
    const numB = parseInt(b, 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return String(a).localeCompare(String(b));
  });

  // Apply limit expansion slices
  const visibleValues1 = isFilter1Expanded ? uniqueValues1 : uniqueValues1.slice(0, 6);
  const visibleValues2 = isFilter2Expanded ? uniqueValues2 : uniqueValues2.slice(0, 6);

  // Determine current active sub-models matching configuration filters
  const filteredVariants = product.variants.filter(v => {
    // Filter 1: Diameter
    if (selectedDiameters.length > 0 && !selectedDiameters.includes(String(v.srednica))) return false;

    // Filter 2: Spec/Price array match
    const specVal = filterConfig.param2.isSpec ? v.specs?.[filterConfig.param2.key] : String(v.price);
    if (selectedSpecs.length > 0 && !selectedSpecs.includes(String(specVal))) return false;

    // Filter 2: Slider range limit
    const numVal = parseNumericValue(specVal);
    if (numVal !== null && numVal > sliderValue) return false;

    return true;
  });

  // Get current active SKU from query parameters or fallback
  const selectedVariantSku = searchParams.get('wersja') || '';
  
  // Verify if currently selected SKU is part of the filtered list
  const isSelectedVariantInFiltered = filteredVariants.some(v => v.sku === selectedVariantSku);
  const activeVariant = isSelectedVariantInFiltered
    ? (product.variants.find(v => v.sku === selectedVariantSku) || product.variants[0])
    : (filteredVariants[0] || product.variants[0]);

  const isInCart = cart.some(item => item.sku === activeVariant.sku);
  const isComparing = compare.includes(product.id);

  const resetFilters = () => {
    setSelectedDiameters([]);
    setSelectedSpecs([]);
    setSliderValue(absMaxSpec);
    setSearchParams({});
  };

  // Determine pricing limits for product cards
  const variantPrices = product.variants.map(v => v.price);
  const minPrice = Math.min(...variantPrices);
  const maxPrice = Math.max(...variantPrices);
  const isSinglePrice = minPrice === maxPrice;

  return (
    <div className="product-detail-container">
      
      {/* Breadcrumbs navigation trail */}
      <div className="breadcrumbs">
        <Link to="/">Sklep</Link> &gt; <Link to={`/?category=${product.categoryId}`}>{getCategoryName(product.categoryId)}</Link> &gt; <strong>{product.name}</strong>
      </div>

      {/* UPPER SECTION: Two-Column Product Presentation */}
      <div className="product-main">
        {/* Column 1: Image Showcase + Video */}
        <div className="product-main__gallery">
          <div className="product-main__img-wrapper">
            {product.mainImage ? (
              <img 
                src={product.mainImage} 
                alt={product.name} 
                className="product-main__img animate-fade-in" 
              />
            ) : (
              <span className="product-main__placeholder-icon">🌀</span>
            )}
          </div>
          
          {/* YouTube Video Integration under the Photo */}
          <div className="product-main__video-container animate-fade-in" style={{ marginTop: '20px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backgroundColor: '#000000', position: 'relative', paddingBottom: '56.25%', height: '0', border: '1px solid var(--border-light)' }}>
            <iframe
              style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', border: '0' }}
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              title="Prezentacja wideo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>

        {/* Column 2: Buybox & Active Variant Configurator */}
        <div className="product-main__buybox">
          <span className="buybox__brand">{getProducerName(product.producerId)}</span>
          <h1 className="buybox__title">{product.name}</h1>
          <span className="buybox__sku">
            {selectedVariantSku ? (
              <>Model SKU: <strong>{activeVariant.sku}</strong></>
            ) : (
              <>Skonfiguruj model wybierając parametry poniżej</>
            )}
          </span>

          {/* Premium configurator pills directly in the buybox (Apple/Dyson style) */}
          <div className="buybox__configurator">
            
            {/* Filter 1 (DESKTOP VERSION): Średnica */}
            <div className="config-group config-group--desktop">
              <span className="config-label">{filterConfig.param1.label}:</span>
              <div className="config-pills">
                {visibleValues1.map(val => {
                  const valStr = String(val);
                  const isActive = selectedDiameters.includes(valStr);
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        setSelectedDiameters(prev => 
                          prev.includes(valStr) ? prev.filter(x => x !== valStr) : [...prev, valStr]
                        );
                      }}
                      className={`config-pill ${isActive ? 'active' : ''}`}
                    >
                      {val} mm
                    </button>
                  );
                })}
                
                {/* Expand toggle trigger if diameter choices > 7 */}
                {uniqueValues1.length > 7 && (
                  <button
                    type="button"
                    onClick={() => setIsFilter1Expanded(!isFilter1Expanded)}
                    className="filter-expand-btn"
                  >
                    {isFilter1Expanded ? 'Zwiń' : `+ Więcej (${uniqueValues1.length - 6})`}
                  </button>
                )}
              </div>
            </div>

            {/* Filter 1 (MOBILE VERSION): Średnica - styled as clean dropdown select */}
            <div className="config-group config-group--mobile">
              <label className="config-label-select" htmlFor="mobile-diameter-select">{filterConfig.param1.label}:</label>
              <select
                id="mobile-diameter-select"
                className="config-select-menu"
                value={selectedDiameters.length === 1 ? selectedDiameters[0] : 'all'}
                onChange={(e) => setSelectedDiameters(e.target.value === 'all' ? [] : [e.target.value])}
              >
                <option value="all">Wszystkie średnice</option>
                {uniqueValues1.map(val => (
                  <option key={val} value={val}>{val} mm</option>
                ))}
              </select>
            </div>

            {/* Filter 2 (DESKTOP VERSION): Wydajność / Głośność / Price */}
            <div className="config-group config-group--desktop">
              <span className="config-label">{filterConfig.param2.label}:</span>
              <div className="config-pills">
                {visibleValues2.map(val => {
                  const valStr = String(val);
                  const isActive = selectedSpecs.includes(valStr);
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        setSelectedSpecs(prev => 
                          prev.includes(valStr) ? prev.filter(x => x !== valStr) : [...prev, valStr]
                        );
                      }}
                      className={`config-pill ${isActive ? 'active' : ''}`}
                    >
                      {filterConfig.param2.isPrice ? `${val} zł` : val}
                    </button>
                  );
                })}

                {/* Expand toggle trigger if spec choices > 7 */}
                {uniqueValues2.length > 7 && (
                  <button
                    type="button"
                    onClick={() => setIsFilter2Expanded(!isFilter2Expanded)}
                    className="filter-expand-btn"
                  >
                    {isFilter2Expanded ? 'Zwiń' : `+ Więcej (${uniqueValues2.length - 6})`}
                  </button>
                )}
              </div>
            </div>

            {/* Filter 2 (MOBILE VERSION): Wydajność / Głośność / Price */}
            <div className="config-group config-group--mobile">
              <label className="config-label-select" htmlFor="mobile-spec-select">{filterConfig.param2.label}:</label>
              <select
                id="mobile-spec-select"
                className="config-select-menu"
                value={selectedSpecs.length === 1 ? selectedSpecs[0] : 'all'}
                onChange={(e) => setSelectedSpecs(e.target.value === 'all' ? [] : [e.target.value])}
              >
                <option value="all">Wszystkie parametry</option>
                {uniqueValues2.map(val => (
                  <option key={val} value={val}>
                    {filterConfig.param2.isPrice ? `${val} zł` : val}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 2: INTERACTIVE RANGE SLIDER with "lub" separator */}
            {absMaxSpec > absMinSpec && (
              <div className="config-group config-group--slider" style={{ marginTop: '15px', borderTop: '1px dashed var(--border-light)', paddingTop: '15px' }}>
                <span className="config-label">
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)', fontWeight: '600', marginRight: '6px', textTransform: 'uppercase' }}>lub</span> 
                  Zakres ({filterConfig.param2.label}): <strong>do {sliderValue} {filterConfig.param2.isSpec && filterConfig.param2.key === 'wydajnosc' ? 'm³/h' : filterConfig.param2.key === 'glosnosc' ? 'dB(A)' : 'zł'}</strong>
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>{absMinSpec}</span>
                  <input
                    type="range"
                    min={absMinSpec}
                    max={absMaxSpec}
                    value={sliderValue}
                    onChange={(e) => setSliderValue(parseInt(e.target.value, 10))}
                    style={{ flex: 1, cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>{absMaxSpec}</span>
                </div>
              </div>
            )}

            {/* Clear/Reset button for configuration filters */}
            {(selectedDiameters.length > 0 || selectedSpecs.length > 0 || sliderValue < absMaxSpec) && (
              <button 
                type="button"
                onClick={resetFilters}
                className="config-reset-btn"
              >
                Wyczyść filtry
              </button>
            )}

          </div>

          {/* List of sub-models (variants) inside the buybox column */}
          <div className="buybox__variants-list">
            <span className="variants-list-label">Dostępne warianty modelu ({filteredVariants.length}):</span>
            <div className="variants-list-wrapper">
              {filteredVariants.map((v) => {
                const isSelected = v.sku === activeVariant.sku && selectedVariantSku !== '';
                return (
                  <div
                    key={v.sku}
                    className={`variant-list-item ${isSelected ? 'active' : ''}`}
                    onClick={() => handleVariantSelect(v.sku)}
                  >
                    <span className="variant-item-sku">{v.sku}</span>
                    <span className="variant-item-specs">
                      Ø {v.srednica} mm 
                      {filterConfig.param2.isSpec && ` | ${v.specs?.[filterConfig.param2.key]}`}
                    </span>
                    <span className="variant-item-price">{v.price} zł</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-time price updating based on active variant */}
          <div className="buybox__price-section">
            {selectedVariantSku ? (
              <>
                <span className="buybox__price">{activeVariant.price} zł <span className="price-type">netto</span></span>
                <span className="buybox__vat-info">
                  {(activeVariant.price * 1.23).toFixed(2)} zł brutto (23% VAT)
                </span>
              </>
            ) : (
              <>
                <span className="buybox__price">
                  {isSinglePrice ? `${minPrice} zł` : `${minPrice} - ${maxPrice} zł`}{' '}
                  <span className="price-type">netto</span>
                </span>
                <span className="buybox__vat-info">
                  {isSinglePrice 
                    ? `${(minPrice * 1.23).toFixed(2)} zł brutto (23% VAT)` 
                    : `Cena zależy od wybranego wariantu`}
                </span>
              </>
            )}
          </div>

          {/* Core Action Triggers */}
          <div className="buybox__actions">
            <button 
              onClick={() => isInCart ? removeFromCart(activeVariant.sku) : addToCart(activeVariant.sku)}
              className={`buybox__btn buybox__btn--cart ${isInCart ? 'active' : ''}`}
            >
              🛒 {isInCart ? 'Usuń z koszyka' : 'Dodaj do koszyka'}
            </button>

            <button 
              onClick={() => toggleCompare(product.id)}
              className={`buybox__btn buybox__btn--compare ${isComparing ? 'active' : ''}`}
            >
              ⚖️ {isComparing ? 'Porównywany' : 'Dodaj do porównania'}
            </button>
          </div>
        </div>
      </div>

      {/* LOWER SECTION: Product details tabs */}
      <div className="product-details-tabs">
        <div className="tabs-header">
          <button 
            className={`tab-btn ${activeTab === 'parametry' ? 'active' : ''}`}
            onClick={() => setActiveTab('parametry')}
            style={{ textTransform: 'uppercase' }}
          >
            PARAMETRY
          </button>
          <button 
            className={`tab-btn ${activeTab === 'opis' ? 'active' : ''}`}
            onClick={() => setActiveTab('opis')}
            style={{ textTransform: 'uppercase' }}
          >
            OPIS
          </button>
          <button 
            className={`tab-btn ${activeTab === 'wymiary' ? 'active' : ''}`}
            onClick={() => setActiveTab('wymiary')}
            style={{ textTransform: 'uppercase' }}
          >
            WYMIARY
          </button>
          <button 
            className={`tab-btn ${activeTab === 'dane' ? 'active' : ''}`}
            onClick={() => setActiveTab('dane')}
            style={{ textTransform: 'uppercase' }}
          >
            DANE TECHNICZNE
          </button>
          <button 
            className={`tab-btn ${activeTab === 'pobierz' ? 'active' : ''}`}
            onClick={() => setActiveTab('pobierz')}
            style={{ textTransform: 'uppercase' }}
          >
            DO POBRANIA
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'parametry' && (
            <div className="parameters-content animate-fade-in">
              <h3>Kluczowe parametry serii {product.name}</h3>
              <ul className="bullet-list">
                {product.parameters ? (
                  product.parameters.map((param, idx) => <li key={idx}>{param}</li>)
                ) : (
                  <>
                    <li>Kategoria produktu: {getCategoryName(product.categoryId)}</li>
                    <li>Producent: {getProducerName(product.producerId)}</li>
                    <li>Standardowe napięcie zasilania: 230V / 50Hz</li>
                    <li>Wysoka jakość wykonania i długa żywotność podzespołów</li>
                    <li>Przystosowany do montażu w dowolnej pozycji w kanale</li>
                  </>
                )}
              </ul>
            </div>
          )}

          {activeTab === 'opis' && (
            <div className="description-content animate-fade-in">
              <h3>Opis serii {product.name}</h3>
              <p>
                {product.description || `Wysokiej jakości urządzenie wentylacyjne przeznaczone do pracy ciągłej lub okresowej w systemach wentylacji wywiewnej lub nawiewnej. Charakteryzuje się cichą pracą, wysoką wydajnością oraz niezawodnością. Doskonale sprawdza się w budynkach mieszkalnych, komercyjnych oraz przemysłowych.`}
              </p>
              <p>
                Konstrukcja obudowy została zoptymalizowana pod kątem minimalizacji oporów przepływu powietrza, co przekłada się bezpośrednio na energooszczędność całego systemu.
              </p>
            </div>
          )}

          {activeTab === 'wymiary' && (
            <div className="dimensions-content animate-fade-in">
              <h3>Wymiary gabarytowe {product.name}</h3>
              <div className="dimensions-grid">
                <div className="dimensions-table-wrapper">
                  <table className="spec-table">
                    <thead>
                      <tr>
                        <th>Cecha wymiarowa</th>
                        <th>Wartość</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.dimensions?.values ? (
                        product.dimensions.values.map((d, idx) => (
                          <tr key={idx}>
                            <th>{d.param}</th>
                            <td>{d.val}</td>
                          </tr>
                        ))
                      ) : (
                        <>
                          <tr>
                            <th>Średnica przyłącza Ø</th>
                            <td>{activeVariant.srednica} mm</td>
                          </tr>
                          <tr>
                            <th>Zewnętrzna szerokość</th>
                            <td>{activeVariant.srednica + 45} mm</td>
                          </tr>
                          <tr>
                            <th>Długość korpusu</th>
                            <td>{activeVariant.srednica + 90} mm</td>
                          </tr>
                          <tr>
                            <th>Masa orientacyjna wariantu</th>
                            <td>5.5 kg</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="dimensions-graphic">
                  <div className="dimensions-img-placeholder">
                    <span className="dimension-schematic-icon">📐</span>
                    <span className="dimension-schematic-label">Rysunek techniczny gabarytów znajduje się w karcie katalogowej (do pobrania)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dane' && (
            <div className="specifications-content animate-fade-in">
              <h3>Specyfikacja techniczna wariantu: {activeVariant.sku}</h3>
              <table className="spec-table">
                <tbody>
                  <tr>
                    <th>Wariant handlowy</th>
                    <td>{activeVariant.sku}</td>
                  </tr>
                  <tr>
                    <th>Średnica przyłącza Ø</th>
                    <td>{activeVariant.srednica} mm</td>
                  </tr>
                  <tr>
                    <th>Producent</th>
                    <td>{getProducerName(product.producerId)}</td>
                  </tr>
                  <tr>
                    <th>Kategoria</th>
                    <td>{getCategoryName(product.categoryId)}</td>
                  </tr>
                  {/* Map over the deep specs object dynamically */}
                  {Object.entries(activeVariant.specs || {}).map(([key, val]) => (
                    <tr key={key}>
                      <th>{key.charAt(0).toUpperCase() + key.slice(1)}</th>
                      <td>{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'pobierz' && (
            <div className="downloads-content animate-fade-in">
              <h3>Materiały i dokumenty do pobrania</h3>
              <div className="downloads-list">
                {product.downloads ? (
                  product.downloads.map((d, idx) => (
                    <a key={idx} href={d.url} className="download-item-link" download onClick={(e) => e.preventDefault()}>
                      <span className="download-icon">📄</span>
                      <div className="download-info">
                        <span className="download-name">{d.name}</span>
                        <span className="download-meta">Format: PDF | Rozmiar: {d.size}</span>
                      </div>
                      <span className="download-btn-arrow">↓ Pobierz</span>
                    </a>
                  ))
                ) : (
                  <>
                    <a href="#karta" className="download-item-link" onClick={(e) => e.preventDefault()}>
                      <span className="download-icon">📄</span>
                      <div className="download-info">
                        <span className="download-name">Karta techniczna produktu (PDF)</span>
                        <span className="download-meta">Format: PDF | Rozmiar: 1.2 MB</span>
                      </div>
                      <span className="download-btn-arrow">↓ Pobierz</span>
                    </a>
                    <a href="#instrukcja" className="download-item-link" onClick={(e) => e.preventDefault()}>
                      <span className="download-icon">📄</span>
                      <div className="download-info">
                        <span className="download-name">Instrukcja obsługi i montażu (PDF)</span>
                        <span className="download-meta">Format: PDF | Rozmiar: 2.1 MB</span>
                      </div>
                      <span className="download-btn-arrow">↓ Pobierz</span>
                    </a>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RELATED PRODUCTS SECTION */}
      <section className="related-products-section" style={{ marginTop: '50px', borderTop: '1px solid var(--border-light)', paddingTop: '40px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-dark)', textTransform: 'uppercase', marginBottom: '25px', letterSpacing: '1px' }}>Produkty powiązane</h2>
        <div className="products-grid">
          {products
            .filter(p => p.id !== product.id && p.categoryId === product.categoryId)
            .slice(0, 4)
            .concat(products.filter(p => p.id !== product.id && p.categoryId !== product.categoryId))
            .slice(0, 4)
            .map(p => (
              <ProductCard
                key={p.id}
                product={p}
                matchingVariant={p.variants[0]}
                isComparing={compare.includes(p.id)}
                onToggleCompare={toggleCompare}
              />
            ))}
        </div>
      </section>

    </div>
  );
}
