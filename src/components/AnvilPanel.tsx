import React, { useEffect, useRef, useState } from "react";
import type { Equipment, EquipmentSlot, Rarity } from "../types/game";
import { forgeEquipment, getAnvilDropRates, getAnvilUpgradeCost } from "../engine/rng";
import { formatNumber } from "../utils/format";

const RARITY_STYLES: Record<Rarity, string> = {
  Common: "border-slate-500 text-slate-300",
  Uncommon: "border-emerald-500 text-emerald-400",
  Rare: "border-sky-500 text-sky-400",
  Epic: "border-purple-500 text-purple-400",
  Legendary: "border-amber-400 text-amber-300 shadow-amber-500/20 shadow-md",
  Mythic: "border-rose-500 text-rose-400 shadow-rose-500/30 shadow-lg",
};

const EQUIPMENT_SLOTS: EquipmentSlot[] = [
  "Weapon",
  "Armor",
  "Helmet",
  "Boots",
  "Ring",
  "Necklace",
  "Gloves",
  "Shield",
];

const SLOT_ICONS: Record<EquipmentSlot, string> = {
  Weapon: "/images/equipment/weapon.png",
  Armor: "/images/equipment/armor.png",
  Helmet: "/images/equipment/helmet.png",
  Boots: "/images/equipment/boots.png",
  Ring: "/images/equipment/ring.png",
  Necklace: "/images/equipment/necklace.png",
  Gloves: "/images/equipment/gloves.png",
  Shield: "/images/equipment/shield.png",
};

const MYTHIC_SLOT_ICONS: Partial<Record<EquipmentSlot, string>> = {
  Weapon: "/images/equipment/mythic_weapon.png",
  Armor: "/images/equipment/mythic_armor.png",
  Helmet: "/images/equipment/mythic_helmet.png",
  Shield: "/images/equipment/mythic_shield.png",
};

const RARITY_GLOWS: Record<Rarity, string> = {
  Common: "shadow-[0_0_7px_rgba(148,163,184,0.22)]",
  Uncommon: "shadow-[0_0_7px_rgba(16,185,129,0.22)]",
  Rare: "shadow-[0_0_7px_rgba(14,165,233,0.22)]",
  Epic: "shadow-[0_0_7px_rgba(168,85,247,0.24)]",
  Legendary: "shadow-[0_0_8px_rgba(251,191,36,0.28)]",
  Mythic: "shadow-[0_0_9px_rgba(244,63,94,0.3)]",
};

function getEquipmentIcon(slot: EquipmentSlot, rarity?: Rarity): string {
  return rarity === "Mythic"
    ? (MYTHIC_SLOT_ICONS[slot] ?? SLOT_ICONS[slot])
    : SLOT_ICONS[slot];
}

const RARITY_ORDER: Rarity[] = [
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Legendary",
  "Mythic",
];

interface AnvilPanelProps {
  anvilLevel: number;
  hammers: number;
  gold: number;
  equipped: Record<EquipmentSlot, Equipment | null>;
  heroLevel: number;
  onForge: (item: Equipment) => void;
  onEquip: (item: Equipment) => void;
  onUnequip: (slot: EquipmentSlot) => void;
  onSell: (item: Equipment) => void;
  onUpgradeAnvil: (cost: number) => void;
  onBuyHammers: (amount: number, cost: number) => void;
}

type EquipmentStat =
  | "attackBonus"
  | "hpBonus"
  | "defense"
  | "critRate"
  | "critDamage"
  | "dodgeChance";

