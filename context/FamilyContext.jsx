"use client";

/**
 * FamilyContext — апп-ын бүх өгөгдөл ба үйлдэл.
 *
 *  • Нэвтрэлт: Supabase Auth (имэйл + нууц үг)
 *  • Өгөгдөл:  Supabase (profiles, families, supplies, mood_logs, notifications, kit_checks)
 *  • Синк:     Supabase Realtime — ээж, охин хоёр өөр утаснаас шууд харна
 *  • AI:       /api/ai (сервер дээр) → алдаа гарвал lib/data.js-ийн бэлэн текст
 *
 * Дэлгэц бүр useFamily()-ээр хэрэгтэй зүйлээ авна.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_SUPPLIES, MOOD_OPTIONS, PHASES, SOS_STEPS, SOS_TOTAL } from "../lib/data";
import { genitive, getMomNudges, getPhaseKey } from "../lib/helpers";
import { cycleStatus, formatTime, toDateStr } from "../lib/dates";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { askAi } from "../lib/ai-client";

const FamilyContext = createContext(null);

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
  const [dataLoading, setDataLoading] = useState(false);
  const [ready, setReady] = useState(false); // эхний бүрэн ачаалалт дууссан эсэх
  const [loadError, setLoadError] = useState(null); // "no_profile" | "network"

  /* ================= Гэр бүлийн өгөгдөл ================= */
  const [supplyRows, setSupplyRows] = useState([]);
  const [localSupplies, setLocalSupplies] = useState(DEFAULT_SUPPLIES); // гэр бүлгүй үед
  const [notifications, setNotifications] = useState([]);
  const [moodRows, setMoodRows] = useState([]);
  const [kitRows, setKitRows] = useState([]);
  const [localKit, setLocalKit] = useState([]);

  /* ================= Дэлгэцийн төлөв ================= */
  const [tab, setTab] = useState("home");
  const [learnTab, setLearnTab] = useState("kit");
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [momReady, setMomReady] = useState(false);
  const [teenSkippedJoin, setTeenSkippedJoin] = useState(false);
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

  /* ================= Тооцоолсон утгууд ================= */
  const view = profile?.role ?? null; // "mother" | "daughter"
  const daughterProfile =
    view === "daughter" ? profile : (members.find((m) => m.role === "daughter" && m.id !== userId) ?? null);
  const linked = view === "daughter" ? Boolean(familyId) : Boolean(daughterProfile);
  const daughterName = daughterProfile?.display_name || (view === "mother" ? "Охин тань" : "");
  const nameGen = daughterProfile?.display_name ? genitive(daughterProfile.display_name) : "Охины тань";

  const cycleLength = daughterProfile?.cycle_length ?? 28;
  const periodLength = daughterProfile?.period_length ?? 5;
  const lastPeriodStart = daughterProfile?.last_period_start ?? null;
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
  const selectedMood = baseMood ? { ...baseMood, ...(moodCard?.id === mood ? moodCard : {}) } : null;
  const sharedMood = view === "mother" ? mood : linked && shareWithMom ? mood : null;

  const supplies = useMemo(() => {
    if (!familyId) return localSupplies;
    const out = {};
    for (const [k, base] of Object.entries(DEFAULT_SUPPLIES)) {
      const row = supplyRows.find((r) => r.kind === k);
      out[k] = { ...base, count: row?.count ?? 0, max: row?.max ?? base.max };
    }
    return out;
  }, [familyId, supplyRows, localSupplies]);
  const lowSupplyCount = Object.values(supplies).filter((s) => s.count / s.max <= 0.3).length;

  const inbox = notifications.map((n) => ({ ...n, time: formatTime(n.created_at) }));
  const momInbox = view === "mother" ? inbox : [];
  const teenInbox = view === "daughter" ? inbox : [];
  const momUnread = momInbox.filter((m) => !m.read).length;
  const latestTeenMsg = teenInbox.find((m) => !m.read);

  const kitChecked = familyId ? kitRows.map((r) => r.item_id) : localKit;

  const phaseTips = phase.tips;
  const insightTips = aiTips ?? [0, 1, 2].map((i) => phaseTips[i % phaseTips.length]);
  const fallbackNudges = getMomNudges(phaseKey, daysUntil, sharedMood);
  const currentNudge = aiNudge ?? fallbackNudges[nudgeIndex % fallbackNudges.length];
  const sosStep = Math.min(SOS_STEPS.length - 1, Math.floor((SOS_TOTAL - sosSeconds) / 60));

  // Аль дэлгэцийг харуулах вэ
  const needsJoin = view === "daughter" && !familyId && !teenSkippedJoin;
  const noPeriodYet = Boolean(daughterProfile?.no_period_yet) && !lastPeriodStart;
  const needsCycleSetup = view === "daughter" && !needsJoin && !lastPeriodStart && !profile?.no_period_yet;
  const showMomCode = view === "mother" && Boolean(familyId) && !linked && !momReady;
  const showOnboarding = !session || !profile || !ready || needsJoin || needsCycleSetup || showMomCode;

  /* ================= Нэвтрэлтийг сонсох ================= */
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  /* ================= Өгөгдөл татах ================= */
  const loadProfile = useCallback(async () => {
    if (!userId) return null;
    // Trigger профайлыг үүсгэхэд хэдэн мс шаардагдаж магадгүй тул хэд дахин оролдоно
    for (let i = 0; i < 5; i++) {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (data) {
        setProfile(data);
        return data;
      }
      // 2 удаа олдохгүй бол (schema-аас өмнө бүртгүүлсэн гэх мэт) өөрөө нөхөж үүсгэнэ
      if (i === 1) {
        const meta = session?.user?.user_metadata ?? {};
        await supabase.from("profiles").insert({
          id: userId,
          role: meta.role === "mother" ? "mother" : "daughter",
          display_name: meta.display_name ?? "",
        });
        continue;
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    return null;
  }, [userId, session?.user?.user_metadata]);

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
    const { data } = await supabase.from("mood_logs").select("*").gte("log_date", toDateStr()).limit(20);
    setMoodRows(data ?? []);
  }, []);

  const loadKit = useCallback(async (fid) => {
    const { data } = await supabase.from("kit_checks").select("item_id").eq("family_id", fid);
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
    // Ээж анх нэвтрэхэд гэр бүлийг автоматаар үүсгэнэ
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
      .on("postgres_changes", { event: "*", schema: "public", table: "mood_logs", filter }, () => {
        loadMoods();
        pulseSync();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "kit_checks" }, () => {
        loadKit(familyId);
        pulseSync();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles", filter }, () => {
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
    async (recipientRole, text, kind = "info") => {
      if (!familyId) return false;
      const { error } = await supabase
        .from("notifications")
        .insert({ family_id: familyId, sender_id: userId, recipient_role: recipientRole, kind, text });
      if (error) setToast("Илгээж чадсангүй. Интернэтээ шалгаарай.");
      return !error;
    },
    [familyId, userId],
  );
  const sendToMom = (text, kind) => notify("mother", text, kind);
  const sendToTeen = (text, kind = "care") => notify("daughter", text, kind);

  const markRead = async (id) => {
    setNotifications((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  // Ээж «Мэдэгдэл» табыг нээхэд уншсан гэж тэмдэглэнэ
  useEffect(() => {
    if (view !== "mother" || tab !== "messages" || momUnread === 0) return;
    const ids = notifications.filter((n) => !n.read).map((n) => n.id);
    setNotifications((p) => p.map((n) => ({ ...n, read: true })));
    supabase
      .from("notifications")
      .update({ read: true })
      .in("id", ids)
      .then(() => {});
  }, [view, tab, momUnread, notifications]);

  /* ================= Нэвтрэлтийн үйлдлүүд ================= */
  const signUp = async ({ role, name, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { role, display_name: name.trim() } },
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
    setMomReady(false);
    setTeenSkippedJoin(false);
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
    const text = `Bloomy-д нэгдээрэй 🌿 Апп-аа нээгээд энэ кодыг оруулаарай: ${family?.code}`;
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
    if (digits.length !== 6 || joining) return;
    setJoining(true);
    const { error } = await supabase.rpc("join_family", { p_code: `BLOOM-${digits}` });
    setJoining(false);
    if (error) {
      setCodeError(
        error.message?.includes("invalid_code")
          ? "Ийм код олдсонгүй. Ээжээсээ кодоо дахин шалгуулаарай."
          : "Холбогдож чадсангүй. Интернэтээ шалгаад дахин оролдоно уу.",
      );
      return;
    }
    setCodeError("");
    setCodeInput("");
    await loadAll();
    setToast("Ээжтэйгээ амжилттай холбогдлоо 💚");
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

  const startPeriod = async () => {
    const ok = await saveCycle({ lastPeriodStart: today, cycleLength, periodLength });
    if (!ok) return;
    if (linked) {
      await sendToMom(`${nameGen} сарын тэмдэг өнөөдөр ирлээ. Бага зэрэг илүү халамж хэрэгтэй 💚`, "period");
      setToast("Тэмдэглэлээ! Ээжид зөөлөн мэдэгдэл очлоо 🌿");
    } else setToast("Тэмдэглэлээ 🌿");
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
  const pickMood = async (id) => {
    if (mood === id) {
      setMoodRows((p) => p.filter((r) => !(r.user_id === userId && r.log_date === today)));
      setMoodTimerRunning(false);
      await supabase.from("mood_logs").delete().eq("user_id", userId).eq("log_date", today);
      return;
    }
    const row = { user_id: userId, family_id: familyId, log_date: today, mood: id };
    setMoodRows((p) => [...p.filter((r) => !(r.user_id === userId && r.log_date === today)), row]);
    setMoodLoading(true);
    setMoodTimer(120);
    setMoodTimerRunning(false);
    supabase
      .from("mood_logs")
      .upsert(row, { onConflict: "user_id,log_date" })
      .then(({ error }) => error && setToast("Хадгалж чадсангүй."));

    const ai = await askAi(session, { type: "mood", mood: id, phase: phaseKey, day: cycle?.day ?? null });
    if (ai?.title) setMoodCard({ id, ...ai });
    else setMoodCard(null);
    setMoodLoading(false);
  };

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

  useEffect(() => {
    if (view === "mother" && linked) fetchNudge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, linked, phaseKey, sharedMood]);

  const refreshNudge = () => !nudgeLoading && fetchNudge();

  const markNudgeDone = async () => {
    setNudgesDone((p) => [...p, currentNudge]);
    await sendToTeen("Ээж чамд зориулж жаахан халамж бэлдлээ 💚", "care");
    setToast("Сайхан байна! Охиндоо мэдэгдэл очлоо 🌿");
    setTimeout(fetchNudge, 500);
  };

  /* ================= Хэрэгсэл ================= */
  const updateSupply = async (key, delta) => {
    if (!familyId) {
      setLocalSupplies((p) => ({
        ...p,
        [key]: { ...p[key], count: Math.min(p[key].max, Math.max(0, p[key].count + delta)) },
      }));
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
  const toggleKit = async (id) => {
    if (!familyId) {
      setLocalKit((p) => (p.includes(id) ? p.filter((k) => k !== id) : [...p, id]));
      return;
    }
    if (kitChecked.includes(id)) {
      setKitRows((p) => p.filter((r) => r.item_id !== id));
      await supabase.from("kit_checks").delete().eq("family_id", familyId).eq("item_id", id);
    } else {
      setKitRows((p) => [...p, { item_id: id }]);
      await supabase.from("kit_checks").insert({ family_id: familyId, item_id: id });
    }
  };

  const toggleMyth = (id) =>
    setFlippedMyths((p) => (p.includes(id) ? p.filter((m) => m !== id) : [...p, id]));

  const openBell = () => setTab("messages");

  const updateName = async (name) => {
    const display_name = name.trim();
    if (!display_name) return;
    setProfile((p) => ({ ...p, display_name }));
    await supabase.from("profiles").update({ display_name }).eq("id", userId);
    setToast("Нэр хадгалагдлаа ✓");
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
    return `${daughterName} одоо «${phase.name}»-д байна. Онцгой бэлтгэл хэрэггүй — зүгээр л дэргэд нь байгаарай 🌿`;
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
    // гэр бүл
    view,
    family,
    familyCode: family?.code ?? "",
    linked,
    daughterName,
    nameGen,
    codeInput,
    setCodeInput,
    codeError,
    setCodeError,
    joining,
    joinFamily,
    copied,
    copyCode,
    shareCode,
    momReady,
    setMomReady,
    setTeenSkippedJoin,
    needsJoin,
    needsCycleSetup,
    showMomCode,
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
    day,
    daysLate,
    phaseKey,
    phase,
    isPeriod,
    daysUntil,
    saveCycle,
    startPeriod,
    noPeriodYet,
    markNoPeriodYet,
    // сэтгэл санаа
    mood,
    selectedMood,
    shareWithMom,
    setShareWithMom,
    pickMood,
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
    restock,
    requestSupplies,
    // мэдэгдэл
    momInbox,
    teenInbox,
    momUnread,
    latestTeenMsg,
    markRead,
    sendToTeen,
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
    toggleKit,
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