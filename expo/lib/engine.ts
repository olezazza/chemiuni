// Illustrative estimate engine. NOT the official Georgian competition-score formula:
// it is a weighted average on a 0–100 demo scale, used only to demonstrate the UI.
import { PROGRAMS, SUBJECTS, universityById, type Program, type SubjectId } from "./data";
import type { Profile } from "./types";

export type Confidence = "safe" | "target" | "reach";

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  safe: "უსაფრთხო არჩევანი",
  target: "მიზნობრივი არჩევანი",
  reach: "ამბიციური არჩევანი",
};

export function hasScores(p: Profile) {
  const s = p.scores;
  return s.georgian != null && s.foreign != null && s.elective != null && s.electiveScore != null;
}

export function isEligible(p: Profile, prog: Program) {
  return p.scores.elective != null && prog.electives.includes(p.scores.elective);
}

function subjectScore(p: Profile, subj: SubjectId): number | null {
  if (subj === "georgian") return p.scores.georgian;
  if (subj === "foreign") return p.scores.foreign;
  if (subj === p.scores.elective) return p.scores.electiveScore;
  return null;
}

/** Weighted average of the student's scores using the program's demo coefficients. */
export function electiveCoef(prog: Program, elective: SubjectId): number {
  if (prog.coefficients[elective] != null) return prog.coefficients[elective]!;
  const other = Object.entries(prog.coefficients).find(([k]) => k !== "georgian" && k !== "foreign");
  return other ? (other[1] as number) : 2;
}

export function competitionScore(p: Profile, prog: Program, override?: Partial<Record<SubjectId, number>>): number | null {
  if (!hasScores(p) || !isEligible(p, prog)) return null;
  const el = p.scores.elective as SubjectId;
  const parts: [SubjectId, number][] = [
    ["georgian", prog.coefficients.georgian ?? 1],
    ["foreign", prog.coefficients.foreign ?? 1],
    [el, electiveCoef(prog, el)],
  ];
  let sum = 0;
  let w = 0;
  for (const [subj, c] of parts) {
    const v = override?.[subj] ?? subjectScore(p, subj) ?? 0;
    sum += v * c;
    w += c;
  }
  return Math.round((sum / w) * 10) / 10;
}

export function likelihood(comp: number, cutoff: number) {
  const pct = 100 / (1 + Math.exp(-(comp - cutoff) / 4));
  return Math.max(5, Math.min(95, Math.round(pct)));
}

export function confidenceOf(pct: number): Confidence {
  return pct >= 70 ? "safe" : pct >= 40 ? "target" : "reach";
}

export type Estimate = { comp: number; pct: number; confidence: Confidence; gap: number } | null;

export function estimate(p: Profile, prog: Program): Estimate {
  const comp = competitionScore(p, prog);
  if (comp == null) return null;
  const pct = likelihood(comp, prog.sampleCutoff);
  return { comp, pct, confidence: confidenceOf(pct), gap: Math.round((comp - prog.sampleCutoff) * 10) / 10 };
}

export function matchesBudget(p: Profile, prog: Program) {
  switch (p.prefs.budget) {
    case "state":
      return prog.stateGrant;
    case "low":
      return prog.tuition <= 2250;
    case "medium":
      return prog.tuition <= 5500;
    default:
      return true;
  }
}

export function matchesCity(p: Profile, prog: Program) {
  const city = universityById(prog.universityId).city;
  if (p.prefs.excludedCities.includes(city)) return false;
  if (p.prefs.anyCity || p.prefs.cities.length === 0) return true;
  return p.prefs.cities.includes(city);
}

export type ListItem = { program: Program; est: Estimate; reasons: string[]; pinned: boolean };

