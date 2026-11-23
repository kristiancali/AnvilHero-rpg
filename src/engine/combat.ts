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
  const enemyLevel = (stage - 1) * 5 + wave; // Increases by +1 every wave

  const stageMultiplier = Math.pow(STAGE_SCALING_BASE, stage - 1);
  // Slight extra scaling per wave level so each wave feels noticeably stronger
  const waveLevelMultiplier = 1 + (wave - 1) * 0.1;
  const bossMultiplier = isBoss ? 3.2 : 1.0;

  const chosen = isBoss
    ? env.boss
    : env.mobs[Math.floor(Math.random() * env.mobs.length)];

  const maxHp = Math.round(
    45 * stageMultiplier * waveLevelMultiplier * bossMultiplier,
  );
  const attack = Math.round(
    6 * stageMultiplier * waveLevelMultiplier * (isBoss ? 1.8 : 1.0),
  );
  const goldReward = Math.round(
    10 * stageMultiplier * waveLevelMultiplier * (isBoss ? 4 : 1),
  );
  const gemReward = isBoss ? 25 : 0;

  return {
    name: chosen.name,
    image: chosen.image,
    level: enemyLevel,
    maxHp,
    currentHp: maxHp,
    attack,
    goldReward,
    gemReward,
    isBoss,
  };
}
