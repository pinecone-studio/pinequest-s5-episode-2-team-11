/** Server-only Supabase clients: `admin` (service role) and `auth` (anon, for verifying bearer tokens). */
import { createClient } from "@supabase/supabase-js";

export function supabaseServerClients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) throw new Error("Server configuration missing");
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  return { admin: createClient(url, service, options), auth: createClient(url, anon, options) };
}

/** The signed-in user's profile from `Authorization: Bearer <access token>`, or null. */
export async function authenticatedProfile(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { admin, auth } = supabaseServerClients();
  const { data, error } = await auth.auth.getUser(token);
  if (error || !data.user) return null;
  const { data: profile } = await admin.from("profiles").select("id, role, family_id, display_name").eq("id", data.user.id).maybeSingle();
  return profile ? { admin, profile: profile as { id: string; role: string; family_id: string | null; display_name: string | null } } : null;
}
