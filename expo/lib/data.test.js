import { describe, expect, test } from "bun:test";
import { CITIES, ELECTIVES, FIELDS, PROGRAMS, SUBJECTS, UNIVERSITIES, programById, universityById } from "./data";
import { buildList, competitionScore, estimate, isEligible, matchesBudget, matchesCity } from "./engine";
import { EMPTY_PROFILE } from "./types";

const student = (elective = "math", score = 75) => ({
  ...EMPTY_PROFILE,
  onboarded: true,
  listCreated: true,
  scores: { ...EMPTY_PROFILE.scores, georgian: score, foreign: score, elective, electiveScore: score },
  prefs: { ...EMPTY_PROFILE.prefs },
});

describe("Phase 1 demo dataset", () => {
  test("contains 20–30 institutions", () => {
    expect(UNIVERSITIES.length).toBeGreaterThanOrEqual(20);
    expect(UNIVERSITIES.length).toBeLessThanOrEqual(30);
  });
  test("contains 100–150 complete programs", () => {
    expect(PROGRAMS.length).toBeGreaterThanOrEqual(100);
    expect(PROGRAMS.length).toBeLessThanOrEqual(150);
    for (const p of PROGRAMS) {
      for (const key of ["id", "universityId", "name", "degree", "blurb"]) expect(p[key].trim().length).toBeGreaterThan(0);
      expect(FIELDS.some(f => f.id === p.field)).toBe(true);
      expect(typeof p.stateGrant).toBe("boolean");
      expect(typeof p.scholarship).toBe("boolean");
    }
  });
  test("has unique stable IDs and no duplicate degrees at an institution", () => {
    expect(new Set(UNIVERSITIES.map(u => u.id)).size).toBe(UNIVERSITIES.length);
    expect(new Set(PROGRAMS.map(p => p.id)).size).toBe(PROGRAMS.length);
    expect(new Set(PROGRAMS.map(p => `${p.universityId}:${p.name}:${p.degree}`)).size).toBe(PROGRAMS.length);
  });
  test("all references and locations are valid, with programs for every institution", () => {
    for (const u of UNIVERSITIES) {
      expect(CITIES.includes(u.city)).toBe(true);
      expect(PROGRAMS.some(p => p.universityId === u.id)).toBe(true);
    }
    for (const p of PROGRAMS) expect(universityById(p.universityId).id).toBe(p.universityId);
  });
  test("numbers and elective coefficients are compatible with the unchanged engine", () => {
    for (const p of PROGRAMS) {
      expect(Number.isFinite(p.tuition) && p.tuition >= 0).toBe(true);
      expect(Number.isInteger(p.seats) && p.seats > 0).toBe(true);
      expect(Number.isFinite(p.sampleCutoff) && p.sampleCutoff >= 0 && p.sampleCutoff <= 100).toBe(true);
      expect(p.electives.length).toBeGreaterThan(0);
      expect(new Set(p.electives).size).toBe(p.electives.length);
      for (const [subject, weight] of Object.entries(p.coefficients)) {
        expect(subject in SUBJECTS).toBe(true);
        expect(Number.isFinite(weight) && weight > 0).toBe(true);
      }
      for (const el of p.electives) {
        expect(ELECTIVES.includes(el)).toBe(true);
        if (p.id.startsWith("demo-")) expect(p.coefficients[el]).toBeGreaterThan(0);
        expect(competitionScore(student(el, 75), p)).toBe(75);
      }
    }
  });
  test("preserves all 28 legacy program IDs and original institutions", () => {
    const ids = "tsu-cs freeuni-cs kiu-cs gtu-cs cu-cs atsu-cs bsu-cs tsu-bus freeuni-bus cu-bus bsu-bus tsu-med atsu-med bsu-med tsu-law iliauni-law cu-law gtu-civ kiu-eng atsu-eng tsu-psy iliauni-psy tsu-ir iliauni-ir freeuni-math kiu-math gtu-arch iliauni-design".split(" ");
    for (const id of ids) expect(programById(id)?.id).toBe(id);
    for (const id of ["tsu", "iliauni", "freeuni", "gtu", "kiu", "cu", "atsu", "bsu"]) expect(universityById(id).id).toBe(id);
    expect(programById("tsu-cs").sampleCutoff).toBe(78);
    expect(programById("tsu-cs").tuition).toBe(2250);
  });
  test("offers every existing elective and all expanded fields", () => {
    for (const el of ELECTIVES) expect(PROGRAMS.filter(p => p.id.startsWith("demo-") && p.electives.includes(el)).length).toBeGreaterThan(0);
    for (const field of FIELDS) expect(PROGRAMS.some(p => p.field === field.id)).toBe(true);
  });
  test("supports distinct admission categories for different scores without changing the formula", () => {
    const p = programById("demo-mtkvari-cs");
    expect(estimate(student("math", 40), p).confidence).toBe("reach");
    expect(estimate(student("math", p.sampleCutoff), p).confidence).toBe("target");
    expect(estimate(student("math", 95), p).confidence).toBe("safe");
    for (const p of PROGRAMS) for (const el of p.electives) {
      expect(estimate(student(el, 85), p).pct).toBeGreaterThanOrEqual(estimate(student(el, 65), p).pct);
      expect(estimate(student(el), p)).toEqual(estimate(student(el), p));
    }
  });
  test("budget and city preferences still constrain unpinned recommendations", () => {
    for (const budget of ["state", "low", "medium", "any"]) for (const city of CITIES) for (const el of ELECTIVES) {
      const p = student(el);
      p.prefs = { ...p.prefs, budget, cities: [city], anyCity: false };
      const list = buildList(p);
      expect(list.length).toBeLessThanOrEqual(8);
      for (const item of list) {
        expect(isEligible(p, item.program)).toBe(true);
        expect(matchesBudget(p, item.program)).toBe(true);
        expect(matchesCity(p, item.program)).toBe(true);
        if (budget === "low") expect(item.program.tuition).toBeLessThanOrEqual(2250);
        if (budget === "medium") expect(item.program.tuition).toBeLessThanOrEqual(5500);
        if (budget === "state") expect(item.program.stateGrant).toBe(true);
        expect(universityById(item.program.universityId).city).toBe(city);
      }
    }
  });
  test("saved pins survive expansion and removal/addition follows the existing rules", () => {
    const p = { ...student(), pinned: ["tsu-cs", "demo-rustavi-mech"], removed: ["freeuni-cs"] };
    expect(buildList(p).some(i => i.program.id === "tsu-cs" && i.pinned)).toBe(true);
    expect(buildList(p).some(i => i.program.id === "demo-rustavi-mech" && i.pinned)).toBe(true);
    expect(buildList(p).some(i => i.program.id === "freeuni-cs")).toBe(false);
    expect(buildList({ ...p, pinned: ["tsu-cs"], removed: [...p.removed, "demo-rustavi-mech"] }).some(i => i.program.id === "demo-rustavi-mech")).toBe(false);
  });
});