import React, { useState, useRef, useEffect } from 'react';
import { LEVELS } from '../game/levelData';
import type { LevelConfig } from '../game/types';
import { soundManager } from '../game/soundManager';
import { coreManager } from '../game/coreManager';
import { CoreForgeModal } from './CoreForgeModal';
import { CoreEngineModal } from './CoreEngineModal';
import {
  Lock,
  Check,
  Star,
  Play,
  ArrowLeft,
  Skull,
  Shield,
  Zap,
  ChevronRight,
  Award,
  Sparkles,
  Cpu
} from 'lucide-react';

interface LevelMapProps {
  unlockedLevel: number;
  currentLevel: number;
  highScore: number;
  coreFragments?: number;
  onSelectLevel: (levelId: number) => void;
  onBackToMenu: () => void;
}

// Visual Node Coordinates (percentage coordinates for responsive vertical winding path)
// Levels start from 1 (bottom) to 8 (top)
const NODE_COORDINATES = [
  { levelId: 1, x: 50, y: 88 },
  { levelId: 2, x: 26, y: 76 },
  { levelId: 3, x: 74, y: 64 },
  { levelId: 4, x: 30, y: 52 }, // Mini Boss Sector
  { levelId: 5, x: 70, y: 40 },
  { levelId: 6, x: 25, y: 28 },
  { levelId: 7, x: 68, y: 16 },
  { levelId: 8, x: 50, y: 5 }   // Final Boss Sector
];

