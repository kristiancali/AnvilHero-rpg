# AnvilHero RPG

A browser-based idle and auto-combat RPG built with React, TypeScript, and Tailwind CSS. Forge increasingly powerful gear at the Blacksmith Anvil, battle through escalating stages and bosses, summon permanent companions and relics, and earn offline idle rewards.

## Features

- **Auto-Combat Loop:** Fixed-timestep combat engine featuring 4 standard enemy waves followed by a Stage Boss on Wave 5. Defeating bosses advances the stage and awards Gems and Hammers; falling in battle resets the current stage back to Wave 1.
- **Exponential Progression & Biomes:** Enemy stats and gold rewards scale exponentially ($\text{Base} \times 1.45^{\text{stage}}$) across distinct environments, including *Whispering Meadows*, *Crystal Caverns*, and *Obsidian Caldera*.
- **Blacksmith Anvil & CDF Crafting:** Spend Hammers to forge Weapons, Armor, and Helmets using a Cumulative Distribution Function (CDF) over dynamic rarity weights (*Common* through *Legendary*). Upgrade the Anvil to improve drop odds and scale item stats, then compare new gear side-by-side to Equip or Sell.
- **Gacha & Hard Pity System:** Spend boss-earned Gems to summon permanent Companions and Relics that grant multiplicative Attack and HP bonuses, complete with a 50-pull hard pity guarantee for Legendary drops.
- **Offline Idle Persistence:** Automatically saves progress to `localStorage` and calculates offline gold earnings (capped at 8 hours) when returning to the game.

## Tech Stack

- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Persistence:** Web Storage API (`localStorage`)

## Project Structure

```text
AnvilHero-rpg/
├── public/
│   └── images/              # Hero, enemy sprites, UI icons, and biome backgrounds
└── src/
    ├── components/
    │   ├── AnvilPanel.tsx   # Gear forging, anvil upgrades, and equip/sell comparison modal
    │   ├── CombatArena.tsx  # Biome backdrop, health bars, sprites, and combat log
    │   └── GachaModal.tsx   # Summon interface, pity counter, and unlocked roster
    ├── data/
    │   ├── environments.ts  # Stage biomes, enemy pools, and boss definitions
    │   └── gachaPool.ts     # Summon weights, pity cap, and companion/relic catalog
    ├── engine/
    │   ├── combat.ts        # Hero stat aggregation and exponential enemy scaling
    │   ├── rng.ts           # CDF rarity distribution and gacha pity logic
    │   └── storage.ts       # localStorage serialization and offline gold math
    ├── types/
    │   └── game.ts          # TypeScript interfaces for equipment, enemies, and state
    └── App.tsx              # Main game loop and state orchestration
