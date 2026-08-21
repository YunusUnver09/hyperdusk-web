import React, { useState, useEffect, useRef } from 'react';
import type { GemType } from '../../game/types';
import { StudioHeader } from './StudioHeader';
import { HeroSection } from './HeroSection';
import { FeaturedGameSection } from './FeaturedGameSection';
import { CoreLabSection } from './CoreLabSection';
import { GamesVaultSection } from './GamesVaultSection';
import { StudioAboutSection } from './StudioAboutSection';
import { CommunityFooter } from './CommunityFooter';

interface HyperduskPortalProps {
  onPlayGame: (specificCore?: GemType) => void;
}

export const HyperduskPortal: React.FC<HyperduskPortalProps> = ({ onPlayGame }) => {
  const [activeSection, setActiveSection] = useState('hero');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Background Starfield & Cyber Particle Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Stars & Nebula particles
    const stars: Array<{ x: number; y: number; size: number; speed: number; alpha: number; color: string }> = [];
    const colors = ['#00f3ff', '#a855f7', '#38bdf8', '#ffffff', '#ffd000'];

    for (let i = 0; i < 75; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.4 + 0.1,
        alpha: Math.random() * 0.7 + 0.3,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep space subtle gradient
      const grad = ctx.createRadialGradient(width * 0.5, height * 0.3, 50, width * 0.5, height * 0.3, width * 0.8);
      grad.addColorStop(0, 'rgba(112, 0, 255, 0.06)');
      grad.addColorStop(0.5, 'rgba(0, 243, 255, 0.03)');
      grad.addColorStop(1, 'rgba(7, 10, 20, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Render drifting stars
      for (const s of stars) {
        s.y += s.speed;
        if (s.y > height) {
          s.y = 0;
          s.x = Math.random() * width;
        }

        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.alpha * (0.8 + Math.sin(Date.now() * 0.002 + s.x) * 0.2);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    const elem = document.getElementById(sectionId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="hyperdusk-portal-layout">
      {/* Background Starfield Canvas */}
      <canvas ref={canvasRef} className="portal-canvas-bg" />

      {/* Header */}
      <StudioHeader
        onPlayClick={() => onPlayGame()}
        onNavigate={handleNavigate}
        activeSection={activeSection}
      />

      {/* Main Content Sections */}
      <main className="portal-main-content">
        <HeroSection
          onPlayClick={() => onPlayGame()}
          onExploreLabClick={() => handleNavigate('core-lab')}
        />

        <FeaturedGameSection
          onPlayClick={() => onPlayGame()}
        />

        <CoreLabSection
          onPlayWithCore={(coreType) => onPlayGame(coreType)}
        />

        <GamesVaultSection
          onPlayGame={() => onPlayGame()}
        />

        <StudioAboutSection />

        <CommunityFooter
          onNavigate={handleNavigate}
        />
      </main>
    </div>
  );
};