function EquipmentAttributes({
  item,
  comparison,
  showDiff = false,
}: {
  item: Equipment;
  comparison?: Equipment | null;
  showDiff?: boolean;
}) {
  const attributes: Array<[string, EquipmentStat, string]> = [
    ["ATK", "attackBonus", ""],
    ["HP", "hpBonus", ""],
    ["Defense", "defense", ""],
    ["Crit Rate", "critRate", "%"],
    ["Crit DMG", "critDamage", "%"],
    ["Dodge", "dodgeChance", "%"],
  ];

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-200">
      {attributes.map(([label, stat, suffix]) => {
        const value = item[stat];
        const difference = value - (comparison?.[stat] ?? 0);
        return (
          <div key={label}>
            {label}: +{formatNumber(value)}{suffix}
            {showDiff && difference !== 0 && (
              <span
                className={`ml-1 font-semibold ${
                  difference > 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                ({difference > 0 ? "+" : ""}
                {formatNumber(difference)}
                {suffix})
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export const AnvilPanel: React.FC<AnvilPanelProps> = ({
  anvilLevel,
  hammers,
  gold,
  equipped,
  heroLevel,
  onForge,
  onEquip,
  onUnequip,
  onSell,
  onUpgradeAnvil,
  onBuyHammers,
}) => {
  const [forgedItem, setForgedItem] = useState<Equipment | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot | null>(null);
  const [showOdds, setShowOdds] = useState(false);
  const [showAutoForgeSettings, setShowAutoForgeSettings] = useState(false);
  const [isAutoForging, setIsAutoForging] = useState(false);
  const [minRarity, setMinRarity] = useState<Rarity>("Epic");
  const [pauseOnStatUpgrade, setPauseOnStatUpgrade] = useState(false);

  const upgradeCost = getAnvilUpgradeCost(anvilLevel);
  const hammerPackCost = 50;
  const dropRates = getAnvilDropRates(anvilLevel);
  const inspectedItem = selectedSlot ? equipped[selectedSlot] : null;
  const currentEquippedInSlot = forgedItem ? equipped[forgedItem.slot] : null;
  const autoForgeOptionsRef = useRef({
    hammers,
    anvilLevel,
    heroLevel,
    equipped,
    minRarity,
    pauseOnStatUpgrade,
    onForge,
    onSell,
  });
  autoForgeOptionsRef.current = {
    hammers,
    anvilLevel,
    heroLevel,
    equipped,
    minRarity,
    pauseOnStatUpgrade,
    onForge,
    onSell,
  };

  useEffect(() => {
    if (!isAutoForging) return;

    const timer = setInterval(() => {
      const options = autoForgeOptionsRef.current;
      if (options.hammers < 1) {
        setIsAutoForging(false);
        return;
      }

      options.hammers -= 1;
      const item = forgeEquipment(options.anvilLevel, options.heroLevel);
      options.onForge(item);
      const equippedItem = options.equipped[item.slot];
      const meetsRarity =
        RARITY_ORDER.indexOf(item.rarity) >=
        RARITY_ORDER.indexOf(options.minRarity);
      const itemPower = (gear: Equipment | null) =>
        gear
          ? gear.attackBonus +
            gear.hpBonus +
            gear.defense +
            gear.critRate +
            gear.critDamage +
            gear.dodgeChance
          : 0;
      const isStatUpgrade =
        options.pauseOnStatUpgrade &&
        itemPower(item) > itemPower(equippedItem);

      if (meetsRarity || isStatUpgrade) {
        setIsAutoForging(false);
        setShowAutoForgeSettings(false);
        setForgedItem(item);
      } else {
        options.onSell(item);
      }
    }, 400);

    return () => clearInterval(timer);
  }, [isAutoForging]);

  const handleForge = () => {
    if (isAutoForging) {
      setIsAutoForging(false);
      return;
    }
    if (hammers < 1) return;
    const item = forgeEquipment(anvilLevel, heroLevel);
    setForgedItem(item);
    onForge(item);
  };

  const handleEquipChoice = () => {
    if (!forgedItem) return;
    onEquip(forgedItem);
    setForgedItem(null);
  };

  const handleSellChoice = () => {
    if (!forgedItem) return;
    onSell(forgedItem);
    setForgedItem(null);
  };

  const sellEquippedItem = () => {
    if (!selectedSlot || !inspectedItem) return;
    onUnequip(selectedSlot);
    onSell(inspectedItem);
    setSelectedSlot(null);
  };

  return (
    <>
      <div className="pointer-events-auto grid w-full grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="grid w-fit grid-cols-4 gap-1 rounded-xl border border-slate-600/80 bg-slate-950/90 p-1.5 shadow-xl sm:gap-1.5 sm:p-2">
          {EQUIPMENT_SLOTS.map((slot) => {
            const item = equipped[slot];
            return (
              <button
                key={slot}
                type="button"
                onClick={() => setSelectedSlot(slot)}
                aria-label={`${slot}: ${item ? item.name : "empty"}`}
                className={`flex h-14 w-14 items-center justify-center rounded-lg border transition-colors hover:bg-slate-800 sm:h-16 sm:w-16 ${
                  item
                    ? `bg-slate-900/95 ${RARITY_STYLES[item.rarity]} ${RARITY_GLOWS[item.rarity]}`
                    : "border-slate-700 bg-slate-900/80"
                }`}
              >
                <img
                  src={getEquipmentIcon(slot, item?.rarity)}
                  alt=""
                  className={`h-10 w-10 object-contain [image-rendering:pixelated] sm:h-11 sm:w-11 ${
                    item ? "opacity-100" : "opacity-25 grayscale"
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div className="relative flex flex-col items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-950/90 p-2 shadow-xl sm:min-w-[310px]">
          {showOdds && (
            <div className="absolute bottom-full right-0 mb-2 w-72 rounded-xl border border-slate-700 bg-slate-950/95 p-3 shadow-2xl">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  Forge Odds · Anvil Lv.{anvilLevel}
                </span>
                <button
                  type="button"
                  onClick={() => setShowOdds(false)}
                  aria-label="Close forge odds"
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                {(Object.entries(dropRates) as [Rarity, number][]).map(
                  ([rarity, percentage]) => (
                    <div
                      key={rarity}
                      className={`rounded border bg-slate-900 px-2 py-1 ${
                        percentage > 0
                          ? RARITY_STYLES[rarity]
                          : "border-slate-800 text-slate-600"
                      }`}
                    >
                      <div className="text-[9px] font-semibold uppercase">
                        {rarity}
                      </div>
                      <div className="text-xs font-bold">{percentage}%</div>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleForge}
              disabled={hammers < 1}
              className="flex h-20 w-20 flex-col items-center justify-center rounded-full border-4 border-amber-200/80 bg-gradient-to-b from-amber-500 to-orange-700 shadow-[0_0_24px_rgba(245,158,11,0.35)] transition-transform hover:from-amber-400 active:scale-95 disabled:cursor-not-allowed disabled:border-slate-700 disabled:from-slate-800 disabled:to-slate-900 sm:h-24 sm:w-24"
            >
              <img
                src="/images/anvil.png"
                alt=""
                className="h-12 w-12 object-contain [image-rendering:pixelated]"
              />
              <span className="text-[10px] font-black uppercase text-white">
                Forge
              </span>
              <span className="text-[9px] text-amber-100">{hammers} Hammers</span>
            </button>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => onBuyHammers(5, hammerPackCost)}
                disabled={gold < hammerPackCost}
                className="rounded-full bg-slate-800 px-2.5 py-1.5 text-[10px] font-bold text-amber-300 hover:bg-slate-700 disabled:opacity-40"
              >
                +5 🔨 ({formatNumber(hammerPackCost)}g)
              </button>
              <button
                type="button"
                onClick={() => onUpgradeAnvil(upgradeCost)}
                disabled={gold < upgradeCost}
                className="rounded-full bg-amber-700 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-amber-600 disabled:opacity-40"
              >
                Anvil Lv.{anvilLevel} ↑ ({formatNumber(upgradeCost)}g)
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAutoForgeSettings(false);
                  setShowOdds((previous) => !previous);
                }}
                className="self-center rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-[10px] font-bold text-slate-200 hover:bg-slate-700"
              >
                Forge Odds
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOdds(false);
                  setShowAutoForgeSettings((previous) => !previous);
                }}
                aria-expanded={showAutoForgeSettings}
                className={`self-center rounded-full border px-3 py-1 text-[10px] font-bold ${
                  isAutoForging
                    ? "border-emerald-500 bg-emerald-950 text-emerald-300"
                    : "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700"
                }`}
              >
                {isAutoForging
                  ? `Auto-Forge: ON (Stop ≥ ${minRarity})`
                  : "Auto-Forge: OFF"}
              </button>
            </div>
          </div>

          {showAutoForgeSettings && (
            <div className="absolute bottom-full right-0 mb-2 w-72 space-y-3 rounded-xl border border-slate-700 bg-slate-950/95 p-3 shadow-2xl">
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-200">
                Stop at Minimum Rarity
                <select
                  value={minRarity}
                  onChange={(event) =>
                    setMinRarity(event.target.value as Rarity)
                  }
                  className="rounded-md border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-white"
                >
                  {RARITY_ORDER.map((rarity) => (
                    <option key={rarity} value={rarity}>
                      {rarity}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={pauseOnStatUpgrade}
                  onChange={(event) =>
                    setPauseOnStatUpgrade(event.target.checked)
                  }
                  className="accent-emerald-500"
                />
                Also pause if stat upgrade
              </label>
              <button
                type="button"
                onClick={() => setIsAutoForging((previous) => !previous)}
                disabled={!isAutoForging && hammers < 1}
                className="w-full rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isAutoForging ? "Stop Auto-Forge" : "Start Auto-Forge"}
              </button>
              {hammers < 1 && (
                <p className="text-center text-[11px] text-rose-300">
                  Out of Hammers
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-600 bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <img
                  src={getEquipmentIcon(selectedSlot, inspectedItem?.rarity)}
                  alt=""
                  className="h-12 w-12 object-contain [image-rendering:pixelated]"
                />
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    {selectedSlot}
                  </div>
                  <h3
                    className={`text-lg font-bold ${
                      inspectedItem
                        ? RARITY_STYLES[inspectedItem.rarity].split(" ")[1]
                        : "text-slate-300"
                    }`}
                  >
                    {inspectedItem?.name ?? "Empty Slot"}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSlot(null)}
                aria-label="Close equipment details"
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            {inspectedItem ? (
              <>
                <div className="text-xs text-slate-300">
                  {inspectedItem.rarity} · Item Lv. {inspectedItem.level}
                </div>
                <EquipmentAttributes item={inspectedItem} />
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onUnequip(selectedSlot);
                      setSelectedSlot(null);
                    }}
                    className="rounded-lg bg-slate-700 py-2 text-sm font-semibold text-white hover:bg-slate-600"
                  >
                    Unequip
                  </button>
                  <button
                    type="button"
                    onClick={sellEquippedItem}
                    className="rounded-lg bg-slate-800 py-2 text-sm font-semibold text-amber-300 hover:bg-slate-700"
                  >
                    Sell (+{formatNumber(inspectedItem.sellValue)}g)
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400">
                No equipment is currently assigned to this slot.
              </p>
            )}
          </div>
        </div>
      )}

      {forgedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
            <h3 className="text-center text-lg font-bold text-white">
              New Gear Forged!
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950 p-3">
                <div className="flex items-center gap-2">
                  <img
                    src={getEquipmentIcon(
                      forgedItem.slot,
                      currentEquippedInSlot?.rarity,
                    )}
                    alt=""
                    className="h-12 w-12 object-contain [image-rendering:pixelated]"
                  />
                  <div className="text-[10px] font-semibold uppercase text-slate-400">
                    Equipped ({forgedItem.slot})
                  </div>
                </div>
                {currentEquippedInSlot ? (
                  <>
                    <div className="text-sm font-bold">
                      {currentEquippedInSlot.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Item Lv. {currentEquippedInSlot.level}
                    </div>
                    <EquipmentAttributes item={currentEquippedInSlot} />
                  </>
                ) : (
                  <div className="text-xs italic text-slate-500">
                    Nothing equipped
                  </div>
                )}
              </div>
              <div
                className={`space-y-2 rounded-xl border-2 bg-slate-950 p-3 ${
                  RARITY_STYLES[forgedItem.rarity]
                }`}
              >
                <div className="flex items-center gap-2">
                  <img
                    src={getEquipmentIcon(forgedItem.slot, forgedItem.rarity)}
                    alt=""
                    className="h-12 w-12 object-contain [image-rendering:pixelated]"
                  />
                  <div className="text-[10px] font-semibold uppercase text-amber-400">
                    New Drop
                  </div>
                </div>
                <div className="text-sm font-bold">{forgedItem.name}</div>
                <div className="text-[11px] text-slate-300">
                  Item Lv. {forgedItem.level}
                </div>
                <EquipmentAttributes
                  item={forgedItem}
                  comparison={currentEquippedInSlot}
                  showDiff
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleSellChoice}
                className="rounded-xl bg-slate-800 py-2.5 text-sm font-semibold text-amber-300 hover:bg-slate-700"
              >
                Sell (+{formatNumber(forgedItem.sellValue)}g)
              </button>
              <button
                type="button"
                onClick={handleEquipChoice}
                className="rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Equip
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
