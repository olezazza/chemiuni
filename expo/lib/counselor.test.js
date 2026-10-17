import { describe, expect, test } from "bun:test";
import { PROGRAMS } from "./data";
import { EMPTY_PROFILE } from "./types";
import { buildList } from "./engine";
import { decideProposals, validateProposal, parseCounselorReply, counselorContext } from "./counselor";
const base = () => ({ ...EMPTY_PROFILE, listCreated: true, scores: { ...EMPTY_PROFILE.scores, elective: "math", georgian: 75, foreign: 75, electiveScore: 75 } });
const fixture = () => {
  const p = base(); const ids = buildList(p).map(x => x.program.id);
  const outside = PROGRAMS.filter(x => x.electives.includes("math") && !ids.includes(x.id));
  const proposals = [
    { id: "replace", action: "replace", targetId: ids[1], programId: outside[0].id, reason: "Budget", status: "pending" },
    { id: "add", action: "add", targetId: null, programId: outside[1].id, reason: "Field", status: "pending" },
    { id: "remove", action: "remove", targetId: ids[2], programId: null, reason: "Location", status: "pending" },
  ];
  return { ...p, counselor: { messages: [{ id: "m", role: "assistant", parts: [{ type: "text", text: "Advice" }], proposals }] } };
};
const proposals = p => p.counselor.messages[0].proposals;
describe("Counselor approval safety", () => {
  test("one approval never decides the others", () => {
    const p = fixture(); const original = buildList(p).map(x => x.program.id); const n = decideProposals(p, ["replace"], true);
    expect(n.approvedList[1]).toBe(proposals(p)[0].programId); expect(n.approvedList.length).toBe(original.length);
    expect(n.approvedList[0]).toBe(original[0]); expect(proposals(n).map(x => x.status)).toEqual(["accepted", "pending", "pending"]);
  });
  test("rejecting remaining proposals does not change accepted list", () => {
    const accepted = decideProposals(fixture(), ["replace"], true); const n = decideProposals(accepted, ["add", "remove"], false);
    expect(n.approvedList).toEqual(accepted.approvedList); expect(proposals(n).map(x => x.status)).toEqual(["accepted", "rejected", "rejected"]);
  });
  test("standalone removal requires confirmation", () => {
    const p = fixture(); const n = decideProposals(p, ["remove"], true);
    expect(buildList(n).map(x => x.program.id)).toEqual(buildList(p).map(x => x.program.id)); expect(proposals(n)[2].status).toBe("pending");
  });
  test("confirmed removal shrinks list without silently refilling", () => {
    const p = fixture(); const n = decideProposals(p, ["remove"], true, true);
    expect(buildList(n).length).toBe(buildList(p).length - 1); expect(buildList(n).some(x => x.program.id === proposals(p)[2].targetId)).toBe(false);
  });
  test("accept all validates and applies every valid proposal", () => {
    const p = fixture(); const n = decideProposals(p, ["replace", "add", "remove"], true, true);
    expect(proposals(n).every(x => x.status === "accepted")).toBe(true); expect(n.approvedList).toContain(proposals(p)[1].programId); expect(n.approvedList).not.toContain(proposals(p)[0].targetId);
  });
  test("addition beyond eight remains visible", () => { const n = decideProposals(fixture(), ["add"], true); expect(buildList(n).length).toBe(9); });
  test("accepted/rejected decisions cannot be applied again", () => {
    const n = decideProposals(fixture(), ["add"], true); expect(decideProposals(n, ["add"], true).approvedList).toEqual(n.approvedList);
    const r = decideProposals(fixture(), ["replace"], false); expect(decideProposals(r, ["replace"], true).approvedList).toBeUndefined();
  });
  test("unknown IDs are rejected", () => { const p = fixture(); expect(validateProposal(p, { ...proposals(p)[1], programId: "fake" })).not.toBeNull(); });
  test("duplicate additions are rejected", () => { const p = fixture(); expect(validateProposal(p, { ...proposals(p)[1], programId: buildList(p)[0].program.id })).not.toBeNull(); });
  test("incompatible elective is rejected", () => { const p = fixture(); const wrong = PROGRAMS.find(x => !x.electives.includes("math")); expect(validateProposal(p, { ...proposals(p)[1], programId: wrong.id })).not.toBeNull(); });
  test("stale targets never remove another item", () => {
    const p = fixture(); p.removed = [proposals(p)[0].targetId]; const ids = buildList(p).map(x => x.program.id); const n = decideProposals(p, ["replace"], true);
    expect(proposals(n)[0].status).toBe("stale"); expect(buildList(n).map(x => x.program.id)).toEqual(ids);
  });
  test("conflicting proposals validate against earlier accepted changes", () => {
    const p = fixture(); proposals(p)[1].programId = proposals(p)[0].programId;
    const n = decideProposals(p, ["replace", "add"], true); expect(proposals(n).map(x => x.status)).toEqual(["accepted", "stale", "pending"]);
  });
  test("JSON restart preserves list, scores and decisions", () => {
    const p = fixture(); const n = decideProposals(p, ["replace", "add"], true); const restored = JSON.parse(JSON.stringify(n));
    expect(buildList(restored).map(x => x.program.id)).toEqual(n.approvedList); expect(restored.scores).toEqual(p.scores); expect(proposals(restored)[0].status).toBe("accepted");
  });
  test("invalid model reply does not change saved data", () => { const p = fixture(); const before = JSON.stringify(p); expect(() => parseCounselorReply({ message: "Hi", proposals: [{ action: "destroy" }] }, p, "x")).toThrow(); expect(JSON.stringify(p)).toBe(before); });
  test("unknown model IDs are visibly stale", () => { const p = fixture(); const r = parseCounselorReply({ message: "Hi", proposals: [{ action: "add", targetId: null, programId: "fake", reason: "Reason" }] }, p, "x"); expect(r.proposals[0].status).toBe("stale"); });
  test("context reads scores preferences list without personal account data", () => { const p = fixture(); p.account = { name: "private", email: "private", school: "private", gradYear: "private" }; const context = counselorContext(p); expect(context.scores).toEqual(p.scores); expect(context.preferences).toEqual(p.prefs); expect(context.list).toEqual(buildList(p).map(x => x.program.id)); expect(JSON.stringify(context)).not.toContain("private"); });
  test("no list blocks proposals", () => { const p = fixture(); p.listCreated = false; expect(validateProposal(p, proposals(p)[1])).not.toBeNull(); });
});