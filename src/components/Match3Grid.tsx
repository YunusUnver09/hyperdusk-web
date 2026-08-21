import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Gem, GemType, UIState } from '../game/types';
import { gameEngine } from '../game/engine';
import { GRID_COLS, GRID_ROWS } from '../game/constants';
import {
  Flame,
  Snowflake,
  Zap,
  Orbit,
  Bomb,
  Shield,
  Sparkles,
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
  ShieldCheck
} from 'lucide-react';

interface Match3GridProps {
  uiState?: UIState;
}

const STATIC_SLOT_INDICES = Array.from({ length: GRID_ROWS * GRID_COLS }, (_, i) => i);

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

const renderElementIcon = (type: GemType, special: string) => {
  if (special === 'hyper_cube') {
    return <Sparkles size={18} color="#ffffff" />;
  }

  const iconColor = CORE_ICON_TINTS[type] || '#ffffff';

  switch (type) {
    case 'plasma':
      return <Flame size={15} color={iconColor} />;
    case 'cryo':
      return <Snowflake size={15} color={iconColor} />;
    case 'electric':
      return <Zap size={15} color={iconColor} />;
    case 'void':
      return <Orbit size={15} color={iconColor} />;
    case 'explosive':
      return <Bomb size={15} color={iconColor} />;
    case 'nano':
      return <Shield size={15} color={iconColor} />;
    case 'solaris':
      return <Sun size={15} color={iconColor} />;
    case 'antimatter':
      return <Atom size={15} color={iconColor} />;
    case 'chronos':
      return <Clock size={15} color={iconColor} />;
    case 'toxic':
      return <Biohazard size={15} color={iconColor} />;
    case 'gravity':
      return <Radio size={15} color={iconColor} />;
    case 'vampiric':
      return <Activity size={15} color={iconColor} />;
    case 'prism':
      return <Sparkles size={15} color={iconColor} />;
    case 'anchor':
      return <Anchor size={15} color={iconColor} />;
    case 'echo':
      return <Copy size={15} color={iconColor} />;
    case 'wormhole':
      return <Compass size={15} color={iconColor} />;
    case 'parasite':
      return <Bug size={15} color={iconColor} />;
    case 'static_web':
      return <Disc size={15} color={iconColor} />;
    case 'orbital_drone':
      return <Satellite size={15} color={iconColor} />;
    case 'supernova':
      return <Star size={15} color={iconColor} />;
    case 'deflector':
      return <ShieldCheck size={15} color={iconColor} />;
    default:
      return null;
  }
};

