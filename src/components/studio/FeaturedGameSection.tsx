import React from 'react';
import { Play, Shield, Zap, Crosshair, Cpu, Award, Orbit, ArrowRight } from 'lucide-react';

interface FeaturedGameSectionProps {
  onPlayClick: () => void;
}

export const FeaturedGameSection: React.FC<FeaturedGameSectionProps> = ({ onPlayClick }) => {
  const gameHighlights = [
    {
      icon: <Crosshair size={22} color="#00f3ff" />,
      title: '8-Şerit Hibrit Muharebe',
      desc: 'Her dikey ve yatay eşleşme, 8 savunma şeridindeki taretleri anında ateşleyerek iniş yapan düşman filolarını yok eder.'
    },
    {
      icon: <Cpu size={22} color="#a855f7" />,
      title: '20 Eşsiz Crush Core',
      desc: 'Süpernova Çekirdeği, Plazma, Yörünge Dronu, Spektrum Duvarı, Kriyojenik Stasis ve Nanit Parazit gibi sinerjik çekirdeklerle savaş alanını yönetin.'
    },
    {
      icon: <Orbit size={22} color="#ffd000" />,
      title: 'Çekirdek Ocağı & Motoru',
      desc: 'Bölümleri geçerek kazandığınız Core Fragment parçacıklarıyla yeni çekirdekler dövün ve 6 aktif yuvanızı özelleştirin.'
    },
    {
      icon: <Shield size={22} color="#00ff88" />,
      title: 'Devasa Boss Savaşları',
      desc: 'Çoklu şeritleri kaplayan devasa Boss amiral gemileri, kalkan aşındırıcılar ve özel zaman bükücü yeteneklerle yüzleşin.'
    }
  ];

  return (
    <section id="featured" className="studio-section featured-section">
      <div className="section-header-wrap">
        <div className="section-tag-badge">
          <Zap size={14} />
          <span>ÖNE ÇIKAN OYUN</span>
        </div>
        <h2 className="section-title">
          CRUSH SPACE: <span className="title-highlight">LANE DEFENSE & MATCH-3</span>
        </h2>
        <p className="section-desc">
          Refleks tabanlı 8x8 taktiksel eşleştirme mekaniklerinin 8-şerit gerçek zamanlı istasyon savunmasıyla birleştiği
          yüksek tempolu uzay arcade deneyimi.
        </p>
      </div>

      <div className="featured-showcase-grid">
        {/* Left: Arcade Visual Presentation */}
        <div className="showcase-arcade-card">
          <div className="arcade-screen-header">
            <div className="arcade-status-dots">
              <span className="dot red" />
              <span className="dot yellow" />
              <span className="dot green" />
            </div>
            <span className="arcade-title-text">HYPERDUSK ARCADE BOOTH // LIVE GAMEPLAY</span>
            <span className="arcade-fps-tag">60 FPS WEB READY</span>
          </div>

          <div className="arcade-preview-viewport">
            <div className="preview-space-bg" />
            
            {/* Visual game mockup scene */}
            <div className="mockup-battlefield-layer">
              <div className="mockup-enemy scout" style={{ left: '20%', top: '25%' }} />
              <div className="mockup-enemy dreadnought" style={{ left: '50%', top: '15%' }} />
              <div className="mockup-enemy bomber" style={{ left: '80%', top: '35%' }} />
              
              {/* Laser beams */}
              <div className="mockup-laser beam-cyan" style={{ left: '25%' }} />
              <div className="mockup-laser beam-purple" style={{ left: '50%' }} />
              <div className="mockup-laser beam-gold" style={{ left: '75%' }} />

              {/* Station Shield */}
              <div className="mockup-shield-barrier" />
            </div>

            {/* Match-3 grid preview overlay */}
            <div className="mockup-grid-layer">
              <div className="mockup-gem-row">
                <div className="mockup-gem gem-plasma" />
                <div className="mockup-gem gem-cryo" />
                <div className="mockup-gem gem-electric" />
                <div className="mockup-gem gem-void" />
                <div className="mockup-gem gem-solaris" />
                <div className="mockup-gem gem-drone" />
              </div>
            </div>

            {/* Play Overlay Button */}
            <div className="arcade-play-overlay">
              <button className="arcade-launch-btn" onClick={onPlayClick}>
                <div className="launch-icon-circle">
                  <Play size={28} fill="#070a14" />
                </div>
                <div className="launch-text-wrap">
                  <span className="launch-title">ŞİMDİ CANLI OYNA</span>
                  <span className="launch-sub">Tek Tıkla Tarayıcıda Başlat</span>
                </div>
              </button>
            </div>
          </div>

          <div className="arcade-card-footer">
            <div className="footer-feature-item">
              <Award size={16} color="#ffd000" />
              <span>100+ Sektör Seviyesi</span>
            </div>
            <div className="footer-feature-item">
              <Zap size={16} color="#00f3ff" />
              <span>Sıfır Kurulum</span>
            </div>
            <div className="footer-feature-item">
              <Shield size={16} color="#00ff88" />
              <span>Dokunmatik & Fare Uyumlu</span>
            </div>
          </div>
        </div>

        {/* Right: Key Feature Cards */}
        <div className="showcase-features-list">
          {gameHighlights.map((feat, idx) => (
            <div key={idx} className="feature-card">
              <div className="feature-icon-wrapper">
                {feat.icon}
              </div>
              <div className="feature-text-content">
                <h3 className="feature-card-title">{feat.title}</h3>
                <p className="feature-card-desc">{feat.desc}</p>
              </div>
            </div>
          ))}

          {/* Quick Launch CTA Banner */}
          <div className="feature-cta-banner">
            <div className="cta-banner-text">
              <h4>Galaksiyi Korumaya Hazır mısın?</h4>
              <p>Herhangi bir indirme yapmadan doğrudan tarayıcında hemen oyna.</p>
            </div>
            <button className="cta-banner-btn" onClick={onPlayClick}>
              <span>OYNA</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
