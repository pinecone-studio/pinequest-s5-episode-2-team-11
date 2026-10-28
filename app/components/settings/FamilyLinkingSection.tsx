"use client";

import { AlertCircle, Check, Copy, Link2Off, LoaderCircle, Share2, Users } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import type { FamilyLinkingContext } from "../../../types/family-linking";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";
import { t } from "../../../lib/i18n";

export default function FamilyLinkingSection() {
  const {
    view,
    children,
    activeChildId,
    setActiveChildId,
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
    if (window.confirm(t("Асран хамгаалагчтай холболтоо салгах уу?", "Disconnect from your guardian?"))) {
      await leaveFamily();
    }
  };

  return (
    <Card>
      <SectionTitle icon={Users} title={isGuardian ? t("Гэр бүлийн холбоос", "Family link") : t("Гэр бүл", "Family")} right={null} titleStyle={{}} />

      {isGuardian ? (
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {children.length
              ? t(`${children.length} хүүхэд гэр бүлийн урилгын кодоор холбогдсон.`, `${children.length} child(ren) connected with the family invite code.`)
              : t("Гэр бүлийн урилгын кодоо охинтойгоо хуваалцаарай.", "Share your family invite code with your daughter.")}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="flex-1 rounded-2xl bb-bg-FFF7FB py-3 text-center text-lg font-black tracking-wider text-slate-700">
              {familyCode || t("Код үүсгэж байна…", "Creating code…")}
            </span>
            <button
              type="button"
              onClick={copyCode}
              disabled={!familyCode}
              aria-label={t("Гэр бүлийн урилгын код хуулах", "Copy family invite code")}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bb-bg-FDE7F1 bb-text-B83B7E disabled:opacity-50"
            >
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={shareCode}
              disabled={!familyCode}
              aria-label={t("Гэр бүлийн урилгын код хуваалцах", "Share family invite code")}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-slate-100 bg-white bb-text-B83B7E disabled:opacity-50"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
          {children.length > 0 && (
            <ul className="mt-3 space-y-2" aria-label={t("Холбогдсон хүүхдүүд", "Connected children")}>
              {children.map((child) => {
                const selected = child.id === activeChildId;
                return (
                  <li key={child.id}>
                    <button
                      type="button"
                      onClick={() => setActiveChildId(child.id)}
                      aria-pressed={selected}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm font-bold transition ${selected ? "bb-border-F48FB1 bb-bg-FDE7F1 text-slate-700" : "border-transparent bb-bg-FFF7FB text-slate-600"}`}
                    >
                      <span>{child.display_name || t("Охин", "Daughter")}</span>
                      {selected && <span className="text-xs font-extrabold bb-text-B83B7E">{t("Сонгосон", "Selected")}</span>}
                    </button>
                  </li>
                );
              })}
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
              <p className="font-extrabold text-slate-700">{t("Асран хамгаалагчтай холбогдсон", "Connected to guardian")}</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-500">
                {guardianName ? `Guardian: ${guardianName}` : t("Холболт идэвхтэй байна.", "The connection is active.")}
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
            {unlinking ? t("Салгаж байна…", "Disconnecting…") : t("Холболтыг салгах", "Disconnect")}
          </button>
          {linkError && <p className="mt-2 text-sm font-semibold text-rose-600">{linkError}</p>}
        </div>
      ) : (
        <div>
          <p className="text-sm font-semibold leading-relaxed text-slate-500">
            {t("Guardian-тайгаа холбогдох нь сонголттой. Кодоо хүссэн үедээ оруулж болно.", "Connecting with a guardian is optional. You can enter the code any time.")}
          </p>
          <label htmlFor="guardian-access-code" className="mt-4 block text-xs font-extrabold uppercase tracking-wider text-slate-400">
            {t("Асран хамгаалагчийн урилгын код", "Guardian invite code")}
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
            {joining ? t("Холбож байна…", "Connecting…") : t("Холбогдох", "Connect")}
          </button>
          <span className="sr-only" aria-live="polite">{linkStatus === "connecting" ? t("Холболт үүсгэж байна", "Creating connection") : t("Холбогдоогүй", "Not connected")}</span>
        </div>
      )}
    </Card>
  );
}
