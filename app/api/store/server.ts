import { createClient } from "@supabase/supabase-js";

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };

export function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function createClients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) throw new Error("Supabase server configuration missing");
  return {
    auth: createClient(url, anonKey, clientOptions),
    admin: createClient(url, serviceKey, clientOptions),
  };
}

export async function authenticateStoreRequest(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return { response: json({ error: "Нэвтрэх шаардлагатай." }, 401) };

  const { auth, admin } = createClients();
  const { data, error } = await auth.auth.getUser(token);
  if (error || !data.user) return { response: json({ error: "Нэвтрэх шаардлагатай." }, 401) };

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, role, birth_date, family_id")
    .eq("id", data.user.id)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) return { response: json({ error: "Профайл олдсонгүй." }, 403) };

  return { user: data.user, profile, admin };
}

export async function loadFamilyChild(admin: any, parent: any, childId: unknown) {
  if (typeof childId !== "string") return null;
  const { data: child, error } = await admin
    .from("profiles")
    .select("id, role, display_name, birth_date, family_id")
    .eq("id", childId)
    .eq("family_id", parent.family_id)
    .eq("role", "daughter")
    .maybeSingle();
  if (error) throw error;
  return child;
}

export const isUuid = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
