import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SECTORS, LEVELS, getSectorLevels, getSectorConfig } from '../game/levelData';
import type { LevelConfig, SectorConfig } from '../game/types';
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
  Cpu,
  Biohazard,
  Clock,
  Crown,
  SkipForward
} from 'lucide-react';

interface LevelMapProps {
  unlockedLevel: number;
  currentLevel: number;
  highScore: number;
  coreFragments?: number;
  onSelectLevel: (levelId: number) => void;
  onBackToMenu: () => void;
  onDevSkipSector?: () => void;
}

// Visual Node Coordinates (percentage coordinates for responsive vertical winding path within a sector)
// Levels start from node index 0 (bottom: y: 88) to 7 (top: y: 6)
const SECTOR_NODE_COORDINATES = [
  { stepIndex: 0, x: 50, y: 88 },
  { stepIndex: 1, x: 26, y: 76 },
  { stepIndex: 2, x: 74, y: 64 },
  { stepIndex: 3, x: 30, y: 52 }, // Mini Boss Node (Wave 4)
  { stepIndex: 4, x: 70, y: 40 },
  { stepIndex: 5, x: 25, y: 28 },
  { stepIndex: 6, x: 68, y: 16 },
  { stepIndex: 7, x: 50, y: 6 }   // Sector Boss Node (Wave 8)
];

