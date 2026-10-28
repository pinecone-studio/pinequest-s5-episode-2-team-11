/**
 * Team-only feedback results. 404 unless the caller's email is in ADMIN_EMAILS
 * (comma-separated). Reads with the service role and returns aggregates only —
 * user ids are never selected.
 *   GET ?range=7|30|all  [&format=csv]
 */
import { summarize, toCsv } from "../../../../lib/feedback-stats";
import { supabaseServerClients } from "../../../../lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const notFound = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
  if (!token || !admins.length) return notFound();
  const { admin, auth } = supabaseServerClients();
  const { data, error } = await auth.auth.getUser(token);
  if (error || !data.user?.email || !admins.includes(data.user.email.toLowerCase())) return notFound();

  const url = new URL(request.url);
  const range = url.searchParams.get("range");
  const days = range === "7" ? 7 : range === "30" ? 30 : null;
  const since = days ? new Date(Date.now() - days * 86_400_000).toISOString() : null;

  let surveys = admin.from("feedback_surveys").select("role, answers, created_at").order("created_at", { ascending: false }).limit(10000);
  let micros = admin.from("feedback_micro").select("target_type, target_id, value").limit(50000);
  if (since) {
    surveys = surveys.gte("created_at", since);
    micros = micros.gte("created_at", since);
  }
  const [surveyResult, microResult] = await Promise.all([surveys, micros]);
  if (surveyResult.error || microResult.error) return Response.json({ error: "load_failed" }, { status: 500 });

  const stats = summarize(surveyResult.data ?? [], microResult.data ?? []);
  if (url.searchParams.get("format") === "csv") {
    return new Response(`﻿${toCsv(stats)}`, {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="bloomy-feedback-${range ?? "all"}.csv"`, "Cache-Control": "no-store" },
    });
  }
  return Response.json({ range: range ?? "all", ...stats }, { headers: { "Cache-Control": "no-store" } });
}
