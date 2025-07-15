import allThemes from "./themes.json";

export type ThemeId = keyof typeof allThemes;

export const themes = allThemes;
