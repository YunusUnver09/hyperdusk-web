import type { GemElementConfig, GemType, UpgradeOption } from './types';

export const GRID_COLS = 8;
export const GRID_ROWS = 8;
export const NUM_LANES = 8;

export const GEM_ELEMENTS: Record<GemType, GemElementConfig> = {
  plasma: {
    type: 'plasma',
    name: 'Plasma Laser',
    turkishName: 'Plazma Lazer',
    color: '#ff2a5f',
    gradient: ['#ff527b', '#b30030'],
    glowColor: 'rgba(255, 42, 95, 0.8)',
    iconName: 'Flame',
    turretType: 'Lazer Bataryası',
    description: 'Sütundaki düşmanlara delici, yüksek hasarlı termal plazma ışını ateşler.',
    lore: 'Yüksek yoğunluklu süper ısıtılmış plazma çekirdeği.',
    isUnlockedByDefault: true,
    unlockCost: 0
  },
  cryo: {
    type: 'cryo',
    name: 'Cryo Freeze',
    turkishName: 'Kriyo Dondurucu',
    color: '#00d2ff',
    gradient: ['#6be5ff', '#0072aa'],
    glowColor: 'rgba(0, 210, 255, 0.8)',
    iconName: 'Snowflake',
    turretType: 'Buz Işını',
    description: 'Düşmanları %65 yavaşlatır ve derin dondurma uygular.',
    lore: 'Sıfır Kelvin derecesinde kuantum kriyojenik kristal.',
    isUnlockedByDefault: true,
    unlockCost: 0
  },
  electric: {
    type: 'electric',
    name: 'Chain Lightning',
    turkishName: 'Zincirleme Yıldırım',
    color: '#ffd000',
    gradient: ['#fff066', '#b38f00'],
    glowColor: 'rgba(255, 208, 0, 0.8)',
    iconName: 'Zap',
    turretType: 'Tesla Bobini',
    description: 'Yan şeritlerdeki düşmanlara sıçrayan yüksek voltajlı ark saçar.',
    lore: 'Yüksek voltajlı ark deşarjı sağlayan rezonans bobini.',
    isUnlockedByDefault: true,
    unlockCost: 0
  },
  void: {
    type: 'void',
    name: 'Void Singularity',
    turkishName: 'Hiçlik Çekimi',
    color: '#a855f7',
    gradient: ['#c084fc', '#6b21a8'],
    glowColor: 'rgba(168, 85, 247, 0.8)',
    iconName: 'Orbit',
    turretType: 'Kozmik Girdap',
    description: 'Düşmanları geri iter ve çekim kara deliği oluşturur.',
    lore: 'Uzay-zaman dokusunu büken minyatür tekillik çekirdeği.',
    isUnlockedByDefault: true,
    unlockCost: 0
  },
  explosive: {
    type: 'explosive',
    name: 'Cluster Rocket',
    turkishName: 'Küme Roketi',
    color: '#ff8800',
    gradient: ['#ffaa44', '#b35500'],
    glowColor: 'rgba(255, 136, 0, 0.8)',
    iconName: 'Bomb',
    turretType: 'Ağır Havan',
    description: 'Hedef bölgede 3 şeridi kapsayan yıkıcı alan patlaması yaratır.',
    lore: 'Parçalanarak geniş alana yayılan termobarik füzyon savaş başlığı.',
    isUnlockedByDefault: true,
    unlockCost: 0
  },
  nano: {
    type: 'nano',
    name: 'Nano Barrier',
    turkishName: 'Nano Kalkan',
    color: '#00ff88',
    gradient: ['#55ffaa', '#009944'],
    glowColor: 'rgba(0, 255, 136, 0.8)',
    iconName: 'Shield',
    turretType: 'Kalkan Onarımı',
    description: 'Savunma kalkanını hızla onarır ve kalkan gücünü tazeler.',
    lore: 'Kalkan matrisini moleküler düzeyde onaran nanit sürüsü.',
    isUnlockedByDefault: true,
    unlockCost: 0
  },
  solaris: {
    type: 'solaris',
    name: 'Solaris Beam',
    turkishName: 'Güneş Korusu',
    color: '#ffaa00',
    gradient: ['#ffe066', '#d97706'],
    glowColor: 'rgba(255, 170, 0, 0.8)',
    iconName: 'Sun',
    turretType: 'Güneş Topu',
    description: 'Şeritteki düşmanları kavurur ve 4 saniye boyunca sürekli yakma hasarı verir.',
    lore: 'Yıldız çekirdeğinden toplanan saf nükleer füzyon enerjisi.',
    isUnlockedByDefault: false,
    unlockCost: 50
  },
  antimatter: {
    type: 'antimatter',
    name: 'Antimatter Pulse',
    turkishName: 'Antimadde Çekirdeği',
    color: '#ec4899',
    gradient: ['#f472b6', '#9d174d'],
    glowColor: 'rgba(236, 72, 153, 0.8)',
    iconName: 'Atom',
    turretType: 'Madde Yok Edici',
    description: 'Kalkanları ve zırhları tamamen yok sayarak %140 doğrudan gerçek hasar vurur.',
    lore: 'Pozitron ve antiprotonların temas anında yarattığı yok oluş.',
    isUnlockedByDefault: false,
    unlockCost: 80
  },
  chronos: {
    type: 'chronos',
    name: 'Chronos Wave',
    turkishName: 'Krono Nabız',
    color: '#06b6d4',
    gradient: ['#67e8f9', '#0e7490'],
    glowColor: 'rgba(6, 182, 212, 0.8)',
    iconName: 'Clock',
    turretType: 'Zaman Yavaşlatıcı',
    description: 'Tüm savaş alanını 4 saniye boyunca %60 yavaşlatan zamansal bir nabız yayar.',
    lore: 'Zaman akışını manipüle eden takyon parçacık dalgası.',
    isUnlockedByDefault: false,
    unlockCost: 120
  },
  toxic: {
    type: 'toxic',
    name: 'Bio-Toxin Spray',
    turkishName: 'Biyo-Toksin',
    color: '#84cc16',
    gradient: ['#bef264', '#4d7c0f'],
    glowColor: 'rgba(132, 204, 22, 0.8)',
    iconName: 'Biohazard',
    turretType: 'Asit Püskürtücü',
    description: 'Düşman gövdelerini aşındırır ve saldırı güçlerini zayıflatır.',
    lore: 'En sert titanyum zırhı saniyeler içinde eriten asit kompleksi.',
    isUnlockedByDefault: false,
    unlockCost: 160
  },
  gravity: {
    type: 'gravity',
    name: 'Gravity Shockwave',
    turkishName: 'Kütleçekim Şoku',
    color: '#6366f1',
    gradient: ['#a5b4fc', '#3730a3'],
    glowColor: 'rgba(99, 102, 241, 0.8)',
    iconName: 'Radio',
    turretType: 'İtici Manyetik Top',
    description: 'Şeritteki tüm düşmanları güçlü bir kütleçekim dalgasıyla ekranın en tepesine iter.',
    lore: 'Karşıt çekim dalgalarıyla devasa nesneleri fırlatan manyetik darbe.',
    isUnlockedByDefault: false,
    unlockCost: 200
  },
  vampiric: {
    type: 'vampiric',
    name: 'Quantum Siphon',
    turkishName: 'Kuantum Sömürücü',
    color: '#f43f5e',
    gradient: ['#fda4af', '#9f1239'],
    glowColor: 'rgba(244, 63, 94, 0.8)',
    iconName: 'Activity',
    turretType: 'Sifonik Sömürücü',
    description: 'Vurulan hasarın %30\'unu oyuncunun kalkanına ve enerjisine aktarır (+15 Enerji).',
    lore: 'Düşman enerjisini kuantum dolaşıklığı ile gemiye çeken karanlık teknoloji.',
    isUnlockedByDefault: false,
    unlockCost: 250
  },
  prism: {
    type: 'prism',
    name: 'Prism Refractor',
    turkishName: 'Prizma Kırıcı',
    color: '#e0e7ff',
    gradient: ['#ffffff', '#a5b4fc'],
    glowColor: 'rgba(224, 231, 255, 0.9)',
    iconName: 'Sparkles',
    turretType: 'Spektrum Projektörü',
    description: 'Yukarı doğru bir lazer fırlatır; ilk düşmana çarptığında tüm 8 şeridi kesen 3 saniyelik bir Spektrum Duvarı örer. Duvardan geçmeye çalışan düşmanlar periyodik hasar alır ve zırhları kırılır.',
    lore: 'Işığı çok boyutlu spektruma ayıran hiper-saflıkta kuantum prizması.',
    isUnlockedByDefault: false,
    unlockCost: 300
  },
  anchor: {
    type: 'anchor',
    name: 'Graviton Anchor',
    turkishName: 'Çekim Çapası',
    color: '#b45309',
    gradient: ['#d97706', '#78350f'],
    glowColor: 'rgba(180, 83, 9, 0.9)',
    iconName: 'Anchor',
    turretType: 'Ağır Manyetik Fırlatıcı',
    description: 'En öndeki düşmanı olduğu yere kilitler; arkasından gelen düşmanlar ona çarparak arkasında sıkışır.',
    lore: 'Düşmanın kütlesini sonsuza yakın artıran yerel yerçekimi kancası.',
    isUnlockedByDefault: false,
    unlockCost: 350
  },
  echo: {
    type: 'echo',
    name: 'Echo Replicator',
    turkishName: 'Rezonans Klonlayıcı',
    color: '#f8fafc',
    gradient: ['#ffffff', '#94a3b8'],
    glowColor: 'rgba(248, 250, 252, 0.9)',
    iconName: 'Copy',
    turretType: 'Holografik Yansıtıcı',
    description: 'Kendi başına ateş etmez; bir önceki tur patlatılan çekirdeğin etkisini o şeritte %80 güçle kopyalar.',
    lore: 'Son ateşlenen enerjinin rezonans frekansını taklit eden holografik ayna.',
    isUnlockedByDefault: false,
    unlockCost: 400
  },
  wormhole: {
    type: 'wormhole',
    name: 'Wormhole Portal',
    turkishName: 'Solucan Deliği',
    color: '#0d9488',
    gradient: ['#2dd4bf', '#115e59'],
    glowColor: 'rgba(13, 148, 136, 0.9)',
    iconName: 'Compass',
    turretType: 'Boyut Kapısı Projektörü',
    description: 'Şeridin altına Giriş, en kalabalık şeridin tepesine Çıkış Portalı açar. Düşmanlar portala girip tepeye ışınlanır.',
    lore: 'İki uzay noktası arasında anlık köprü kuran Einstein-Rosen geçidi.',
    isUnlockedByDefault: false,
    unlockCost: 450
  },
  parasite: {
    type: 'parasite',
    name: 'Nanite Swarm',
    turkishName: 'Nanit Parazit',
    color: '#3b0764',
    gradient: ['#6b21a8', '#1e0538'],
    glowColor: 'rgba(88, 28, 135, 0.95)',
    iconName: 'Bug',
    turretType: 'Biyo-Mekanik Kovan',
    description: 'Düşmana nanit enjekte eder; saniye başı çürütür. Düşman öldüğünde nanitler 2 komşu düşmana sıçrar.',
    lore: 'Organik ve mekanik molekülleri yiyerek çoğalan kendi kendini kopyalayan mikroskobik parazit.',
    isUnlockedByDefault: false,
    unlockCost: 500
  },
  static_web: {
    type: 'static_web',
    name: 'Static Web',
    turkishName: 'Statik Mayın Tarlası',
    color: '#0284c7',
    gradient: ['#38bdf8', '#0369a1'],
    glowColor: 'rgba(2, 132, 199, 0.9)',
    iconName: 'Disc',
    turretType: 'Ağ Dağıtıcı Havan',
    description: 'Şeridin ortasına 3 manyetik mayın döşer. Düşmanlar geçtiğinde patlayarak alan hasarı verir ve 1 sn askıya alır.',
    lore: 'Yüksek voltajlı iyonize manyetik tuzak ağı.',
    isUnlockedByDefault: false,
    unlockCost: 550
  },
  orbital_drone: {
    type: 'orbital_drone',
    name: 'Orbital Drone Carrier',
    turkishName: 'Yörünge Uydusu',
    color: '#94a3b8',
    gradient: ['#cbd5e1', '#475569'],
    glowColor: 'rgba(148, 163, 184, 0.9)',
    iconName: 'Satellite',
    turretType: 'Otonom Dron İstasyonu',
    description: 'Uzaya 8 saniyelik bir savunma uydusu konuşlandırır. Uydu şeritler arasında devriye gezer ve kalkana yaklaşan düşmanlara makineli plazma ateşi açar.',
    lore: 'Tam otonom kuantum yapay zekâ ile donatılmış yörünge savaş platformu.',
    isUnlockedByDefault: false,
    unlockCost: 600
  },
  supernova: {
    type: 'supernova',
    name: 'Supernova Implosion',
    turkishName: 'Süpernova Çekirdeği',
    color: '#fef08a',
    gradient: ['#ffffff', '#fef08a'],
    glowColor: 'rgba(254, 240, 138, 0.95)',
    iconName: 'Star',
    turretType: 'Yıldız Çökertici Batarya',
    description: 'Şeridin ortasına hızla şişen bir mini yıldız fırlatır. Yıldız 2 saniye boyunca etrafındaki tüm düşman mermilerini içine çeker; ardından ekrandaki tüm düşmanları kör edip hasar veren dev bir süpernova patlamasıyla infilak eder.',
    lore: 'Kendi çekim kuvveti altında çökerek evrenin en parlak kozmik infilakını yaratan minyatür yıldız çekirdeği.',
    isUnlockedByDefault: false,
    unlockCost: 650
  }
};

