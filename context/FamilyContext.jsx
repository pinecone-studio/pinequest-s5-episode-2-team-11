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
import { periodsFromLogs, predictPeriodRange } from "../lib/cycle";
import { persistPeriodDays } from "../lib/period-edit";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { askAi } from "../lib/ai-client";
import { t } from "../lib/i18n";
import { useLang } from "./LanguageContext";
import { sendNotification } from "../lib/push-client";

const AVATAR_SETUP_KEY = "bloomy:avatar-setup";

const FamilyContext = createContext(null);
const LOCAL_KIT_KEY = "bloomy:kit-checks";
const LOCAL_CUSTOM_SUPPLIES_KEY = "bloomy:custom-supplies";
const LOCAL_PERIOD_STARTS_PREFIX = "bloom:period-starts:";
const DAILY_MOOD_EMOJI = { 1: "😣", 2: "😟", 3: "😐", 4: "🙂", 5: "😄" };
// Daughter → guardian message kinds → notification events (lib/notificationEvents.ts).
const DAUGHTER_KIND_EVENT = { supply: "supply_request", sos: "guardian_signal", period: "first_period", care: "mood_shared" };
const PROFILE_SAFE_COLUMNS = "id, role, display_name, family_id, cycle_length, period_length, last_period_start, share_mood, no_period_yet, birth_date, created_at";
const PROFILE_CORE_COLUMNS = "id, role, display_name, family_id";

const isProfileSchemaError = (error) =>
  ["42703", "42P01", "42501", "PGRST204", "PGRST205"].includes(error?.code);

const logSupabaseError = (label, error) => {
  console.warn(label, {
    code: error?.code ?? "unknown",
    message: error?.message ?? String(error),
    details: error?.details ?? "",
    hint: error?.hint ?? "",
  });
};

const AUTH_ERRORS = {
  get "Invalid login credentials"() { return t("Имэйл эсвэл нууц үг буруу байна.", "Wrong email or password."); },
  get "User already registered"() { return t("Энэ имэйлээр аль хэдийн бүртгүүлсэн байна. «Нэвтрэх» дээр дарна уу.", "This email is already registered. Tap \"Sign in\"."); },
  get "Email not confirmed"() { return t("Имэйлээ баталгаажуулна уу (inbox-оо шалгаарай).", "Please confirm your email (check your inbox)."); },
};
const authMessage = (e) =>
  AUTH_ERRORS[e?.message] ||
  (e?.message?.includes("Password should be") ? t("Нууц үг дор хаяж 6 тэмдэгттэй байх ёстой.", "Password must be at least 6 characters.") : null) ||
  t("Алдаа гарлаа. Интернэтээ шалгаад дахин оролдоно уу.", "Something went wrong. Check your internet and try again.");

