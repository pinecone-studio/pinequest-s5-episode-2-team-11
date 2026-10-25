/**
 * Апп-аас /api/ai руу хүсэлт илгээнэ. Алдаа гарвал null буцаана
 * (тэгвэл апп lib/data.js-ийн бэлэн текстийг ашиглана).
 */
export async function askAi(session, payload, timeoutMs = 15000, options = {}) {
  const detailed = options?.detailed === true;
  if (!session?.access_token) return detailed ? { error: "unauthorized" } : null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return detailed ? { error: data?.error ?? `http_${res.status}` } : null;
    return data;
  } catch (error) {
    const code = error?.name === "AbortError" ? "timeout" : "network_error";
    return detailed ? { error: code } : null;
  } finally {
    clearTimeout(timer);
  }
}
