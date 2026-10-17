import { PROGRAMS, programById } from "./data";
import { buildList, estimate, isEligible, matchesBudget, matchesCity } from "./engine";
import type { Profile } from "./types";
import type { Proposal, CounselorMessage } from "./counselor-types";

export function validateProposal(p: Profile, proposal: Proposal): string | null {
  if (!p.listCreated) return "ჯერ შექმენი სია.";
  if (proposal.status !== "pending") return "ეს შეთავაზება უკვე განხილულია.";
  const ids = buildList(p).map((x) => x.program.id);
  if (!["add", "remove", "replace"].includes(proposal.action)) return "უცნობი მოქმედება.";
  if (proposal.action !== "add" && (!proposal.targetId || !ids.includes(proposal.targetId)))
    return "პროგრამა სიაში აღარ არის.";
  if (proposal.action === "add" && proposal.targetId !== null) return "არასწორი დამატება.";
  if (proposal.action === "remove" && proposal.programId !== null) return "არასწორი ამოღება.";
  if (proposal.action !== "remove") {
    const program = programById(proposal.programId ?? "");
    if (!program) return "პროგრამა ვერ მოიძებნა.";
    if (ids.includes(program.id)) return "ეს პროგრამა უკვე სიაშია.";
    if (!isEligible(p, program)) return "შენი არჩევითი საგანი ამ პროგრამას არ შეესაბამება.";
  }
  return null;
}

/** One pure transaction: list changes and decisions are saved together by StoreProvider. */
export function decideProposals(
  p: Profile,
  proposalIds: string[],
  accept: boolean,
  confirmRemoval = false,
): Profile {
  let next = p;
  const messages = p.counselor?.messages ?? [];
  const results = new Map<string, Proposal>();
  for (const message of messages)
    for (const proposal of message.proposals) {
      if (
        !proposalIds.includes(proposal.id) ||
        proposal.status !== "pending" ||
        results.has(proposal.id)
      )
        continue;
      if (!accept) {
        results.set(proposal.id, { ...proposal, status: "rejected" });
        continue;
      }
      if (proposal.action === "remove" && !confirmRemoval) continue;
      const notice = validateProposal(next, proposal);
      if (notice) {
        results.set(proposal.id, { ...proposal, status: "stale", notice });
        continue;
      }
      let ids = buildList(next).map((x) => x.program.id);
      if (proposal.action === "add" && proposal.programId) ids = [...ids, proposal.programId];
      if (proposal.action === "remove") ids = ids.filter((id) => id !== proposal.targetId);
      if (proposal.action === "replace" && proposal.programId) {
        const replacement = proposal.programId;
        ids = ids.map((id) => (id === proposal.targetId ? replacement : id));
      }
      next = {
        ...next,
        approvedList: ids,
        pinned:
          proposal.action === "remove"
            ? next.pinned.filter((id) => id !== proposal.targetId)
            : [
                ...new Set([
                  ...next.pinned.filter((id) => id !== proposal.targetId),
                  ...(proposal.programId ? [proposal.programId] : []),
                ]),
              ],
        removed: [
          ...new Set([
            ...next.removed.filter((id) => id !== proposal.programId),
            ...(proposal.targetId ? [proposal.targetId] : []),
          ]),
        ],
      };
      results.set(proposal.id, { ...proposal, status: "accepted" });
    }
  return {
    ...next,
    counselor: {
      messages: messages.map((m) => ({
        ...m,
        proposals: m.proposals.map((x) => results.get(x.id) ?? x),
      })),
    },
  };
}

/** Candidates beyond the current list that are sent as grounded options per request. */
export const CANDIDATE_LIMIT = 18;

export function counselorContext(p: Profile) {
  const list = buildList(p).map((x) => x.program.id);
  const decisions = (p.counselor?.messages ?? [])
    .flatMap((m) =>
      m.proposals.map((x) => ({
        action: x.action,
        targetId: x.targetId,
        programId: x.programId,
        status: x.status,
      })),
    )
    .slice(-20);
  const compact = (program: (typeof PROGRAMS)[number]) => {
    const est = estimate(p, program);
    return { id: program.id, assessment: est ? { pct: est.pct, gap: est.gap } : null };
  };
  const candidates = PROGRAMS.filter(
    (program) => !list.includes(program.id) && isEligible(p, program) && matchesCity(p, program),
  )
    .map((program) => ({
      program,
      rank:
        (p.field && program.field === p.field ? 200 : 0) +
        (matchesBudget(p, program) ? 100 : 0) +
        (estimate(p, program)?.pct ?? 0),
    }))
    .sort((a, b) => b.rank - a.rank)
    .slice(0, CANDIDATE_LIMIT)
    .map((x) => x.program);
  const listed = list.map((id) => programById(id)).filter((x) => !!x);
  return {
    scores: p.scores,
    field: p.field,
    preferences: p.prefs,
    list,
    programs: [...listed, ...candidates].map(compact),
    decisions,
  };
}

export function parseCounselorReply(raw: unknown, p: Profile, messageId: string): CounselorMessage {
  if (
    !raw ||
    typeof raw !== "object" ||
    !("message" in raw) ||
    typeof raw.message !== "string" ||
    !raw.message.trim() ||
    raw.message.length > 4000 ||
    !("proposals" in raw) ||
    !Array.isArray(raw.proposals) ||
    raw.proposals.length > 6
  )
    throw new Error("invalid reply");
  const seen = new Set<string>();
  const proposals: Proposal[] = raw.proposals.map((value: unknown, index: number) => {
    if (
      !value ||
      typeof value !== "object" ||
      !("action" in value) ||
      !("targetId" in value) ||
      !("programId" in value) ||
      !("reason" in value)
    )
      throw new Error("invalid proposal");
    if (value.action !== "add" && value.action !== "remove" && value.action !== "replace")
      throw new Error("invalid action");
    if (
      (value.targetId !== null && typeof value.targetId !== "string") ||
      (value.programId !== null && typeof value.programId !== "string") ||
      typeof value.reason !== "string" ||
      !value.reason.trim() ||
      value.reason.length > 1000
    )
      throw new Error("invalid fields");
    const proposal: Proposal = {
      id: `${messageId}.${index}`,
      action: value.action,
      targetId: value.targetId,
      programId: value.programId,
      reason: value.reason,
      status: "pending",
    };
    const key = `${proposal.action}:${proposal.targetId}:${proposal.programId}`;
    if (seen.has(key)) throw new Error("duplicate proposal");
    seen.add(key);
    const notice = validateProposal(p, proposal);
    return notice ? { ...proposal, status: "stale", notice } : proposal;
  });
  return {
    id: messageId,
    role: "assistant",
    parts: [{ type: "text", text: raw.message }],
    proposals,
  };
}
