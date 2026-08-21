export type GemType =
  | 'plasma'
  | 'cryo'
  | 'electric'
  | 'void'
  | 'explosive'
  | 'nano'
  | 'solaris'
  | 'antimatter'
  | 'chronos'
  | 'toxic'
  | 'gravity'
  | 'vampiric'
  | 'prism'
  | 'anchor'
  | 'echo'
  | 'wormhole'
  | 'parasite'
  | 'static_web'
  | 'orbital_drone'
  | 'supernova'
  | 'deflector';

export type SpecialGemType = 'none' | 'column_laser' | 'row_laser' | 'bomb_cross' | 'hyper_cube';

export interface Gem {
  id: string;
  type: GemType;
  special: SpecialGemType;
  row: number;
  col: number;
  startRow?: number;
  startCol?: number;
  // Animation props for smooth rendering/transitions
  displayRow: number;
  displayCol: number;
  isMatched?: boolean;
  isNew?: boolean;
  isSwapping?: boolean;
  scale?: number;
  alpha?: number;
  glow?: boolean;
  sparkleTimer?: number;
}

export interface MatchGroup {
  gems: Gem[];
  type: GemType;
  isSpecialCreation?: boolean;
  specialType?: SpecialGemType;
  specialPosition?: { row: number; col: number };
  matchedColumns: number[];
  count: number;
}

export interface MatchResult {
  matchGroups: MatchGroup[];
  totalGemsMatched: number;
  columnHits: Record<number, { count: number; type: GemType; specialCount: number }>;
  combo: number;
  scoreGained: number;
  energyGained: number;
}

export type EnemyType = 'scout' | 'drone' | 'shielded' | 'speeder' | 'bomber' | 'siege' | 'titan_boss';

export interface Enemy {
  id: string;
  type: EnemyType;
  lane: number; // 0 to 7 (or primary lane for multi-lane boss)
  lanesCovered?: number[]; // [2, 3, 4] for Titan Boss
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  speed: number;
  baseSpeed: number;
  color: string;
  glowColor: string;
  scoreValue: number;
  attackPower: number;
  
  // Status effects
  frozenTimer: number; // Cryo freeze duration in sec
  shockTimer: number; // Electric stun
  burnTimer: number; // Plasma burn damage-over-time
  shieldHp?: number; // Armored / Shielded enemy extra shield
  maxShieldHp?: number;

  // New Core Status Effects
  isAnchored?: boolean; // Graviton anchor locked position
  anchorTimer?: number;
  naniteInfected?: boolean; // Nanite Swarm parasite infection
  naniteTimer?: number;
  naniteTickTimer?: number;

  // Siege / Artillery enemy props
  shootTimer?: number;
  targetY?: number;
  isSiegeMode?: boolean;

  // Boss specific
  isBoss?: boolean;
  name?: string;
  bossPhase?: number;
  attackTimer?: number;
  specialActionTimer?: number;

  // Visual animation timers
  hitFlashTimer: number;
  enginePulse: number;
}

export type ProjectileType = 
  | 'laser_beam'
  | 'cryo_beam'
  | 'chain_lightning'
  | 'plasma_bolt'
  | 'cluster_rocket'
  | 'orbital_beam'
  | 'void_vortex'
  | 'emp_wave'
  | 'solaris_beam'
  | 'antimatter_pulse'
  | 'chronos_wave'
  | 'toxic_cloud'
  | 'gravity_shock'
  | 'vampiric_beam'
  | 'prism_beam'
  | 'anchor_shot'
  | 'echo_wave'
  | 'wormhole_pulse'
  | 'nanite_pod'
  | 'static_mine'
  | 'drone_bullet'
  | 'supernova_star'
  | 'enemy_bullet'
  | 'reflected_bullet';

