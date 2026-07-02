import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

// Direct data imports simulating external database records
import categories from '../../db/categories.json';
import producers from '../../db/producers.json';
import products from '../../db/products.json';
import ProductCard from '../components/ProductCard';

/**
 * Home Page Component
 * Renders the main marketing landing page OR the dynamic Category catalog page.
 * Implements:
 * 1. Flat specs (natural wrap) and column grid safety rules (minmax(0, 1fr)) to prevent grid container overflow.
 * 2. Flat price row where "Szczegóły" fades in next to the price on hover. This eliminates layout shifting entirely and resolves empty space gaps.
 * 3. Dynamic Category filter page with a sidebar showing available options (Brand, Diameter checkboxes, Min/Max range filters for Airflow/Power/Price).
 */
export default function Home({ cart = [], addToCart, removeFromCart, compare = [], toggleCompare }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryIdParam = searchParams.get('category');

  // State slice tracking the active product showcase tab ("bestsellery", "nowosci", "polecamy")
  const [activeTab, setActiveTab] = useState('bestsellery');

  // Banner slider active slide index state
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  // Category View Filter States
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedDiameters, setSelectedDiameters] = useState([]);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [airflowMin, setAirflowMin] = useState('');
  const [airflowMax, setAirflowMax] = useState('');
  const [powerMin, setPowerMin] = useState('');
  const [powerMax, setPowerMax] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Reset filters when the category URL query parameter changes
  useEffect(() => {
    setSelectedBrands([]);
    setSelectedDiameters([]);
    setPriceMin('');
    setPriceMax('');
    setAirflowMin('');
    setAirflowMax('');
    setPowerMin('');
    setPowerMax('');
    setSortBy('default');
  }, [categoryIdParam]);

  // Filter categories to subcategories (non-null parentId) and explicitly extract ONLY the first 10 objects using .slice()
  const vitrineCategories = categories
    .filter((c) => c.parentId !== null)
    .slice(0, 10);

  // Dummy promo banners data for the custom slider layout
  const promoBanners = [
    {
      id: 1,
      title: "PRODUCENT WENTYLATORÓW JETTEC",
      subtitle: "Najwyższa wydajność i cicha praca w instalacjach przemysłowych",
      bgGradient: "linear-gradient(135deg, #2669B7 0%, #1e4b85 100%)"
    },
    {
      id: 2,
      title: "NOWE CENTRALE REKUPERACYJNE",
      subtitle: "Sprawdź nowoczesne centrale wentylacyjne z odzyskiem ciepła",
      bgGradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
    },
    {
      id: 3,
      title: "DARMOWA DOSTAWA OD 500 ZŁ",
      subtitle: "Zrób zakupy w naszym sklepie i ciesz się bezpłatną przesyłką kurierską",
      bgGradient: "linear-gradient(135deg, #10b981 0%, #065f46 100%)"
    }
  ];

  // Helper: extract digit value from spec strings (e.g. "1600 m3/h" -> 1600)
  const parseNumericValue = (str) => {
    if (!str) return null;
    const match = str.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  };

  /**
   * Helper function to filter products based on the currently selected active tab (for Home page grid)
   */
  const getFilteredProducts = () => {
    let list = [];
    if (activeTab === 'nowosci') {
      list = products.filter(p => p.categoryId === 6 || p.categoryId === 7);
    } else if (activeTab === 'bestsellery') {
      list = products.filter(p => (p.variants[0]?.price || 0) < 400);
    } else if (activeTab === 'polecamy') {
      list = products.filter(p => (p.variants[0]?.price || 0) >= 400);
    } else {
      list = products;
    }

    // Duplicate to make exactly 10 products for presentation
    const result = [];
    if (list.length > 0) {
      while (result.length < 10) {
        list.forEach(item => {
          if (result.length < 10) {
            result.push({
              ...item,
              id: `${item.id}-dup-${result.length}`
            });
          }
        });
      }
    }
    return result;
  };

  const displayedProducts = getFilteredProducts();

  // Banner slider control methods
  const handlePrevBanner = () => {
    setActiveBannerIndex((prev) => (prev <= 0 ? promoBanners.length - 1 : prev - 1));
  };
  const handleNextBanner = () => {
    setActiveBannerIndex((prev) => (prev >= promoBanners.length - 1 ? 0 : prev + 1));
  };

  // -------------------------------------------------------------
  // DYNAMIC CATEGORY VIEWS LOGIC
  // -------------------------------------------------------------
  const activeCategoryId = categoryIdParam ? parseInt(categoryIdParam, 10) : null;
  const activeCategory = activeCategoryId ? categories.find(c => c.id === activeCategoryId) : null;

  // Find subcategory IDs if activeCategory is a parent category (e.g. Wentylacja)
  const subcategoryIds = activeCategory
    ? categories.filter(c => c.parentId === activeCategory.id).map(c => c.id)
    : [];

  // Filter products by category (matches categoryId directly, or is a subcategory of the active master category)
  const categoryProducts = activeCategory
    ? products.filter(p => p.categoryId === activeCategory.id || subcategoryIds.includes(p.categoryId))
    : [];

  // Determine parent category for breadcrumbs (if subcategory is active)
  const parentCat = activeCategory && activeCategory.parentId
    ? categories.find(c => c.id === activeCategory.parentId)
    : null;

  // Retrieve available option choices across products in active category
  const categoryVariants = categoryProducts.flatMap(p => p.variants);
  const uniqueBrandIds = Array.from(new Set(categoryProducts.map(p => p.producerId)));
  const availableBrands = producers.filter(p => uniqueBrandIds.includes(p.id));
  const uniqueDiameters = Array.from(new Set(categoryVariants.map(v => v.srednica).filter(Boolean))).sort((a, b) => a - b);

  // Compute specs limits (for inputs placeholders)
  const airflows = categoryVariants.map(v => parseNumericValue(v.specs?.wydajnosc)).filter(v => v !== null);
  const minAirflow = airflows.length ? Math.min(...airflows) : 0;
  const maxAirflow = airflows.length ? Math.max(...airflows) : 5000;

  const powers = categoryVariants.map(v => parseNumericValue(v.specs?.moc)).filter(v => v !== null);
  const minPower = powers.length ? Math.min(...powers) : 0;
  const maxPower = powers.length ? Math.max(...powers) : 2000;

  // Toggle brand selection
  const handleBrandToggle = (brandId) => {
    setSelectedBrands(prev =>
      prev.includes(brandId) ? prev.filter(id => id !== brandId) : [...prev, brandId]
    );
  };

  // Toggle diameter selection
  const handleDiameterToggle = (diameter) => {
    setSelectedDiameters(prev =>
      prev.includes(diameter) ? prev.filter(d => d !== diameter) : [...prev, diameter]
    );
  };

  // Process filters
  const filteredCategoryProducts = categoryProducts.map(product => {
    // Brand filter
    if (selectedBrands.length > 0 && !selectedBrands.includes(product.producerId)) {
      return null;
    }

    // Filter variants based on criteria
    const matchingVariants = product.variants.filter(v => {
      // Diameter Check
      if (selectedDiameters.length > 0 && !selectedDiameters.includes(v.srednica)) {
        return false;
      }
      // Price Check
      if (priceMin !== '' && v.price < parseFloat(priceMin)) return false;
      if (priceMax !== '' && v.price > parseFloat(priceMax)) return false;
      // Airflow Check
      const af = parseNumericValue(v.specs?.wydajnosc);
      if (airflowMin !== '' && (af === null || af < parseInt(airflowMin, 10))) return false;
      if (airflowMax !== '' && (af === null || af > parseInt(airflowMax, 10))) return false;
      // Power Check
      const pow = parseNumericValue(v.specs?.moc);
      if (powerMin !== '' && (pow === null || pow < parseInt(powerMin, 10))) return false;
      if (powerMax !== '' && (pow === null || pow > parseInt(powerMax, 10))) return false;

      return true;
    });

    if (matchingVariants.length === 0) return null;

    // Return product with only matching variants (so correct price is shown)
    return {
      ...product,
      variants: matchingVariants
    };
  }).filter(Boolean);

  // Process sorting
  const sortedCategoryProducts = [...filteredCategoryProducts].sort((a, b) => {
    const priceA = a.variants[0]?.price || 0;
    const priceB = b.variants[0]?.price || 0;
    if (sortBy === 'price-asc') return priceA - priceB;
    if (sortBy === 'price-desc') return priceB - priceA;
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    return 0;
  });

  const isAnyFilterActive = selectedBrands.length > 0 || selectedDiameters.length > 0 || priceMin !== '' || priceMax !== '' || airflowMin !== '' || airflowMax !== '' || powerMin !== '' || powerMax !== '';

  const clearAllFilters = () => {
    setSelectedBrands([]);
    setSelectedDiameters([]);
    setPriceMin('');
    setPriceMax('');
    setAirflowMin('');
    setAirflowMax('');
    setPowerMin('');
    setPowerMax('');
  };

  // -------------------------------------------------------------
  // RENDER DYNAMIC CATEGORY PAGE VIEW IF ?category= IS ACTIVE
  // -------------------------------------------------------------
  if (activeCategory) {
    return (
      <div className="category-page-content">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <Link to="/">Sklep</Link> &gt;{' '}
          {parentCat && (
            <>
              <Link to={`/?category=${parentCat.id}`}>{parentCat.name}</Link> &gt;{' '}
            </>
          )}
          <strong>{activeCategory.name}</strong>
        </div>

        <div className="category-header-banner">
          <h1 className="category-header-title">{activeCategory.name}</h1>
          <p className="category-header-subtitle">Przeglądaj profesjonalne rozwiązania wentylacyjne i instalacyjne</p>
        </div>

        <div className="category-grid">
          
          {/* Mobile Overlay backdrop */}
          {isMobileFiltersOpen && (
            <div className="sidebar-overlay animate-fade-in" onClick={() => setIsMobileFiltersOpen(false)}></div>
          )}

          {/* Left Sidebar Filter Section */}
          <aside className={`category-sidebar ${isMobileFiltersOpen ? 'category-sidebar--open' : ''}`}>
            <div className="sidebar-header">
              <span className="sidebar-title">Filtry</span>
              <div className="sidebar-header-actions">
                {isAnyFilterActive && (
                  <button className="clear-filters-btn" onClick={clearAllFilters}>
                    Wyczyść
                  </button>
                )}
                <button 
                  className="sidebar-close-btn" 
                  onClick={() => setIsMobileFiltersOpen(false)}
                  title="Zamknij filtry"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Brand Checkboxes */}
            {availableBrands.length > 0 && (
              <div className="sidebar-section">
                <h4 className="sidebar-section-title">Producent (Marka)</h4>
                <div className="checkbox-list">
                  {availableBrands.map(brand => (
                    <label key={brand.id} className="checkbox-label">
                      <input 
                        type="checkbox"
                        checked={selectedBrands.includes(brand.id)}
                        onChange={() => handleBrandToggle(brand.id)}
                      />
                      <span>{brand.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Diameter (Średnica) Checkboxes */}
            {uniqueDiameters.length > 0 && (
              <div className="sidebar-section">
                <h4 className="sidebar-section-title">Średnica przyłącza Ø</h4>
                <div className="checkbox-list">
                  {uniqueDiameters.map(diameter => (
                    <label key={diameter} className="checkbox-label">
                      <input 
                        type="checkbox"
                        checked={selectedDiameters.includes(diameter)}
                        onChange={() => handleDiameterToggle(diameter)}
                      />
                      <span>{diameter} mm</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range Filter */}
            <div className="sidebar-section">
              <h4 className="sidebar-section-title">Cena netto (zł)</h4>
              <div className="range-inputs">
                <input 
                  type="number"
                  placeholder="Min"
                  value={priceMin}
                  onChange={e => setPriceMin(e.target.value)}
                />
                <span className="separator">-</span>
                <input 
                  type="number"
                  placeholder="Max"
                  value={priceMax}
                  onChange={e => setPriceMax(e.target.value)}
                />
              </div>
            </div>

            {/* Performance Range Filter */}
            {airflows.length > 0 && (
              <div className="sidebar-section">
                <h4 className="sidebar-section-title">Wydajność (m³/h)</h4>
                <div className="range-inputs">
                  <input 
                    type="number"
                    placeholder={`${minAirflow}`}
                    value={airflowMin}
                    onChange={e => setAirflowMin(e.target.value)}
                  />
                  <span className="separator">-</span>
                  <input 
                    type="number"
                    placeholder={`${maxAirflow}`}
                    value={airflowMax}
                    onChange={e => setAirflowMax(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Power Range Filter */}
            {powers.length > 0 && (
              <div className="sidebar-section">
                <h4 className="sidebar-section-title">Moc silnika (W)</h4>
                <div className="range-inputs">
                  <input 
                    type="number"
                    placeholder={`${minPower}`}
                    value={powerMin}
                    onChange={e => setPowerMin(e.target.value)}
                  />
                  <span className="separator">-</span>
                  <input 
                    type="number"
                    placeholder={`${maxPower}`}
                    value={powerMax}
                    onChange={e => setPowerMax(e.target.value)}
                  />
                </div>
              </div>
            )}

          </aside>

          {/* Right Product Grid & Sorting Toolbar */}
          <main className="category-products-main">
            <div className="category-toolbar">
              <span className="products-count">
                Znaleziono: <strong>{sortedCategoryProducts.length}</strong> produktów
              </span>

              <button 
                className="category-mobile-filter-trigger"
                onClick={() => setIsMobileFiltersOpen(true)}
              >
                ⚙️ Filtruj
              </button>
              
              <div className="sort-group">
                <label htmlFor="category-sort">Sortuj po:</label>
                <select
                  id="category-sort"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="default">Domyślnie</option>
                  <option value="price-asc">Cena: rosnąco</option>
                  <option value="price-desc">Cena: malejąco</option>
                  <option value="name-asc">Nazwa: A-Z</option>
                </select>
              </div>
            </div>

            {sortedCategoryProducts.length === 0 ? (
              <div className="category-products-empty">
                <h3>Brak dopasowanych produktów</h3>
                <p>Zmień lub wyczyść wybrane filtry po lewej stronie, aby zobaczyć ofertę.</p>
                {isAnyFilterActive && (
                  <button className="btn-primary py-2 px-4 rounded" onClick={clearAllFilters}>
                    Wyczyść filtry
                  </button>
                )}
              </div>
            ) : (
              <div className="products-grid">
                {sortedCategoryProducts.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    matchingVariant={product.variants[0]}
                    isComparing={compare.includes(product.id)}
                    onToggleCompare={toggleCompare}
                  />
                ))}
              </div>
            )}
          </main>

        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // DEFAULT HOME PAGE RENDER
  // -------------------------------------------------------------
  return (
    <div className="home-page-content">
      
      {/* SECTION 1: Popularne Kategorie (Siatka 2x5 w kontenerze) */}
      <section className="categories-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Popularne Kategorie</h2>
            <Link to="/" className="section-link">Cały katalog</Link>
          </div>
          
          <div className="categories-grid">
            {vitrineCategories.map((category) => (
              <div 
                key={category.id} 
                className="category-card"
                onClick={() => navigate(`/?category=${category.id}`)}
              >
                <div className="category-card__img-wrapper">
                  <span className="category-card__placeholder-icon">📦</span>
                </div>
                <h3 className="category-card__title">{category.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: Promo Banner Slider (Moved here as requested!) */}
      <section className="slider-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Promocje i Aktualności</h2>
            <div className="slider-controls">
              <button onClick={handlePrevBanner} className="slider-btn prev-btn">◀</button>
              <button onClick={handleNextBanner} className="slider-btn next-btn">▶</button>
            </div>
          </div>

          <div className="slider-viewport slider-viewport--banner">
            <div className="banner-slide-wrapper" style={{ background: promoBanners[activeBannerIndex].bgGradient }}>
              <div className="banner-slide-content">
                <span className="banner-tag">Promocje</span>
                <h3 className="banner-slide-title">{promoBanners[activeBannerIndex].title}</h3>
                <p className="banner-slide-subtitle">{promoBanners[activeBannerIndex].subtitle}</p>
                <button className="banner-action-btn">Sprawdź ofertę</button>
              </div>
              <div className="banner-graphic-placeholder">
                <span className="placeholder-art">🖼️ Banner Placeholder</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Showcase Grid w kontenerze */}
      <section className="showcase-section">
        <div className="container">
          <div className="showcase-tabs">
            <button 
              className={`showcase-tab ${activeTab === 'bestsellery' ? 'active' : ''}`}
              onClick={() => setActiveTab('bestsellery')}
            >
              Bestsellery
            </button>
            <button 
              className={`showcase-tab ${activeTab === 'nowosci' ? 'active' : ''}`}
              onClick={() => setActiveTab('nowosci')}
            >
              Nowości
            </button>
            <button 
              className={`showcase-tab ${activeTab === 'polecamy' ? 'active' : ''}`}
              onClick={() => setActiveTab('polecamy')}
            >
              Polecamy
            </button>
          </div>

          <div className="products-grid">
            {displayedProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                matchingVariant={product.variants[0]}
                isComparing={compare.includes(product.id)}
                onToggleCompare={toggleCompare}
              />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: Advantages Bar (Moved here as requested!) */}
      <section className="advantages-bar-section">
        <div className="container">
          <div className="advantages-bar">
            
            {/* 1. Szybka wysyłka */}
            <div className="advantage-item">
              <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="adv-vector-icon">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
              <div className="adv-text">
                <strong className="adv-title">Szybka wysyłka</strong>
                <span className="adv-desc">Wysyłka kurierem DPD lub InPost już od 12 zł</span>
              </div>
            </div>

            {/* 2. 21 dni na zwrot */}
            <div className="advantage-item">
              <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="adv-vector-icon">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
              <div className="adv-text">
                <strong className="adv-title">21 dni na zwrot</strong>
                <span className="adv-desc">Możliwość zwrotu bez zbędnych pytań</span>
              </div>
            </div>

            {/* 3. Darmowa dostawa */}
            <div className="advantage-item">
              <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="adv-vector-icon">
                <polyline points="20 12 20 22 4 22 4 12"></polyline>
                <rect x="2" y="7" width="20" height="5"></rect>
                <line x1="12" y1="22" x2="12" y2="7"></line>
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
              </svg>
              <div className="adv-text">
                <strong className="adv-title">Darmowa dostawa</strong>
                <span className="adv-desc">Dla wszystkich zamówień powyżej 500 zł</span>
              </div>
            </div>

            {/* 4. Wsparcie techniczne */}
            <div className="advantage-item">
              <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="adv-vector-icon">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
              </svg>
              <div className="adv-text">
                <strong className="adv-title">Wsparcie techniczne</strong>
                <span className="adv-desc">Profesjonalna pomoc w doborze sprzętu</span>
                <a href="mailto:sklep@instalszop.pl" className="adv-contact-btn">Napisz do nas</a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 5: Nasi Producenci */}
      <section className="producers-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Nasi Producenci</h2>
          </div>
          <div className="producers-grid">
            {(() => {
              const duplicatedProducers = [];
              if (producers.length > 0) {
                while (duplicatedProducers.length < 6) {
                  producers.forEach(p => {
                    if (duplicatedProducers.length < 6) {
                      duplicatedProducers.push({
                        ...p,
                        id: `${p.id}-dup-${duplicatedProducers.length}`
                      });
                    }
                  });
                }
              }
              return duplicatedProducers.map((producer) => (
                <div key={producer.id} className="producer-card">
                  <div className="producer-card__logo-wrapper">
                    <span className="producer-card__logo-placeholder">🏢</span>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </section>
      
    </div>
  );
}
