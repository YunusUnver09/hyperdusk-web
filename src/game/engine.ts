import { BattlefieldEngine } from './battlefieldEngine';
import { Match3Engine } from './match3Engine';
import type { UIState, MatchResult, UpgradeOption, GameState, RolledUpgradeOption } from './types';
import { BASE_ENERGY_MAX, COMBO_TIMEOUT_MS, rollActiveCoreUpgrades } from './constants';
import { getLevelConfig, TOTAL_LEVELS } from './levelData';
import { soundManager } from './soundManager';
import { coreManager } from './coreManager';

export class GameEngine {
  public battlefield: BattlefieldEngine;
  public match3: Match3Engine;

  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  public isRunning: boolean = false;
  public isPaused: boolean = false;

  // Level Progression & Map State
  public currentLevel: number = 1;
  public unlockedLevel: number = 1;

  // Energy & Special Abilities
  public energy: number = 0;
  public maxEnergy: number = BASE_ENERGY_MAX;

  // Combo decay tracking
  public comboTimer: number = 0;

  // Throttled UI State Callback to React
  public onUIStateChange?: (state: UIState) => void;
  private uiThrottleTimer: number = 0;

  public gameState: GameState = 'menu';

  constructor() {
    this.battlefield = new BattlefieldEngine();
    this.match3 = new Match3Engine();
    this.loop = this.loop.bind(this);

    // Link Match3 to Battlefield weapons
    this.match3.onMatchProduced = (result: MatchResult) => {
      this.handleMatchResult(result);
    };

    // Link Battlefield events
    this.battlefield.onShieldDamage = () => {
      this.syncUIState();
    };

    this.battlefield.onEnemyKilled = () => {
      this.syncUIState();
    };

    this.battlefield.onWaveCleared = (wave) => {
      soundManager.setMuffled(true);
      if (wave >= 8) {
        // Level Defeated! Unlock next level and reward fragments
        coreManager.addFragments(45);
        if (this.currentLevel >= this.unlockedLevel && this.unlockedLevel < TOTAL_LEVELS) {
          this.unlockedLevel = this.currentLevel + 1;
          try {
            localStorage.setItem('crush_space_unlocked_level', this.unlockedLevel.toString());
          } catch {
            // Ignore
          }
        }

        if (this.currentLevel >= TOTAL_LEVELS) {
          this.gameState = 'victory';
        } else {
          this.gameState = 'level_victory';
        }
      } else {
        // Wave cleared: reward core fragments (more on wave 4 mini boss)
        coreManager.addFragments(wave === 4 ? 15 : 6);
        this.gameState = 'wave_cleared';
      }
      this.syncUIState();
    };

    this.battlefield.onGameOver = () => {
      this.gameState = 'game_over';
      soundManager.setMuffled(true);
      if (this.battlefield.stats.score > this.battlefield.stats.highScore) {
        this.battlefield.stats.highScore = this.battlefield.stats.score;
        try {
          localStorage.setItem('crush_space_highscore', this.battlefield.stats.score.toString());
        } catch {
          // ignore localstorage error
        }
      }
      this.syncUIState();
    };

    // Load Highscore & Unlocked Level
    try {
      const savedHigh = localStorage.getItem('crush_space_highscore');
      if (savedHigh) {
        this.battlefield.stats.highScore = parseInt(savedHigh, 10) || 0;
      }
      const savedUnlocked = localStorage.getItem('crush_space_unlocked_level');
      if (savedUnlocked) {
        this.unlockedLevel = Math.max(1, Math.min(TOTAL_LEVELS, parseInt(savedUnlocked, 10) || 1));
      }
    } catch {
      // Ignore
    }
  }

  public openMap() {
    this.gameState = 'map';
    this.isPaused = false;
    soundManager.setMuffled(false);
    soundManager.playMapTheme();
    this.syncUIState();
  }

  public openMenu() {
    this.gameState = 'menu';
    this.isPaused = false;
    soundManager.setMuffled(false);
    soundManager.playMenuTheme();
    this.syncUIState();
  }

