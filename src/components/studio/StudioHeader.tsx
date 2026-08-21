import React, { useState, useEffect } from 'react';
import { Sparkles, Menu, X, Play, ChevronRight } from 'lucide-react';

interface StudioHeaderProps {
  onPlayClick: () => void;
  onNavigate: (sectionId: string) => void;
  activeSection: string;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  onPlayClick,
  onNavigate,
  activeSection
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'hero', label: 'Ana Sayfa' },
    { id: 'featured', label: 'Crush Space', highlight: true },
    { id: 'core-lab', label: 'Çekirdek Laboratuvarı' },
    { id: 'vault', label: 'Oyunlar' },
    { id: 'about', label: 'Stüdyo & Teknoloji' },
    { id: 'community', label: 'Topluluk' }
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className={`studio-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="studio-header-inner">
        {/* Brand Logo */}
        <div className="studio-brand" onClick={() => handleNavClick('hero')}>
          <div className="brand-icon-wrapper">
            <Sparkles size={20} className="brand-sparkle" />
            <div className="brand-glow-ring" />
          </div>
          <div className="brand-text-block">
            <span className="brand-title">HYPERDUSK</span>
            <span className="brand-tag">GAMES</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="studio-nav desktop-only">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`nav-link ${isActive ? 'active' : ''} ${item.highlight ? 'highlight-game' : ''}`}
              >
                {item.label}
                {item.highlight && <span className="live-dot" />}
              </button>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="studio-header-actions">
          {/* Quick Play CTA */}
          <button className="header-play-btn" onClick={onPlayClick}>
            <Play size={15} fill="#070a14" />
            <span>HEMEN OYNA</span>
            <div className="btn-glow-bar" />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-menu-toggle mobile-only"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="studio-mobile-drawer">
          <div className="mobile-nav-list">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`mobile-nav-item ${activeSection === item.id ? 'active' : ''}`}
              >
                <span>{item.label}</span>
                <ChevronRight size={18} opacity={0.6} />
              </button>
            ))}
            <div className="mobile-drawer-cta">
              <button className="mobile-play-cta" onClick={() => { setMobileMenuOpen(false); onPlayClick(); }}>
                <Play size={18} fill="#070a14" />
                <span>CRUSH SPACE OYNA</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
