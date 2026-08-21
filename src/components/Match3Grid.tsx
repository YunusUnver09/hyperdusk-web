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
  Satellite
} from 'lucide-react';

interface Match3GridProps {
  uiState?: UIState;
}

const STATIC_SLOT_INDICES = Array.from({ length: GRID_ROWS * GRID_COLS }, (_, i) => i);

const renderElementIcon = (type: GemType, special: string) => {
  if (special === 'hyper_cube') {
    return <Sparkles size={18} color="#ffffff" />;
  }

  switch (type) {
    case 'plasma':
      return <Flame size={15} color="#ffffff" />;
    case 'cryo':
      return <Snowflake size={15} color="#ffffff" />;
    case 'electric':
      return <Zap size={15} color="#ffffff" />;
    case 'void':
      return <Orbit size={15} color="#ffffff" />;
    case 'explosive':
      return <Bomb size={15} color="#ffffff" />;
    case 'nano':
      return <Shield size={15} color="#ffffff" />;
    case 'solaris':
      return <Sun size={15} color="#ffffff" />;
    case 'antimatter':
      return <Atom size={15} color="#ffffff" />;
    case 'chronos':
      return <Clock size={15} color="#ffffff" />;
    case 'toxic':
      return <Biohazard size={15} color="#ffffff" />;
    case 'gravity':
      return <Radio size={15} color="#ffffff" />;
    case 'vampiric':
      return <Activity size={15} color="#ffffff" />;
    case 'prism':
      return <Sparkles size={15} color="#ffffff" />;
    case 'anchor':
      return <Anchor size={15} color="#ffffff" />;
    case 'echo':
      return <Copy size={15} color="#ffffff" />;
    case 'wormhole':
      return <Compass size={15} color="#ffffff" />;
    case 'parasite':
      return <Bug size={15} color="#ffffff" />;
    case 'static_web':
      return <Disc size={15} color="#ffffff" />;
    case 'orbital_drone':
      return <Satellite size={15} color="#ffffff" />;
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
        {/* Top Column Threat Warning Indicators */}
        <div className="grid-threat-indicator-bar" aria-hidden="true">
          {Array.from({ length: GRID_COLS }).map((_, col) => {
            const isThreatened = threatenedLanes.includes(col);
            const isBoss = bossLanes.includes(col);
            return (
              <div
                key={`threat_${col}`}
                className={`col-threat-cell ${isThreatened ? 'active' : ''} ${isBoss ? 'boss' : ''}`}
              >
                {isThreatened && (
                  <>
                    <div className="threat-column-guide" />
                    <div className={`threat-badge ${isBoss ? 'boss' : ''}`}>
                      <span className="threat-ping-ring" />
                      <span className="threat-icon">!</span>
                    </div>
                  </>
                )}
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
