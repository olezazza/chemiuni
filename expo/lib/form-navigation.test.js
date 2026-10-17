import { describe, expect, it } from "bun:test";
import { savedFormDestination } from "./form-navigation";

describe("Saved form navigation", () => {
  it("finishes onboarding at Home without a GO_BACK action", () => {
    expect(savedFormDestination(false, true)).toBe("/(tabs)");
    expect(savedFormDestination(true, true)).toBe("/(tabs)");
  });
  it("saves a directly reopened form without going back into an empty stack", () => {
    expect(savedFormDestination(false)).toBe("/(tabs)");
  });
  it("reopens the created list when there is no previous list screen", () => {
    expect(savedFormDestination(false, false, true)).toBe("/(tabs)/list");
  });
  it("preserves normal edit return navigation", () => {
    expect(savedFormDestination(true)).toBe("back");
    expect(savedFormDestination(true, false, true)).toBe("back");
  });
});