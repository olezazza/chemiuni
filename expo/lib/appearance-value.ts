export type Appearance = "light" | "dark" | "system";
export const APPEARANCE_KEY = "chemiuni.appearance.v1";
export function parseAppearance(value: string | null): Appearance {
  return value === "light" || value === "dark" ? value : "system";
}