  public unlockAllDevMode() {
    this.unlockedLevel = TOTAL_LEVELS;
    try {
      localStorage.setItem('crush_space_unlocked_level', TOTAL_LEVELS.toString());
    } catch {}
    coreManager.unlockAllCores();
    this.gameState = 'map';
    this.isPaused = false;
    soundManager.setMuffled(false);
    soundManager.playVictory();
    soundManager.playMapTheme();
    this.syncUIState(true);
  }

  public skipToNextSectorDevMode(): number {
    let nextSectorStart = 1;
    if (this.unlockedLevel < 9) {
      nextSectorStart = 9; // Sektör 2 (Bölüm 9)
    } else if (this.unlockedLevel < 17) {
      nextSectorStart = 17; // Sektör 3 (Bölüm 17)
    } else if (this.unlockedLevel < 24) {
      nextSectorStart = 24; // Sektör 3 Galaktik Nihai Patron (Bölüm 24)
    } else {
      nextSectorStart = 1; // Sektör 1 (Başa döner)
    }

    this.unlockedLevel = Math.max(this.unlockedLevel, nextSectorStart);
    this.currentLevel = nextSectorStart;
    try {
      localStorage.setItem('crush_space_unlocked_level', this.unlockedLevel.toString());
    } catch {}

    coreManager.addFragments(50);
    soundManager.playVictory();
    this.syncUIState(true);
    return nextSectorStart;
  }

  public startLevel(levelNumber: number = 1) {
    this.currentLevel = Math.max(1, Math.min(TOTAL_LEVELS, levelNumber));
    this.battlefield.resetGame(this.currentLevel);
    this.match3.initBoard();
    this.energy = 20;
    this.comboTimer = 0;
    this.gameState = 'playing';
    this.isPaused = false;
    this.isRunning = true;
    soundManager.playLevelTheme(this.currentLevel);
    soundManager.setMuffled(false);
    this.battlefield.startWave(1);
    this.startLoop();
    this.syncUIState();
  }

  public startGame() {
    this.startLevel(this.currentLevel || 1);
  }

  public continueToNextLevel() {
    if (this.currentLevel < TOTAL_LEVELS) {
      this.startLevel(this.currentLevel + 1);
    } else {
      this.openMap();
    }
  }

  public rollUpgrades(): RolledUpgradeOption[] {
    const activeCores = coreManager.getActiveCores();
    return rollActiveCoreUpgrades(
      activeCores,
      this.battlefield.coreUpgradeLevels,
      this.battlefield.stats,
      this.battlefield.upgrades,
      this.battlefield,
      (core, newLevel) => {
        this.battlefield.coreUpgradeLevels[core] = newLevel;
      }
    );
  }

  public continueToNextWave() {
    this.gameState = 'playing';
    this.isPaused = false;
    soundManager.setMuffled(false);
    this.battlefield.startWave(this.battlefield.currentWave + 1);
    this.syncUIState();
  }

  public applyUpgrade(upgrade: RolledUpgradeOption | UpgradeOption) {
    if ('apply' in upgrade && typeof upgrade.apply === 'function') {
      if (upgrade.apply.length === 0) {
        (upgrade as RolledUpgradeOption).apply();
      } else {
        (upgrade as UpgradeOption).apply(this.battlefield.stats, this.battlefield.upgrades, this.battlefield);
      }
    }
    this.continueToNextWave();
  }

  public pauseGame() {
    if (this.gameState === 'playing') {
      this.gameState = 'paused';
      this.isPaused = true;
      soundManager.setMuffled(true);
      this.syncUIState();
    }
  }

  public resumeGame() {
    if (this.gameState === 'paused') {
      this.gameState = 'playing';
      this.isPaused = false;
      soundManager.setMuffled(false);
      this.lastTime = performance.now();
      this.syncUIState();
    }
  }

  public startLoop() {
    if (this.isRunning && this.animationFrameId !== null) return;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  public stopLoop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isRunning = false;
  }

