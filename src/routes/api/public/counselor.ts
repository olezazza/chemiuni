import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, API-Version, App-Version, App-Platform, App-Env",
};
export const Route = createFileRoute("/api/public/counselor")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers }),
      POST: async ({ request }) => {
        const token = request.headers.get("Authorization")?.replace(/^Bearer /, "");
        if (!token) {
          console.warn("[counselor] auth: missing bearer token");
          return Response.json({ error: "Sign in required" }, { status: 401, headers });
        }
        const client = createClient(
          process.env["SUPABASE_URL"]!,
          process.env["SUPABASE_PUBLISHABLE_KEY"]!,
          {
            auth: { persistSession: false },
            global: { headers: { Authorization: `Bearer ${token}` } },
          },
        );
        const { data, error } = await client.auth.getClaims(token);
        if (error || !data?.claims.sub) {
          // Safe diagnostics only: never log the token itself.
          console.warn("[counselor] auth: token rejected", error?.name ?? "no-claims", error?.message ?? "");
          return Response.json({ error: "Sign in required" }, { status: 401, headers });
        }
        const { runCounselor, requestSchema, safeAiError } =
          await import("../../../lib/counselor.server");
        const raw = await request.text();
        if (raw.length > 150000)
          return Response.json({ error: "Conversation too long" }, { status: 413, headers });
        let input;
        try {
          input = requestSchema.parse(JSON.parse(raw));
        } catch {
          console.warn("[counselor] request: invalid body");
          return Response.json({ error: "Invalid context" }, { status: 400, headers });
        }
        if (!input.context.list.length)
          return Response.json({ error: "Create a list first" }, { status: 400, headers });
        const encoder = new TextEncoder();
        const controller = new AbortController();
        request.signal.addEventListener("abort", () => controller.abort(), { once: true });
        const body = new ReadableStream({
          async start(output) {
            const emit = (event: unknown) =>
              output.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
            try {
              emit({ type: "started" });
              await runCounselor(input, controller.signal, emit);
            } catch (e) {
              if (!controller.signal.aborted) console.warn("[counselor] ai:", e instanceof Error ? e.name : "unknown");
              if (!controller.signal.aborted) emit({ type: "error", message: safeAiError(e) });
            } finally {
              try {
                output.close();
              } catch {
                /* Client cancelled. */
              }
            }
          },
          cancel() {
            controller.abort();
          },
        });
        return new Response(body, {
          headers: {
            ...headers,
            "Content-Type": "application/x-ndjson",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
