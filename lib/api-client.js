/** fetch() with the signed-in user's bearer token (server routes verify it). */
import { supabase } from "./supabase";

export async function authFetch(url, init = {}) {
  const { data } = await supabase.auth.getSession();
  return fetch(url, { cache: "no-store", ...init, headers: { ...(init.headers ?? {}), Authorization: `Bearer ${data.session?.access_token ?? ""}` } });
}

export async function authJson(url, method = "GET", body) {
  try {
    const response = await authFetch(url, { method, ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) });
    const data = await response.json().catch(() => ({}));
    return response.ok ? data : { error: data.error ?? `http_${response.status}` };
  } catch {
    return { error: "network_error" };
  }
}
