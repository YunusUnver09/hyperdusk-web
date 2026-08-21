import React, { useState, useEffect } from 'react';
import type { UIState, UpgradeOption } from '../game/types';
import { gameEngine } from '../game/engine';
import { UPGRADE_POOL, GEM_ELEMENTS } from '../game/constants';
import { getLevelConfig } from '../game/levelData';
import confetti from 'canvas-confetti';
import {
  Play,
  RotateCcw,
  Flame,
  Snowflake,
  Zap,
  Orbit,
  Bomb,
  Shield,
  HelpCircle,
  X,
  Crosshair,
  Award,
  Settings,
  MapPin,
  ChevronRight,
  Sparkles
} from 'lucide-react';

import { MainMenu } from './MainMenu';
import { LevelMap } from './LevelMap';
import { SettingsModal } from './SettingsModal';

interface ModalsProps {
  uiState: UIState;
  onStartGame: () => void;
  onResumeGame: () => void;
}

export const Modals: React.FC<ModalsProps> = ({ uiState, onStartGame, onResumeGame }) => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [randomUpgrades, setRandomUpgrades] = useState<UpgradeOption[]>([]);

  // When wave is cleared or level won, roll upgrades or burst confetti
  useEffect(() => {
    if (uiState.gameState === 'wave_cleared') {
      const shuffled = [...UPGRADE_POOL].sort(() => 0.5 - Math.random());
      setRandomUpgrades(shuffled.slice(0, 3));
    } else if (uiState.gameState === 'level_victory' || uiState.gameState === 'victory') {
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 }
        });
      } catch {
        // Ignore
      }
    }
  }, [uiState.gameState]);

  const getRank = (score: number, wave: number) => {
    if (wave >= 8 || score >= 20000) return { rank: 'S+', color: '#ffd000' };
    if (wave >= 6 || score >= 12000) return { rank: 'S', color: '#00f3ff' };
    if (wave >= 4 || score >= 6000) return { rank: 'A', color: '#00ff88' };
    if (wave >= 2 || score >= 3000) return { rank: 'B', color: '#a855f7' };
    return { rank: 'C', color: '#94a3b8' };
  };

  const renderIcon = (name: string) => {
    switch (name) {
      case 'Flame': return <Flame size={20} color="#ff2a5f" />;
      case 'Snowflake': return <Snowflake size={20} color="#00d2ff" />;
      case 'Zap': return <Zap size={20} color="#ffd000" />;
      case 'Orbit': return <Orbit size={20} color="#a855f7" />;
      case 'Bomb': return <Bomb size={20} color="#ff8800" />;
      case 'Shield': return <Shield size={20} color="#00ff88" />;
      case 'Crosshair': return <Crosshair size={20} color="#00f3ff" />;
      default: return <Award size={20} color="#ffd000" />;
    }
  };

  // 1. Full-Screen Main Menu
  if (uiState.gameState === 'menu') {
    return (
      <MainMenu
        onStartGame={onStartGame}
        highScore={gameEngine.battlefield.stats.highScore}
      />
    );
  }

  // 2. Full-Screen Interactive Galaxy Level Map
  if (uiState.gameState === 'map') {
    return (
      <LevelMap
        unlockedLevel={uiState.unlockedLevel}
        currentLevel={uiState.currentLevel}
        highScore={gameEngine.battlefield.stats.highScore}
        coreFragments={uiState.coreFragments}
        onSelectLevel={(levelId) => gameEngine.startLevel(levelId)}
        onBackToMenu={() => gameEngine.openMenu()}
      />
    );
  }

  // 3. Wave Cleared / Roguelite Upgrade Card Screen (Waves 1..7)
  if (uiState.gameState === 'wave_cleared') {
    return (
      <div className="modal-overlay">
        <div className="modal-card" style={{ maxWidth: '420px' }}>
          <div>
            <h2 className="modal-title" style={{ color: '#00ff88' }}>
              FAZ {uiState.wave} TEMİZLENDİ!
            </h2>
            <p className="modal-subtitle">Bir Savunma Geliştirmesi Seçin</p>
          </div>

          <div className="upgrade-cards-list">
            {randomUpgrades.map((up) => (
              <button
                key={up.id}
                className={`upgrade-card-btn ${up.rarity}`}
                onClick={() => gameEngine.applyUpgrade(up)}
              >
                <div style={{
                  padding: '8px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  display: 'flex'
                }}>
                  {renderIcon(up.icon)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#ffffff' }}>{up.title}</span>
                    <span style={{ fontSize: '9px', textTransform: 'uppercase', color: up.rarity === 'legendary' ? '#ffd000' : up.rarity === 'epic' ? '#a855f7' : '#00f3ff' }}>
                      {up.rarity}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{up.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 4. Level Victory Screen (Completed Phase 8 Main Boss)
  if (uiState.gameState === 'level_victory') {
    const stats = gameEngine.battlefield.stats;
    const rankInfo = getRank(stats.score, 8);
    const nextLevelConfig = getLevelConfig(uiState.currentLevel + 1);

    return (
      <div className="modal-overlay">
        <div className="modal-card level-victory-card">
          <div className="victory-badge-glow">
            <Sparkles size={28} color="#ffd000" />
          </div>

          <div>
            <h2 className="modal-title" style={{ color: '#ffd000' }}>
              SEKTÖR {uiState.currentLevel} TEMİZLENDİ!
            </h2>
            <p className="modal-subtitle">{uiState.levelName} Kurtarıldı</p>
          </div>

          <div style={{
            fontSize: '44px',
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            color: rankInfo.color,
            textShadow: `0 0 20px ${rankInfo.color}`
          }}>
            {rankInfo.rank}
          </div>

          <div className="modal-stats-grid">
            <div className="modal-stat-item">
              <span className="modal-stat-val">{stats.score.toLocaleString()}</span>
              <span className="modal-stat-lbl">Toplam Skor</span>
            </div>
            <div className="modal-stat-item">
              <span className="modal-stat-val">x{stats.maxCombo}</span>
              <span className="modal-stat-lbl">Maksimum Kombo</span>
            </div>
            <div className="modal-stat-item">
              <span className="modal-stat-val">{stats.enemiesKilled}</span>
              <span className="modal-stat-lbl">Düşman İmhয়া</span>
            </div>
            <div className="modal-stat-item">
              <span className="modal-stat-val">8 / 8</span>
              <span className="modal-stat-lbl">Faz Tamamlandı</span>
            </div>
          </div>

          {/* Next Level Unlock Notification */}
          <div className="level-unlock-alert">
            <Sparkles size={16} color="#00ff88" />
            <span>YENİ SEKTÖR AÇILDI: <strong>{nextLevelConfig.name}</strong></span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            <button
              className="cyber-btn"
              onClick={() => gameEngine.continueToNextLevel()}
            >
              <Play size={18} fill="#070913" />
              <span>SONRAKİ BÖLÜME GEÇ</span>
              <ChevronRight size={16} />
            </button>

            <button
              className="cyber-btn secondary"
              onClick={() => gameEngine.openMap()}
            >
              <MapPin size={16} color="#00f3ff" />
              <span>HARİTAYA DÖN</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Victory Screen (All 8/10 Levels Cleared)
  if (uiState.gameState === 'victory') {
    const stats = gameEngine.battlefield.stats;
    const rankInfo = getRank(stats.score, 8);

    return (
      <div className="modal-overlay">
        <div className="modal-card">
          <div>
            <h2 className="modal-title" style={{ color: '#ffd000' }}>
              👑 TÜM GALAKSİ KURTARILDI!
            </h2>
            <p className="modal-subtitle">Tüm Düşman Sektörleri ve Titan Patronları Yok Edildi</p>
          </div>

          <div style={{
            fontSize: '48px',
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            color: rankInfo.color,
            textShadow: `0 0 20px ${rankInfo.color}`
          }}>
            {rankInfo.rank}
          </div>

          <div className="modal-stats-grid">
            <div className="modal-stat-item">
              <span className="modal-stat-val">{stats.score.toLocaleString()}</span>
              <span className="modal-stat-lbl">Toplam Skor</span>
            </div>
            <div className="modal-stat-item">
              <span className="modal-stat-val">x{stats.maxCombo}</span>
              <span className="modal-stat-lbl">Maksimum Kombo</span>
            </div>
            <div className="modal-stat-item">
              <span className="modal-stat-val">{stats.enemiesKilled}</span>
              <span className="modal-stat-lbl">Yok Edilen Düşman</span>
            </div>
            <div className="modal-stat-item">
              <span className="modal-stat-val">{stats.matchesMade}</span>
              <span className="modal-stat-lbl">Yapılan Eşleşme</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            <button className="cyber-btn" onClick={() => gameEngine.openMap()}>
              <MapPin size={16} /> HARİTAYA DÖN
            </button>

            <button className="cyber-btn secondary" onClick={() => gameEngine.startLevel(1)}>
              <RotateCcw size={16} /> BAŞTAN OYNA
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 6. Game Over Screen
  if (uiState.gameState === 'game_over') {
    const stats = gameEngine.battlefield.stats;
    const rankInfo = getRank(stats.score, stats.wave);

    return (
      <div className="modal-overlay">
        <div className="modal-card">
          <div>
            <h2 className="modal-title danger">GÖREV BAŞARISIZ</h2>
            <p className="modal-subtitle">Savunma Kalkanı Çöktü • Sektör {uiState.currentLevel}</p>
          </div>

          <div style={{
            fontSize: '42px',
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            color: rankInfo.color,
            textShadow: `0 0 16px ${rankInfo.color}`
          }}>
            Rütbe: {rankInfo.rank}
          </div>

          <div className="modal-stats-grid">
            <div className="modal-stat-item">
              <span className="modal-stat-val">{stats.score.toLocaleString()}</span>
              <span className="modal-stat-lbl">Skor</span>
            </div>
            <div className="modal-stat-item">
              <span className="modal-stat-val">{stats.wave} / 8</span>
              <span className="modal-stat-lbl">Ulaşılan Faz</span>
            </div>
            <div className="modal-stat-item">
              <span className="modal-stat-val">x{stats.maxCombo}</span>
              <span className="modal-stat-lbl">Maksimum Kombo</span>
            </div>
            <div className="modal-stat-item">
              <span className="modal-stat-val">{stats.enemiesKilled}</span>
              <span className="modal-stat-lbl">Yok Edilen Düşman</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            <button className="cyber-btn" onClick={() => gameEngine.startLevel(uiState.currentLevel)}>
              <RotateCcw size={18} /> TEKRAR DENE
            </button>

            <button className="cyber-btn secondary" onClick={() => gameEngine.openMap()}>
              <MapPin size={16} color="#00f3ff" /> HARİTAYA DÖN
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 7. Pause Modal
  if (uiState.gameState === 'paused') {
    return (
      <div className="modal-overlay">
        <div className="modal-card">
          <h2 className="modal-title">OYUN DURAKLATILDI</h2>
          <p className="modal-subtitle">Sektör {uiState.currentLevel} • Faz {uiState.wave} / 8</p>

          <button className="cyber-btn" onClick={onResumeGame}>
            <Play size={18} fill="#070913" /> DEVAM ET
          </button>

          <button className="cyber-btn secondary" onClick={() => gameEngine.openMap()}>
            <MapPin size={16} color="#00f3ff" /> HARİTAYA DÖN
          </button>

          <button className="cyber-btn secondary" onClick={() => setShowSettings(true)}>
            <Settings size={16} /> SES & OYUN AYARLARI
          </button>

          <button className="cyber-btn secondary" onClick={() => setShowTutorial(true)}>
            <HelpCircle size={16} /> REHBER & ELEMENTLER
          </button>

          <button className="cyber-btn secondary" onClick={() => gameEngine.startLevel(uiState.currentLevel)}>
            <RotateCcw size={16} /> SEVİYEYİ YENİDEN BAŞLAT
          </button>
        </div>

        {showSettings && (
          <SettingsModal onClose={() => setShowSettings(false)} />
        )}

        {showTutorial && (
          <TutorialModal onClose={() => setShowTutorial(false)} />
        )}
      </div>
    );
  }

  return null;
};

// Tutorial Modal Component
const TutorialModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="modal-overlay" style={{ zIndex: 60 }}>
      <div className="modal-card" style={{ maxHeight: '88vh', overflowY: 'auto', textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="modal-title" style={{ fontSize: '18px' }}>NASIL OYNANIR?</h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.4' }}>
          🛡️ <strong>Şerit Savunması:</strong> Alt taraftaki 8 sütun, üst taraftaki 8 savunma şeridine doğrudan bağlıdır! Bir sütunda eşleşme yaptığınızda, o şeridin tareti anında yukarı doğru ateş açar.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '4px 0' }}>
          {Object.values(GEM_ELEMENTS).map((elem) => (
            <div
              key={elem.type}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '6px 10px',
                borderRadius: '8px',
                borderLeft: `4px solid ${elem.color}`
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: elem.color }}>
                  {elem.turkishName}
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {elem.description}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: '11px', color: '#ffd000' }}>
          ⚡ <strong>8-Fazlı Bölüm Yapısı:</strong> Her bölümde 8 faz bulunur. 4. fazda <strong>Mini Boss</strong>, 8. fazda ise devasa <strong>Ana Boss</strong> gelir!
        </p>

        <button className="cyber-btn" onClick={onClose} style={{ marginTop: '8px' }}>
          ANLADIM, SAVUNMAYA DÖN
        </button>
      </div>
    </div>
  );
};
