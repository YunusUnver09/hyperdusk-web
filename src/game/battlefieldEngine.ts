import type {
  Enemy,
  EnemyType,
  Projectile,
  Turret,
  GemType,
  PlayerUpgrades,
  GameStats
} from './types';
import { NUM_LANES, GEM_ELEMENTS, BASE_SHIELD_MAX } from './constants';
import { getLevelConfig } from './levelData';
import { ParticleSystem } from './particleSystem';
import { soundManager } from './soundManager';

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
}

export class BattlefieldEngine {
  public canvas: HTMLCanvasElement | null = null;
  public ctx: CanvasRenderingContext2D | null = null;
  public width: number = 0;
  public height: number = 0;
  public dpr: number = 1;

  public enemies: Enemy[] = [];
  public projectiles: Projectile[] = [];
  public turrets: Turret[] = [];
  public particles: ParticleSystem = new ParticleSystem();

  public currentLevel: number = 1;
  public currentWave: number = 1;
  public waveEnemiesToSpawn: number = 0;
  public waveEnemiesSpawned: number = 0;
  public waveSpawnTimer: number = 0;
  public waveSpawnInterval: number = 1.6;
  public isWaveInProgress: boolean = false;
  public isBossActive: boolean = false;
  public isMiniBoss: boolean = false;
  public isMainBoss: boolean = false;
  public activeBoss: Enemy | null = null;

  // Station Defense Shield
  public shieldHp: number = BASE_SHIELD_MAX;
  public maxShieldHp: number = BASE_SHIELD_MAX;
  public shieldHitFlash: number = 0;
  public shieldBarrierY: number = 0;

  // 6 New Core Systems State
  public lastTriggeredElement: GemType = 'plasma';
  public wormholes: Array<{
    id: string;
    inLane: number;
    inX: number;
    inY: number;
    outLane: number;
    outX: number;
    outY: number;
    life: number;
    maxLife: number;
    radius: number;
  }> = [];
  public staticMines: Array<{
    id: string;
    lane: number;
    x: number;
    y: number;
    radius: number;
    life: number;
    maxLife: number;
    damage: number;
    triggered: boolean;
  }> = [];
  public homingSpores: Array<{
    id: string;
    x: number;
    y: number;
    targetEnemyId: string;
    speed: number;
    life: number;
  }> = [];
  public spectrumWalls: Array<{
    id: string;
    y: number;
    life: number;
    maxLife: number;
    tickTimer: number;
    damage: number;
    laserStartX: number;
    laserStartY: number;
    laserHitY: number;
    laserLife: number;
    laserMaxLife: number;
  }> = [];
  public orbitalDrones: Array<{
    id: string;
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    patrolDir: number;
    life: number;
    maxLife: number;
    fireTimer: number;
    fireInterval: number;
    bulletDamage: number;
    angle: number;
    targetEnemyId: string | null;
  }> = [];
  public supernovaStars: Array<{
    id: string;
    lane: number;
    x: number;
    y: number;
    targetY: number;
    life: number;
    maxLife: number;
    radius: number;
    maxRadius: number;
    damage: number;
    pulseAngle: number;
  }> = [];
  public kineticDeflectorTimer: number = 0;

  // Background stars
  private stars: Star[] = [];

  // Upgrades & Stats
  public upgrades: PlayerUpgrades = {
    plasmaDamageMult: 1,
    cryoDurationMult: 1,
    electricChainBonus: 1,
    explosiveAoeMult: 1,
    nanoShieldBoost: 1,
    voidVortexDuration: 1,
    voidVortexPullForce: 1,
    voidVortexDamageMult: 0,
    baseMaxShield: BASE_SHIELD_MAX,
    turretFireRate: 1,
    critChance: 0.1,
    energyRechargeRate: 1
  };

  public stats: GameStats = {
    score: 0,
    highScore: 0,
    wave: 1,
    maxWaves: 8,
    enemiesKilled: 0,
    combosMade: 0,
    maxCombo: 0,
    matchesMade: 0,
    specialsTriggered: 0,
    damageDealt: 0
  };

  // Hit-Stop / Time Dilation (Micro Slow-Motion on Impact)
  public hitStopTimer: number = 0;
  public timeDilationScale: number = 1.0;

  // Callbacks
  public onShieldDamage?: (hp: number, maxHp: number) => void;
  public onEnemyKilled?: (enemy: Enemy, score: number) => void;
  public onWaveCleared?: (wave: number) => void;
  public onGameOver?: () => void;

  constructor() {
    this.initTurrets();
    this.initStars(45);
  }

  public triggerHitStop(duration: number = 0.07, scale: number = 0.22) {
    this.hitStopTimer = Math.max(this.hitStopTimer, duration);
    this.timeDilationScale = scale;
  }

  public initTurrets() {
    this.turrets = [];
    for (let i = 0; i < NUM_LANES; i++) {
      this.turrets.push({
        lane: i,
        level: 1,
        recoil: 0,
        recoilAngle: 0,
        glowIntensity: 0,
        socketGlow: 0,
        muzzleFlash: 0,
        conduitPulse: 0,
        lastFiredElement: 'idle',
        chargeLevel: 0
      });
    }
  }

