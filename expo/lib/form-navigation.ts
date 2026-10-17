/** A saved form opened directly or from onboarding has no previous stack entry. */
export function savedFormDestination(canGoBack: boolean, fromOnboarding = false, thenList = false) {
  if (fromOnboarding) return "/(tabs)" as const;
  if (canGoBack) return "back" as const;
  return thenList ? "/(tabs)/list" as const : "/(tabs)" as const;
}