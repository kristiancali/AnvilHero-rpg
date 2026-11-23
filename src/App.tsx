import React, { useEffect, useRef, useState } from "react";
import type { Equipment, GameState, GachaItem } from "./types/game";
import { calculateHeroStats, spawnEnemy } from "./engine/combat";
import { loadGame, saveGame } from "./engine/storage";
import { CombatArena } from "./components/CombatArena";
import { AnvilPanel } from "./components/AnvilPanel";
import { GachaModal } from "./components/GachaModal";
import { getCurrentWorldLevel } from "./engine/rng";

const COMBAT_TICK_MS = 800; // Fixed-timestep combat tick interval (0.8 seconds)

export default function App() {
  // Initialize state from localStorage and compute offline idle rewards once
  const [initialLoad] = useState(() => loadGame());
  const [gameState, setGameState] = useState<GameState>(initialLoad.state);
  const [offlineBanner, setOfflineBanner] = useState<string | null>(
    initialLoad.offlineGold > 0
      ? `Welcome back! You earned ${initialLoad.offlineGold} Gold while away (${Math.floor(
          initialLoad.offlineSeconds / 60,
        )}m).`
      : null,
  );

  // Derived hero stats based on equipped gear and Gacha multipliers
  const heroStats = calculateHeroStats(gameState);

  // Active combat entities (ephemeral state reset on wave/stage transitions)
  const [heroHp, setHeroHp] = useState<number>(heroStats.maxHp);
  const [enemy, setEnemy] = useState(() =>
    spawnEnemy(gameState.stage, gameState.wave),
  );
  const [combatLog, setCombatLog] = useState<string>(
    "Entering the battlefield...",
  );
  const [isGachaOpen, setIsGachaOpen] = useState<boolean>(false);

  // Keep a mutable ref to latest state for the fixed-timestep interval
  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  // Auto-save whenever persistent GameState updates
  useEffect(() => {
    saveGame(gameState);
  }, [gameState]);

  // Fixed-timestep Auto-Combat Loop
  useEffect(() => {
    const timer = setInterval(() => {
      const current = stateRef.current;
      const stats = calculateHeroStats(current);

      setEnemy((prevEnemy) => {
        // 1. Hero attacks Enemy
        const nextEnemyHp = prevEnemy.currentHp - stats.attack;

        if (nextEnemyHp <= 0) {
          // Enemy defeated: award gold, gems (if boss), and advance wave/stage
          const defeatedBoss = prevEnemy.isBoss;
          const nextWave = defeatedBoss ? 1 : current.wave + 1;
          const nextStage = defeatedBoss ? current.stage + 1 : current.stage;

          setGameState((prev) => ({
            ...prev,
            stage: nextStage,
            wave: nextWave,
            gold: prev.gold + prevEnemy.goldReward,
            gems: prev.gems + prevEnemy.gemReward,
            // Grant 1 bonus hammer on boss kill
            hammers: prev.hammers + (defeatedBoss ? 1 : 0),
          }));

          setHeroHp(stats.maxHp); // Heal hero between waves
          setCombatLog(
            `Defeated ${prevEnemy.name}! +${prevEnemy.goldReward}g${
              prevEnemy.gemReward > 0 ? ` & +${prevEnemy.gemReward} Gems` : ""
            }`,
          );

          return spawnEnemy(nextStage, nextWave);
        }

        // 2. Enemy counter-attacks Hero
        setHeroHp((prevHeroHp) => {
          const nextHeroHp = prevHeroHp - prevEnemy.attack;

          if (nextHeroHp <= 0) {
            // Hero defeated: reset current stage back to Wave 1
            setGameState((prev) => ({ ...prev, wave: 1 }));
            setEnemy(spawnEnemy(current.stage, 1));
            setCombatLog(
              `Defeated by ${prevEnemy.name}! Retreating to Wave 1...`,
            );
            return stats.maxHp;
          }

          setCombatLog(
            `Hero hits for ${stats.attack} DMG | ${prevEnemy.name} hits for ${prevEnemy.attack} DMG`,
          );
          return nextHeroHp;
        });

        return { ...prevEnemy, currentHp: nextEnemyHp };
      });
    }, COMBAT_TICK_MS);

    return () => clearInterval(timer);
  }, []);

  // Handlers for Anvil & Gacha interactions
  const handleEquipItem = (item: Equipment) => {
    setGameState((prev) => ({
      ...prev,
      equipped: { ...prev.equipped, [item.slot]: item },
    }));
  };

  const handleSummonComplete = (
    item: GachaItem,
    newPityCount: number,
    cost: number,
  ) => {
    setGameState((prev) => ({
      ...prev,
      gems: prev.gems - cost,
      pullsSinceLegendary: newPityCount,
      ownedGachaIds: prev.ownedGachaIds.includes(item.id)
        ? prev.ownedGachaIds
        : [...prev.ownedGachaIds, item.id],
    }));
  };

  const currentItemLevel = getCurrentWorldLevel(
    gameState.stage,
    gameState.wave,
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 flex justify-center">
      <div className="max-w-2xl w-full space-y-5">
        {/* Top Currency & Navigation Bar */}
        <header className="flex flex-wrap justify-between items-center gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
          <h1 className="text-xl font-extrabold tracking-tight text-amber-400">
            AnvilHero RPG
          </h1>
          <div className="flex items-center gap-4 text-sm font-semibold">
            <span className="text-amber-300">
              {" "}
              <img //gold image || {gameState.gold} gold value
                src="/images/ui/gold.png"
                className="w-8 h-8 inline [image-rendering:pixelated]"
              />{" "}
              {gameState.gold}
            </span>
            <span className="text-indigo-300">
              {" "}
              <img
                src="/images/ui/gem.png"
                className="w-8 h-8 inline [image-rendering:pixelated]"
              />{" "}
              {gameState.gems}
            </span>
            <button
              onClick={() => setIsGachaOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
            >
              Summon ({gameState.pullsSinceMythic}/50)
            </button>
          </div>
        </header>

        {/* Offline Idle Gold Notification */}
        {offlineBanner && (
          <div className="flex justify-between items-center bg-emerald-950/80 border border-emerald-600 text-emerald-200 px-4 py-2.5 rounded-lg text-xs">
            <span>{offlineBanner}</span>
            <button
              onClick={() => setOfflineBanner(null)}
              className="font-bold ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Auto-Combat Viewport */}
        <CombatArena
          stage={gameState.stage}
          wave={gameState.wave}
          heroHp={heroHp}
          heroMaxHp={heroStats.maxHp}
          heroAttack={heroStats.attack}
          enemy={enemy}
          combatLog={combatLog}
        />

        {/* Blacksmith Anvil & Equipment Management */}
        <AnvilPanel
          hammers={gameState.hammers}
          gold={gameState.gold}
          anvilLevel={gameState.anvilLevel}
          equipped={gameState.equipped}
          currentItemLevel={currentItemLevel}
          onConsumeHammer={() =>
            setGameState((prev) => ({
              ...prev,
              hammers: Math.max(0, prev.hammers - 1),
            }))
          }
          onEquipItem={handleEquipItem}
          onSellItem={(goldGained) =>
            setGameState((prev) => ({ ...prev, gold: prev.gold + goldGained }))
          }
          onUpgradeAnvil={(cost) =>
            setGameState((prev) => ({
              ...prev,
              gold: prev.gold - cost,
              anvilLevel: prev.anvilLevel + 1,
            }))
          }
          onBuyHammers={(cost, amount) =>
            setGameState((prev) => ({
              ...prev,
              gold: prev.gold - cost,
              hammers: prev.hammers + amount,
            }))
          }
        />

        {/* Gacha Summon Modal */}
        <GachaModal
          isOpen={isGachaOpen}
          onClose={() => setIsGachaOpen(false)}
          gems={gameState.gems}
          pullsSinceLegendary={gameState.pullsSinceMythic}
          ownedGachaIds={gameState.ownedGachaIds}
          onSummonComplete={handleSummonComplete}
        />
      </div>
    </div>
  );
}
