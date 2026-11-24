import type { Enemy, GameState } from "../types/game";
import { getEnvironmentForStage } from "../data/environments";
import { rollLevelVariance } from "./rng";

// Calculates the hero's combat stats from level, allocations, and equipped gear.
export function calculateHeroStats(state: GameState): {
  attack: number;
  maxHp: number;
  defense: number;
  critChance: number;
  critDamage: number;
  dodgeChance: number;
  attackIntervalMs: number;
} {
  let baseAttack =
    15 + (state.heroLevel - 1) * 3 + state.allocatedStats.attack * 3;
  let baseHp =
    120 + (state.heroLevel - 1) * 20 + state.allocatedStats.hp * 20;
  let defense = state.allocatedStats.defense * 2;
  let critChance = state.allocatedStats.crit * 0.02;
  let critDamage = 50;
  let dodgeChance = 0;

  Object.values(state.equipped).forEach((item) => {
    if (item) {
      baseAttack += item.attackBonus;
      baseHp += item.hpBonus;
      defense += item.defense;
      critChance += item.critRate / 100;
      critDamage += item.critDamage;
      dodgeChance += item.dodgeChance / 100;
    }
  });

  return {
    attack: Math.round(baseAttack),
    maxHp: Math.round(baseHp),
    defense,
    critChance: Math.min(0.75, critChance),
    critDamage,
    dodgeChance: Math.min(0.6, dodgeChance),
    attackIntervalMs: Math.max(
      400,
      Math.round(800 / (1 + state.allocatedStats.crit * 0.05)),
    ),
  };
}

export function getXpToNextLevel(level: number): number {
  return Math.round(100 * Math.pow(1.28, level - 1));
}

export function awardExperience(
  state: GameState,
  amount: number,
): Pick<GameState, "heroLevel" | "xp" | "xpToNextLevel" | "statPoints"> & {
  levelsGained: number;
} {
  let heroLevel = state.heroLevel;
  let xp = state.xp + amount;
  let xpToNextLevel = state.xpToNextLevel;
  let statPoints = state.statPoints;
  let levelsGained = 0;

  while (xp >= xpToNextLevel) {
    xp -= xpToNextLevel;
    heroLevel += 1;
    xpToNextLevel = getXpToNextLevel(heroLevel);
    statPoints += 3;
    levelsGained += 1;
  }

  return { heroLevel, xp, xpToNextLevel, statPoints, levelsGained };
}

// Wave 5 is the stage boss; regular waves spawn a group of 2 to 4 mobs.
export function spawnWaveEnemies(
  stage: number,
  wave: number,
  heroLevel: number,
): Enemy[] {
  const env = getEnvironmentForStage(stage);
  const isBoss = wave === 5;
  const count = isBoss ? 1 : 2 + Math.floor(Math.random() * 3);
  const enemies: Enemy[] = [];

  for (let i = 0; i < count; i++) {
    const enemyLevel = rollLevelVariance(heroLevel);
    const chosen = isBoss
      ? env.boss
      : env.mobs[Math.floor(Math.random() * env.mobs.length)];

    const packModifier = isBoss ? 3.2 : count === 2 ? 0.65 : 0.5;
    const maxHp = Math.round((35 + enemyLevel * 15) * packModifier * (isBoss ? 2.5 : 1));
    const attack = Math.round((5 + enemyLevel * 2) * (isBoss ? 1.5 : 1));
    const goldReward = Math.round((10 + enemyLevel * 4) * (isBoss ? 4 : 1));
    const xpReward = Math.round((20 + enemyLevel * 10) * (isBoss ? 4.5 : 1));

    enemies.push({
      id: crypto.randomUUID(),
      name: chosen.name,
      image: chosen.image,
      level: enemyLevel,
      maxHp,
      currentHp: maxHp,
      attack,
      goldReward,
      xpReward,
      hammerDropChance: isBoss ? 1 : 0.3,
      isBoss,
      position: isBoss ? 78 : 50 + i * 15,
    });
  }

  return enemies;
}
