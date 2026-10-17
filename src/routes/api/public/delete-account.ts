import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, API-Version, App-Version, App-Platform, App-Env",
};
export const Route = createFileRoute("/api/public/delete-account")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers }),
      POST: async ({ request }) => {
        const token = request.headers.get("Authorization")?.replace(/^Bearer /, "");
        if (!token) return Response.json({ error: "Sign in required" }, { status: 401, headers });
        const client = createClient(
          process.env["SUPABASE_URL"]!,
          process.env["SUPABASE_PUBLISHABLE_KEY"]!,
          {
            auth: { persistSession: false },
            global: { headers: { Authorization: `Bearer ${token}` } },
          },
        );
        const { data, error } = await client.auth.getClaims(token);
        if (error || !data?.claims.sub)
          return Response.json({ error: "Sign in required" }, { status: 401, headers });
        const { supabaseAdmin } = await import("../../../integrations/supabase/client.server");
        const { error: failure } = await supabaseAdmin.auth.admin.deleteUser(data.claims.sub);
        return Response.json(failure ? { error: "Deletion failed" } : { deleted: true }, {
          status: failure ? 500 : 200,
          headers,
        });
      },
    },
  },
});
