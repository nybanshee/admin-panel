export interface WeaponStats {
  weight: number;
  gravity: number;
  gripStrength: number;
  damage: number;
  fireRate: number;
  burstAmount: number;
  accuracy: number;
  spread: number;
  recoilPattern: string;
  magSize: number;
  reloadTime: number;
}

export interface WeaponVisuals {
  skin: string;
  rarity: string;
  fireSound: string;
  tracerColor: string;
}

export interface WeaponOffsets {
  view: { x: number; y: number; z: number };
  aim: { x: number; y: number; z: number };
  muzzle: { x: number; y: number; z: number };
}

export interface WeaponSprings {
  recoil: { stiffness: number; damping: number };
  sway: { stiffness: number; damping: number };
  adsZoom: { stiffness: number; damping: number };
  ads: { stiffness: number; damping: number };
  movement: { stiffness: number; damping: number };
  reload: { stiffness: number; damping: number };
  fire: { stiffness: number; damping: number };
}

export interface WeaponConfig {
  id: string;
  name: string;
  category: string;
  unlockLevel: number; // Added unlockLevel
  enabled: boolean;
  dualWield: boolean;
  magSequence: string[];
  stats: WeaponStats;
  visuals: WeaponVisuals;
  offsets: WeaponOffsets;
  springs: WeaponSprings;
  attachmentSlots?: Record<'optic' | 'muzzle' | 'grip' | 'mag' | 'barrel' | 'stock', { allowed: string[]; equipped?: string }>;
  statsRecoilPatternId?: string;
}

export interface BulletConfig {
    id: string;
    label: string;
    color: string; // Tailwind class
    damageMult: number;
    penetration: number;
    velocity: number;
    gravity: number;
    spread: number;
    recoilMult: number;
    isExplosive: boolean;
    // Recoil is now bullet-centric
    grain?: number; // bullet grain
    recoilSpring?: { stiffness: number; damping: number };
    recoilForce?: { x: number; y: number; z: number }; // per-axis impulse
    recoilRotation?: { pitch: number; yaw: number; roll: number }; // rotational kick
    recoilRandomness?: { forceJitter: number; rotationJitter: number }; // shot-to-shot variation
}

export interface AttachmentConfig {
    id: string;
    name: string;
    type: 'optic' | 'muzzle' | 'grip' | 'mag' | 'barrel' | 'stock'; // Added barrel and stock to type
    unlockLevel: number; // Added unlockLevel
    weight: number;
    pros: string[];
    cons: string[];
}

export interface MapConfig {
    id: string;
    name: string;
    tags: string[];
    enabled: boolean;
}

export interface GameModeRotationEntry {
    mapId: string;
    weight: number;
}

export interface GameModeConfig {
    id: string;
    name: string;
    enabled: boolean;
    mapBanningEnabled: boolean;
    bansPerTeam: number;
    candidateCount: number;
    rotation: GameModeRotationEntry[];
}

export interface RecoilPoint { x: number; y: number; time: number }

export interface RecoilPattern {
    id: string;
    name: string;
    points: RecoilPoint[];
    createdAt: number;
}