  private initStars(count: number) {
    this.stars = [];
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        size: Math.random() * 1.8 + 0.5,
        speed: Math.random() * 35 + 15,
        alpha: Math.random() * 0.7 + 0.3
      });
    }
  }

  public setCanvas(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.resize();
  }

  private bgGradient: CanvasGradient | null = null;

  public resize() {
    if (!this.canvas || !this.ctx) return;
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = rect.width || 400;
    this.height = rect.height || 340;

    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.shieldBarrierY = this.height - 38;
    this.initStars(35);

    // Pre-cache background gradient once on resize
    const bgGrad = this.ctx.createRadialGradient(
      this.width * 0.5,
      this.height * 0.3,
      20,
      this.width * 0.5,
      this.height * 0.3,
      this.width * 0.8
    );
    bgGrad.addColorStop(0, 'rgba(112, 0, 255, 0.12)');
    bgGrad.addColorStop(0.6, 'rgba(0, 243, 255, 0.05)');
    bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.bgGradient = bgGrad;
  }

  public startWave(waveNumber: number) {
    this.currentWave = waveNumber;
    this.stats.wave = waveNumber;
    this.isWaveInProgress = true;
    this.waveSpawnTimer = 0.5; // Quick initial spawn

    // Wave 4 is Mini Boss, Wave 8 is Main Sector Boss
    const isMini = waveNumber === 4;
    const isMain = waveNumber === 8;
    const isBoss = isMini || isMain;
    this.isBossActive = isBoss;
    this.isMiniBoss = isMini;
    this.isMainBoss = isMain;
    this.activeBoss = null;

    if (isMain) {
      this.waveEnemiesToSpawn = 12 + this.currentLevel * 2;
      this.waveSpawnInterval = 1.4;
    } else if (isMini) {
      this.waveEnemiesToSpawn = 10 + this.currentLevel * 2;
      this.waveSpawnInterval = 1.3;
    } else {
      this.waveEnemiesToSpawn = 7 + waveNumber * 2 + this.currentLevel;
      this.waveSpawnInterval = Math.max(0.65, 1.5 - waveNumber * 0.08);
    }
    this.waveEnemiesSpawned = 0;
  }

  public getLaneX(laneIndex: number): number {
    const laneWidth = this.width / NUM_LANES;
    return (laneIndex + 0.5) * laneWidth;
  }

  public getLaneWidth(): number {
    return this.width / NUM_LANES;
  }

  public spawnEnemy(forceBoss: boolean = false) {
    if (!this.isWaveInProgress) return;
    const laneWidth = this.getLaneWidth();
    const lvlConfig = getLevelConfig(this.currentLevel);
    const diff = lvlConfig.difficultyMult;

    if (forceBoss || (this.isBossActive && !this.activeBoss && this.waveEnemiesSpawned >= Math.floor(this.waveEnemiesToSpawn * 0.28))) {
      if (this.isMainBoss) {
        // Spawn Main Titan Boss (covers lanes 2, 3, 4, 5)
        const bossHp = Math.round((2800 + this.currentLevel * 950) * diff);
        const boss: Enemy = {
          id: `boss_main_${Date.now()}`,
          type: 'titan_boss',
          isBoss: true,
          name: lvlConfig.mainBossName,
          lane: 3.5,
          lanesCovered: [2, 3, 4, 5],
          x: this.getLaneX(3.5),
          y: -95,
          width: laneWidth * 3.4,
          height: 78,
          hp: bossHp,
          maxHp: bossHp,
          speed: 5.5 + this.currentLevel * 0.5,
          baseSpeed: 5.5 + this.currentLevel * 0.5,
          color: '#ff0055',
          glowColor: 'rgba(255, 0, 85, 0.95)',
          scoreValue: 2000 * this.currentLevel,
          attackPower: 200 + this.currentLevel * 25,
          frozenTimer: 0,
          shockTimer: 0,
          burnTimer: 0,
          hitFlashTimer: 0,
          enginePulse: 0,
          bossPhase: 1,
          attackTimer: 3
        };
        this.enemies.push(boss);
        this.activeBoss = boss;
        this.waveEnemiesSpawned++;
        soundManager.playShieldHit();
        return;
      } else if (this.isMiniBoss) {
        // Spawn Mini Boss (covers lanes 3, 4)
        const bossHp = Math.round((1300 + this.currentLevel * 500) * diff);
        const boss: Enemy = {
          id: `boss_mini_${Date.now()}`,
          type: 'titan_boss',
          isBoss: true,
          name: lvlConfig.miniBossName,
          lane: 3.5,
          lanesCovered: [3, 4],
          x: this.getLaneX(3.5),
          y: -75,
          width: laneWidth * 2.3,
          height: 55,
          hp: bossHp,
          maxHp: bossHp,
          shieldHp: Math.round(bossHp * 0.3),
          maxShieldHp: Math.round(bossHp * 0.3),
          speed: 8 + this.currentLevel * 0.6,
          baseSpeed: 8 + this.currentLevel * 0.6,
          color: '#ffd000',
          glowColor: 'rgba(255, 208, 0, 0.9)',
          scoreValue: 1000 * this.currentLevel,
          attackPower: 120 + this.currentLevel * 15,
          frozenTimer: 0,
          shockTimer: 0,
          burnTimer: 0,
          hitFlashTimer: 0,
          enginePulse: 0,
          bossPhase: 1,
          attackTimer: 2.5
        };
        this.enemies.push(boss);
        this.activeBoss = boss;
        this.waveEnemiesSpawned++;
        soundManager.playShieldHit();
        return;
      }
    }

    // Determine enemy type based on wave progression & sector
    const availableTypes: EnemyType[] = ['drone', 'scout'];
    if (this.currentWave >= 2 || this.currentLevel >= 2) availableTypes.push('speeder');
    if (this.currentWave >= 3 || this.currentLevel >= 3) availableTypes.push('shielded');
    if (this.currentWave >= 5 || this.currentLevel >= 4) availableTypes.push('bomber');

    const randType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    const lane = Math.floor(Math.random() * NUM_LANES);
    const laneX = this.getLaneX(lane);

    let baseHp = (85 + this.currentWave * 30 + this.currentLevel * 25) * diff;
    let speed = (14 + Math.random() * 4 + this.currentWave * 0.8 + this.currentLevel * 0.5) * Math.min(1.4, Math.pow(diff, 0.25));
    let color = '#00f3ff';
    let score = 50 * this.currentLevel;
    let attack = 50 + this.currentLevel * 10;
    let width = laneWidth * 0.72;
    let height = 30;
    let shieldHp: number | undefined = undefined;

    if (randType === 'scout') {
      baseHp *= 0.65;
      speed *= 1.20;
      color = '#00ffcc';
      score = 40 * this.currentLevel;
      attack = 35 + this.currentLevel * 8;
      width *= 0.8;
      height = 24;
    } else if (randType === 'speeder') {
      baseHp *= 0.8;
      speed *= 1.28;
      color = '#ffaa00';
      score = 65 * this.currentLevel;
      attack = 45 + this.currentLevel * 10;
      width *= 0.75;
      height = 26;
    } else if (randType === 'shielded') {
      baseHp *= 1.25;
      speed *= 0.75;
      color = '#a855f7';
      shieldHp = baseHp * 0.75;
      score = 90 * this.currentLevel;
      attack = 70 + this.currentLevel * 15;
      height = 34;
    } else if (randType === 'bomber') {
      baseHp *= 1.6;
      speed *= 0.60;
      color = '#ff3344';
      score = 120 * this.currentLevel;
      attack = 120 + this.currentLevel * 25;
      width *= 0.9;
      height = 36;
    }

    const enemy: Enemy = {
      id: `enemy_${Date.now()}_${Math.random()}`,
      type: randType,
      lane,
      x: laneX,
      y: -35,
      width,
      height,
      hp: baseHp,
      maxHp: baseHp,
      shieldHp,
      maxShieldHp: shieldHp,
      speed,
      baseSpeed: speed,
      color,
      glowColor: color,
      scoreValue: score,
      attackPower: attack,
      frozenTimer: 0,
      shockTimer: 0,
      burnTimer: 0,
      hitFlashTimer: 0,
      enginePulse: Math.random() * Math.PI * 2
    };

    this.enemies.push(enemy);
    this.waveEnemiesSpawned++;
  }

  public fireLaneWeapons(lane: number, type: GemType, count: number, specialCount: number = 0, combo: number = 1) {
    if (lane < 0 || lane >= NUM_LANES) return;
    const turret = this.turrets[lane];
    turret.recoil = 14 + Math.min(6, count * 1.2);
    turret.glowIntensity = 1.0;
    turret.socketGlow = 1.0;
    turret.muzzleFlash = 1.0;
    turret.conduitPulse = 1.0;
    turret.lastFiredElement = type;

    if (type !== 'echo') {
      this.lastTriggeredElement = type;
    }

    const laneX = this.getLaneX(lane);
    const turretY = this.shieldBarrierY + 12;
    const elemColor = GEM_ELEMENTS[type]?.color || '#00f3ff';
    this.particles.addMuzzleBlast(laneX, this.shieldBarrierY - 6, elemColor);
    const baseDmg = 85 * count * (1 + (combo - 1) * 0.35);

    const isCrit = Math.random() < this.upgrades.critChance;
    const critMult = isCrit ? 2.0 : 1.0;

    switch (type) {
      case 'plasma': {
        // Red Plasma Piercing Laser Beam
        const finalDamage = baseDmg * this.upgrades.plasmaDamageMult * critMult;
        soundManager.playLaser();
        this.projectiles.push({
          id: `proj_${Date.now()}_${Math.random()}`,
          type: 'laser_beam',
          lane,
          x: laneX,
          y: turretY,
          startX: laneX,
          startY: turretY,
          targetX: laneX,
          targetY: 0,
          vx: 0,
          vy: -900,
          damage: finalDamage,
          color: GEM_ELEMENTS.plasma.color,
          width: 14 + (specialCount > 0 ? 10 : 0),
          height: this.height,
          radius: 12,
          life: 0,
          maxLife: 0.18,
          pierce: true,
          element: 'plasma'
        });
        this.hitEnemiesInLane(lane, finalDamage, 'plasma', isCrit);
        break;
      }
      case 'cryo': {
        // Blue Cryo Beam
        const finalDamage = baseDmg * 0.8 * critMult;
        soundManager.playCryo();
        this.projectiles.push({
          id: `proj_${Date.now()}_${Math.random()}`,
          type: 'cryo_beam',
          lane,
          x: laneX,
          y: turretY,
          startX: laneX,
          startY: turretY,
          vx: 0,
          vy: -800,
          damage: finalDamage,
          color: GEM_ELEMENTS.cryo.color,
          width: 12,
          height: this.height,
          radius: 10,
          life: 0,
          maxLife: 0.22,
          pierce: true,
          element: 'cryo'
        });
        this.hitEnemiesInLane(lane, finalDamage, 'cryo', isCrit);
        break;
      }
      case 'electric': {
        // Yellow Chain Lightning
        const finalDamage = baseDmg * 0.9 * critMult;
        soundManager.playElectric();
        this.hitEnemiesInLane(lane, finalDamage, 'electric', isCrit);
        // Chain to adjacent lanes
        const leftLane = lane - 1;
        const rightLane = lane + 1;
        const chainDmg = finalDamage * 0.65 * this.upgrades.electricChainBonus;

        if (leftLane >= 0) {
          this.hitEnemiesInLane(leftLane, chainDmg, 'electric', false);
          this.particles.addLightningSpark(laneX, turretY - 80, this.getLaneX(leftLane), turretY - 80);
        }
        if (rightLane < NUM_LANES) {
          this.hitEnemiesInLane(rightLane, chainDmg, 'electric', false);
          this.particles.addLightningSpark(laneX, turretY - 80, this.getLaneX(rightLane), turretY - 80);
        }
        break;
      }
      case 'explosive': {
        // Orange Cluster Rocket
        const finalDamage = baseDmg * 1.25 * this.upgrades.explosiveAoeMult * critMult;
        soundManager.playExplosion(false);
        this.projectiles.push({
          id: `proj_${Date.now()}_${Math.random()}`,
          type: 'cluster_rocket',
          lane,
          x: laneX,
          y: turretY,
          startX: laneX,
          startY: turretY,
          vx: 0,
          vy: -600,
          damage: finalDamage,
          color: GEM_ELEMENTS.explosive.color,
          width: 8,
          height: 18,
          radius: 8,
          life: 0,
          maxLife: 0.8,
          element: 'explosive',
          aoeRadius: this.getLaneWidth() * 2.2
        });
        break;
      }
      case 'nano': {
        // Green Shield Repair & Pulse
        const healAmount = Math.round(50 * count * this.upgrades.nanoShieldBoost);
        this.repairShield(healAmount);
        this.particles.addFloatingText(laneX, turretY - 20, `+${healAmount} SHIELD`, '#00ff88');
        soundManager.playMatch(1);
        break;
      }
      case 'void': {
        // Purple Void Singularity near the top of the battlefield lane
        const vortexY = Math.max(32, this.height * 0.16);
        // Base damage is 0 at start until upgraded
        const finalDamage = baseDmg * 0.9 * this.upgrades.voidVortexDamageMult * critMult;
        soundManager.playMatch(Math.min(5, combo + 1));
        this.projectiles.push({
          id: `proj_${Date.now()}_${Math.random()}`,
          type: 'void_vortex',
          lane,
          x: laneX,
          y: vortexY,
          startX: laneX,
          startY: turretY,
          vx: 0,
          vy: 0,
          damage: finalDamage,
          color: GEM_ELEMENTS.void.color,
          width: 44,
          height: 44,
          radius: 40,
          life: 0,
          maxLife: 2.4 * this.upgrades.voidVortexDuration,
          element: 'void'
        });
        if (finalDamage > 0) {
          this.hitEnemiesInLane(lane, finalDamage * 0.5, 'void', isCrit);
        }
        break;
      }
      case 'solaris': {
        // Solaris Burning Beam
        const finalDamage = baseDmg * 1.15 * critMult;
        soundManager.playLaser();
        this.projectiles.push({
          id: `proj_${Date.now()}_${Math.random()}`,
          type: 'solaris_beam',
          lane,
          x: laneX,
          y: turretY,
          startX: laneX,
          startY: turretY,
          vx: 0,
          vy: -950,
          damage: finalDamage,
          color: GEM_ELEMENTS.solaris.color,
          width: 16,
          height: this.height,
          radius: 12,
          life: 0,
          maxLife: 0.2,
          pierce: true,
          element: 'solaris'
        });
        this.hitEnemiesInLane(lane, finalDamage, 'solaris', isCrit);
        // Apply burning effect to all enemies in lane
        for (const e of this.enemies) {
          if (e.lane === lane || (e.isBoss && e.lanesCovered?.includes(lane))) {
            e.burnTimer = Math.max(e.burnTimer, 4.0);
          }
        }
        break;
      }
      case 'antimatter': {
        // Dark Magenta Antimatter True Damage Pulse
        const finalDamage = baseDmg * 1.4 * critMult;
        soundManager.playOrbitalStrike();
        this.projectiles.push({
          id: `proj_${Date.now()}_${Math.random()}`,
          type: 'antimatter_pulse',
          lane,
          x: laneX,
          y: turretY,
          startX: laneX,
          startY: turretY,
          vx: 0,
          vy: -1100,
          damage: finalDamage,
          color: GEM_ELEMENTS.antimatter.color,
          width: 20,
          height: this.height,
          radius: 16,
          life: 0,
          maxLife: 0.25,
          pierce: true,
          element: 'antimatter'
        });
        this.hitEnemiesInLane(lane, finalDamage, 'antimatter', true);
        break;
      }
      case 'chronos': {
        // Chronos Temporal Slowdown Ripple
        const finalDamage = baseDmg * 0.75 * critMult;
        soundManager.playCryo();
        this.projectiles.push({
          id: `proj_${Date.now()}_${Math.random()}`,
          type: 'chronos_wave',
          lane,
          x: laneX,
          y: turretY,
          startX: laneX,
          startY: turretY,
          vx: 0,
          vy: -600,
          damage: finalDamage,
          color: GEM_ELEMENTS.chronos.color,
          width: this.width,
          height: 10,
          radius: 8,
          life: 0,
          maxLife: 0.35,
          element: 'chronos'
        });
        // Global slow to all enemies on screen!
        for (const e of this.enemies) {
          e.frozenTimer = Math.max(e.frozenTimer, 3.5);
        }
        this.hitEnemiesInLane(lane, finalDamage, 'chronos', isCrit);
        break;
      }
      case 'toxic': {
        // Corrosive Bio-Toxin Spray
        const finalDamage = baseDmg * 0.9 * critMult;
        soundManager.playElectric();
        this.projectiles.push({
          id: `proj_${Date.now()}_${Math.random()}`,
          type: 'toxic_cloud',
          lane,
          x: laneX,
          y: turretY - 60,
          startX: laneX,
          startY: turretY,
          vx: 0,
          vy: -400,
          damage: finalDamage,
          color: GEM_ELEMENTS.toxic.color,
          width: 28,
          height: 36,
          radius: 20,
          life: 0,
          maxLife: 0.6,
          element: 'toxic'
        });
        this.hitEnemiesInLane(lane, finalDamage, 'toxic', isCrit);
        break;
      }
      case 'gravity': {
        // Gravitational Repulsion Shock
        const finalDamage = baseDmg * 0.85 * critMult;
        soundManager.playExplosion(false);
        this.projectiles.push({
          id: `proj_${Date.now()}_${Math.random()}`,
          type: 'gravity_shock',
          lane,
          x: laneX,
          y: turretY,
          startX: laneX,
          startY: turretY,
          vx: 0,
          vy: -1000,
          damage: finalDamage,
          color: GEM_ELEMENTS.gravity.color,
          width: 22,
          height: this.height,
          radius: 14,
          life: 0,
          maxLife: 0.22,
          pierce: true,
          element: 'gravity'
        });
        // Push enemies backwards towards the top!
        for (const e of this.enemies) {
          if (e.lane === lane || (e.isBoss && e.lanesCovered?.includes(lane))) {
            const pushAmount = e.isBoss ? 40 : 120;
            e.y = Math.max(10, e.y - pushAmount);
          }
        }
        this.hitEnemiesInLane(lane, finalDamage, 'gravity', isCrit);
        break;
      }
      case 'vampiric': {
        // Quantum Siphon Beam (Lifesteal & Energy)
        const finalDamage = baseDmg * 1.0 * critMult;
        soundManager.playLaser();
        this.projectiles.push({
          id: `proj_${Date.now()}_${Math.random()}`,
          type: 'vampiric_beam',
          lane,
          x: laneX,
          y: turretY,
          startX: laneX,
          startY: turretY,
          vx: 0,
          vy: -900,
          damage: finalDamage,
          color: GEM_ELEMENTS.vampiric.color,
          width: 14,
          height: this.height,
          radius: 12,
          life: 0,
          maxLife: 0.2,
          pierce: true,
          element: 'vampiric'
        });
        this.hitEnemiesInLane(lane, finalDamage, 'vampiric', isCrit);
        const lifestealHeal = Math.round(finalDamage * 0.3);
        this.repairShield(lifestealHeal);
        this.particles.addFloatingText(laneX, turretY - 30, `+${lifestealHeal} SIPHON`, '#f43f5e');
        break;
      }
      case 'prism': {
        // Spektrum Projektörü: Fires a laser upward, on first enemy hit creates a horizontal
        // Spectrum Wall across all 8 lanes that lasts 3s, dealing periodic damage & breaking shields
        const finalDamage = baseDmg * 1.1 * critMult;
        soundManager.playLaser();

        // Find closest (lowest-Y, i.e. furthest advanced) enemy in the lane
        let hitEnemy: Enemy | null = null;
        let lowestY = -999;
        for (const e of this.enemies) {
          if (e.lane === lane || (e.isBoss && e.lanesCovered?.includes(lane))) {
            if (e.y > lowestY && e.y < this.shieldBarrierY) {
              lowestY = e.y;
              hitEnemy = e;
            }
          }
        }

        const wallY = hitEnemy ? hitEnemy.y : this.shieldBarrierY * 0.35;

        // Deal initial impact damage to hit enemy
        if (hitEnemy) {
          this.applyDamageToEnemy(hitEnemy, finalDamage, 'prism', isCrit);
          this.particles.addLaserImpact(laneX, wallY, '#ffffff', 14);
        }

        // Spawn the Spectrum Wall across all lanes
        this.spectrumWalls.push({
          id: `spectrum_${Date.now()}_${Math.random()}`,
          y: wallY,
          life: 0,
          maxLife: 3.0,
          tickTimer: 0,
          damage: finalDamage * 0.25,
          laserStartX: laneX,
          laserStartY: turretY,
          laserHitY: wallY,
          laserLife: 0,
          laserMaxLife: 0.25
        });

        this.particles.triggerScreenShake(4, 0.15);
        this.particles.addFloatingText(this.width / 2, wallY - 16, 'SPEKTRUM DUVARI!', '#e0e7ff', true);

        // Flash all 8 lanes at wall altitude
        for (let l = 0; l < NUM_LANES; l++) {
          this.particles.addLaserImpact(this.getLaneX(l), wallY, '#a5b4fc', 6);
        }
        break;
      }
      case 'anchor': {
        // Graviton Anchor: Heavy Magnetic Pinning & Traffic Bottleneck
        const finalDamage = baseDmg * 0.85 * critMult;
        soundManager.playExplosion(false);
        this.particles.triggerScreenShake(6, 0.2);

        let leadEnemy: Enemy | null = null;
        let highestY = -999;
        for (const e of this.enemies) {
          if (e.lane === lane || (e.isBoss && e.lanesCovered?.includes(lane))) {
            if (e.y > highestY && e.y < this.shieldBarrierY) {
              highestY = e.y;
              leadEnemy = e;
            }
          }
        }

        if (leadEnemy) {
          leadEnemy.isAnchored = true;
          leadEnemy.anchorTimer = leadEnemy.isBoss ? 3.5 : 5.0;
          this.applyDamageToEnemy(leadEnemy, finalDamage, 'anchor', isCrit);
          this.particles.addFloatingText(leadEnemy.x, leadEnemy.y - 16, 'GRAVITON ANCHORED!', '#b45309', true);
          this.particles.addExplosion(leadEnemy.x, leadEnemy.y, '#b45309', 14);
        } else {
          this.hitEnemiesInLane(lane, finalDamage, 'anchor', isCrit);
        }
        break;
      }
      case 'echo': {
        // Echo Replicator: Replicate previous core weapon at 120% power
        const replicated = (this.lastTriggeredElement === 'echo' || !this.lastTriggeredElement) ? 'plasma' : this.lastTriggeredElement;
        this.particles.addFloatingText(laneX, turretY - 35, `ECHO (%120): ${GEM_ELEMENTS[replicated].turkishName.toUpperCase()}`, '#f8fafc', true);
        soundManager.playMatch(Math.min(5, combo + 1));
        this.fireLaneWeapons(lane, replicated, Math.max(1, Math.round(count * 1.2)), specialCount, combo);
        break;
      }
      case 'wormhole': {
        // Wormhole Portal: Spawns Entrance in current lane and Exit in the most crowded lane
        const laneCounts = new Array(NUM_LANES).fill(0);
        for (const e of this.enemies) {
          if (e.lane >= 0 && e.lane < NUM_LANES) laneCounts[e.lane]++;
        }
        let maxLane = laneCounts.indexOf(Math.max(...laneCounts));
        if (maxLane < 0) maxLane = lane;

        const inX = laneX;
        const inY = this.shieldBarrierY - 35;
        const outX = this.getLaneX(maxLane);
        const outY = 30;

        this.wormholes.push({
          id: `wh_${Date.now()}_${Math.random()}`,
          inLane: lane,
          inX,
          inY,
          outLane: maxLane,
          outX,
          outY,
          life: 0,
          maxLife: 5.0,
          radius: 22
        });

        soundManager.playEmpWave();
        this.particles.addFloatingText(laneX, inY - 15, 'PORTAL OPENED!', '#0d9488', true);
        this.particles.addExplosion(inX, inY, '#0d9488', 12);
        this.particles.addExplosion(outX, outY, '#0d9488', 12);
        break;
      }
      case 'parasite': {
        // Nanite Swarm: Contagious Bio-Nanite Infection
        const finalDamage = baseDmg * 0.9 * critMult;
        soundManager.playElectric();

        let targetEnemy: Enemy | null = null;
        let lowestDistY = -999;
        for (const e of this.enemies) {
          if (e.lane === lane || (e.isBoss && e.lanesCovered?.includes(lane))) {
            if (e.y > lowestDistY && e.y < this.shieldBarrierY) {
              lowestDistY = e.y;
              targetEnemy = e;
            }
          }
        }

        if (targetEnemy) {
          targetEnemy.naniteInfected = true;
          targetEnemy.naniteTimer = 6.0;
          targetEnemy.naniteTickTimer = 0;
          this.applyDamageToEnemy(targetEnemy, finalDamage, 'parasite', isCrit);
          this.particles.addFloatingText(targetEnemy.x, targetEnemy.y - 12, 'NANITE INFECTED!', '#a855f7', true);
          this.particles.addLaserImpact(targetEnemy.x, targetEnemy.y, '#3b0764', 10);
        } else {
          this.hitEnemiesInLane(lane, finalDamage, 'parasite', isCrit);
        }
        break;
      }
      case 'static_web': {
        // Static Web: Deploy 3 Magnetic Mines in Lane
        const finalDamage = baseDmg * 0.85 * critMult;
        soundManager.playEmpWave();
        const mineYs = [85, 140, 195];

        for (const mY of mineYs) {
          this.staticMines.push({
            id: `mine_${Date.now()}_${Math.random()}`,
            lane,
            x: laneX,
            y: mY,
            radius: 16,
            life: 0,
            maxLife: 14.0,
            damage: (180 + finalDamage * 0.4),
            triggered: false
          });
          this.particles.addLaserImpact(laneX, mY, '#0284c7', 6);
        }

        this.particles.addFloatingText(laneX, 140, 'STATIC WEB ARMED (x3)', '#0284c7', true);
        break;
      }
      case 'orbital_drone': {
        // Yörünge Uydusu (Orbital Drone Carrier): Deploys an autonomous combat satellite (8s duration)
        // Patrols lanes and fires rapid machine-gun plasma bullets at closest enemies to shield
        const bulletDamage = (baseDmg * 0.32 + 35) * critMult;
        soundManager.playLaser();

        this.orbitalDrones.push({
          id: `drone_${Date.now()}_${Math.random()}`,
          x: laneX,
          y: this.shieldBarrierY - 60,
          targetX: laneX,
          targetY: this.shieldBarrierY - 60,
          patrolDir: Math.random() > 0.5 ? 1 : -1,
          life: 0,
          maxLife: 8.0,
          fireTimer: 0,
          fireInterval: 0.16,
          bulletDamage,
          angle: -Math.PI / 2,
          targetEnemyId: null
        });

        this.particles.triggerScreenShake(3, 0.15);
        this.particles.addFloatingText(laneX, this.shieldBarrierY - 75, 'DRON KONUŞLANDI (8s)!', '#94a3b8', true);
        this.particles.addLaserImpact(laneX, this.shieldBarrierY - 60, '#38bdf8', 12);
        break;
      }
      case 'supernova': {
        // Süpernova Çekirdeği (Supernova Implosion): Şeridin ortasına hızla şişen bir mini yıldız fırlatır.
        // Yıldız 2s boyunca etrafındaki düşmanları/maddeleri kendine çeker; ardından ekrandaki tüm düşmanları kör edip dev patlamayla infilak eder.
        const finalDamage = baseDmg * 1.65 * critMult;
        soundManager.playOrbitalStrike();

        const targetY = Math.max(80, this.shieldBarrierY * 0.44);

        this.supernovaStars.push({
          id: `supernova_${Date.now()}_${Math.random()}`,
          lane,
          x: laneX,
          y: turretY - 20,
          targetY,
          life: 0,
          maxLife: 2.0,
          radius: 8,
          maxRadius: 32,
          damage: finalDamage,
          pulseAngle: 0
        });

        this.particles.triggerScreenShake(3.5, 0.2);
        this.particles.addFloatingText(laneX, targetY, 'YILDIZ ÇÖKMESİ (2s)!', '#fef08a', true);
        this.particles.addLaserImpact(laneX, targetY, '#fef08a', 12);
        break;
      }
      case 'deflector': {
        // Reaktif Kinetik Kalkan (Kinetic Deflector): 5 saniyelik reaktif Ters Vuruş bariyeri ekler.
        this.kineticDeflectorTimer = Math.min(12, this.kineticDeflectorTimer + 5.0);
        soundManager.playShieldBoost();
        soundManager.triggerVibrate([40, 60]);

        this.particles.triggerScreenShake(3, 0.2);
        this.particles.addExplosion(laneX, this.shieldBarrierY, '#14b8a6', 22, true);
        this.particles.addFloatingText(laneX, turretY - 35, 'KİNETİK KALKAN (5s): 2X TERS VURUŞ!', '#14b8a6', true);

        // Immediate localized shock pulse pushing close enemies back
        const repelDamage = baseDmg * 0.85 * critMult;
        for (const e of this.enemies) {
          if (e.lane === lane || (e.isBoss && e.lanesCovered?.includes(lane))) {
            if (e.y > this.shieldBarrierY - 160 && e.y < this.shieldBarrierY) {
              e.y = Math.max(30, e.y - 75);
              this.applyDamageToEnemy(e, repelDamage, 'deflector', isCrit);
              this.particles.addLaserImpact(e.x, e.y, '#14b8a6', 8);
            }
          }
        }
        break;
      }
    }
  }

  public triggerOrbitalStrike() {
    soundManager.playOrbitalStrike();
    this.particles.triggerScreenShake(14, 0.6);

    for (let l = 0; l < NUM_LANES; l++) {
      const laneX = this.getLaneX(l);
      this.projectiles.push({
        id: `orbital_${l}_${Date.now()}`,
        type: 'orbital_beam',
        lane: l,
        x: laneX,
        y: this.shieldBarrierY,
        startX: laneX,
        startY: this.shieldBarrierY,
        vx: 0,
        vy: -1200,
        damage: 650,
        color: '#00f3ff',
        width: 24,
        height: this.height,
        radius: 20,
        life: 0,
        maxLife: 0.35,
        pierce: true,
        element: 'plasma'
      });
      this.hitEnemiesInLane(l, 650, 'plasma', true);
    }
  }

  public triggerEmpNova() {
    soundManager.playEmpWave();
    this.particles.triggerScreenShake(8, 0.4);

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.shockTimer = 4.0;
      enemy.frozenTimer = 3.5;
      this.particles.addFloatingText(enemy.x, enemy.y, 'EMP STUN!', '#ffd000', true);
      this.particles.addExplosion(enemy.x, enemy.y, '#ffd000', 8);
      this.applyDamageToEnemy(enemy, 200, 'electric', false);
    }
  }

  public triggerShieldOvercharge() {
    this.repairShield(Math.round(this.maxShieldHp * 0.45));
    soundManager.playVictory();
    this.particles.addFloatingText(this.width / 2, this.shieldBarrierY - 30, 'BARRIER OVERCHARGE!', '#00ff88', true);
    this.particles.addExplosion(this.width / 2, this.shieldBarrierY, '#00ff88', 25, true);
  }

  public repairShield(amount: number) {
    this.shieldHp = Math.min(this.maxShieldHp, this.shieldHp + amount);
    if (this.onShieldDamage) {
      this.onShieldDamage(this.shieldHp, this.maxShieldHp);
    }
  }

  private hitEnemiesInLane(lane: number, damage: number, element: GemType, isCrit: boolean = false) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      let isTargeted = false;

      if (enemy.isBoss && enemy.lanesCovered) {
        isTargeted = enemy.lanesCovered.includes(lane);
      } else {
        const laneWidth = this.getLaneWidth();
        const actualLane = laneWidth > 0 ? Math.max(0, Math.min(NUM_LANES - 1, Math.floor(enemy.x / laneWidth))) : enemy.lane;
        isTargeted = actualLane === lane || enemy.lane === lane;
      }

      if (isTargeted && enemy.y > -20 && enemy.y <= this.shieldBarrierY) {
        this.applyDamageToEnemy(enemy, damage, element, isCrit);
      }
    }
  }

  public applyDamageToEnemy(enemy: Enemy, damage: number, element: GemType, isCrit: boolean = false) {
    enemy.hitFlashTimer = 0.12;
    this.stats.damageDealt += damage;

    // Trigger Hit-Stop / Time Dilation (visceral micro slow-motion so player feels the hit)
    this.triggerHitStop(isCrit ? 0.095 : 0.065, isCrit ? 0.20 : 0.28);

    // Apply status effects
    if (element === 'cryo') {
      enemy.frozenTimer = 3.0 * this.upgrades.cryoDurationMult;
      this.particles.addLaserImpact(enemy.x, enemy.y, GEM_ELEMENTS.cryo.color, 6);
    } else if (element === 'void') {
      enemy.y = Math.max(-10, enemy.y - 30); // Knockback
      this.particles.addLaserImpact(enemy.x, enemy.y, GEM_ELEMENTS.void.color, 8);
    } else if (element === 'plasma') {
      enemy.burnTimer = 2.0;
      this.particles.addLaserImpact(enemy.x, enemy.y, GEM_ELEMENTS.plasma.color, 8);
    } else if (element === 'electric') {
      enemy.shockTimer = 1.5;
      this.particles.addLaserImpact(enemy.x, enemy.y, GEM_ELEMENTS.electric.color, 8);
    }

    // Shield absorption
    let effectiveDmg = damage;
    if (enemy.shieldHp && enemy.shieldHp > 0) {
      if (enemy.shieldHp >= effectiveDmg) {
        enemy.shieldHp -= effectiveDmg;
        effectiveDmg = 0;
        this.particles.addFloatingText(enemy.x, enemy.y - 12, `-${Math.round(damage)} SHLD`, '#a855f7');
      } else {
        effectiveDmg -= enemy.shieldHp;
        enemy.shieldHp = 0;
        this.particles.addExplosion(enemy.x, enemy.y, '#a855f7', 10);
      }
    }

    if (effectiveDmg > 0) {
      enemy.hp -= effectiveDmg;
      this.particles.addFloatingText(
        enemy.x,
        enemy.y - 8,
        Math.round(effectiveDmg).toString(),
        isCrit ? '#ff0055' : '#ffffff',
        isCrit
      );
    }

    // Check enemy death
    if (enemy.hp <= 0) {
      this.destroyEnemy(enemy);
    }
  }

  private destroyEnemy(enemy: Enemy) {
    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) {
      this.enemies.splice(idx, 1);
    }

    // Heavy cinematic hit-stop on kill
    this.triggerHitStop(enemy.isBoss ? 0.22 : 0.08, enemy.isBoss ? 0.12 : 0.22);

    this.stats.enemiesKilled++;
    this.stats.score += enemy.scoreValue;
    this.particles.addExplosion(enemy.x, enemy.y, enemy.color, enemy.isBoss ? 45 : 18, enemy.isBoss);
    this.particles.triggerScreenShake(enemy.isBoss ? 12 : 3, enemy.isBoss ? 0.4 : 0.15);
    soundManager.playExplosion(enemy.isBoss);

    // If enemy had Nanite Swarm parasite, release contagious homing spores to up to 2 neighbor enemies!
    if (enemy.naniteInfected) {
      const candidates = this.enemies.filter(e => e !== enemy && !e.naniteInfected);
      candidates.sort((a, b) => Math.hypot(a.x - enemy.x, a.y - enemy.y) - Math.hypot(b.x - enemy.x, b.y - enemy.y));
      const targets = candidates.slice(0, 2);
      for (const t of targets) {
        this.homingSpores.push({
          id: `spore_${Date.now()}_${Math.random()}`,
          x: enemy.x,
          y: enemy.y,
          targetEnemyId: t.id,
          speed: 360,
          life: 0
        });
      }
      this.particles.addExplosion(enemy.x, enemy.y, '#3b0764', 16);
    }

    if (enemy.isBoss) {
      this.activeBoss = null;
      this.isBossActive = false;
    }

    if (this.onEnemyKilled) {
      this.onEnemyKilled(enemy, enemy.scoreValue);
    }
  }

  public update(dt: number) {
    // Process Hit-Stop / Time Dilation (Micro Slow-Motion on Impact)
    let effectiveDt = dt;
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
      effectiveDt = dt * this.timeDilationScale;
      if (this.hitStopTimer <= 0) {
        this.timeDilationScale = 1.0;
      }
    }

    // Background starfield scroll
    for (const star of this.stars) {
      star.y += star.speed * (effectiveDt * 0.6 + dt * 0.4);
      if (star.y > this.height) {
        star.y = 0;
        star.x = Math.random() * this.width;
      }
    }

    // Turret cool-down & recoil decay (elastic spring return)
    for (const turret of this.turrets) {
      if (turret.recoil > 0) {
        turret.recoil = Math.max(0, turret.recoil - dt * (36 + turret.recoil * 5.0));
      }
      if (turret.glowIntensity > 0) {
        turret.glowIntensity = Math.max(0, turret.glowIntensity - dt * 2.2);
      }
      if (turret.socketGlow > 0) {
        turret.socketGlow = Math.max(0, turret.socketGlow - dt * 2.0);
      }
      if (turret.muzzleFlash > 0) {
        turret.muzzleFlash = Math.max(0, turret.muzzleFlash - dt * 7.5);
      }
      if (turret.conduitPulse > 0) {
        turret.conduitPulse = Math.max(0, turret.conduitPulse - dt * 3.0);
      }
    }

    // Shield flash decay
    if (this.shieldHitFlash > 0) {
      this.shieldHitFlash = Math.max(0, this.shieldHitFlash - dt * 3);
    }

    // Kinetic Deflector barrier duration decay
    if (this.kineticDeflectorTimer > 0) {
      this.kineticDeflectorTimer = Math.max(0, this.kineticDeflectorTimer - dt);
    }

    // Update Spectrum Walls (Prism Core)
    for (let i = this.spectrumWalls.length - 1; i >= 0; i--) {
      const wall = this.spectrumWalls[i];
      wall.life += dt;
      wall.laserLife += dt;

      // Periodic damage tick every 0.5s to all enemies crossing the wall altitude
      wall.tickTimer += dt;
      if (wall.tickTimer >= 0.5) {
        wall.tickTimer = 0;
        for (const enemy of this.enemies) {
          if (Math.abs(enemy.y - wall.y) <= 18) {
            // Break shields first
            if (enemy.shieldHp && enemy.shieldHp > 0) {
              enemy.shieldHp = 0;
              this.particles.addExplosion(enemy.x, enemy.y, '#a855f7', 10);
              this.particles.addFloatingText(enemy.x, enemy.y - 12, 'SHIELD BREAK!', '#e0e7ff', true);
            }
            this.applyDamageToEnemy(enemy, wall.damage, 'prism', false);
            this.particles.addLaserImpact(enemy.x, wall.y, '#e0e7ff', 4);
          }
        }
      }

      if (wall.life >= wall.maxLife) {
        this.spectrumWalls.splice(i, 1);
      }
    }

    // Update Wormholes
    for (let i = this.wormholes.length - 1; i >= 0; i--) {
      const wh = this.wormholes[i];
      wh.life += dt;
      if (wh.life >= wh.maxLife) {
        this.wormholes.splice(i, 1);
      }
    }

    // Update Static Mines
    for (let i = this.staticMines.length - 1; i >= 0; i--) {
      const mine = this.staticMines[i];
      mine.life += dt;
      if (mine.life >= mine.maxLife) {
        this.staticMines.splice(i, 1);
      }
    }

    // Update Homing Nanite Spores
    for (let i = this.homingSpores.length - 1; i >= 0; i--) {
      const spore = this.homingSpores[i];
      spore.life += dt;
      const target = this.enemies.find(e => e.id === spore.targetEnemyId);
      if (!target || spore.life > 3.0) {
        this.homingSpores.splice(i, 1);
        continue;
      }

      const dx = target.x - spore.x;
      const dy = target.y - spore.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 15) {
        target.naniteInfected = true;
        target.naniteTimer = 6.0;
        target.naniteTickTimer = 0;
        this.particles.addFloatingText(target.x, target.y - 12, 'CONTAGION!', '#a855f7', true);
        this.particles.addLaserImpact(target.x, target.y, '#3b0764', 8);
        this.homingSpores.splice(i, 1);
      } else {
        spore.x += (dx / dist) * spore.speed * effectiveDt;
        spore.y += (dy / dist) * spore.speed * effectiveDt;
      }
    }

    // Update Orbital Drones (8-second autonomous combat satellite patrol & machine-gun fire)
    for (let i = this.orbitalDrones.length - 1; i >= 0; i--) {
      const drone = this.orbitalDrones[i];
      drone.life += dt;
      if (drone.life >= drone.maxLife) {
        this.particles.addExplosion(drone.x, drone.y, '#94a3b8', 14);
        this.orbitalDrones.splice(i, 1);
        continue;
      }

      // Patrol movement across defense lanes (smooth horizontal sweep)
      drone.x += drone.patrolDir * 85 * effectiveDt;
      const margin = 28;
      if (drone.x > this.width - margin) {
        drone.x = this.width - margin;
        drone.patrolDir = -1;
      } else if (drone.x < margin) {
        drone.x = margin;
        drone.patrolDir = 1;
      }

      // Scan for the enemy closest to the station shield barrier
      let bestTarget: Enemy | null = null;
      let closestToShieldY = -999;
      for (const enemy of this.enemies) {
        if (enemy.y > closestToShieldY && enemy.y <= this.shieldBarrierY + 10) {
          closestToShieldY = enemy.y;
          bestTarget = enemy;
        }
      }

      if (bestTarget) {
        drone.targetEnemyId = bestTarget.id;
        const dx = bestTarget.x - drone.x;
        const dy = bestTarget.y - drone.y;
        drone.angle = Math.atan2(dy, dx);

        // Rapid machine-gun plasma fire
        drone.fireTimer += effectiveDt;
        if (drone.fireTimer >= drone.fireInterval) {
          drone.fireTimer = 0;
          soundManager.playLaser();

          const bulletSpeed = 820;
          const dist = Math.hypot(dx, dy) || 1;
          this.projectiles.push({
            id: `drone_bullet_${Date.now()}_${Math.random()}`,
            type: 'drone_bullet',
            lane: bestTarget.lane,
            x: drone.x,
            y: drone.y,
            startX: drone.x,
            startY: drone.y,
            targetX: bestTarget.x,
            targetY: bestTarget.y,
            vx: (dx / dist) * bulletSpeed,
            vy: (dy / dist) * bulletSpeed,
            damage: drone.bulletDamage,
            color: '#94a3b8',
            width: 4,
            height: 10,
            radius: 5,
            life: 0,
            maxLife: 1.2,
            element: 'orbital_drone'
          });

          this.particles.addLaserImpact(
            drone.x + Math.cos(drone.angle) * 14,
            drone.y + Math.sin(drone.angle) * 14,
            '#38bdf8',
            3
          );
        }
      } else {
        drone.targetEnemyId = null;
        drone.angle = -Math.PI / 2;
      }
    }

    // Update Supernova Implosion Stars (Swells for 2s, pulls matter inward, then detonates!)
    for (let i = this.supernovaStars.length - 1; i >= 0; i--) {
      const star = this.supernovaStars[i];
      star.life += dt;
      star.pulseAngle += dt * 10;

      // Smooth rise towards target altitude
      star.y += (star.targetY - star.y) * Math.min(1, dt * 7);

      // Rapidly swelling stellar radius
      const swellProgress = Math.min(1, star.life / star.maxLife);
      star.radius = 8 + swellProgress * (star.maxRadius - 8) + Math.sin(star.pulseAngle) * 2.5;

      // Gravitational accretion: pull nearby enemies within 170px towards the star
      for (const enemy of this.enemies) {
        const edx = star.x - enemy.x;
        const edy = star.y - enemy.y;
        const dist = Math.hypot(edx, edy);
        if (dist > 5 && dist < 170) {
          const pullForce = (1 - dist / 170) * 48 * effectiveDt;
          enemy.x += (edx / dist) * pullForce;
          enemy.y += (edy / dist) * pullForce;
        }
      }

      // Inward spiraling accretion particles
      if (Math.random() < 0.45) {
        const inAngle = Math.random() * Math.PI * 2;
        const inDist = star.radius * (1.6 + Math.random() * 1.5);
        this.particles.addParticle({
          x: star.x + Math.cos(inAngle) * inDist,
          y: star.y + Math.sin(inAngle) * inDist,
          vx: -Math.cos(inAngle) * 140,
          vy: -Math.sin(inAngle) * 140,
          size: Math.random() * 2.4 + 1.2,
          color: Math.random() > 0.4 ? '#fef08a' : '#ffffff',
          alpha: 1,
          life: 0,
          maxLife: 0.18,
          shape: 'spark'
        });
      }

      // Detonation at 2.0s -> Supernova Implosion Blast!
      if (star.life >= star.maxLife) {
        this.particles.triggerScreenShake(9, 0.45);
        this.triggerHitStop(0.12, 0.18);
        soundManager.playExplosion(true);
        soundManager.playOrbitalStrike();

        // 1. Massive multi-ring explosion particles
        this.particles.addExplosion(star.x, star.y, '#fef08a', 24, true);
        this.particles.addExplosion(star.x, star.y, '#ffffff', 16, true);

        // Expanding super-corona shockwave ring
        this.particles.addParticle({
          x: star.x,
          y: star.y,
          vx: 0,
          vy: 0,
          size: 15,
          color: '#fef08a',
          alpha: 1,
          life: 0,
          maxLife: 0.5,
          shape: 'ring'
        });
        this.particles.addParticle({
          x: star.x,
          y: star.y,
          vx: 0,
          vy: 0,
          size: 10,
          color: '#ffffff',
          alpha: 1,
          life: 0,
          maxLife: 0.35,
          shape: 'ring'
        });

        // 2. Screen-wide blinding flash & devastating burst damage to ALL enemies on screen
        for (const enemy of this.enemies) {
          if (enemy.y > -50 && enemy.y <= this.shieldBarrierY + 20) {
            // Apply damage
            this.applyDamageToEnemy(enemy, star.damage, 'supernova', true);
            // Apply 3s Blind / Slow & Shock stun
            enemy.frozenTimer = Math.max(enemy.frozenTimer, 3.0);
            enemy.shockTimer = Math.max(enemy.shockTimer, 2.5);
            enemy.hitFlashTimer = 0.28;
            this.particles.addLaserImpact(enemy.x, enemy.y, '#fef08a', 8);
          }
        }

        this.particles.addFloatingText(star.x, star.y - 30, '💥 SÜPERNOVA PATLAMASI! 💥', '#fef08a', true);
        this.supernovaStars.splice(i, 1);
      }
    }

    // Wave spawning logic
    if (this.isWaveInProgress) {
      if (this.waveEnemiesSpawned < this.waveEnemiesToSpawn) {
        this.waveSpawnTimer -= effectiveDt;
        if (this.waveSpawnTimer <= 0) {
          this.spawnEnemy();
          this.waveSpawnTimer = this.waveSpawnInterval;
        }
      } else if (this.enemies.length === 0 && !this.isBossActive) {
        // Wave completely cleared!
        this.isWaveInProgress = false;
        soundManager.playVictory();
        if (this.onWaveCleared) {
          this.onWaveCleared(this.currentWave);
        }
      }
    }

    // Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      // Status timers
      if (enemy.frozenTimer > 0) enemy.frozenTimer -= effectiveDt;
      if (enemy.shockTimer > 0) enemy.shockTimer -= effectiveDt;
      if (enemy.burnTimer > 0) {
        enemy.burnTimer -= effectiveDt;
        enemy.hp -= 40 * effectiveDt;
        if (enemy.hp <= 0) {
          this.destroyEnemy(enemy);
          continue;
        }
      }
      if (enemy.hitFlashTimer > 0) enemy.hitFlashTimer -= dt;

      // Graviton Anchor status
      if (enemy.isAnchored) {
        enemy.anchorTimer = (enemy.anchorTimer || 0) - effectiveDt;
        if (enemy.anchorTimer <= 0) {
          enemy.isAnchored = false;
        }
      }

      // Nanite Swarm continuous damage
      if (enemy.naniteInfected) {
        enemy.naniteTimer = (enemy.naniteTimer || 0) - effectiveDt;
        enemy.naniteTickTimer = (enemy.naniteTickTimer || 0) + effectiveDt;
        if (enemy.naniteTickTimer >= 0.5) {
          enemy.naniteTickTimer = 0;
          enemy.hp -= 25 * this.upgrades.plasmaDamageMult;
          this.particles.addLaserImpact(enemy.x, enemy.y, '#a855f7', 3);
          if (enemy.hp <= 0) {
            this.destroyEnemy(enemy);
            continue;
          }
        }
        if (enemy.naniteTimer <= 0) {
          enemy.naniteInfected = false;
        }
      }

      // Check Wormhole Teleportation
      for (const wh of this.wormholes) {
        if (enemy.lane === wh.inLane && Math.abs(enemy.y - wh.inY) <= 24) {
          enemy.lane = wh.outLane;
          enemy.x = wh.outX;
          enemy.y = wh.outY;
          soundManager.playEmpWave();
          this.particles.addExplosion(wh.inX, wh.inY, '#0d9488', 12);
          this.particles.addExplosion(wh.outX, wh.outY, '#0d9488', 16);
          this.particles.addFloatingText(wh.outX, wh.outY, 'WARPED!', '#0d9488', true);
          this.applyDamageToEnemy(enemy, 80, 'void', false);
          break;
        }
      }

      // Check Static Web Mines
      for (let m = this.staticMines.length - 1; m >= 0; m--) {
        const mine = this.staticMines[m];
        if (enemy.lane === mine.lane && Math.hypot(enemy.x - mine.x, enemy.y - mine.y) <= mine.radius + 14) {
          this.applyDamageToEnemy(enemy, mine.damage, 'electric', true);
          enemy.frozenTimer = Math.max(enemy.frozenTimer, 1.0);
          enemy.shockTimer = Math.max(enemy.shockTimer, 1.0);
          this.particles.addExplosion(mine.x, mine.y, '#0284c7', 22, true);
          this.particles.addFloatingText(mine.x, mine.y - 12, 'STATIC STUN!', '#0284c7', true);
          soundManager.playExplosion(false);
          this.staticMines.splice(m, 1);
        }
      }

      // Speed modifier
      let currentSpeed = enemy.baseSpeed;
      if (enemy.frozenTimer > 0) currentSpeed *= 0.35;
      if (enemy.shockTimer > 0 || enemy.isAnchored) currentSpeed = 0;

      // Graviton Anchor Traffic Bottleneck
      if (!enemy.isAnchored) {
        for (const other of this.enemies) {
          if (other !== enemy && other.isAnchored && other.lane === enemy.lane && other.y > enemy.y) {
            const minAllowedY = other.y - other.height - 4;
            if (enemy.y + enemy.height >= minAllowedY) {
              enemy.y = minAllowedY - enemy.height;
              currentSpeed = 0;
            }
          }
        }
      }

      enemy.y += currentSpeed * effectiveDt;
      enemy.enginePulse += effectiveDt * 8;

      // Bounds and NaN safety prune
      if (isNaN(enemy.x) || isNaN(enemy.y) || enemy.y < -300 || enemy.x < -150 || enemy.x > this.width + 150) {
        this.enemies.splice(i, 1);
        if (enemy.isBoss) this.activeBoss = null;
        continue;
      }

      // Check barrier impact
      if (enemy.y + enemy.height * 0.5 >= this.shieldBarrierY) {
        if (this.kineticDeflectorTimer > 0) {
          // KINETIC DEFLECTOR COUNTER-ATTACK: Kalkan hasar almaz; 2x hasar ile düşmana geri yansıtır!
          const counterDamage = Math.max(350, (enemy.attackPower || 90) * 2.5 * this.upgrades.plasmaDamageMult);
          this.applyDamageToEnemy(enemy, counterDamage, 'deflector', true);

          // Görsel zümrüt şok dalgası, 2X COUNTER yazısı ve geri tepme
          this.particles.addExplosion(enemy.x, this.shieldBarrierY, '#14b8a6', 26, true);
          this.particles.triggerScreenShake(7, 0.35);
          this.particles.addFloatingText(enemy.x, this.shieldBarrierY - 20, `COUNTER: 2X HASAR (-${Math.round(counterDamage)})`, '#14b8a6', true);
          soundManager.playEmpWave();
          soundManager.playShieldBoost();
          soundManager.triggerVibrate([50, 70, 50]);

          // Yukarı doğru 2 kat güçlü kinetik şok mermisi fırlat
          this.projectiles.push({
            id: `counter_${Date.now()}_${Math.random()}`,
            type: 'kinetic_counter',
            lane: enemy.lane,
            x: enemy.x,
            y: this.shieldBarrierY - 10,
            startX: enemy.x,
            startY: this.shieldBarrierY - 10,
            vx: (Math.random() - 0.5) * 50,
            vy: -820,
            damage: counterDamage * 0.9,
            color: '#14b8a6',
            width: 6,
            height: 24,
            radius: 8,
            life: 0,
            maxLife: 1.1,
            element: 'deflector'
          });

          if (enemy.hp > 0) {
            enemy.y = Math.max(30, this.shieldBarrierY - 140); // Massive knockback
          } else {
            this.enemies.splice(i, 1);
            if (enemy.isBoss) this.activeBoss = null;
          }
        } else {
          this.hitShield(enemy.attackPower);
          this.particles.addExplosion(enemy.x, this.shieldBarrierY, enemy.color, 16);
          this.particles.triggerScreenShake(6, 0.25);
          soundManager.playShieldHit();
          soundManager.triggerVibrate([40, 50, 40]);
          this.enemies.splice(i, 1);
          if (enemy.isBoss) {
            this.activeBoss = null;
          }
        }
      }
    }

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life += dt;
      if (p.life >= p.maxLife || isNaN(p.x) || isNaN(p.y) || p.y < -200 || p.y > this.height + 200) {
        // If rocket expired or detonated
        if (p.type === 'cluster_rocket') {
          this.detonateRocket(p);
        }
        this.projectiles.splice(i, 1);
        continue;
      }

      p.x += p.vx * effectiveDt;
      p.y += p.vy * effectiveDt;

      // Kinetic Counter Shot collision
      if (p.type === 'kinetic_counter') {
        const hitEnemy = this.enemies.find(e => Math.hypot(e.x - p.x, e.y - p.y) < e.width * 0.65);
        if (hitEnemy) {
          this.applyDamageToEnemy(hitEnemy, p.damage, 'deflector', true);
          this.particles.addExplosion(p.x, p.y, '#14b8a6', 18, true);
          this.particles.addFloatingText(hitEnemy.x, hitEnemy.y - 14, '2X COUNTER!', '#14b8a6', true);
          soundManager.playExplosion(false);
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // Rocket collision
      if (p.type === 'cluster_rocket') {
        const hitEnemy = this.enemies.find(e => Math.hypot(e.x - p.x, e.y - p.y) < e.width * 0.6);
        if (hitEnemy) {
          this.detonateRocket(p);
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // Drone Bullet collision
      if (p.type === 'drone_bullet') {
        const hitEnemy = this.enemies.find(e => Math.hypot(e.x - p.x, e.y - p.y) < e.width * 0.55);
        if (hitEnemy) {
          this.applyDamageToEnemy(hitEnemy, p.damage, 'orbital_drone', false);
          this.particles.addLaserImpact(p.x, p.y, '#94a3b8', 5);
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // Void Vortex Gravitational Pull & Singularity Damage
      if (p.type === 'void_vortex') {
        const pullRadius = this.getLaneWidth() * 1.8;
        const basePullSpeed = 95 * this.upgrades.voidVortexPullForce;

        // Ambient cosmic singularity particle discharge
        if (Math.random() < 0.35) {
          this.particles.addLaserImpact(
            p.x + (Math.random() - 0.5) * 40,
            p.y + (Math.random() - 0.5) * 40,
            '#a855f7',
            2
          );
        }

        for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
          const enemy = this.enemies[ei];
          const dx = p.x - enemy.x;
          const distH = Math.abs(dx);

          // If enemy is in the vortex lane or adjacent within pull radius
          if (distH < pullRadius) {
            // If enemy is below the vortex (passed it or approaching), pull it backwards up to the top!
            if (enemy.y > p.y - 12) {
              const pullIntensity = enemy.isBoss ? 0.35 : 1.0;
              enemy.y = Math.max(p.y, enemy.y - basePullSpeed * pullIntensity * effectiveDt);
              // Gently pull enemy towards center of vortex lane
              enemy.x += dx * 2.2 * effectiveDt;
              const currentLaneWidth = this.getLaneWidth();
              if (currentLaneWidth > 0 && !enemy.isBoss) {
                enemy.lane = Math.max(0, Math.min(NUM_LANES - 1, Math.floor(enemy.x / currentLaneWidth)));
              }
            }

            // Continuous singularity aura damage (only when damage is unlocked via upgrade)
            if (p.damage > 0) {
              const distTotal = Math.hypot(enemy.x - p.x, enemy.y - p.y);
              if (distTotal < p.radius * 1.7) {
                const tickDamage = (p.damage * 0.45) * effectiveDt;
                enemy.hp -= tickDamage;
                enemy.hitFlashTimer = 0.06;
                if (enemy.hp <= 0) {
                  this.destroyEnemy(enemy);
                }
              }
            }
          }
        }
      }
    }

    // Update particles & floating texts
    this.particles.update(dt);
  }

  private detonateRocket(p: Projectile) {
    soundManager.playExplosion(true);
    this.particles.addExplosion(p.x, p.y, p.color, 24, true);
    this.particles.triggerScreenShake(5, 0.2);

    const aoeRadius = p.aoeRadius || 60;
    for (const enemy of this.enemies) {
      const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
      if (dist <= aoeRadius) {
        const falloff = 1 - (dist / aoeRadius) * 0.4;
        this.applyDamageToEnemy(enemy, p.damage * falloff, 'explosive', true);
      }
    }
  }

  private hitShield(damage: number) {
    this.shieldHp = Math.max(0, this.shieldHp - damage);
    this.shieldHitFlash = 1.0;
    if (this.onShieldDamage) {
      this.onShieldDamage(this.shieldHp, this.maxShieldHp);
    }
    if (this.shieldHp <= 0) {
      soundManager.playGameOver();
      if (this.onGameOver) {
        this.onGameOver();
      }
    }
  }

  public render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const shake = this.particles.getShakeOffset();

    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.translate(shake.x, shake.y);

    // Deep Space Background
    ctx.fillStyle = '#070a14';
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle Pre-cached Cyber Nebula Glow
    if (this.bgGradient) {
      ctx.fillStyle = this.bgGradient;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // Render Stars
    for (const star of this.stars) {
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = star.alpha;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.globalAlpha = 1;

    // Render 8 Defense Lanes
    const laneWidth = this.getLaneWidth();
    for (let i = 0; i < NUM_LANES; i++) {
      const lx = i * laneWidth;
      const turret = this.turrets[i];

      // Lane separator line
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.10)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, this.shieldBarrierY);
      ctx.stroke();

      // Lane active fire highlight glow & vertical light spine
      if (turret.glowIntensity > 0) {
        const elemColor = turret.lastFiredElement !== 'idle' ? GEM_ELEMENTS[turret.lastFiredElement].color : '#00f3ff';
        const laneGrad = ctx.createLinearGradient(0, this.shieldBarrierY, 0, 0);
        laneGrad.addColorStop(0, elemColor);
        laneGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = laneGrad;
        ctx.globalAlpha = turret.glowIntensity * 0.22;
        ctx.fillRect(lx, 0, laneWidth, this.shieldBarrierY);

        // Center neon energy spine running up the lane
        ctx.strokeStyle = elemColor;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = turret.glowIntensity * 0.45;
        ctx.beginPath();
        ctx.moveTo(lx + laneWidth * 0.5, this.shieldBarrierY);
        ctx.lineTo(lx + laneWidth * 0.5, 0);
        ctx.stroke();

        ctx.globalAlpha = 1;
      }
    }

    // Render Station Shield / Defense Barrier Line
    this.renderDefenseBarrier(ctx);

    // Render Turrets at Defense Barrier (Pod socket + Recoiling Cannon)
    this.renderTurrets(ctx);

    // Render Static Mines & Wormholes
    this.renderStaticMines(ctx);
    this.renderWormholes(ctx);

    // Render Spectrum Walls & Homing Spores
    this.renderSpectrumWalls(ctx);
    this.renderHomingSpores(ctx);
    this.renderOrbitalDrones(ctx);
    this.renderSupernovaStars(ctx);

    // Render Projectiles
    this.renderProjectiles(ctx);

    // Render Enemies
    this.renderEnemies(ctx);

    // Render Particles & Combat Texts
    this.particles.render(ctx);

    ctx.restore();
  }

  private renderDefenseBarrier(ctx: CanvasRenderingContext2D) {
    const y = this.shieldBarrierY;
    const hpRatio = this.shieldHp / this.maxShieldHp;
    const barrierColor = this.shieldHitFlash > 0 ? '#ff0055' : (hpRatio < 0.3 ? '#ffaa00' : '#00f3ff');

    if (this.kineticDeflectorTimer > 0) {
      // ⚡ REAKTİF KİNETİK KALKAN (EMERALD-TURQUOISE DEFLECTOR BARRIER)
      const pulse = 1 + Math.sin(Date.now() * 0.012) * 0.15;

      // Geniş parlak zümrüt dış aura
      const auraGrad = ctx.createLinearGradient(0, y - 16, 0, y + 10);
      auraGrad.addColorStop(0, 'rgba(20, 184, 166, 0)');
      auraGrad.addColorStop(0.5, 'rgba(20, 184, 166, 0.45)');
      auraGrad.addColorStop(1, 'rgba(15, 118, 110, 0.1)');
      ctx.fillStyle = auraGrad;
      ctx.fillRect(0, y - 16, this.width, 26);

      // Kinetik piezoelektrik titreşim çizgisi
      ctx.strokeStyle = '#2dd4bf';
      ctx.lineWidth = 6 * pulse;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();

      // Kesikli yüksek enerji akım halkası
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 10]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
      ctx.restore();

      // Kalkan Bilgi Göstergesi (Counter-Attack Aktif Rozeti)
      ctx.save();
      ctx.fillStyle = '#0f766e';
      ctx.strokeStyle = '#2dd4bf';
      ctx.lineWidth = 1.5;
      const badgeW = 230;
      const badgeX = (this.width - badgeW) / 2;
      ctx.fillRect(badgeX, y - 26, badgeW, 18);
      ctx.strokeRect(badgeX, y - 26, badgeW, 18);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Rajdhani, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`⚡ KİNETİK TERS VURUŞ [2X]: ${this.kineticDeflectorTimer.toFixed(1)}s ⚡`, this.width / 2, y - 13);
      ctx.restore();
    } else {
      // Normal Barrier
      // Outer glow line
      ctx.strokeStyle = barrierColor;
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();

      // Core bright barrier line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Energetic pulse overlay on barrier
      ctx.fillStyle = this.shieldHitFlash > 0 ? 'rgba(255, 0, 85, 0.25)' : 'rgba(0, 243, 255, 0.08)';
      ctx.fillRect(0, y, this.width, 5);
    }
  }

  private drawMuzzleFlash(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, alpha: number) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, alpha);

    // Outer radiant bloom
    const grad = ctx.createRadialGradient(x, y, 1, x, y, 13);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, color);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, 13, 0, Math.PI * 2);
    ctx.fill();

    // Starburst ray cross
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x - 8, y);
    ctx.lineTo(x + 8, y);
    ctx.moveTo(x, y - 8);
    ctx.lineTo(x, y + 8);
    ctx.stroke();

    ctx.restore();
  }

  private renderTurrets(ctx: CanvasRenderingContext2D) {
    const laneWidth = this.getLaneWidth();
    const socketY = this.shieldBarrierY + 12;

    for (let i = 0; i < NUM_LANES; i++) {
      const cx = this.getLaneX(i);
      const turret = this.turrets[i];
      const elemColor = turret.lastFiredElement !== 'idle' ? GEM_ELEMENTS[turret.lastFiredElement].color : '#00f3ff';
      const podW = laneWidth * 0.72;
      const podH = 14;

      // ==========================================
      // 1. TAHTADAN GELEN DİKEY ENERJİ İLETİM SÜTUNU
      // ==========================================
      if (turret.conduitPulse > 0 || turret.glowIntensity > 0) {
        const pulseAlpha = Math.max(turret.conduitPulse, turret.glowIntensity * 0.6);
        const conduitGrad = ctx.createLinearGradient(cx, this.height, cx, socketY);
        conduitGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
        conduitGrad.addColorStop(0.3, elemColor);
        conduitGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = conduitGrad;
        ctx.globalAlpha = pulseAlpha * 0.35;
        ctx.fillRect(cx - 5, socketY, 10, this.height - socketY);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = pulseAlpha * 0.65;
        ctx.beginPath();
        ctx.moveTo(cx, this.height);
        ctx.lineTo(cx, socketY);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // ==========================================
      // 2. SABİT TARET YUVASI (SOCKET POD & MOUNT)
      // ==========================================
      // Yumuşak radyal yuva aurası (Socket Back-Glow)
      const glowRadius = laneWidth * 0.72;
      const podGlow = ctx.createRadialGradient(cx, socketY - 2, 2, cx, socketY - 2, glowRadius);
      const glowAlpha = 0.06 + turret.socketGlow * 0.44;
      podGlow.addColorStop(0, elemColor);
      podGlow.addColorStop(0.45, elemColor);
      podGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = podGlow;
      ctx.globalAlpha = glowAlpha;
      ctx.beginPath();
      ctx.arc(cx, socketY - 2, glowRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Sabit Yuva Mekanik Gövdesi (Armored Cradle Base)
      ctx.fillStyle = '#0a1020';
      ctx.strokeStyle = turret.socketGlow > 0 ? elemColor : 'rgba(0, 243, 255, 0.35)';
      ctx.lineWidth = turret.socketGlow > 0 ? 1.6 : 1.0;
      ctx.beginPath();
      ctx.roundRect(cx - podW * 0.5, socketY - 2, podW, podH, [3, 3, 6, 6]);
      ctx.fill();
      ctx.stroke();

      // Sol & Sağ Hidrolik Piston Kılavuz Silindirleri
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.fillRect(cx - podW * 0.42, socketY - 6, 3.5, 12);
      ctx.strokeRect(cx - podW * 0.42, socketY - 6, 3.5, 12);
      ctx.fillRect(cx + podW * 0.42 - 3.5, socketY - 6, 3.5, 12);
      ctx.strokeRect(cx + podW * 0.42 - 3.5, socketY - 6, 3.5, 12);

      // Yuva İç Enerji Odacığı (Chamber Cavity)
      ctx.fillStyle = '#060a14';
      ctx.beginPath();
      ctx.arc(cx, socketY + 3, podW * 0.26, Math.PI, 0, false);
      ctx.fill();

      if (turret.socketGlow > 0) {
        ctx.fillStyle = elemColor;
        ctx.globalAlpha = turret.socketGlow * 0.55;
        ctx.beginPath();
        ctx.arc(cx, socketY + 3, podW * 0.22, Math.PI, 0, false);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // ==========================================
      // 3. GERİ TEPEN TARET KAFASI & NAMLU MEKANİZMASI (RECOIL CARRIAGE)
      // ==========================================
      const recoilY = socketY + turret.recoil;

      // Hidrolik Piston Kolları (Sabit yuva ile hareketli gövdeyi bağlar)
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cx - podW * 0.40, socketY - 6);
      ctx.lineTo(cx - podW * 0.40, recoilY - 2);
      ctx.moveTo(cx + podW * 0.40 - 1.5, socketY - 6);
      ctx.lineTo(cx + podW * 0.40 - 1.5, recoilY - 2);
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, recoilY);

      // Taret Gövdesi (Angular Breech Carriage)
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = elemColor;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 2, laneWidth * 0.26, Math.PI, 0, false);
      ctx.fill();
      ctx.stroke();

      // Çift Ağır Raylı Namlu (Twin Railgun Barrels)
      const barrelLen = laneWidth * 0.48;
      const barrelW = 3.2;
      const barrelSpread = 4.2;

      // Sol Namlu
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = elemColor;
      ctx.lineWidth = 0.9;
      ctx.fillRect(-barrelSpread - barrelW * 0.5, -barrelLen, barrelW, barrelLen);
      ctx.strokeRect(-barrelSpread - barrelW * 0.5, -barrelLen, barrelW, barrelLen);

      // Sağ Namlu
      ctx.fillRect(barrelSpread - barrelW * 0.5, -barrelLen, barrelW, barrelLen);
      ctx.strokeRect(barrelSpread - barrelW * 0.5, -barrelLen, barrelW, barrelLen);

      // Namlu İçindeki Işıldayan Enerji Çizgileri
      const barrelGlowAlpha = 0.35 + turret.glowIntensity * 0.65;
      ctx.fillStyle = elemColor;
      ctx.globalAlpha = barrelGlowAlpha;
      ctx.fillRect(-barrelSpread - 0.8, -barrelLen + 2, 1.6, barrelLen - 2);
      ctx.fillRect(barrelSpread - 0.8, -barrelLen + 2, 1.6, barrelLen - 2);
      ctx.globalAlpha = 1;

      // Taret Merkez Füzyon Çekirdeği (Mercek)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, -1, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = elemColor;
      ctx.beginPath();
      ctx.arc(0, -1, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -1, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Namlu Ucu Patlama Parlaması (Muzzle Flash Starburst)
      if (turret.muzzleFlash > 0) {
        const flashAlpha = turret.muzzleFlash;
        this.drawMuzzleFlash(ctx, -barrelSpread, -barrelLen, elemColor, flashAlpha);
        this.drawMuzzleFlash(ctx, barrelSpread, -barrelLen, elemColor, flashAlpha);
      }

      ctx.restore();
    }
  }

  private renderEnemies(ctx: CanvasRenderingContext2D) {
    for (const enemy of this.enemies) {
      if (enemy.y < -50) continue;
      ctx.save();
      ctx.translate(enemy.x, enemy.y);

      // Flash white when damaged
      const isWhiteFlash = enemy.hitFlashTimer > 0;
      const isFrozen = enemy.frozenTimer > 0;
      const isShocked = enemy.shockTimer > 0;

      // Engine Thruster Flame (fast vector)
      ctx.fillStyle = isFrozen ? '#00d2ff' : '#ff5500';
      const flameHeight = Math.sin(enemy.enginePulse) * 4 + 7;
      ctx.beginPath();
      ctx.moveTo(-enemy.width * 0.22, -enemy.height * 0.4);
      ctx.lineTo(0, -enemy.height * 0.4 - flameHeight);
      ctx.lineTo(enemy.width * 0.22, -enemy.height * 0.4);
      ctx.fill();

      // Enemy Ship Body
      if (isWhiteFlash) {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#ffffff';
      } else if (isFrozen) {
        ctx.fillStyle = '#0072aa';
        ctx.strokeStyle = '#6be5ff';
      } else {
        ctx.fillStyle = '#11192e';
        ctx.strokeStyle = enemy.color;
      }
      ctx.lineWidth = 2;

      // Draw Sci-Fi Hull Shape
      if (enemy.isBoss) {
        // Massive Dreadnought Hull
        ctx.beginPath();
        ctx.moveTo(0, enemy.height * 0.6);
        ctx.lineTo(enemy.width * 0.45, enemy.height * 0.1);
        ctx.lineTo(enemy.width * 0.5, -enemy.height * 0.4);
        ctx.lineTo(enemy.width * 0.25, -enemy.height * 0.6);
        ctx.lineTo(-enemy.width * 0.25, -enemy.height * 0.6);
        ctx.lineTo(-enemy.width * 0.5, -enemy.height * 0.4);
        ctx.lineTo(-enemy.width * 0.45, enemy.height * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Boss Red Core Eye (dual circle)
        ctx.fillStyle = '#ff0055';
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (enemy.type === 'scout') {
        // Agile Arrowhead
        ctx.beginPath();
        ctx.moveTo(0, enemy.height * 0.5);
        ctx.lineTo(enemy.width * 0.45, -enemy.height * 0.5);
        ctx.lineTo(0, -enemy.height * 0.25);
        ctx.lineTo(-enemy.width * 0.45, -enemy.height * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (enemy.type === 'bomber') {
        // Heavy Hexagon Bomber
        ctx.beginPath();
        ctx.moveTo(0, enemy.height * 0.5);
        ctx.lineTo(enemy.width * 0.45, enemy.height * 0.2);
        ctx.lineTo(enemy.width * 0.45, -enemy.height * 0.3);
        ctx.lineTo(0, -enemy.height * 0.5);
        ctx.lineTo(-enemy.width * 0.45, -enemy.height * 0.3);
        ctx.lineTo(-enemy.width * 0.45, enemy.height * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // Standard Drone / Shielded Ship
        ctx.beginPath();
        ctx.moveTo(0, enemy.height * 0.5);
        ctx.lineTo(enemy.width * 0.4, -enemy.height * 0.2);
        ctx.lineTo(enemy.width * 0.3, -enemy.height * 0.5);
        ctx.lineTo(-enemy.width * 0.3, -enemy.height * 0.5);
        ctx.lineTo(-enemy.width * 0.4, -enemy.height * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Energy Shield Bubble if enemy has shield
      if (enemy.shieldHp && enemy.shieldHp > 0) {
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, enemy.width * 0.65, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Shock electric overlay
      if (isShocked) {
        ctx.strokeStyle = '#ffd000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-enemy.width * 0.3, -enemy.height * 0.3);
        ctx.lineTo(0, 0);
        ctx.lineTo(enemy.width * 0.3, -enemy.height * 0.2);
        ctx.stroke();
      }

      // Graviton Anchor Hologram on Anchored Enemy
      if (enemy.isAnchored) {
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, enemy.width * 0.75, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#b45309';
        ctx.fillRect(-8, -enemy.height * 0.35, 16, 4);
        ctx.fillRect(-2, -enemy.height * 0.35, 4, 18);
      }

      // Nanite Swarm parasite creeping effect
      if (enemy.naniteInfected) {
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, enemy.width * 0.65, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Enemy HP Bar
      const hpBarW = enemy.width * 0.9;
      const hpBarH = enemy.isBoss ? 6 : 4;
      const hpBarY = -enemy.height * 0.6 - (enemy.isBoss ? 14 : 9);
      const hpRatio = Math.max(0, enemy.hp / enemy.maxHp);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(-hpBarW / 2, hpBarY, hpBarW, hpBarH);

      ctx.fillStyle = hpRatio > 0.4 ? '#00ff88' : '#ff2a5f';
      ctx.fillRect(-hpBarW / 2, hpBarY, hpBarW * hpRatio, hpBarH);

      ctx.restore();
    }
  }

  private renderProjectiles(ctx: CanvasRenderingContext2D) {
    for (const p of this.projectiles) {
      ctx.save();
      const progress = p.life / p.maxLife;

      if (
        p.type === 'laser_beam' ||
        p.type === 'orbital_beam' ||
        p.type === 'solaris_beam' ||
        p.type === 'antimatter_pulse' ||
        p.type === 'gravity_shock' ||
        p.type === 'vampiric_beam' ||
        p.type === 'prism_beam'
      ) {
        const beamAlpha = 1 - progress * progress;
        ctx.globalAlpha = Math.max(0, beamAlpha);

        // Multi-layer outer laser glow
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.width * 1.5 * (1 - progress * 0.5);
        ctx.globalAlpha = beamAlpha * 0.35;
        ctx.beginPath();
        ctx.moveTo(p.x, p.startY);
        ctx.lineTo(p.x, 0);
        ctx.stroke();

        // Main colored beam
        ctx.lineWidth = p.width * (1 - progress * 0.5);
        ctx.globalAlpha = beamAlpha * 0.85;
        ctx.stroke();

        // Core White Laser
        ctx.strokeStyle = '#ffffff';
        ctx.globalAlpha = beamAlpha;
        ctx.lineWidth = Math.max(2, p.width * 0.35);
        ctx.beginPath();
        ctx.moveTo(p.x, p.startY);
        ctx.lineTo(p.x, 0);
        ctx.stroke();
      } else if (p.type === 'chronos_wave') {
        const cAlpha = 1 - progress;
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 4;
        ctx.globalAlpha = cAlpha * 0.7;
        ctx.beginPath();
        ctx.moveTo(0, p.y - progress * 100);
        ctx.lineTo(this.width, p.y - progress * 100);
        ctx.stroke();
      } else if (p.type === 'toxic_cloud') {
        ctx.translate(p.x, p.y);
        ctx.fillStyle = 'rgba(132, 204, 22, 0.45)';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * (1 + progress * 0.8), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'cryo_beam') {
        const cAlpha = 1 - progress;
        ctx.strokeStyle = '#00d2ff';
        ctx.lineWidth = p.width * 1.4;
        ctx.globalAlpha = cAlpha * 0.4;
        ctx.beginPath();
        ctx.moveTo(p.x, p.startY);
        ctx.lineTo(p.x, 0);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = p.width * 0.6;
        ctx.globalAlpha = cAlpha;
        ctx.stroke();
      } else if (p.type === 'cluster_rocket') {
        ctx.translate(p.x, p.y);
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);

        // Rocket Trail
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, p.height / 2, 4, 8);
      } else if (p.type === 'void_vortex') {
        ctx.translate(p.x, p.y);

        // Suction Rays pulling upward towards the black hole
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, this.shieldBarrierY - p.y);
        ctx.stroke();
        ctx.setLineDash([]);

        const pulseScale = 1 + Math.sin(p.life * 10) * 0.15;
        const vortexRadius = p.radius * pulseScale;

        // Rotating Accretion Disk Spirals
        ctx.save();
        ctx.rotate(p.life * 6);

        ctx.strokeStyle = 'rgba(192, 132, 252, 0.6)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, vortexRadius, 0, Math.PI * 1.5);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(168, 85, 247, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, vortexRadius * 0.7, Math.PI * 0.5, Math.PI * 2);
        ctx.stroke();

        ctx.restore();

        // Deep Event Horizon Black Center
        ctx.fillStyle = '#050711';
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (p.type === 'drone_bullet') {
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.atan2(p.vy, p.vx));
        // Glowing steel/cyan rapid tracer
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-6, -1.5, 12, 3);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-8, -2.5, 16, 5);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-10, -1, 4, 2);
      } else if (p.type === 'kinetic_counter') {
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.atan2(p.vy, p.vx));

        // High-velocity Kinetic Counter Shock Lance (Emerald-Turquoise)
        ctx.fillStyle = 'rgba(45, 212, 191, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#14b8a6';
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(2, 0, 8, 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private renderSpectrumWalls(ctx: CanvasRenderingContext2D) {
    for (const wall of this.spectrumWalls) {
      ctx.save();

      // 1. Initial laser beam from turret to wall (fades out quickly)
      if (wall.laserLife < wall.laserMaxLife) {
        const laserAlpha = 1 - (wall.laserLife / wall.laserMaxLife);
        ctx.globalAlpha = laserAlpha;

        // Outer glow
        ctx.strokeStyle = '#e0e7ff';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(wall.laserStartX, wall.laserStartY);
        ctx.lineTo(wall.laserStartX, wall.laserHitY);
        ctx.stroke();

        // Core beam
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // 2. The persistent Spectrum Wall — full-width horizontal light barrier
      const wallAlpha = wall.life < 0.3 ? wall.life / 0.3 : (wall.life > wall.maxLife - 0.5 ? (wall.maxLife - wall.life) / 0.5 : 1.0);
      const pulse = 1 + Math.sin(wall.life * 12) * 0.1;

      // Outer glow band
      ctx.globalAlpha = Math.max(0, wallAlpha * 0.25);
      ctx.fillStyle = '#818cf8';
      ctx.fillRect(0, wall.y - 8 * pulse, this.width, 16 * pulse);

      // Core bright prismatic line
      ctx.globalAlpha = Math.max(0, wallAlpha * 0.85);
      ctx.strokeStyle = '#e0e7ff';
      ctx.lineWidth = 3 * pulse;
      ctx.beginPath();
      ctx.moveTo(0, wall.y);
      ctx.lineTo(this.width, wall.y);
      ctx.stroke();

      // Inner white core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = Math.max(0, wallAlpha);
      ctx.beginPath();
      ctx.moveTo(0, wall.y);
      ctx.lineTo(this.width, wall.y);
      ctx.stroke();

      // Spectrum color shimmer (rainbow trace shifting over time)
      const shimmerX = (wall.life * 180) % this.width;
      ctx.globalAlpha = Math.max(0, wallAlpha * 0.6);
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(shimmerX - 40, wall.y);
      ctx.lineTo(shimmerX + 40, wall.y);
      ctx.stroke();

      ctx.strokeStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(shimmerX + 60, wall.y);
      ctx.lineTo(shimmerX + 120, wall.y);
      ctx.stroke();

      ctx.restore();
    }
  }

  private renderWormholes(ctx: CanvasRenderingContext2D) {
    for (const wh of this.wormholes) {
      const pulse = 1 + Math.sin(wh.life * 8) * 0.12;

      // 1. Entrance Portal (Bottom)
      ctx.save();
      ctx.translate(wh.inX, wh.inY);
      ctx.rotate(wh.life * 4);
      ctx.strokeStyle = '#0d9488';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, wh.radius * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#2dd4bf';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, wh.radius * 0.6 * pulse, 0, Math.PI * 1.5);
      ctx.stroke();
      ctx.fillStyle = 'rgba(13, 148, 136, 0.4)';
      ctx.beginPath();
      ctx.arc(0, 0, wh.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. Exit Portal (Top)
      ctx.save();
      ctx.translate(wh.outX, wh.outY);
      ctx.rotate(-wh.life * 4);
      ctx.strokeStyle = '#14b8a6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, wh.radius * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, wh.radius * 0.6 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(20, 184, 166, 0.5)';
      ctx.beginPath();
      ctx.arc(0, 0, wh.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Subtly connect both portals with quantum tether line
      ctx.save();
      ctx.strokeStyle = 'rgba(45, 212, 191, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(wh.inX, wh.inY);
      ctx.lineTo(wh.outX, wh.outY);
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderStaticMines(ctx: CanvasRenderingContext2D) {
    for (const mine of this.staticMines) {
      ctx.save();
      ctx.translate(mine.x, mine.y);

      // Pulsing magnetic field ring
      const pulse = 1 + Math.sin(mine.life * 6) * 0.15;
      ctx.strokeStyle = 'rgba(2, 132, 199, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, mine.radius * pulse, 0, Math.PI * 2);
      ctx.stroke();

      // Mine core
      ctx.fillStyle = '#082f49';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Center flashing beacon LED
      ctx.fillStyle = Math.sin(mine.life * 12) > 0 ? '#00f3ff' : '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private renderHomingSpores(ctx: CanvasRenderingContext2D) {
    for (const spore of this.homingSpores) {
      ctx.save();
      ctx.translate(spore.x, spore.y);
      ctx.fillStyle = '#6b21a8';
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f3e8ff';
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderOrbitalDrones(ctx: CanvasRenderingContext2D) {
    for (const drone of this.orbitalDrones) {
      ctx.save();
      ctx.translate(drone.x, drone.y);

      // 1. If target locked, draw faint laser targeting line
      if (drone.targetEnemyId) {
        const target = this.enemies.find(e => e.id === drone.targetEnemyId);
        if (target) {
          ctx.save();
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 4]);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(target.x - drone.x, target.y - drone.y);
          ctx.stroke();
          ctx.restore();
        }
      }

      // 2. Drone Remaining Life Arc Ring
      const lifeRatio = Math.max(0, 1 - (drone.life / drone.maxLife));
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, 0, 15, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * lifeRatio, false);
      ctx.stroke();

      // 3. Drone Body Rotated Towards Target
      ctx.rotate(drone.angle + Math.PI / 2);

      // Solar/Sensor Array Wings
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      // Left Wing
      ctx.fillRect(-17, -2.5, 7, 5);
      ctx.strokeRect(-17, -2.5, 7, 5);
      // Right Wing
      ctx.fillRect(10, -2.5, 7, 5);
      ctx.strokeRect(10, -2.5, 7, 5);

      // Central Armored Hull
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Core Scanner Lens (pulsing cyan eye)
      const pulse = Math.sin(drone.life * 10) > 0 ? '#38bdf8' : '#ffffff';
      ctx.fillStyle = pulse;
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      // Forward Dual Machine-Gun Barrels
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-3, -11, 2, 5);
      ctx.fillRect(1, -11, 2, 5);

      ctx.restore();
    }
  }

  private renderSupernovaStars(ctx: CanvasRenderingContext2D) {
    for (const star of this.supernovaStars) {
      ctx.save();
      ctx.translate(star.x, star.y);

      const swell = star.radius;

      // 1. Dış Radyal Korona Aurası (Yumuşak Işıldayan Güneş Aurası)
      const auraGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, swell * 2.4);
      auraGrad.addColorStop(0, '#ffffff');
      auraGrad.addColorStop(0.3, '#fef08a');
      auraGrad.addColorStop(0.65, 'rgba(234, 179, 8, 0.45)');
      auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, 0, swell * 2.4, 0, Math.PI * 2);
      ctx.fill();

      // 2. Kütleçekimsel Akresyon Halkaları (Dönen Kesikli Halkalar)
      ctx.save();
      ctx.rotate(star.pulseAngle * 0.4);
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 10]);
      ctx.beginPath();
      ctx.arc(0, 0, swell * 1.45, 0, Math.PI * 2);
      ctx.stroke();

      ctx.rotate(-star.pulseAngle * 0.9);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, swell * 1.85, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 3. Dinamik Güneş Patlaması Işınları (6 Radyal Işın Kolu)
      ctx.save();
      ctx.rotate(star.pulseAngle * 0.3);
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.75)';
      ctx.lineWidth = 2.5;
      for (let r = 0; r < 6; r++) {
        const rayAngle = (r * Math.PI) / 3;
        const rayLen = swell * (1.6 + Math.sin(star.pulseAngle + r) * 0.35);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(rayAngle) * rayLen, Math.sin(rayAngle) * rayLen);
        ctx.stroke();
      }
      ctx.restore();

      // 4. Parlak Beyaz-Altın Yıldız Çekirdeği
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, swell * 0.75, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  public resetGame(level: number = 1) {
    this.enemies = [];
    this.projectiles = [];
    this.wormholes = [];
    this.staticMines = [];
    this.homingSpores = [];
    this.spectrumWalls = [];
    this.orbitalDrones = [];
    this.supernovaStars = [];
    this.kineticDeflectorTimer = 0;
    this.particles.clear();
    this.shieldHp = BASE_SHIELD_MAX;
    this.maxShieldHp = BASE_SHIELD_MAX;
    this.currentLevel = level;
    this.currentWave = 1;
    this.isWaveInProgress = false;
    this.isBossActive = false;
    this.isMiniBoss = false;
    this.isMainBoss = false;
    this.activeBoss = null;
    this.stats = {
      score: 0,
      highScore: this.stats.highScore,
      wave: 1,
      maxWaves: 8,
      enemiesKilled: 0,
      combosMade: 0,
      maxCombo: 0,
      matchesMade: 0,
      specialsTriggered: 0,
      damageDealt: 0
    };
    this.upgrades = {
      plasmaDamageMult: 1,
      cryoDurationMult: 1,
      electricChainBonus: 1,
      explosiveAoeMult: 1,
      nanoShieldBoost: 1,
      voidVortexDuration: 1,
      voidVortexPullForce: 1,
      voidVortexDamageMult: 0,
      baseMaxShield: BASE_SHIELD_MAX,
      turretFireRate: 1,
      critChance: 0.1,
      energyRechargeRate: 1
    };
    this.initTurrets();
  }
}
