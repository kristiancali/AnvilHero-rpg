import React from "react";
import type { Enemy } from "../types/game";
import { getEnvironmentForStage } from "../data/environments";

interface CombatArenaProps {
  stage: number;
  wave: number;
  heroHp: number;
  heroMaxHp: number;
  heroAttack: number;
  enemy: Enemy;
  combatLog: string;
}

export const CombatArena: React.FC<CombatArenaProps> = ({
  stage,
  wave,
  heroHp,
  heroMaxHp,
  heroAttack,
  enemy,
  combatLog,
}) => {
  const env = getEnvironmentForStage(stage);
  const heroHpPct = Math.max(0, Math.min(100, (heroHp / heroMaxHp) * 100));
  const enemyHpPct = Math.max(
    0,
    Math.min(100, (enemy.currentHp / enemy.maxHp) * 100),
  );

  return (
    // Added bg-cover, bg-center, and inline backgroundImage to display the biome artwork
    <div
      className={`rounded-xl bg-gradient-to-br ${env.bgGradient} bg-cover bg-center border border-slate-700 shadow-lg overflow-hidden`}
      style={{ backgroundImage: `url(${env.bgImage})` }}
    >
      {/* Semi-transparent dark overlay so text and HP bars remain readable over the artwork */}
      <div className="bg-slate-950/60 p-5">
        {/* Stage & Wave Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-300">
              {env.name}
            </span>
            <h2 className="text-xl font-bold text-white">
              Stage {stage} — {enemy.isBoss ? "BOSS WAVE" : `Wave ${wave}/5`}
            </h2>
          </div>
          {enemy.isBoss && (
            <span className="px-3 py-1 text-xs font-bold bg-red-600 text-white rounded-full animate-pulse">
              BOSS
            </span>
          )}
        </div>

        {/* Combatants Grid */}
        <div className="grid grid-cols-2 gap-6 my-4">
          {/* Hero Card */}
          <div className="bg-slate-900/85 p-4 rounded-lg border border-slate-700 flex flex-col items-center">
            {/* Added Hero Sprite with pixelated rendering for crisp pixel art */}
            <img
              src="/images/hero.png"
              alt="Anvil Hero"
              className="w-24 h-24 object-contain [image-rendering:pixelated] mb-2"
            />
            <div className="w-full flex justify-between text-sm font-semibold text-sky-300 mb-1">
              <span>Anvil Hero</span>
              <span>ATK: {heroAttack}</span>
            </div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-200"
                style={{ width: `${heroHpPct}%` }}
              />
            </div>
            <div className="w-full text-xs text-slate-300 mt-1 text-right">
              {heroHp} / {heroMaxHp} HP
            </div>
          </div>

          {/* Enemy Card */}
          <div className="bg-slate-900/85 p-4 rounded-lg border border-slate-700 flex flex-col items-center">
            {/* Added Dynamic Enemy Sprite loaded from enemy.image */}
            <img
              src={enemy.image}
              alt={enemy.name}
              className="w-24 h-24 object-contain [image-rendering:pixelated] mb-2"
            />
            <div className="w-full flex justify-between text-sm font-semibold text-rose-300 mb-1">
              <span>{enemy.name}</span>
              <span>
                Lv.{enemy.level} {enemy.name}
              </span>
              <span>ATK: {enemy.attack}</span>
            </div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
              <div
                className="bg-rose-500 h-full transition-all duration-200"
                style={{ width: `${enemyHpPct}%` }}
              />
            </div>
            <div className="w-full text-xs text-slate-300 mt-1 text-right">
              {enemy.currentHp} / {enemy.maxHp} HP
            </div>
          </div>
        </div>

        {/* Live Combat Ticker */}
        <div className="text-center text-xs text-slate-300 bg-black/50 py-2 px-3 rounded">
          {combatLog}
        </div>
      </div>
    </div>
  );
};
