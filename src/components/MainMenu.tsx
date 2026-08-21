import React, { useEffect, useRef, useState } from 'react';
import { Play, Settings, Info, Trophy, HelpCircle, X } from 'lucide-react';
import { soundManager } from '../game/soundManager';
import { SettingsModal } from './SettingsModal';

interface MainMenuProps {
  onStartGame: () => void;
  highScore: number;
}

interface VortexParticle {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  color: string;
  twinkleSpeed: number;
}

const MainMenuComponent: React.FC<MainMenuProps> = ({ onStartGame, highScore }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // 60 FPS Lightweight Particle Vortex Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    let coreGrad: CanvasGradient | null = null;

    const updateGradient = () => {
      const cx = width * 0.5;
      const cy = height * 0.42;
      coreGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.min(width, height) * 0.7);
      coreGrad.addColorStop(0, 'rgba(112, 0, 255, 0.18)');
      coreGrad.addColorStop(0.4, 'rgba(0, 243, 255, 0.08)');
      coreGrad.addColorStop(0.85, 'rgba(4, 7, 20, 0.6)');
      coreGrad.addColorStop(1, 'rgba(4, 7, 20, 0.98)');
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width || window.innerWidth || 400;
      height = rect.height || window.innerHeight || 700;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      updateGradient();
    };

    resize();
    window.addEventListener('resize', resize);

    // Initialize vortex particles
    const particleCount = 110;
    const particles: VortexParticle[] = [];
    const colors = ['#ffffff', '#00f3ff', '#a855f7', '#ffd000', '#67e8f9'];

    for (let i = 0; i < particleCount; i++) {
      const maxRadius = Math.hypot(width, height) * 0.55;
      const radius = Math.pow(Math.random(), 0.65) * maxRadius + 15;
      const speed = (0.2 + Math.random() * 0.45) * (1 / (1 + radius * 0.003));
      const baseAlpha = Math.random() * 0.65 + 0.25;

      particles.push({
        angle: Math.random() * Math.PI * 2,
        radius,
        speed,
        size: Math.random() * 2.2 + 0.6,
        alpha: baseAlpha,
        baseAlpha,
        color: colors[Math.floor(Math.random() * colors.length)],
        twinkleSpeed: Math.random() * 3 + 1
      });
    }

    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Dark Space Galaxy Gradient Background
      ctx.fillStyle = '#040714';
      ctx.fillRect(0, 0, width, height);

      if (coreGrad) {
        ctx.fillStyle = coreGrad;
        ctx.fillRect(0, 0, width, height);
      }

      const cx = width * 0.5;
      const cy = height * 0.42;

      // Fast, high-performance particle loop
      for (const p of particles) {
        p.angle += p.speed * dt * 0.85;
        p.alpha = p.baseAlpha * (0.75 + Math.sin(now * 0.002 * p.twinkleSpeed) * 0.25);

        const x = cx + Math.cos(p.angle) * p.radius;
        const y = cy + Math.sin(p.angle) * (p.radius * 0.75); // Elliptical 3D perspective tilt

        if (x >= -10 && x <= width + 10 && y >= -10 && y <= height + 10) {
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;

          ctx.beginPath();
          ctx.arc(x, y, p.size, 0, Math.PI * 2);
          ctx.fill();

          // Orbital streak
          if (p.size > 1.6) {
            const prevX = cx + Math.cos(p.angle - 0.05) * p.radius;
            const prevY = cy + Math.sin(p.angle - 0.05) * (p.radius * 0.75);
            ctx.strokeStyle = p.color;
            ctx.lineWidth = p.size * 0.5;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(prevX, prevY);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  const handlePlayClick = () => {
    soundManager.playGemSwap();
    onStartGame();
  };

  const handleButtonClick = (action: () => void) => {
    soundManager.playGemSwap();
    action();
  };

  return (
    <div className="main-menu-overlay">
      {/* 1. Background 60 FPS Particle Vortex Canvas */}
      <canvas ref={canvasRef} className="main-menu-canvas" />

      {/* 2. Main Menu Foreground UI */}
      <div className="main-menu-content">
        {/* Top Header & High Score Badge */}
        <div className="menu-header">
          <div className="menu-highscore-pill">
            <Trophy size={14} color="#ffd000" />
            <span>EN YÜKSEK SKOR:</span>
            <strong>{highScore.toLocaleString()}</strong>
          </div>
        </div>

        {/* Hero Title & Emblem */}
        <div className="menu-hero-section">
          {/* Cyber Shield Hologram Emblem */}
          <div className="menu-emblem-wrapper">
            <div className="menu-emblem-glow" />
            <div className="menu-emblem-core">
              <span className="emblem-laser-ring" />
              <Play size={28} color="#00f3ff" fill="#00f3ff" style={{ marginLeft: '4px' }} />
            </div>
          </div>

          {/* Neon Game Title */}
          <h1 className="menu-main-title">
            <span className="title-glitch" data-text="CRUSH SPACE">CRUSH SPACE</span>
          </h1>

          <div className="menu-subtitle-badge">
            <span className="badge-dot" />
            LANE DEFENSE & MATCH-3
          </div>
        </div>

        {/* 3. Dikey 3 Menü Butonu (Vertical 3 Action Buttons) */}
        <div className="menu-buttons-group">
          {/* Button 1: BAŞLA (PLAY) */}
          <button
            className="menu-btn play-btn"
            onClick={handlePlayClick}
          >
            <div className="btn-glow-pulse" />
            <div className="btn-inner">
              <Play size={22} fill="#070913" color="#070913" />
              <span>BAŞLA</span>
            </div>
          </button>

          {/* Button 2: AYARLAR (SETTINGS) */}
          <button
            className="menu-btn secondary-btn"
            onClick={() => handleButtonClick(() => setShowSettings(true))}
          >
            <div className="btn-inner">
              <Settings size={18} color="#00f3ff" />
              <span>AYARLAR</span>
            </div>
          </button>

          {/* Button 3: CREDITS (YAPIMCILAR) */}
          <button
            className="menu-btn secondary-btn"
            onClick={() => handleButtonClick(() => setShowCredits(true))}
          >
            <div className="btn-inner">
              <Info size={18} color="#a855f7" />
              <span>CREDITS</span>
            </div>
          </button>
        </div>

        {/* Bottom Quick Links / How to Play */}
        <div className="menu-footer">
          <button
            className="menu-help-link"
            onClick={() => handleButtonClick(() => setShowGuide(true))}
          >
            <HelpCircle size={14} color="#94a3b8" />
            <span>Nasıl Oynanır & Rehber</span>
          </button>
        </div>
      </div>

      {/* 4. Settings Modal */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      {/* 5. Credits Modal */}
      {showCredits && (
        <div className="modal-overlay" onClick={() => setShowCredits(false)}>
          <div className="modal-card menu-submodal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3 className="modal-title">YAPIMCILAR & KÜNYE</h3>
              <button className="modal-close-btn" onClick={() => setShowCredits(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="credits-content">
              <div className="credit-block">
                <h4 className="credit-role">OYUN GELİŞTİRME & TASARIM</h4>
                <p className="credit-name">Crush Space Core Team</p>
              </div>

              <div className="credit-block">
                <h4 className="credit-role">OYUN MOTORU & TEKNOLOJİLER</h4>
                <p className="credit-desc">
                  React 19 • HTML5 Canvas 60 FPS • Web Audio Procedural Synthesizer • Expo SDK 54
                </p>
              </div>

              <div className="credit-block">
                <h4 className="credit-role">SÜRÜM</h4>
                <span className="version-tag">v1.0.0 (Release Build)</span>
              </div>
            </div>

            <button className="cyber-btn secondary" onClick={() => setShowCredits(false)} style={{ marginTop: '8px' }}>
              KAPAT
            </button>
          </div>
        </div>
      )}

      {/* 6. Guide / Tutorial Modal */}
      {showGuide && (
        <div className="modal-overlay" onClick={() => setShowGuide(false)}>
          <div className="modal-card menu-submodal" style={{ maxHeight: '85vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3 className="modal-title">NASIL OYNANIR?</h3>
              <button className="modal-close-btn" onClick={() => setShowGuide(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5' }}>
              <p>
                🛡️ <strong>8-Şerit Savunması:</strong> Alt 8 sütunda yaptığınız eşleşmeler, üstteki aynı şeridin taretinden anında yukarı lazer ve füze fırlatır.
              </p>
              <p>
                🌌 <strong>Sol & Sağ Kanat:</strong> Izgara sol (şerit 1-4) ve sağ (şerit 5-8) olmak üzere iki kanada ayrılmıştır. Her iki kanatta da her an en az 1 yatay eşleşme fırsatı bulunur!
              </p>
              <p>
                🕳️ <strong>Hiçlik Girdabı:</strong> Mor taşlar şeritlerin en üstünde düşmanları yukarı geri çeken ve süresi/kuvveti geliştirilebilen bir kara delik açar.
              </p>
            </div>

            <button className="cyber-btn" onClick={() => setShowGuide(false)} style={{ marginTop: '12px' }}>
              ANLADIM
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const MainMenu = React.memo(MainMenuComponent);
