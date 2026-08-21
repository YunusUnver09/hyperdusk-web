import React, { useState, useEffect } from 'react';
import { gameEngine } from '../game/engine';
import type { UIState } from '../game/types';
import { HUD } from './HUD';
import { BattlefieldCanvas } from './BattlefieldCanvas';
import { SpecialAbilities } from './SpecialAbilities';
import { Match3Grid } from './Match3Grid';
import { Modals } from './Modals';
import { coreManager } from '../game/coreManager';

export const GameContainer: React.FC = () => {
  const [uiState, setUiState] = useState<UIState>(() => ({
    shieldHp: 1000,
    maxShieldHp: 1000,
    energy: 20,
    maxEnergy: 100,
    combo: 0,
    comboTimer: 0,
    score: 0,
    wave: 1,
    maxWaves: 8,
    waveProgress: 0,
    isBossWave: false,
    currentLevel: 1,
    unlockedLevel: 1,
    levelName: 'Sektör 1: Asteroid Kuşağı',
    gameState: 'menu',
    coreFragments: coreManager.getFragments(),
    activeCores: coreManager.getActiveCores(),
    unlockedCores: coreManager.getUnlockedCores(),
    activeLanes: [],
    threatenedLanes: [],
    bossLanes: [],
    abilitiesReady: {
      orbital: false,
      emp: false,
      shieldOvercharge: false
    }
  }));

  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    gameEngine.onUIStateChange = (state) => {
      setUiState({ ...state });
    };

    // Auto-start loop so canvas can render background animations even on menu
    gameEngine.startLoop();

    return () => {
      gameEngine.stopLoop();
    };
  }, []);

  const handleStartGame = () => {
    gameEngine.openMap();
  };

  const handlePauseGame = () => {
    gameEngine.pauseGame();
  };

  const handleResumeGame = () => {
    gameEngine.resumeGame();
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="game-viewport">
      {/* 1. Top HUD Bar */}
      <HUD
        uiState={uiState}
        onPause={handlePauseGame}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* 2. Top Half: 8-Lane 60 FPS HTML5 Canvas Battlefield */}
      <BattlefieldCanvas combo={uiState.combo} />

      {/* 3. Middle Bar: Special Abilities */}
      <SpecialAbilities uiState={uiState} />

      {/* 4. Bottom Half: 8x8 Tactical Match-3 Gem Grid with Column Threat Indicators */}
      <Match3Grid uiState={uiState} />

      {/* 5. Modals & Screens (Menu, Upgrade Cards, Game Over, Victory, Pause, Tutorial) */}
      <Modals
        uiState={uiState}
        onStartGame={handleStartGame}
        onResumeGame={handleResumeGame}
      />

      {/* 6. Cinematic Entrance Fade Curtain on Gameplay Start */}
      {uiState.gameState === 'playing' && (
        <div
          key={`curtain_${uiState.currentLevel}_${uiState.wave}`}
          className="gameplay-entrance-fade-curtain"
          aria-hidden="true"
        />
      )}
    </div>
  );
};
