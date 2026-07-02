import React from 'react';
import { useNavigate } from 'react-router-dom';
import producers from '../../db/producers.json';

/**
 * Reusable Product Card Component
 * Encapsulates dynamic category-specific specification mapping, compare triggers,
 * and unified layout positioning for product list grids.
 */
export default function ProductCard({ product, matchingVariant, isComparing, onToggleCompare }) {
  const navigate = useNavigate();
  const activeVariant = matchingVariant || product.variants[0] || { sku: '', price: 0 };

  const getProducerName = (producerId) => {
    if (!producerId || typeof producerId !== 'number') return 'Nieznany producent';
    const brand = producers.find(p => p.id === producerId);
    return brand ? brand.name : 'Inny producent';
  };

  const getSpecRange = (prod, specKey, unit) => {
    if (!prod || !prod.variants || prod.variants.length === 0) return 'N/A';
    const values = prod.variants
      .map(v => {
        const valStr = v.specs?.[specKey];
        if (!valStr) return null;
        const match = valStr.match(/\d+/);
        return match ? parseInt(match[0], 10) : null;
      })
      .filter(v => v !== null);

    if (values.length === 0) return 'N/A';
    if (values.length === 1) return `${values[0]} ${unit}`;

    const min = Math.min(...values);
    const max = Math.max(...values);
    return `od ${min} do ${max} ${unit}`;
  };

  const getProductCardSpecs = (prod) => {
    if (!prod) return [];
    const name = prod.name.toLowerCase();
    const isFan = name.includes('wentylator') || name.includes('jettec');
    const isGrilleOrAnemostat = name.includes('kratka') || name.includes('anemostat');
    const isReku = name.includes('centrala') || name.includes('rekuperator');

    if (isFan) {
      return [
        { label: 'Wydajność', value: getSpecRange(prod, 'wydajnosc', 'm³/h') },
        { label: 'Moc silnika', value: getSpecRange(prod, 'moc', 'W') },
        { label: 'Głośność', value: getSpecRange(prod, 'glosnosc', 'dB(A)/3m') }
      ];
    }
    
    if (isGrilleOrAnemostat) {
      const firstVarSpecs = prod.variants[0]?.specs || {};
      return [
        { label: 'Materiał', value: firstVarSpecs.material || 'Tworzywo ABS' },
        { label: 'Kolor', value: firstVarSpecs.kolor || 'Biały' },
        { label: 'Regulacja', value: firstVarSpecs.regulacja || 'Brak' }
      ];
    }

    if (isReku) {
      const firstVarSpecs = prod.variants[0]?.specs || {};
      return [
        { label: 'Wydajność max', value: getSpecRange(prod, 'wydajnosc', 'm³/h') },
        { label: 'Odzysk ciepła', value: firstVarSpecs.odzysk || 'do 90%' },
        { label: 'Filtry', value: firstVarSpecs.filtry || 'F7/G4' }
      ];
    }

    return [
      { label: 'Średnica Ø', value: `${prod.variants[0]?.srednica || 100} mm` },
      { label: 'Typ', value: 'Akcesorium' },
      { label: 'Gwarancja', value: '2 lata' }
    ];
  };

  const handleCardClick = () => {
    const query = matchingVariant ? `?wersja=${matchingVariant.sku}` : '';
    navigate(`/product/${product.slug}${query}`);
  };

  return (
    <div 
      className="product-card animate-fade-in" 
      onClick={handleCardClick}
      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <span className="product-card__badge">Top Produkt</span>

      <button 
        onClick={(e) => {
          e.stopPropagation();
          onToggleCompare(product.id);
        }}
        className={`compare-icon ${isComparing ? 'active' : ''}`}
        title={isComparing ? "Usuń z porównania" : "Dodaj do porównania"}
      >
        ⚖️
      </button>
      
      <div className="product-card__img-wrapper">
        {product.mainImage ? (
          <img src={product.mainImage} alt={product.name} className="product-card__img" />
        ) : (
          <span className="product-card__img-placeholder">📸</span>
        )}
      </div>

      <span className="product-card__brand">{getProducerName(product.producerId)}</span>
      
      <h3 className="product-card__title">{product.name}</h3>

      <div className="product-card__specs">
        {getProductCardSpecs(product).map((spec, index) => (
          <div key={index} className="spec-line">
            <span className="spec-label">{spec.label}:</span> {spec.value}
          </div>
        ))}
      </div>

      <div className="product-card__price-row" style={{ marginTop: 'auto' }}>
        <span className="product-card__price">
          {activeVariant.price} zł <span className="price-netto">netto</span>
        </span>
        <span className="product-card__link-details">Szczegóły &rarr;</span>
      </div>
    </div>
  );
}
