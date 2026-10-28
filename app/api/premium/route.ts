/**
 * POST /api/premium — асран хамгаалагч охиндоо Bloomy Plus-ийг асаах/унтраах (ДЕМО, төлбөргүй).
 * body: { childId, active }  → 30 хоногийн эрх (идэвхжүүлэх бүрт сунгагдана)
 * Унших нь Supabase RLS-ээр шууд (supabase/premium-subscriptions.sql).
 */
import { authenticateStoreRequest, isUuid, json, loadFamilyChild } from "../store/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLAN_DAYS = 30;

export async function POST(request: Request) {
  try {
    const auth = await authenticateStoreRequest(request);
    if (auth.response) return auth.response;
    if (auth.profile.role !== "mother" || !auth.profile.family_id) return json({ error: "Асран хамгаалагчийн эрх шаардлагатай." }, 403);

    const body = await request.json().catch(() => null);
    if (!isUuid(body?.childId) || typeof body?.active !== "boolean") return json({ error: "Хүсэлт буруу байна." }, 400);
    const child = await loadFamilyChild(auth.admin, auth.profile, body.childId);
    if (!child) return json({ error: "Энэ хүүхдийн тохиргоог өөрчлөх эрхгүй." }, 403);

    const now = new Date();
    const row: Record<string, unknown> = body.active
      ? {
          child_id: child.id,
          active: true,
          started_at: now.toISOString(),
          expires_at: new Date(now.getTime() + PLAN_DAYS * 86_400_000).toISOString(),
          granted_by: auth.profile.id,
          updated_at: now.toISOString(),
        }
      : { child_id: child.id, active: false, expires_at: null, granted_by: auth.profile.id, updated_at: now.toISOString() };

    const { data, error } = await auth.admin
      .from("premium_subscriptions")
      .upsert(row, { onConflict: "child_id" })
      .select("child_id, active, started_at, expires_at")
      .single();
    if (error) throw error;
    return json(data);
  } catch (error) {
    console.error("Premium update failed:", error);
    return json({ error: "Bloomy Plus-ийн тохиргоог хадгалж чадсангүй." }, 500);
  }
}