export const DEFAULT_ACTIVE_CORES: GemType[] = ['plasma', 'cryo', 'electric', 'void', 'explosive', 'nano'];

export const ALL_CRUSH_CORES: GemType[] = [
  'plasma', 'cryo', 'electric', 'void', 'explosive', 'nano',
  'solaris', 'antimatter', 'chronos', 'toxic', 'gravity', 'vampiric',
  'prism', 'anchor', 'echo', 'wormhole', 'parasite', 'static_web', 'orbital_drone', 'supernova'
];

export const FORGE_UNLOCKABLE_CORES: GemType[] = [
  'solaris', 'antimatter', 'chronos', 'toxic', 'gravity', 'vampiric',
  'prism', 'anchor', 'echo', 'wormhole', 'parasite', 'static_web', 'orbital_drone', 'supernova'
];

export const GEM_TYPES_ARRAY: GemType[] = DEFAULT_ACTIVE_CORES;

export const BASE_SHIELD_MAX = 1000;
export const BASE_ENERGY_MAX = 100;

export const COMBO_TIMEOUT_MS = 2800; // Time before combo counter resets

export const UPGRADE_POOL: UpgradeOption[] = [
  {
    id: 'up_plasma_overload',
    title: 'Plazma Aşırı Yükleme',
    description: 'Kırmızı plazma lazer hasarını +%35 artırır.',
    icon: 'Flame',
    rarity: 'rare',
    category: 'laser',
    apply: (_, u) => { u.plasmaDamageMult += 0.35; }
  },
  {
    id: 'up_cryo_deep_frost',
    title: 'Derin Donma Protokolü',
    description: 'Kriyo dondurma süresini +%50 uzatır.',
    icon: 'Snowflake',
    rarity: 'common',
    category: 'cryo',
    apply: (_, u) => { u.cryoDurationMult += 0.50; }
  },
  {
    id: 'up_tesla_arc',
    title: 'Hiper İletken Tesla',
    description: 'Yıldırım sıçrama hasarını +%40 artırır ve 1 ekstra şeride atlar.',
    icon: 'Zap',
    rarity: 'rare',
    category: 'electric',
    apply: (_, u) => { u.electricChainBonus += 0.40; }
  },
  {
    id: 'up_nano_matrix',
    title: 'Nano Güçlendirilmiş Zırh',
    description: 'Maksimum kalkanı +250 artırır ve anında %50 onarır.',
    icon: 'Shield',
    rarity: 'epic',
    category: 'shield',
    apply: (_, u) => { u.baseMaxShield += 250; u.nanoShieldBoost += 0.25; }
  },
  {
    id: 'up_cluster_warhead',
    title: 'Termal Harp Başlıkları',
    description: 'Patlama alanını ve roket hasarını +%35 artırır.',
    icon: 'Bomb',
    rarity: 'rare',
    category: 'special',
    apply: (_, u) => { u.explosiveAoeMult += 0.35; }
  },
  {
    id: 'up_hyper_reactor',
    title: 'Kuantum Reaktör',
    description: 'Özel yetenek enerji dolum hızını +%40 hızlandırır.',
    icon: 'Zap',
    rarity: 'epic',
    category: 'energy',
    apply: (_, u) => { u.energyRechargeRate += 0.40; }
  },
  {
    id: 'up_critical_focus',
    title: 'Hassas Hedefleme Çipi',
    description: 'Tüm silahlarda kritik vuruş (%200 hasar) şansını +%15 artırır.',
    icon: 'Crosshair',
    rarity: 'legendary',
    category: 'laser',
    apply: (_, u) => { u.critChance += 0.15; }
  },
  {
    id: 'up_void_collapse',
    title: 'Karanlık Madde Çekirdeği',
    description: 'Hiçlik girdabının süresini +%60 uzatır ve girdap hasarını artırır.',
    icon: 'Orbit',
    rarity: 'rare',
    category: 'special',
    apply: (_, u) => { u.voidVortexDuration += 0.60; }
  },
  {
    id: 'up_void_singularity_pull',
    title: 'Tekillik Çekim Gücü',
    description: 'Hiçlik girdabının yerçekimi çekim gücünü +%50 artırır; düşmanları tepeye hızla geri çeker.',
    icon: 'Orbit',
    rarity: 'epic',
    category: 'special',
    apply: (_, u) => { u.voidVortexPullForce += 0.50; }
  },
  {
    id: 'up_void_damage',
    title: 'Kozmik Ezilme (Hiçlik Hasarı)',
    description: 'Hiçlik girdabına hasar verme özelliği kazandırır (veya mevcut girdap hasarını +%50 artırır).',
    icon: 'Orbit',
    rarity: 'rare',
    category: 'special',
    apply: (_, u) => {
      if (u.voidVortexDamageMult <= 0) {
        u.voidVortexDamageMult = 1.0;
      } else {
        u.voidVortexDamageMult += 0.50;
      }
    }
  }
];
