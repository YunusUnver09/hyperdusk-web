import React, { useState } from 'react';
import type { GemType } from './game/types';
import { GameContainer } from './components/GameContainer';
import { HyperduskPortal } from './components/studio/HyperduskPortal';
import { coreManager } from './game/coreManager';
import { Sparkles, ArrowLeft } from 'lucide-react';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'portal' | 'game'>('portal');

  const handleLaunchGame = (specificCore?: GemType) => {
    if (specificCore) {
      // If player clicked to play with a specific core from Core Lab, ensure it is unlocked and equipped
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
    setCurrentView('game');
  };

  const handleBackToStudio = () => {
    setCurrentView('portal');
  };

  return (
    <div className="hyperdusk-app-root">
      {currentView === 'portal' ? (
        <HyperduskPortal onPlayGame={handleLaunchGame} />
      ) : (
        <div className="game-wrapper-view">
          {/* Top Return to Studio Navigation Bar */}
          <div className="game-top-studio-bar">
            <button className="back-to-studio-btn" onClick={handleBackToStudio}>
              <ArrowLeft size={16} />
              <span>HYPERDUSK STÜDYO</span>
            </button>
            <div className="game-studio-badge">
              <Sparkles size={14} color="#00f3ff" />
              <span>CRUSH SPACE // CANLI ARCADE MODU</span>
            </div>
          </div>

          {/* Core Game Component */}
          <GameContainer />
        </div>
      )}
    </div>
  );
};

export default App;
