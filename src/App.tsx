import { useEffect, useRef, useState } from "react";
import type { Equipment, EquipmentSlot, GameState } from "./types/game";
import {
  awardExperience,
  calculateHeroStats,
  spawnWaveEnemies,
} from "./engine/combat";
import { loadGame, saveGame } from "./engine/storage";
import { CombatArena } from "./components/CombatArena";
import { AnvilPanel } from "./components/AnvilPanel";
import { getEnvironmentForStage } from "./data/environments";
import { formatNumber } from "./utils/format";

const COMBAT_TICK_MS = 800;
const STAT_OPTIONS = [
  ["attack", "Attack"],
  ["hp", "HP"],
  ["defense", "Defense"],
  ["crit", "Speed / Crit"],
] as const;

export interface FloatingDamage {
  id: string;
  amount: number;
  isHeroTarget: boolean;
  xPercent: number;
  label?: string;
}

export default function App() {
  const [initialLoad] = useState(() => loadGame());
  const [gameState, setGameState] = useState<GameState>(() => ({
    ...initialLoad.state,
    enemies:
      initialLoad.state.enemies.length > 0
        ? initialLoad.state.enemies
        : spawnWaveEnemies(
            initialLoad.state.stage,
            initialLoad.state.wave,
            initialLoad.state.heroLevel,
          ),
  }));
  const [offlineBanner, setOfflineBanner] = useState<string | null>(
    initialLoad.offlineGold > 0
      ? `Welcome back! You earned ${formatNumber(initialLoad.offlineGold)} Gold while away (${Math.floor(
          initialLoad.offlineSeconds / 60,
        )}m).`
      : null,
  );
  const heroStats = calculateHeroStats(gameState);
  const [heroHp, setHeroHp] = useState(heroStats.maxHp);
  const heroHpRef = useRef(heroStats.maxHp);
  const heroAttackElapsedRef = useRef(0);
  const [floatingDamages, setFloatingDamages] = useState<FloatingDamage[]>([]);
  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  useEffect(() => {
    saveGame(gameState);
  }, [gameState]);

  useEffect(() => {
    const timer = setInterval(() => {
      const current = stateRef.current;
      const stats = calculateHeroStats(current);
      let nextState = current;
      const nextEnemies = current.enemies.map((enemy) => ({ ...enemy }));
      const damageEvents: FloatingDamage[] = [];

      if (!nextEnemies.some((enemy) => enemy.currentHp > 0)) {
        nextState = {
          ...current,
          enemies: spawnWaveEnemies(
            current.stage,
            current.wave,
            current.heroLevel,
          ),
        };
        stateRef.current = nextState;
        setGameState(nextState);
        return;
      }

      heroAttackElapsedRef.current += COMBAT_TICK_MS;
      let leveledUp = false;
      while (
        heroAttackElapsedRef.current >= stats.attackIntervalMs &&
        nextEnemies.some((enemy) => enemy.currentHp > 0)
      ) {
        heroAttackElapsedRef.current -= stats.attackIntervalMs;
        const target = nextEnemies
          .filter((enemy) => enemy.currentHp > 0)
          .reduce((front, enemy) =>
            enemy.position < front.position ? enemy : front,
          );
        const isCritical = Math.random() < stats.critChance;
        const damage = Math.max(
          1,
          Math.round(
            stats.attack *
              (isCritical ? 1 + stats.critDamage / 100 : 1),
          ),
        );
        const targetIndex = nextEnemies.findIndex(
          (enemy) => enemy.id === target.id,
        );
        const updatedTarget = {
          ...target,
          currentHp: Math.max(0, target.currentHp - damage),
        };
        nextEnemies[targetIndex] = updatedTarget;
        damageEvents.push({
          id: crypto.randomUUID(),
          amount: damage,
          isHeroTarget: false,
          xPercent: target.position,
        });
        if (updatedTarget.currentHp === 0) {
          const hammerDrop = updatedTarget.isBoss
            ? 3 + Math.floor(Math.random() * 3)
            : Math.random() < updatedTarget.hammerDropChance
              ? 1 + Math.floor(Math.random() * 2)
              : 0;
          const {
            levelsGained,
            ...progression
          } = awardExperience(nextState, updatedTarget.xpReward);
          leveledUp ||= levelsGained > 0;
          nextState = {
            ...nextState,
            gold: nextState.gold + updatedTarget.goldReward,
            hammers: nextState.hammers + hammerDrop,
            ...progression,
          };
        }
      }

      const remainingEnemies = nextEnemies.filter(
        (enemy) => enemy.currentHp > 0,
      );
      if (remainingEnemies.length === 0) {
        const defeatedBoss = current.wave === 5;
        const nextStage = defeatedBoss ? current.stage + 1 : current.stage;
        const nextWave = defeatedBoss ? 1 : current.wave + 1;
        nextState = {
          ...nextState,
          stage: nextStage,
          wave: nextWave,
          enemies: spawnWaveEnemies(
            nextStage,
            nextWave,
            nextState.heroLevel,
          ),
        };
        const fullHp = calculateHeroStats(nextState).maxHp;
        heroHpRef.current = fullHp;
        setHeroHp(fullHp);
        heroAttackElapsedRef.current = 0;
      } else {
        nextState = { ...nextState, enemies: nextEnemies };
        if (leveledUp) {
          const fullHp = calculateHeroStats(nextState).maxHp;
          heroHpRef.current = fullHp;
          setHeroHp(fullHp);
        }

        let incomingDamage = 0;
        const mitigation = Math.min(
          0.8,
          stats.defense / (stats.defense + 100),
        );
        remainingEnemies.forEach((enemy) => {
          if (Math.random() < stats.dodgeChance) {
            damageEvents.push({
              id: crypto.randomUUID(),
              amount: 0,
              isHeroTarget: true,
              xPercent: 18,
              label: "DODGE!",
            });
            return;
          }
          const damage = Math.max(
            1,
            Math.ceil(enemy.attack * Math.max(0.2, 1 - mitigation)),
          );
          incomingDamage += damage;
          damageEvents.push({
            id: crypto.randomUUID(),
            amount: damage,
            isHeroTarget: true,
            xPercent: 18,
          });
        });

        if (incomingDamage > 0) {
          const hpAfterAttacks = heroHpRef.current - incomingDamage;
          if (hpAfterAttacks <= 0) {
            nextState = {
              ...nextState,
              wave: 1,
              enemies: spawnWaveEnemies(
                current.stage,
                1,
                nextState.heroLevel,
              ),
            };
            const fullHp = calculateHeroStats(nextState).maxHp;
            heroHpRef.current = fullHp;
            setHeroHp(fullHp);
            heroAttackElapsedRef.current = 0;
          } else {
            heroHpRef.current = hpAfterAttacks;
            setHeroHp(hpAfterAttacks);
          }
        }
      }

      stateRef.current = nextState;
      setGameState(nextState);
      setFloatingDamages(damageEvents);
    }, COMBAT_TICK_MS);

    return () => clearInterval(timer);
  }, []);

  const handleEquipItem = (item: Equipment) => {
    setGameState((previous) => ({
      ...previous,
      equipped: { ...previous.equipped, [item.slot]: item },
    }));
  };

  const handleUnequipItem = (slot: EquipmentSlot) => {
    setGameState((previous) => ({
      ...previous,
      equipped: { ...previous.equipped, [slot]: null },
    }));
  };

  const handleForge = (_item: Equipment) => {
    setGameState((previous) => ({
      ...previous,
      hammers: Math.max(0, previous.hammers - 1),
    }));
  };

  const environment = getEnvironmentForStage(gameState.stage);
  const xpProgress = Math.min(
    100,
    (gameState.xp / gameState.xpToNextLevel) * 100,
  );

  return (
    <main className="min-h-dvh bg-slate-950 p-2 text-slate-100 sm:p-4">
      <div className="relative mx-auto h-[calc(100dvh-1rem)] min-h-[680px] w-full max-w-7xl overflow-hidden rounded-2xl border-[5px] border-amber-900 bg-slate-950 shadow-[inset_0_0_0_2px_rgba(251,191,36,0.28),0_20px_70px_rgba(0,0,0,0.7)] sm:h-[calc(100dvh-2rem)]">
        <CombatArena
          stage={gameState.stage}
          wave={gameState.wave}
          heroCurrentHp={heroHp}
          heroMaxHp={heroStats.maxHp}
          enemies={gameState.enemies}
          floatingDamages={floatingDamages}
        />

        <header className="absolute inset-x-3 top-3 z-30 flex items-start justify-between gap-3 rounded-xl border border-amber-700/70 bg-slate-950/85 p-3 shadow-xl backdrop-blur-md sm:inset-x-5 sm:top-5 sm:p-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-black text-amber-300">AnvilHero RPG</span>
              <span className="text-xs text-slate-300">
                Stage {gameState.stage} · Wave {gameState.wave} · {environment.name}
              </span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-bold text-white">
                Lv. {gameState.heroLevel}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div
                className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800"
                aria-label={`XP ${gameState.xp} of ${gameState.xpToNextLevel}`}
              >
                <div
                  className="h-full bg-sky-400 transition-[width]"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
              <span className="whitespace-nowrap text-[10px] text-slate-300">
                {formatNumber(gameState.xp)} / {formatNumber(gameState.xpToNextLevel)} XP
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-lg border border-amber-500/70 bg-amber-950/80 px-3 py-2 font-bold text-amber-200">
            <img
              src="/images/ui/gold.png"
              alt=""
              className="h-7 w-7 [image-rendering:pixelated]"
            />
            <span>{formatNumber(gameState.gold)} Gold</span>
          </div>
        </header>

        <div className="absolute left-3 right-3 top-[106px] z-30 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-950/75 px-3 py-2 backdrop-blur-sm sm:left-5 sm:right-5">
          <span className="text-xs font-bold text-amber-200">
            {gameState.statPoints} Stat Points
          </span>
          <div className="flex flex-wrap gap-1.5">
            {STAT_OPTIONS.map(([stat, label]) => (
              <button
                key={stat}
                onClick={() =>
                  setGameState((previous) =>
                    previous.statPoints > 0
                      ? {
                          ...previous,
                          statPoints: previous.statPoints - 1,
                          allocatedStats: {
                            ...previous.allocatedStats,
                            [stat]: previous.allocatedStats[stat] + 1,
                          },
                        }
                      : previous,
                  )
                }
                disabled={gameState.statPoints < 1}
                className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-[10px] font-bold text-white hover:bg-slate-700 disabled:opacity-40 sm:text-xs"
              >
                {label} {gameState.allocatedStats[stat]} +
              </button>
            ))}
          </div>
        </div>

        {offlineBanner && (
          <div className="absolute left-1/2 top-[166px] z-30 flex w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 items-center justify-between gap-3 rounded-lg border border-emerald-600 bg-emerald-950/90 px-3 py-2 text-xs text-emerald-200">
            <span>{offlineBanner}</span>
            <button
              onClick={() => setOfflineBanner(null)}
              className="font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="absolute inset-x-3 bottom-3 z-30 sm:inset-x-5 sm:bottom-5">
          <AnvilPanel
            hammers={gameState.hammers}
            gold={gameState.gold}
            anvilLevel={gameState.anvilLevel}
            equipped={gameState.equipped}
            heroLevel={gameState.heroLevel}
            onForge={handleForge}
            onEquip={handleEquipItem}
            onUnequip={handleUnequipItem}
            onSell={(item) =>
              setGameState((previous) => ({
                ...previous,
                gold: previous.gold + item.sellValue,
              }))
            }
            onUpgradeAnvil={(cost) =>
              setGameState((previous) =>
                previous.gold >= cost
                  ? {
                      ...previous,
                      gold: previous.gold - cost,
                      anvilLevel: previous.anvilLevel + 1,
                    }
                  : previous,
              )
            }
            onBuyHammers={(amount, cost) =>
              setGameState((previous) =>
                previous.gold >= cost
                  ? {
                      ...previous,
                      gold: previous.gold - cost,
                      hammers: previous.hammers + amount,
                    }
                  : previous,
              )
            }
          />
        </div>
      </div>
    </main>
  );
}
