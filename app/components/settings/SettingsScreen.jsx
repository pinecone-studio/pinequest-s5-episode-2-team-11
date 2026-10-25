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
  AlertCircle,
  Loader2,
  Pencil,
} from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";
import PageHeader from "../ui/PageHeader";
import CycleSetup from "../onboarding/CycleSetup";
import CycleJournalCalendar from "../daughter/CycleJournalCalendar";

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
    codeInput,
    setCodeInput,
    codeError,
    setCodeError,
    joinFamily,
    joining,
    shareWithMom,
    setShareWithMom,
    hasCycle,
    cycleLength,
    periodLength,
    lastPeriodStart,
    updateName,
    signOut,
  } = useFamily();
  const [editingCycle, setEditingCycle] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(profile?.display_name ?? "");
  if (editingCycle) return <CycleSetup onDone={() => setEditingCycle(false)} />;

  const isMother = view === "mother";

  return (
    <div className="space-y-4">
      <PageHeader sub={isMother ? "Асран хамгаалагчийн бүртгэл" : "Миний бүртгэл"} title="Миний бүртгэл" />

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
              className="flex-1 min-w-0 rounded-2xl border-2 border-slate-100 bb-focus-border-F48FB1 outline-none px-4 py-2.5 font-bold text-slate-700"
              aria-label="Нэр"
              autoFocus
            />
            <button className="px-4 rounded-2xl bb-bg-E0679F text-white font-extrabold text-sm">
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
              {isMother ? "🤝" : "🌱"}
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
        {isMother ? (linked ? (
          <>
            <p className="text-sm font-bold bb-text-B83B7E">✓ {daughterName} холбогдсон</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="flex-1 rounded-2xl bb-bg-FFF7FB py-3 text-center text-lg font-black tracking-wider text-slate-600">
                {familyCode || "…"}
              </span>
              <button
                onClick={copyCode}
                className="w-12 h-12 rounded-2xl bb-bg-FDE7F1 bb-text-B83B7E flex items-center justify-center active:scale-90"
                aria-label="Кодыг хуулах"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
              <button
                onClick={shareCode}
                className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-100 bb-text-B83B7E flex items-center justify-center active:scale-90"
                aria-label="Кодыг хуваалцах"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-slate-500">
              Охиноосоо авсан урилгын кодыг оруулж холбоно уу.
            </p>
            <div className="mt-3 flex items-center rounded-2xl border-2 border-slate-100 bb-focus-within-border-F48FB1 bg-white overflow-hidden">
              <span className="pl-4 font-black bb-text-F48FB1">BLOOM-</span>
              <input
                id="family-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={codeInput}
                onChange={(event) => {
                  setCodeInput(event.target.value.replace(/\D/g, ""));
                  setCodeError("");
                }}
                onKeyDown={(event) => event.key === "Enter" && joinFamily()}
                className="flex-1 min-w-0 py-3 pr-4 pl-1 text-xl font-black tracking-widest text-slate-700 outline-none bg-transparent"
                placeholder="000000"
                aria-label="Охиныхоо урилгын код"
              />
            </div>
            {codeError && (
              <p className="mt-2 text-sm font-semibold bb-text-7C4DCC flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {codeError}
              </p>
            )}
            <button
              onClick={joinFamily}
              disabled={codeInput.length !== 6 || joining}
              className="mt-3 w-full bb-bg-E0679F bb-disabled-bg-F8D3E6 text-white font-extrabold rounded-2xl py-3 active:scale-95 transition flex items-center justify-center gap-2"
            >
              {joining && <Loader2 className="w-5 h-5 animate-spin" />}
              Охинтойгоо холбогдох
            </button>
          </>
        )) : linked ? (
          <>
            <p className="text-sm font-bold bb-text-B83B7E">✓ Асран хамгаалагчтайгаа холбогдсон</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="flex-1 rounded-2xl bb-bg-FFF7FB py-3 text-center text-lg font-black tracking-wider text-slate-600">
                {familyCode || "…"}
              </span>
              <button
                onClick={copyCode}
                className="w-12 h-12 rounded-2xl bb-bg-FDE7F1 bb-text-B83B7E flex items-center justify-center active:scale-90"
                aria-label="Кодыг хуулах"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
              <button
                onClick={shareCode}
                className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-100 bb-text-B83B7E flex items-center justify-center active:scale-90"
                aria-label="Кодыг хуваалцах"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-slate-500">Асран хамгаалагчдаа энэ кодыг оруулуулж холбогдоорой.</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="flex-1 rounded-2xl bb-bg-FFF7FB py-3 text-center text-lg font-black tracking-wider text-slate-600">
                {familyCode || "…"}
              </span>
              <button
                onClick={copyCode}
                className="w-12 h-12 rounded-2xl bb-bg-FDE7F1 bb-text-B83B7E flex items-center justify-center active:scale-90"
                aria-label="Кодыг хуулах"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
              <button
                onClick={shareCode}
                className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-100 bb-text-B83B7E flex items-center justify-center active:scale-90"
                aria-label="Кодыг хуваалцах"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </>
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
                  <div key={k} className="rounded-2xl bb-bg-FFF7FB py-3 px-1">
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
            <CycleJournalCalendar lastPeriodStart={lastPeriodStart} cycleLength={cycleLength} periodLength={periodLength} />
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
                  Сэтгэл санаагаа асран хамгаалагчтай хуваалцах
                </span>
                <span className="block text-xs font-semibold text-slate-500">
                  Унтраавал асран хамгаалагч тань таны сэтгэл санааг харахгүй.
                </span>
              </span>
              <span
                className={`w-12 h-7 rounded-full p-1 transition-colors shrink-0 ${shareWithMom ? "bb-bg-E0679F" : "bg-slate-200"}`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${shareWithMom ? "translate-x-5" : ""}`}
                />
              </span>
            </button>
          </Card>
        </>
      )}

      <div className="flex items-start gap-3 bb-bg-FDE7F1-70 rounded-2xl p-4">
        <ShieldCheck className="w-5 h-5 bb-text-B83B7E shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 font-semibold leading-relaxed">
          Таны мэдээлэл зөвхөн таны гэр бүлийн бүлэгт харагдана. Bloomy эмчийн зөвлөгөөг орлохгүй.
        </p>
      </div>

      <button
        onClick={signOut}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white border-2 border-slate-100 py-4 font-extrabold bb-text-7C4DCC active:scale-95 transition"
      >
        <LogOut className="w-4 h-4" /> Гарах
      </button>
    </div>
  );
}
