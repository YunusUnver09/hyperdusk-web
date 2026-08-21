import React, { useState } from 'react';
import type { GemType } from '../game/types';
import { GEM_ELEMENTS, FORGE_UNLOCKABLE_CORES } from '../game/constants';
import { coreManager } from '../game/coreManager';
import { gameEngine } from '../game/engine';
import { soundManager } from '../game/soundManager';
import {
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
  ShieldAlert,
  X,
  Lock,
  Check,
  Sparkles,
  Award
} from 'lucide-react';

interface CoreForgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  coreFragments: number;
}

export const CoreForgeModal: React.FC<CoreForgeModalProps> = ({ isOpen, onClose, coreFragments }) => {
  const [selectedCoreType, setSelectedCoreType] = useState<GemType>('solaris');

  if (!isOpen) return null;

  const renderCoreIcon = (type: GemType, size: number = 20) => {
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
      case 'deflector': return <ShieldAlert size={size} color="#ffffff" />;
      default: return <Sparkles size={size} color="#ffffff" />;
    }
  };

  const handleUnlock = (type: GemType) => {
    const config = GEM_ELEMENTS[type];
    if (!config) return;

    if (coreManager.unlockCore(type)) {
      soundManager.playVictory();
      gameEngine.syncUIState(true);
    } else {
      soundManager.playShieldHit();
    }
  };

  const selectedCore = GEM_ELEMENTS[selectedCoreType];
  const isSelectedUnlocked = coreManager.isCoreUnlocked(selectedCoreType);
  const canAffordSelected = coreFragments >= selectedCore.unlockCost;

  return (
    <div className="modal-overlay forge-modal-overlay" onClick={onClose}>
      <div className="forge-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="forge-modal-header">
          <div className="forge-title-box">
            <div className="forge-title-badge">
              <Sparkles size={16} color="#ffd000" />
              <span>ÇEKİRDEK OCAĞI</span>
            </div>
            <h2 className="forge-title-main">Yeni Crush Core Dövme İstasyonu</h2>
          </div>

          {/* Fragment Currency Pill */}
          <div className="forge-fragment-pill">
            <Award size={16} color="#00f3ff" />
            <div className="forge-fragment-value">
              <span>{coreFragments}</span>
              <small>PARÇACIK</small>
            </div>
          </div>

          <button className="modal-close-btn" onClick={onClose} title="Kapat">
            <X size={20} />
          </button>
        </div>

        {/* Main Content: Core Showcase Grid + Details Panel */}
        <div className="forge-modal-body">
          {/* Left / Top: 6 Forgeable Cores Grid */}
          <div className="forge-cores-grid">
            {FORGE_UNLOCKABLE_CORES.map((type) => {
              const core = GEM_ELEMENTS[type];
              const isUnlocked = coreManager.isCoreUnlocked(type);
              const isSelected = selectedCoreType === type;
              const canAfford = coreFragments >= core.unlockCost;

              return (
                <div
                  key={type}
                  className={`forge-core-card ${isSelected ? 'selected' : ''} ${isUnlocked ? 'unlocked' : 'locked'}`}
                  onClick={() => {
                    soundManager.playGemSwap();
                    setSelectedCoreType(type);
                  }}
                  style={{
                    borderColor: isSelected ? core.color : 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  {/* Sphere Avatar */}
                  <div
                    className="forge-core-sphere"
                    style={{
                      background: `linear-gradient(135deg, ${core.gradient[0]}, ${core.gradient[1]})`,
                      boxShadow: isUnlocked ? `0 0 15px ${core.glowColor}` : 'none'
                    }}
                  >
                    {renderCoreIcon(type, 22)}
                  </div>

                  {/* Core Info */}
                  <div className="forge-core-info">
                    <span className="forge-core-name">{core.turkishName}</span>
                    <span className="forge-core-type" style={{ color: core.color }}>
                      {core.turretType}
                    </span>
                  </div>

                  {/* Unlock Status Badge */}
                  <div className="forge-status-badge">
                    {isUnlocked ? (
                      <span className="badge-unlocked">
                        <Check size={12} /> AÇIK
                      </span>
                    ) : (
                      <span className={`badge-cost ${canAfford ? 'affordable' : ''}`}>
                        <Lock size={11} /> {core.unlockCost} 💎
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right / Bottom: Selected Core Detailed Inspector */}
          {selectedCore && (
            <div className="forge-inspector-panel">
              <div className="inspector-top-row">
                <div
                  className="inspector-sphere-preview"
                  style={{
                    background: `linear-gradient(135deg, ${selectedCore.gradient[0]}, ${selectedCore.gradient[1]})`,
                    boxShadow: `0 0 25px ${selectedCore.glowColor}`
                  }}
                >
                  {renderCoreIcon(selectedCoreType, 36)}
                </div>

                <div className="inspector-meta">
                  <span className="inspector-sub">{selectedCore.turretType}</span>
                  <h3 className="inspector-title" style={{ color: selectedCore.color }}>
                    {selectedCore.turkishName}
                  </h3>
                  <span className="inspector-eng-name">{selectedCore.name}</span>
                </div>
              </div>

              {/* Ability Description */}
              <div className="inspector-desc-box">
                <span className="desc-label">SAVAŞ YETENEĞİ & ETKİSİ:</span>
                <p>{selectedCore.description}</p>
              </div>

              {/* Lore Quote */}
              <div className="inspector-lore-box">
                <p>"{selectedCore.lore}"</p>
              </div>

              {/* Action Button */}
              <div className="inspector-action-row">
                {isSelectedUnlocked ? (
                  <div className="inspector-unlocked-banner">
                    <Check size={18} color="#00ff88" />
                    <span>BU CRUSH CORE KULLANIMA HAZIR! Çekirdek Motorundan kuşanabilirsiniz.</span>
                  </div>
                ) : (
                  <button
                    className={`forge-unlock-action-btn ${canAffordSelected ? 'ready' : 'disabled'}`}
                    disabled={!canAffordSelected}
                    onClick={() => handleUnlock(selectedCoreType)}
                    style={{
                      background: canAffordSelected
                        ? `linear-gradient(90deg, ${selectedCore.gradient[0]}, ${selectedCore.gradient[1]})`
                        : undefined
                    }}
                  >
                    <Sparkles size={18} />
                    <span>
                      {canAffordSelected
                        ? `KİLİDİ AÇ (${selectedCore.unlockCost} PARÇACIK)`
                        : `YETERSİZ PARÇACIK (${coreFragments} / ${selectedCore.unlockCost} 💎)`}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
