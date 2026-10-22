"use client";

import { useState } from "react";
import {
  LogOut,
  User,
  Users,
  Lock,
  Unlock,
  CalendarHeart,
  ShieldCheck,
  Copy,
  Check,
  Share2,
  Pencil,
  ChevronRight,
} from "lucide-react";
import { useFamily } from "../../context/FamilyContext";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";
import PageHeader from "../ui/PageHeader";
import CycleSetup from "../onboarding/CycleSetup";
import DaughterOnboarding from "../onboarding/DaughterOnboarding";

export default function SettingsScreen() {
  const {
    profile,
    session,
    view,
    familyCode,
    linked,
    daughterName,
    copied,
    copyCode,
    shareCode,
    shareWithMom,
    setShareWithMom,
    hasCycle,
    cycleLength,
    periodLength,
    lastPeriodStart,
    updateName,
    signOut,
    setTeenSkippedJoin,
  } = useFamily();
  const [editingCycle, setEditingCycle] = useState(false);
  const [joiningFamily, setJoiningFamily] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(profile?.display_name ?? "");

  if (editingCycle) return <CycleSetup onDone={() => setEditingCycle(false)} />;
  if (joiningFamily && !linked) {
    return (
      <div>
        <button onClick={() => setJoiningFamily(false)} className="text-sm font-bold text-slate-400 px-2">
          ← Буцах
        </button>
        <DaughterOnboarding />
      </div>
    );
  }

  const isMother = view === "mother";

  return (
    <div className="space-y-4">
      <PageHeader sub={isMother ? "Ээжийн бүртгэл" : "Миний бүртгэл"} title="Би 🌿" />

      <Card>
        <SectionTitle icon={User} title="Профайл" />
        {editingName ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateName(name);
              setEditingName(false);
            }}
            className="flex gap-2"
          >
            <input
              id="display-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              className="flex-1 min-w-0 rounded-2xl border-2 border-slate-100 bb-focus-border-81C784 outline-none px-4 py-2.5 font-bold text-slate-700"
              aria-label="Нэр"
              autoFocus
            />
            <button className="px-4 rounded-2xl bb-bg-5E9E64 text-white font-extrabold text-sm">
              Хадгалах
            </button>
          </form>
        ) : (
          <button
            onClick={() => {
              setName(profile?.display_name ?? "");
              setEditingName(true);
            }}
            className="w-full flex items-center gap-3 text-left"
          >
            <span className="w-12 h-12 rounded-2xl bb-bg-E8F5E9 flex items-center justify-center text-2xl">
              {isMother ? "👩" : "👧"}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-extrabold text-slate-700 truncate">
                {profile?.display_name || "—"}
              </span>
              <span className="block text-xs font-semibold text-slate-400 truncate">
                {session?.user?.email}
              </span>
            </span>
            <Pencil className="w-4 h-4 text-slate-400" />
          </button>
        )}
      </Card>

      <Card>
        <SectionTitle icon={Users} title="Гэр бүл" />
        {isMother ? (
          <>
            <div className="flex items-center gap-2">
              <span className="flex-1 rounded-2xl bb-bg-FAF8F5 py-3 text-center text-lg font-black tracking-wider text-slate-600">
                {familyCode || "…"}
              </span>
              <button
                onClick={copyCode}
                className="w-12 h-12 rounded-2xl bb-bg-E8F5E9 bb-text-4F8A55 flex items-center justify-center active:scale-90"
                aria-label="Кодыг хуулах"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
              <button
                onClick={shareCode}
                className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-100 bb-text-4F8A55 flex items-center justify-center active:scale-90"
                aria-label="Кодыг хуваалцах"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-500">
              {linked ? `${daughterName} холбогдсон ✓` : "Охин тань холбогдоогүй байна"}
            </p>
          </>
        ) : linked ? (
          <p className="text-sm font-bold bb-text-4F8A55">✓ Ээжтэйгээ холбогдсон</p>
        ) : (
          <button
            onClick={() => {
              setTeenSkippedJoin(true);
              setJoiningFamily(true);
            }}
            className="w-full flex items-center justify-between rounded-2xl bb-bg-E8F5E9 px-4 py-3 font-extrabold bb-text-4F8A55"
          >
            Ээжийн кодоор холбогдох <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </Card>

      {!isMother && (
        <>
          <Card>
            <SectionTitle icon={CalendarHeart} title="Миний мөчлөг" tone="peach" />
            {hasCycle ? (
              <dl className="grid grid-cols-3 gap-2 text-center">
                {[
                  ["Сүүлд эхэлсэн", lastPeriodStart?.slice(5).replace("-", "/")],
                  ["Мөчлөг", `${cycleLength} хоног`],
                  ["Үргэлжлэх", `${periodLength} хоног`],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-2xl bb-bg-FAF8F5 py-3 px-1">
                    <dt className="text-xs font-bold text-slate-400">{k}</dt>
                    <dd className="mt-1 font-black text-slate-700">{v}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm font-semibold text-slate-500">Мөчлөгийн мэдээлэл оруулаагүй байна.</p>
            )}
            <button
              onClick={() => setEditingCycle(true)}
              className="mt-3 w-full rounded-2xl bg-white border-2 border-slate-100 py-3 text-sm font-extrabold text-slate-700 active:scale-95 transition"
            >
              {hasCycle ? "Засах" : "Тохируулах"}
            </button>
          </Card>

          <Card>
            <SectionTitle icon={shareWithMom ? Unlock : Lock} title="Нууцлал" />
            <button
              onClick={() => setShareWithMom((s) => !s)}
              className="w-full flex items-center justify-between gap-3 text-left"
              role="switch"
              aria-checked={shareWithMom}
            >
              <span>
                <span className="block font-extrabold text-slate-700 text-sm">
                  Сэтгэл санаагаа ээжтэй хуваалцах
                </span>
                <span className="block text-xs font-semibold text-slate-500">
                  Унтраавал ээж чинь таны сэтгэл санааг харахгүй.
                </span>
              </span>
              <span
                className={`w-12 h-7 rounded-full p-1 transition-colors shrink-0 ${shareWithMom ? "bb-bg-5E9E64" : "bg-slate-200"}`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${shareWithMom ? "translate-x-5" : ""}`}
                />
              </span>
            </button>
          </Card>
        </>
      )}

      <div className="flex items-start gap-3 bb-bg-E8F5E9-70 rounded-2xl p-4">
        <ShieldCheck className="w-5 h-5 bb-text-4F8A55 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 font-semibold leading-relaxed">
          Таны мэдээлэл зөвхөн таны гэр бүлийн бүлэгт харагдана. Bloom Family эмчийн зөвлөгөөг орлохгүй.
        </p>
      </div>

      <button
        onClick={signOut}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white border-2 border-slate-100 py-4 font-extrabold bb-text-C2674F active:scale-95 transition"
      >
        <LogOut className="w-4 h-4" /> Гарах
      </button>
    </div>
  );
}
