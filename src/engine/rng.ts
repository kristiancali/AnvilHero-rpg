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

// Base rarity stat multipliers for crafted gear
const RARITY_MULTIPLIERS: Record<Rarity, number> = {
  Common: 1.0,
  Uncommon: 1.5,
  Rare: 2.3,
  Epic: 3.5,
  Legendary: 5.5,
};

// Dynamic rarity weights based on Anvil Level (higher anvil = better odds)
export function getAnvilWeights(anvilLevel: number): Record<Rarity, number> {
  return {
    Common: Math.max(10, 65 - anvilLevel * 4),
    Uncommon: 25,
    Rare: 7 + anvilLevel * 2,
    Epic: 2.5 + anvilLevel * 1.2,
    Legendary: 0.5 + anvilLevel * 0.8,
  };
}

/**
 * Rolls a rarity tier using a Cumulative Distribution Function (CDF).
 * Sums all weights, picks a uniform random number in [0, totalWeight),
 * and iterates through cumulative thresholds until the target bucket is hit.
 */
export function rollRarityCDF(weights: Record<Rarity, number>): Rarity {
  const entries = Object.entries(weights) as [Rarity, number][];
  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
  const roll = Math.random() * totalWeight;

  let cumulative = 0;
  for (const [rarity, weight] of entries) {
    cumulative += weight;
    if (roll < cumulative) {
      return rarity;
    }
  }
  return "Common"; // Fallback safety return
}

// Forges a new piece of equipment scaled by AnvilLevel and rolled Rarity
export function forgeEquipment(anvilLevel: number): Equipment {
  const weights = getAnvilWeights(anvilLevel);
  const rarity = rollRarityCDF(weights);

  const slots: EquipmentSlot[] = ["Weapon", "Armor", "Helmet"];
  const slot = slots[Math.floor(Math.random() * slots.length)];

  // Exponential scaling per anvil level multiplied by rarity tier
  const powerScale =
    Math.pow(1.25, anvilLevel - 1) * RARITY_MULTIPLIERS[rarity];

  const attackBonus =
    slot === "Weapon"
      ? Math.round(12 * powerScale)
      : Math.round(3 * powerScale);
  const hpBonus =
    slot !== "Weapon"
      ? Math.round(60 * powerScale)
      : Math.round(15 * powerScale);
  const sellValue = Math.round(15 * powerScale);

  return {
    id: crypto.randomUUID(),
    name: `${rarity} ${slot}`,
    slot,
    rarity,
    attackBonus,
    hpBonus,
    sellValue,
  };
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
