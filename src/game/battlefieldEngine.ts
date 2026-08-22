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

  // Background stars
  private stars: Star[] = [];

  // Sector Ambient Animated Background State
  public ambientTimer: number = 0;
  public ambientAsteroids: Array<{
    x: number;
    y: number;
    size: number;
    rotation: number;
    vRot: number;
    vx: number;
    vy: number;
    vertices: Array<{ x: number; y: number }>;
  }> = [];
  public ambientSnow: Array<{
    x: number;
    y: number;
    size: number;
    speed: number;
    drift: number;
    alpha: number;
    angle: number;
  }> = [];
  public ambientLightning: Array<{
    segments: Array<{ x1: number; y1: number; x2: number; y2: number }>;
    alpha: number;
    timer: number;
    color: string;
  }> = [];
  public ambientLightningCooldown: number = 2.0;
  public ambientGridOffset: number = 0;
  public ambientVortexAngle: number = 0;
  public ambientBlackHoleFilaments: Array<{
    radiusX: number;
    radiusY: number;
    angle: number;
    angularSpeed: number;
    length: number;
    width: number;
    alpha: number;
    color: string;
  }> = [];
  public ambientReactorPulse: number = 0;
  public ambientWarpStars: Array<{
    x: number;
    y: number;
    length: number;
    speed: number;
    alpha: number;
    width: number;
  }> = [];

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

  public coreUpgradeLevels: Record<GemType, number> = {
    plasma: 0,
    cryo: 0,
    electric: 0,
    void: 0,
    explosive: 0,
    nano: 0,
    solaris: 0,
    antimatter: 0,
    chronos: 0,
    toxic: 0,
    gravity: 0,
    vampiric: 0,
    prism: 0,
    anchor: 0,
    echo: 0,
    wormhole: 0,
    parasite: 0,
    static_web: 0,
    orbital_drone: 0,
    supernova: 0,
    deflector: 0
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
  public emergencySlowTimer: number = 0;
  public adrenalineTriggeredThisWave: boolean = false;

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
        deflectorCharges: 0,
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
    this.initSectorAmbient(this.currentLevel);

    // Pre-cache background gradient once on resize
    const lvlConfig = getLevelConfig(this.currentLevel);
    const bgGrad = this.ctx.createRadialGradient(
      this.width * 0.5,
      this.height * 0.3,
      20,
      this.width * 0.5,
      this.height * 0.3,
      this.width * 0.8
    );
    bgGrad.addColorStop(0, `${lvlConfig.gradient[0]}22`);
    bgGrad.addColorStop(0.6, `${lvlConfig.gradient[1]}0f`);
    bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.bgGradient = bgGrad;
  }

  public initSectorAmbient(level: number = this.currentLevel) {
    const lvlConfig = getLevelConfig(level);
    const ambientType = lvlConfig.ambientType;

    this.ambientAsteroids = [];
    this.ambientSnow = [];
    this.ambientLightning = [];
    this.ambientWarpStars = [];
    this.ambientGridOffset = 0;
    this.ambientVortexAngle = 0;
    this.ambientReactorPulse = 0;
    this.ambientLightningCooldown = 1.5;

    const w = this.width || 400;
    const h = this.height || 340;

    if (ambientType === 'asteroids') {
      const count = 9;
      for (let i = 0; i < count; i++) {
        const size = Math.random() * 18 + 10;
        const numPoints = Math.floor(Math.random() * 3) + 6;
        const vertices: Array<{ x: number; y: number }> = [];
        for (let p = 0; p < numPoints; p++) {
          const ang = (p * 2 * Math.PI) / numPoints;
          const dist = size * (0.7 + Math.random() * 0.5);
          vertices.push({ x: Math.cos(ang) * dist, y: Math.sin(ang) * dist });
        }
        this.ambientAsteroids.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.8,
          vx: (Math.random() - 0.5) * 6,
          vy: Math.random() * 14 + 10,
          vertices
        });
      }
    } else if (ambientType === 'cryo_snow') {
      const count = 35;
      for (let i = 0; i < count; i++) {
        this.ambientSnow.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size: Math.random() * 3.5 + 2.0,
          speed: Math.random() * 25 + 18,
          drift: Math.random() * Math.PI * 2,
          alpha: Math.random() * 0.6 + 0.35,
          angle: Math.random() * Math.PI * 2
        });
      }
    } else if (ambientType === 'void_vortex') {
      const count = 56;
      const bhRadius = 52;
      const maxDiskRad = Math.max(w * 0.65, bhRadius * 5.2);
      for (let i = 0; i < count; i++) {
        const radX = bhRadius * 1.04 + Math.random() * (maxDiskRad - bhRadius * 1.04);
        const distRatio = (radX - bhRadius) / (maxDiskRad - bhRadius);
        // Exponential opacity decay into surrounding darkness
        const baseAlpha = Math.pow(1 - distRatio, 1.6) * (Math.random() * 0.4 + 0.3);

        let col = '#f59e0b';
        if (distRatio < 0.18) {
          col = Math.random() > 0.4 ? '#ffffff' : '#fef08a';
        } else if (distRatio < 0.45) {
          col = Math.random() > 0.5 ? '#fde047' : '#fb923c';
        } else if (distRatio < 0.72) {
          col = Math.random() > 0.5 ? '#f43f5e' : '#fb7185';
        } else {
          col = Math.random() > 0.5 ? '#818cf8' : '#6366f1';
        }

        this.ambientBlackHoleFilaments.push({
          radiusX: radX,
          radiusY: radX * 0.30,
          angle: Math.random() * Math.PI * 2,
          angularSpeed: 0.50 + (bhRadius * 2.8) / radX * 0.90,
          length: Math.random() * 0.60 + 0.30,
          width: Math.random() * 2.2 + 1.0,
          alpha: baseAlpha,
          color: col
        });
      }
    } else if (ambientType === 'warp_tunnel') {
      const count = 45;
      for (let i = 0; i < count; i++) {
        this.ambientWarpStars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          length: Math.random() * 35 + 15,
          speed: Math.random() * 260 + 180,
          alpha: Math.random() * 0.7 + 0.3,
          width: Math.random() * 1.5 + 0.8
        });
      }
    }
  }

  public startWave(waveNumber: number) {
    this.currentWave = waveNumber;
    this.stats.wave = waveNumber;
    this.isWaveInProgress = true;
    this.waveSpawnTimer = 0.5; // Quick initial spawn
    this.adrenalineTriggeredThisWave = false;
    this.emergencySlowTimer = 0;

    const lvlConfig = getLevelConfig(this.currentLevel);

    // Wave 4 is Mini Boss, Wave 8 is Main Sector Boss
    const isMini = waveNumber === 4;
    const isMain = waveNumber === 8;
    const isBoss = isMini || isMain;
    this.isBossActive = isBoss;
    this.isMiniBoss = isMini;
    this.isMainBoss = isMain;
    this.activeBoss = null;

    if (isMain) {
      this.waveEnemiesToSpawn = Math.round(lvlConfig.spawnCountBase * 1.45 + this.currentLevel * 2);
      this.waveSpawnInterval = Math.max(0.70, lvlConfig.spawnIntervalBase * 0.90);
    } else if (isMini) {
      this.waveEnemiesToSpawn = Math.round(lvlConfig.spawnCountBase * 1.25 + this.currentLevel * 2);
      this.waveSpawnInterval = Math.max(0.75, lvlConfig.spawnIntervalBase * 0.95);
    } else {
      this.waveEnemiesToSpawn = Math.round(lvlConfig.spawnCountBase + (waveNumber - 1) * 2);
      this.waveSpawnInterval = Math.max(0.60, lvlConfig.spawnIntervalBase - (waveNumber - 1) * 0.08);
    }
    this.waveEnemiesSpawned = 0;

    // Visual wave banner announcement
    if (this.width > 0 && this.height > 0) {
      const speedPct = Math.round((waveNumber - 1) * 15);
      const dmgPct = Math.round((waveNumber - 1) * 20);
      const bannerY = Math.max(45, this.height * 0.26);
      this.particles.addFloatingText(this.width * 0.5, bannerY, `⚔️ DALGA ${waveNumber} / 8 ⚔️`, '#38bdf8', true);
      if (waveNumber > 1) {
        this.particles.addFloatingText(this.width * 0.5, bannerY + 22, `⚡ HIZ: +%${speedPct} | 💥 HASAR: +%${dmgPct}`, '#facc15', false);
      }
    }
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

    // Dynamic wave & level progression multipliers (Tangible, high-impact progression)
    const waveSpeedMultiplier = 1 + (this.currentWave - 1) * 0.15 + (this.currentLevel - 1) * 0.05;
    const waveDamageMultiplier = 1 + (this.currentWave - 1) * 0.20 + (this.currentLevel - 1) * 0.18;

    if (forceBoss || (this.isBossActive && !this.activeBoss && this.waveEnemiesSpawned >= Math.floor(this.waveEnemiesToSpawn * 0.28))) {
      if (this.isMainBoss) {
        // Spawn Main Titan Boss (covers lanes 2, 3, 4, 5)
        const bossHp = Math.round((2800 + this.currentLevel * 950) * diff);
        const bossSpeed = (6.0 + this.currentLevel * 0.5) * waveSpeedMultiplier;
        const bossAttack = Math.round((220 + this.currentLevel * 30) * (1 + (this.currentLevel - 1) * 0.18));
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
          speed: bossSpeed,
          baseSpeed: bossSpeed,
          color: '#ff0055',
          glowColor: 'rgba(255, 0, 85, 0.95)',
          scoreValue: 2000 * this.currentLevel,
          attackPower: bossAttack,
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
        const bossSpeed = (9.0 + this.currentLevel * 0.6) * waveSpeedMultiplier;
        const bossAttack = Math.round((130 + this.currentLevel * 20) * (1 + (this.currentLevel - 1) * 0.15));
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
          speed: bossSpeed,
          baseSpeed: bossSpeed,
          color: '#ffd000',
          glowColor: 'rgba(255, 208, 0, 0.9)',
          scoreValue: 1000 * this.currentLevel,
          attackPower: bossAttack,
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

    // Determine enemy type based on sector-specific weights and wave gates
    const baseWeights = lvlConfig.enemyWeights || { drone: 50, scout: 30, speeder: 20 };
    const weightedTypes = (Object.keys(baseWeights) as EnemyType[]).filter(type => {
      if (type === 'speeder' || type === 'siege') return this.currentWave >= 2 || this.currentLevel >= 2;
      if (type === 'shielded') return this.currentWave >= 2 || this.currentLevel >= 3;
      if (type === 'bomber') return this.currentWave >= 3 || this.currentLevel >= 4;
      return true;
    });

    let totalWeight = 0;
    for (const t of weightedTypes) {
      totalWeight += (baseWeights[t] || 10);
    }
    let roll = Math.random() * (totalWeight > 0 ? totalWeight : 100);
    let randType: EnemyType = weightedTypes[0] || 'drone';
    for (const t of weightedTypes) {
      const w = baseWeights[t] || 10;
      if (roll <= w) {
        randType = t;
        break;
      }
      roll -= w;
    }
    const lane = Math.floor(Math.random() * NUM_LANES);
    const laneX = this.getLaneX(lane);

    // Baseline archetype stats with tangible scaling
    let baseHp = (52 + this.currentWave * 16 + this.currentLevel * 14) * diff;
    let baseSpeed = 20 + Math.random() * 3.0;
    let baseAttack = 28;
    let color = '#00f3ff';
    let score = 50 * this.currentLevel;
    let width = laneWidth * 0.72;
    let height = 30;
    let shieldHp: number | undefined = undefined;

    if (randType === 'scout') {
      baseHp = (38 + this.currentWave * 12 + this.currentLevel * 10) * diff;
      baseSpeed = 26 + Math.random() * 2.5;
      baseAttack = 22;
      color = '#00ffcc';
      score = 40 * this.currentLevel;
      width = laneWidth * 0.58;
      height = 24;
    } else if (randType === 'speeder') {
      baseHp = (70 + this.currentWave * 20 + this.currentLevel * 18) * diff;
      baseSpeed = 32 + Math.random() * 3.0;
      baseAttack = 50;
      color = '#ffaa00';
      score = 65 * this.currentLevel;
      width = laneWidth * 0.55;
      height = 26;
    } else if (randType === 'siege') {
      // Kuşatma Topçusu: Ekranda mevzilenir, periyodik ağır plazma sıkar
      baseHp = (125 + this.currentWave * 35 + this.currentLevel * 30) * diff;
      baseSpeed = 36;
      baseAttack = 65;
      color = '#f97316';
      score = 110 * this.currentLevel;
      width = laneWidth * 0.86;
      height = 32;
    } else if (randType === 'shielded') {
      baseHp = (110 + this.currentWave * 32 + this.currentLevel * 28) * diff;
      shieldHp = baseHp * 0.75;
      baseSpeed = 15 + Math.random() * 2.0;
      baseAttack = 80;
      color = '#a855f7';
      score = 90 * this.currentLevel;
      width = laneWidth * 0.72;
      height = 34;
    } else if (randType === 'bomber') {
      baseHp = (140 + this.currentWave * 40 + this.currentLevel * 35) * diff;
      baseSpeed = 12 + Math.random() * 1.8;
      baseAttack = 140;
      color = '#ff3344';
      score = 120 * this.currentLevel;
      width = laneWidth * 0.9;
      height = 36;
    }

    const finalSpeed = baseSpeed * waveSpeedMultiplier;
    const finalAttack = Math.round(baseAttack * waveDamageMultiplier);

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
      speed: finalSpeed,
      baseSpeed: finalSpeed,
      color,
      glowColor: color,
      scoreValue: score,
      attackPower: finalAttack,
      frozenTimer: 0,
      shockTimer: 0,
      burnTimer: 0,
      hitFlashTimer: 0,
      enginePulse: Math.random() * Math.PI * 2,
      targetY: randType === 'siege' ? (55 + (lane % 4) * 22) : undefined,
      shootTimer: randType === 'siege' ? 2.5 : undefined,
      isSiegeMode: false
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
          const anchorBaseDur = leadEnemy.isBoss ? 3.5 : (this.upgrades.anchorDuration || 5.0);
          leadEnemy.isAnchored = true;
          leadEnemy.anchorTimer = anchorBaseDur;
          this.applyDamageToEnemy(leadEnemy, finalDamage, 'anchor', isCrit);
          this.particles.addFloatingText(leadEnemy.x, leadEnemy.y - 16, 'GRAVITON ANCHORED!', '#b45309', true);
          this.particles.addExplosion(leadEnemy.x, leadEnemy.y, '#b45309', 14);
        } else {
          this.hitEnemiesInLane(lane, finalDamage, 'anchor', isCrit);
        }
        break;
      }
      case 'echo': {
        // Echo Replicator: Replicate previous core weapon (Tier 1: %160 power, Tier 2: neighbor lane, Tier 3: hyper cube)
        const replicated = (this.lastTriggeredElement === 'echo' || !this.lastTriggeredElement) ? 'plasma' : this.lastTriggeredElement;
        const echoMult = this.upgrades.echoPowerMult || 1.2;
        const displayPercent = Math.round(echoMult * 100);
        this.particles.addFloatingText(laneX, turretY - 35, `ECHO (%${displayPercent}): ${GEM_ELEMENTS[replicated].turkishName.toUpperCase()}`, '#f8fafc', true);
        soundManager.playMatch(Math.min(5, combo + 1));
        this.fireLaneWeapons(lane, replicated, Math.max(1, Math.round(count * echoMult)), specialCount, combo);

        // Tier 2: Neighbor Lane Echo
        if (this.upgrades.echoNeighborLane) {
          const neighborLane = (lane + 1 < NUM_LANES) ? lane + 1 : lane - 1;
          this.fireLaneWeapons(neighborLane, replicated, Math.max(1, Math.round(count * echoMult * 0.7)), 0, combo);
        }

        // Tier 3: Drop a Joker Hyper-Cube Sparkle
        if (this.upgrades.echoSpawnHyperCube) {
          this.particles.addFloatingText(laneX, turretY - 55, '✨ JOKER ENERJİ KÜRESİ!', '#ffd000', true);
          this.particles.addLaserImpact(laneX, turretY - 20, '#ffd000', 14);
        }
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
        // Static Web: Deploy 3 or 5 Magnetic Mines in Lane
        const finalDamage = baseDmg * 0.85 * critMult;
        soundManager.playEmpWave();
        const mineYs = this.upgrades.staticWebMineCount === 5 ? [55, 95, 135, 175, 215] : [85, 140, 195];

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

        const countText = this.upgrades.staticWebMineCount === 5 ? 'x5' : 'x3';
        this.particles.addFloatingText(laneX, 140, `STATIC WEB ARMED (${countText})`, '#0284c7', true);
        break;
      }
      case 'orbital_drone': {
        // Yörünge Uydusu: 1 or 2 autonomous combat satellites (8s / 12s duration)
        const droneCount = this.upgrades.orbitalDroneDual ? 2 : 1;
        const maxLife = this.upgrades.orbitalDroneDuration || 8.0;
        const fireInterval = 0.16 / (this.upgrades.orbitalDroneFireRate || 1.0);
        const bulletDamage = (baseDmg * 0.32 + 35) * critMult;
        soundManager.playLaser();

        for (let d = 0; d < droneCount; d++) {
          this.orbitalDrones.push({
            id: `drone_${Date.now()}_${d}_${Math.random()}`,
            x: laneX + (d === 1 ? 40 : 0),
            y: this.shieldBarrierY - 60,
            targetX: laneX,
            targetY: this.shieldBarrierY - 60,
            patrolDir: d === 1 ? -1 : 1,
            life: 0,
            maxLife,
            fireTimer: 0,
            fireInterval,
            bulletDamage,
            angle: -Math.PI / 2,
            targetEnemyId: null
          });
        }

        this.particles.triggerScreenShake(3, 0.15);
        const durText = Math.round(maxLife);
        this.particles.addFloatingText(laneX, this.shieldBarrierY - 75, `DRON FİLOSU (${droneCount}x, ${durText}s)!`, '#94a3b8', true);
        this.particles.addLaserImpact(laneX, this.shieldBarrierY - 60, '#38bdf8', 12);
        break;
      }
      case 'supernova': {
        // Süpernova Çekirdeği: Mini yıldız
        const supernovaDmgMult = this.upgrades.supernovaDamageMult || 1.0;
        const finalDamage = baseDmg * 1.65 * critMult * supernovaDmgMult;
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
        // Reaktif Kinetik Kalkan: sonraki mermileri engelleyen stacklenebilir reaktif enerji bariyeri kurar
        const chargesToAdd = this.upgrades.deflectorChargesPerMatch || 1;
        this.turrets[lane].deflectorCharges = (this.turrets[lane].deflectorCharges || 0) + chargesToAdd;
        const currentCharges = this.turrets[lane].deflectorCharges;
        soundManager.playShieldHit();

        this.particles.triggerScreenShake(3, 0.15);
        this.particles.addFloatingText(laneX, this.shieldBarrierY - 35, `KİNETİK REFLEKTÖR (🛡️ x${currentCharges})!`, '#14b8a6', true);
        this.particles.addLaserImpact(laneX, this.shieldBarrierY, '#2dd4bf', 14);

        // Flash kinetic pulse along the lane
        turret.socketGlow = 1.0;
        turret.conduitPulse = 1.0;
        turret.glowIntensity = 1.0;
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

  public healShield(amount: number) {
    this.repairShield(amount);
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

  private updateSectorAmbient(effectiveDt: number, dt: number) {
    this.ambientTimer += dt;
    const lvlConfig = getLevelConfig(this.currentLevel);
    const ambientType = lvlConfig.ambientType;
    const w = this.width || 400;
    const h = this.height || 340;

    if (ambientType === 'asteroids') {
      for (const a of this.ambientAsteroids) {
        a.y += a.vy * effectiveDt;
        a.x += a.vx * effectiveDt;
        a.rotation += a.vRot * effectiveDt;
        if (a.y > h + 50) {
          a.y = -50;
          a.x = Math.random() * w;
        }
        if (a.x < -50) a.x = w + 50;
        if (a.x > w + 50) a.x = -50;
      }
    } else if (ambientType === 'cryo_snow') {
      for (const s of this.ambientSnow) {
        s.y += s.speed * effectiveDt;
        s.x += Math.sin(this.ambientTimer * 1.5 + s.drift) * 16 * effectiveDt;
        s.angle += effectiveDt * 1.2;
        if (s.y > h + 20) {
          s.y = -20;
          s.x = Math.random() * w;
        }
      }
    } else if (ambientType === 'cyber_grid') {
      this.ambientGridOffset = (this.ambientGridOffset + effectiveDt * 42) % 36;
    } else if (ambientType === 'ion_lightning') {
      this.ambientLightningCooldown -= dt;
      if (this.ambientLightningCooldown <= 0) {
        this.ambientLightningCooldown = Math.random() * 1.8 + 1.2;
        // Generate a new lightning bolt
        const startX = Math.random() * w;
        let currX = startX;
        let currY = 0;
        const segments: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
        while (currY < h * 0.75) {
          const nextX = currX + (Math.random() - 0.5) * 36;
          const nextY = currY + Math.random() * 32 + 16;
          segments.push({ x1: currX, y1: currY, x2: nextX, y2: nextY });
          currX = nextX;
          currY = nextY;
        }
        this.ambientLightning.push({
          segments,
          alpha: 1.0,
          timer: 0.28,
          color: Math.random() > 0.4 ? '#c084fc' : '#38bdf8'
        });
      }
      for (let i = this.ambientLightning.length - 1; i >= 0; i--) {
        const l = this.ambientLightning[i];
        l.timer -= dt;
        l.alpha = Math.max(0, l.timer / 0.28);
        if (l.timer <= 0) {
          this.ambientLightning.splice(i, 1);
        }
      }
    } else if (ambientType === 'void_vortex') {
      this.ambientVortexAngle += effectiveDt * 0.85;
      for (const f of this.ambientBlackHoleFilaments) {
        f.angle = (f.angle + f.angularSpeed * effectiveDt) % (Math.PI * 2);
      }
    } else if (ambientType === 'quantum_pulse') {
      this.ambientReactorPulse += effectiveDt * 2.2;
    } else if (ambientType === 'warp_tunnel') {
      for (const st of this.ambientWarpStars) {
        st.y += st.speed * effectiveDt;
        if (st.y > h + st.length) {
          st.y = -st.length;
          st.x = Math.random() * w;
        }
      }
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

    // Emergency Adrenaline Buffer (Tactical slow-motion cushion when shield is critical)
    if (this.emergencySlowTimer > 0) {
      this.emergencySlowTimer -= dt;
      effectiveDt *= 0.75;
    }

    // Background starfield scroll & gravitational orbital swirl in Sector 6
    const lvlConfig = getLevelConfig(this.currentLevel);
    const isVoidSector = lvlConfig.ambientType === 'void_vortex';
    const bhX = this.width * 0.5;
    const bhY = this.height * 0.30;
    const bhRadius = 52;

    for (const star of this.stars) {
      if (isVoidSector) {
        // Sector 6: Ambient cosmic dust and stars swirl & orbit the Black Hole!
        let dx = star.x - bhX;
        let dy = (star.y - bhY) / 0.36; // Project into tilted elliptical disk plane
        let r = Math.hypot(dx, dy);
        let theta = Math.atan2(dy, dx);

        // Orbital angular velocity: faster near event horizon, gentle in deep space
        const omega = (0.35 + (bhRadius * 2.2) / Math.max(r, 30)) * (effectiveDt * 0.75);
        theta += omega;

        // Inward gravitational spiral drift
        r -= (10 + 20 / (1 + r * 0.008)) * effectiveDt;

        // Re-inject stars that fall past the event horizon or drift out of bounds
        if (r < bhRadius * 0.75 || r > Math.max(this.width, this.height) * 0.85) {
          r = Math.random() * (Math.max(this.width, this.height) * 0.55) + bhRadius * 2.0;
          theta = Math.random() * Math.PI * 2;
        }

        star.x = bhX + Math.cos(theta) * r;
        star.y = bhY + Math.sin(theta) * (r * 0.36);
      } else {
        // Standard downward starfield scroll
        star.y += star.speed * (effectiveDt * 0.6 + dt * 0.4);
        if (star.y > this.height) {
          star.y = 0;
          star.x = Math.random() * this.width;
        }
      }
    }

    // Update sector ambient animations
    this.updateSectorAmbient(effectiveDt, dt);

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

      // Gravitational accretion: pull nearby enemies towards the star (Tier 1: full screen pull radius)
      const pullRadius = this.upgrades.supernovaPullRadiusMult ? this.width * 1.5 : 170;
      for (const enemy of this.enemies) {
        const edx = star.x - enemy.x;
        const edy = star.y - enemy.y;
        const dist = Math.hypot(edx, edy);
        if (dist > 5 && dist < pullRadius) {
          const pullForce = (1 - dist / pullRadius) * (this.upgrades.supernovaPullRadiusMult ? 75 : 48) * effectiveDt;
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
            if (this.upgrades.supernovaRadiationZone) {
              enemy.burnTimer = Math.max(enemy.burnTimer || 0, 4.0);
            }
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
      } else if (this.enemies.length === 0 && !this.activeBoss) {
        this.isWaveInProgress = false;
        this.onWaveCleared?.(this.currentWave);
      }
    }

    // Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      // Update debuff timers
      if (enemy.frozenTimer > 0) enemy.frozenTimer = Math.max(0, enemy.frozenTimer - effectiveDt);
      if (enemy.shockTimer > 0) enemy.shockTimer = Math.max(0, enemy.shockTimer - effectiveDt);
      if (enemy.hitFlashTimer > 0) enemy.hitFlashTimer = Math.max(0, enemy.hitFlashTimer - effectiveDt);

      // Graviton Anchor pinning timer countdown & release / detonation
      if (enemy.isAnchored) {
        enemy.anchorTimer = (enemy.anchorTimer || 0) - effectiveDt;
        if (enemy.anchorTimer <= 0) {
          enemy.isAnchored = false;
          enemy.anchorTimer = 0;
          this.particles.addFloatingText(enemy.x, enemy.y - 14, 'PRANGA ÇÖZÜLDÜ', '#cbd5e1', false);

          // Tier 3: Çapa süresi bittiğinde kilitli düşman patlayarak arkasındaki tüm trafiği havaya uçurur
          if (this.upgrades.anchorDetonation) {
            soundManager.playExplosion(true);
            this.particles.triggerScreenShake(8, 0.25);
            this.particles.addExplosion(enemy.x, enemy.y, '#b45309', 32, true);
            this.particles.addFloatingText(enemy.x, enemy.y - 25, 'GRAVİTON PATLAMASI!', '#f59e0b', true);
            const detDmg = 350 + this.currentLevel * 45;
            for (const other of this.enemies) {
              if (other.lane === enemy.lane && Math.abs(other.y - enemy.y) <= 120) {
                this.applyDamageToEnemy(other, detDmg, 'anchor', true);
              }
            }
          }
        }
      }

      // Burn tick
      if (enemy.burnTimer && enemy.burnTimer > 0) {
        enemy.burnTimer -= effectiveDt;
        const burnDmg = (38 + this.currentLevel * 6) * effectiveDt;
        this.applyDamageToEnemy(enemy, burnDmg, 'solaris', false);
      }

      // Nanite infection tick
      if (enemy.naniteInfected && enemy.naniteTimer && enemy.naniteTimer > 0) {
        enemy.naniteTimer -= effectiveDt;
        enemy.naniteTickTimer = (enemy.naniteTickTimer || 0) + effectiveDt;
        if (enemy.naniteTickTimer >= 0.4) {
          enemy.naniteTickTimer = 0;
          const naniteTickDamage = 28 + this.currentLevel * 4;
          this.applyDamageToEnemy(enemy, naniteTickDamage, 'parasite', false);
          this.particles.addLaserImpact(enemy.x, enemy.y, '#a855f7', 3);
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

          // Tier 1: Işınlanan düşmanlar portal çıkışında %40 hasar alır
          const exitDmgRatio = this.upgrades.wormholeExitDamage ? 0.40 : 0;
          const warpDamage = 80 + enemy.maxHp * exitDmgRatio;
          this.applyDamageToEnemy(enemy, warpDamage, 'void', false);

          // Tier 3: Çıkış portalının etrafında yerçekimi tersinimi
          if (this.upgrades.wormholeGravityRepel) {
            enemy.frozenTimer = Math.max(enemy.frozenTimer, 1.5);
            enemy.shockTimer = Math.max(enemy.shockTimer, 1.5);
            this.particles.addFloatingText(wh.outX, wh.outY - 20, 'YERÇEKİMİ TERSİNİMİ!', '#0d9488', true);
          }
          break;
        }
      }

      // Check Static Web Mines
      for (let m = this.staticMines.length - 1; m >= 0; m--) {
        const mine = this.staticMines[m];
        if (enemy.lane === mine.lane && Math.hypot(enemy.x - mine.x, enemy.y - mine.y) <= mine.radius + 14) {
          this.applyDamageToEnemy(enemy, mine.damage, 'electric', true);
          const stunDur = this.upgrades.staticWebStunDuration || 1.0;
          enemy.frozenTimer = Math.max(enemy.frozenTimer, stunDur);
          enemy.shockTimer = Math.max(enemy.shockTimer, stunDur);
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

      // Kuşatma Topçusu: Ekrana girip hedeflenen irtifada durur ve 5 saniyede bir aşağıya mermi ateşler
      if (enemy.type === 'siege') {
        const targetStopY = enemy.targetY || 65;
        if (enemy.y >= targetStopY) {
          currentSpeed = 0;
          enemy.isSiegeMode = true;
          enemy.y = targetStopY + Math.sin(enemy.enginePulse * 0.4) * 1.5;

          // Dalga ve sektöre göre periyodik ağır plazma mermisi ateşleme (Dengeli frekans)
          if (enemy.frozenTimer <= 0 && enemy.shockTimer <= 0) {
            enemy.shootTimer = (enemy.shootTimer || 0) + effectiveDt;
            const siegeInterval = Math.max(2.4, 4.8 - (this.currentWave - 1) * 0.28 - (this.currentLevel - 1) * 0.18);
            if (enemy.shootTimer >= siegeInterval) {
              enemy.shootTimer = 0;
              soundManager.playLaser();
              this.particles.addExplosion(enemy.x, enemy.y + enemy.height * 0.5, '#f97316', 8);

              this.projectiles.push({
                id: `enemy_bullet_${Date.now()}_${Math.random()}`,
                type: 'enemy_bullet',
                lane: enemy.lane,
                x: enemy.x,
                y: enemy.y + enemy.height * 0.5,
                startX: enemy.x,
                startY: enemy.y + enemy.height * 0.5,
                targetX: enemy.x,
                targetY: this.shieldBarrierY,
                vx: 0,
                vy: 320 + (this.currentWave - 1) * 12,
                damage: enemy.attackPower * 0.85,
                color: '#f97316',
                width: 8,
                height: 18,
                radius: 6,
                life: 0,
                maxLife: 3.5,
                element: 'plasma'
              });
            }
          }
        }
      }

      // Graviton Anchor Traffic Bottleneck & Tier 2 Crush Tension
      if (!enemy.isAnchored && !enemy.isSiegeMode) {
        for (const other of this.enemies) {
          if (other !== enemy && other.isAnchored && other.lane === enemy.lane && other.y > enemy.y) {
            const minAllowedY = other.y - other.height - 4;
            if (enemy.y + enemy.height >= minAllowedY) {
              enemy.y = minAllowedY - enemy.height;
              currentSpeed = 0;

              if (this.upgrades.anchorCrushTension) {
                const crushDmg = (45 + this.currentLevel * 8) * effectiveDt;
                this.applyDamageToEnemy(enemy, crushDmg, 'anchor', false);
                this.particles.addLaserImpact(enemy.x, enemy.y, '#b45309', 1);
              }
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
        const turret = this.turrets[enemy.lane];
        if (turret && turret.deflectorCharges && turret.deflectorCharges > 0 && this.upgrades.deflectorReflectBodies) {
          // Tier 2: Bariyer temas eden düşman gövdelerini geri püskürtüp hasarını geri yansıtır (1 hak harcar)
          turret.deflectorCharges -= 1;
          const remainingCharges = turret.deflectorCharges;
          const deflectorMult = this.upgrades.deflectorDamageMult || 2.0;
          this.applyDamageToEnemy(enemy, enemy.attackPower * deflectorMult, 'deflector', true);
          enemy.y = Math.max(30, this.shieldBarrierY - 120);
          enemy.frozenTimer = 1.5;
          this.particles.addExplosion(enemy.x, this.shieldBarrierY, '#14b8a6', 22, true);
          const badgeText = remainingCharges > 0 ? `⚡ ${deflectorMult}X GÖVDE YANSITMA! (Kalan: x${remainingCharges})` : `⚡ ${deflectorMult}X GÖVDE YANSITMA!`;
          this.particles.addFloatingText(enemy.x, this.shieldBarrierY - 35, badgeText, '#14b8a6', true);
          if (this.upgrades.deflectorHealOnReflect) {
            this.healShield(this.maxShieldHp * 0.05);
          }
          soundManager.playShieldHit();
          continue;
        }

        this.hitShield(enemy.attackPower);
        this.particles.addExplosion(enemy.x, this.shieldBarrierY, enemy.color, 16);
        this.particles.addFloatingText(enemy.x, this.shieldBarrierY - 24, `-${Math.round(enemy.attackPower)}`, '#ef4444', true);
        this.particles.triggerScreenShake(6, 0.25);
        soundManager.playShieldHit();
        soundManager.triggerVibrate([40, 50, 40]);
        this.enemies.splice(i, 1);
        if (enemy.isBoss) {
          this.activeBoss = null;
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

      // Enemy Bullet Collision (Hits Barrier or gets DEFLECTED by Kinetic Deflector)
      if (p.type === 'enemy_bullet') {
        if (p.y >= this.shieldBarrierY - 6) {
          const turret = this.turrets[p.lane];
          if (turret && turret.deflectorCharges && turret.deflectorCharges > 0) {
            // 1 Deflect hakkı harca
            turret.deflectorCharges -= 1;
            const remainingCharges = turret.deflectorCharges;

            // ⚡ KİNETİK DEFLEKTÖR KARŞI SALDIRI
            const deflectorMult = this.upgrades.deflectorDamageMult || 2.0;
            this.projectiles.push({
              id: `reflected_bullet_${Date.now()}_${Math.random()}`,
              type: 'reflected_bullet',
              lane: p.lane,
              x: p.x,
              y: this.shieldBarrierY - 14,
              startX: p.x,
              startY: this.shieldBarrierY - 14,
              vx: (Math.random() - 0.5) * 30,
              vy: -680,
              damage: p.damage * deflectorMult, // 2x or 3.5x
              color: '#14b8a6',
              width: 8,
              height: 22,
              radius: 7,
              life: 0,
              maxLife: 2.0,
              element: 'deflector'
            });

            if (this.upgrades.deflectorHealOnReflect) {
              this.healShield(this.maxShieldHp * 0.05);
            }

            soundManager.playShieldHit();
            this.particles.addExplosion(p.x, this.shieldBarrierY, '#14b8a6', 18, true);
            const badgeText = remainingCharges > 0 ? `⚡ ${deflectorMult}X YANSITMA! (Kalan: x${remainingCharges})` : `⚡ ${deflectorMult}X YANSITMA!`;
            this.particles.addFloatingText(p.x, this.shieldBarrierY - 30, badgeText, '#14b8a6', true);
            this.particles.triggerScreenShake(3, 0.15);
          } else {
            // Normal kalkan darbesi
            this.hitShield(p.damage);
            this.particles.addExplosion(p.x, this.shieldBarrierY, '#f97316', 10);
            this.particles.addFloatingText(p.x, this.shieldBarrierY - 20, `-${Math.round(p.damage)}`, '#f97316', true);
            soundManager.playShieldHit();
          }
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // Reflected Counter-Attack Bullet Collision (Hits enemies in flight)
      if (p.type === 'reflected_bullet') {
        const hitEnemy = this.enemies.find(e => Math.hypot(e.x - p.x, e.y - p.y) < e.width * 0.6);
        if (hitEnemy) {
          this.applyDamageToEnemy(hitEnemy, p.damage, 'deflector', true);
          this.particles.addExplosion(p.x, p.y, '#14b8a6', 16, true);
          this.particles.addFloatingText(hitEnemy.x, hitEnemy.y - 15, `-${Math.round(p.damage)} [2X COUNTER]`, '#2dd4bf', true);
          soundManager.playExplosion(false);
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

    // Emergency Adrenaline Buffer (Tactical survival cushion when shield falls <= 25%)
    if (this.shieldHp > 0 && this.shieldHp / this.maxShieldHp <= 0.25 && !this.adrenalineTriggeredThisWave) {
      this.adrenalineTriggeredThisWave = true;
      this.emergencySlowTimer = 3.0;
      this.particles.triggerScreenShake(10, 0.35);
      this.particles.addFloatingText(this.width * 0.5, this.shieldBarrierY - 45, '⚠️ KRİTİK SEVİYE: ACİL DURUM TAMPONU!', '#f59e0b', true);
      soundManager.playEmpWave();
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

    // Deep Space Background (Pitch Black in Void Rift)
    const lvlConfig = getLevelConfig(this.currentLevel);
    const isVoid = lvlConfig.ambientType === 'void_vortex';
    ctx.fillStyle = isVoid ? '#000000' : '#070a14';
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle Pre-cached Cyber Nebula Glow (Omitted in Void Rift for complete pitch-black surroundings)
    if (this.bgGradient && !isVoid) {
      ctx.fillStyle = this.bgGradient;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // Render Stars (Soft swirling starlight in Void Rift, standard in other sectors)
    const bhX = this.width * 0.5;
    const bhY = this.height * 0.30;
    const bhRadius = 52;

    for (const star of this.stars) {
      if (isVoid) {
        const dx = star.x - bhX;
        const dy = star.y - bhY;
        const dist = Math.hypot(dx, dy);
        // Star fades gracefully as it approaches the pitch-black event horizon
        const fade = Math.min(1, Math.max(0, (dist - bhRadius * 0.85) / (bhRadius * 1.4)));
        ctx.fillStyle = dist < bhRadius * 3.0 ? '#fef08a' : '#ffffff';
        ctx.globalAlpha = star.alpha * 0.75 * fade;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = star.alpha;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      }
    }
    ctx.globalAlpha = 1;

    // Render Sector Dynamic Thematic Background
    this.renderSectorBackground(ctx);

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

  private renderSectorBackground(ctx: CanvasRenderingContext2D) {
    const lvlConfig = getLevelConfig(this.currentLevel);
    const ambientType = lvlConfig.ambientType;
    const w = this.width;
    const h = this.height;

    // 1. Dynamic Themed Radial Glow (Omitted in Void Rift so surroundings stay pitch black)
    if (ambientType !== 'void_vortex') {
      const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.35, 10, w * 0.5, h * 0.35, w * 0.85);
      bgGrad.addColorStop(0, `${lvlConfig.gradient[0]}22`);
      bgGrad.addColorStop(0.5, `${lvlConfig.gradient[1]}0f`);
      bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // 2. Specific Sector Atmospheric Rendering
    switch (ambientType) {
      case 'asteroids': {
        // Render 3D shaded rocky asteroids drifting
        for (const a of this.ambientAsteroids) {
          ctx.save();
          ctx.translate(a.x, a.y);
          ctx.rotate(a.rotation);

          const rockGrad = ctx.createLinearGradient(-a.size, -a.size, a.size, a.size);
          rockGrad.addColorStop(0, '#475569');
          rockGrad.addColorStop(0.5, '#1e293b');
          rockGrad.addColorStop(1, '#0f172a');
          ctx.fillStyle = rockGrad;
          ctx.strokeStyle = 'rgba(0, 243, 255, 0.28)';
          ctx.lineWidth = 1;

          ctx.beginPath();
          if (a.vertices.length > 0) {
            ctx.moveTo(a.vertices[0].x, a.vertices[0].y);
            for (let i = 1; i < a.vertices.length; i++) {
              ctx.lineTo(a.vertices[i].x, a.vertices[i].y);
            }
            ctx.closePath();
          }
          ctx.fill();
          ctx.stroke();

          // Highlight facet & craters
          ctx.fillStyle = 'rgba(255, 255, 255, 0.09)';
          ctx.beginPath();
          ctx.arc(-a.size * 0.25, -a.size * 0.25, a.size * 0.35, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.beginPath();
          ctx.arc(a.size * 0.2, a.size * 0.2, a.size * 0.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
        break;
      }

      case 'plasma': {
        // Multi-layer pulsating plasma clouds
        const pulse = Math.sin(this.ambientTimer * 1.5);
        const pGrad = ctx.createRadialGradient(
          w * (0.5 + Math.sin(this.ambientTimer * 0.6) * 0.15),
          h * (0.3 + Math.cos(this.ambientTimer * 0.5) * 0.1),
          15,
          w * 0.5,
          h * 0.4,
          w * (0.6 + pulse * 0.1)
        );
        pGrad.addColorStop(0, 'rgba(255, 42, 95, 0.22)');
        pGrad.addColorStop(0.45, 'rgba(234, 88, 12, 0.12)');
        pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = pGrad;
        ctx.fillRect(0, 0, w, h);

        // Second organic plasma cloud lobe
        const pGrad2 = ctx.createRadialGradient(
          w * (0.3 + Math.cos(this.ambientTimer * 0.8) * 0.2),
          h * (0.6 + Math.sin(this.ambientTimer * 0.7) * 0.12),
          10,
          w * 0.35,
          h * 0.55,
          w * 0.55
        );
        pGrad2.addColorStop(0, 'rgba(255, 85, 0, 0.15)');
        pGrad2.addColorStop(0.5, 'rgba(180, 0, 48, 0.08)');
        pGrad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = pGrad2;
        ctx.fillRect(0, 0, w, h);
        break;
      }

      case 'cyber_grid': {
        // Retro-futuristic Cyber Wireframe Perspective Grid
        ctx.save();
        const step = 36;
        for (let y = this.ambientGridOffset; y < h; y += step) {
          const depthAlpha = Math.min(0.22, (y / h) * 0.25);
          ctx.strokeStyle = `rgba(255, 208, 0, ${depthAlpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        // Perspective vertical converging grid lines
        const vanishX = w * 0.5;
        const vanishY = -40;
        const vCount = 10;
        for (let v = 0; v <= vCount; v++) {
          const bottomX = (v / vCount) * w;
          ctx.strokeStyle = 'rgba(255, 208, 0, 0.12)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(vanishX, vanishY);
          ctx.lineTo(bottomX, h);
          ctx.stroke();
        }

        // Scanning cyber laser line
        const scanY = (this.ambientTimer * 90) % h;
        ctx.strokeStyle = 'rgba(255, 225, 50, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, scanY);
        ctx.lineTo(w, scanY);
        ctx.stroke();
        ctx.restore();
        break;
      }

      case 'cryo_snow': {
        // Floating hexagonal ice crystals and falling snow
        for (const s of this.ambientSnow) {
          ctx.save();
          ctx.translate(s.x, s.y);
          ctx.rotate(s.angle);
          ctx.fillStyle = '#6be5ff';
          ctx.strokeStyle = '#e0f2fe';
          ctx.globalAlpha = s.alpha;
          ctx.lineWidth = 1;

          // Hexagonal 6-arm crystal
          for (let arm = 0; arm < 3; arm++) {
            ctx.beginPath();
            ctx.moveTo(-s.size, 0);
            ctx.lineTo(s.size, 0);
            ctx.stroke();
            ctx.rotate(Math.PI / 3);
          }
          ctx.beginPath();
          ctx.arc(0, 0, s.size * 0.35, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
        break;
      }

      case 'ion_lightning': {
        // Flash backlight glow when lightning strikes
        for (const l of this.ambientLightning) {
          if (l.alpha > 0) {
            ctx.save();
            ctx.strokeStyle = l.color;
            ctx.lineWidth = 2.0;
            ctx.shadowBlur = 14;
            ctx.shadowColor = l.color;
            ctx.globalAlpha = l.alpha * 0.85;

            ctx.beginPath();
            for (const seg of l.segments) {
              ctx.moveTo(seg.x1, seg.y1);
              ctx.lineTo(seg.x2, seg.y2);
            }
            ctx.stroke();

            // Ambient background flash
            ctx.fillStyle = l.color;
            ctx.globalAlpha = l.alpha * 0.08;
            ctx.fillRect(0, 0, w, h);

            ctx.restore();
          }
        }
        break;
      }

      case 'void_vortex': {
        // Deep-Space Soft-Blurred Realistic Black Hole with Ultra-Smooth Outer Transition & Depth of Field
        const bhX = w * 0.5;
        const bhY = h * 0.30;
        const bhRadius = 52; // Event Horizon Radius
        const diskMaxX = Math.max(w * 0.65, bhRadius * 5.2);
        const diskMaxY = diskMaxX * 0.30;

        // 1. Subtle Outer Cosmic Gravitational Haze (Soft violet/cyan depth at screen periphery)
        const cornerHaze = ctx.createRadialGradient(bhX, bhY, bhRadius * 2.0, bhX, bhY, w * 0.90);
        cornerHaze.addColorStop(0, 'rgba(0, 0, 0, 0)');
        cornerHaze.addColorStop(0.5, 'rgba(49, 46, 129, 0.04)');
        cornerHaze.addColorStop(0.85, 'rgba(15, 23, 42, 0.08)');
        cornerHaze.addColorStop(1, 'rgba(2, 6, 23, 0.18)');
        ctx.fillStyle = cornerHaze;
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.translate(bhX, bhY);
        ctx.rotate(-0.06);

        // 2. Soft Outer Ambient Radiance Halo (Ultra-soft illumination bleeding infinitely into dark void)
        const outerBloom = ctx.createRadialGradient(0, 0, bhRadius * 1.1, 0, 0, diskMaxX * 1.45);
        outerBloom.addColorStop(0, 'rgba(254, 240, 138, 0.14)');
        outerBloom.addColorStop(0.20, 'rgba(245, 158, 11, 0.08)');
        outerBloom.addColorStop(0.48, 'rgba(225, 29, 72, 0.03)');
        outerBloom.addColorStop(0.78, 'rgba(99, 102, 241, 0.008)');
        outerBloom.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = outerBloom;
        ctx.beginPath();
        ctx.ellipse(0, 0, diskMaxX * 1.45, diskMaxY * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3. Multi-Stop Feathered Accretion Disk Base (Silky Smooth Exponential Dissolution into Void)
        const diskGrad = ctx.createRadialGradient(0, 0, bhRadius * 1.02, 0, 0, diskMaxX);
        diskGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)'); // Hot white photon inner boundary
        diskGrad.addColorStop(0.05, 'rgba(254, 240, 138, 0.68)'); // Luminous gold-yellow
        diskGrad.addColorStop(0.14, 'rgba(251, 191, 36, 0.42)'); // Warm amber
        diskGrad.addColorStop(0.28, 'rgba(249, 115, 22, 0.20)'); // Solar orange
        diskGrad.addColorStop(0.48, 'rgba(225, 29, 72, 0.07)'); // Interstellar crimson transition
        diskGrad.addColorStop(0.70, 'rgba(99, 102, 241, 0.018)'); // Cosmic indigo twilight
        diskGrad.addColorStop(0.88, 'rgba(30, 27, 75, 0.005)'); // Deep twilight veil
        diskGrad.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Seamless dissolution into space

        ctx.fillStyle = diskGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, diskMaxX, diskMaxY, 0, 0, Math.PI * 2);
        ctx.fill();

        // 4. Rotating Soft-Blurred Accretion Filaments (Back Half: angles PI to 2*PI)
        ctx.lineCap = 'round';
        for (const f of this.ambientBlackHoleFilaments) {
          if (f.angle > Math.PI && f.angle < Math.PI * 2) {
            ctx.save();
            ctx.strokeStyle = f.color;
            ctx.lineWidth = f.width;
            ctx.shadowBlur = 14;
            ctx.shadowColor = f.color;
            ctx.globalAlpha = f.alpha * 0.70;

            ctx.beginPath();
            ctx.ellipse(0, 0, f.radiusX, f.radiusY, 0, f.angle, f.angle + f.length);
            ctx.stroke();
            ctx.restore();
          }
        }

        ctx.restore(); // Restore disk rotation tilt

        // 5. The Event Horizon & Soft Luminous Pure White Photon Ring
        ctx.save();
        ctx.translate(bhX, bhY);

        // Soft, diffused pure white glowing photon ring
        ctx.save();
        ctx.shadowBlur = 16;
        ctx.shadowColor = '#ffffff';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(0, 0, bhRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Pure pitch-black core (True Singularity)
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(0, 0, bhRadius - 0.5, 0, Math.PI * 2);
        ctx.fill();

        // 6. Rotating Soft-Blurred Accretion Filaments (Front Half: angles 0 to PI)
        ctx.save();
        ctx.rotate(-0.06);
        ctx.lineCap = 'round';

        for (const f of this.ambientBlackHoleFilaments) {
          if (f.angle >= 0 && f.angle <= Math.PI) {
            ctx.save();
            ctx.strokeStyle = f.color;
            ctx.lineWidth = f.width;
            ctx.shadowBlur = 18;
            ctx.shadowColor = f.color;
            ctx.globalAlpha = f.alpha;

            ctx.beginPath();
            ctx.ellipse(0, 0, f.radiusX, f.radiusY, 0, f.angle, f.angle + f.length);
            ctx.stroke();
            ctx.restore();
          }
        }

        ctx.restore(); // Restore disk rotation tilt
        ctx.restore(); // Restore translation
        break;
      }

      case 'quantum_pulse': {
        // Supercharged Quantum Reactor Core
        const coreX = w * 0.5;
        const coreY = h * 0.25;
        const pulse = Math.sin(this.ambientReactorPulse);
        const radius = 32 + pulse * 4;

        ctx.save();
        ctx.translate(coreX, coreY);

        // Expanding concentric containment shockwaves
        for (let ring = 1; ring <= 3; ring++) {
          const rSize = radius * (1 + ring * 0.6) + ((this.ambientTimer * 30 * ring) % 65);
          const rAlpha = Math.max(0, 0.35 - (rSize / (radius * 3.5)) * 0.35);
          ctx.strokeStyle = `rgba(255, 136, 0, ${rAlpha})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, rSize, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Reactor Aura
        const rGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, radius * 2.2);
        rGrad.addColorStop(0, '#ffffff');
        rGrad.addColorStop(0.3, '#ffaa44');
        rGrad.addColorStop(0.7, 'rgba(255, 100, 0, 0.2)');
        rGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = rGrad;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Core Center
        ctx.fillStyle = '#ffeedd';
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.65, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        break;
      }

      case 'warp_tunnel': {
        // Hyper-Speed Matrix Warp Speed Streaks
        ctx.save();
        for (const st of this.ambientWarpStars) {
          ctx.strokeStyle = '#00ff88';
          ctx.lineWidth = st.width;
          ctx.globalAlpha = st.alpha;
          ctx.beginPath();
          ctx.moveTo(st.x, st.y);
          ctx.lineTo(st.x, st.y + st.length);
          ctx.stroke();
        }

        // Warp center glow
        const wGrad = ctx.createRadialGradient(w * 0.5, h * 0.3, 10, w * 0.5, h * 0.3, w * 0.6);
        wGrad.addColorStop(0, 'rgba(0, 255, 136, 0.18)');
        wGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = wGrad;
        ctx.fillRect(0, 0, w, h);

        ctx.restore();
        break;
      }
    }
  }

  private renderDefenseBarrier(ctx: CanvasRenderingContext2D) {
    const y = this.shieldBarrierY;
    const hpRatio = this.shieldHp / this.maxShieldHp;
    const barrierColor = this.shieldHitFlash > 0 ? '#ff0055' : (hpRatio < 0.3 ? '#ffaa00' : '#00f3ff');

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

    // ==========================================
    // REAKTİF KİNETİK KALKAN (KINETIC DEFLECTOR FIELDS)
    // ==========================================
    const laneWidth = this.getLaneWidth();
    for (let i = 0; i < NUM_LANES; i++) {
      const turret = this.turrets[i];
      if (turret.deflectorCharges && turret.deflectorCharges > 0) {
        const lx = i * laneWidth;
        const charges = turret.deflectorCharges;

        // Radiant Emerald Deflection Field above barrier
        const fieldGrad = ctx.createLinearGradient(0, y - 28, 0, y);
        fieldGrad.addColorStop(0, 'rgba(20, 184, 166, 0)');
        fieldGrad.addColorStop(0.5, 'rgba(45, 212, 191, 0.45)');
        fieldGrad.addColorStop(1, 'rgba(20, 184, 166, 0.9)');

        ctx.fillStyle = fieldGrad;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(lx, y - 24, laneWidth, 24);

        // Hexagonal / Angled Reflective Barrier Crest
        ctx.strokeStyle = '#2dd4bf';
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.95;
        ctx.beginPath();
        ctx.moveTo(lx + 2, y);
        ctx.lineTo(lx + laneWidth * 0.25, y - 16);
        ctx.lineTo(lx + laneWidth * 0.75, y - 16);
        ctx.lineTo(lx + laneWidth - 2, y);
        ctx.stroke();

        // Pulsating Center Counter-Spark / Chevron
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(lx + laneWidth * 0.5, y - 16, 3, 0, Math.PI * 2);
        ctx.fill();

        // Stacked Charge Count Indicator (e.g. 🛡️x2)
        ctx.save();
        ctx.font = 'bold 11px Rajdhani, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#14b8a6';
        ctx.shadowBlur = 8;
        ctx.fillText(`🛡️x${charges}`, lx + laneWidth * 0.5, y - 24);
        ctx.restore();
        ctx.globalAlpha = 1;
      }
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
      // SABİT TARET YUVASI (SOCKET POD & MOUNT)
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

      // Engine Thruster Flame (dynamically scales with enemy speed)
      const speedScale = Math.min(1.8, Math.max(0.7, enemy.speed / 16));
      const flameHeight = (Math.sin(enemy.enginePulse) * 4 + 7) * speedScale;
      const flameColor1 = isFrozen ? '#00d2ff' : (enemy.speed > 25 ? '#ff3300' : '#ff5500');
      const flameColor2 = isFrozen ? '#80eeff' : (enemy.speed > 25 ? '#ffea00' : '#ffaa00');
      const eW = enemy.width;
      const eH = enemy.height;

      // Left exhaust
      ctx.fillStyle = flameColor1;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(-eW * 0.18, -eH * 0.38);
      ctx.lineTo(-eW * 0.06, -eH * 0.38 - flameHeight * 0.8);
      ctx.lineTo(eW * 0.02, -eH * 0.38);
      ctx.fill();
      // Right exhaust
      ctx.beginPath();
      ctx.moveTo(eW * 0.18, -eH * 0.38);
      ctx.lineTo(eW * 0.06, -eH * 0.38 - flameHeight * 0.8);
      ctx.lineTo(-eW * 0.02, -eH * 0.38);
      ctx.fill();
      // Core exhaust (bright center)
      ctx.fillStyle = flameColor2;
      ctx.beginPath();
      ctx.moveTo(-eW * 0.08, -eH * 0.4);
      ctx.lineTo(0, -eH * 0.4 - flameHeight * 1.15);
      ctx.lineTo(eW * 0.08, -eH * 0.4);
      ctx.fill();
      ctx.globalAlpha = 1;

      // High Threat Danger Aura (Overcharged / High Damage Telegraphing)
      if (enemy.attackPower >= 100 && !enemy.isBoss && !isFrozen) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.4;
        ctx.globalAlpha = 0.3 + Math.sin(enemy.enginePulse * 1.8) * 0.25;
        ctx.beginPath();
        ctx.arc(0, 0, eW * 0.62, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Speed trails / velocity streaks for fast-moving ships (speed >= 28)
      if (enemy.speed >= 28 && !isFrozen && enemy.y > 0) {
        ctx.strokeStyle = enemy.color;
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = Math.min(0.45, (enemy.speed - 20) * 0.012);
        ctx.beginPath();
        ctx.moveTo(-eW * 0.22, -eH * 0.5);
        ctx.lineTo(-eW * 0.22, -eH * 0.5 - (enemy.speed * 0.4));
        ctx.moveTo(eW * 0.22, -eH * 0.5);
        ctx.lineTo(eW * 0.22, -eH * 0.5 - (enemy.speed * 0.4));
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Enemy Ship Body
      const baseHull = isWhiteFlash ? '#ffffff' : (isFrozen ? '#0072aa' : '#11192e');
      const accentColor = isWhiteFlash ? '#ffffff' : (isFrozen ? '#6be5ff' : enemy.color);
      const panelDark = isWhiteFlash ? '#dddddd' : (isFrozen ? '#005577' : '#0a0f1e');
      const panelMid = isWhiteFlash ? '#eeeeee' : (isFrozen ? '#006688' : '#151d33');

      ctx.lineWidth = 2;

      // Draw Sci-Fi Hull Shape
      if (enemy.isBoss) {
        // ═══════════════════════════════════════
        // TITAN DREADNOUGHT — Massive capital ship
        // ═══════════════════════════════════════

        // Main hull body
        ctx.fillStyle = baseHull;
        ctx.strokeStyle = accentColor;
        ctx.beginPath();
        ctx.moveTo(0, eH * 0.6);
        ctx.lineTo(eW * 0.25, eH * 0.45);
        ctx.lineTo(eW * 0.45, eH * 0.1);
        ctx.lineTo(eW * 0.5, -eH * 0.25);
        ctx.lineTo(eW * 0.4, -eH * 0.5);
        ctx.lineTo(eW * 0.15, -eH * 0.6);
        ctx.lineTo(-eW * 0.15, -eH * 0.6);
        ctx.lineTo(-eW * 0.4, -eH * 0.5);
        ctx.lineTo(-eW * 0.5, -eH * 0.25);
        ctx.lineTo(-eW * 0.45, eH * 0.1);
        ctx.lineTo(-eW * 0.25, eH * 0.45);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Layered armor plating (dorsal ridge)
        ctx.fillStyle = panelMid;
        ctx.beginPath();
        ctx.moveTo(0, eH * 0.55);
        ctx.lineTo(eW * 0.18, eH * 0.35);
        ctx.lineTo(eW * 0.3, -eH * 0.1);
        ctx.lineTo(eW * 0.2, -eH * 0.45);
        ctx.lineTo(-eW * 0.2, -eH * 0.45);
        ctx.lineTo(-eW * 0.3, -eH * 0.1);
        ctx.lineTo(-eW * 0.18, eH * 0.35);
        ctx.closePath();
        ctx.fill();

        // Side weapon nacelles
        ctx.fillStyle = panelDark;
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1.5;
        // Left nacelle
        ctx.beginPath();
        ctx.moveTo(-eW * 0.48, -eH * 0.15);
        ctx.lineTo(-eW * 0.55, -eH * 0.1);
        ctx.lineTo(-eW * 0.55, eH * 0.15);
        ctx.lineTo(-eW * 0.43, eH * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Right nacelle
        ctx.beginPath();
        ctx.moveTo(eW * 0.48, -eH * 0.15);
        ctx.lineTo(eW * 0.55, -eH * 0.1);
        ctx.lineTo(eW * 0.55, eH * 0.15);
        ctx.lineTo(eW * 0.43, eH * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Central command bridge (raised)
        ctx.fillStyle = panelDark;
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-eW * 0.1, -eH * 0.15);
        ctx.lineTo(eW * 0.1, -eH * 0.15);
        ctx.lineTo(eW * 0.08, eH * 0.05);
        ctx.lineTo(-eW * 0.08, eH * 0.05);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Prow spine
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, eH * 0.6);
        ctx.lineTo(0, -eH * 0.45);
        ctx.stroke();

        // Panel lines
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 0.8;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(-eW * 0.35, eH * 0.05);
        ctx.lineTo(eW * 0.35, eH * 0.05);
        ctx.moveTo(-eW * 0.3, -eH * 0.2);
        ctx.lineTo(eW * 0.3, -eH * 0.2);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Boss Red Core Eye (triple layered)
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff0055';
        ctx.fillStyle = '#ff0055';
        ctx.beginPath();
        ctx.arc(0, -eH * 0.05, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff5588';
        ctx.beginPath();
        ctx.arc(0, -eH * 0.05, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -eH * 0.05, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Nacelle weapon glow tips
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = 0.7 + Math.sin(enemy.enginePulse * 1.5) * 0.3;
        ctx.beginPath();
        ctx.arc(-eW * 0.52, eH * 0.18, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eW * 0.52, eH * 0.18, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

      } else if (enemy.type === 'scout') {
        // ═══════════════════════════════════════
        // SCOUT INTERCEPTOR — Agile delta-wing fighter
        // ═══════════════════════════════════════

        // Main delta-wing hull
        ctx.fillStyle = baseHull;
        ctx.strokeStyle = accentColor;
        ctx.beginPath();
        ctx.moveTo(0, eH * 0.55);
        ctx.lineTo(eW * 0.15, eH * 0.2);
        ctx.lineTo(eW * 0.48, -eH * 0.35);
        ctx.lineTo(eW * 0.42, -eH * 0.5);
        ctx.lineTo(eW * 0.08, -eH * 0.15);
        ctx.lineTo(0, -eH * 0.25);
        ctx.lineTo(-eW * 0.08, -eH * 0.15);
        ctx.lineTo(-eW * 0.42, -eH * 0.5);
        ctx.lineTo(-eW * 0.48, -eH * 0.35);
        ctx.lineTo(-eW * 0.15, eH * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner wing plating
        ctx.fillStyle = panelMid;
        ctx.beginPath();
        ctx.moveTo(0, eH * 0.45);
        ctx.lineTo(eW * 0.12, eH * 0.15);
        ctx.lineTo(eW * 0.32, -eH * 0.3);
        ctx.lineTo(eW * 0.08, -eH * 0.1);
        ctx.lineTo(0, -eH * 0.18);
        ctx.lineTo(-eW * 0.08, -eH * 0.1);
        ctx.lineTo(-eW * 0.32, -eH * 0.3);
        ctx.lineTo(-eW * 0.12, eH * 0.15);
        ctx.closePath();
        ctx.fill();

        // Central fuselage spine
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, eH * 0.5);
        ctx.lineTo(0, -eH * 0.2);
        ctx.stroke();

        // Cockpit canopy
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.ellipse(0, eH * 0.18, 3.5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Wingtip lights (pulsing)
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = 0.6 + Math.sin(enemy.enginePulse * 2) * 0.4;
        ctx.beginPath();
        ctx.arc(-eW * 0.44, -eH * 0.42, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eW * 0.44, -eH * 0.42, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

      } else if (enemy.type === 'siege') {
        // ═══════════════════════════════════════
        // SIEGE ARTILLERY — Heavy armored gunship
        // ═══════════════════════════════════════

        // Main armored hull (wide, flat, heavy)
        ctx.fillStyle = baseHull;
        ctx.strokeStyle = accentColor;
        ctx.beginPath();
        ctx.moveTo(0, eH * 0.48);
        ctx.lineTo(eW * 0.2, eH * 0.45);
        ctx.lineTo(eW * 0.48, eH * 0.15);
        ctx.lineTo(eW * 0.5, -eH * 0.2);
        ctx.lineTo(eW * 0.42, -eH * 0.45);
        ctx.lineTo(eW * 0.15, -eH * 0.55);
        ctx.lineTo(-eW * 0.15, -eH * 0.55);
        ctx.lineTo(-eW * 0.42, -eH * 0.45);
        ctx.lineTo(-eW * 0.5, -eH * 0.2);
        ctx.lineTo(-eW * 0.48, eH * 0.15);
        ctx.lineTo(-eW * 0.2, eH * 0.45);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Heavy armor plating overlay
        ctx.fillStyle = panelMid;
        ctx.beginPath();
        ctx.moveTo(-eW * 0.35, -eH * 0.42);
        ctx.lineTo(eW * 0.35, -eH * 0.42);
        ctx.lineTo(eW * 0.4, -eH * 0.15);
        ctx.lineTo(eW * 0.35, eH * 0.1);
        ctx.lineTo(-eW * 0.35, eH * 0.1);
        ctx.lineTo(-eW * 0.4, -eH * 0.15);
        ctx.closePath();
        ctx.fill();

        // Panel lines on armor
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 0.7;
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.moveTo(-eW * 0.38, -eH * 0.15);
        ctx.lineTo(eW * 0.38, -eH * 0.15);
        ctx.moveTo(-eW * 0.34, eH * 0.08);
        ctx.lineTo(eW * 0.34, eH * 0.08);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Forward Dual Heavy Cannons (detailed barrel + housing)
        ctx.lineWidth = 1.5;
        // Left cannon housing
        ctx.fillStyle = panelDark;
        ctx.strokeStyle = accentColor;
        ctx.beginPath();
        ctx.rect(-eW * 0.32, eH * 0.05, 6, 16);
        ctx.fill();
        ctx.stroke();
        // Left barrel
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-eW * 0.31, eH * 0.16, 4, 10);
        // Left muzzle glow
        ctx.fillStyle = '#f97316';
        ctx.globalAlpha = 0.5 + Math.sin(enemy.enginePulse * 1.2) * 0.3;
        ctx.beginPath();
        ctx.arc(-eW * 0.29, eH * 0.28, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Right cannon housing
        ctx.fillStyle = panelDark;
        ctx.strokeStyle = accentColor;
        ctx.beginPath();
        ctx.rect(eW * 0.32 - 6, eH * 0.05, 6, 16);
        ctx.fill();
        ctx.stroke();
        // Right barrel
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(eW * 0.31 - 4, eH * 0.16, 4, 10);
        // Right muzzle glow
        ctx.fillStyle = '#f97316';
        ctx.globalAlpha = 0.5 + Math.sin(enemy.enginePulse * 1.2) * 0.3;
        ctx.beginPath();
        ctx.arc(eW * 0.29, eH * 0.28, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Center Siege Reactor Core (glowing)
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#f97316';
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(0, -eH * 0.05, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffedd5';
        ctx.beginPath();
        ctx.arc(0, -eH * 0.05, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Charging Plasma Flare before firing (last 1.2s of 5.0s cycle)
        if (enemy.shootTimer && enemy.shootTimer >= 3.8) {
          const chargeRatio = (enemy.shootTimer - 3.8) / 1.2;
          ctx.shadowBlur = 12 * chargeRatio;
          ctx.shadowColor = '#f97316';
          ctx.fillStyle = '#ffedd5';
          ctx.beginPath();
          ctx.arc(0, eH * 0.48, 2.5 + chargeRatio * 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

      } else if (enemy.type === 'bomber') {
        // ═══════════════════════════════════════
        // HEAVY BOMBER — Wide armored payload carrier
        // ═══════════════════════════════════════

        // Main hexagonal hull (widened)
        ctx.fillStyle = baseHull;
        ctx.strokeStyle = accentColor;
        ctx.beginPath();
        ctx.moveTo(0, eH * 0.52);
        ctx.lineTo(eW * 0.48, eH * 0.2);
        ctx.lineTo(eW * 0.48, -eH * 0.25);
        ctx.lineTo(eW * 0.2, -eH * 0.5);
        ctx.lineTo(-eW * 0.2, -eH * 0.5);
        ctx.lineTo(-eW * 0.48, -eH * 0.25);
        ctx.lineTo(-eW * 0.48, eH * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Internal bomb bay armor plates
        ctx.fillStyle = panelMid;
        ctx.beginPath();
        ctx.moveTo(-eW * 0.15, eH * 0.4);
        ctx.lineTo(eW * 0.15, eH * 0.4);
        ctx.lineTo(eW * 0.3, -eH * 0.1);
        ctx.lineTo(eW * 0.15, -eH * 0.38);
        ctx.lineTo(-eW * 0.15, -eH * 0.38);
        ctx.lineTo(-eW * 0.3, -eH * 0.1);
        ctx.closePath();
        ctx.fill();

        // Side engine pods
        ctx.fillStyle = panelDark;
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1;
        // Left pod
        ctx.beginPath();
        ctx.rect(-eW * 0.52, -eH * 0.15, 6, 18);
        ctx.fill();
        ctx.stroke();
        // Right pod
        ctx.beginPath();
        ctx.rect(eW * 0.52 - 6, -eH * 0.15, 6, 18);
        ctx.fill();
        ctx.stroke();

        // Panel lines (horizontal)
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 0.6;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(-eW * 0.4, 0);
        ctx.lineTo(eW * 0.4, 0);
        ctx.moveTo(-eW * 0.35, -eH * 0.25);
        ctx.lineTo(eW * 0.35, -eH * 0.25);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Belly payload indicator
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = 0.55 + Math.sin(enemy.enginePulse * 0.8) * 0.3;
        ctx.beginPath();
        ctx.arc(0, eH * 0.15, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, eH * 0.15, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

      } else if (enemy.type === 'speeder') {
        // ═══════════════════════════════════════
        // SPEEDER — Narrow fast attack craft
        // ═══════════════════════════════════════

        // Streamlined narrow hull
        ctx.fillStyle = baseHull;
        ctx.strokeStyle = accentColor;
        ctx.beginPath();
        ctx.moveTo(0, eH * 0.55);
        ctx.lineTo(eW * 0.15, eH * 0.3);
        ctx.lineTo(eW * 0.35, -eH * 0.1);
        ctx.lineTo(eW * 0.3, -eH * 0.45);
        ctx.lineTo(eW * 0.1, -eH * 0.55);
        ctx.lineTo(-eW * 0.1, -eH * 0.55);
        ctx.lineTo(-eW * 0.3, -eH * 0.45);
        ctx.lineTo(-eW * 0.35, -eH * 0.1);
        ctx.lineTo(-eW * 0.15, eH * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Speed stripes (side panels)
        ctx.fillStyle = panelMid;
        ctx.beginPath();
        ctx.moveTo(eW * 0.12, eH * 0.25);
        ctx.lineTo(eW * 0.3, -eH * 0.12);
        ctx.lineTo(eW * 0.25, -eH * 0.38);
        ctx.lineTo(eW * 0.08, -eH * 0.08);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-eW * 0.12, eH * 0.25);
        ctx.lineTo(-eW * 0.3, -eH * 0.12);
        ctx.lineTo(-eW * 0.25, -eH * 0.38);
        ctx.lineTo(-eW * 0.08, -eH * 0.08);
        ctx.closePath();
        ctx.fill();

        // Central spine
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, eH * 0.5);
        ctx.lineTo(0, -eH * 0.45);
        ctx.stroke();

        // Cockpit
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = 0.65;
        ctx.beginPath();
        ctx.ellipse(0, eH * 0.15, 3, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Rear speed boost vents (pulsing)
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = 0.5 + Math.sin(enemy.enginePulse * 3) * 0.4;
        ctx.fillRect(-eW * 0.12, -eH * 0.5, 3, 5);
        ctx.fillRect(eW * 0.12 - 3, -eH * 0.5, 3, 5);
        ctx.globalAlpha = 1;

      } else if (enemy.type === 'shielded') {
        // ═══════════════════════════════════════
        // SHIELDED CRUISER — Armored with visible plating
        // ═══════════════════════════════════════

        // Main hull (bulky, angular)
        ctx.fillStyle = baseHull;
        ctx.strokeStyle = accentColor;
        ctx.beginPath();
        ctx.moveTo(0, eH * 0.52);
        ctx.lineTo(eW * 0.2, eH * 0.42);
        ctx.lineTo(eW * 0.42, eH * 0.05);
        ctx.lineTo(eW * 0.4, -eH * 0.3);
        ctx.lineTo(eW * 0.25, -eH * 0.52);
        ctx.lineTo(-eW * 0.25, -eH * 0.52);
        ctx.lineTo(-eW * 0.4, -eH * 0.3);
        ctx.lineTo(-eW * 0.42, eH * 0.05);
        ctx.lineTo(-eW * 0.2, eH * 0.42);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Triple armor layer panels
        ctx.fillStyle = panelMid;
        // Top plate
        ctx.beginPath();
        ctx.moveTo(-eW * 0.2, -eH * 0.48);
        ctx.lineTo(eW * 0.2, -eH * 0.48);
        ctx.lineTo(eW * 0.32, -eH * 0.28);
        ctx.lineTo(-eW * 0.32, -eH * 0.28);
        ctx.closePath();
        ctx.fill();
        // Middle plate
        ctx.fillStyle = panelDark;
        ctx.beginPath();
        ctx.moveTo(-eW * 0.36, -eH * 0.08);
        ctx.lineTo(eW * 0.36, -eH * 0.08);
        ctx.lineTo(eW * 0.34, eH * 0.12);
        ctx.lineTo(-eW * 0.34, eH * 0.12);
        ctx.closePath();
        ctx.fill();

        // Shield generator node (top center)
        ctx.fillStyle = '#c084fc';
        ctx.globalAlpha = 0.6 + Math.sin(enemy.enginePulse * 1.8) * 0.35;
        ctx.beginPath();
        ctx.arc(0, -eH * 0.35, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -eH * 0.35, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Hull panel lines
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 0.6;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(-eW * 0.1, eH * 0.45);
        ctx.lineTo(-eW * 0.1, -eH * 0.45);
        ctx.moveTo(eW * 0.1, eH * 0.45);
        ctx.lineTo(eW * 0.1, -eH * 0.45);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Cockpit visor
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.ellipse(0, eH * 0.2, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

      } else {
        // ═══════════════════════════════════════
        // STANDARD DRONE — Basic attack craft
        // ═══════════════════════════════════════

        // Main hull (sleek wedge)
        ctx.fillStyle = baseHull;
        ctx.strokeStyle = accentColor;
        ctx.beginPath();
        ctx.moveTo(0, eH * 0.52);
        ctx.lineTo(eW * 0.18, eH * 0.3);
        ctx.lineTo(eW * 0.4, -eH * 0.15);
        ctx.lineTo(eW * 0.32, -eH * 0.48);
        ctx.lineTo(eW * 0.08, -eH * 0.52);
        ctx.lineTo(-eW * 0.08, -eH * 0.52);
        ctx.lineTo(-eW * 0.32, -eH * 0.48);
        ctx.lineTo(-eW * 0.4, -eH * 0.15);
        ctx.lineTo(-eW * 0.18, eH * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner dorsal plate
        ctx.fillStyle = panelMid;
        ctx.beginPath();
        ctx.moveTo(0, eH * 0.42);
        ctx.lineTo(eW * 0.12, eH * 0.22);
        ctx.lineTo(eW * 0.24, -eH * 0.2);
        ctx.lineTo(eW * 0.15, -eH * 0.42);
        ctx.lineTo(-eW * 0.15, -eH * 0.42);
        ctx.lineTo(-eW * 0.24, -eH * 0.2);
        ctx.lineTo(-eW * 0.12, eH * 0.22);
        ctx.closePath();
        ctx.fill();

        // Spine line
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, eH * 0.45);
        ctx.lineTo(0, -eH * 0.4);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Cockpit
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.ellipse(0, eH * 0.12, 3, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Lateral sensor nodes
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = 0.4 + Math.sin(enemy.enginePulse * 1.5) * 0.3;
        ctx.beginPath();
        ctx.arc(-eW * 0.3, -eH * 0.2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eW * 0.3, -eH * 0.2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
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
      } else if (p.type === 'enemy_bullet') {
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.atan2(p.vy, p.vx));

        // Outer fiery orange/red aura
        const aura = ctx.createRadialGradient(0, 0, 1, 0, 0, 12);
        aura.addColorStop(0, '#ffffff');
        aura.addColorStop(0.35, '#f97316');
        aura.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        // Core plasma bolt
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-6, -2, 12, 4);
        ctx.fillStyle = '#f97316';
        ctx.fillRect(-9, -3, 18, 6);
      } else if (p.type === 'reflected_bullet') {
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.atan2(p.vy, p.vx));

        // Supersonic Emerald Kinetic Spear
        const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, 15);
        aura.addColorStop(0, '#ffffff');
        aura.addColorStop(0.45, '#2dd4bf');
        aura.addColorStop(1, 'rgba(20, 184, 166, 0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-10, -2, 20, 4);
        ctx.fillStyle = '#14b8a6';
        ctx.fillRect(-14, -3, 28, 6);
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
    this.coreUpgradeLevels = {
      plasma: 0,
      cryo: 0,
      electric: 0,
      void: 0,
      explosive: 0,
      nano: 0,
      solaris: 0,
      antimatter: 0,
      chronos: 0,
      toxic: 0,
      gravity: 0,
      vampiric: 0,
      prism: 0,
      anchor: 0,
      echo: 0,
      wormhole: 0,
      parasite: 0,
      static_web: 0,
      orbital_drone: 0,
      supernova: 0,
      deflector: 0
    };
    this.initTurrets();
    this.initSectorAmbient(level);
  }
}