export function FamilyProvider({ children }) {
  // Хэл солигдоход нэр, статус текст, хэрэгслийн нэр шинэчлэгдэнэ
  const { lang } = useLang();
  /* ================= Нэвтрэлт ба профайл ================= */
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(supabaseConfigured);
  const [profile, setProfile] = useState(null);
  const [guardianGender, setGuardianGender] = useState(null);
  const [family, setFamily] = useState(null); // { id, code }
  const [members, setMembers] = useState([]); // гэр бүлийн бүх профайл
  const [activeChildId, setActiveChildIdState] = useState(null);
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
  const [periodLogs, setPeriodLogs] = useState([]);
  // userId whose period_logs have been read from the DB; after that the DB,
  // not localStorage, is the source of truth for period dates.
  const periodLogsLoadedForRef = useRef(null);
  const [noteUnlockToken, setNoteUnlockToken] = useState("");
  const noteUnlockAtRef = useRef(0);

  const unlockPrivateNotes = useCallback((token) => {
    setNoteUnlockToken(token);
    noteUnlockAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") noteUnlockAtRef.current = Date.now();
      else if (noteUnlockAtRef.current && Date.now() - noteUnlockAtRef.current > 60_000) setNoteUnlockToken("");
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

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
  const [learnTab, setLearnTab] = useState("topics");
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
    if (userId && periodLogsLoadedForRef.current === userId) return;
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
  useEffect(() => {
    if (view !== "mother" || !userId) {
      setGuardianGender(null);
      return;
    }
    let cancelled = false;
    supabase.rpc("get_my_guardian_gender")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setToast(t("Хүйсийн мэдээлэл ачаалж чадсангүй. Дахин оролдоно уу.", "Couldn't load gender info. Please try again."));
          return;
        }
        setGuardianGender(data ?? "unspecified");
      })
      .catch(() => {
        if (!cancelled) setToast(t("Хүйсийн мэдээлэл ачаалж чадсангүй. Дахин оролдоно уу.", "Couldn't load gender info. Please try again."));
      });
    return () => { cancelled = true; };
  }, [userId, view]);

  const guardianProfile = members.find((member) => member.role === "mother") ?? null;
  const guardianName = guardianProfile?.display_name || null;
  const childProfiles = members.filter((member) => member.role === "daughter");
  useEffect(() => {
    if (view !== "mother") {
      setActiveChildIdState(null);
      return;
    }
    let savedId = null;
    if (familyId) {
      try {
        savedId = localStorage.getItem(`bloomy:selected-daughter:${familyId}`);
      } catch { /* localStorage боломжгүй */ }
    }
    setActiveChildIdState((current) =>
      childProfiles.some((child) => child.id === current)
        ? current
        : childProfiles.some((child) => child.id === savedId)
          ? savedId
          : (childProfiles[0]?.id ?? null),
    );
  }, [view, familyId, members]);
  const setActiveChildId = useCallback((id) => {
    setActiveChildIdState(id);
    if (familyId && id) {
      try {
        localStorage.setItem(`bloomy:selected-daughter:${familyId}`, id);
      } catch { /* localStorage боломжгүй */ }
    }
  }, [familyId]);
  const activeChild = childProfiles.find((child) => child.id === activeChildId) ?? (view === "mother" ? childProfiles[0] ?? null : null);
  const daughterProfile =
    view === "daughter" ? profile : activeChild;
  // Tsetse-ийн кодтой нийцүүлэх нэрс (нэг л хэрэгжүүлэлт: activeChild)
  const daughters = view === "mother" ? childProfiles : [];
  const selectDaughter = setActiveChildId;
  const linked =
    view === "daughter"
      ? members.some((member) => member.role === "mother" && member.id !== userId)
      : childProfiles.length > 0;
  const daughterName = daughterProfile?.display_name || (view === "mother" ? t("Охин тань", "Your daughter") : "");
  const nameGen = daughterProfile?.display_name ? genitive(daughterProfile.display_name) : t("Охины тань", "Your daughter's");
  // Англи өгүүлбэрт нэрийн илгэлийн оронд ашиглана («Сарааны» → «Saraa's»)
  const nameEn = daughterProfile?.display_name ? `${daughterProfile.display_name}'s` : "Your daughter's";

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
        out[row.kind] = { label: row.label || t("Өөр хэрэглэл", "Other supply"), emoji: row.emoji || "📦", count: row.count ?? 0, max: row.max ?? 10 };
      }
    }
    return out;
  }, [familyId, supplyRows, localSupplies, localCustomSupplies, lang]);
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
  const fallbackNudges = getMomNudges(phaseKey, daysUntil, sharedMood, daughterProfile?.display_name ?? "");
  const currentNudge = aiNudge ?? fallbackNudges[nudgeIndex % fallbackNudges.length];
  const sosStep = Math.min(SOS_STEPS.length - 1, Math.floor((SOS_TOTAL - sosSeconds) / 60));

  // Аль дэлгэцийг харуулах вэ
  const noPeriodYet = Boolean(daughterProfile?.no_period_yet) && !lastPeriodStart;
  // Confirmed periods with their logged lengths; the Today ring and the calendar
  // both predict from this list so they always agree.
  const cyclePeriods = useMemo(() => {
    const confirmed = view === "daughter" ? periodsFromLogs(periodLogs) : [];
    return confirmed.length ? confirmed : periodStarts;
  }, [view, periodLogs, periodStarts]);
  const periodPrediction = predictPeriodRange({
    periods: cyclePeriods,
    today,
    hasHadPeriod: Boolean(lastPeriodStart) && !noPeriodYet,
  });
  const needsCycleSetup = view === "daughter" && !lastPeriodStart && !profile?.no_period_yet;

  // Шинээр бүртгүүлсэн охин эхлээд өөрийн дүрийг бүтээнэ (энэ төхөөрөмж дээр тэмдэглэнэ)
  const [avatarSetupPending, setAvatarSetupPending] = useState(false);
  useEffect(() => {
    try {
      setAvatarSetupPending(window.localStorage.getItem(AVATAR_SETUP_KEY) === "1");
    } catch {}
  }, [session?.user?.id]);
  const finishAvatarSetup = () => {
    try {
      window.localStorage.removeItem(AVATAR_SETUP_KEY);
    } catch {}
    setAvatarSetupPending(false);
  };
  const needsAvatarSetup = view === "daughter" && avatarSetupPending;
  const showOnboarding = !session || !profile || !ready || needsAvatarSetup || needsCycleSetup;

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
      let { data, error } = await supabase.from("profiles").select(PROFILE_SAFE_COLUMNS).eq("id", userId).maybeSingle();
      if (error) {
        logSupabaseError("Bloom profile read error:", error);
        if (!["42703", "PGRST204"].includes(error.code)) {
          setLoadError(isProfileSchemaError(error) ? "schema" : "network");
          return null;
        }

        const coreResult = await supabase.from("profiles").select(PROFILE_CORE_COLUMNS).eq("id", userId).maybeSingle();
        data = coreResult.data;
        error = coreResult.error;
        if (error) {
          logSupabaseError("Bloom profile fallback read error:", error);
          setLoadError(isProfileSchemaError(error) ? "schema" : "network");
          return null;
        }
        data = {
          ...data,
          cycle_length: data?.cycle_length ?? 28,
          period_length: data?.period_length ?? 5,
          last_period_start: data?.last_period_start ?? null,
          share_mood: data?.share_mood ?? true,
          no_period_yet: data?.no_period_yet ?? false,
          birth_date: data?.birth_date ?? null,
          created_at: data?.created_at ?? null,
        };
      }
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
        const { error: insertError } = await supabase.from("profiles").insert({
          id: userId,
          role: meta.role === "mother" ? "mother" : "daughter",
          display_name: meta.display_name ?? "",
          birth_date: meta.birth_date || null,
        });
        if (insertError) {
          logSupabaseError("Bloom profile recovery error:", insertError);
          setLoadError(isProfileSchemaError(insertError) ? "schema" : "network");
          return null;
        }
        continue;
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    setLoadError("no_profile");
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
      supabase.from("profiles").select(PROFILE_SAFE_COLUMNS).eq("family_id", fid).order("created_at"),
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
    const decoded = (data ?? []).map((notification) => {
      const encodedTarget = notification.kind?.match(/^target:([^:]+):(.+)$/);
      return {
        ...notification,
        recipient_id: notification.recipient_id ?? encodedTarget?.[1] ?? null,
        kind: encodedTarget?.[2] ?? notification.kind,
      };
    });
    setNotifications(
      view === "daughter"
        ? decoded.filter((notification) => !notification.recipient_id || notification.recipient_id === userId)
        : decoded,
    );
  }, [view, userId]);

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

  // DB rows replace (never merge with) the local copy, so removed days stay removed.
  const applyPeriodLogRows = useCallback((rows) => {
    setPeriodLogs(rows);
    if (view !== "daughter") return;
    const confirmed = [...new Set(rows.filter((row) => row.status === "confirmed").map((row) => row.log_date))].sort();
    periodLogsLoadedForRef.current = userId;
    setPeriodStarts(confirmed);
    try { localStorage.setItem(`${LOCAL_PERIOD_STARTS_PREFIX}${userId}`, JSON.stringify(confirmed)); } catch { /* localStorage боломжгүй */ }
  }, [view, userId]);

  const loadPeriodLogs = useCallback(async () => {
    if (!supabase || !userId) {
      setPeriodLogs([]);
      return;
    }
    const from = `${new Date().getFullYear() - 20}-01-01`;
    const to = `${new Date().getFullYear() + 1}-12-31`;
    const request = view === "daughter"
      ? supabase.rpc("get_my_period_logs", { p_from: from, p_to: to })
      : view === "mother" && activeChildId
        ? supabase.rpc("get_guardian_period_logs", { p_child_id: activeChildId, p_from: from, p_to: to })
        : null;
    if (!request) {
      setPeriodLogs([]);
      return;
    }
    const { data, error } = await request;
    if (error) {
      console.error("[period_logs] load failed:", error);
      if (view !== "daughter") setPeriodLogs([]);
      return false;
    }
    // Read before applyPeriodLogRows overwrites the local copy.
    let localStarts = [];
    try { localStarts = JSON.parse(localStorage.getItem(`${LOCAL_PERIOD_STARTS_PREFIX}${userId}`) ?? "[]"); } catch { /* localStorage боломжгүй */ }
    applyPeriodLogRows(data ?? []);
    if (view === "daughter" && !(data ?? []).some((row) => row.status === "confirmed")) {
      // One-time upload of dates that only ever lived in this browser's localStorage.
      const legacy = (Array.isArray(localStarts) ? localStarts : []).filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= toDateStr());
      if (legacy.length) {
        const { error: syncError } = await supabase.rpc("sync_my_period_starts", { p_dates: legacy, p_period_length: periodLength });
        if (syncError) console.error("[period_logs] legacy local date upload failed:", syncError);
        else {
          const { data: synced } = await supabase.rpc("get_my_period_logs", { p_from: from, p_to: to });
          if (synced) applyPeriodLogRows(synced);
        }
      }
    }
    return true;
  }, [userId, view, activeChildId, periodLength, applyPeriodLogRows]);

  useEffect(() => {
    loadPeriodLogs();
  }, [loadPeriodLogs]);

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
    if (!p) return;
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
  // All family messages go through /api/notify → lib/notify.ts (inbox row + push by the timing rules).
  // `text` is the in-app detail; the lock screen only shows the event's neutral line.
  const notify = useCallback(
    async (recipientRole, text, kind = "info", recipientId = null) => {
      if (!familyId || !recipientId) return false;
      const event = recipientRole === "daughter"
        ? "guardian_message"
        : view === "mother"
          ? "sent_copy"
          : DAUGHTER_KIND_EVENT[kind] ?? "guardian_signal";
      const { ok, limited } = await sendNotification(session, event, [recipientId], text);
            if (limited) setToast(t("Хүсэлт аль хэдийн илгээгдсэн байна 💌", "Already sent 💌"));
      else if (!ok) setToast(t("Илгээж чадсангүй. Интернэтээ шалгаарай.", "Couldn't send. Check your internet."));
      if (ok) loadNotifications();
      return ok;
    },
    [familyId, view, session, loadNotifications],
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
  const signUp = async ({ role, guardianGender: selectedGuardianGender, name, birthDate, email, password }) => {
    // Сесс үүсэхээс өмнө тэмдэглэнэ — тэгэхгүй бол дүр бүтээх алхам алгасагдана
    try {
      if (role === "daughter") window.localStorage.setItem(AVATAR_SETUP_KEY, "1");
    } catch {}
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          role,
          guardian_gender: role === "mother" ? selectedGuardianGender ?? "unspecified" : "unspecified",
          display_name: name.trim(),
          birth_date: birthDate || null,
        },
      },
    });
    if (error) {
      try {
        window.localStorage.removeItem(AVATAR_SETUP_KEY);
      } catch {}
      if (error.message === "User already registered") return "existing_user";
      return authMessage(error);
    }
    if (!data.session) return t("Бүртгэл үүслээ! Имэйлээ шалгаж баталгаажуулаад нэвтэрнэ үү.", "Account created! Check your email to confirm, then sign in.");
    return null;
  };

  const signIn = async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return authMessage(error);
    setTab("home");
    return null;
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
      setToast(t("Гэр бүлийн код хуулагдлаа 📋", "Family code copied 📋"));
    } catch {
      setToast(t(`Код: ${family?.code}`, `Code: ${family?.code}`));
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const shareCode = async () => {
    const text = t(`Bloomy 🌸 Гэр бүлийн урилгын кодоор холбогдоорой: ${family?.code}`, `Bloomy 🌸 Connect with our family invite code: ${family?.code}`);
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
          ? t("Ийм код олдсонгүй. Кодоо дахин шалгаарай.", "Code not found. Please check it again.")
          : t("Холбогдож чадсангүй. Интернэтээ шалгаад дахин оролдоно уу.", "Couldn't connect. Check your internet and try again."),
      );
      return;
    }
    setCodeError("");
    setCodeInput("");
    await loadAll();
    setToast(t("Асран хамгаалагчтайгаа амжилттай холбогдлоо 💗", "Connected with your guardian 💗"));
  };

  const leaveFamily = async () => {
    if (view !== "daughter" || !linked || unlinking) return false;
    setUnlinking(true);
    const { error } = await supabase.rpc("leave_family");
    if (error) {
      setUnlinking(false);
      setCodeError(t("Холболтыг салгаж чадсангүй. Дахин оролдоно уу.", "Couldn't disconnect. Please try again."));
      return false;
    }
    setCodeError("");
    setCodeInput("");
    await loadAll();
    setUnlinking(false);
    setToast(t("Асран хамгаалагчтай холболтыг салгалаа.", "Disconnected from your guardian."));
    return true;
  };

  /* ================= Мөчлөг ================= */
  const saveCycle = async ({ lastPeriodStart: start, cycleLength: cl, periodLength: pl }) => {
    const patch = { last_period_start: start, cycle_length: cl, period_length: pl, no_period_yet: false };
    setProfile((p) => ({ ...p, ...patch }));
    const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
    if (error) setToast(t("Хадгалж чадсангүй. Дахин оролдоно уу.", "Couldn't save. Please try again."));
    else pulseSync();
    return !error;
  };

  const savePeriodStartDates = async (dates, nextPeriodLength = periodLength) => {
    const starts = [...new Set(dates.filter((date) => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= today))].sort();
    if (!starts.length) {
      setToast(t("Ядаж нэг сарын тэмдэг эхэлсэн өдрийг үлдээнэ үү.", "Keep at least one period start date."));
      return false;
    }
    const lengths = starts.slice(1).map((date, index) => Math.round((new Date(`${date}T00:00:00`) - new Date(`${starts[index]}T00:00:00`)) / 86400000)).filter((days) => days >= 15 && days <= 60).slice(-6).map((days) => Math.min(45, Math.max(21, days)));
    const nextCycleLength = lengths.length ? Math.round(lengths.reduce((sum, length) => sum + length, 0) / lengths.length) : 28;
    const { error: syncError } = await supabase.rpc("sync_my_period_starts", { p_dates: starts, p_period_length: nextPeriodLength });
    if (syncError) {
      setToast(t("Сарын тэмдгийн бүртгэл хадгалж чадсангүй. Supabase-ийн calendar migration-ийг шалгана уу.", "Couldn't save the period log. Check the Supabase calendar migration."));
      return false;
    }
    const ok = await saveCycle({ lastPeriodStart: starts.at(-1), cycleLength: nextCycleLength, periodLength: nextPeriodLength });
    if (!ok) return false;
    const key = `${LOCAL_PERIOD_STARTS_PREFIX}${userId ?? "local"}`;
    try { localStorage.setItem(key, JSON.stringify(starts)); } catch { /* localStorage боломжгүй */ }
    setPeriodStarts(starts);
    await loadPeriodLogs();
    return true;
  };

  // Saves the calendar's selected days (consecutive days = one period), then
  // reloads profile + period_logs from the DB so every screen shows saved data.
  const savePeriodDays = async (dates) => {
    if (!supabase || view !== "daughter") return false;
    const result = await persistPeriodDays(supabase, dates, {
      today: toDateStr(),
      periodLength: Math.min(7, Math.max(2, Number(periodLength) || 5)),
    });
    if (!result.ok) {
      // Supabase/PostgREST errors often have non-enumerable fields, so logging
      // the object directly produces `{}` in the Next.js overlay.
      console.error("[period_logs] sync_my_period_days failed:", {
        code: result.error?.code,
        message: result.error?.message,
        details: result.error?.details,
        hint: result.error?.hint,
      });
      setToast(result.error?.code === "PGRST202"
        ? t("Календарийн SQL шинэчлэл хийгдээгүй байна. Supabase дээр manual-period-date-edit-migration.sql-ийг ажиллуулаад дахин оролдоно уу.", "The calendar SQL update hasn't been applied. Run manual-period-date-edit-migration.sql on Supabase and try again.")
        : t("Хадгалж чадсангүй. Алдааны дэлгэрэнгүйг шалгаад дахин оролдоно уу.", "Couldn't save. Check the error details and try again."));
      return false;
    }
    if (result.rows) applyPeriodLogRows(result.rows);
    else console.error("[period_logs] reload after save failed:", result.reloadError);
    await loadProfile();
    pulseSync();
    return true;
  };

  const startPeriod = async () => {
    const starts = [...new Set([...periodStarts, today])].sort();
    const ok = await savePeriodStartDates(starts, periodLength);
    if (!ok) return;
    if (linked) {
      await sendToMom(t(`${nameGen} сарын тэмдэг өнөөдөр ирлээ. Бага зэрэг илүү халамж хэрэгтэй 💗`, `${nameEn} period started today. A little extra care would help 💗`), "period");
      setToast(t("Тэмдэглэлээ! Ээжид зөөлөн мэдэгдэл очлоо 🌸", "Logged! A gentle notice went to your guardian 🌸"));
    } else setToast(t("Тэмдэглэлээ 🌸", "Logged 🌸"));
  };

  const proposePeriodStart = async (childId, date) => {
    const { error } = await supabase.rpc("propose_period_start", { p_child_id: childId, p_log_date: date });
    if (error) {
      setToast(error.message?.includes("not_linked") ? t("Охины бүртгэлийг олсонгүй.", "Daughter's account not found.") : t("Санал илгээж чадсангүй. Supabase-ийн calendar migration-ийг шалгана уу.", "Couldn't send the suggestion. Check the Supabase calendar migration."));
      return false;
    }
    await loadPeriodLogs();
    setToast(t("Охинд баталгаажуулах хүсэлт илгээлээ.", "Sent a confirmation request to your daughter."));
    return true;
  };

  const respondPeriodEntry = async (periodLogId, approve) => {
    const { data, error } = await supabase.rpc("respond_period_entry", { p_period_log_id: periodLogId, p_approve: approve });
    if (error) {
      setToast(t("Хүсэлтийг шинэчилж чадсангүй. Дахин оролдоно уу.", "Couldn't update the request. Please try again."));
      return false;
    }
    const changed = periodLogs.find((row) => row.id === periodLogId);
    if (approve && changed?.log_date) {
      const starts = [...new Set([...periodStarts, changed.log_date])].sort();
      setPeriodStarts(starts);
      try { localStorage.setItem(`${LOCAL_PERIOD_STARTS_PREFIX}${userId}`, JSON.stringify(starts)); } catch { /* localStorage боломжгүй */ }
      const { data: latestProfile } = await supabase.from("profiles").select("last_period_start").eq("id", userId).maybeSingle();
      if (latestProfile?.last_period_start) setProfile((current) => ({ ...current, ...latestProfile }));
    }
    await loadPeriodLogs();
    setToast(data === "confirmed" ? t("Өдрийг баталгаажууллаа 🌸", "Day confirmed 🌸") : t("Санал хасагдлаа.", "Suggestion removed."));
    return true;
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
    if (error) setToast(t("Хадгалж чадсангүй.", "Couldn't save."));
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
    await sendToTeen(t("Ээж чамд зориулж жаахан халамж бэлдлээ 💗", "Your guardian prepared a little care for you 💗"), "care");
    setToast(t(`${daughterName}-д мэдэгдэл очлоо 🌸`, `Notice sent to ${daughterName} 🌸`));
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
      setToast(t("Ийм нэртэй хэрэглэл аль хэдийн байна.", "A supply with this name already exists."));
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
      setToast(t("Хэрэглэл нэмэхэд алдаа гарлаа. Supabase-ийн custom-supplies тохиргоог ажиллуулна уу.", "Couldn't add the supply. Run the Supabase custom-supplies setup."));
      return false;
    }
    setToast(t(`${cleanLabel} нэмэгдлээ ✓`, `${cleanLabel} added ✓`));
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
      setToast(t("Хэрэглэл устгахад алдаа гарлаа.", "Couldn't delete the supply."));
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
    await sendToTeen(t(`Ээж чиний ${s.label.toLowerCase()}-ийг нөхөн дүүргэлээ ${s.emoji}`, `Your guardian restocked your ${s.label.toLowerCase()} ${s.emoji}`), "supply");
    setToast(t(`${s.label} нөхөн дүүргэгдлээ ✓`, `${s.label} restocked ✓`));
  };

  const requestSupplies = async () => {
    const low = Object.values(supplies)
      .filter((s) => s.count / s.max <= 0.3)
      .map((s) => s.label.toLowerCase());
    const ok = await sendToMom(
      t(`${profile?.display_name || "Охин тань"}: ${low.length ? low.join(", ") : "ариун цэврийн хэрэгсэл"} дуусах дөхөж байна. Авч өгөх үү? 🛍️`, `${profile?.display_name || "Охин тань"}: running low on ${low.length ? low.join(", ") : "ариун цэврийн хэрэгсэл"}. Could you get more? 🛍️`),
      "supply",
    );
    if (ok) setToast(t("Ээжид хүсэлт илгээлээ 💌", "Request sent to your guardian 💌"));
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
      t(`${profile?.display_name || "Охин тань"} яг одоо хэвлийгээр хүчтэй өвдөж байна. Халуун жин, дулаан тэврэлт тусална 🤍`, `${profile?.display_name || "Охин тань"} has strong cramps right now. A warm compress and a warm hug will help 🤍`),
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
        setToast(t("Цүнхний жагсаалтыг хадгалж чадсангүй. Дахин оролдоно уу.", "Couldn't save the bag list. Try again."));
        return false;
      }
    }

    if (addIds.length) {
      const { error } = await supabase
        .from("kit_checks")
        .insert(addIds.map((item_id) => ({ family_id: familyId, child_id: kitOwnerId, item_id })));
      if (error) {
        await loadKit(familyId);
        setToast(t("Цүнхний жагсаалтыг хадгалж чадсангүй. Дахин оролдоно уу.", "Couldn't save the bag list. Try again."));
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
      setToast(t("Нэр хадгалж чадсангүй. Дахин оролдоно уу.", "Couldn't save the name. Please try again."));
      return false;
    }
    setProfile((p) => ({ ...p, display_name }));
    setToast(t("Нэр хадгалагдлаа ✓", "Name saved ✓"));
    return true;
  };

  const updateGuardianGender = async (gender) => {
    if (view !== "mother" || !["female", "male", "unspecified"].includes(gender)) return false;
    try {
      const { data, error } = await supabase.rpc("set_my_guardian_gender", { p_gender: gender });
      if (error) {
        setToast(t("Хүйсийн мэдээлэл хадгалж чадсангүй. Дахин оролдоно уу.", "Couldn't save gender info. Please try again."));
        return false;
      }
      setGuardianGender(data);
      setToast(t("Хүйсийн мэдээлэл шинэчлэгдлээ.", "Gender info updated."));
      return true;
    } catch {
      setToast(t("Хүйсийн мэдээлэл хадгалж чадсангүй. Дахин оролдоно уу.", "Couldn't save gender info. Please try again."));
      return false;
    }
  };

  const updateEmail = async (email) => {
    const nextEmail = email.trim();
    if (!nextEmail || nextEmail === session?.user?.email) return true;
    const { error } = await supabase.auth.updateUser({ email: nextEmail });
    if (error) {
      setToast(t("Имэйл солиж чадсангүй. Хаягаа шалгаад дахин оролдоно уу.", "Couldn't change the email. Check the address and try again."));
      return false;
    }
    setToast(t("Шинэ имэйл хаяг руу баталгаажуулах холбоос илгээлээ.", "We sent a confirmation link to the new email."));
    return true;
  };

  /* ================= Ээжийн статус текст ================= */
  const careMessage = (() => {
    if (!linked) return t("Охин тань таны кодоор холбогдсоны дараа халамжийн статус энд харагдана.", "The care status shows here once your daughter connects with your code.");
    if (noPeriodYet)
      return t(`${nameGen} анхны сарын тэмдэг хараахан ирээгүй. «Сурах» хэсгийг хамтдаа үзэж, цүнхэнд нь бэлтгэл хийгээрэй 🌱`, `${nameEn} first period hasn't come yet. Look through the Learn section together and pack her bag ahead of time 🌱`);
    if (!hasCycle) return t(`${daughterName} мөчлөгийнхөө мэдээллийг хараахан оруулаагүй байна.`, `${daughterName} hasn't entered her cycle info yet.`);
    if (isPeriod)
      return t(`${nameGen} сарын тэмдгийн ${day} дэх өдөр. Өнөөдөр илүү амралт, дулаан халамж хэрэгтэй.`, `Day ${day} of ${nameEn} period. Extra rest and warm care help today.`);
    if (daysLate > 0)
      return t(`${nameGen} сарын тэмдэг удахгүй ирэх магадлалтай. Өсвөр насанд хэдэн хоног хоцрох нь хэвийн.`, `${nameEn} period will probably come soon. Being a few days late is normal for teens.`);
    if (daysUntil <= 3)
      return t(`${nameGen} сарын тэмдэг ${daysUntil} хоногийн дараа ирэх магадлалтай. Бэлтгэл хангахад туслаарай.`, `${nameEn} period may come in ${daysUntil} days. Help her get ready.`);
    if (daysUntil <= 7)
      return t(`${nameGen} сарын тэмдэг 1 долоо хоногийн дотор ирэх магадлалтай. Хэрэгслээ шалгах сайхан үе.`, `${nameEn} period may come within a week. A good time to check supplies.`);
    return t(`${daughterName} одоо «${phase.name}»-д байна. Онцгой бэлтгэл хэрэггүй — зүгээр л дэргэд нь байгаарай 🌸`, `${daughterName} is now in "${phase.name}". No special prep needed — just be there for her 🌸`);
  })();

  const value = {
    // тохиргоо, нэвтрэлт
    supabaseConfigured,
    session,
    noteUnlockToken,
    unlockPrivateNotes,
    authLoading,
    dataLoading,
    ready,
    loadError,
    reload: () => loadAll(),
    profile,
    guardianGender: view === "mother" ? guardianGender : null,
    signUp,
    signIn,
    signOut,
    updateName,
    updateGuardianGender,
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
    daughters,
    selectedDaughterId: daughterProfile?.id ?? "",
    selectDaughter,
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
    needsAvatarSetup,
    finishAvatarSetup,
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
    periodLogs,
    cyclePeriods,
    periodPrediction,
    savePeriodStartDates,
    savePeriodDays,
    day,
    daysLate,
    phaseKey,
    phase,
    isPeriod,
    daysUntil,
    saveCycle,
    startPeriod,
    proposePeriodStart,
    respondPeriodEntry,
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
