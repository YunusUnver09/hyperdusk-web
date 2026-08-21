import React, { useState } from 'react';
import { Volume2, VolumeX, Music, Disc, Smartphone, Activity, X, Sliders } from 'lucide-react';
import { soundManager } from '../game/soundManager';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'audio' | 'gameplay'>('audio');

  const [musicVol, setMusicVol] = useState<number>(() => Math.round(soundManager.musicVolume * 100));
  const [sfxVol, setSfxVol] = useState<number>(() => Math.round(soundManager.sfxVolume * 100));
  const [isMusicMuted, setIsMusicMuted] = useState<boolean>(() => soundManager.isMusicMuted);
  const [isSfxMuted, setIsSfxMuted] = useState<boolean>(() => soundManager.isMuted);

  const [haptics, setHaptics] = useState<boolean>(true);
  const [screenShake, setScreenShake] = useState<boolean>(true);

  const handleMusicSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setMusicVol(val);
    soundManager.setMusicVolume(val / 100);
    if (val > 0 && isMusicMuted) {
      setIsMusicMuted(false);
      soundManager.isMusicMuted = false;
    }
  };

  const handleSfxSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setSfxVol(val);
    soundManager.setSfxVolume(val / 100);
    if (val > 0 && isSfxMuted) {
      setIsSfxMuted(false);
      soundManager.isMuted = false;
    }
  };

  const handleToggleMusicMute = () => {
    const muted = soundManager.toggleMusicMute();
    setIsMusicMuted(muted);
    soundManager.playGemSwap();
  };

  const handleToggleSfxMute = () => {
    const muted = soundManager.toggleMute();
    setIsSfxMuted(muted);
    if (!muted) {
      soundManager.playGemSwap();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 70 }}>
      <div className="modal-card menu-submodal settings-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={20} color="#00f3ff" />
            <h3 className="modal-title" style={{ fontSize: '18px', margin: 0 }}>AYARLAR</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="settings-tabs-bar">
          <button
            className={`settings-tab-btn ${activeTab === 'audio' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('audio');
              soundManager.playGemSwap();
            }}
          >
            <Music size={15} />
            <span>SES & MÜZİK</span>
          </button>

          <button
            className={`settings-tab-btn ${activeTab === 'gameplay' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('gameplay');
              soundManager.playGemSwap();
            }}
          >
            <Activity size={15} />
            <span>OYNANIŞ</span>
          </button>
        </div>

        {/* Tab 1: Audio Controls */}
        {activeTab === 'audio' && (
          <div className="settings-list">
            {/* Background Music Volume Slider */}
            <div className="settings-slider-card">
              <div className="slider-header-row">
                <div className="slider-label">
                  <Disc size={18} color="#a855f7" className="spin-slow" />
                  <span>Müzik Sesi (BGM)</span>
                </div>
                <div className="slider-val-badge">{isMusicMuted ? 'KAPALI' : `${musicVol}%`}</div>
              </div>

              <div className="slider-control-row">
                <button
                  className={`mini-mute-btn ${isMusicMuted ? 'muted' : ''}`}
                  onClick={handleToggleMusicMute}
                  title="Müziği Aç/Kapa"
                >
                  {isMusicMuted ? <VolumeX size={16} color="#ef4444" /> : <Volume2 size={16} color="#a855f7" />}
                </button>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMusicMuted ? 0 : musicVol}
                  onChange={handleMusicSlider}
                  className="cyber-range-slider purple"
                />
              </div>
            </div>

            {/* Sound Effects Volume Slider */}
            <div className="settings-slider-card">
              <div className="slider-header-row">
                <div className="slider-label">
                  <Volume2 size={18} color="#00f3ff" />
                  <span>Efekt Sesi (SFX)</span>
                </div>
                <div className="slider-val-badge">{isSfxMuted ? 'KAPALI' : `${sfxVol}%`}</div>
              </div>

              <div className="slider-control-row">
                <button
                  className={`mini-mute-btn ${isSfxMuted ? 'muted' : ''}`}
                  onClick={handleToggleSfxMute}
                  title="Efektleri Aç/Kapa"
                >
                  {isSfxMuted ? <VolumeX size={16} color="#ef4444" /> : <Volume2 size={16} color="#00f3ff" />}
                </button>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isSfxMuted ? 0 : sfxVol}
                  onChange={handleSfxSlider}
                  className="cyber-range-slider cyan"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Gameplay / Haptics & Screen Shake */}
        {activeTab === 'gameplay' && (
          <div className="settings-list">
            {/* Haptics Option */}
            <div className="settings-row">
              <div className="settings-label">
                <Smartphone size={18} color={haptics ? '#ffd000' : '#64748b'} />
                <span>Dokunsal Titreşim (Haptik)</span>
              </div>
              <button
                className={`toggle-switch ${haptics ? 'active' : ''}`}
                onClick={() => {
                  setHaptics(!haptics);
                  soundManager.triggerVibrate(30);
                }}
              >
                <span className="toggle-thumb" />
              </button>
            </div>

            {/* Screen Shake Option */}
            <div className="settings-row">
              <div className="settings-label">
                <Activity size={18} color={screenShake ? '#ff0055' : '#64748b'} />
                <span>Ekran Sarsıntısı (Screen Shake)</span>
              </div>
              <button
                className={`toggle-switch ${screenShake ? 'active' : ''}`}
                onClick={() => setScreenShake(!screenShake)}
              >
                <span className="toggle-thumb" />
              </button>
            </div>
          </div>
        )}

        {/* Done Button */}
        <button
          className="cyber-btn"
          onClick={() => {
            soundManager.playGemSwap();
            onClose();
          }}
          style={{ marginTop: '6px' }}
        >
          KAYDET & ÇIK
        </button>
      </div>
    </div>
  );
};
