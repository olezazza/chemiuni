import type { City, FieldId, SubjectId } from "./data";
import type { CounselorState } from "./counselor-types";

export type ExamStatus = "preparing" | "pending" | "available";
export type ScoreType = "practice" | "expected" | "official";
export type Budget = "state" | "low" | "medium" | "any";
export type Ambition = "safe" | "balanced" | "ambitious";

export type Scores = {
  georgian: number | null;
  foreign: number | null;
  foreignLang: string;
  elective: SubjectId | null;
  electiveScore: number | null;
  type: ScoreType;
  updatedAt: string | null;
};

export type Prefs = {
  cities: City[];
  anyCity: boolean;
  excludedCities: City[];
  budget: Budget;
  scholarshipFocus: boolean;
  ambition: Ambition;
  notes: string;
};

export type Account = { name: string; school: string; gradYear: string; email: string };

export type Profile = {
  account: Account;
  onboarded: boolean;
  field: FieldId | null;
  examStatus: ExamStatus | null;
  scores: Scores;
  prefs: Prefs;
  listCreated: boolean;
  pinned: string[];
  removed: string[];
  approvedList?: string[];
  counselor?: CounselorState;
};

export const EMPTY_PROFILE: Profile = {
  account: { name: "", school: "", gradYear: "", email: "" },
  onboarded: false,
  field: null,
  examStatus: null,
  scores: { georgian: null, foreign: null, foreignLang: "ინგლისური", elective: null, electiveScore: null, type: "expected", updatedAt: null },
  prefs: { cities: [], anyCity: true, excludedCities: [], budget: "any", scholarshipFocus: false, ambition: "balanced", notes: "" },
  listCreated: false,
  pinned: [],
  removed: [],
};

export const EXAM_STATUS_LABEL: Record<ExamStatus, string> = {
  preparing: "ვემზადები გამოცდებისთვის",
  pending: "შედეგებს ველოდები",
  available: "შედეგები უკვე მაქვს",
};

export const SCORE_TYPE_LABEL: Record<ScoreType, string> = {
  practice: "სავარჯიშო ტესტი",
  expected: "მოსალოდნელი ქულა",
  official: "ოფიციალური შედეგი",
};

export const BUDGET_LABEL: Record<Budget, string> = {
  state: "მხოლოდ სახელმწიფო გრანტით",
  low: "დაბალი საფასური (≤ 2 250 ₾)",
  medium: "საშუალო (≤ 5 500 ₾)",
  any: "ბიუჯეტი არ მზღუდავს",
};

export const AMBITION_LABEL: Record<Ambition, string> = {
  safe: "მეტი უსაფრთხო არჩევანი",
  balanced: "დაბალანსებული",
  ambitious: "მეტი ამბიციური არჩევანი",
};
