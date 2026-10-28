/** Browser helper for /api/feedback (the server checks the user and validates everything). */
import { supabase } from "./supabase";

export async function feedbackRequest(action, payload = {}) {
  try {
    const { data } = await supabase.auth.getSession();
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
      body: JSON.stringify({ action, ...payload }),
      cache: "no-store",
    });
    const body = await response.json().catch(() => ({}));
    return response.ok ? body : { error: body.error ?? "failed" };
  } catch {
    return { error: "network_error" };
  }
}
