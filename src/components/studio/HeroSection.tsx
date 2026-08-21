import React from 'react';
import { Play, Sparkles, Shield, Zap, ArrowDown, Activity } from 'lucide-react';

interface HeroSectionProps {
  onPlayClick: () => void;
  onExploreLabClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onPlayClick,
  onExploreLabClick
}) => {
  return (
    <section id="hero" className="studio-hero-section">
      {/* Dynamic Background Cyber Mesh & Radial Glows */}
      <div className="hero-cyber-grid" />
      <div className="hero-glow-orb hero-glow-1" />
      <div className="hero-glow-orb hero-glow-2" />

      <div className="hero-container">
        {/* Top Badge */}
        <div className="hero-badge">
          <span className="badge-pulse-dot" />
          <span className="badge-text">NEXT-GEN ARCADE & LANE DEFENSE STUDIO</span>
          <span className="badge-highlight">v1.0 CANLI</span>
        </div>

        {/* Main Headline */}
        <h1 className="hero-main-title">
          GÖKYÜZÜNÜN ÖTESİNDE, <br />
          <span className="hero-title-gradient">SAVUNMA VE EŞLEŞTİRME.</span>
        </h1>

        {/* Subtitle Description */}
        <p className="hero-subtitle">
          <strong>Hyperdusk Games</strong>, saf 60 FPS Canvas mühendisliğiyle refleksleri ve derin uzay stratejisini
          birleştiren yeni nesil sci-fi arcade deneyimleri tasarlar. Sıfır yükleme süresiyle doğrudan tarayıcında oyna.
        </p>

        {/* Action Buttons */}
        <div className="hero-cta-group">
          <button className="hero-primary-btn" onClick={onPlayClick}>
            <div className="btn-icon-wrapper">
              <Play size={20} fill="#070a14" />
            </div>
            <div className="btn-text-block">
              <span className="btn-main-label">CRUSH SPACE OYNA</span>
              <span className="btn-sub-label">Tarayıcıda Anında Başla</span>
            </div>
            <div className="btn-hover-shimmer" />
          </button>

          <button className="hero-secondary-btn" onClick={onExploreLabClick}>
            <Sparkles size={18} className="btn-sec-icon" />
            <span>21 ÇEKİRDEĞİ İNCELE</span>
          </button>
        </div>

        {/* Feature Badges Grid */}
        <div className="hero-stats-strip">
          <div className="stat-card">
            <div className="stat-icon-box cyan">
              <Zap size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">60 FPS</span>
              <span className="stat-label">Saf Donanım Motoru</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-box purple">
              <Sparkles size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">21 CORE</span>
              <span className="stat-label">Sinerjik Crush Cores</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-box green">
              <Shield size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">8 ŞERİT</span>
              <span className="stat-label">Gerçek Zamanlı Defans</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-box gold">
              <Activity size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">CROSS-PLAY</span>
              <span className="stat-label">Web & Mobil Uyumlu</span>
            </div>
          </div>
        </div>

        {/* Scroll down indicator */}
        <div className="hero-scroll-indicator" onClick={onExploreLabClick}>
          <span className="scroll-text">AŞAĞI KAYDIR</span>
          <ArrowDown size={16} className="scroll-arrow" />
        </div>
      </div>
    </section>
  );
};