  private loop(currentTime: number) {
    if (!this.isRunning) return;

    // Immediately schedule next frame so loop NEVER halts under any circumstances
    this.animationFrameId = requestAnimationFrame(this.loop);

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Clamp dt to prevent spiral of death
    this.lastTime = currentTime;

    try {
      if (this.gameState === 'playing' || this.gameState === 'paused') {
        if (!this.isPaused && this.gameState === 'playing') {
          // Update Battlefield (Enemies, Projectiles, Particles, Waves)
          this.battlefield.update(dt);

          // Update Match-3 (hint generator, idle timer)
          this.match3.update(dt);

          // Update Combo decay
          if (this.match3.combo > 0) {
            this.comboTimer += dt * 1000;
            if (this.comboTimer >= COMBO_TIMEOUT_MS) {
              this.match3.combo = 0;
              this.comboTimer = 0;
              this.syncUIState();
            }
          }

          // Passive Energy recharge
          if (this.energy < this.maxEnergy) {
            this.energy = Math.min(this.maxEnergy, this.energy + dt * 1.5 * this.battlefield.upgrades.energyRechargeRate);
          }
        }

        // Render Canvas at 60 FPS only during active game screen
        this.battlefield.render();

        // Throttled UI State dispatch to React
        this.uiThrottleTimer += dt;
        if (this.uiThrottleTimer >= 0.065) {
          this.uiThrottleTimer = 0;
          this.syncUIState();
        }
      }
    } catch (err) {
      console.warn('Recovered from loop step error:', err);
    }
  }

  private handleMatchResult(result: MatchResult) {
    this.comboTimer = 0;
    this.energy = Math.min(this.maxEnergy, this.energy + result.energyGained);
    this.battlefield.stats.score += result.scoreGained;
    this.battlefield.stats.matchesMade++;
    this.battlefield.stats.maxCombo = Math.max(this.battlefield.stats.maxCombo, result.combo);

    // Fire weapons in each matched column!
    for (const [colStr, hitData] of Object.entries(result.columnHits)) {
      const col = parseInt(colStr, 10);
      this.battlefield.fireLaneWeapons(
        col,
        hitData.type,
        hitData.count,
        hitData.specialCount,
        result.combo
      );
    }

    // Dikey matchler kendi sütununa ek olarak 1. (0) ve 8. (7) sütunlardan da ateşleme yapsın
    for (const group of result.matchGroups) {
      if (group.isVertical) {
        const mainCol = group.gems[0]?.col ?? 0;
        const flankCount = Math.max(1, group.count);

        // 1. Sütun (Kolon 0 - En Sol Kenar)
        if (mainCol !== 0) {
          this.battlefield.fireLaneWeapons(
            0,
            group.type,
            flankCount,
            0,
            result.combo
          );
        }

        // 8. Sütun (Kolon 7 - En Sağ Kenar)
        if (mainCol !== 7) {
          this.battlefield.fireLaneWeapons(
            7,
            group.type,
            flankCount,
            0,
            result.combo
          );
        }
      }
    }

    this.syncUIState();
  }

  // Trigger Special Player Abilities
  public useOrbitalStrike(): boolean {
    if (this.energy >= 80 && this.gameState === 'playing') {
      this.energy -= 80;
      this.battlefield.triggerOrbitalStrike();
      this.syncUIState();
      return true;
    }
    return false;
  }

  public useEmpNova(): boolean {
    if (this.energy >= 50 && this.gameState === 'playing') {
      this.energy -= 50;
      this.battlefield.triggerEmpNova();
      this.syncUIState();
      return true;
    }
    return false;
  }

  public useShieldOvercharge(): boolean {
    if (this.energy >= 40 && this.gameState === 'playing') {
      this.energy -= 40;
      this.battlefield.triggerShieldOvercharge();
      this.syncUIState();
      return true;
    }
    return false;
  }

  private lastSyncedKey: string = '';

