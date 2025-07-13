import allSounds from "./sounds.json";

export type SoundId = keyof typeof allSounds;

export const sounds = Object.fromEntries(
  Object.entries(allSounds).filter(([_, sound]) => !sound.disabled),
);
