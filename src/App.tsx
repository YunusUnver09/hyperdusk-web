import React, { useState, useEffect } from 'react';
import type { GemType } from './game/types';
import { GameContainer } from './components/GameContainer';
import { HyperduskPortal } from './components/studio/HyperduskPortal';
import { coreManager } from './game/coreManager';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'portal' | 'game'>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('view') === 'portal' || window.location.hash === '#portal') {
        return 'portal';
      }
    }
    return 'game';
  });
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
            <GameContainer
              onBackToStudio={handleBackToStudio}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
