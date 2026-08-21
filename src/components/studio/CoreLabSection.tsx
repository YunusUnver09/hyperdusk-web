import React, { useState } from 'react';
import type { GemType } from '../../game/types';
import { GEM_ELEMENTS, ALL_CRUSH_CORES } from '../../game/constants';
import {
  Sparkles,
  Flame,
  Snowflake,
  Zap,
  Orbit,
  Bomb,
  Shield,
  Sun,
  Atom,
  Clock,
  Biohazard,
  Radio,
  Activity,
  Anchor,
  Copy,
  Compass,
  Bug,
  Disc,
  Satellite,
  Star,
  Play,
  Crosshair
} from 'lucide-react';

interface CoreLabSectionProps {
  onPlayWithCore: (coreType: GemType) => void;
}

export const CoreLabSection: React.FC<CoreLabSectionProps> = ({ onPlayWithCore }) => {
  const [selectedCore, setSelectedCore] = useState<GemType>('plasma');

  const coreConfig = GEM_ELEMENTS[selectedCore];

  const renderIcon = (type: GemType, size: number = 18) => {
    switch (type) {
      case 'plasma': return <Flame size={size} color="#ffffff" />;
      case 'cryo': return <Snowflake size={size} color="#ffffff" />;
      case 'electric': return <Zap size={size} color="#ffffff" />;
      case 'void': return <Orbit size={size} color="#ffffff" />;
      case 'explosive': return <Bomb size={size} color="#ffffff" />;
      case 'nano': return <Shield size={size} color="#ffffff" />;
      case 'solaris': return <Sun size={size} color="#ffffff" />;
      case 'antimatter': return <Atom size={size} color="#ffffff" />;
      case 'chronos': return <Clock size={size} color="#ffffff" />;
      case 'toxic': return <Biohazard size={size} color="#ffffff" />;
      case 'gravity': return <Radio size={size} color="#ffffff" />;
      case 'vampiric': return <Activity size={size} color="#ffffff" />;
      case 'prism': return <Sparkles size={size} color="#ffffff" />;
      case 'anchor': return <Anchor size={size} color="#ffffff" />;
      case 'echo': return <Copy size={size} color="#ffffff" />;
      case 'wormhole': return <Compass size={size} color="#ffffff" />;
      case 'parasite': return <Bug size={size} color="#ffffff" />;
      case 'static_web': return <Disc size={size} color="#ffffff" />;
      case 'orbital_drone': return <Satellite size={size} color="#ffffff" />;
      case 'supernova': return <Star size={size} color="#ffffff" />;
      default: return <Sparkles size={size} color="#ffffff" />;
    }
  };

  return (
    <section id="core-lab" className="studio-section core-lab-section">
      <div className="section-header-wrap">
        <div className="section-tag-badge purple">
          <Sparkles size={14} />
          <span>İNTERAKTİF LABORATUVAR</span>
        </div>
        <h2 className="section-title">
          20 CRUSH CORE: <span className="title-highlight purple">KUANTUM ÇEKİRDEK SİSTEMİ</span>
        </h2>
        <p className="section-desc">
          Her Crush Core, taretinizi farklı bir kuantum silahına dönüştürür. Çekirdekleri seçerek taktiksel özelliklerini,
          taret tiplerini ve hasar profillerini inceleyin.
        </p>
      </div>

      <div className="core-lab-container">
        {/* Left: Core Selector Grid */}
        <div className="core-selector-panel">
          <div className="core-selector-header">
            <span className="selector-title">ÇEKİRDEK SEÇİCİ</span>
            <span className="selector-counter">{ALL_CRUSH_CORES.length} ADET AKTİF</span>
          </div>

          <div className="core-chips-grid">
            {ALL_CRUSH_CORES.map((coreKey) => {
              const cfg = GEM_ELEMENTS[coreKey];
              const isSelected = selectedCore === coreKey;
              return (
                <button
                  key={coreKey}
                  onClick={() => setSelectedCore(coreKey)}
                  className={`core-chip-btn ${isSelected ? 'active' : ''}`}
                  style={{
                    borderColor: isSelected ? cfg.color : 'rgba(255, 255, 255, 0.1)',
                    boxShadow: isSelected ? `0 0 16px ${cfg.color}55` : 'none'
                  }}
                >
                  <div className={`gem-tile ${coreKey} core-chip-sphere`}>
                    <div className="sphere-inner-specular" />
                    <div className="gem-icon-container">
                      {renderIcon(coreKey, 14)}
                    </div>
                  </div>
                  <span className="core-chip-name">{cfg.turkishName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed Core Holographic Inspector */}
        <div className="core-inspector-panel">
          <div className="inspector-card">
            {/* Top Bar with Status */}
            <div className="inspector-top-bar">
              <div className="core-type-tag" style={{ color: coreConfig.color }}>
                {renderIcon(selectedCore, 16)}
                <span>{coreConfig.name.toUpperCase()}</span>
              </div>
              <span className="core-cost-badge">
                {coreConfig.isUnlockedByDefault ? 'VARSAYILAN BAŞLANGIÇ' : `${coreConfig.unlockCost} 💎 FRAGMENT`}
              </span>
            </div>

            {/* Main Hologram Showcase */}
            <div className="inspector-hologram-stage">
              <div className="holo-grid-plane" />
              <div className="holo-rings-wrapper">
                <div className="holo-ring outer" style={{ borderColor: `${coreConfig.color}44` }} />
                <div className="holo-ring inner" style={{ borderColor: `${coreConfig.color}88` }} />
              </div>

              {/* Large 3D Volumetric Sphere */}
              <div className={`gem-tile ${selectedCore} inspector-large-sphere`}>
                <div className="sphere-inner-specular" />
                <div className="sphere-glow-layer" style={{ boxShadow: `0 0 35px ${coreConfig.color}aa` }} />
                <div className="gem-icon-container">
                  {renderIcon(selectedCore, 38)}
                </div>
              </div>
            </div>

            {/* Core Info Readout */}
            <div className="inspector-info-body">
              <div className="info-title-row">
                <h3 className="core-inspect-name" style={{ color: coreConfig.color }}>
                  {coreConfig.turkishName}
                </h3>
                <div className="turret-badge">
                  <Crosshair size={14} />
                  <span>{coreConfig.turretType}</span>
                </div>
              </div>

              <div className="info-field-group">
                <label>TEMEL SİLAH MEKANİĞİ</label>
                <p className="mechanic-text">{coreConfig.description}</p>
              </div>

              <div className="info-field-group">
                <label>KUANTUM LORE & DOKÜMANTASYON</label>
                <p className="lore-text">{coreConfig.lore}</p>
              </div>
            </div>

            {/* Play Button Action */}
            <div className="inspector-actions">
              <button
                className="inspect-play-btn"
                style={{
                  background: `linear-gradient(135deg, ${coreConfig.color}, #070a14)`,
                  borderColor: coreConfig.color
                }}
                onClick={() => onPlayWithCore(selectedCore)}
              >
                <Play size={18} fill="#ffffff" />
                <span>BU ÇEKİRDEKLE OYUNA BAŞLA</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
