// Defines all available rarity tiers in ascending order of power
export type Rarity =
  | "Common"
  | "Uncommon"
  | "Rare"
  | "Epic"
  | "Legendary"
  | "Mythic";

// Defines equipment slots for crafted gear
export type EquipmentSlot =
  | "Weapon"
  | "Armor"
  | "Helmet"
  | "Ring"
  | "Shield"
  | "Boots"
  | "Necklace"
  | "Gloves";

// Represents a single piece of crafted equipment
export interface Equipment {
  id: string;
  name: string;
  level: number;
  slot: EquipmentSlot;
  rarity: Rarity;
  attackBonus: number;
  hpBonus: number;
  defense: number;
  critRate: number;
  critDamage: number;
  dodgeChance: number;
  sellValue: number; // Gold gained if sold instead of equipped
}

// Represents an enemy in combat
export interface Enemy {
  id: string; //id for each enemy
  name: string;
  image: string; //image for enemy
  level: number;
  maxHp: number;
  currentHp: number;
  attack: number;
  goldReward: number;
  xpReward: number;
  hammerDropChance: number;
  isBoss: boolean;
  position: number; // 100 (far right) -> 32 (melee range next to Hero)
}

// Represents a biome/environment unlocked as stages progress
export interface Environment {
  id: string;
  name: string;
  minStage: number;
  bgGradient: string; // Tailwind CSS gradient classes
  bgImage: string; //image for background
  backgroundImage: string;
  mobs: { name: string; image: string }[];
  boss: { name: string; image: string };
}

// Master game state saved to localStorage
export interface GameState {
  stage: number;
  wave: number; // 1-4 are regular mobs, 5 is the stage Boss
  enemies: Enemy[];
  gold: number;
  hammers: number;
  anvilLevel: number;
  equipped: Record<EquipmentSlot, Equipment | null>;
  lastSavedTime: number; // Unix timestamp (ms) for offline idle calculation
  heroLevel: number;
  xp: number;
  xpToNextLevel: number;
  statPoints: number;
  allocatedStats: {
    attack: number;
    hp: number;
    defense: number;
    crit: number;
  };
}
