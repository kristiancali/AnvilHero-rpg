# AnvilHero RPG

A browser-based idle and auto-combat RPG built with React, TypeScript, and Tailwind CSS. Forge increasingly powerful gear at the Blacksmith Anvil, battle through escalating stages and bosses, and earn offline idle rewards.

## Features

- **Auto-Combat Loop:** Fixed-timestep combat engine featuring groups of enemies on four standard waves followed by a Stage Boss on Wave 5. Defeating all enemies advances the wave; falling in battle resets the current stage to Wave 1.
- **Hero Progression & Biomes:** Gain XP, level up, allocate stat points, and battle through environments including *Whispering Meadows* and *Crystal Caverns*.
- **Blacksmith Anvil & CDF Crafting:** Spend Hammers to forge role-based gear using dynamic rarity weights (*Common* through *Mythic*). Upgrade the Anvil to improve drop odds and stats, then inspect, equip, sell, or unequip gear.
- **Loot & Persistence:** Enemies drop Gold and may drop Hammers; bosses guarantee multiple Hammers. Progress saves to `localStorage`, with offline Gold earnings capped at 8 hours.
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
    │   ├── AnvilPanel.tsx   # Gear forging, inspection, upgrades, and equipment management
    │   └── CombatArena.tsx  # Biome backdrop, health bars, sprites, and floating damage
    ├── data/
    │   ├── environments.ts  # Stage biomes, enemy pools, and boss definitions
    ├── engine/
    │   ├── combat.ts        # Hero stat aggregation, enemy spawning, and XP progression
    │   ├── rng.ts           # CDF rarity distribution and equipment generation
    │   └── storage.ts       # localStorage serialization and offline gold math
    ├── types/
    │   └── game.ts          # TypeScript interfaces for equipment, enemies, and state
    ├── utils/
    │   └── format.ts        # Compact number formatting for the game UI
    └── App.tsx              # Main game loop and state orchestration