export const Match3GridComponent: React.FC<Match3GridProps> = ({ uiState }) => {
  const [gems, setGems] = useState<Gem[]>(() => gameEngine.match3.getAllGems());
  const [selectedGem, setSelectedGem] = useState<{ row: number; col: number } | null>(null);
  const [hintGem, setHintGem] = useState<{ row: number; col: number } | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(() => gameEngine.match3.isProcessing);

  const threatenedLanes = uiState?.threatenedLanes || [];
  const bossLanes = uiState?.bossLanes || [];
  const activeLanes = uiState?.activeLanes || [];

  // Touch tracking for swipe gestures
  const touchStartRef = useRef<{ x: number; y: number; row: number; col: number } | null>(null);

  const updateGridState = useCallback((_grid: (Gem | null)[][], activeGems: Gem[]) => {
    setGems(activeGems);
    setSelectedGem(gameEngine.match3.selectedGem);
    setHintGem(gameEngine.match3.hintGem);
    setIsLocked(gameEngine.match3.isProcessing);
  }, []);

  useEffect(() => {
    gameEngine.match3.onGridUpdated = (g, activeGems) => {
      updateGridState(g, activeGems);
    };

    gameEngine.match3.onProcessingStateChange = (processing) => {
      setIsLocked(processing);
      setSelectedGem(gameEngine.match3.selectedGem);
      setHintGem(gameEngine.match3.hintGem);
    };

    return () => {
      gameEngine.match3.onGridUpdated = undefined;
      gameEngine.match3.onProcessingStateChange = undefined;
    };
  }, [updateGridState]);

  const handleTileClick = useCallback((row: number, col: number) => {
    if (gameEngine.match3.isProcessing) return;
    gameEngine.match3.selectTile(row, col);
    setSelectedGem(gameEngine.match3.selectedGem);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent, row: number, col: number) => {
    if (gameEngine.match3.isProcessing) return;
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      row,
      col
    };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || gameEngine.match3.isProcessing) {
      touchStartRef.current = null;
      return;
    }

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    const minSwipeDistance = 18;

    if (absX > minSwipeDistance || absY > minSwipeDistance) {
      const { row, col } = touchStartRef.current;
      if (absX > absY) {
        // Horizontal swipe
        gameEngine.match3.swipeMove(row, col, dx > 0 ? 'right' : 'left');
      } else {
        // Vertical swipe
        gameEngine.match3.swipeMove(row, col, dy > 0 ? 'down' : 'up');
      }
      setSelectedGem(null);
    } else {
      // Tap action
      handleTileClick(touchStartRef.current.row, touchStartRef.current.col);
    }
    touchStartRef.current = null;
  }, [handleTileClick]);

  // Memoize background grid slots so 64 DOM elements are never recreated
  const backgroundSlots = useMemo(() => (
    <div className="match3-background-grid">
      {STATIC_SLOT_INDICES.map((i) => (
        <div key={`slot_${i}`} className="grid-slot-cell" />
      ))}
    </div>
  ), []);

  return (
    <div className={`match3-container ${isLocked ? 'locked' : ''}`}>
      {/* 8x8 Board Frame with Background Slots */}
      <div className="match3-board-frame">
        {/* Top Column Threat Warning & Turret Conduit Emitters Bar */}
        <div className="grid-threat-indicator-bar" aria-hidden="true">
          {Array.from({ length: GRID_COLS }).map((_, col) => {
            const isThreatened = threatenedLanes.includes(col);
            const isBoss = bossLanes.includes(col);
            const isFiring = activeLanes.includes(col);
            return (
              <div
                key={`threat_${col}`}
                className={`col-threat-cell ${isThreatened ? 'active' : ''} ${isBoss ? 'boss' : ''} ${isFiring ? 'firing' : ''}`}
              >
                {/* Turret Energy Conduit Top Emitter Port */}
                <div className={`col-conduit-emitter ${isFiring ? 'firing' : ''}`}>
                  <span className="conduit-emitter-core" />
                  {isFiring && <span className="conduit-surge-pulse" />}
                </div>

                {isThreatened && (
                  <>
                    <div className="threat-column-guide" />
                    <div className={`threat-badge ${isBoss ? 'boss' : ''}`}>
                      <span className="threat-ping-ring" />
                      <span className="threat-icon">!</span>
                    </div>
                  </>
                )}

                {/* Upward Column Energy Conduit Surge on Match */}
                {isFiring && <div className="col-energy-surge-beam" />}
              </div>
            );
          })}
        </div>

        {/* Background slot grid for visual depth */}
        {backgroundSlots}

        {/* Center Sector Dividing Line (Left Sector vs Right Sector) */}
        <div className="tactical-center-divider" />

        {/* Absolute Smooth-Animated Gem Layer (Direct Physics Position Binding) */}
        <div className="match3-gems-layer">
          {gems.map((gem) => {
            const isSelected = selectedGem?.row === gem.row && selectedGem?.col === gem.col;
            const isHint = hintGem?.row === gem.row && hintGem?.col === gem.col;

            // Direct smooth RAF physics coordinates
            const transformStyle: React.CSSProperties = {
              transform: `translate3d(${gem.displayCol * 100}%, ${gem.displayRow * 100}%, 0) scale(${gem.scale ?? 1})`,
              opacity: gem.alpha ?? 1
            };

            return (
              <div
                key={gem.id}
                className="gem-wrapper"
                style={transformStyle}
                onClick={() => handleTileClick(gem.row, gem.col)}
                onTouchStart={(e) => handleTouchStart(e, gem.row, gem.col)}
                onTouchEnd={handleTouchEnd}
              >
                <div
                  className={`gem-tile sphere ${gem.type} ${gem.special === 'hyper_cube' ? 'hyper-cube' : ''} ${
                    isSelected ? 'selected' : ''
                  } ${isHint ? 'hint' : ''} ${gem.special !== 'none' ? `special-${gem.special}` : ''}`}
                >
                  {/* Top Glass 3D Specular Sheen */}
                  <span className="sphere-specular-gloss" />

                  {/* Icon Core */}
                  <div className="sphere-icon-wrap">
                    {renderElementIcon(gem.type, gem.special)}
                  </div>

                  {/* Special Orbital Energy Ring */}
                  {(gem.special === 'column_laser' || gem.special === 'row_laser') && (
                    <span className={`sphere-orbit-ring ${gem.special}`} />
                  )}

                  {/* Special Bomb Pulsar */}
                  {gem.special === 'bomb_cross' && (
                    <span className="sphere-pulsar-ring" />
                  )}

                  {/* Special Badge Indicator */}
                  {gem.special !== 'none' && gem.special !== 'hyper_cube' && (
                    <span className="special-badge" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const Match3Grid = React.memo(Match3GridComponent);
