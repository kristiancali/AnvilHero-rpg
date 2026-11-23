import type {
  Equipment,
  EquipmentSlot,
  GachaItem,
  Rarity,
} from "../types/game";
import {
  GACHA_POOL,
  GACHA_WEIGHTS,
  LEGENDARY_PITY_CAP,
} from "../data/gachaPool";

const RARITY_ORDER: Rarity[] = [
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Legendary",
  "Mythic",
];

// Base rarity stat multipliers for crafted gear
const RARITY_MULTIPLIERS: Record<Rarity, number> = {
  Common: 1.0,
  Uncommon: 1.5,
  Rare: 2.3,
  Epic: 3.5,
  Legendary: 5.5,
  Mythic: 9.0,
};

/**
 * Computes normalized drop percentages (0 - 100%) for each rarity at a given Anvil Level.
 * As anvilLevel rises:
 * - Common decays exponentially toward a 5% floor
 * - Higher tiers (Rare, Epic, Legendary, Mythic) unlock and scale upward
 */
export function getAnvilDropRates(anvilLevel: number): Record<Rarity, number> {
  const lvl = Math.max(1, anvilLevel);

  // Raw weights per level (Common shrinks rapidly; higher tiers unlock at milestone levels)
  const rawWeights: Record<Rarity, number> = {
    Common: Math.max(5, 70 * Math.pow(0.84, lvl - 1)),
    Uncommon: Math.max(12, 22 + (lvl <= 5 ? lvl * 1.5 : 7.5 - (lvl - 5) * 0.4)),
    Rare: 6 + (lvl - 1) * 2.2,
    Epic: lvl >= 2 ? 1.5 + (lvl - 2) * 1.4 : 0, // Unlocks at Anvil Lv. 2
    Legendary: lvl >= 4 ? 0.5 + (lvl - 4) * 0.75 : 0, // Unlocks at Anvil Lv. 4
    Mythic: lvl >= 7 ? 0.1 + (lvl - 7) * 0.35 : 0, // Unlocks at Anvil Lv. 7
  };

  // Normalize weights so the returned values always sum to exactly 100%
  const totalWeight = Object.values(rawWeights).reduce((sum, w) => sum + w, 0);

  const percentages = {} as Record<Rarity, number>;
  for (const rarity of RARITY_ORDER) {
    percentages[rarity] = Number(
      ((rawWeights[rarity] / totalWeight) * 100).toFixed(2),
    );
  }

  return percentages;
}

/**
 * Rolls a rarity tier using a Cumulative Distribution Function (CDF)
 * directly over the 0-100% drop rates.
 */
export function rollRarityCDF(rates: Record<Rarity, number>): Rarity {
  const total = RARITY_ORDER.reduce((sum, r) => sum + rates[r], 0);
  const roll = Math.random() * total;

  let cumulative = 0;
  for (const rarity of RARITY_ORDER) {
    cumulative += rates[rarity];
    if (roll < cumulative) {
      return rarity;
    }
  }
  return "Common";
}

// Forges a new piece of equipment scaled by AnvilLevel and rolled Rarity
export function forgeEquipment(
  anvilLevel: number,
  itemLevel: number,
): Equipment {
  const dropRates = getAnvilDropRates(anvilLevel);
  const rarity = rollRarityCDF(dropRates);

  const slots: EquipmentSlot[] = [
    "Weapon",
    "Armor",
    "Helmet",
    "Boots",
    "Ring",
    "Necklace",
    "Gloves",
    "Shield",
  ];
  const slot = slots[Math.floor(Math.random() * slots.length)];

  const levelScale = 1 + (itemLevel - 1) * 0.08;
  const powerScale =
    Math.pow(1.25, anvilLevel - 1) * RARITY_MULTIPLIERS[rarity] * levelScale;

  const isOffensive = slot === "Weapon" || slot === "Ring";
  const isBalanced = slot === "Necklace";

  const attackBonus = isOffensive
    ? Math.round(12 * powerScale)
    : isBalanced
      ? Math.round(8 * powerScale)
      : Math.round(3 * powerScale);

  const hpBonus =
    !isOffensive && !isBalanced
      ? Math.round(60 * powerScale)
      : isBalanced
        ? Math.round(40 * powerScale)
        : Math.round(15 * powerScale);

  const deffenceBonus =
    !isOffensive && !isBalanced
      ? Math.round(60 * powerScale)
      : isBalanced
        ? Math.round(40 * powerScale)
        : Math.round(15 * powerScale);

  const sellValue = Math.round(15 * powerScale);

  return {
    id: crypto.randomUUID(),
    name: `${rarity} ${slot}`,
    slot,
    rarity,
    level: itemLevel,
    attackBonus,
    hpBonus,
    deffenceBonus,
    sellValue,
  };
}

// Helper to calculate continuous world/wave level: Stage 1 Wave 1 = Lv. 1, Stage 1 Wave 2 = Lv. 2, etc.
export function getCurrentWorldLevel(stage: number, wave: number): number {
  return (stage - 1) * 5 + wave;
}

/**
 * Executes a single Gacha summon with hard pity enforcement.
 * Returns both the pulled item and the updated pity counter.
 */
export function pullGacha(pullsSinceLegendary: number): {
  item: GachaItem;
  newPityCount: number;
} {
  const nextPullNumber = pullsSinceLegendary + 1;
  // Guarantee Legendary if hard pity cap (50) is reached
  const rolledRarity: Rarity =
    nextPullNumber >= LEGENDARY_PITY_CAP
      ? "Legendary"
      : rollRarityCDF(GACHA_WEIGHTS);

  // Filter pool by rolled rarity (fallback to full pool if a tier has no items)
  const candidates = GACHA_POOL.filter((item) => item.rarity === rolledRarity);
  const pool = candidates.length > 0 ? candidates : GACHA_POOL;
  const item = pool[Math.floor(Math.random() * pool.length)];

  return {
    item,
    // Reset pity counter to 0 on Legendary drop; otherwise increment
    newPityCount: item.rarity === "Legendary" ? 0 : nextPullNumber,
  };
}
