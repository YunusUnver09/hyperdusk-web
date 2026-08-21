import React from 'react';
import type { UIState } from '../game/types';
import { soundManager } from '../game/soundManager';
import { Shield, Zap, Pause, Volume2, VolumeX, Radio } from 'lucide-react';

interface HUDProps {
  uiState: UIState;
  onPause: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const HUDComponent: React.FC<HUDProps> = ({ uiState, onPause, isMuted, onToggleMute }) => {
  const shieldPercent = Math.max(0, Math.min(100, Math.round((uiState.shieldHp / uiState.maxShieldHp) * 100)));
  const energyPercent = Math.max(0, Math.min(100, Math.round((uiState.energy / uiState.maxEnergy) * 100)));
  const isLowShield = shieldPercent <= 30;

  return (
    <div className="hud-container">
      {/* Top row: Score, Wave badge, controls */}
      <div className="hud-top-row">
        <div className="hud-stat-box">
          <Radio size={14} color="#ffd000" />
          <span className="hud-score-value">{uiState.score.toLocaleString()}</span>
        </div>

        <div className="hud-wave-badge">
          SEKTÖR {uiState.currentLevel || 1} • FAZ {uiState.wave} / 8
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => {
              onToggleMute();
              soundManager.toggleMute();
            }}
            style={{
              background: 'rgba(0, 243, 255, 0.1)',
              border: '1px solid rgba(0, 243, 255, 0.3)',
              borderRadius: '6px',
              padding: '5px 7px',
              color: isMuted ? '#ef4444' : '#00f3ff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          <button
            onClick={onPause}
            style={{
              background: 'rgba(0, 243, 255, 0.1)',
              border: '1px solid rgba(0, 243, 255, 0.3)',
              borderRadius: '6px',
              padding: '5px 7px',
              color: '#00f3ff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Duraklat"
          >
            <Pause size={15} />
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