export interface Projectile {
  id: string;
  type: ProjectileType;
  lane: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX?: number;
  targetY?: number;
  vx: number;
  vy: number;
  damage: number;
  color: string;
  width: number;
  height: number;
  radius: number;
  life: number;
  maxLife: number;
  pierce?: boolean;
  aoeRadius?: number;
  element: GemType;
  trailParticles?: boolean;
}

export interface Turret {
  lane: number; // 0 to 7
  level: number;
  recoil: number;
  recoilAngle: number;
  glowIntensity: number;
  socketGlow: number; // Pod/socket soft radial aura intensity [0..1]
  muzzleFlash: number; // Barrel tip firing burst flash [0..1]
  conduitPulse: number; // Upward energy conduit pulse intensity [0..1]
  deflectorCharges?: number; // Reactive Kinetic Deflector stackable bullet reflection count
  lastFiredElement: GemType | 'idle';
  chargeLevel: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  shape: 'circle' | 'spark' | 'ring' | 'glow_line' | 'star' | 'smoke' | 'lightning';
  rotation?: number;
  vRotation?: number;
  shrink?: boolean;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
  life: number;
  maxLife: number;
  isCrit?: boolean;
}

export interface ScreenShake {
  intensity: number;
  duration: number;
  timer: number;
}

export interface CoreUpgradeTier {
  level: 1 | 2 | 3;
  description: string;
  apply: (stats: GameStats, upgrades: PlayerUpgrades, battlefield?: any) => void;
}

export interface CoreUpgradeCard {
  coreType: GemType;
  title: string;
  icon: string;
  rarity: 'rare' | 'epic' | 'legendary';
  tiers: [CoreUpgradeTier, CoreUpgradeTier, CoreUpgradeTier];
}

export interface RolledUpgradeOption {
  id: string;
  coreType?: GemType;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  level: number;
  maxLevel: number;
  apply: () => void;
}

export interface UpgradeOption {
  id: string;
  coreType?: GemType;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category?: 'laser' | 'cryo' | 'electric' | 'shield' | 'energy' | 'special';
  level?: number;
  maxLevel?: number;
  apply: (stats: GameStats, upgrades: PlayerUpgrades, battlefield?: any) => void;
}

export interface PlayerUpgrades {
  // Base Stats
  baseMaxShield: number;
  turretFireRate: number;
  critChance: number;
  energyRechargeRate: number;

  // 1. Plasma
  plasmaDamageMult: number;
  plasmaPiercing?: boolean;
  plasmaCritOvercharge?: boolean;

  // 2. Cryo
  cryoDurationMult: number;
  cryoVulnerability?: boolean;
  cryoFrostNova?: boolean;

  // 3. Electric
  electricChainBonus: number;
  electricStunDuration?: number;
  electricStormLoop?: boolean;

  // 4. Void
  voidVortexDuration: number;
  voidVortexPullForce: number;
  voidVortexDamageMult: number;
  voidImplosionBomb?: boolean;

  // 5. Explosive
  explosiveAoeMult: number;
  explosive5Lanes?: boolean;
  explosiveClusterBomblets?: boolean;
  explosiveFirestorm?: boolean;

  // 6. Nano
  nanoShieldBoost: number;
  nanoOvershield?: boolean;
  nanoRepulsePulse?: boolean;

  // 7. Solaris
  solarisBurnDuration?: number;
  solarisDamageMult?: number;
  solarisSpread?: boolean;
  solarisSolarCorridor?: boolean;

  // 8. Antimatter
  antimatterDamageMult?: number;
  antimatterShieldStrip?: boolean;
  antimatterChainReaction?: boolean;

  // 9. Chronos
  chronosSlowPercent?: number;
  chronosTurretHaste?: boolean;
  chronosBulletFreeze?: boolean;

  // 10. Toxic
  toxicDamageMult?: number;
  toxicAttackDebuff?: number;
  toxicAcidPools?: boolean;

  // 11. Gravity
  gravityImpactDamage?: number;
  gravityTriLane?: boolean;
  gravityCeilingStun?: number;

