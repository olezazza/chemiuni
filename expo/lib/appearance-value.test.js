import { describe, expect, test } from "bun:test";
import { APPEARANCE_KEY, parseAppearance } from "./appearance-value";

describe("saved appearance", () => {
  test("restores Light after restart", () => { expect(parseAppearance("light")).toBe("light"); });
  test("restores Dark after restart", () => { expect(parseAppearance("dark")).toBe("dark"); });
  test("uses System for new or invalid settings", () => {
    expect(parseAppearance(null)).toBe("system");
    expect(parseAppearance("invalid")).toBe("system");
  });
  test("uses a separate key so score data remains intact", () => { expect(APPEARANCE_KEY).not.toBe("chemiuni.profile.v1"); });
});