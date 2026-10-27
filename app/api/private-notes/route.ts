import { createHmac, pbkdf2, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const derive = promisify(pbkdf2);
const ITERATIONS = 150_000;
const TOKEN_TTL_MS = 15 * 60 * 1000;
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

function clients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) throw new Error("Server configuration missing");
  return {
    auth: createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } }),
    admin: createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } }),
  };
}

async function authenticate(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { auth, admin } = clients();
  const { data, error } = await auth.auth.getUser(token);
  if (error || !data.user) return null;
  const { data: profile } = await admin.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (profile?.role !== "daughter") return null;
  return { user: data.user, admin };
}

function unlockToken(uid: string, expires: number) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const payload = `${uid}.${expires}`;
  return `${Buffer.from(payload).toString("base64url")}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
}

function validUnlockToken(value: string | null, uid: string) {
  if (!value) return false;
  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) return false;
  try {
    const payload = Buffer.from(encoded, "base64url").toString();
    const [tokenUid, expires] = payload.split(".");
    const expected = createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY!).update(payload).digest();
    const provided = Buffer.from(signature, "base64url");
    return tokenUid === uid && Number(expires) > Date.now() && provided.length === expected.length && timingSafeEqual(provided, expected);
  } catch { return false; }
}

function validPin(pin: unknown): pin is string {
  return typeof pin === "string" && /^\d{4,6}$/.test(pin);
}

async function hashPin(pin: string, salt: string) {
  return (await derive(pin, Buffer.from(salt, "hex"), ITERATIONS, 32, "sha256")).toString("hex");
}

export async function POST(request: Request) {
  try {
    const auth = await authenticate(request);
    if (!auth) return json({ error: "Нэвтрэх шаардлагатай." }, 401);
    const body = await request.json();
    const uid = auth.user.id;
    const { data: lock, error: lockError } = await auth.admin.from("note_locks").select("*").eq("user_id", uid).maybeSingle();
    if (lockError) return json({ error: "Хамгаалалтын тохиргоо ачаалж чадсангүй. Migration-ийг шалгана уу." }, 500);

    if (body.action === "status") {
      const date = typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : null;
      const { data: row } = date ? await auth.admin.from("day_logs").select("note").eq("user_id", uid).eq("log_date", date).maybeSingle() : { data: null };
      return json({ enabled: Boolean(lock), hasNote: Boolean(row?.note) });
    }

    if (body.action === "set") {
      if (lock) return json({ error: "PIN аль хэдийн тохируулагдсан байна." }, 409);
      if (!validPin(body.pin)) return json({ error: "4–6 оронтой PIN оруулна уу." }, 400);
      const salt = randomBytes(16).toString("hex");
      const pin_hash = await hashPin(body.pin, salt);
      const { error } = await auth.admin.from("note_locks").insert({ user_id: uid, pin_hash, pin_salt: salt });
      if (error) return json({ error: "PIN хадгалж чадсангүй." }, 500);
      return json({ enabled: true });
    }

    if (body.action === "verify" || body.action === "disable") {
      if (!lock) return json({ error: "PIN тохируулаагүй байна." }, 400);
      if (lock.locked_until && new Date(lock.locked_until).getTime() > Date.now()) return json({ error: "Олон удаа буруу оруулсан тул түр түгжлээ. Дараа дахин оролдоно уу." }, 429);
      if (!validPin(body.pin)) return json({ error: "PIN буруу байна." }, 400);
      const expected = Buffer.from(lock.pin_hash, "hex");
      const actual = Buffer.from(await hashPin(body.pin, lock.pin_salt), "hex");
      const matches = expected.length === actual.length && timingSafeEqual(expected, actual);
      if (!matches) {
        const attempts = Number(lock.failed_attempts ?? 0) + 1;
        await auth.admin.from("note_locks").update({ failed_attempts: attempts >= 5 ? 0 : attempts, locked_until: attempts >= 5 ? new Date(Date.now() + 5 * 60_000).toISOString() : null }).eq("user_id", uid);
        return json({ error: attempts >= 5 ? "Олон удаа буруу орууллаа. 5 минутын дараа дахин оролдоно уу." : "PIN буруу байна." }, 401);
      }
      if (body.action === "disable") {
        await auth.admin.from("note_locks").delete().eq("user_id", uid);
        return json({ enabled: false });
      }
      await auth.admin.from("note_locks").update({ failed_attempts: 0, locked_until: null }).eq("user_id", uid);
      return json({ token: unlockToken(uid, Date.now() + TOKEN_TTL_MS), expiresIn: TOKEN_TTL_MS });
    }

    if (body.action === "reset") {
      const password = typeof body.password === "string" ? body.password : "";
      if (password.length < 6 || !auth.user.email) return json({ error: "Нууц үгээ оруулаад дахин баталгаажуулна уу." }, 400);
      const { error } = await clients().auth.auth.signInWithPassword({ email: auth.user.email, password });
      if (error) return json({ error: "Нууц үг буруу байна." }, 401);
      if (!validPin(body.pin)) return json({ error: "4–6 оронтой шинэ PIN оруулна уу." }, 400);
      const salt = randomBytes(16).toString("hex");
      const pin_hash = await hashPin(body.pin, salt);
      const { error: updateError } = await auth.admin.from("note_locks").upsert({ user_id: uid, pin_hash, pin_salt: salt, failed_attempts: 0, locked_until: null });
      if (updateError) return json({ error: "PIN шинэчилж чадсангүй." }, 500);
      return json({ enabled: true });
    }

    if (body.action === "note") {
      if (typeof body.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) return json({ error: "Өдөр буруу байна." }, 400);
      if (lock && !validUnlockToken(request.headers.get("x-note-unlock-token"), uid)) return json({ error: "Тэмдэглэлээ үзэхийн тулд PIN-ээ оруулна уу." }, 423);
      const { data, error } = await auth.admin.from("day_logs").select("note").eq("user_id", uid).eq("log_date", body.date).maybeSingle();
      if (error) return json({ error: "Тэмдэглэл ачаалж чадсангүй." }, 500);
      return json({ note: data?.note ?? "" });
    }

    return json({ error: "Үйлдэл танигдсангүй." }, 400);
  } catch {
    return json({ error: "Хүсэлтийг боловсруулж чадсангүй." }, 500);
  }
}
