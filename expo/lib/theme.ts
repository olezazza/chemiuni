import { DarkTheme, DefaultTheme, type Theme } from "expo-router";
import { useColorScheme } from "nativewind";

// Mirrored as RGB channels in global.css.
const light = {"background": "#f7f8fc", "foreground": "#20283e", "card": "#ffffff", "cardForeground": "#20283e", "primary": "#315cda", "primaryForeground": "#ffffff", "accent": "#315cda", "accentForeground": "#ffffff", "secondary": "#eaf0fb", "secondaryForeground": "#20283e", "muted": "#edf0f6", "mutedForeground": "#58647b", "destructive": "#b43349", "destructiveForeground": "#ffffff", "border": "#dce2ed", "input": "#eef2f9", "safe": "#16735e", "target": "#936010", "reach": "#7554ad", "violet": "#7554ad", "violetSoft": "#eee8fa", "safeSoft": "#e1f4ec", "targetSoft": "#fff0d4", "reachSoft": "#eee8fa"} as const;
const dark = {"background": "#121927", "foreground": "#eef2fc", "card": "#1c2638", "cardForeground": "#eef2fc", "primary": "#416de2", "primaryForeground": "#ffffff", "accent": "#9ebcff", "accentForeground": "#121927", "secondary": "#29364c", "secondaryForeground": "#eef2fc", "muted": "#263247", "mutedForeground": "#afbdd2", "destructive": "#ff9ba9", "destructiveForeground": "#121927", "border": "#35435a", "input": "#263247", "safe": "#8cdbc0", "target": "#f1c475", "reach": "#c7acff", "violet": "#c7acff", "violetSoft": "#352e4c", "safeSoft": "#203c39", "targetSoft": "#423829", "reachSoft": "#352e4c"} as const;

export const palette = { light, dark } as const;
export type ColorScheme = keyof typeof palette;
export type ThemeColors = { [K in keyof typeof light]: string };
export function useAppColorScheme(): ColorScheme {
  return useColorScheme().colorScheme === "dark" ? "dark" : "light";
}
export function useThemeColors(): ThemeColors { return palette[useAppColorScheme()]; }
function navigationTheme(scheme: ColorScheme, base: Theme): Theme {
  const c = palette[scheme];
  return { ...base, dark: scheme === "dark", colors: { primary: c.accent, background: c.background, card: c.card, text: c.foreground, border: c.border, notification: c.destructive } };
}
export const navigationThemes = { light: navigationTheme("light", DefaultTheme), dark: navigationTheme("dark", DarkTheme) };
