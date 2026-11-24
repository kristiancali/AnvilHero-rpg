import type {
  Equipment,
  EquipmentSlot,
  Rarity,
} from "../types/game";

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
 */
export function getAnvilDropRates(anvilLevel: number): Record<Rarity, number> {
  const lvl = Math.max(1, anvilLevel);

  const rawWeights: Record<Rarity, number> = {
    Common: Math.max(0, 65 * Math.pow(0.78, lvl - 1)),
    Uncommon: Math.max(0, 25 * Math.pow(0.86, Math.max(0, lvl - 2))),
    Rare:
      lvl <= 15
        ? 8 + (lvl - 1) * 2.2
        : Math.max(2, 38.8 * Math.pow(0.92, lvl - 15)),
    Epic: lvl >= 2 ? 3 + (lvl - 2) * 2.4 : 0,
    Legendary: lvl >= 4 ? 1.2 + (lvl - 4) * 1.6 : 0,
    Mythic: lvl >= 6 ? 0.4 + (lvl - 6) * 0.95 : 0,
  };

  const totalWeight = Object.values(rawWeights).reduce((sum, w) => sum + w, 0);

  const percentages = {} as Record<Rarity, number>;
  for (const rarity of RARITY_ORDER) {
    percentages[rarity] = Number(
      ((rawWeights[rarity] / totalWeight) * 100).toFixed(2),
    );
  }

  const roundedTotal = Object.values(percentages).reduce(
    (sum, percentage) => sum + percentage,
    0,
  );
  const adjustmentTarget = RARITY_ORDER.reduce((highest, rarity) =>
    percentages[rarity] > percentages[highest] ? rarity : highest,
  );
  percentages[adjustmentTarget] = Number(
    (percentages[adjustmentTarget] + 100 - roundedTotal).toFixed(2),
  );

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

export function rollLevelVariance(heroLevel: number): number {
  const minimum = Math.max(1, heroLevel - 1);
  const maximum = heroLevel + 1;
  return minimum + Math.floor(Math.random() * (maximum - minimum + 1));
}

export function getAnvilUpgradeCost(anvilLevel: number): number {
  return Math.round(75 * Math.pow(Math.max(1, anvilLevel), 2));
}

type SecondaryBuff = "critRate" | "critDamage" | "defense" | "dodgeChance";

function rollSecondaryBuffs(
  slot: EquipmentSlot,
  level: number,
  rarity: Rarity,
): Pick<Equipment, SecondaryBuff> {
  const offensive = slot === "Weapon" || slot === "Gloves" || slot === "Ring";
  const defensive = slot === "Armor" || slot === "Shield" || slot === "Helmet";
  const weights: Record<SecondaryBuff, number> = offensive
    ? { critRate: 5, critDamage: 4, defense: 1, dodgeChance: 1 }
    : defensive
      ? { critRate: 1, critDamage: 1, defense: 5, dodgeChance: 2 }
      : { critRate: 3, critDamage: 1, defense: 2, dodgeChance: 5 };

  const rarityTier = RARITY_ORDER.indexOf(rarity);
  const levelBuffCount = level <= 10 ? 1 : level <= 25 ? 2 : 3;
  const rarityBuffCount = Math.floor(rarityTier / 2);
  const buffCount = Math.min(4, levelBuffCount + rarityBuffCount);
  const remaining = { ...weights };
  const result: Pick<Equipment, SecondaryBuff> = {
    critRate: 0,
    critDamage: 0,
    defense: 0,
    dodgeChance: 0,
  };
  const magnitude = (1 + level * 0.045) * (1 + rarityTier * 0.08);

  for (let i = 0; i < buffCount; i++) {
    const totalWeight = Object.values(remaining).reduce(
      (total, weight) => total + weight,
      0,
    );
    let roll = Math.random() * totalWeight;
    const stat = (Object.keys(remaining) as SecondaryBuff[]).find((key) => {
      roll -= remaining[key];
      return roll < 0;
    });
    if (!stat) break;
    remaining[stat] = 0;

    switch (stat) {
      case "critRate":
        result.critRate = Math.max(0, Number((magnitude * 1.4).toFixed(1)));
        break;
      case "critDamage":
        result.critDamage = Math.max(0, Number((magnitude * 3).toFixed(1)));
        break;
      case "defense":
        result.defense = Math.max(0, Math.round(magnitude * 3));
        break;
      case "dodgeChance":
        result.dodgeChance = Math.max(0, Number((magnitude * 0.8).toFixed(1)));
        break;
    }
  }

  return result;
}

// Forges gear at a level close to the hero's level, with slot-weighted buffs.
export function forgeEquipment(anvilLevel: number, heroLevel: number): Equipment {
  const dropRates = getAnvilDropRates(anvilLevel);
  const rarity = rollRarityCDF(dropRates);
  const level = rollLevelVariance(heroLevel);

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

  const offensive = slot === "Weapon" || slot === "Gloves" || slot === "Ring";
  const defensive = slot === "Armor" || slot === "Shield" || slot === "Helmet";
  const levelScale = 1 + (level - 1) * 0.04;
  const anvilScale = 1 + (anvilLevel - 1) * 0.07;
  const powerScale = levelScale * anvilScale * RARITY_MULTIPLIERS[rarity];
  const buffs = rollSecondaryBuffs(slot, level, rarity);
  const attackBonus = Math.round(
    (offensive ? 14 : defensive ? 3 : 8) * powerScale,
  );
  const hpBonus = Math.round(
    (defensive ? 55 : offensive ? 12 : 28) * powerScale,
  );
  const defense = Math.round(
    (defensive ? 8 : offensive ? 1 : 3) * powerScale + buffs.defense,
  );
  const sellValue = Math.min(
    1500,
    Math.round(
      15 *
        (1 + (level - 1) * 0.025) *
        (1 + (anvilLevel - 1) * 0.08) *
        Math.sqrt(RARITY_MULTIPLIERS[rarity]),
    ),
  );

  return {
    id: crypto.randomUUID(),
    name: `${rarity} ${slot}`,
    slot,
    rarity,
    level,
    attackBonus,
    hpBonus,
    ...buffs,
    defense,
    sellValue,
  };
}