  // 12. Vampiric
  vampiricSiphonRatio?: number;
  vampiricBonusEnergy?: number;
  vampiricOverdrive?: boolean;
  vampiricLifeNova?: boolean;

  // 13. Prism
  prismWallDuration?: number;
  prismSlowAndStrip?: boolean;
  prismReflectiveSpikes?: boolean;

  // 14. Anchor
  anchorDuration?: number;
  anchorCrushTension?: boolean;
  anchorDetonation?: boolean;

  // 15. Echo
  echoPowerMult?: number;
  echoNeighborLane?: boolean;
  echoSpawnHyperCube?: boolean;

  // 16. Wormhole
  wormholeExitDamage?: number;
  wormholeMultiTeleport?: number;
  wormholeGravityRepel?: boolean;

  // 17. Parasite
  parasiteSpreadCount?: number;
  parasiteArmorMelt?: boolean;
  parasiteLivingBombs?: boolean;

  // 18. Deflector
  deflectorDamageMult?: number;
  deflectorChargesPerMatch?: number;
  deflectorReflectBodies?: boolean;
  deflectorHealOnReflect?: boolean;

  // 19. Static Web
  staticWebMineCount?: number;
  staticWebStunDuration?: number;
  staticWebLaserFence?: boolean;

  // 20. Orbital Drone
  orbitalDroneDuration?: number;
  orbitalDroneFireRate?: number;
  orbitalDroneDual?: boolean;
  orbitalDroneMicroMissiles?: boolean;

  // 21. Supernova
  supernovaPullRadiusMult?: number;
  supernovaDamageMult?: number;
  supernovaRadiationZone?: boolean;
}

export interface GameStats {
  score: number;
  highScore: number;
  wave: number;
  maxWaves: number;
  enemiesKilled: number;
  combosMade: number;
  maxCombo: number;
  matchesMade: number;
  specialsTriggered: number;
  damageDealt: number;
}

export type GameState = 'menu' | 'map' | 'playing' | 'paused' | 'wave_cleared' | 'level_victory' | 'game_over' | 'victory';

export interface LevelConfig {
  id: number;
  name: string;
  subtitle: string;
  description: string;
  themeColor: string;
  gradient: [string, string];
  difficultyMult: number;
  miniBossName: string;
  miniBossTitle: string;
  mainBossName: string;
  mainBossTitle: string;
  starsRequired?: number;
  rewardFragments?: number;
}

export interface CoreConfig {
  type: GemType;
  name: string;
  turkishName: string;
  color: string;
  gradient: [string, string];
  glowColor: string;
  iconName: string;
  turretType: string;
  description: string;
  lore: string;
  isUnlockedByDefault: boolean;
  unlockCost: number; // In Core Fragments
}

export interface UIState {
  shieldHp: number;
  maxShieldHp: number;
  energy: number;
  maxEnergy: number;
  combo: number;
  comboTimer: number;
  score: number;
  wave: number;
  maxWaves: number;
  waveProgress: number; // 0 to 1
  isBossWave: boolean;
  isMiniBoss?: boolean;
  isMainBoss?: boolean;
  bossHp?: number;
  bossMaxHp?: number;
  bossName?: string;
  currentLevel: number;
  unlockedLevel: number;
  levelName: string;
  gameState: GameState;
  coreFragments: number; // Player's Core Fragment currency
  activeCores: GemType[]; // Currently active 6 Crush Cores
  unlockedCores: GemType[]; // All unlocked Crush Cores
  activeLanes: number[]; // Lanes currently firing or glowing
  threatenedLanes: number[]; // Lanes where enemies are currently approaching
  bossLanes: number[]; // Lanes covered by active boss
  abilitiesReady: {
    orbital: boolean;
    emp: boolean;
    shieldOvercharge: boolean;
  };
}

export interface GemElementConfig extends CoreConfig {}


