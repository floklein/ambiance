export interface Sound {
  url: string;
  name: string;
  description: string;
}

export const sounds: Record<string, Sound> = {
  goodhaven: {
    url: "/sounds/439_Goodhaven.mp3",
    name: "Goodhaven",
    description: "A beautiful little town by a river.",
  },
  frontierTown: {
    url: "/sounds/424_Frontier_Town.mp3",
    name: "Frontier Town",
    description: "Life in a Western Town.",
  },
  denOfIniquity: {
    url: "/sounds/372_Den_of_Iniquity.mp3",
    name: "Den of Iniquity",
    description: "A seedier tavern on the other side of town.",
  },
  goblinAmbush: {
    url: "/sounds/316_Goblin_Ambush.mp3",
    name: "Goblin Ambush",
    description: "Goblins are always trying to take stuff without paying.",
  },
  pirates: {
    url: "/sounds/241_Pirates.mp3",
    name: "Pirates",
    description:
      "Romantic adventurers, or brigands of the sea. Salty, rum-sodden and irresistable.",
  },
};
