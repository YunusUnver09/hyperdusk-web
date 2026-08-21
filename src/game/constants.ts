import type { GemElementConfig, GemType, UpgradeOption, CoreUpgradeCard, RolledUpgradeOption, GameStats, PlayerUpgrades } from './types';

export const GRID_COLS = 8;
export const GRID_ROWS = 8;
export const NUM_LANES = 8;

export const GEM_ELEMENTS: Record<GemType, GemElementConfig> = {
  plasma: {
    type: 'plasma',
    name: 'Plasma Laser',
    turkishName: 'Plazma Lazer',
    color: '#dc2626',
    gradient: ['#dc2626', '#991b1b'],
    glowColor: 'rgba(220, 38, 38, 0.75)',
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
    color: '#06b6d4',
    gradient: ['#06b6d4', '#0891b2'],
    glowColor: 'rgba(6, 182, 212, 0.75)',
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
    color: '#facc15',
    gradient: ['#facc15', '#ca8a04'],
    glowColor: 'rgba(250, 204, 21, 0.75)',
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
    color: '#9333ea',
    gradient: ['#9333ea', '#581c87'],
    glowColor: 'rgba(147, 51, 234, 0.75)',
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
    color: '#ea580c',
    gradient: ['#ea580c', '#9a3412'],
    glowColor: 'rgba(234, 88, 12, 0.75)',
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
    color: '#10b981',
    gradient: ['#10b981', '#047857'],
    glowColor: 'rgba(16, 185, 129, 0.75)',
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
    color: '#d97706',
    gradient: ['#d97706', '#78350f'],
    glowColor: 'rgba(217, 119, 6, 0.75)',
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
    color: '#db2777',
    gradient: ['#db2777', '#831843'],
    glowColor: 'rgba(219, 39, 119, 0.75)',
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
    color: '#2563eb',
    gradient: ['#2563eb', '#1e3a8a'],
    glowColor: 'rgba(37, 99, 235, 0.75)',
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
    gradient: ['#84cc16', '#4d7c0f'],
    glowColor: 'rgba(132, 204, 22, 0.75)',
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
    color: '#4f46e5',
    gradient: ['#4f46e5', '#312e81'],
    glowColor: 'rgba(79, 70, 229, 0.75)',
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
    color: '#be123c',
    gradient: ['#be123c', '#4c0519'],
    glowColor: 'rgba(190, 18, 60, 0.75)',
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
    color: '#f1f5f9',
    gradient: ['#f1f5f9', '#94a3b8'],
    glowColor: 'rgba(241, 245, 249, 0.75)',
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
    color: '#854d0e',
    gradient: ['#854d0e', '#451a03'],
    glowColor: 'rgba(133, 77, 14, 0.75)',
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
    color: '#cbd5e1',
    gradient: ['#cbd5e1', '#64748b'],
    glowColor: 'rgba(203, 213, 225, 0.75)',
    iconName: 'Copy',
    turretType: 'Holografik Yansıtıcı',
    description: 'Kendi başına ateş etmez; bir önceki tur patlatılan çekirdeğin etkisini o şeritte %120 güçle kopyalar.',
    lore: 'Son ateşlenen enerjinin rezonans frekansını taklit eden holografik ayna.',
    isUnlockedByDefault: false,
    unlockCost: 400
  },
  wormhole: {
    type: 'wormhole',
    name: 'Wormhole Portal',
    turkishName: 'Solucan Deliği',
    color: '#0f766e',
    gradient: ['#0f766e', '#134e4a'],
    glowColor: 'rgba(15, 118, 110, 0.75)',
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
    color: '#701a75',
    gradient: ['#701a75', '#4a044e'],
    glowColor: 'rgba(112, 26, 117, 0.75)',
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
    gradient: ['#0284c7', '#0369a1'],
    glowColor: 'rgba(2, 132, 199, 0.75)',
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
    color: '#475569',
    gradient: ['#475569', '#1e293b'],
    glowColor: 'rgba(71, 85, 105, 0.75)',
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
    color: '#fde047',
    gradient: ['#fde047', '#b45309'],
    glowColor: 'rgba(253, 224, 71, 0.75)',
    iconName: 'Star',
    turretType: 'Yıldız Çökertici Batarya',
    description: 'Şeridin ortasına hızla şişen bir mini yıldız fırlatır. Yıldız 2 saniye boyunca etrafındaki tüm düşman mermilerini içine çeker; ardından ekrandaki tüm düşmanları kör edip hasar veren dev bir süpernova patlamasıyla infilak eder.',
    lore: 'Kendi çekim kuvveti altında çökerek evrenin en parlak kozmik infilakını yaratan minyatür yıldız çekirdeği.',
    isUnlockedByDefault: false,
    unlockCost: 650
  },
  deflector: {
    type: 'deflector',
    name: 'Kinetic Deflector',
    turkishName: 'Reaktif Kinetik Kalkan',
    color: '#14b8a6',
    gradient: ['#14b8a6', '#0f766e'],
    glowColor: 'rgba(20, 184, 166, 0.75)',
    iconName: 'ShieldCheck',
    turretType: 'Kinetik Reflektör Bataryası',
    description: 'Kalkan hattına gelen sonraki 1 düşman mermisini engelleyen reaktif bir bariyer ekler. Darbe enerjisini 2x katlayarak geri yansıtır. Eşleşmeler mermi engelleme sayısını stackler.',
    lore: 'Alınan darbelerin kinetik vektörünü faz karşıtı dalgalarla iki kat güçte geri püskürten kuantum yansıtıcı.',
    isUnlockedByDefault: false,
    unlockCost: 500
  }
};

