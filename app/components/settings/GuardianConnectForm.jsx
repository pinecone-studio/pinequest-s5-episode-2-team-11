"use client";

import { AlertCircle, LoaderCircle } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";

/** Daughter enters her guardian's invite code. There is no daughter-side unlink: only the guardian can unlink. */
export default function GuardianConnectForm() {
  const { guardianCode, setGuardianCode, linkError, setLinkError, joining, connectToGuardian, linkStatus } = useFamily();
  return (
    <div>
      <p className="text-sm font-semibold leading-relaxed text-slate-500">
        Асран хамгаалагчтайгаа холбогдох нь сонголттой. Түүний өгсөн кодыг хүссэн үедээ оруулж болно.
      </p>
      <label htmlFor="guardian-access-code" className="mt-4 block text-xs font-extrabold uppercase tracking-wider text-slate-400">
        Асран хамгаалагчийн урилгын код
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
  );
}