const LevelMapComponent: React.FC<LevelMapProps> = ({
  unlockedLevel,
  coreFragments,
  onSelectLevel,
  onBackToMenu
}) => {
  const [selectedLevelId, setSelectedLevelId] = useState<number>(() =>
    Math.min(unlockedLevel, LEVELS.length)
  );
  const [showLevelCard, setShowLevelCard] = useState<boolean>(false);
  const [activeLevelForCard, setActiveLevelForCard] = useState<LevelConfig | null>(null);

  // Modals for Core Forge (Left) & Core Engine (Right)
  const [showForgeModal, setShowForgeModal] = useState<boolean>(false);
  const [showEngineModal, setShowEngineModal] = useState<boolean>(false);

  // Spaceship Animation & Launch Transition State
  const [shipPos, setShipPos] = useState<{ x: number; y: number }>(() => {
    const initialCoords = NODE_COORDINATES.find(n => n.levelId === Math.min(unlockedLevel, LEVELS.length)) || NODE_COORDINATES[0];
    return { x: initialCoords.x, y: initialCoords.y };
  });
  const [isTraveling, setIsTraveling] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [shipAngle, setShipAngle] = useState(-90); // Angle facing upwards initially

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Play Map Theme ("Fractured Space-Time")
  useEffect(() => {
    soundManager.playMapTheme();
  }, []);

  // Auto-scroll down to the player's current unlocked level initially
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.scrollTop = container.scrollHeight * 0.55;
    }
  }, []);

  const handleNodeClick = (level: LevelConfig) => {
    if (isTraveling || isLaunching) return;

    if (level.id > unlockedLevel) {
      soundManager.playShieldHit();
      return;
    }

    soundManager.playGemSwap();
    setSelectedLevelId(level.id);
    setActiveLevelForCard(level);
    setShowLevelCard(true);
  };

  const handleStartMission = (targetLevelId: number) => {
    if (isTraveling || isLaunching) return;

    setIsLaunching(true);
    soundManager.playLaser();

    // Source position
    const sourceNode = NODE_COORDINATES.find(n => n.levelId === (selectedLevelId || unlockedLevel)) || NODE_COORDINATES[0];
    const targetNode = NODE_COORDINATES.find(n => n.levelId === targetLevelId) || NODE_COORDINATES[0];

    const dx = targetNode.x - sourceNode.x;
    const dy = targetNode.y - sourceNode.y;
    const distance = Math.hypot(dx, dy);

    if (distance > 2) {
      const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      setShipAngle(angleDeg);
      setIsTraveling(true);

      const startTime = performance.now();
      const duration = 400;

      const animateFlight = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);
        const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const curX = sourceNode.x + dx * easeT;
        const curY = sourceNode.y + dy * easeT;
        setShipPos({ x: curX, y: curY });

        if (t < 1) {
          requestAnimationFrame(animateFlight);
        } else {
          setIsTraveling(false);
          soundManager.playVictory();
          setTimeout(() => {
            onSelectLevel(targetLevelId);
          }, 350);
        }
      };

      requestAnimationFrame(animateFlight);
    } else {
      soundManager.playVictory();
      setTimeout(() => {
        onSelectLevel(targetLevelId);
      }, 350);
    }
  };

  // Generate SVG Bezier Path connecting nodes sequentially (1 -> 2 -> 3 -> ... -> 8)
  const generatePathD = () => {
    if (NODE_COORDINATES.length === 0) return '';
    let d = `M ${NODE_COORDINATES[0].x} ${NODE_COORDINATES[0].y}`;
    for (let i = 1; i < NODE_COORDINATES.length; i++) {
      const prev = NODE_COORDINATES[i - 1];
      const cur = NODE_COORDINATES[i];
      const cx1 = prev.x;
      const cy1 = (prev.y + cur.y) / 2;
      const cx2 = cur.x;
      const cy2 = (prev.y + cur.y) / 2;
      d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${cur.x} ${cur.y}`;
    }
    return d;
  };

  return (
    <div className="level-map-container">
      {/* 1. Header Bar */}
      <div className="map-header">
        <button
          className="map-back-btn"
          onClick={() => {
            soundManager.playGemSwap();
            onBackToMenu();
          }}
          title="Ana Menüye Dön"
        >
          <ArrowLeft size={18} />
          <span>MENÜ</span>
        </button>

        <div className="map-title-box">
          <span className="map-title-main">SEKTÖR HARİTASI</span>
          <span className="map-title-sub">UZAY SAVUNMA HATTI</span>
        </div>

        <div className="map-stat-badge">
          <Award size={14} color="#ffd000" />
          <span>{unlockedLevel} / {LEVELS.length}</span>
        </div>
      </div>

      {/* 2. Scrollable Galaxy Path Map */}
      <div className="map-scroll-area" ref={scrollContainerRef}>
        <div className="map-canvas-viewport">
          {/* Animated Background Cosmic Dust / Grid */}
          <div className="map-nebula-bg" />

          {/* SVG Connection Energy Lines */}
          <svg
            className="map-svg-connections"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="unlockedPathGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#00f3ff" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#ffd000" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#ff0055" stopOpacity="0.95" />
              </linearGradient>
            </defs>

            {/* Base Background Path (dimmed) */}
            <path
              d={generatePathD()}
              fill="none"
              stroke="rgba(0, 243, 255, 0.12)"
              strokeWidth="2.2"
              strokeDasharray="3, 3"
              strokeLinecap="round"
            />

            {/* Glowing Active Conduits connecting unlocked nodes (Hardware accelerated layered stroke) */}
            {NODE_COORDINATES.slice(0, Math.min(unlockedLevel, NODE_COORDINATES.length)).map((_, idx, arr) => {
              if (idx === 0) return null;
              const prev = arr[idx - 1];
              const cur = arr[idx];
              const pD = `M ${prev.x} ${prev.y} C ${prev.x} ${(prev.y + cur.y) / 2}, ${cur.x} ${(prev.y + cur.y) / 2}, ${cur.x} ${cur.y}`;
              return (
                <g key={`active_path_group_${idx}`}>
                  {/* Outer soft ambient glow line */}
                  <path
                    d={pD}
                    fill="none"
                    stroke="url(#unlockedPathGrad)"
                    strokeWidth="5"
                    strokeOpacity="0.35"
                    strokeLinecap="round"
                  />
                  {/* Inner vibrant moving laser pulses */}
                  <path
                    d={pD}
                    fill="none"
                    stroke="url(#unlockedPathGrad)"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    className="map-energy-conduit-pulse"
                  />
                </g>
              );
            })}
          </svg>

          {/* 3. Level Circular Nodes */}
          {LEVELS.map((level) => {
            const coord = NODE_COORDINATES.find(n => n.levelId === level.id) || { x: 50, y: 50 };
            const isUnlocked = level.id <= unlockedLevel;
            const isCompleted = level.id < unlockedLevel;
            const isCurrent = level.id === unlockedLevel;
            const isSelected = level.id === selectedLevelId;
            const isFinalBoss = level.id === 8;
            const isMidBoss = level.id === 4;

            return (
              <div
                key={level.id}
                className="map-node-wrapper"
                style={{
                  left: `${coord.x}%`,
                  top: `${coord.y}%`
                }}
              >
                {/* Node Outer Halo Glow */}
                {isCurrent && <div className="map-node-pulse-ring" />}

                {/* Circular Level Button */}
                <button
                  className={`map-node-btn ${isUnlocked ? 'unlocked' : 'locked'} ${
                    isCompleted ? 'completed' : ''
                  } ${isCurrent ? 'current' : ''} ${isSelected ? 'selected' : ''} ${
                    isFinalBoss ? 'final-boss' : isMidBoss ? 'mid-boss' : ''
                  }`}
                  onClick={() => handleNodeClick(level)}
                  style={{
                    borderColor: isUnlocked ? level.themeColor : 'rgba(100, 116, 139, 0.4)'
                  }}
                  title={level.name}
                >
                  {isUnlocked ? (
                    isCompleted ? (
                      <div className="node-content completed">
                        <span className="node-lvl-num">{level.id}</span>
                        <Check size={14} className="node-check-icon" />
                      </div>
                    ) : (
                      <div className="node-content active">
                        <span className="node-lvl-num">{level.id}</span>
                        {isFinalBoss ? (
                          <Skull size={14} color="#ff0055" />
                        ) : isMidBoss ? (
                          <Zap size={14} color="#ffd000" />
                        ) : (
                          <Star size={12} color="#00f3ff" />
                        )}
                      </div>
                    )
                  ) : (
                    <div className="node-content locked">
                      <Lock size={16} color="#64748b" />
                      <span className="node-locked-num">{level.id}</span>
                    </div>
                  )}
                </button>

                {/* Level Node Label */}
                <div className={`map-node-label ${isUnlocked ? 'active' : 'locked'}`}>
                  <span className="node-label-title">BÖLÜM {level.id}</span>
                  {isFinalBoss ? (
                    <span className="node-boss-tag final">SEKTÖR PATRONU</span>
                  ) : isMidBoss ? (
                    <span className="node-boss-tag mini">MİNİ BOSS</span>
                  ) : null}
                </div>
              </div>
            );
          })}

          {/* 4. Animated Spaceship Sprite on the Path */}
          <div
            className={`map-spaceship-avatar ${isTraveling ? 'traveling' : 'hovering'}`}
            style={{
              left: `${shipPos.x}%`,
              top: `${shipPos.y}%`,
              transform: `translate(-50%, -50%) rotate(${shipAngle}deg)`
            }}
          >
            {/* Thruster Flame & Energy Trail */}
            <div className="ship-engine-thruster" />
            <div className="ship-energy-shield-aura" />

            {/* Futuristic Vector Spaceship Hull */}
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              className="ship-svg-body"
            >
              {/* Wings & Hull */}
              <path
                d="M 18 2 L 32 30 L 25 26 L 18 34 L 11 26 L 4 30 Z"
                fill="#0f172a"
                stroke="#00f3ff"
                strokeWidth="1.8"
              />
              {/* Cockpit Canopy */}
              <polygon
                points="18,8 22,20 18,24 14,20"
                fill="#00f3ff"
                opacity="0.9"
              />
              {/* Neon Accent Lines */}
              <line x1="18" y1="2" x2="18" y2="24" stroke="#ffffff" strokeWidth="1" />
              <line x1="8" y1="28" x2="14" y2="26" stroke="#ff0055" strokeWidth="1.5" />
              <line x1="28" y1="28" x2="22" y2="26" stroke="#ff0055" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
      </div>

      {/* 5. Level Details Mission Launch Modal / Bottom Card */}
      {showLevelCard && activeLevelForCard && (
        <div
          className="map-mission-drawer-overlay"
          onClick={() => setShowLevelCard(false)}
        >
          <div
            className="map-mission-drawer"
            onClick={(e) => e.stopPropagation()}
            style={{
              borderColor: activeLevelForCard.themeColor,
              boxShadow: `0 0 30px ${activeLevelForCard.themeColor}33`
            }}
          >
            {/* Card Header */}
            <div className="drawer-header-row">
              <div>
                <span className="drawer-level-tag" style={{ color: activeLevelForCard.themeColor }}>
                  BÖLÜM {activeLevelForCard.id}
                </span>
                <h3 className="drawer-level-title">{activeLevelForCard.name}</h3>
                <span className="drawer-level-sub">{activeLevelForCard.subtitle}</span>
              </div>
              <button
                className="drawer-close-btn"
                onClick={() => setShowLevelCard(false)}
              >
                ✕
              </button>
            </div>

            <p className="drawer-level-desc">{activeLevelForCard.description}</p>

            {/* 8-Phase Mission Briefing Info */}
            <div className="drawer-briefing-grid">
              <div className="briefing-box">
                <Shield size={16} color="#00f3ff" />
                <div className="briefing-text">
                  <strong>8 FAZ</strong>
                  <span>Savunma Dalgası</span>
                </div>
              </div>

              <div className="briefing-box">
                <Zap size={16} color="#ffd000" />
                <div className="briefing-text">
                  <strong style={{ color: '#ffd000' }}>4. FAZ</strong>
                  <span>{activeLevelForCard.miniBossName}</span>
                </div>
              </div>

              <div className="briefing-box full-width">
                <Skull size={16} color="#ff0055" />
                <div className="briefing-text">
                  <strong style={{ color: '#ff0055' }}>8. FAZ (ANA BOSS)</strong>
                  <span>{activeLevelForCard.mainBossName}</span>
                </div>
              </div>
            </div>

            {/* Launch Button */}
            <button
              className="drawer-launch-btn"
              onClick={() => handleStartMission(activeLevelForCard.id)}
              style={{
                background: `linear-gradient(90deg, ${activeLevelForCard.gradient[0]}, ${activeLevelForCard.gradient[1]})`
              }}
            >
              <Play size={20} fill="#ffffff" color="#ffffff" />
              <span>GÖREVE BAŞLA</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* 6. Sol Kenar En Üst: ÇEKİRDEK OCAĞI Yan Butonu */}
      <button
        className="map-dock-side-btn left"
        onClick={() => {
          soundManager.playGemSwap();
          setShowForgeModal(true);
        }}
        title="Çekirdek Ocağı - Yeni Crush Core'lar Aç"
      >
        <div className="dock-btn-icon-wrap forge">
          <Sparkles size={16} color="#ffd000" />
        </div>
        <div className="dock-btn-text">
          <span className="dock-title-line">ÇEKİRDEK</span>
          <span className="dock-title-line">OCAĞI</span>
          <span className="dock-badge">💎 {coreFragments ?? coreManager.getFragments()}</span>
        </div>
      </button>

      {/* 7. Sağ Kenar En Üst: ÇEKİRDEK MOTORU Yan Butonu */}
      <button
        className="map-dock-side-btn right"
        onClick={() => {
          soundManager.playGemSwap();
          setShowEngineModal(true);
        }}
        title="Çekirdek Motoru - 6'lı Savaş Dizilimi ve Envanter"
      >
        <div className="dock-btn-icon-wrap engine">
          <Cpu size={16} color="#00f3ff" />
        </div>
        <div className="dock-btn-text">
          <span className="dock-title-line">ÇEKİRDEK</span>
          <span className="dock-title-line">MOTORU</span>
          <span className="dock-badge">DİZİLİM (6)</span>
        </div>
      </button>

      {/* 8. Çekirdek Ocağı Modal */}
      <CoreForgeModal
        isOpen={showForgeModal}
        onClose={() => setShowForgeModal(false)}
        coreFragments={coreFragments ?? coreManager.getFragments()}
      />

      {/* 9. Çekirdek Motoru Modal */}
      <CoreEngineModal
        isOpen={showEngineModal}
        onClose={() => setShowEngineModal(false)}
      />

      {/* Cinematic Launch Transition to Gameplay Curtain */}
      <div className={`map-launch-fade-curtain ${isLaunching ? 'active' : ''}`} />
    </div>
  );
};

export const LevelMap = React.memo(LevelMapComponent);

