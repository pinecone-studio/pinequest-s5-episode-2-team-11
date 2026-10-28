/**
 * Runs every 15 minutes (Supabase pg_cron → supabase/notification-cron.sql):
 * creates the day's reminders and sends deferred notifications that are due.
 * Protected by CRON_SECRET (Authorization: Bearer <secret>).
 */
import { deliverDue, generateReminders } from "../../../../lib/notify";
import { supabaseServerClients } from "../../../../lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "cron_not_configured" }, { status: 500 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "unauthorized" }, { status: 401 });

  // Dev only: ?now=2026-10-28T02:00:00Z simulates the current time.
  const simulated = process.env.NODE_ENV !== "production" ? new URL(request.url).searchParams.get("now") : null;
  const now = simulated && !Number.isNaN(Date.parse(simulated)) ? new Date(simulated) : new Date();

  const { admin } = supabaseServerClients();
  const reminders = await generateReminders(admin, { now });
  const delivered = await deliverDue(admin, { now });
  return Response.json({ now: now.toISOString(), reminders, delivered }, { headers: { "Cache-Control": "no-store" } });
}

export const GET = run;
export const POST = run;
