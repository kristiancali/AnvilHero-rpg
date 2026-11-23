import type { GachaItem, Rarity } from "../types/game";

// Rarity drop weights for Gacha summons (sum = 100)
export const GACHA_WEIGHTS: Record<Rarity, number> = {
  Common: 50,
  Uncommon: 30,
  Rare: 14,
  Epic: 5,
  Legendary: 1,
  Mythic: 0,
};

// Hard pity threshold: guarantees a Legendary on the 50th pull
export const LEGENDARY_PITY_CAP = 50;
export const GACHA_PULL_COST = 100; // Gems per pull

// Permanent companions and relics obtainable from the Gacha
export const GACHA_POOL: GachaItem[] = [
  {
    id: "comp_squire",
    name: "Apprentice Squire",
    type: "Companion",
    rarity: "Common",
    attackMultiplier: 0.05,
    hpMultiplier: 0.05,
    description: "+5% Attack & HP",
  },
  {
    id: "relic_whetstone",
    name: "Dwarven Whetstone",
    type: "Relic",
    rarity: "Uncommon",
    attackMultiplier: 0.12,
    hpMultiplier: 0.0,
    description: "+12% Attack",
  },
  {
    id: "comp_valkyrie",
    name: "Shieldmaiden",
    type: "Companion",
    rarity: "Rare",
    attackMultiplier: 0.15,
    hpMultiplier: 0.25,
    description: "+15% Attack, +25% HP",
  },
  {
    id: "relic_heart",
    name: "Dragon Heart",
    type: "Relic",
    rarity: "Epic",
    attackMultiplier: 0.3,
    hpMultiplier: 0.4,
    description: "+30% Attack, +40% HP",
  },
  {
    id: "comp_phoenix",
    name: "Solar Phoenix",
    type: "Companion",
    rarity: "Legendary",
    attackMultiplier: 0.75,
    hpMultiplier: 0.75,
    description: "+75% Attack & HP",
  },
];
