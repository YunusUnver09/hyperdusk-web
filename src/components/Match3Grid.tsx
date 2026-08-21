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

const ELEMENT_BEAM_COLORS: Record<GemType, string> = {
  plasma: '#ff3344',
  cryo: '#00f3ff',
  electric: '#ffea00',
  void: '#bf00ff',
  explosive: '#ff8800',
  nano: '#00ff88',
  solaris: '#ffd700',
  antimatter: '#ff00aa',
  chronos: '#00bbff',
  toxic: '#76ff03',
  gravity: '#7986cb',
  vampiric: '#e91e63',
  prism: '#ffffff',
  anchor: '#ffd600',
  echo: '#e0e0e0',
  wormhole: '#1de9b6',
  parasite: '#d500f9',
  static_web: '#00e5ff',
  orbital_drone: '#eceff1',
  supernova: '#ffff00',
  deflector: '#00e676'
};

const renderElementIcon = (type: GemType, special: string) => {
  if (special === 'hyper_cube') {
    return <Sparkles size={22} color="#ffffff" />;
  }

  const iconColor = CORE_ICON_TINTS[type] || '#ffffff';

  switch (type) {
    case 'plasma':
      return <Flame size={18} color={iconColor} />;
    case 'cryo':
      return <Snowflake size={18} color={iconColor} />;
    case 'electric':
      return <Zap size={18} color={iconColor} />;
    case 'void':
      return <Orbit size={18} color={iconColor} />;
    case 'explosive':
      return <Bomb size={18} color={iconColor} />;
    case 'nano':
      return <Shield size={18} color={iconColor} />;
    case 'solaris':
      return <Sun size={18} color={iconColor} />;
    case 'antimatter':
      return <Atom size={18} color={iconColor} />;
    case 'chronos':
      return <Clock size={18} color={iconColor} />;
    case 'toxic':
      return <Biohazard size={18} color={iconColor} />;
    case 'gravity':
      return <Radio size={18} color={iconColor} />;
    case 'vampiric':
      return <Activity size={18} color={iconColor} />;
    case 'prism':
      return <Sparkles size={18} color={iconColor} />;
    case 'anchor':
      return <Anchor size={18} color={iconColor} />;
    case 'echo':
      return <Copy size={18} color={iconColor} />;
    case 'wormhole':
      return <Compass size={18} color={iconColor} />;
    case 'parasite':
      return <Bug size={18} color={iconColor} />;
    case 'static_web':
      return <Disc size={18} color={iconColor} />;
    case 'orbital_drone':
      return <Satellite size={18} color={iconColor} />;
    case 'supernova':
      return <Star size={18} color={iconColor} />;
    case 'deflector':
      return <ShieldCheck size={18} color={iconColor} />;
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
    if (isLocked) return;
    gameEngine.match3.selectTile(row, col);
    setSelectedGem(gameEngine.match3.selectedGem);
  }, [isLocked]);

  const handleTouchStart = (e: React.TouchEvent, row: number, col: number) => {
    if (isLocked) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, row, col };
  };

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (isLocked || !touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    const minSwipeDistance = 25;

    if (absX > minSwipeDistance || absY > minSwipeDistance) {
      const { row, col } = touchStartRef.current;
      if (absX > absY) {
        gameEngine.match3.swipeMove(row, col, dx > 0 ? 'right' : 'left');
      } else {
        gameEngine.match3.swipeMove(row, col, dy > 0 ? 'down' : 'up');
      }
      setSelectedGem(null);
    } else {
      handleTileClick(touchStartRef.current.row, touchStartRef.current.col);
    }
    touchStartRef.current = null;
  }, [handleTileClick, isLocked]);

  const backgroundSlots = useMemo(() => (
    <div className="match3-background-grid">
      {STATIC_SLOT_INDICES.map((i) => (
        <div key={`slot_${i}`} className="grid-slot-cell" />
      ))}
    </div>
  ), []);

  const activeMatchGroups = gameEngine.match3.activeMatchGroups || [];

  return (
    <div className={`match3-container ${isLocked ? 'locked' : ''}`}>
      <div className="match3-board-frame">
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

        {backgroundSlots}

        <div className="tactical-center-divider" />

        {activeMatchGroups.length > 0 && (
          <svg className="match-lasers-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
            {activeMatchGroups.map((group, gIdx) => {
              if (!group.gems || group.gems.length < 2) return null;
              const beamColor = ELEMENT_BEAM_COLORS[group.type] || '#00f3ff';
              const sortedGems = [...group.gems].sort(
                (a, b) => a.displayRow + a.displayCol - (b.displayRow + b.displayCol)
              );
              const points = sortedGems
                .map((g) => `${(g.displayCol + 0.5) * 12.5},${(g.displayRow + 0.5) * 12.5}`)
                .join(' ');

              return (
                <g key={`match_grp_${gIdx}`}>
                  <polyline
                    points={points}
                    fill="none"
                    stroke={beamColor}
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="match-group-laser-glow"
                  />
                  <polyline
                    points={points}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="match-group-laser-core"
                  />
                  {sortedGems.map((g) => (
                    <circle
                      key={`node_${g.id}`}
                      cx={(g.displayCol + 0.5) * 12.5}
                      cy={(g.displayRow + 0.5) * 12.5}
                      r="1.8"
                      fill="#ffffff"
                      stroke={beamColor}
                      strokeWidth="0.8"
                      className="match-node-pulsar"
                    />
                  ))}
                </g>
              );
            })}
          </svg>
        )}

        <div className="match3-gems-layer">
          {gems.map((gem) => {
            const isSelected = selectedGem?.row === gem.row && selectedGem?.col === gem.col;
            const isHint = hintGem?.row === gem.row && hintGem?.col === gem.col;
            const beamColor = ELEMENT_BEAM_COLORS[gem.type] || '#00f3ff';

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
                  } ${isHint ? 'hint' : ''} ${gem.isMatched ? 'is-shattering' : ''} ${gem.special !== 'none' ? `special-${gem.special}` : ''}`}
                >
                  <span className="sphere-specular-gloss" />
                  <span className="core-rim-glow-ring" />

                  <div className="sphere-icon-wrap">
                    {renderElementIcon(gem.type, gem.special)}
                  </div>

                  {(gem.special === 'column_laser' || gem.special === 'row_laser') && (
                    <span className={`sphere-orbit-ring ${gem.special}`} />
                  )}

                  {gem.special === 'bomb_cross' && (
                    <span className="sphere-pulsar-ring" />
                  )}

                  {gem.special !== 'none' && gem.special !== 'hyper_cube' && (
                    <span className="special-badge" />
                  )}

                  {gem.isMatched && (
                    <div className="core-shatter-burst">
                      <span className="shatter-shard s1" style={{ '--shard-color': beamColor } as React.CSSProperties} />
                      <span className="shatter-shard s2" style={{ '--shard-color': beamColor } as React.CSSProperties} />
                      <span className="shatter-shard s3" style={{ '--shard-color': beamColor } as React.CSSProperties} />
                      <span className="shatter-shard s4" style={{ '--shard-color': beamColor } as React.CSSProperties} />
                      <span className="shatter-shard s5" style={{ '--shard-color': beamColor } as React.CSSProperties} />
                      <span className="shatter-shard s6" style={{ '--shard-color': beamColor } as React.CSSProperties} />
                      <span className="shatter-flash" style={{ '--shard-color': beamColor } as React.CSSProperties} />
                    </div>
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
