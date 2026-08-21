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
  ShieldCheck,
  Play,
  Crosshair
} from 'lucide-react';

interface CoreLabSectionProps {
  onPlayWithCore: (coreType: GemType) => void;
}

export const CoreLabSection: React.FC<CoreLabSectionProps> = ({ onPlayWithCore }) => {
  const [selectedCore, setSelectedCore] = useState<GemType>('plasma');

  const coreConfig = GEM_ELEMENTS[selectedCore];

  const CORE_ICON_TINTS: Record<GemType, string> = {
    plasma: '#fecaca',
    cryo: '#cffafe',
    electric: '#fef08a',
    void: '#e9d5ff',
    explosive: '#fed7aa',
    nano: '#a7f3d0',
    solaris: '#fde68a',
    antimatter: '#fbcfe8',
    chronos: '#bfdbfe',
    toxic: '#d9f99d',
    gravity: '#c7d2fe',
    vampiric: '#fecdd3',
    prism: '#ffffff',
    anchor: '#fef08a',
    echo: '#f8fafc',
    wormhole: '#99f6e4',
    parasite: '#f5d0fe',
    deflector: '#a7f3d0',
    static_web: '#bae6fd',
    orbital_drone: '#e2e8f0',
    supernova: '#fef9c3'
  };

  const renderIcon = (type: GemType, size: number = 18) => {
    const iconColor = CORE_ICON_TINTS[type] || '#ffffff';
    switch (type) {
      case 'plasma': return <Flame size={size} color={iconColor} />;
      case 'cryo': return <Snowflake size={size} color={iconColor} />;
      case 'electric': return <Zap size={size} color={iconColor} />;
      case 'void': return <Orbit size={size} color={iconColor} />;
      case 'explosive': return <Bomb size={size} color={iconColor} />;
      case 'nano': return <Shield size={size} color={iconColor} />;
      case 'solaris': return <Sun size={size} color={iconColor} />;
      case 'antimatter': return <Atom size={size} color={iconColor} />;
      case 'chronos': return <Clock size={size} color={iconColor} />;
      case 'toxic': return <Biohazard size={size} color={iconColor} />;
      case 'gravity': return <Radio size={size} color={iconColor} />;
      case 'vampiric': return <Activity size={size} color={iconColor} />;
      case 'prism': return <Sparkles size={size} color={iconColor} />;
      case 'anchor': return <Anchor size={size} color={iconColor} />;
      case 'echo': return <Copy size={size} color={iconColor} />;
      case 'wormhole': return <Compass size={size} color={iconColor} />;
      case 'parasite': return <Bug size={size} color={iconColor} />;
      case 'static_web': return <Disc size={size} color={iconColor} />;
      case 'orbital_drone': return <Satellite size={size} color={iconColor} />;
      case 'supernova': return <Star size={size} color={iconColor} />;
      case 'deflector': return <ShieldCheck size={size} color={iconColor} />;
      default: return <Sparkles size={size} color={iconColor} />;
    }
  };

  const renderCoreElementAura = (type: GemType) => {
    switch (type) {
      case 'electric':
        return (
          <span className="core-element-aura aura-electric">
            <span className="spark-arc spark-1" />
            <span className="spark-arc spark-2" />
            <span className="spark-zap-node" />
          </span>
        );
      case 'plasma':
        return (
          <span className="core-element-aura aura-plasma">
            <span className="plasma-flame-flicker" />
          </span>
        );
      case 'cryo':
        return (
          <span className="core-element-aura aura-cryo">
            <span className="cryo-frost-sparkle glint-1" />
            <span className="cryo-frost-sparkle glint-2" />
          </span>
        );
      case 'void':
        return (
          <span className="core-element-aura aura-void">
            <span className="void-singularity-orbit" />
          </span>
        );
      case 'toxic':
        return (
          <span className="core-element-aura aura-toxic">
            <span className="toxic-vapor-bubble b1" />
            <span className="toxic-vapor-bubble b2" />
          </span>
        );
      case 'solaris':
        return (
          <span className="core-element-aura aura-solaris">
            <span className="solaris-corona-ray" />
          </span>
        );
      case 'explosive':
        return (
          <span className="core-element-aura aura-explosive">
            <span className="explosive-ember-glint" />
          </span>
        );
      default:
        return <span className={`core-element-aura aura-${type}`} />;
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
          21 CRUSH CORE: <span className="title-highlight purple">KUANTUM ÇEKİRDEK SİSTEMİ</span>
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
                    <span className="sphere-specular-gloss" />
                    <span className="core-rim-glow-ring" />
                    {renderCoreElementAura(coreKey)}
                    <div className="sphere-icon-wrap">
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
                <span className="sphere-specular-gloss" />
                <span className="core-rim-glow-ring" />
                {renderCoreElementAura(selectedCore)}
                <div className="sphere-icon-wrap">
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
