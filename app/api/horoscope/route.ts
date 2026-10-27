/**
 * GET /api/horoscope?sign=Хонь — gogo.mn-ийн өнөөдрийн ордын зурхай.
 *
 * • gogo.mn 12 ордын 7 хоногийн зурхайг нэг дор буцаадаг → 1 цаг кэшлэнэ.
 * • Огноо нь Улаанбаатарын цагаар (UTC+8).
 * • ANTHROPIC_API_KEY байвал Claude 8–12 насны хүүхдэд ойлгомжтойгоор дахин бичнэ (орд + өдрөөр кэшлэнэ).
 */
import Anthropic from "@anthropic-ai/sdk";

export const revalidate = 3600;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";
const kidCache = new Map<string, string>(); // `${sign}:${date}` → хүүхдэд зориулсан текст

async function forKids(sign: string, date: string, text: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) return text;
  const key = `${sign}:${date}`;
  const cached = kidCache.get(key);
  if (cached) return cached;
  try {
    const anthropic = new Anthropic({ timeout: 20000, maxRetries: 1 });
    const response = await anthropic.beta.messages.create({
      model: MODEL,
      max_tokens: 1200,
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: "Чи 8–12 насны хүүхдэд зориулж бичдэг найрсаг туслах. Зөвхөн дахин бичсэн текстээ буцаа, өөр тайлбаргүй.",
      messages: [
        {
          role: "user",
          content: `Энэ бол ${sign} ордын өнөөдрийн зурхай. Үүнийг 8–12 насны хүүхэд амархан ойлгохоор дахин бич:
- Энгийн үг, богино өгүүлбэр, нийт 2–4 өгүүлбэр.
- Утгыг нь хадгал, гэхдээ хайр дурлал, мөнгө, ажил, гэрлэлтийн тухай хэсгийг найз нөхөд, гэр бүл, сургууль, тоглоомын тухай болгож хувирга.
- Айлгах, сэтгэл зовоох зүйлгүй, эерэг, урам өгсөн өнгөтэй. 1–2 тохирох эможи.
Зурхай: ${text}`,
        },
      ],
    });
    if (response.stop_reason === "refusal") return text;
    const kid = response.content
      .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();
    if (!kid) return text;
    kidCache.set(key, kid);
    return kid;
  } catch (e: any) {
    console.error("Horoscope AI error:", e?.message);
    return text;
  }
}

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
    const text = await forKids(sign, today, stripHtml(entry.westHoroscopeDescDesc));
    return Response.json({ sign, date: today, text });
  } catch {
    return Response.json({ error: "unavailable" }, { status: 502 });
  }
}
