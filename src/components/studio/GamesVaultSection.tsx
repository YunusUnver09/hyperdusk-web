import React from 'react';
import { Play, Sparkles, Clock, ArrowRight } from 'lucide-react';

interface GamesVaultSectionProps {
  onPlayGame: () => void;
}

export const GamesVaultSection: React.FC<GamesVaultSectionProps> = ({ onPlayGame }) => {
  const games = [
    {
      id: 'crush-space',
      title: 'CRUSH SPACE',
      genre: 'LANE DEFENSE // MATCH-3',
      status: 'CANLI & OYNANABİLİR',
      statusType: 'live',
      tagline: '8-Şerit Taktiksel İstasyon Savunması & 21 Crush Core Mekaniği.',
      desc: 'Her sütun eşleşmesinin taret ateşine dönüştüğü, dinamik boss savaşları ve derin core özelleştirmeleri içeren saf 60 FPS arcade deneyimi.',
      tags: ['60 FPS Canvas', '21 Cores', 'Web & Expo App', 'Boss Battles'],
      accentColor: '#00f3ff',
      isPlayable: true
    },
    {
      id: 'voidborne',
      title: 'PROJECT VOIDBORNE',
      genre: 'CO-OP SPACE EXTRACTION ROGUELIKE',
      status: 'ÇOK YAKINDA (2026)',
      statusType: 'upcoming',
      tagline: 'Derin Kuantum Çöküşlerinde Hayatta Kal ve Ekstraksiyon Sağla.',
      desc: 'Yıkılmış uzay istasyonlarına sızın, karanlık madde anomalilerini temizleyin ve taktiksel sinerjilerle ekibinizi tahliye edin.',
      tags: ['Co-op Multiplayer', 'Procedural Dungeons', 'Custom Ships'],
      accentColor: '#a855f7',
      isPlayable: false
    },
    {
      id: 'neon-drift',
      title: 'NEON DRIFT: OVERDRIVE',
      genre: 'CYBERPUNK ANTI-GRAV RACER',
      status: 'GELİŞTİRME AŞAMASINDA',
      statusType: 'in-dev',
      tagline: 'Işık Hızında Yerçekimsiz Siber Şehir Yarışları.',
      desc: 'Neon kanyonlar, hiper-akışkan manyetik virajlar ve dinamik synthwave ses paletiyle adrenalin dolu arcade yarış.',
      tags: ['Anti-Gravity', 'Synthwave OST', 'Track Builder'],
      accentColor: '#f43f5e',
      isPlayable: false
    }
  ];

  return (
    <section id="vault" className="studio-section vault-section">
      <div className="section-header-wrap">
        <div className="section-tag-badge gold">
          <Sparkles size={14} />
          <span>HYPERDUSK VAULT</span>
        </div>
        <h2 className="section-title">
          OYUN KATALOĞU & <span className="title-highlight gold">GELECEK PROJELER</span>
        </h2>
        <p className="section-desc">
          Hyperdusk Games imzasını taşıyan fütüristik evrenler, arcade saflığında oyun mekanikleri ve yüksek tempolu projelerimiz.
        </p>
      </div>

      <div className="vault-cards-grid">
        {games.map((game) => (
          <div
            key={game.id}
            className={`vault-game-card ${game.isPlayable ? 'playable-card' : ''}`}
            style={{
              borderColor: `${game.accentColor}44`,
              boxShadow: game.isPlayable ? `0 10px 30px ${game.accentColor}22` : 'none'
            }}
          >
            {/* Status Header */}
            <div className="card-top-header">
              <span
                className={`status-pill ${game.statusType}`}
                style={{
                  color: game.accentColor,
                  borderColor: `${game.accentColor}66`,
                  background: `${game.accentColor}18`
                }}
              >
                {game.statusType === 'live' && <span className="pulsing-live-orb" />}
                {game.status}
              </span>
              <span className="game-genre-tag">{game.genre}</span>
            </div>

            {/* Game Card Body */}
            <div className="card-content-body">
              <h3 className="game-card-title" style={{ color: game.accentColor }}>
                {game.title}
              </h3>
              <p className="game-tagline">{game.tagline}</p>
              <p className="game-description">{game.desc}</p>

              {/* Tag Badges */}
              <div className="game-tags-wrap">
                {game.tags.map((t, idx) => (
                  <span key={idx} className="game-tag-pill">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Card Action Footer */}
            <div className="card-footer-action">
              {game.isPlayable ? (
                <button
                  className="vault-play-btn"
                  style={{
                    background: `linear-gradient(135deg, ${game.accentColor}, #0f172a)`,
                    borderColor: game.accentColor
                  }}
                  onClick={onPlayGame}
                >
                  <Play size={18} fill="#ffffff" />
                  <span>HEMEN TARAYICIDA OYNA</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <div className="vault-locked-status">
                  <Clock size={16} color={game.accentColor} />
                  <span>GELİŞTİRME SÜRÜYOR // YAKINDA</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
