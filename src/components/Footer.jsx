import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Global Footer Component
 * Re-designed to strictly match the visual layout in Ref/footer.png:
 * 1. Four columns: Informacje, Pomoc, Moje Konto, O Nas with exact items.
 * 2. Centered Contact Info block with phone +48 690 912 712 and email.
 * 3. Payment partners bottom band with white background and clean text logos/badges.
 */
export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__container">
        
        {/* Top Section: 4-Column Grid */}
        <div className="footer__grid">
          
          {/* Column 1: Informacje */}
          <div className="footer__column">
            <h4 className="footer__title">Informacje</h4>
            <ul className="footer__list">
              <li><Link to="/">Dostępność towarów</Link></li>
              <li><Link to="/">Koszt i sposoby dostawy</Link></li>
              <li><Link to="/">Gwarancja, serwis oraz zwrot towaru</Link></li>
              <li><Link to="/">Mapa kategorii</Link></li>
              <li><Link to="/">Informacje o firmie</Link></li>
              <li><Link to="/">Kontakt</Link></li>
            </ul>
          </div>

          {/* Column 2: Pomoc */}
          <div className="footer__column">
            <h4 className="footer__title">Pomoc</h4>
            <ul className="footer__list">
              <li><Link to="/">Tematy pomocy</Link></li>
              <li><Link to="/">Regulamin zakupów</Link></li>
              <li><Link to="/">Czas realizacji zamówienia</Link></li>
              <li><Link to="/">Bezpieczeństwo zakupów</Link></li>
              <li><Link to="/">Polityka prywatności</Link></li>
            </ul>
          </div>

          {/* Column 3: Moje Konto */}
          <div className="footer__column">
            <h4 className="footer__title">Moje konto</h4>
            <ul className="footer__list">
              <li><Link to="/">Zaloguj się</Link></li>
              <li><Link to="/">Zarejestruj się</Link></li>
            </ul>
          </div>

          {/* Column 4: O nas */}
          <div className="footer__column footer__column--about">
            <h4 className="footer__title">O nas</h4>
            <div className="footer__about-text">
              <p>Instalszop Adam Bilski</p>
              <p>ul.Kopanina 28/32D Lokal 101</p>
              <p>60-105 Poznań</p>
              <br />
              <p>NIP: 7772822711</p>
              <p>REGON: 301691570</p>
            </div>
          </div>

        </div>

        {/* Middle Section: Centered Contact block with dark border */}
        <div className="footer__contact-strip">
          <div className="contact-strip-item">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="strip-vector-icon">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            <span>Zamów przez telefon <strong>+48 690 912 712</strong></span>
          </div>
          <div className="contact-strip-item">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="strip-vector-icon">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <span><strong>sklep@instalszop.pl</strong></span>
          </div>
        </div>

      </div>

      {/* Bottom Section: Payment Partners Band with white background */}
      <div className="footer__payments-band">
        <div className="container payments-band-container">
          <span className="payment-logo payment-logo--payu">PayU</span>
          <span className="payment-logo">VISA</span>
          <span className="payment-logo">Mastercard</span>
          <span className="payment-logo">mBank</span>
          <span className="payment-logo">MultiTransfer</span>
          <span className="payment-logo">Alior Bank</span>
          <span className="payment-logo">ING</span>
          <span className="payment-logo">Pekao</span>
          <span className="payment-logo">Millenium</span>
          <span className="payment-logo">iPKO</span>
          <span className="payment-logo">Citi</span>
          <span className="payment-logo">Nordea</span>
          <span className="payment-logo">Deutsche Bank</span>
        </div>
      </div>

    </footer>
  );
}