export const DEFAULT_ACTIVE_CORES: GemType[] = ['plasma', 'cryo', 'electric', 'void', 'explosive', 'nano'];

export const ALL_CRUSH_CORES: GemType[] = [
  'plasma', 'cryo', 'electric', 'void', 'explosive', 'nano',
  'solaris', 'antimatter', 'chronos', 'toxic', 'gravity', 'vampiric',
  'prism', 'anchor', 'echo', 'wormhole', 'parasite', 'static_web', 'orbital_drone', 'supernova', 'deflector'
];

export const FORGE_UNLOCKABLE_CORES: GemType[] = [
  'solaris', 'antimatter', 'chronos', 'toxic', 'gravity', 'vampiric',
  'prism', 'anchor', 'echo', 'wormhole', 'parasite', 'static_web', 'orbital_drone', 'supernova', 'deflector'
];

export const GEM_TYPES_ARRAY: GemType[] = DEFAULT_ACTIVE_CORES;

export const BASE_SHIELD_MAX = 1000;
export const BASE_ENERGY_MAX = 100;

export const COMBO_TIMEOUT_MS = 2800; // Time before combo counter resets

export const CORE_UPGRADES: Record<GemType, CoreUpgradeCard> = {
  plasma: {
    coreType: 'plasma',
    title: 'Plazma Aşırı Yükleme',
    icon: 'Flame',
    rarity: 'rare',
    tiers: [
      {
        level: 1,
        description: 'Plazma lazer hasarı +%40 artar.',
        apply: (_, u) => { u.plasmaDamageMult = (u.plasmaDamageMult || 1) + 0.40; }
      },
      {
        level: 2,
        description: 'Lazer şeritteki tüm düşmanları delip geçer ve arkasında 2sn yanan plazma izi bırakır.',
        apply: (_, u) => { u.plasmaPiercing = true; }
      },
      {
        level: 3,
        description: 'Plazma vuruşları %100 kritik hasar verir ve düşman zırhını anında eritir.',
        apply: (_, u) => { u.plasmaCritOvercharge = true; }
      }
    ]
  },
  cryo: {
    coreType: 'cryo',
    title: 'Derin Donma Protokolü',
    icon: 'Snowflake',
    rarity: 'rare',
    tiers: [
      {
        level: 1,
        description: 'Kriyo dondurma stasis süresi +%50 uzar.',
        apply: (_, u) => { u.cryoDurationMult = (u.cryoDurationMult || 1) + 0.50; }
      },
      {
        level: 2,
        description: 'Donmuş düşmanlar aldıkları tüm diğer hasarlardan %50 daha fazla hasar alır (Kırılganlık).',
        apply: (_, u) => { u.cryoVulnerability = true; }
      },
      {
        level: 3,
        description: 'Donmuş düşman öldüğünde patlayarak komşu şeritlerdeki düşmanları da dondurur.',
        apply: (_, u) => { u.cryoFrostNova = true; }
      }
    ]
  },
  electric: {
    coreType: 'electric',
    title: 'Hiper İletken Tesla',
    icon: 'Zap',
    rarity: 'rare',
    tiers: [
      {
        level: 1,
        description: 'Yıldırım sıçrama hasarı +%40 artar ve 1 ekstra komşu şeride sıçrar.',
        apply: (_, u) => { u.electricChainBonus = (u.electricChainBonus || 1) + 0.40; }
      },
      {
        level: 2,
        description: 'Yıldırım çarpan tüm düşmanlar 1.5 saniye elektriksel felç (stasis stun) geçirir.',
        apply: (_, u) => { u.electricStunDuration = 1.5; }
      },
      {
        level: 3,
        description: 'Yıldırım arkları düşmanlar arasında sürekli döngüye girerek kalıcı küresel plazma arkı kurar.',
        apply: (_, u) => { u.electricStormLoop = true; }
      }
    ]
  },
  void: {
    coreType: 'void',
    title: 'Karanlık Madde Çekirdeği',
    icon: 'Orbit',
    rarity: 'epic',
    tiers: [
      {
        level: 1,
        description: 'Hiçlik girdabının süresi +%50 uzar ve çekim gücü %40 artar.',
        apply: (_, u) => {
          u.voidVortexDuration = (u.voidVortexDuration || 1) + 0.50;
          u.voidVortexPullForce = (u.voidVortexPullForce || 1) + 0.40;
        }
      },
      {
        level: 2,
        description: 'Girdap içine çekilen tüm düşmanlar saniye başı ezilme hasarı alır.',
        apply: (_, u) => { u.voidVortexDamageMult = (u.voidVortexDamageMult || 0) + 1.0; }
      },
      {
        level: 3,
        description: 'Girdap sona erdiğinde çöken bir mikro kara delik patlaması yaratarak şeridi temizler.',
        apply: (_, u) => { u.voidImplosionBomb = true; }
      }
    ]
  },
  explosive: {
    coreType: 'explosive',
    title: 'Termobarik Harp Başlığı',
    icon: 'Bomb',
    rarity: 'rare',
    tiers: [
      {
        level: 1,
        description: 'Roket patlama alanı 3 şeritten 5 şeride genişler ve hasar +%35 artar.',
        apply: (_, u) => {
          u.explosiveAoeMult = (u.explosiveAoeMult || 1) + 0.35;
          u.explosive5Lanes = true;
        }
      },
      {
        level: 2,
        description: 'Ana patlamadan sonra hedef alana 3 adet mikro ikincil bomba saçılır.',
        apply: (_, u) => { u.explosiveClusterBomblets = true; }
      },
      {
        level: 3,
        description: 'Patlama alanı 3 saniye boyunca alev fırtınası yayarak içinden geçen hedefleri yok eder.',
        apply: (_, u) => { u.explosiveFirestorm = true; }
      }
    ]
  },
  nano: {
    coreType: 'nano',
    title: 'Nano Rejenerasyon Matrisi',
    icon: 'Shield',
    rarity: 'epic',
    tiers: [
      {
        level: 1,
        description: 'Kalkan onarım miktarı +%50 artar ve maksimum kalkan +250 yükselir.',
        apply: (_, u) => {
          u.baseMaxShield = (u.baseMaxShield || 1000) + 250;
          u.nanoShieldBoost = (u.nanoShieldBoost || 1) + 0.50;
        }
      },
      {
        level: 2,
        description: 'Kalkan tam doluyken yapılan onarımlar geçici bir aşırı kalkan (Overshield) oluşturur.',
        apply: (_, u) => { u.nanoOvershield = true; }
      },
      {
        level: 3,
        description: 'Kalkan darbe aldığında çevreye düşmanları geri püskürten nano şok dalgası salar.',
        apply: (_, u) => { u.nanoRepulsePulse = true; }
      }
    ]
  },
  solaris: {
    coreType: 'solaris',
    title: 'Kromosferik Alev',
    icon: 'Sun',
    rarity: 'rare',
    tiers: [
      {
        level: 1,
        description: 'Yakma süresi 6 saniyeye çıkar ve yanma hasarı +%50 artar.',
        apply: (_, u) => {
          u.solarisBurnDuration = 6.0;
          u.solarisDamageMult = 1.5;
        }
      },
      {
        level: 2,
        description: 'Yanan düşmanların hareket hızı %35 yavaşlar ve komşularını da tutuşturur.',
        apply: (_, u) => { u.solarisSpread = true; }
      },
      {
        level: 3,
        description: 'Şeritte güneş patlaması kalıcı hale gelerek şerit boyunca koridor ateşi açar.',
        apply: (_, u) => { u.solarisSolarCorridor = true; }
      }
    ]
  },
  antimatter: {
    coreType: 'antimatter',
    title: 'Pozitron İnfilakı',
    icon: 'Atom',
    rarity: 'epic',
    tiers: [
      {
        level: 1,
        description: 'Doğrudan gerçek hasar çarpanı %140\'tan %190\'a çıkar.',
        apply: (_, u) => { u.antimatterDamageMult = 1.9; }
      },
      {
        level: 2,
        description: 'Antimadde darbesi vurduğu hedefin tüm kalkanını anında siler.',
        apply: (_, u) => { u.antimatterShieldStrip = true; }
      },
      {
        level: 3,
        description: 'Temas edilen kütle negatif enerjiye dönüşüp arkadaki hedeflere sıçrar.',
        apply: (_, u) => { u.antimatterChainReaction = true; }
      }
    ]
  },
  chronos: {
    coreType: 'chronos',
    title: 'Takyon Akışı',
    icon: 'Clock',
    rarity: 'epic',
    tiers: [
      {
        level: 1,
        description: 'Zamansal yavaşlatma etkisi %60\'tan %80\'e çıkar.',
        apply: (_, u) => { u.chronosSlowPercent = 0.80; }
      },
      {
        level: 2,
        description: 'Zaman yavaşladığında oyuncunun taretleri 2 kat daha hızlı ateşlenir.',
        apply: (_, u) => { u.chronosTurretHaste = true; }
      },
      {
        level: 3,
        description: 'Krono nabız tetiklendiğinde ekrandaki tüm düşman mermileri havada donup yok olur.',
        apply: (_, u) => { u.chronosBulletFreeze = true; }
      }
    ]
  },
  toxic: {
    coreType: 'toxic',
    title: 'Asidik Çürüme',
    icon: 'Biohazard',
    rarity: 'rare',
    tiers: [
      {
        level: 1,
        description: 'Asit aşındırma hasarı saniye başı +%50 daha hızlı eritir.',
        apply: (_, u) => { u.toxicDamageMult = 1.5; }
      },
      {
        level: 2,
        description: 'Aşınan düşmanların saldırı gücü %50 düşer (Körletici Asit).',
        apply: (_, u) => { u.toxicAttackDebuff = 0.5; }
      },
      {
        level: 3,
        description: 'Asit gövdeyi deldiğinde düşman patlar ve yere kalıcı toksik asit gölü bırakır.',
        apply: (_, u) => { u.toxicAcidPools = true; }
      }
    ]
  },
  gravity: {
    coreType: 'gravity',
    title: 'Manyetik İtici Çekiç',
    icon: 'Radio',
    rarity: 'rare',
    tiers: [
      {
        level: 1,
        description: 'İtme gücü artar; düşmanlar tepeye çarpınca %40 çarpma hasarı alır.',
        apply: (_, u) => { u.gravityImpactDamage = 0.40; }
      },
      {
        level: 2,
        description: 'Şok dalgası hedef şeridin yanı sıra sol ve sağ komşu şeritleri de tepeye fırlatır.',
        apply: (_, u) => { u.gravityTriLane = true; }
      },
      {
        level: 3,
        description: 'Tepeye fırlatılan düşmanlar 2.5 saniye boyunca sersemler ve aşağı inemez.',
        apply: (_, u) => { u.gravityCeilingStun = 2.5; }
      }
    ]
  },
  vampiric: {
    coreType: 'vampiric',
    title: 'Hiper Sifon',
    icon: 'Activity',
    rarity: 'epic',
    tiers: [
      {
        level: 1,
        description: 'Can ve enerji emme oranı %30\'dan %55\'e çıkar (+25 Enerji).',
        apply: (_, u) => {
          u.vampiricSiphonRatio = 0.55;
          u.vampiricBonusEnergy = 25;
        }
      },
      {
        level: 2,
        description: 'Sömürülen her 100 kalkan enerjisi taretlere 3 saniyelik aşırı hız buff\'ı verir.',
        apply: (_, u) => { u.vampiricOverdrive = true; }
      },
      {
        level: 3,
        description: 'Çekilen yaşam enerjisi bir kuantum nova dalgası olarak yakındaki diğer düşmanlara vurur.',
        apply: (_, u) => { u.vampiricLifeNova = true; }
      }
    ]
  },
  prism: {
    coreType: 'prism',
    title: 'Işık Bölünmesi',
    icon: 'Sparkles',
    rarity: 'epic',
    tiers: [
      {
        level: 1,
        description: 'Spektrum Duvarı süresi 3 saniyeden 5 saniyeye çıkar.',
        apply: (_, u) => { u.prismWallDuration = 5.0; }
      },
      {
        level: 2,
        description: 'Duvardan geçen düşmanların zırhları tamamen kırılır ve %40 yavaşlar.',
        apply: (_, u) => { u.prismSlowAndStrip = true; }
      },
      {
        level: 3,
        description: 'Duvara çarpan her düşman lazeri yansıtarak duvardan lazer okları fırlatır.',
        apply: (_, u) => { u.prismReflectiveSpikes = true; }
      }
    ]
  },
  anchor: {
    coreType: 'anchor',
    title: 'Ağır Madde Prangası',
    icon: 'Anchor',
    rarity: 'rare',
    tiers: [
      {
        level: 1,
        description: 'Çapa kilitlenme süresi 5sn\'den 8sn\'ye çıkar.',
        apply: (_, u) => { u.anchorDuration = 8.0; }
      },
      {
        level: 2,
        description: 'Kilitli düşmanın arkasında biriken tüm düşmanlar ezilme hasarı alır.',
        apply: (_, u) => { u.anchorCrushTension = true; }
      },
      {
        level: 3,
        description: 'Çapa süresi bittiğinde kilitli düşman patlayarak arkasındaki tüm trafiği havaya uçurur.',
        apply: (_, u) => { u.anchorDetonation = true; }
      }
    ]
  },
  echo: {
    coreType: 'echo',
    title: 'Saf Yankı',
    icon: 'Copy',
    rarity: 'rare',
    tiers: [
      {
        level: 1,
        description: 'Klonlanan çekirdeğin güç çarpanı %120\'den %160\'a çıkar.',
        apply: (_, u) => { u.echoPowerMult = 1.6; }
      },
      {
        level: 2,
        description: 'Klonlanan etki yanındaki 1 komşu şeritte daha yankılanır.',
        apply: (_, u) => { u.echoNeighborLane = true; }
      },
      {
        level: 3,
        description: 'Klonlama gerçekleştiğinde tahtaya 1 adet Joker Enerji Küresi düşürür.',
        apply: (_, u) => { u.echoSpawnHyperCube = true; }
      }
    ]
  },
  wormhole: {
    coreType: 'wormhole',
    title: 'Boyut Kapanı',
    icon: 'Compass',
    rarity: 'epic',
    tiers: [
      {
        level: 1,
        description: 'Işınlanan düşmanlar portal çıkışında %40 hasar alır.',
        apply: (_, u) => { u.wormholeExitDamage = 0.40; }
      },
      {
        level: 2,
        description: 'Portal aynı anda 3 düşmanı birden tepeye geri gönderebilir.',
        apply: (_, u) => { u.wormholeMultiTeleport = 3; }
      },
      {
        level: 3,
        description: 'Çıkış portalının etrafında 3sn boyunca giren her şeyi geri püskürten yerçekimi tersinimi oluşur.',
        apply: (_, u) => { u.wormholeGravityRepel = true; }
      }
    ]
  },
  parasite: {
    coreType: 'parasite',
    title: 'Salgın Protokolü',
    icon: 'Bug',
    rarity: 'legendary',
    tiers: [
      {
        level: 1,
        description: 'Düşman öldüğünde nanitler 2 yerine 4 komşu düşmana yayılır.',
        apply: (_, u) => { u.parasiteSpreadCount = 4; }
      },
      {
        level: 2,
        description: 'Nanit taşıyan düşmanların savunması saniye başı %10 erir.',
        apply: (_, u) => { u.parasiteArmorMelt = true; }
      },
      {
        level: 3,
        description: 'Nanitli hedefler kalkan hattına ulaşamadan patlayan canlı bombalara dönüşür.',
        apply: (_, u) => { u.parasiteLivingBombs = true; }
      }
    ]
  },
  deflector: {
    coreType: 'deflector',
    title: 'Kinetik Depolama',
    icon: 'ShieldCheck',
    rarity: 'rare',
    tiers: [
      {
        level: 1,
        description: 'Her eşleşme 1 yerine 2 mermi engelleme hakkı kazandırır ve yansıtılan hasar 2x\'ten 3.5x\'e çıkar.',
        apply: (_, u) => {
          u.deflectorChargesPerMatch = 2;
          u.deflectorDamageMult = 3.5;
        }
      },
      {
        level: 2,
        description: 'Bariyer mermilerin yanı sıra düşman gövdelerinin temas hasarını da (1 hak harcayarak) geri yansıtır.',
        apply: (_, u) => { u.deflectorReflectBodies = true; }
      },
      {
        level: 3,
        description: 'Yansıtılan her darbe kalkana %5 enerji/tamir olarak geri döner.',
        apply: (_, u) => { u.deflectorHealOnReflect = true; }
      }
    ]
  },
  static_web: {
    coreType: 'static_web',
    title: 'Yüksek Voltaj Ağı',
    icon: 'Disc',
    rarity: 'rare',
    tiers: [
      {
        level: 1,
        description: 'Şeride 3 yerine 5 adet manyetik mayın döşenir.',
        apply: (_, u) => { u.staticWebMineCount = 5; }
      },
      {
        level: 2,
        description: 'Mayınların askıya alma (felç) süresi 2 saniyeye çıkar.',
        apply: (_, u) => { u.staticWebStunDuration = 2.0; }
      },
      {
        level: 3,
        description: 'Mayınlar birbirine elektrik hatlarıyla bağlanarak şerit boyunca lazer bariyeri kurar.',
        apply: (_, u) => { u.staticWebLaserFence = true; }
      }
    ]
  },
  orbital_drone: {
    coreType: 'orbital_drone',
    title: 'Otonom Filo',
    icon: 'Satellite',
    rarity: 'epic',
    tiers: [
      {
        level: 1,
        description: 'Uydu süresi 8 saniyeden 12 saniyeye çıkar; atış hızı %30 artar.',
        apply: (_, u) => {
          u.orbitalDroneDuration = 12.0;
          u.orbitalDroneFireRate = 1.3;
        }
      },
      {
        level: 2,
        description: 'Sahaya aynı anda 2 adet devriye uydusu konuşlandırılır.',
        apply: (_, u) => { u.orbitalDroneDual = true; }
      },
      {
        level: 3,
        description: 'Uydular sadece makineli tüfek değil, periyodik olarak Güdümlü Mikro Füzeler ateşler.',
        apply: (_, u) => { u.orbitalDroneMicroMissiles = true; }
      }
    ]
  },
  supernova: {
    coreType: 'supernova',
    title: 'Hiper Yoğunluk',
    icon: 'Star',
    rarity: 'legendary',
    tiers: [
      {
        level: 1,
        description: 'Mini yıldızın düşmanları çekme yarıçapı tüm ekranı kapsar.',
        apply: (_, u) => { u.supernovaPullRadiusMult = 2.5; }
      },
      {
        level: 2,
        description: 'Final patlamasının hasarı 2 Katına çıkar.',
        apply: (_, u) => { u.supernovaDamageMult = 2.0; }
      },
      {
        level: 3,
        description: 'Patlama sonrası ekranda 4 saniye boyunca kalan Kozmik Radyasyon Alanı düşmanları yakar.',
        apply: (_, u) => { u.supernovaRadiationZone = true; }
      }
    ]
  }
};

