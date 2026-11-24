import React from "react";
import type { Enemy } from "../types/game";
import type { FloatingDamage } from "../App";
import { getEnvironmentForStage } from "../data/environments";
import { formatNumber } from "../utils/format";

interface CombatArenaProps {
  stage: number;
  wave: number;
  heroCurrentHp: number;
  heroMaxHp: number;
  enemies: Enemy[];
  floatingDamages: FloatingDamage[];
}

export const CombatArena: React.FC<CombatArenaProps> = ({
  stage,
  heroCurrentHp,
  heroMaxHp,
  enemies,
  floatingDamages,
}) => {
  const env = getEnvironmentForStage(stage);
  const heroHpPct = Math.max(
    0,
    Math.min(100, (heroCurrentHp / heroMaxHp) * 100),
  );

  return (
    <div className="absolute inset-0 w-full h-full">
      {/* Full-Screen Biome Artwork */}
      <img
        src={env.backgroundImage}
        alt={env.name}
        className="w-full h-full object-cover [image-rendering:pixelated] brightness-90"
      />
      {/* Subtle top and bottom gradients so HUD controls stand out cleanly */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-slate-950/45" />

      {/* HERO (Left Side - Gold H in sketch, no box, no name) */}
      <div className="absolute left-[30%] bottom-[50%] z-10 flex -translate-x-1/2 flex-col items-center">
        {/* Compact Floating Health Bar */}
        <div className="w-28 h-2.5 bg-slate-950/80 border border-slate-700/80 rounded-full overflow-hidden mb-2 shadow-md">
          <div
            className="h-full bg-emerald-400 transition-all duration-200"
            style={{ width: `${heroHpPct}%` }}
          />
        </div>

        {/* Hero Sprite */}
        <img
          src="/images/hero.png"
          alt=""
          className="w-28 h-28 object-contain [image-rendering:pixelated] drop-shadow-[0_10px_12px_rgba(0,0,0,0.85)]"
        />
      </div>

      {/* WALKING MOBS (Right Side - Red M in sketch, walking left toward Hero) */}
      {enemies
        .filter((enemy) => enemy.currentHp > 0)
        .map((enemy) => {
          const enemyHpPct = Math.max(
            0,
            Math.min(100, (enemy.currentHp / enemy.maxHp) * 100),
          );
          return (
            <div
              key={enemy.id}
              style={{ left: `${enemy.position}%` }}
              className="absolute bottom-[50%] z-10 flex -translate-x-1/2 flex-col items-center transition-all duration-700 ease-linear"
            >
              <div
                className={`mb-2 overflow-hidden rounded-full border border-slate-700/80 bg-slate-950/80 shadow-md ${
                  enemy.isBoss ? "h-3 w-36" : "h-2 w-16 sm:w-24"
                }`}
              >
                <div
                  className="h-full bg-rose-500 transition-all duration-200"
                  style={{ width: `${enemyHpPct}%` }}
                />
              </div>
              <img
                src={enemy.image}
                alt=""
                className={`object-contain [image-rendering:pixelated] drop-shadow-[0_10px_12px_rgba(0,0,0,0.85)] ${
                  enemy.isBoss ? "h-36 w-36" : "h-12 w-12 sm:h-24 sm:w-24"
                }`}
              />
            </div>
          );
        })}

      {/* FLOATING DAMAGE NUMBERS */}
      {floatingDamages.map((dmg) => (
        <div
          key={dmg.id}
          style={{ left: `${dmg.xPercent}%` }}
          className={`absolute bottom-[54%] -translate-x-1/2 pointer-events-none font-black text-xl tracking-tight animate-bounce drop-shadow-[0_2px_4px_rgba(0,0,0,1)] z-20 ${
            dmg.isHeroTarget ? "text-rose-400" : "text-amber-300"
          }`}
        >
        {dmg.label ?? `-${formatNumber(dmg.amount)}`}
        </div>
      ))}
    </div>
  );
};
