import React, { useState, useEffect } from 'react';
import type { GemType } from './game/types';
import { GameContainer } from './components/GameContainer';
import { HyperduskPortal } from './components/studio/HyperduskPortal';
import { coreManager } from './game/coreManager';
import { Sparkles, ArrowLeft, Maximize, Minimize } from 'lucide-react';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'portal' | 'game'>('portal');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        const docEl = document.documentElement as any;
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen().catch(() => {});
        } else if (docEl.webkitRequestFullscreen) {
          docEl.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    } catch {
      // Ignored if browser blocks
    }
  };

  const handleLaunchGame = (specificCore?: GemType) => {
    if (specificCore) {
      const unlocked = coreManager.getUnlockedCores();
      if (!unlocked.includes(specificCore)) {
        coreManager.unlockCore(specificCore);
      }
      const active = coreManager.getActiveCores();
      if (!active.includes(specificCore)) {
        const newActive = [...active];
        newActive[0] = specificCore;
        coreManager.setActiveCores(newActive);
      }
    }
    
    // Auto-scroll & attempt fullscreen on mobile to hide browser address/search bar
    window.scrollTo(0, 1);
    toggleFullscreen();
    setCurrentView('game');
  };

  const handleBackToStudio = () => {
    setCurrentView('portal');
  };

  return (
    <div className="hyperdusk-app-root">
      {currentView === 'portal' ? (
        <HyperduskPortal
          onPlayGame={handleLaunchGame}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
        />
      ) : (
        <div className="game-desktop-wrapper">
          <div className="game-wrapper-view">
            {/* Top Return to Studio Navigation Bar */}
            <div className="game-top-studio-bar">
              <button className="back-to-studio-btn" onClick={handleBackToStudio}>
                <ArrowLeft size={16} />
                <span>HYPERDUSK STÜDYO</span>
              </button>

              <div className="game-studio-badge">
                <Sparkles size={14} color="#00f3ff" />
                <span>CRUSH SPACE // CANLI ARCADE</span>
              </div>

              {/* Fullscreen Toggle Button */}
              <button
                className="fullscreen-toggle-btn"
                onClick={toggleFullscreen}
                aria-label="Tam Ekran"
                title="Tam Ekran Modu (Arama çubuğunu gizle)"
              >
                {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                <span className="fs-btn-text">{isFullscreen ? 'KÜÇÜLT' : 'TAM EKRAN'}</span>
              </button>
            </div>

            {/* Core Game Component */}
            <GameContainer />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
