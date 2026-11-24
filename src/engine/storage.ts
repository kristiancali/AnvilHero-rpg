import type { Equipment, EquipmentSlot, GameState, Rarity } from "../types/game";

const STORAGE_KEY = "anvil_hero_rpg_save_v1";
const MAX_OFFLINE_SECONDS = 8 * 60 * 60; // Cap offline rewards at 8 hours

// Default state for a brand-new player
export const INITIAL_GAME_STATE: GameState = {
  stage: 1,
  wave: 1,
  enemies: [],
  gold: 50,
  hammers: 10,
  anvilLevel: 1,
  equipped: {
    Weapon: null,
    Armor: null,
    Helmet: null,
    Ring: null,
    Shield: null,
    Boots: null,
    Necklace: null,
    Gloves: null,
  },
  lastSavedTime: Date.now(),
  heroLevel: 1,
  xp: 0,
  xpToNextLevel: 100,
  statPoints: 0,
  allocatedStats: {
    attack: 0,
    hp: 0,
    defense: 0,
    crit: 0,
  },
};

const EQUIPMENT_SLOTS: EquipmentSlot[] = [
  "Weapon",
  "Armor",
  "Helmet",
  "Ring",
  "Shield",
  "Boots",
  "Necklace",
  "Gloves",
];
const RARITIES: Rarity[] = [
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Legendary",
  "Mythic",
];

function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeEquipment(value: unknown, slot: EquipmentSlot): Equipment | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (
    typeof item.id !== "string" ||
    typeof item.name !== "string" ||
    typeof item.level !== "number" ||
    !RARITIES.includes(item.rarity as Rarity)
  ) {
    return null;
  }

  return {
    id: item.id,
    name: item.name,
    level: item.level,
    slot,
    rarity: item.rarity as Rarity,
    attackBonus: numberOr(item.attackBonus, 0),
    hpBonus: numberOr(item.hpBonus, 0),
    defense: numberOr(item.defense, numberOr(item.deffenceBonus, 0)),
    critRate: numberOr(item.critRate, 0),
    critDamage: numberOr(item.critDamage, 0),
    dodgeChance: numberOr(item.dodgeChance, 0),
    sellValue: numberOr(item.sellValue, 0),
  };
}

// Serializes and saves the current GameState to localStorage
export function saveGame(state: GameState): void {
  try {
    const payload: GameState = {
      ...state,
      lastSavedTime: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error("Failed to save game state:", err);
  }
}

/**
 * Loads saved state from localStorage and calculates offline idle gold.
 * Compares Date.now() - lastSavedTime (capped at 8 hours).
 */
export function loadGame(): {
  state: GameState;
  offlineGold: number;
  offlineSeconds: number;
} {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { state: INITIAL_GAME_STATE, offlineGold: 0, offlineSeconds: 0 };
    }

    const saved = JSON.parse(raw) as Record<string, unknown>;
    const heroLevel = Math.max(1, Math.floor(numberOr(saved.heroLevel, 1)));
    const oldStats =
      saved.allocatedStats && typeof saved.allocatedStats === "object"
        ? (saved.allocatedStats as Record<string, unknown>)
        : {};
    const oldEquipped =
      saved.equipped && typeof saved.equipped === "object"
        ? (saved.equipped as Record<string, unknown>)
        : {};
    const equipped = Object.fromEntries(
      EQUIPMENT_SLOTS.map((slot) => [
        slot,
        normalizeEquipment(oldEquipped[slot], slot),
      ]),
    ) as GameState["equipped"];
    const newSaveFormat = typeof saved.xpToNextLevel === "number";
    const enemies = newSaveFormat && Array.isArray(saved.enemies)
      ? saved.enemies
      : [];
    const xpToNextLevel = Math.max(
      1,
      numberOr(saved.xpToNextLevel, Math.round(100 * Math.pow(1.28, heroLevel - 1))),
    );
    const parsed: GameState = {
      ...INITIAL_GAME_STATE,
      stage: Math.max(1, Math.floor(numberOr(saved.stage, 1))),
      wave: Math.max(1, Math.min(5, Math.floor(numberOr(saved.wave, 1)))),
      enemies,
      gold: Math.max(0, numberOr(saved.gold, INITIAL_GAME_STATE.gold)),
      hammers: Math.max(0, numberOr(saved.hammers, INITIAL_GAME_STATE.hammers)),
      anvilLevel: Math.max(
        1,
        Math.floor(numberOr(saved.anvilLevel, INITIAL_GAME_STATE.anvilLevel)),
      ),
      heroLevel,
      xp: Math.max(0, numberOr(saved.xp, numberOr(saved.heroXp, 0))),
      xpToNextLevel,
      statPoints: Math.max(0, numberOr(saved.statPoints, 0)),
      lastSavedTime: numberOr(saved.lastSavedTime, Date.now()),
      allocatedStats: {
        attack: Math.max(0, numberOr(oldStats.attack, 0)),
        hp: Math.max(0, numberOr(oldStats.hp, 0)),
        defense: Math.max(0, numberOr(oldStats.defense, 0)),
        crit: Math.max(0, numberOr(oldStats.crit, 0)),
      },
      equipped,
    };
    const elapsedMs = Math.max(0, Date.now() - parsed.lastSavedTime);
    const cappedSeconds = Math.min(
      Math.floor(elapsedMs / 1000),
      MAX_OFFLINE_SECONDS,
    );

    const goldPerSecond = 2 + (parsed.stage - 1) * 0.5;
    const offlineGold = Math.floor(cappedSeconds * goldPerSecond);

    return {
      state: {
        ...parsed,
        gold: parsed.gold + offlineGold,
        lastSavedTime: Date.now(),
      },
      offlineGold,
      offlineSeconds: cappedSeconds,
    };
  } catch (err) {
    console.error("Failed to load game state, resetting:", err);
    return { state: INITIAL_GAME_STATE, offlineGold: 0, offlineSeconds: 0 };
  }
}
