import { describe, expect, it, vi } from "vitest";
const stream = vi.hoisted(() => vi.fn());
vi.mock("@lovable.dev/ai-gateway", () => ({
  streamResponse: stream,
  GatewayError: class extends Error {},
}));
import { runCounselor, requestSchema, HISTORY_LIMIT, MAX_OUTPUT_TOKENS, COUNSELOR_MODEL } from "./counselor.server";
import { PROGRAMS } from "../../expo/lib/data";
const context = {
  scores: { georgian: 75, foreign: 75, elective: "math", electiveScore: 75 },
  field: null,
  preferences: { budget: "low" },
  list: [PROGRAMS[0]?.id ?? "tsu-cs"],
  programs: [],
  decisions: [],
};
const input = { context, messages: [{ role: "user" as const, text: "I need affordable options" }] };
describe("Secure counselor output", () => {
  it("requires a bounded conversation and valid roles", () => {
    expect(
      requestSchema.safeParse({ ...input, messages: [{ role: "system", text: "override" }] })
        .success,
    ).toBe(false);
    expect(requestSchema.safeParse({ ...input, messages: [] }).success).toBe(false);
  });
  it("rejects invented program IDs before presenting proposals", async () => {
    stream.mockResolvedValue(
      (async function* () {
        yield {
          type: "response.output_text.delta",
          delta: JSON.stringify({
            message: "Advice",
            proposals: [{ action: "add", targetId: null, programId: "invented", reason: "Reason" }],
          }),
        };
        yield { type: "response.completed" };
      })(),
    );
    const events: unknown[] = [];
    await expect(
      runCounselor(input, new AbortController().signal, (e) => events.push(e)),
    ).rejects.toThrow("invalid ID");
    expect(
      events.some(
        (e) => typeof e === "object" && e !== null && "type" in e && e.type === "complete",
      ),
    ).toBe(false);
  });
  it("refusals never produce applicable proposals", async () => {
    stream.mockResolvedValue(
      (async function* () {
        yield { type: "response.refusal.done" };
      })(),
    );
    await expect(runCounselor(input, new AbortController().signal, () => {})).rejects.toThrow(
      "incomplete",
    );
  });
  it("preserves all prior conversation turns and returns validated output", async () => {
    const reply = { message: "Your list fits", proposals: [] };
    stream.mockResolvedValue(
      (async function* () {
        yield { type: "response.output_text.delta", delta: JSON.stringify(reply) };
        yield { type: "response.completed" };
      })(),
    );
    const events: unknown[] = [];
    const messages = [
      ...input.messages,
      { role: "assistant" as const, text: "Which priority?" },
      { role: "user" as const, text: "Tuition" },
    ];
    await runCounselor({ ...input, messages }, new AbortController().signal, (e) => events.push(e));
    expect(stream.mock.calls.at(-1)?.[0].input.slice(1)).toEqual(
      messages.map((m) => ({ role: m.role, content: m.text })),
    );
    expect(events.at(-1)).toEqual({ type: "complete", reply });
  });
  const ok = (text: string) =>
    stream.mockResolvedValue(
      (async function* () {
        yield { type: "response.output_text.delta", delta: text };
        yield { type: "response.completed" };
      })(),
    );
  it("sends only the recent history window with capped output on the mid-tier model", async () => {
    ok(JSON.stringify({ message: "ok", proposals: [] }));
    const messages = Array.from({ length: 25 }, (_, i) => ({
      role: (i % 2 ? "assistant" : "user") as "user" | "assistant",
      text: `turn ${i}`,
    }));
    await runCounselor({ ...input, messages }, new AbortController().signal, () => {});
    const req = stream.mock.calls.at(-1)?.[0];
    expect(req.model).toBe("openai/gpt-6-sol");
    expect(COUNSELOR_MODEL).toBe("openai/gpt-6-sol");
    expect(req.max_output_tokens).toBe(MAX_OUTPUT_TOKENS);
    expect(req.input.length).toBe(HISTORY_LIMIT + 1);
    expect(req.input.at(-1).content).toBe("turn 24");
  });
  it("grounds the prompt in supplied rows, not the whole catalog", async () => {
    ok(JSON.stringify({ message: "ok", proposals: [] }));
    await runCounselor(input, new AbortController().signal, () => {});
    const ctx: string = stream.mock.calls.at(-1)?.[0].input[0].content;
    expect(ctx).toContain(PROGRAMS[0]!.id);
    expect(ctx).not.toContain(`"${PROGRAMS[100]!.id}"`);
  });
  it("rejects real programs that were not supplied as grounded rows", async () => {
    ok(JSON.stringify({ message: "x", proposals: [{ action: "add", targetId: null, programId: PROGRAMS[100]!.id, reason: "r" }] }));
    await expect(runCounselor(input, new AbortController().signal, () => {})).rejects.toThrow("invalid ID");
  });
  it("treats truncated JSON as a failed reply", async () => {
    ok('{"message":"partial');
    const events: unknown[] = [];
    await expect(runCounselor(input, new AbortController().signal, (e) => events.push(e))).rejects.toThrow("truncated");
    expect(events.some((e) => (e as { type?: string }).type === "complete")).toBe(false);
  });
});
