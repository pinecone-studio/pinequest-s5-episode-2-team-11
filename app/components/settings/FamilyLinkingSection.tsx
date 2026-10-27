"use client";

import { AlertCircle, Check, Copy, Link2Off, LoaderCircle, Share2, Users } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import type { FamilyLinkingContext } from "../../../types/family-linking";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";

export default function FamilyLinkingSection() {
  const {
    view,
    children,
    familyCode,
    guardianName,
    isLinked,
    copied,
    copyCode,
    shareCode,
    guardianCode,
    setGuardianCode,
    linkStatus,
    linkError,
    setLinkError,
    joining,
    connectToGuardian,
    unlinking,
    leaveFamily,
  } = useFamily() as FamilyLinkingContext;

  const isGuardian = view === "mother";

  const disconnect = async () => {
    if (window.confirm("Асран хамгаалагчтай холболтоо салгах уу?")) {
      await leaveFamily();
    }
  };

  return (
    <Card>
      <SectionTitle icon={Users} title={isGuardian ? "Гэр бүлийн холбоос" : "Гэр бүл"} right={null} titleStyle={{}} />

      {isGuardian ? (
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {children.length
              ? `${children.length} хүүхэд Guardian Access Code-оор холбогдсон.`
              : "Guardian Access Code-оо охинтойгоо хуваалцаарай."}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="flex-1 rounded-2xl bb-bg-FFF7FB py-3 text-center text-lg font-black tracking-wider text-slate-700">
              {familyCode || "Код үүсгэж байна…"}
            </span>
            <button
              type="button"
              onClick={copyCode}
              disabled={!familyCode}
              aria-label="Guardian код хуулах"
              className="flex h-12 w-12 items-center justify-center rounded-2xl bb-bg-FDE7F1 bb-text-B83B7E disabled:opacity-50"
            >
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={shareCode}
              disabled={!familyCode}
              aria-label="Guardian код хуваалцах"
              className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-slate-100 bg-white bb-text-B83B7E disabled:opacity-50"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
          {children.length > 0 && (
            <ul className="mt-3 space-y-2" aria-label="Холбогдсон хүүхдүүд">
              {children.map((child) => (
                <li key={child.id} className="rounded-xl bb-bg-FFF7FB px-3 py-2 text-sm font-bold text-slate-600">
                  {child.display_name || "Охин"}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : isLinked ? (
        <div className="rounded-2xl bb-bg-FFF7FB p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bb-bg-FDE7F1 bb-text-B83B7E">
              <Check className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-slate-700">Асран хамгаалагчтай холбогдсон</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-500">
                {guardianName ? `Guardian: ${guardianName}` : "Холболт идэвхтэй байна."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={disconnect}
            disabled={unlinking}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-pink-100 bg-white py-2.5 text-sm font-extrabold bb-text-B83B7E disabled:opacity-60"
          >
            {unlinking ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Link2Off className="h-4 w-4" />}
            {unlinking ? "Салгаж байна…" : "Холболтыг салгах"}
          </button>
          {linkError && <p className="mt-2 text-sm font-semibold text-rose-600">{linkError}</p>}
        </div>
      ) : (
        <div>
          <p className="text-sm font-semibold leading-relaxed text-slate-500">
            Guardian-тайгаа холбогдох нь сонголттой. Кодоо хүссэн үедээ оруулж болно.
          </p>
          <label htmlFor="guardian-access-code" className="mt-4 block text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Guardian Access Code
          </label>
          <div className="mt-2 flex items-center overflow-hidden rounded-2xl border-2 border-slate-100 bg-white bb-focus-within-border-F48FB1">
            <span className="pl-4 font-black bb-text-F48FB1">BLOOM-</span>
            <input
              id="guardian-access-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={guardianCode}
              onChange={(event) => {
                setGuardianCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                setLinkError("");
              }}
              onKeyDown={(event) => event.key === "Enter" && connectToGuardian()}
              placeholder="000000"
              aria-describedby={linkError ? "guardian-link-error" : undefined}
              className="min-w-0 flex-1 bg-transparent py-3 pl-1 pr-4 text-xl font-black tracking-widest text-slate-700 outline-none"
            />
          </div>
          {linkError && (
            <p id="guardian-link-error" role="alert" className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-rose-600">
              <AlertCircle className="h-4 w-4 shrink-0" /> {linkError}
            </p>
          )}
          <button
            type="button"
            onClick={connectToGuardian}
            disabled={guardianCode.length !== 6 || joining}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bb-bg-E0679F py-3 font-extrabold text-white transition active:scale-95 disabled:opacity-50"
          >
            {joining && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {joining ? "Холбож байна…" : "Холбогдох"}
          </button>
          <span className="sr-only" aria-live="polite">{linkStatus === "connecting" ? "Холболт үүсгэж байна" : "Холбогдоогүй"}</span>
        </div>
      )}
    </Card>
  );
}
