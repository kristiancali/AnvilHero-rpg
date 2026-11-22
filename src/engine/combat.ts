import type { Enemy, GameState } from "../types/game";
import { getEnvironmentForStage } from "../data/environments";
import { GACHA_POOL } from "../data/gachaPool";

// Exponential scaling factor per stage (Base * 1.45^stage)
const STAGE_SCALING_BASE = 1.45;

// Calculates total Hero Attack and Max HP from base stats, gear, and Gacha bonuses
export function calculateHeroStats(state: GameState): {
  attack: number;
  maxHp: number;
} {
  let baseAttack = 15;
  let baseHp = 120;

  // Sum flat bonuses from equipped gear
  Object.values(state.equipped).forEach((item) => {
    if (item) {
      baseAttack += item.attackBonus;
      baseHp += item.hpBonus;
    }
  });

  // Sum percentage multipliers from owned Gacha companions/relics
  let atkMult = 1;
  let hpMult = 1;
  state.ownedGachaIds.forEach((id) => {
    const gacha = GACHA_POOL.find((g) => g.id === id);
    if (gacha) {
      atkMult += gacha.attackMultiplier;
      hpMult += gacha.hpMultiplier;
    }
  });

  return {
    attack: Math.round(baseAttack * atkMult),
    maxHp: Math.round(baseHp * hpMult),
  };
}

// Generates an enemy for the current stage and wave (wave 5 spawns a Boss)
export function spawnEnemy(stage: number, wave: number): Enemy {
  const env = getEnvironmentForStage(stage);
  const isBoss = wave === 5;
  const stageMultiplier = Math.pow(STAGE_SCALING_BASE, stage - 1);
  const bossMultiplier = isBoss ? 3.2 : 1.0; // Bosses have 3.2x HP and 1.8x Attack

  const maxHp = Math.round(45 * stageMultiplier * bossMultiplier);
  const attack = Math.round(6 * stageMultiplier * (isBoss ? 1.8 : 1.0));
  const goldReward = Math.round(10 * stageMultiplier * (isBoss ? 4 : 1));
  const gemReward = isBoss ? 25 : 0; // Gems are exclusively earned from defeating bosses

  const chosen = isBoss
    ? env.boss
    : env.mobs[Math.floor(Math.random() * env.mobs.length)];

  return {
    name: chosen.name,
    image: chosen.image,
    maxHp,
    currentHp: maxHp,
    attack,
    goldReward,
    gemReward,
    isBoss,
  };
}
