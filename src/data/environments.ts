import type { Environment } from "../types/game";

// Biomes rotate automatically based on the player's current stage
export const ENVIRONMENTS: Environment[] = [
  {
    id: "meadow",
    name: "Whispering Meadows",
    minStage: 1,
    bgGradient: "from-emerald-900 via-green-950 to-slate-950",
    bgImage: "/images/environments/meadow-bg.png",
    backgroundImage: "/images/environments/meadow-bg.png",
    mobs: [
      { name: "Green Slime", image: "/images/enemies/slime.png" },
      { name: "Wild Boar", image: "/images/enemies/roar.png" },
    ],
    boss: { name: "Elder Treant", image: "/images/enemies/treant.png" },
  },
  {
    id: "caverns",
    name: "Crystal Caverns",
    minStage: 6,
    bgGradient: "from-indigo-950 via-purple-950 to-slate-950",
    bgImage: "/images/environments/caverns-bg.png",
    backgroundImage: "/images/environments/caverns-bg.png",
    // Reuses existing sprites until you add cavern-specific enemy art
    mobs: [
      { name: "Cave Bat", image: "/images/enemies/slime.png" },
      { name: "Rock Golem", image: "/images/enemies/roar.png" },
    ],
    boss: { name: "Amethyst Wyrm", image: "/images/enemies/treant.png" },
  },
];

// Helper to retrieve the highest-tier unlocked environment for a given stage
export function getEnvironmentForStage(stage: number): Environment {
  const unlocked = ENVIRONMENTS.filter((env) => stage >= env.minStage);
  return unlocked[unlocked.length - 1] || ENVIRONMENTS[0];
}
