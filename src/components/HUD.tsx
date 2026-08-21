import React from 'react';
import type { UIState } from '../game/types';
import { soundManager } from '../game/soundManager';
import { Shield, Zap, Pause, Volume2, VolumeX, Radio, ArrowLeft, Maximize, Minimize } from 'lucide-react';

interface HUDProps {
  uiState: UIState;
  onPause: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onBackToStudio?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const HUDComponent: React.FC<HUDProps> = ({
  uiState,
  onPause,
  isMuted,
  onToggleMute,
  onBackToStudio,
  isFullscreen,
  onToggleFullscreen
}) => {
  const shieldPercent = Math.max(0, Math.min(100, Math.round((uiState.shieldHp / uiState.maxShieldHp) * 100)));
  const energyPercent = Math.max(0, Math.min(100, Math.round((uiState.energy / uiState.maxEnergy) * 100)));
  const isLowShield = shieldPercent <= 30;

  return (
    <div className="hud-container">
      {/* Top row: Studio return, Score, Wave badge, controls */}
      <div className="hud-top-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {onBackToStudio && (
            <button
              onClick={onBackToStudio}
              className="hud-ctrl-btn studio-btn"
              title="Hyperdusk Stüdyo Portalı"
            >
              <ArrowLeft size={13} />
              <span className="hud-btn-text">STÜDYO</span>
            </button>
          )}

          <div className="hud-stat-box">
            <Radio size={13} color="#ffd000" />
            <span className="hud-score-value">{uiState.score.toLocaleString()}</span>
          </div>
        </div>

        <div className="hud-wave-badge">
          SEKTÖR {uiState.currentLevel || 1} • FAZ {uiState.wave} / 8
        </div>

        <div style={{ display: 'flex', gap: '5px' }}>
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="hud-ctrl-btn"
              title={isFullscreen ? 'Küçült' : 'Tam Ekran'}
            >
              {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
            </button>
          )}

          <button
            onClick={() => {
              onToggleMute();
              soundManager.toggleMute();
            }}
            className={`hud-ctrl-btn ${isMuted ? 'muted' : ''}`}
            title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          <button
            onClick={onPause}
            className="hud-ctrl-btn"
            title="Duraklat"
          >
            <Pause size={14} />
          </button>
        </div>
      </div>

      {/* Bars row: Shield HP and Energy Meter */}
      <div className="hud-bars-row">
        {/* Shield Bar */}
        <div className="hud-bar-wrapper">
          <div className="hud-bar-label">
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Shield size={11} color={isLowShield ? '#ff0055' : '#00ff88'} />
              KALKAN
            </span>
            <span>{shieldPercent}%</span>
          </div>
          <div className="hud-progress-track">
            <div
              className={`hud-progress-fill shield ${isLowShield ? 'low' : ''}`}
              style={{ width: `${shieldPercent}%` }}
            />
          </div>
        </div>

        {/* Energy Bar */}
        <div className="hud-bar-wrapper">
          <div className="hud-bar-label">
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Zap size={11} color="#00f3ff" />
              ENERJİ
            </span>
            <span>{energyPercent}%</span>
          </div>
          <div className="hud-progress-track">
            <div
              className="hud-progress-fill energy"
              style={{ width: `${energyPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Boss Health Bar (Only if Boss is Active) */}
      {uiState.isBossWave && uiState.bossHp !== undefined && uiState.bossMaxHp !== undefined && (
        <div className={`boss-hud-bar ${uiState.isMainBoss ? 'main-boss' : 'mini-boss'}`}>
          <div className="boss-title">
            <span>
              {uiState.isMainBoss ? '☠️ SEKTÖR PATRONU: ' : '⚠️ MİNİ BOSS: '}
              {uiState.bossName || 'DREADNOUGHT TITAN'}
            </span>
            <span>{Math.round((uiState.bossHp / uiState.bossMaxHp) * 100)}%</span>
          </div>
          <div className="boss-track">
            <div
              className={`boss-fill ${uiState.isMainBoss ? 'main' : 'mini'}`}
              style={{ width: `${Math.max(0, (uiState.bossHp / uiState.bossMaxHp) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const HUD = React.memo(HUDComponent);
