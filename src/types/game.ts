// Defines all available rarity tiers in ascending order of power
export type Rarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";

// Defines equipment slots for crafted gear
export type EquipmentSlot = "Weapon" | "Armor" | "Helmet";

// Represents a single piece of crafted equipment
export interface Equipment {
  id: string;
  name: string;
  slot: EquipmentSlot;
  rarity: Rarity;
  attackBonus: number;
  hpBonus: number;
  sellValue: number; // Gold gained if sold instead of equipped
}

// Represents a permanent Gacha companion or relic
export interface GachaItem {
  id: string;
  name: string;
  type: "Companion" | "Relic";
  rarity: Rarity;
  attackMultiplier: number; // e.g., 0.15 adds +15% total attack
  hpMultiplier: number; // e.g., 0.10 adds +10% total HP
  description: string;
}

// Represents the currently active enemy in combat
export interface Enemy {
  name: string;
  image: string; //image for enemie
  maxHp: number;
  currentHp: number;
  attack: number;
  goldReward: number;
  gemReward: number;
  isBoss: boolean;
}

// Represents a biome/environment unlocked as stages progress
export interface Environment {
  id: string;
  name: string;
  minStage: number;
  bgGradient: string; // Tailwind CSS gradient classes
  bgImage: string; //image for background
  mobs: { name: string; image: string }[];
  boss: { name: string; image: string };
}

// Master game state saved to localStorage
export interface GameState {
  stage: number;
  wave: number; // 1-4 are regular mobs, 5 is the stage Boss
  gold: number;
  gems: number;
  hammers: number;
  anvilLevel: number;
  pullsSinceLegendary: number; // Tracks hard pity counter (cap = 50)
  equipped: Record<EquipmentSlot, Equipment | null>;
  ownedGachaIds: string[]; // IDs of unlocked permanent companions/relics
  lastSavedTime: number; // Unix timestamp (ms) for offline idle calculation
}
