/**
 * GET /api/horoscope?sign=Хонь — gogo.mn-ийн өнөөдрийн ордын зурхай.
 *
 * • gogo.mn 12 ордын 7 хоногийн зурхайг нэг дор буцаадаг → 1 цаг кэшлэнэ.
 * • Огноо нь Улаанбаатарын цагаар (UTC+8).
 */
export const revalidate = 3600;

const SOURCE = "https://backend.gogo.mn/api/v1/horoscope/data";
const UB_OFFSET_MS = 8 * 3600 * 1000;

type Entry = {
  westHoroscopeDescDesc: string;
  westHoroscopeDescStartDate: string;
  zodiac?: { zodiacName?: string };
};

const ubDate = (d: Date) => new Date(d.getTime() + UB_OFFSET_MS).toISOString().slice(0, 10);
const stripHtml = (s: string) =>
  s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export async function GET(req: Request) {
  const sign = new URL(req.url).searchParams.get("sign")?.trim();
  if (!sign) return Response.json({ error: "sign_required" }, { status: 400 });

  const now = new Date();
  const year = new Date(now.getTime() + UB_OFFSET_MS).getUTCFullYear();
  try {
    const res = await fetch(`${SOURCE}/${encodeURIComponent("Өдөр")}?year=${year}`, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate },
    });
    if (!res.ok) throw new Error(`gogo ${res.status}`);
    const json = await res.json();
    const all: Entry[] = Array.isArray(json?.data?.horoscope) ? json.data.horoscope : [];
    const today = ubDate(now);
    const entry = all.find(
      (e) => e.zodiac?.zodiacName?.trim() === sign && ubDate(new Date(e.westHoroscopeDescStartDate)) === today,
    );
    if (!entry) return Response.json({ error: "not_found" }, { status: 404 });
    return Response.json({ sign, date: today, text: stripHtml(entry.westHoroscopeDescDesc) });
  } catch {
    return Response.json({ error: "unavailable" }, { status: 502 });
  }
}
