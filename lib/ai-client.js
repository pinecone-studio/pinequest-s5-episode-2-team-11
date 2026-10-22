/**
 * Апп-аас /api/ai руу хүсэлт илгээнэ. Алдаа гарвал null буцаана
 * (тэгвэл апп lib/data.js-ийн бэлэн текстийг ашиглана).
 */
export async function askAi(session, payload) {
  if (!session?.access_token) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
