import type { GameState } from "../types/game";

const STORAGE_KEY = "anvil_hero_rpg_save_v1";
const MAX_OFFLINE_SECONDS = 8 * 60 * 60; // Cap offline rewards at 8 hours

// Default state for a brand-new player
export const INITIAL_GAME_STATE: GameState = {
  stage: 1,
  wave: 1,
  gold: 50,
  gems: 100, // Enough for 1 introductory Gacha pull
  hammers: 10,
  anvilLevel: 1,
  pullsSinceLegendary: 0,
  equipped: {
    Weapon: null,
    Armor: null,
    Helmet: null,
  },
  ownedGachaIds: [],
  lastSavedTime: Date.now(),
};

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

    const parsed: GameState = { ...INITIAL_GAME_STATE, ...JSON.parse(raw) };
    const elapsedMs = Math.max(0, Date.now() - parsed.lastSavedTime);
    const cappedSeconds = Math.min(
      Math.floor(elapsedMs / 1000),
      MAX_OFFLINE_SECONDS,
    );

    // Idle gold formula: 2 gold/sec scaled exponentially by current stage
    const goldPerSecond = 2 * Math.pow(1.35, parsed.stage - 1);
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
