"use client";

/**
 * FamilyContext — апп-ын бүх өгөгдөл ба үйлдэл.
 *
 *  • Нэвтрэлт: Supabase Auth (имэйл + нууц үг)
 *  • Өгөгдөл:  Supabase (profiles, families, supplies, day_logs, notifications, kit_checks)
 *  • Синк:     Supabase Realtime — ээж, охин хоёр өөр утаснаас шууд харна
 *  • AI:       /api/ai (сервер дээр) → алдаа гарвал lib/data.js-ийн бэлэн текст
 *
 * Дэлгэц бүр useFamily()-ээр хэрэгтэй зүйлээ авна.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_SUPPLIES, KIT_ITEMS, MOOD_FALLBACK, MOOD_OPTIONS, PHASES, SOS_STEPS, SOS_TOTAL } from "../lib/data";
import { genitive, getMomNudges, getPhaseKey } from "../lib/helpers";
import { cycleStatus, formatTime, toDateStr } from "../lib/dates";
import { predictPeriodRange } from "../lib/cycle";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { askAi } from "../lib/ai-client";

const FamilyContext = createContext(null);
const LOCAL_KIT_KEY = "bloomy:kit-checks";
const LOCAL_CUSTOM_SUPPLIES_KEY = "bloomy:custom-supplies";
const LOCAL_PERIOD_STARTS_PREFIX = "bloom:period-starts:";
const DAILY_MOOD_EMOJI = { 1: "😣", 2: "😟", 3: "😐", 4: "🙂", 5: "😄" };

const AUTH_ERRORS = {
  "Invalid login credentials": "Имэйл эсвэл нууц үг буруу байна.",
  "User already registered": "Энэ имэйлээр аль хэдийн бүртгүүлсэн байна. «Нэвтрэх» дээр дарна уу.",
  "Email not confirmed": "Имэйлээ баталгаажуулна уу (inbox-оо шалгаарай).",
};
const authMessage = (e) =>
  AUTH_ERRORS[e?.message] ||
  (e?.message?.includes("Password should be") ? "Нууц үг дор хаяж 6 тэмдэгттэй байх ёстой." : null) ||
  "Алдаа гарлаа. Интернэтээ шалгаад дахин оролдоно уу.";

export function FamilyProvider({ children }) {
  /* ================= Нэвтрэлт ба профайл ================= */
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(supabaseConfigured);
  const [profile, setProfile] = useState(null);
  const [family, setFamily] = useState(null); // { id, code }
  const [members, setMembers] = useState([]); // гэр бүлийн бүх профайл
  const [activeChildId, setActiveChildId] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [ready, setReady] = useState(false); // эхний бүрэн ачаалалт дууссан эсэх
  const [loadError, setLoadError] = useState(null); // "no_profile" | "network"

  /* ================= Гэр бүлийн өгөгдөл ================= */
  const [supplyRows, setSupplyRows] = useState([]);
  const [localSupplies, setLocalSupplies] = useState(DEFAULT_SUPPLIES); // гэр бүлгүй үед
  const [localCustomSupplies, setLocalCustomSupplies] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [moodRows, setMoodRows] = useState([]);
  const [kitRows, setKitRows] = useState([]);
  const [localKit, setLocalKit] = useState([]);
  const [periodStarts, setPeriodStarts] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LOCAL_KIT_KEY) ?? "[]");
      if (Array.isArray(saved)) setLocalKit(saved.filter((id) => KIT_ITEMS.some((item) => item.id === id)));
    } catch {
      /* localStorage боломжгүй */
    }
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LOCAL_CUSTOM_SUPPLIES_KEY) ?? "[]");
      if (Array.isArray(saved)) setLocalCustomSupplies(saved.filter((item) => item?.kind?.startsWith("custom_")));
    } catch {
      /* localStorage боломжгүй */
    }
  }, []);

  /* ================= Дэлгэцийн төлөв ================= */
  const [tab, setTab] = useState("home");
  const [learnTab, setLearnTab] = useState("pad");
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [joining, setJoining] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [flippedMyths, setFlippedMyths] = useState([]);
  const [toast, setToast] = useState(null);
  const [syncTick, setSyncTick] = useState(0);
  const [showSync, setShowSync] = useState(false);

  /* ================= AI ================= */
  const [aiTips, setAiTips] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [moodCard, setMoodCard] = useState(null);
  const [moodLoading, setMoodLoading] = useState(false);
  const [moodTimer, setMoodTimer] = useState(120);
  const [moodTimerRunning, setMoodTimerRunning] = useState(false);
  const [aiNudge, setAiNudge] = useState(null);
  const [nudgeIndex, setNudgeIndex] = useState(0);
  const [nudgeLoading, setNudgeLoading] = useState(false);
  const [nudgesDone, setNudgesDone] = useState([]);

  /* ================= SOS ================= */
  const [sosOpen, setSosOpen] = useState(false);
  const [sosSeconds, setSosSeconds] = useState(SOS_TOTAL);
  const [sosRunning, setSosRunning] = useState(false);
  const [breathIn, setBreathIn] = useState(true);
  const [sosSent, setSosSent] = useState(false);

  const userId = session?.user?.id ?? null;
  const familyId = family?.id ?? null;

  useEffect(() => {
    const key = `${LOCAL_PERIOD_STARTS_PREFIX}${userId ?? "local"}`;
    let saved = [];
    try {
      const value = JSON.parse(localStorage.getItem(key) ?? "[]");
      if (Array.isArray(value)) saved = value;
    } catch { /* хуанлийн хадгалсан өдрүүдийг алгасна */ }
    const merged = [...new Set([...saved, profile?.last_period_start].filter(Boolean))].sort();
    setPeriodStarts(merged);
  }, [userId, profile?.last_period_start]);

  /* ================= Тооцоолсон утгууд ================= */
  const view = profile?.role ?? null; // "mother" | "daughter"
  const guardianProfile = members.find((member) => member.role === "mother") ?? null;
  const guardianName = guardianProfile?.display_name || null;
  const childProfiles = members.filter((member) => member.role === "daughter");
  useEffect(() => {
    if (view !== "mother") {
      setActiveChildId(null);
      return;
    }
    setActiveChildId((current) => childProfiles.some((child) => child.id === current) ? current : (childProfiles[0]?.id ?? null));
  }, [view, members]);
  const activeChild = childProfiles.find((child) => child.id === activeChildId) ?? (view === "mother" ? childProfiles[0] ?? null : null);
  const daughterProfile =
    view === "daughter" ? profile : activeChild;
  const linked =
    view === "daughter"
      ? members.some((member) => member.role === "mother" && member.id !== userId)
      : childProfiles.length > 0;
  const daughterName = daughterProfile?.display_name || (view === "mother" ? "Охин тань" : "");
  const nameGen = daughterProfile?.display_name ? genitive(daughterProfile.display_name) : "Охины тань";

  const cycleLength = daughterProfile?.cycle_length ?? 28;
  const periodLength = daughterProfile?.period_length ?? 5;
  const lastPeriodStart = daughterProfile?.last_period_start ?? null;
  const birthDate = daughterProfile?.birth_date ?? null;
  const cycle = cycleStatus(lastPeriodStart, cycleLength);
  const hasCycle = Boolean(cycle);
  const day = cycle?.displayDay ?? 1;
  const daysLate = cycle?.daysLate ?? 0;
  const phaseKey = getPhaseKey(cycle?.day ?? 1, cycleLength, periodLength);
  const phase = PHASES[phaseKey];
  const isPeriod = hasCycle && phaseKey === "period";
  const daysUntil = isPeriod ? 0 : (cycle?.daysUntil ?? 0);

  const today = toDateStr();
  const daughterMoodRow = moodRows.find((r) => r.user_id === daughterProfile?.id && r.log_date === today);
  const mood = daughterMoodRow?.mood ?? null;
  const shareWithMom = daughterProfile?.share_mood ?? true;
  const baseMood = MOOD_OPTIONS.find((m) => m.id === mood);
  // mood нь хуучин id (sad, angry…) эсвэл охины өөрөө бичсэн эможи байж болно
  const selectedMood = mood
    ? { ...(baseMood ?? { ...MOOD_FALLBACK, emoji: mood }), ...(moodCard?.id === mood ? moodCard : {}) }
    : null;
  const sharedMood = view === "mother" ? mood : linked && shareWithMom ? mood : null;

  const supplies = useMemo(() => {
    if (!familyId) return { ...localSupplies, ...Object.fromEntries(localCustomSupplies.map((item) => [item.kind, item])) };
    const out = {};
    for (const [k, base] of Object.entries(DEFAULT_SUPPLIES)) {
      const row = supplyRows.find((r) => r.kind === k);
      out[k] = { ...base, count: row?.count ?? 0, max: row?.max ?? base.max };
    }
    for (const row of supplyRows) {
      if (!Object.hasOwn(DEFAULT_SUPPLIES, row.kind)) {
        out[row.kind] = { label: row.label || "Өөр хэрэглэл", emoji: row.emoji || "📦", count: row.count ?? 0, max: row.max ?? 10 };
      }
    }
    return out;
  }, [familyId, supplyRows, localSupplies, localCustomSupplies]);
  const lowSupplyCount = Object.values(supplies).filter((s) => s.count / s.max <= 0.3).length;

  const inbox = notifications.map((n) => ({ ...n, time: formatTime(n.created_at) }));
  const momInbox = view === "mother"
    ? inbox.filter((message) => message.recipient_role === "mother" && (message.sender_id === activeChild?.id || !message.sender_id))
    : [];
  const teenInbox = view === "daughter"
    ? inbox.filter((message) => message.recipient_role === "daughter" && (!message.recipient_id || message.recipient_id === userId))
    : [];
  const momUnread = momInbox.filter((m) => !m.read).length;
  const latestTeenMsg = teenInbox.find((m) => !m.read);

  const kitOwnerId = view === "mother" ? activeChild?.id : userId;
  const kitChecked = familyId
    ? kitRows.filter((row) => row.child_id === kitOwnerId).map((row) => row.item_id)
    : localKit;

  const phaseTips = phase.tips;
  const insightTips = aiTips ?? [0, 1, 2].map((i) => phaseTips[i % phaseTips.length]);
  const fallbackNudges = getMomNudges(phaseKey, daysUntil, sharedMood);
  const currentNudge = aiNudge ?? fallbackNudges[nudgeIndex % fallbackNudges.length];
  const sosStep = Math.min(SOS_STEPS.length - 1, Math.floor((SOS_TOTAL - sosSeconds) / 60));

  // Аль дэлгэцийг харуулах вэ
  const noPeriodYet = Boolean(daughterProfile?.no_period_yet) && !lastPeriodStart;
  const periodPrediction = predictPeriodRange({
    starts: periodStarts,
    today,
    hasHadPeriod: Boolean(lastPeriodStart) && !noPeriodYet,
  });
  const needsCycleSetup = view === "daughter" && !lastPeriodStart && !profile?.no_period_yet;
  const showOnboarding = !session || !profile || !ready || needsCycleSetup;

  /* ================= Нэвтрэлтийг сонсох ================= */
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
      // Аккаунт нь устгагдсан бол утсан дээрх хуучин нэвтрэлтийг цэвэрлэнэ.
      // (Ачааллыг саатуулахгүйн тулд арын дэвсгэрт шалгана)
      if (data.session) {
        supabase.auth.getUser().then(({ error }) => {
          if (error?.status === 401 || error?.status === 403 || /not.*found|does not exist/i.test(error?.message ?? "")) {
            supabase.auth.signOut({ scope: "local" });
          }
        });
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  /* ================= Өгөгдөл татах ================= */
  // Token шинэчлэгдэх бүрт session объект солигддог. Metadata-г ref-д хадгалснаар
  // бүх өгөгдлийг дахин татаж «Ачаалж байна» гаргахаас сэргийлнэ.
  const metaRef = useRef({});
  metaRef.current = session?.user?.user_metadata ?? {};

  const loadProfile = useCallback(async () => {
    if (!userId) return null;
    // Trigger профайлыг үүсгэхэд хэдэн мс шаардагдаж магадгүй тул хэд дахин оролдоно
    for (let i = 0; i < 5; i++) {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (data) {
        // Бүртгүүлэхдээ оруулсан төрсөн өдөр профайлд ороогүй бол нөхөж хадгална
        const metaBirth = metaRef.current.birth_date;
        if (!data.birth_date && metaBirth) {
          data.birth_date = metaBirth;
          await supabase.from("profiles").update({ birth_date: metaBirth }).eq("id", userId);
        }
        setProfile(data);
        return data;
      }
      // 2 удаа олдохгүй бол (schema-аас өмнө бүртгүүлсэн гэх мэт) өөрөө нөхөж үүсгэнэ
      if (i === 1) {
        const meta = metaRef.current;
        await supabase.from("profiles").insert({
          id: userId,
          role: meta.role === "mother" ? "mother" : "daughter",
          display_name: meta.display_name ?? "",
          birth_date: meta.birth_date || null,
        });
        continue;
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    return null;
  }, [userId]);

  const loadFamily = useCallback(async (fid) => {
    if (!fid) {
      setFamily(null);
      setMembers([]);
      return;
    }
    const [{ data: fam }, { data: mem }] = await Promise.all([
      supabase.from("families").select("id, code").eq("id", fid).maybeSingle(),
      supabase.from("profiles").select("*").eq("family_id", fid).order("created_at"),
    ]);
    setFamily(fam ?? null);
    setMembers(mem ?? []);
  }, []);

  const loadSupplies = useCallback(async (fid) => {
    const { data } = await supabase.from("supplies").select("*").eq("family_id", fid);
    setSupplyRows(data ?? []);
  }, []);

  const loadNotifications = useCallback(async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifications(data ?? []);
  }, []);

  const loadMoods = useCallback(async () => {
    if (!supabase || !userId) return setMoodRows([]);
    const from = toDateStr(new Date(Date.now() - 30 * 86400000));
    if (view === "mother") {
      if (!activeChildId) return setMoodRows([]);
      const { data } = await supabase.rpc("get_shared_daily_moods", { p_child_id: activeChildId, p_from: from, p_to: toDateStr() });
      setMoodRows((data ?? []).map((row) => ({ ...row, user_id: activeChildId, family_id: familyId, mood: DAILY_MOOD_EMOJI[row.mood] ?? null })));
      return;
    }
    if (view === "daughter") {
      const { data } = await supabase.rpc("get_my_day_logs", { p_from: from, p_to: toDateStr() });
      setMoodRows((data ?? []).map((row) => ({ ...row, user_id: userId, family_id: familyId, mood: DAILY_MOOD_EMOJI[row.mood] ?? null })));
      return;
    }
    setMoodRows([]);
  }, [userId, view, activeChildId, familyId]);

  const loadKit = useCallback(async (fid) => {
    const { data } = await supabase.from("kit_checks").select("child_id, item_id").eq("family_id", fid);
    setKitRows(data ?? []);
  }, []);

  const loadAll = useCallback(async () => {
    if (!userId) return;
    setDataLoading(true);
    setLoadError(null);
    try {
      await loadAllInner();
    } catch (e) {
      console.error("Bloom load error:", e);
      setLoadError("network");
    } finally {
      setDataLoading(false);
      setReady(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, loadProfile, loadFamily, loadSupplies, loadKit, loadNotifications, loadMoods]);

  const loadAllInner = async () => {
    const p = await loadProfile();
    if (!p) {
      setLoadError("no_profile");
      return;
    }
    let fid = p?.family_id ?? null;
    // Асран хамгаалагч өөрийн кодтой гэр бүлийг үүсгэнэ. Охид асран хамгаалагчийн кодоор нэгдэнэ.
    if (p?.role === "mother" && !fid) {
      const { error } = await supabase.rpc("create_family");
      if (!error) fid = (await loadProfile())?.family_id ?? null;
    }
    await Promise.all([
      loadFamily(fid),
      fid ? loadSupplies(fid) : Promise.resolve(),
      fid ? loadKit(fid) : Promise.resolve(),
      loadNotifications(),
      loadMoods(),
    ]);
    if (!fid) {
      setSupplyRows([]);
      setKitRows([]);
    }
  };

  useEffect(() => {
    setReady(false);
    if (userId) loadAll();
    else {
      setProfile(null);
      setFamily(null);
      setMembers([]);
      setNotifications([]);
      setMoodRows([]);
      setSupplyRows([]);
      setKitRows([]);
    }
  }, [userId, loadAll]);

  /* ================= Realtime: нөгөө утасны өөрчлөлтийг шууд авах ================= */
  const pulseSync = useCallback(() => setSyncTick((t) => t + 1), []);

  useEffect(() => {
    if (!supabase || !familyId) return;
    const filter = `family_id=eq.${familyId}`;
    const channel = supabase
      .channel(`family-${familyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "supplies", filter }, () => {
        loadSupplies(familyId);
        pulseSync();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter }, () => {
        loadNotifications();
        pulseSync();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "kit_checks" }, () => {
        loadKit(familyId);
        pulseSync();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        loadFamily(familyId);
        loadProfile();
        loadMoods();
        pulseSync();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId, loadSupplies, loadNotifications, loadMoods, loadKit, loadFamily, loadProfile, pulseSync]);

  useEffect(() => {
    if ((view === "mother" && activeChildId) || view === "daughter") loadMoods();
  }, [view, activeChildId, loadMoods]);

  useEffect(() => {
    if (view !== "mother" || !activeChildId) return;
    const refreshId = window.setInterval(loadMoods, 60000);
    return () => window.clearInterval(refreshId);
  }, [view, activeChildId, loadMoods]);

  // Апп-руу буцаж ороход (утсыг түгжээд нээх) шинэчилнэ
  useEffect(() => {
    if (!userId) return;
    const onVisible = () => document.visibilityState === "visible" && loadAll();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [userId, loadAll]);

  /* ================= Жижиг таймерууд ================= */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!syncTick) return;
    setShowSync(true);
    const t = setTimeout(() => setShowSync(false), 1600);
    return () => clearTimeout(t);
  }, [syncTick]);

  useEffect(() => {
    if (!sosOpen || !sosRunning) return;
    const t = setInterval(() => setSosSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [sosOpen, sosRunning]);

  useEffect(() => {
    if (sosSeconds === 0) setSosRunning(false);
  }, [sosSeconds]);

  useEffect(() => {
    if (!sosOpen) return;
    setBreathIn(true);
    const t = setInterval(() => setBreathIn((b) => !b), 4000);
    return () => clearInterval(t);
  }, [sosOpen]);

  useEffect(() => {
    if (!moodTimerRunning) return;
    const t = setInterval(() => setMoodTimer((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [moodTimerRunning]);

  useEffect(() => {
    if (moodTimer === 0) setMoodTimerRunning(false);
  }, [moodTimer]);

  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, [tab, view]);

  /* ================= Мэдэгдэл ================= */
  const notify = useCallback(
    async (recipientRole, text, kind = "info", recipientId = null) => {
      if (!familyId || !recipientId) return false;
      const { error } = await supabase
        .from("notifications")
        .insert({ family_id: familyId, sender_id: userId, recipient_id: recipientId, recipient_role: recipientRole, kind, text });
      if (error) setToast("Илгээж чадсангүй. Интернэтээ шалгаарай.");
      return !error;
    },
    [familyId, userId],
  );
  const guardianId = view === "mother" ? userId : members.find((member) => member.role === "mother")?.id;
  const sendToMom = (text, kind) => notify("mother", text, kind, guardianId);
  const sendToTeen = (text, kind = "care") => notify("daughter", text, kind, view === "mother" ? activeChild?.id : null);

  const markRead = async (id) => {
    setNotifications((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  // Ээж «Мэдэгдэл» табыг нээхэд уншсан гэж тэмдэглэнэ
  useEffect(() => {
    if (view !== "mother" || tab !== "messages" || momUnread === 0) return;
    const ids = momInbox.filter((n) => !n.read).map((n) => n.id);
    setNotifications((p) => p.map((n) => ids.includes(n.id) ? { ...n, read: true } : n));
    supabase
      .from("notifications")
      .update({ read: true })
      .in("id", ids)
      .then(() => {});
  }, [view, tab, momUnread, momInbox]);

  /* ================= Нэвтрэлтийн үйлдлүүд ================= */
  const signUp = async ({ role, name, birthDate, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { role, display_name: name.trim(), birth_date: birthDate || null } },
    });
    if (error) return authMessage(error);
    if (!data.session) return "Бүртгэл үүслээ! Имэйлээ шалгаж баталгаажуулаад нэвтэрнэ үү.";
    return null;
  };

  const signIn = async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return error ? authMessage(error) : null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setTab("home");
    setAiTips(null);
    setAiNudge(null);
    setMoodCard(null);
  };

  /* ================= Гэр бүл ================= */
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(family?.code ?? "");
      setToast("Гэр бүлийн код хуулагдлаа 📋");
    } catch {
      setToast(`Код: ${family?.code}`);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const shareCode = async () => {
    const text = `Bloomy 🌸 Guardian Access Code-оор гэр бүлийн бүлэгт холбогдоорой: ${family?.code}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Bloomy", text, url: window.location.origin });
      } catch {
        /* хэрэглэгч цуцалсан */
      }
      return;
    }
    copyCode();
  };

  const joinFamily = async () => {
    const digits = codeInput.replace(/\D/g, "");
    if (view !== "daughter" || digits.length !== 6 || joining) return;
    setJoining(true);
    const { error } = await supabase.rpc("join_family", { p_code: `BLOOM-${digits}` });
    setJoining(false);
    if (error) {
      setCodeError(
        error.message?.includes("invalid_code")
          ? "Ийм код олдсонгүй. Кодоо дахин шалгаарай."
          : "Холбогдож чадсангүй. Интернэтээ шалгаад дахин оролдоно уу.",
      );
      return;
    }
    setCodeError("");
    setCodeInput("");
    await loadAll();
    setToast("Асран хамгаалагчтайгаа амжилттай холбогдлоо 💗");
  };

  const leaveFamily = async () => {
    if (view !== "daughter" || !linked || unlinking) return false;
    setUnlinking(true);
    const { error } = await supabase.rpc("leave_family");
    if (error) {
      setUnlinking(false);
      setCodeError("Холболтыг салгаж чадсангүй. Дахин оролдоно уу.");
      return false;
    }
    setCodeError("");
    setCodeInput("");
    await loadAll();
    setUnlinking(false);
    setToast("Асран хамгаалагчтай холболтыг салгалаа.");
    return true;
  };

  /* ================= Мөчлөг ================= */
  const saveCycle = async ({ lastPeriodStart: start, cycleLength: cl, periodLength: pl }) => {
    const patch = { last_period_start: start, cycle_length: cl, period_length: pl, no_period_yet: false };
    setProfile((p) => ({ ...p, ...patch }));
    const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
    if (error) setToast("Хадгалж чадсангүй. Дахин оролдоно уу.");
    else pulseSync();
    return !error;
  };

  const savePeriodStartDates = async (dates, nextPeriodLength = periodLength) => {
    const starts = [...new Set(dates.filter((date) => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= today))].sort();
    if (!starts.length) {
      setToast("Ядаж нэг сарын тэмдэг эхэлсэн өдрийг үлдээнэ үү.");
      return false;
    }
    const lengths = starts.slice(1).map((date, index) => Math.round((new Date(`${date}T00:00:00`) - new Date(`${starts[index]}T00:00:00`)) / 86400000)).filter((days) => days >= 15 && days <= 60).slice(-6).map((days) => Math.min(45, Math.max(21, days)));
    const nextCycleLength = lengths.length ? Math.round(lengths.reduce((sum, length) => sum + length, 0) / lengths.length) : 28;
    const ok = await saveCycle({ lastPeriodStart: starts.at(-1), cycleLength: nextCycleLength, periodLength: nextPeriodLength });
    if (!ok) return false;
    const key = `${LOCAL_PERIOD_STARTS_PREFIX}${userId ?? "local"}`;
    try { localStorage.setItem(key, JSON.stringify(starts)); } catch { /* localStorage боломжгүй */ }
    setPeriodStarts(starts);
    return true;
  };

  const startPeriod = async () => {
    const ok = await saveCycle({ lastPeriodStart: today, cycleLength, periodLength });
    if (!ok) return;
    const starts = [...new Set([...periodStarts, today])].sort();
    try { localStorage.setItem(`${LOCAL_PERIOD_STARTS_PREFIX}${userId ?? "local"}`, JSON.stringify(starts)); } catch { /* localStorage боломжгүй */ }
    setPeriodStarts(starts);
    if (linked) {
      await sendToMom(`${nameGen} сарын тэмдэг өнөөдөр ирлээ. Бага зэрэг илүү халамж хэрэгтэй 💗`, "period");
      setToast("Тэмдэглэлээ! Ээжид зөөлөн мэдэгдэл очлоо 🌸");
    } else setToast("Тэмдэглэлээ 🌸");
  };

  const markNoPeriodYet = async () => {
    setProfile((p) => ({ ...p, no_period_yet: true }));
    await supabase.from("profiles").update({ no_period_yet: true }).eq("id", userId);
  };

  const setShareWithMom = async (next) => {
    const value = typeof next === "function" ? next(shareWithMom) : next;
    setProfile((p) => ({ ...p, share_mood: value }));
    await supabase.from("profiles").update({ share_mood: value }).eq("id", userId);
  };

  /* ================= Сэтгэл санаа + AI ================= */
  const moodCacheKey = `bloom:mood:${today}`;

  const loadMoodCard = async (value) => {
    setMoodLoading(true);
    const ai = await askAi(
      session,
      { type: "mood", emoji: value, phase: phaseKey, day: cycle?.day ?? null },
      30000
    );
    const card = ai?.title ? { id: value, ...ai } : null;
    setMoodCard(card);
    try {
      if (card) localStorage.setItem(moodCacheKey, JSON.stringify(card));
    } catch {
      /* localStorage боломжгүй */
    }
    setMoodLoading(false);
  };

  const pickMood = async (value) => {
    const scoreById = { sad: 1, angry: 2, tired: 3, craving: 3 };
    const scoreByEmoji = { "😣": 1, "😟": 2, "😐": 3, "🙂": 4, "😄": 5 };
    const score = scoreById[value] ?? scoreByEmoji[value] ?? null;
    if (!score) return;
    const emoji = DAILY_MOOD_EMOJI[score];
    const row = { user_id: userId, family_id: familyId, log_date: today, mood: emoji };
    setMoodRows((p) => [...p.filter((r) => !(r.user_id === userId && r.log_date === today)), row]);
    setMoodTimer(120);
    setMoodTimerRunning(false);
    const { error } = await supabase.rpc("set_my_day_mood", { p_log_date: today, p_mood: score });
    if (error) setToast("Хадгалж чадсангүй.");
    await loadMoodCard(emoji);
  };

  const clearMood = async () => {
    setMoodRows((p) => p.filter((r) => !(r.user_id === userId && r.log_date === today)));
    setMoodTimerRunning(false);
    setMoodCard(null);
    try {
      localStorage.removeItem(moodCacheKey);
    } catch {
      /* localStorage боломжгүй */
    }
    await supabase.rpc("clear_my_day_mood", { p_log_date: today });
  };

  // Апп дахин ачаалагдахад өнөөдрийн мэдрэмжийн картыг сэргээнэ
  useEffect(() => {
    if (view !== "daughter" || !session || !mood || moodLoading || moodCard?.id === mood) return;
    try {
      const cached = JSON.parse(localStorage.getItem(moodCacheKey) ?? "null");
      if (cached?.id === mood) return setMoodCard(cached);
    } catch {
      /* localStorage боломжгүй */
    }
    loadMoodCard(mood);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, session, mood]);

  const fetchInsight = useCallback(
    async (force = false) => {
      if (!session || view !== "daughter" || !hasCycle) return;
      const cacheKey = `bloom:tips:${today}:${phaseKey}`;
      if (!force) {
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) return setAiTips(JSON.parse(cached));
        } catch {
          /* localStorage боломжгүй */
        }
      }
      setInsightLoading(true);
      const ai = await askAi(session, {
        type: "insight",
        phase: phaseKey,
        day: cycle?.day ?? null,
        daysUntil,
        mood,
      });
      if (Array.isArray(ai?.tips) && ai.tips.length) {
        setAiTips(ai.tips.slice(0, 3));
        try {
          localStorage.setItem(cacheKey, JSON.stringify(ai.tips.slice(0, 3)));
        } catch {
          /* ignore */
        }
      } else {
        // AI ажиллахгүй бол бэлэн зөвлөмжүүдээс сэлгэнэ
        setAiTips((prev) => {
          const start = prev ? (phaseTips.indexOf(prev[0]) + 3) % phaseTips.length : 0;
          return [0, 1, 2].map((i) => phaseTips[(Math.max(start, 0) + i) % phaseTips.length]);
        });
      }
      setInsightLoading(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, view, hasCycle, today, phaseKey, daysUntil, mood],
  );

  useEffect(() => {
    if (view === "daughter" && hasCycle) fetchInsight(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, hasCycle, phaseKey]);

  const refreshInsight = () => !insightLoading && fetchInsight(true);

  const fetchNudge = useCallback(async () => {
    if (!session || view !== "mother" || !linked) return;
    setNudgeLoading(true);
    const ai = await askAi(session, {
      type: "nudge",
      phase: phaseKey,
      daysUntil,
      mood: sharedMood,
      daughterName: daughterProfile?.display_name ?? "",
    });
    if (ai?.nudge) setAiNudge(ai.nudge);
    else {
      setAiNudge(null);
      setNudgeIndex((i) => i + 1);
    }
    setNudgeLoading(false);
  }, [session, view, linked, phaseKey, daysUntil, sharedMood, daughterProfile?.display_name]);

  const refreshNudge = () => !nudgeLoading && fetchNudge();

  const markNudgeDone = async () => {
    setNudgesDone((p) => [...p, currentNudge]);
    await sendToTeen("Ээж чамд зориулж жаахан халамж бэлдлээ 💗", "care");
    setToast("Сайхан байна! Охиндоо мэдэгдэл очлоо 🌸");
    setTimeout(fetchNudge, 500);
  };

  /* ================= Хэрэгсэл ================= */
  const updateSupply = async (key, delta) => {
    if (!familyId) {
      const current = supplies[key];
      if (!current) return;
      const updated = { ...current, count: Math.min(current.max, Math.max(0, current.count + delta)) };
      if (key.startsWith("custom_")) {
        setLocalCustomSupplies((prev) => {
          const next = prev.map((item) => item.kind === key ? { ...item, count: updated.count } : item);
          try { localStorage.setItem(LOCAL_CUSTOM_SUPPLIES_KEY, JSON.stringify(next)); } catch { /* localStorage боломжгүй */ }
          return next;
        });
      } else setLocalSupplies((p) => ({ ...p, [key]: updated }));
      return;
    }
    const cur = supplies[key];
    const count = Math.min(cur.max, Math.max(0, cur.count + delta));
    setSupplyRows((p) => p.map((r) => (r.kind === key ? { ...r, count } : r)));
    await supabase
      .from("supplies")
      .update({ count, updated_at: new Date().toISOString() })
      .eq("family_id", familyId)
      .eq("kind", key);
  };

  const addSupply = async (label, emoji = "📦") => {
    const cleanLabel = label.trim();
    if (!cleanLabel) return false;
    if (Object.values(supplies).some((item) => item.label.toLocaleLowerCase() === cleanLabel.toLocaleLowerCase())) {
      setToast("Ийм нэртэй хэрэглэл аль хэдийн байна.");
      return false;
    }
    const item = { kind: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, label: cleanLabel, emoji, count: 0, max: 10 };
    if (!familyId) {
      setLocalCustomSupplies((prev) => {
        const next = [...prev, item];
        try { localStorage.setItem(LOCAL_CUSTOM_SUPPLIES_KEY, JSON.stringify(next)); } catch { /* localStorage боломжгүй */ }
        return next;
      });
      return true;
    }
    setSupplyRows((prev) => [...prev, { ...item, family_id: familyId }]);
    const { error } = await supabase.from("supplies").insert({ ...item, family_id: familyId });
    if (error) {
      setSupplyRows((prev) => prev.filter((row) => row.kind !== item.kind));
      setToast("Хэрэглэл нэмэхэд алдаа гарлаа. Supabase-ийн custom-supplies тохиргоог ажиллуулна уу.");
      return false;
    }
    setToast(`${cleanLabel} нэмэгдлээ ✓`);
    return true;
  };

  const removeSupply = async (key) => {
    if (!key.startsWith("custom_")) return;
    if (!familyId) {
      setLocalCustomSupplies((prev) => {
        const next = prev.filter((item) => item.kind !== key);
        try { localStorage.setItem(LOCAL_CUSTOM_SUPPLIES_KEY, JSON.stringify(next)); } catch { /* localStorage боломжгүй */ }
        return next;
      });
      return;
    }
    const previous = supplyRows;
    setSupplyRows((rows) => rows.filter((row) => row.kind !== key));
    const { error } = await supabase.from("supplies").delete().eq("family_id", familyId).eq("kind", key);
    if (error) {
      setSupplyRows(previous);
      setToast("Хэрэглэл устгахад алдаа гарлаа.");
    }
  };

  const restock = async (key) => {
    const s = supplies[key];
    setSupplyRows((p) => p.map((r) => (r.kind === key ? { ...r, count: r.max } : r)));
    await supabase
      .from("supplies")
      .update({ count: s.max, updated_at: new Date().toISOString() })
      .eq("family_id", familyId)
      .eq("kind", key);
    await sendToTeen(`Ээж чиний ${s.label.toLowerCase()}-ийг нөхөн дүүргэлээ ${s.emoji}`, "supply");
    setToast(`${s.label} нөхөн дүүргэгдлээ ✓`);
  };

  const requestSupplies = async () => {
    const low = Object.values(supplies)
      .filter((s) => s.count / s.max <= 0.3)
      .map((s) => s.label.toLowerCase());
    const ok = await sendToMom(
      `${profile?.display_name || "Охин тань"}: ${low.length ? low.join(", ") : "ариун цэврийн хэрэгсэл"} дуусах дөхөж байна. Авч өгөх үү? 🛍️`,
      "supply",
    );
    if (ok) setToast("Ээжид хүсэлт илгээлээ 💌");
  };

  /* ================= SOS ================= */
  const openSos = () => {
    setSosSeconds(SOS_TOTAL);
    setSosRunning(true);
    setSosSent(false);
    setSosOpen(true);
  };

  const sosNotifyMom = async () => {
    const ok = await sendToMom(
      `${profile?.display_name || "Охин тань"} яг одоо хэвлийгээр хүчтэй өвдөж байна. Халуун жин, дулаан тэврэлт тусална 🤍`,
      "sos",
    );
    if (ok) setSosSent(true);
  };

  /* ================= Боловсрол ================= */
  const saveKit = async (ids) => {
    const nextIds = Array.from(new Set((Array.isArray(ids) ? ids : []).filter((id) => KIT_ITEMS.some((item) => item.id === id))));
    if (!familyId) {
      setLocalKit(nextIds);
      try {
        localStorage.setItem(LOCAL_KIT_KEY, JSON.stringify(nextIds));
      } catch {
        /* localStorage боломжгүй */
      }
      return true;
    }

    if (!kitOwnerId) return false;
    const currentIds = kitRows.filter((row) => row.child_id === kitOwnerId).map((row) => row.item_id);
    const removeIds = currentIds.filter((id) => !nextIds.includes(id));
    const addIds = nextIds.filter((id) => !currentIds.includes(id));

    if (removeIds.length) {
      const { error } = await supabase
        .from("kit_checks")
        .delete()
        .eq("family_id", familyId)
        .eq("child_id", kitOwnerId)
        .in("item_id", removeIds);
      if (error) {
        setToast("Цүнхний жагсаалтыг хадгалж чадсангүй. Дахин оролдоно уу.");
        return false;
      }
    }

    if (addIds.length) {
      const { error } = await supabase
        .from("kit_checks")
        .insert(addIds.map((item_id) => ({ family_id: familyId, child_id: kitOwnerId, item_id })));
      if (error) {
        await loadKit(familyId);
        setToast("Цүнхний жагсаалтыг хадгалж чадсангүй. Дахин оролдоно уу.");
        return false;
      }
    }

    setKitRows((rows) => [
      ...rows.filter((row) => row.child_id !== kitOwnerId),
      ...nextIds.map((item_id) => ({ child_id: kitOwnerId, item_id })),
    ]);
    return true;
  };

  const toggleMyth = (id) =>
    setFlippedMyths((p) => (p.includes(id) ? p.filter((m) => m !== id) : [...p, id]));

  const openBell = () => setTab("messages");

  const updateName = async (name) => {
    const display_name = name.trim();
    if (!display_name) return false;
    const { error } = await supabase.from("profiles").update({ display_name }).eq("id", userId);
    if (error) {
      setToast("Нэр хадгалж чадсангүй. Дахин оролдоно уу.");
      return false;
    }
    setProfile((p) => ({ ...p, display_name }));
    setToast("Нэр хадгалагдлаа ✓");
    return true;
  };

  const updateEmail = async (email) => {
    const nextEmail = email.trim();
    if (!nextEmail || nextEmail === session?.user?.email) return true;
    const { error } = await supabase.auth.updateUser({ email: nextEmail });
    if (error) {
      setToast("Имэйл солиж чадсангүй. Хаягаа шалгаад дахин оролдоно уу.");
      return false;
    }
    setToast("Шинэ имэйл хаяг руу баталгаажуулах холбоос илгээлээ.");
    return true;
  };

  /* ================= Ээжийн статус текст ================= */
  const careMessage = (() => {
    if (!linked) return "Охин тань таны кодоор холбогдсоны дараа халамжийн статус энд харагдана.";
    if (noPeriodYet)
      return `${nameGen} анхны сарын тэмдэг хараахан ирээгүй. «Сурах» хэсгийг хамтдаа үзэж, цүнхэнд нь бэлтгэл хийгээрэй 🌱`;
    if (!hasCycle) return `${daughterName} мөчлөгийнхөө мэдээллийг хараахан оруулаагүй байна.`;
    if (isPeriod)
      return `${nameGen} сарын тэмдгийн ${day} дэх өдөр. Өнөөдөр илүү амралт, дулаан халамж хэрэгтэй.`;
    if (daysLate > 0)
      return `${nameGen} сарын тэмдэг удахгүй ирэх магадлалтай. Өсвөр насанд хэдэн хоног хоцрох нь хэвийн.`;
    if (daysUntil <= 3)
      return `${nameGen} сарын тэмдэг ${daysUntil} хоногийн дараа ирэх магадлалтай. Бэлтгэл хангахад туслаарай.`;
    if (daysUntil <= 7)
      return `${nameGen} сарын тэмдэг 1 долоо хоногийн дотор ирэх магадлалтай. Хэрэгслээ шалгах сайхан үе.`;
    return `${daughterName} одоо «${phase.name}»-д байна. Онцгой бэлтгэл хэрэггүй — зүгээр л дэргэд нь байгаарай 🌸`;
  })();

  const value = {
    // тохиргоо, нэвтрэлт
    supabaseConfigured,
    session,
    authLoading,
    dataLoading,
    ready,
    loadError,
    reload: () => loadAll(),
    profile,
    signUp,
    signIn,
    signOut,
    updateName,
    updateEmail,
    birthDate,
    // гэр бүл
    view,
    family,
    familyCode: family?.code ?? "",
    guardianName,
    children: childProfiles,
    activeChild,
    activeChildId: activeChild?.id ?? activeChildId,
    setActiveChildId,
    linked,
    daughterName,
    nameGen,
    codeInput,
    setCodeInput,
    guardianCode: codeInput,
    setGuardianCode: setCodeInput,
    codeError,
    setCodeError,
    joining,
    unlinking,
    joinFamily,
    leaveFamily,
    isLinked: linked,
    linkStatus: linked ? "connected" : joining ? "connecting" : "unlinked",
    linkError: codeError,
    setLinkError: setCodeError,
    connectToGuardian: joinFamily,
    copied,
    copyCode,
    shareCode,
    needsCycleSetup,
    showOnboarding,
    // навигаци
    tab,
    setTab,
    learnTab,
    setLearnTab,
    // мөчлөг
    hasCycle,
    cycleLength,
    periodLength,
    lastPeriodStart,
    periodStarts,
    periodPrediction,
    savePeriodStartDates,
    day,
    daysLate,
    phaseKey,
    phase,
    isPeriod,
    daysUntil,
    saveCycle,
    startPeriod,
    markChildPeriod,
    noPeriodYet,
    markNoPeriodYet,
    // сэтгэл санаа
    mood,
    selectedMood,
    shareWithMom,
    setShareWithMom,
    refreshMoods: loadMoods,
    pickMood,
    clearMood,
    moodLoading,
    moodTimer,
    setMoodTimer,
    moodTimerRunning,
    setMoodTimerRunning,
    // AI
    insightTips,
    insightLoading,
    refreshInsight,
    currentNudge,
    nudgeLoading,
    nudgesDone,
    refreshNudge,
    markNudgeDone,
    careMessage,
    // хэрэгсэл
    supplies,
    lowSupplyCount,
    updateSupply,
    addSupply,
    removeSupply,
    restock,
    requestSupplies,
    // мэдэгдэл
    momInbox,
    teenInbox,
    momUnread,
    latestTeenMsg,
    markRead,
    sendToTeen,
    sendToMom,
    openBell,
    // SOS
    sosOpen,
    setSosOpen,
    sosSeconds,
    setSosSeconds,
    sosRunning,
    setSosRunning,
    breathIn,
    sosSent,
    sosStep,
    openSos,
    sosNotifyMom,
    // боловсрол
    kitChecked,
    saveKit,
    flippedMyths,
    toggleMyth,
    // UI
    toast,
    setToast,
    showSync,
    pulseSync,
  };

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
}

export function useFamily() {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error("useFamily() must be used inside <FamilyProvider>");
  return ctx;
}