  public syncUIState(force: boolean = false) {
    if (!this.onUIStateChange) return;

    const activeLanes = this.battlefield.turrets
      .filter(t => t.glowIntensity > 0.1)
      .map(t => t.lane);

    // Compute which columns/lanes currently have incoming enemies in real-time
    const threatenedLanesSet = new Set<number>();
    const bossLanesSet = new Set<number>();
    const laneWidth = this.battlefield.getLaneWidth() || (this.battlefield.width > 0 ? this.battlefield.width / 8 : 0);

    for (const enemy of this.battlefield.enemies) {
      if (enemy.y > -50 && enemy.y <= this.battlefield.shieldBarrierY + 15) {
        if (enemy.isBoss && enemy.lanesCovered) {
          for (const l of enemy.lanesCovered) {
            threatenedLanesSet.add(l);
            bossLanesSet.add(l);
          }
        } else {
          const currentLane = laneWidth > 0
            ? Math.max(0, Math.min(7, Math.floor(enemy.x / laneWidth)))
            : (typeof enemy.lane === 'number' ? enemy.lane : 0);

          if (currentLane >= 0 && currentLane < 8) {
            threatenedLanesSet.add(currentLane);
          }
        }
      }
    }

    const roundedShield = Math.round(this.battlefield.shieldHp);
    const roundedEnergy = Math.round(this.energy);
    const threatenedArr = Array.from(threatenedLanesSet);
    const bossArr = Array.from(bossLanesSet);
    const bossHp = this.battlefield.activeBoss?.hp ? Math.round(this.battlefield.activeBoss.hp) : 0;

    const currentFragments = coreManager.getFragments();
    const activeCores = coreManager.getActiveCores();
    const unlockedCores = coreManager.getUnlockedCores();

    // Fast change detection to avoid firing React renders when nothing changed
    const syncKey = `${roundedShield}_${roundedEnergy}_${this.match3.combo}_${this.battlefield.stats.score}_${this.battlefield.currentWave}_${this.gameState}_${threatenedArr.join(',')}_${bossArr.join(',')}_${bossHp}_${activeLanes.join(',')}_${currentFragments}_${activeCores.join(',')}`;
    if (!force && syncKey === this.lastSyncedKey) {
      return;
    }
    this.lastSyncedKey = syncKey;

    const waveRemaining = this.battlefield.waveEnemiesToSpawn - this.battlefield.waveEnemiesSpawned + this.battlefield.enemies.length;
    const waveProgress = this.battlefield.waveEnemiesToSpawn > 0
      ? 1 - Math.max(0, waveRemaining / this.battlefield.waveEnemiesToSpawn)
      : 1;
    const lvlConfig = getLevelConfig(this.currentLevel);

    const uiState: UIState = {
      shieldHp: roundedShield,
      maxShieldHp: this.battlefield.maxShieldHp,
      energy: roundedEnergy,
      maxEnergy: this.maxEnergy,
      combo: this.match3.combo,
      comboTimer: this.comboTimer,
      score: this.battlefield.stats.score,
      wave: this.battlefield.currentWave,
      maxWaves: 8,
      waveProgress,
      isBossWave: this.battlefield.isBossActive,
      isMiniBoss: this.battlefield.isMiniBoss,
      isMainBoss: this.battlefield.isMainBoss,
      bossHp: this.battlefield.activeBoss?.hp,
      bossMaxHp: this.battlefield.activeBoss?.maxHp,
      bossName: this.battlefield.activeBoss?.name,
      currentLevel: this.currentLevel,
      unlockedLevel: this.unlockedLevel,
      levelName: lvlConfig.name,
      gameState: this.gameState,
      coreFragments: currentFragments,
      activeCores,
      unlockedCores,
      activeLanes,
      threatenedLanes: threatenedArr,
      bossLanes: bossArr,
      abilitiesReady: {
        orbital: roundedEnergy >= 80,
        emp: roundedEnergy >= 50,
        shieldOvercharge: roundedEnergy >= 40
      }
    };

    this.onUIStateChange(uiState);
  }
}

export const gameEngine = new GameEngine();