export function rollActiveCoreUpgrades(
  activeCores: GemType[],
  coreLevels: Record<GemType, number>,
  stats: GameStats,
  upgrades: PlayerUpgrades,
  battlefield?: any,
  onApplyLevelCallback?: (core: GemType, newLevel: number) => void
): RolledUpgradeOption[] {
  const candidateCores = activeCores.filter(c => (coreLevels[c] || 0) < 3);

  // Shuffle candidate cores
  const shuffled = [...candidateCores].sort(() => 0.5 - Math.random());
  const selectedCores = shuffled.slice(0, 3);

  const results: RolledUpgradeOption[] = [];

  for (const coreType of selectedCores) {
    const card = CORE_UPGRADES[coreType];
    if (!card) continue;
    const currentLvl = coreLevels[coreType] || 0;
    const targetLvl = (currentLvl + 1) as 1 | 2 | 3;
    const tierData = card.tiers[targetLvl - 1];

    const rarity: 'rare' | 'epic' | 'legendary' = targetLvl === 1 ? 'rare' : targetLvl === 2 ? 'epic' : 'legendary';

    results.push({
      id: `up_${coreType}_lvl${targetLvl}`,
      coreType,
      title: card.title,
      description: tierData.description,
      icon: card.icon,
      rarity,
      level: targetLvl,
      maxLevel: 3,
      apply: () => {
        tierData.apply(stats, upgrades, battlefield);
        if (onApplyLevelCallback) {
          onApplyLevelCallback(coreType, targetLvl);
        }
      }
    });
  }

  // If fewer than 3 options (e.g. all cores maxed out), fill with backup overcharges
  const genericOvercharges = [
    {
      id: 'gen_up_shield_matrix',
      title: 'Aşırı Yükleme: Kalkan Takviyesi',
      description: 'Maksimum kalkanı +300 artırır ve kalkanı tamamen yeniler.',
      icon: 'Shield',
      rarity: 'epic' as const,
      level: 1,
      maxLevel: 1,
      apply: () => {
        upgrades.baseMaxShield = (upgrades.baseMaxShield || 1000) + 300;
        if (battlefield) battlefield.healShield(300);
      }
    },
    {
      id: 'gen_up_crit_matrix',
      title: 'Aşırı Yükleme: Kritik Matris',
      description: 'Tüm silahlarda kritik vuruş şansını +%20 artırır.',
      icon: 'Crosshair',
      rarity: 'legendary' as const,
      level: 1,
      maxLevel: 1,
      apply: () => {
        upgrades.critChance = (upgrades.critChance || 0.1) + 0.20;
      }
    },
    {
      id: 'gen_up_plasma_core',
      title: 'Aşırı Yükleme: Genel Hasar Çarpanı',
      description: 'Tüm taretlerin temel silah hasarını +%25 artırır.',
      icon: 'Flame',
      rarity: 'rare' as const,
      level: 1,
      maxLevel: 1,
      apply: () => {
        upgrades.plasmaDamageMult = (upgrades.plasmaDamageMult || 1) + 0.25;
      }
    }
  ];

  let genIdx = 0;
  while (results.length < 3 && genIdx < genericOvercharges.length) {
    results.push(genericOvercharges[genIdx++]);
  }

  return results;
}

// Fallback legacy array for backwards compatibility
export const UPGRADE_POOL: UpgradeOption[] = [];

