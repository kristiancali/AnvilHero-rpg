import React, { useState } from "react";
import type { Equipment, EquipmentSlot, Rarity } from "../types/game";
import { forgeEquipment } from "../engine/rng";

// Rarity border and text color mapping for Tailwind CSS
const RARITY_STYLES: Record<Rarity, string> = {
  Common: "border-slate-500 text-slate-300",
  Uncommon: "border-emerald-500 text-emerald-400",
  Rare: "border-sky-500 text-sky-400",
  Epic: "border-purple-500 text-purple-400",
  Legendary: "border-amber-400 text-amber-300 shadow-amber-500/20 shadow-md",
};

interface AnvilPanelProps {
  hammers: number;
  gold: number;
  anvilLevel: number;
  equipped: Record<EquipmentSlot, Equipment | null>;
  onConsumeHammer: () => void;
  onEquipItem: (item: Equipment) => void;
  onSellItem: (goldGained: number) => void;
  onUpgradeAnvil: (cost: number) => void;
  onBuyHammers: (cost: number, amount: number) => void;
}

export const AnvilPanel: React.FC<AnvilPanelProps> = ({
  hammers,
  gold,
  anvilLevel,
  equipped,
  onConsumeHammer,
  onEquipItem,
  onSellItem,
  onUpgradeAnvil,
  onBuyHammers,
}) => {
  // Holds newly forged gear until the player chooses Equip or Sell
  const [pendingItem, setPendingItem] = useState<Equipment | null>(null);

  const upgradeCost = Math.round(100 * Math.pow(1.8, anvilLevel - 1));
  const hammerPackCost = 50;

  // Consumes 1 hammer and rolls CDF rarity gear
  const handleForge = () => {
    if (hammers <= 0 || pendingItem) return;
    onConsumeHammer();
    const forged = forgeEquipment(anvilLevel);
    setPendingItem(forged);
  };

  const handleEquip = () => {
    if (!pendingItem) return;
    // Automatically sell the replaced item if slot was occupied
    const oldItem = equipped[pendingItem.slot];
    if (oldItem) {
      onSellItem(oldItem.sellValue);
    }
    onEquipItem(pendingItem);
    setPendingItem(null);
  };

  const handleSell = () => {
    if (!pendingItem) return;
    onSellItem(pendingItem.sellValue);
    setPendingItem(null);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-amber-400">
          Blacksmith Anvil (Lv. {anvilLevel})
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => onBuyHammers(hammerPackCost, 5)}
            disabled={gold < hammerPackCost}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-amber-200 border border-slate-700"
          >
            +5 Hammers ({hammerPackCost}g)
          </button>
          <button
            onClick={() => onUpgradeAnvil(upgradeCost)}
            disabled={gold < upgradeCost}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white"
          >
            Upgrade Anvil ({upgradeCost}g)
          </button>
        </div>
      </div>

      {/* Currently Equipped Gear Grid */}
      <div className="grid grid-cols-3 gap-3">
        {(["Weapon", "Armor", "Helmet"] as EquipmentSlot[]).map((slot) => {
          const item = equipped[slot];
          return (
            <div
              key={slot}
              className={`p-3 rounded-lg bg-slate-950 border ${
                item
                  ? RARITY_STYLES[item.rarity]
                  : "border-slate-800 text-slate-500"
              }`}
            >
              <div className="text-[11px] uppercase tracking-wider opacity-75">
                {slot}
              </div>
              {item ? (
                <>
                  <div className="font-bold text-sm truncate">{item.name}</div>
                  <div className="text-xs text-slate-300 mt-1">
                    +{item.attackBonus} ATK | +{item.hpBonus} HP
                  </div>
                </>
              ) : (
                <div className="text-xs italic mt-2">Empty</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Forge Action Button */}
      <button
        onClick={handleForge}
        disabled={hammers <= 0 || pendingItem !== null}
        className="w-full py-3 rounded-lg font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-40 transition"
      >
        Forge Gear (1 Hammer) — {hammers} Available
      </button>

      {/* Equipment Comparison Modal */}
      {pendingItem && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 space-y-4">
            <h4 className="text-lg font-bold text-white">New Item Forged!</h4>

            <div className="grid grid-cols-2 gap-4">
              {/* Currently Equipped Comparison */}
              <div className="p-3 rounded bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400 mb-1">
                  Current {pendingItem.slot}
                </div>
                {equipped[pendingItem.slot] ? (
                  <>
                    <div className="font-bold text-sm text-slate-200">
                      {equipped[pendingItem.slot]!.name}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      ATK: +{equipped[pendingItem.slot]!.attackBonus}
                    </div>
                    <div className="text-xs text-slate-400">
                      HP: +{equipped[pendingItem.slot]!.hpBonus}
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-slate-500 italic">
                    None Equipped
                  </div>
                )}
              </div>

              {/* Newly Forged Item */}
              <div
                className={`p-3 rounded bg-slate-950 border ${RARITY_STYLES[pendingItem.rarity]}`}
              >
                <div className="text-xs opacity-75 mb-1">
                  Forged {pendingItem.slot}
                </div>
                <div className="font-bold text-sm">{pendingItem.name}</div>
                <div className="text-xs text-emerald-400 mt-1">
                  ATK: +{pendingItem.attackBonus}
                </div>
                <div className="text-xs text-emerald-400">
                  HP: +{pendingItem.hpBonus}
                </div>
              </div>
            </div>

            {/* Equip vs. Sell Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSell}
                className="flex-1 py-2.5 rounded-lg font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300"
              >
                Sell (+{pendingItem.sellValue}g)
              </button>
              <button
                onClick={handleEquip}
                className="flex-1 py-2.5 rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Equip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