export function reasonsFor(p: Profile, prog: Program, est: Estimate): string[] {
  const r: string[] = [];
  const city = universityById(prog.universityId).city;
  if (p.field === prog.field) r.push("ემთხვევა შენს სასურველ სფეროს");
  if (est) {
    if (est.gap >= 0) r.push(`შენი საჩვენებელი ქულა ${est.gap}-ით აღემატება სანიმუშო ზღვარს`);
    else r.push(`სანიმუშო ზღვრამდე გაკლია ${Math.abs(est.gap)} ქულა`);
  }
  if (p.prefs.budget === "state" && prog.stateGrant) r.push("სახელმწიფო გრანტით სწავლა შესაძლებელია");
  else if (prog.tuition === 0) r.push("სწავლა სრულად დაფინანსებულია (სანიმუშო)");
  else if (p.prefs.budget === "low" && prog.tuition <= 2250) r.push("დაბალი სწავლის საფასური");
  if (p.prefs.scholarshipFocus && prog.scholarship) r.push("აქვს უნივერსიტეტის სტიპენდიები");
  if (p.prefs.cities.includes(city)) r.push(`${city} — შენთვის სასურველი ქალაქი`);
  return r.slice(0, 3);
}

/** Builds the personalized ranked shortlist from the demo dataset. */
export function buildList(p: Profile): ListItem[] {
  // Only user-approved counselor edits opt into an explicit list. Legacy ranking is unchanged.
  if (p.approvedList) {
    return [...new Set(p.approvedList)].flatMap(id => {
      const program = PROGRAMS.find(x => x.id === id);
      if (!program || p.removed.includes(id)) return [];
      const est = estimate(p, program);
      return [{ program, est, reasons: reasonsFor(p, program, est), pinned: p.pinned.includes(id) }];
    });
  }
  const pool = PROGRAMS.filter(
    (prog) =>
      !p.removed.includes(prog.id) &&
      (p.pinned.includes(prog.id) ||
        ((!p.field || prog.field === p.field) && isEligible(p, prog) && matchesBudget(p, prog) && matchesCity(p, prog))),
  );
  const tilt = p.prefs.ambition === "ambitious" ? -30 : p.prefs.ambition === "safe" ? 30 : 0;
  const scored = pool.map((prog) => {
    const est = estimate(p, prog);
    const pct = est?.pct ?? 30;
    // Balanced: favor programs near the 55% sweet spot; tilt shifts the target.
    const targetPct = 55 + tilt;
    let s = 100 - Math.abs(pct - targetPct);
    if (p.pinned.includes(prog.id)) s += 200;
    if (p.prefs.scholarshipFocus && prog.scholarship) s += 15;
    if (p.prefs.budget !== "any") s += prog.tuition <= 2250 ? 10 : 0;
    s += (prog.sampleCutoff - 50) / 4; // slight preference for stronger programs
    return { program: prog, est, reasons: reasonsFor(p, prog, est), pinned: p.pinned.includes(prog.id), s };
  });
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, 8).map(({ s: _s, ...rest }) => rest);
}

export type Improvement = { subject: SubjectId; label: string; delta: number; newPct: number; oldPct: number };

export function improvements(p: Profile, prog: Program): Improvement[] {
  const est = estimate(p, prog);
  if (!est || !p.scores.elective) return [];
  const subjects: SubjectId[] = ["georgian", "foreign", p.scores.elective];
  return subjects
    .map((subj) => {
      const cur = subjectScore(p, subj) ?? 0;
      const next = Math.min(100, cur + 10);
      const comp = competitionScore(p, prog, { [subj]: next })!;
      return { subject: subj, label: SUBJECTS[subj], delta: next - cur, oldPct: est.pct, newPct: likelihood(comp, prog.sampleCutoff) };
    })
    .filter((i) => i.delta > 0)
    .sort((a, b) => b.newPct - a.newPct);
}

export function alternatives(p: Profile, prog: Program): Program[] {
  return PROGRAMS.filter((x) => x.id !== prog.id && x.field === prog.field)
    .sort((a, b) => (estimate(p, b)?.pct ?? 0) - (estimate(p, a)?.pct ?? 0))
    .slice(0, 3);
}

export const formatTuition = (t: number) => (t === 0 ? "სრულად დაფინანსებული" : `${t.toLocaleString("en-US")} ₾ / წელი`);