const LevelMapComponent: React.FC<LevelMapProps> = ({
  unlockedLevel,
  coreFragments,
  onSelectLevel,
  onBackToMenu,
  onDevSkipSector
}) => {
  // Determine initial sector from player's unlocked level
  const initialSectorId = useMemo(() => {
    if (unlockedLevel > 16) return 3;
    if (unlockedLevel > 8) return 2;
    return 1;
  }, [unlockedLevel]);

  const [activeSectorId, setActiveSectorId] = useState<number>(initialSectorId);
  const [devToast, setDevToast] = useState<string | null>(null);
  const [selectedLevelId, setSelectedLevelId] = useState<number>(() =>
    Math.min(unlockedLevel, LEVELS.length)
  );
  const [showLevelCard, setShowLevelCard] = useState<boolean>(false);
  const [activeLevelForCard, setActiveLevelForCard] = useState<LevelConfig | null>(null);

  // Modals for Core Forge (Left) & Core Engine (Right)
  const [showForgeModal, setShowForgeModal] = useState<boolean>(false);
  const [showEngineModal, setShowEngineModal] = useState<boolean>(false);

  const activeSector = useMemo<SectorConfig>(() => {
    return getSectorConfig(activeSectorId);
  }, [activeSectorId]);

  const currentSectorLevels = useMemo<LevelConfig[]>(() => {
    return getSectorLevels(activeSectorId);
  }, [activeSectorId]);

  // Spaceship Animation & Launch Transition State
  const [shipPos, setShipPos] = useState<{ x: number; y: number }>(() => {
    const currentLvlConfig = LEVELS.find(l => l.id === Math.min(unlockedLevel, LEVELS.length));
    if (currentLvlConfig && currentLvlConfig.sectorId === initialSectorId) {
      const stepIdx = (currentLvlConfig.id - 1) % 8;
      const coord = SECTOR_NODE_COORDINATES[stepIdx] || SECTOR_NODE_COORDINATES[0];
      return { x: coord.x, y: coord.y };
    }
    return { x: SECTOR_NODE_COORDINATES[0].x, y: SECTOR_NODE_COORDINATES[0].y };
  });

  const [isTraveling, setIsTraveling] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [shipAngle, setShipAngle] = useState(-90);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Play Map Theme
  useEffect(() => {
    soundManager.playMapTheme();
  }, []);

  // Update ship position when sector changes
  useEffect(() => {
    const relevantLevel = selectedLevelId >= activeSector.levelStart && selectedLevelId <= activeSector.levelEnd
      ? selectedLevelId
      : Math.min(unlockedLevel, activeSector.levelEnd);

    const stepIdx = Math.max(0, Math.min(7, (relevantLevel - 1) % 8));
    const coord = SECTOR_NODE_COORDINATES[stepIdx] || SECTOR_NODE_COORDINATES[0];
    setShipPos({ x: coord.x, y: coord.y });
  }, [activeSectorId, selectedLevelId, unlockedLevel, activeSector]);

  // Auto-scroll down towards the player's active level in this sector
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.scrollTop = container.scrollHeight * 0.52;
    }
  }, [activeSectorId]);

  const handleSectorTabClick = (sector: SectorConfig) => {
    if (isTraveling || isLaunching) return;

    if (unlockedLevel < sector.requiredLevel) {
      soundManager.playShieldHit();
      return;
    }

    soundManager.playGemSwap();
    setActiveSectorId(sector.id);
  };

  const handleDevSkipSector = () => {
    if (isTraveling || isLaunching) return;
    soundManager.playGemSwap();
    soundManager.playVictory();

    let targetSector = 2;
    if (activeSectorId === 1) targetSector = 2;
    else if (activeSectorId === 2) targetSector = 3;
    else targetSector = 1;

    if (onDevSkipSector) {
      onDevSkipSector();
    }

    setActiveSectorId(targetSector);
    const targetSectorConfig = getSectorConfig(targetSector);
    setDevToast(`⚡ GELİŞTİRİCİ: ${targetSectorConfig.name.toUpperCase()} AÇILDI!`);
    setTimeout(() => setDevToast(null), 2500);
  };

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

    const targetStepIdx = (targetLevelId - 1) % 8;
    const sourceStepIdx = ((selectedLevelId || unlockedLevel) - 1) % 8;

    const sourceNode = SECTOR_NODE_COORDINATES[sourceStepIdx] || SECTOR_NODE_COORDINATES[0];
    const targetNode = SECTOR_NODE_COORDINATES[targetStepIdx] || SECTOR_NODE_COORDINATES[0];

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

  // Generate SVG Bezier Path connecting nodes sequentially
  const generatePathD = () => {
    if (SECTOR_NODE_COORDINATES.length === 0) return '';
    let d = `M ${SECTOR_NODE_COORDINATES[0].x} ${SECTOR_NODE_COORDINATES[0].y}`;
    for (let i = 1; i < SECTOR_NODE_COORDINATES.length; i++) {
      const prev = SECTOR_NODE_COORDINATES[i - 1];
      const cur = SECTOR_NODE_COORDINATES[i];
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
          <span className="map-title-main">{activeSector.name.toUpperCase()}</span>
          <span className="map-title-sub">{activeSector.subtitle}</span>
        </div>

        <div className="map-stat-badge">
          <Award size={14} color="#ffd000" />
          <span>{unlockedLevel} / {LEVELS.length}</span>
        </div>
      </div>

      {/* 2. Interactive Sector Selector Tabs */}
      <div className="map-sector-tabs-container">
        {SECTORS.map((sec) => {
          const isUnlocked = unlockedLevel >= sec.requiredLevel;
          const isActive = sec.id === activeSectorId;
          const isCompleted = unlockedLevel > sec.levelEnd;

          return (
            <button
              key={sec.id}
              className={`map-sector-tab-btn ${isActive ? 'active' : ''} ${isUnlocked ? 'unlocked' : 'locked'} ${isCompleted ? 'completed' : ''}`}
              onClick={() => handleSectorTabClick(sec)}
              style={{
                borderColor: isActive ? sec.themeColor : undefined,
                boxShadow: isActive ? `0 0 16px ${sec.themeColor}44` : undefined
              }}
            >
              <div className="sector-tab-inner">
                {sec.id === 1 ? (
                  <Shield size={14} color={isUnlocked ? sec.themeColor : '#64748b'} />
                ) : sec.id === 2 ? (
                  <Biohazard size={14} color={isUnlocked ? sec.themeColor : '#64748b'} />
                ) : (
                  <Clock size={14} color={isUnlocked ? sec.themeColor : '#64748b'} />
                )}

                <span className="sector-tab-title">SEKTÖR {sec.id}</span>

                {!isUnlocked && (
                  <Lock size={12} className="sector-lock-icon" />
                )}

                {isCompleted && (
                  <Check size={12} color="#00ff88" className="sector-check-icon" />
                )}
              </div>
            </button>
          );
        })}

        {/* ⚡ Geliştirici Modu: Sonraki Sektöre Anında Atla */}
        <button
          className="map-sector-tab-btn dev-skip-btn"
          onClick={handleDevSkipSector}
          title="Geliştirici Modu: Sonraki Sektöre Anında Atla (Bölüm Kilitlerini Açar)"
        >
          <div className="sector-tab-inner">
            <SkipForward size={13} color="#fbbf24" />
            <span className="sector-tab-title" style={{ color: '#fbbf24' }}>DEV ⏭️</span>
          </div>
        </button>
      </div>

      {/* Dev Mode Notification Toast */}
      {devToast && (
        <div className="map-dev-toast">
          <Sparkles size={14} color="#ffd000" />
          <span>{devToast}</span>
        </div>
      )}

      {/* 3. Scrollable Galaxy Path Map */}
      <div className="map-scroll-area" ref={scrollContainerRef}>
        <div className="map-canvas-viewport">
          {/* Animated Background Cosmic Dust / Grid */}
          <div
            className="map-nebula-bg"
            style={{
              background: `radial-gradient(ellipse at 50% 45%, ${activeSector.themeColor}18 0%, rgba(4, 7, 20, 0.98) 75%)`
            }}
          />

          {/* SVG Connection Energy Lines */}
          <svg
            className="map-svg-connections"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="unlockedPathGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor={activeSector.gradient[0]} stopOpacity="0.95" />
                <stop offset="50%" stopColor="#ffd000" stopOpacity="0.95" />
                <stop offset="100%" stopColor={activeSector.themeColor} stopOpacity="0.95" />
              </linearGradient>
            </defs>

            {/* Base Background Path (dimmed) */}
            <path
              d={generatePathD()}
              fill="none"
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="2.2"
              strokeDasharray="3, 3"
              strokeLinecap="round"
            />

            {/* Glowing Active Conduits connecting unlocked nodes in this sector */}
            {SECTOR_NODE_COORDINATES.map((_, idx, arr) => {
              if (idx === 0) return null;
              const levelForCurNode = activeSector.levelStart + idx;
              if (levelForCurNode > unlockedLevel) return null;

              const prev = arr[idx - 1];
              const cur = arr[idx];
              const pD = `M ${prev.x} ${prev.y} C ${prev.x} ${(prev.y + cur.y) / 2}, ${cur.x} ${(prev.y + cur.y) / 2}, ${cur.x} ${cur.y}`;
              return (
                <g key={`active_path_group_${idx}`}>
                  <path
                    d={pD}
                    fill="none"
                    stroke="url(#unlockedPathGrad)"
                    strokeWidth="5"
                    strokeOpacity="0.35"
                    strokeLinecap="round"
                  />
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

          {/* 4. Level Circular Nodes */}
          {currentSectorLevels.map((level, stepIdx) => {
            const coord = SECTOR_NODE_COORDINATES[stepIdx] || { x: 50, y: 50 };
            const isUnlocked = level.id <= unlockedLevel;
            const isCompleted = level.id < unlockedLevel;
            const isCurrent = level.id === unlockedLevel;
            const isSelected = level.id === selectedLevelId;
            const isFinalBoss = stepIdx === 7;
            const isMidBoss = stepIdx === 3;
            const isUltimateBoss = level.id === 24;

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
                {isCurrent && <div className="map-node-pulse-ring" style={{ borderColor: level.themeColor }} />}

                {/* Circular Level Button */}
                <button
                  className={`map-node-btn ${isUnlocked ? 'unlocked' : 'locked'} ${
                    isCompleted ? 'completed' : ''
                  } ${isCurrent ? 'current' : ''} ${isSelected ? 'selected' : ''} ${
                    isUltimateBoss ? 'ultimate-boss' : isFinalBoss ? 'final-boss' : isMidBoss ? 'mid-boss' : ''
                  }`}
                  onClick={() => handleNodeClick(level)}
                  style={{
                    borderColor: isUnlocked ? level.themeColor : 'rgba(100, 116, 139, 0.4)',
                    boxShadow: isUnlocked && (isFinalBoss || isCurrent) ? `0 0 18px ${level.themeColor}66` : undefined
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
                        {isUltimateBoss ? (
                          <Crown size={15} color="#ffd000" />
                        ) : isFinalBoss ? (
                          <Skull size={14} color="#ff0055" />
                        ) : isMidBoss ? (
                          <Zap size={14} color="#ffd000" />
                        ) : (
                          <Star size={12} color={level.themeColor} />
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
                  {isUltimateBoss ? (
                    <span className="node-boss-tag ultimate" style={{ background: 'linear-gradient(90deg, #ffd000, #ff0055)' }}>
                      👑 NİHAİ PATRON
                    </span>
                  ) : isFinalBoss ? (
                    <span className="node-boss-tag final">SEKTÖR PATRONU</span>
                  ) : isMidBoss ? (
                    <span className="node-boss-tag mini">MİNİ BOSS</span>
                  ) : null}
                </div>
              </div>
            );
          })}

          {/* 5. Animated Spaceship Sprite on the Path */}
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
              <path
                d="M 18 2 L 32 30 L 25 26 L 18 34 L 11 26 L 4 30 Z"
                fill="#0f172a"
                stroke={activeSector.themeColor}
                strokeWidth="1.8"
              />
              <polygon
                points="18,8 22,20 18,24 14,20"
                fill={activeSector.themeColor}
                opacity="0.9"
              />
              <line x1="18" y1="2" x2="18" y2="24" stroke="#ffffff" strokeWidth="1" />
              <line x1="8" y1="28" x2="14" y2="26" stroke="#ff0055" strokeWidth="1.5" />
              <line x1="28" y1="28" x2="22" y2="26" stroke="#ff0055" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
      </div>

      {/* 6. Level Details Mission Launch Modal / Bottom Card */}
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
                  {activeLevelForCard.sectorName.toUpperCase()} • BÖLÜM {activeLevelForCard.id}
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

      {/* 7. Sol Kenar En Üst: ÇEKİRDEK OCAĞI Yan Butonu */}
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

      {/* 8. Sağ Kenar En Üst: ÇEKİRDEK MOTORU Yan Butonu */}
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

      {/* 9. Çekirdek Ocağı Modal */}
      <CoreForgeModal
        isOpen={showForgeModal}
        onClose={() => setShowForgeModal(false)}
        coreFragments={coreFragments ?? coreManager.getFragments()}
      />

      {/* 10. Çekirdek Motoru Modal */}
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
