import React, { useState } from 'react';
import { Sparkles, Send, CheckCircle2, MessageSquare, Share2, Code2, ArrowUp } from 'lucide-react';

interface CommunityFooterProps {
  onNavigate: (sectionId: string) => void;
}

export const CommunityFooter: React.FC<CommunityFooterProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      setSubscribed(true);
      setEmail('');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="community" className="studio-footer">
      <div className="footer-glow-divider" />

      {/* Community & Newsletter Row */}
      <div className="footer-newsletter-wrap">
        <div className="newsletter-text">
          <div className="newsletter-badge">
            <Sparkles size={14} />
            <span>TOPLULUĞA KATIL</span>
          </div>
          <h3>Yeni Oyunlar ve Güncellemelerden İlk Sen Haberdar Ol</h3>
          <p>Hyperdusk Games projeleri, yeni Crush Core eklentileri ve erken erişim testleri için abone olun.</p>
        </div>

        <div className="newsletter-form-box">
          {subscribed ? (
            <div className="subscribe-success">
              <CheckCircle2 size={20} color="#00ff88" />
              <span>Aboneliğiniz tamamlandı! Galaktik filoya hoş geldiniz.</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="subscribe-form">
              <input
                type="email"
                placeholder="E-posta adresinizi girin..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="subscribe-input"
              />
              <button type="submit" className="subscribe-btn">
                <span>KAYIT OL</span>
                <Send size={16} />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="footer-links-grid">
        {/* Brand Col */}
        <div className="footer-col brand-col">
          <div className="studio-brand">
            <div className="brand-icon-wrapper">
              <Sparkles size={20} className="brand-sparkle" />
            </div>
            <div className="brand-text-block">
              <span className="brand-title">HYPERDUSK</span>
              <span className="brand-tag">GAMES</span>
            </div>
          </div>
          <p className="brand-footer-motto">
            Refleks ve taktiği birleştiren yeni nesil sci-fi arcade oyun stüdyosu.
          </p>
          <div className="footer-social-links">
            <a href="https://discord.gg" target="_blank" rel="noopener noreferrer" className="social-link discord" aria-label="Discord">
              <MessageSquare size={18} />
            </a>
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="social-link twitter" aria-label="X / Twitter">
              <Share2 size={18} />
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="social-link github" aria-label="GitHub">
              <Code2 size={18} />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-col">
          <h4 className="footer-col-title">OYUNLAR</h4>
          <ul className="footer-nav-list">
            <li><button onClick={() => onNavigate('featured')}>Crush Space</button></li>
            <li><button onClick={() => onNavigate('core-lab')}>Çekirdek Laboratuvarı</button></li>
            <li><button onClick={() => onNavigate('vault')}>Project Voidborne</button></li>
            <li><button onClick={() => onNavigate('vault')}>Neon Drift: Overdrive</button></li>
          </ul>
        </div>

        {/* Studio Links */}
        <div className="footer-col">
          <h4 className="footer-col-title">STÜDYO</h4>
          <ul className="footer-nav-list">
            <li><button onClick={() => onNavigate('about')}>Vizyon & Mimari</button></li>
            <li><button onClick={() => onNavigate('about')}>Teknoloji Yığını</button></li>
            <li><button onClick={() => onNavigate('community')}>Topluluk</button></li>
            <li><a href="mailto:contact@hyperdusk.games">İletişim</a></li>
          </ul>
        </div>

        {/* System Status */}
        <div className="footer-col">
          <h4 className="footer-col-title">SİSTEM DURUMU</h4>
          <div className="server-status-pill">
            <span className="status-ping-dot" />
            <span>Tüm Sunucular Aktif (60 FPS)</span>
          </div>
          <p className="system-ver">Hyperdusk Web Platform // v1.0.4</p>
        </div>
      </div>

      {/* Bottom Copyright Row */}
      <div className="footer-bottom-row">
        <span className="copyright-text">
          &copy; {new Date().getFullYear()} <strong>Hyperdusk Games</strong>. Tüm hakları saklıdır.
        </span>
        <button className="scroll-top-btn" onClick={scrollToTop} aria-label="Yukarı Kaydır">
          <span>BAŞA DÖN</span>
          <ArrowUp size={16} />
        </button>
      </div>
    </footer>
  );
};
