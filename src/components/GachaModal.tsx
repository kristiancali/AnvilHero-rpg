import React, { useState } from "react";
import type { GachaItem } from "../types/game";
import {
  GACHA_POOL,
  GACHA_PULL_COST,
  LEGENDARY_PITY_CAP,
} from "../data/gachaPool";
import { pullGacha } from "../engine/rng";

interface GachaModalProps {
  isOpen: boolean;
  onClose: () => void;
  gems: number;
  pullsSinceLegendary: number;
  ownedGachaIds: string[];
  onSummonComplete: (
    item: GachaItem,
    newPityCount: number,
    cost: number,
  ) => void;
}

export const GachaModal: React.FC<GachaModalProps> = ({
  isOpen,
  onClose,
  gems,
  pullsSinceLegendary,
  ownedGachaIds,
  onSummonComplete,
}) => {
  const [lastPulled, setLastPulled] = useState<GachaItem | null>(null);

  if (!isOpen) return null;

  const handleSummon = () => {
    if (gems < GACHA_PULL_COST) return;
    const { item, newPityCount } = pullGacha(pullsSinceLegendary);
    setLastPulled(item);
    onSummonComplete(item, newPityCount, GACHA_PULL_COST);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-xl max-w-lg w-full p-6 space-y-5">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-indigo-300">Astral Summon</h3>
            <p className="text-xs text-slate-400">
              Pity Counter: {pullsSinceLegendary} / {LEGENDARY_PITY_CAP}{" "}
              (Guaranteed Legendary at {LEGENDARY_PITY_CAP})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm"
          >
            Close
          </button>
        </div>

        {/* Last Pull Result Banner */}
        {lastPulled && (
          <div className="p-4 rounded-lg bg-indigo-950/70 border border-indigo-400 text-center">
            <div className="text-xs uppercase tracking-wider text-indigo-300">
              {lastPulled.rarity} {lastPulled.type}
            </div>
            <div className="text-lg font-bold text-white mt-1">
              {lastPulled.name}
            </div>
            <div className="text-sm text-emerald-400">
              {lastPulled.description}
            </div>
          </div>
        )}

        {/* Summon Button */}
        <button
          onClick={handleSummon}
          disabled={gems < GACHA_PULL_COST}
          className="w-full py-3 rounded-lg font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40"
        >
          Summon x1 ({GACHA_PULL_COST} Gems) — You have {gems} Gems
        </button>

        {/* Owned Companions & Relics Roster */}
        <div>
          <h4 className="text-xs uppercase tracking-wider text-slate-400 mb-2">
            Companions & Relics ({ownedGachaIds.length}/{GACHA_POOL.length})
          </h4>
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
            {GACHA_POOL.map((entry) => {
              const unlocked = ownedGachaIds.includes(entry.id);
              return (
                <div
                  key={entry.id}
                  className={`p-2.5 rounded border text-xs flex justify-between items-center ${
                    unlocked
                      ? "bg-slate-800/80 border-indigo-500/50 text-white"
                      : "bg-slate-950 border-slate-800 text-slate-500"
                  }`}
                >
                  <div>
                    <span className="font-bold">{entry.name}</span>{" "}
                    <span className="opacity-75">({entry.rarity})</span>
                  </div>
                  <span>{unlocked ? entry.description : "Locked"}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
