/**
 * POST /api/ai — Bloomy-ийн AI (Claude API).
 *
 * • API түлхүүр зөвхөн сервер дээр (.env.local → ANTHROPIC_API_KEY). Утсанд хэзээ ч очихгүй.
 * • Зөвхөн нэвтэрсэн хэрэглэгч ашиглана (Supabase access token шалгана).
 * • Хариу JSON. Алдаа гарвал апп бэлэн текст рүү шилжинэ.
 */
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-5-5";

const PHASE_MN: Record<string, string> = {
  period: "сарын тэмдгийн үе",
  follicular: "дааврын тэнцвэрт (фолликулын) үе",
  ovulation: "овуляцийн үе",
  luteal: "сарын тэмдгийн өмнөх (мөчлөг) үе",
};
const MOOD_MN: Record<string, string> = {
  sad: "гунигтай, уйлмаар",
  angry: "уурласан, цочромтгой",
  tired: "ядарсан",
  craving: "чихэр, амттан идмээр",
};

const SAFETY = `Чи "Bloomy" апп-ын зөөлөн, найрсаг туслах. Хэрэглэгчид нь Монголын 10–18 насны охид болон тэдний асран хамгаалагчид.
Дүрэм:
- Зөвхөн энгийн, найрсаг монгол хэлээр бич. Богино байх.
- Ямар ч эмийн нэр, тун, хэмжээ бүү зөвлө. Онош бүү тавь.
- Хүчтэй өвдөлт, хэт их цус алдалт, ухаан балартах зэрэг шинж дурдагдвал том хүн, эмчид хандахыг зөвлө.
- Хоолны дэглэм, жин хасах, калори тоолох талаар бүү зөвлө.
- Бие махбодийг ичгүүртэй зүйл гэж бүү хандаарай; ичгүүргүй, эерэг байлга.
- Хариугаа ЗӨВХӨН JSON хэлбэрээр, өөр текстгүй буцаа.`;

function buildPrompt(body: any): { prompt: string; maxTokens: number } | null {
  const phase = PHASE_MN[body.phase] ?? "тодорхойгүй үе";
  if (body.type === "insight") {
    return {
      maxTokens: 400,
      prompt: `Охин одоо мөчлөгийнхөө ${body.day ?? "?"} дэх өдөр, ${phase}-д байна.${
        body.daysUntil ? ` Сарын тэмдэг ирэхэд ${body.daysUntil} хоног үлдсэн.` : ""
      }${body.mood ? ` Өнөөдөр ${MOOD_MN[body.mood] ?? body.mood} байгаа.` : ""}
Түүнд өнөөдөр хэрэг болох 3 богино, практик зөвлөгөө бич (тус бүр 1 өгүүлбэр, эхэнд нь 1 тохирох эможи).
JSON: {"tips": ["...", "...", "..."]}`,
    };
  }
  if (body.type === "mood") {
    const emoji = String(body.emoji ?? "").slice(0, 16);
    const feeling = emoji || MOOD_MN[body.mood] || String(body.mood ?? "").slice(0, 16);
    return {
      maxTokens: 900,
      prompt: `Охиноос "Өнөөдөр сэтгэл санаа чинь ямар байна?" гэж асуухад тэр ${feeling} гэж хариулсан (${phase}).
Эможиг нь уншиж мэдрэмжийг нь ойлгоод, 2 минутын дотор хийж болох шийдэл санал болго.
Мөн тэр мэдрэмжид тохирох, сэтгэл сэргээх 3 кино эсвэл анимэйшн санал болго: 10–18 насны охинд тохирох (G/PG), бодит, алдартай, кино театрт гарсан бүтээл байх.
"title" нь Википедиа дээрх албан ёсны англи нэр, "year" нь гарсан он.
JSON: {"label": "мэдрэмжийн 1-2 үгтэй нэр", "title": "дулаан богино гарчиг + 1 эможи", "why": "яагаад ийм мэдрэмж төрж болох тухай 1-2 өгүүлбэр", "snack": "хөнгөн, эрүүл зууш", "music": "хөгжмийн санаа", "action": "2 минутын энгийн үйлдэл", "movies": [{"title": "...", "year": 2015, "note": "яагаад тохирох тухай богино 1 өгүүлбэр"}]}`,
    };
  }
  if (body.type === "nudge") {
    const name = String(body.daughterName || "Охин").slice(0, 40);
    return {
      maxTokens: 250,
      prompt: `Охин ${name} одоо ${phase}-д байна.${
        body.daysUntil ? ` Сарын тэмдэг ирэхэд ${body.daysUntil} хоног үлдсэн.` : ""
      }${body.mood ? ` Өнөөдөр охин ${MOOD_MN[body.mood] ?? body.mood} байгаа.` : ""}
Асран хамгаалагчид охиндоо өнөөдөр үзүүлж болох нэг зөөлөн, хүндэтгэлтэй, хэт хөндлөнгөөс оролцохгүй халамжийн санаа өг (1–2 өгүүлбэр, Монгол гэр бүлийн амьдралд тохирсон, жишээ нь чацарганы цай, хамтдаа алхах).
JSON: {"nudge": "..."}`,
    };
  }
  return null;
}

// Википедиагаас киноны албан ёсны постерыг хайна (API түлхүүр шаардлагагүй)
async function findPoster(title: string, year?: number | string): Promise<string | null> {
  const candidates = [year ? `${title} (${year} film)` : null, `${title} (film)`, title].filter(Boolean) as string[];
  for (const name of candidates) {
    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name.replace(/ /g, "_"))}`,
        { headers: { "User-Agent": "Bloomy/1.0 (family wellbeing app)" }, signal: AbortSignal.timeout(4000) }
      );
      if (!res.ok) continue;
      const d = await res.json();
      if (d.type === "disambiguation" || !/film|anim/i.test(d.description ?? "")) continue;
      const src = d.thumbnail?.source ?? d.originalimage?.source;
      if (src) return src;
    } catch {
      /* дараагийн нэрийг туршина */
    }
  }
  return null;
}

async function withPosters(movies: any): Promise<any[]> {
  if (!Array.isArray(movies)) return [];
  const list = movies
    .filter((m) => m && typeof m.title === "string")
    .slice(0, 3)
    .map((m) => ({ title: m.title.slice(0, 80), year: m.year ?? null, note: String(m.note ?? "").slice(0, 160) }));
  return Promise.all(list.map(async (m) => ({ ...m, poster: await findPoster(m.title, m.year ?? undefined) })));
}

function extractJson(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!apiKey || !url || !anon) return Response.json({ error: "ai_not_configured" }, { status: 503 });

  // 1) Нэвтэрсэн хэрэглэгч мөн эсэх
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });
  const supabase = createClient(url, anon);
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) return Response.json({ error: "unauthorized" }, { status: 401 });

  // 2) Хүсэлт
  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const built = buildPrompt(body);
  if (!built) return Response.json({ error: "bad_type" }, { status: 400 });

  // 3) Claude
  try {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: built.maxTokens,
      system: SAFETY,
      messages: [{ role: "user", content: built.prompt }],
    });
    const text = res.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("");
    const json = extractJson(text);
    if (!json) return Response.json({ error: "bad_ai_output" }, { status: 502 });
    if (body.type === "mood") json.movies = await withPosters(json.movies);
    return Response.json(json);
  } catch (e: any) {
    console.error("AI error:", e?.message);
    return Response.json({ error: "ai_failed" }, { status: 502 });
  }
}
