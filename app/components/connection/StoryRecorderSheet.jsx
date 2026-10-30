"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, PenLine, RotateCcw, Square } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { useLang } from "../../../context/LanguageContext";
import { authFetch } from "../../../lib/api-client";
import { t } from "../../../lib/i18n";
import BottomSheet from "../ui/BottomSheet";

export const STORY_PROMPTS = [
  "Хэдэн настай байсан бэ?",
  "Хэнд хэлсэн бэ?",
  "Юу мэдэрсэн бэ?",
  "Одоо охиндоо юу хэлмээр байна?",
];
const ENGLISH_STORY_PROMPTS = [
  "How old were you?",
  "Who did you tell?",
  "How did you feel?",
  "What would you like to tell your daughter now?",
];
const MAX_SECONDS = 120;
const MAX_TEXT = 1500;

const pickMimeType = () => {
  if (typeof MediaRecorder === "undefined") return null;
  return ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find((type) => MediaRecorder.isTypeSupported?.(type)) ?? "";
};

/** «🎙️ Миний түүх»: four guiding questions, then record (≤ 2 min) or write (≤ 1500), preview, send. */
export default function StoryRecorderSheet({ onClose }) {
  const { lang } = useLang();
  const { selectedDaughterId, daughterName, setToast } = useFamily();
  const [mode, setMode] = useState("audio");
  const [prompt, setPrompt] = useState(0);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [clip, setClip] = useState(null); // { blob, url, seconds }
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const audioSupported = typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);

  const stopTracks = () => streamRef.current?.getTracks().forEach((track) => track.stop());
  useEffect(() => () => { clearInterval(timerRef.current); stopTracks(); if (clip?.url) URL.revokeObjectURL(clip.url); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const start = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks = [];
      const startedAt = Date.now();
      recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
      recorder.onstop = () => {
        clearInterval(timerRef.current);
        stopTracks();
        const blob = new Blob(chunks, { type: (recorder.mimeType || mimeType || "audio/webm").split(";")[0] });
        const length = Math.min(MAX_SECONDS, Math.max(1, Math.round((Date.now() - startedAt) / 1000)));
        setClip({ blob, url: URL.createObjectURL(blob), seconds: length });
        setRecording(false);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => {
        const elapsed = Math.round((Date.now() - startedAt) / 1000);
        setSeconds(elapsed);
        if (elapsed >= MAX_SECONDS && recorder.state === "recording") recorder.stop();
      }, 500);
    } catch {
      setError(t("Микрофон ашиглах зөвшөөрөл өгөөгүй байна. Бичиж үлдээж болно.", "Microphone permission was not granted. You can write a message instead."));
    }
  };
  const stop = () => recorderRef.current?.state === "recording" && recorderRef.current.stop();
  const redo = () => {
    if (clip?.url) URL.revokeObjectURL(clip.url);
    setClip(null);
    setSeconds(0);
  };

  const send = async () => {
    if (sending || !selectedDaughterId) return;
    const form = new FormData();
    form.append("daughterId", selectedDaughterId);
    if (mode === "audio" && clip) {
      form.append("audio", clip.blob, "story");
      form.append("durationSec", String(clip.seconds));
    } else if (mode === "text" && text.trim()) {
      form.append("text", text.trim());
    } else return;
    setSending(true);
    setError("");
    const response = await authFetch("/api/stories", { method: "POST", body: form }).catch(() => null);
    setSending(false);
    if (!response?.ok) { setError(t("Илгээж чадсангүй. Дахин оролдоно уу.", "Could not send. Please try again.")); return; }
    setToast(t(`${daughterName}-д түүх илгээлээ 💌`, `Story sent to ${daughterName} 💌`));
    onClose();
  };

  const left = Math.max(0, MAX_SECONDS - seconds);
  return (
    <BottomSheet title={t("🎙️ Миний түүх", "🎙️ My story")} onClose={onClose}>
      <div className="space-y-4 pb-2">
        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-pink-50 to-purple-50 p-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white bb-text-B83B7E shadow-sm">
            <Mic className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-700">{t(`${daughterName}-д дурсамжаа үлдээгээрэй`, `Leave a memory for ${daughterName}`)}</p>
            <p className="mt-0.5 text-xs font-semibold leading-relaxed text-slate-500">{t("Зөвхөн та хоёрт харагдана · 2 минут хүртэл", "Only you two can see it · Up to 2 minutes")}</p>
          </div>
        </div>

        <div className="rounded-2xl bb-bg-FDE7F1-50 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">{t("Асуулт", "Question")} {prompt + 1}/{STORY_PROMPTS.length}</p>
            <div className="flex gap-1" aria-hidden="true">
              {STORY_PROMPTS.map((_, index) => (
                <span key={index} className={`h-1.5 w-5 rounded-full ${index === prompt ? "bb-bg-E0679F" : "bg-white"}`} />
              ))}
            </div>
          </div>
          <p className="mt-1 text-lg font-black leading-snug text-slate-800">{lang === "en" ? ENGLISH_STORY_PROMPTS[prompt] : STORY_PROMPTS[prompt]}</p>
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={prompt === 0} onClick={() => setPrompt((value) => value - 1)} className="rounded-xl bg-white px-3 py-2 text-xs font-extrabold text-slate-500 disabled:opacity-40">← {t("Өмнөх", "Previous")}</button>
            <button type="button" disabled={prompt === STORY_PROMPTS.length - 1} onClick={() => setPrompt((value) => value + 1)} className="rounded-xl bg-white px-3 py-2 text-xs font-extrabold bb-text-B83B7E disabled:opacity-40">{t("Дараах асуулт", "Next question")} →</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1" role="tablist">
          {[["audio", t("Дуу", "Audio"), Mic], ["text", t("Бичих", "Write"), PenLine]].map(([id, label, Icon]) => (
            <button key={id} type="button" role="tab" aria-selected={mode === id} disabled={recording || (id === "audio" && !audioSupported)} onClick={() => setMode(id)}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-extrabold disabled:opacity-40 ${mode === id ? "bg-white bb-text-B83B7E shadow-sm" : "text-slate-500"}`}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        {mode === "audio" ? (
          clip ? (
            <div className="rounded-2xl border border-pink-100 bg-white p-3.5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-black text-slate-700">{t("Бичлэгээ сонсох", "Preview your voice note")}</p>
                <span className="rounded-full bb-bg-FDE7F1 px-2.5 py-1 text-xs font-extrabold bb-text-B83B7E">{Math.floor(clip.seconds / 60)}:{String(clip.seconds % 60).padStart(2, "0")}</span>
              </div>
              <audio controls src={clip.url} className="w-full" />
              <button type="button" onClick={redo} className="mt-2 flex min-h-9 items-center gap-1.5 rounded-xl px-2 text-xs font-extrabold text-slate-500 transition hover:bg-slate-50">
                <RotateCcw className="h-3.5 w-3.5" /> {t("Дахин бичих", "Record again")}
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-pink-100 bg-white px-4 py-5">
              {audioSupported ? (
                <>
                  <div className="flex flex-col items-center gap-3">
                    <button type="button" onClick={recording ? stop : start} aria-label={recording ? t("Зогсоох", "Stop recording") : t("Бичиж эхлэх", "Start recording")}
                      className={`flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg ring-8 ring-pink-50 transition active:scale-95 ${recording ? "bg-rose-500 animate-pulse" : "bb-bg-E0679F"}`}>
                      {recording ? <Square className="h-7 w-7" /> : <Mic className="h-8 w-8" />}
                    </button>
                    <div className="text-center">
                      <p className="text-sm font-black text-slate-700" aria-live="polite">
                        {recording ? t("Бичиж байна…", "Recording…") : t("Яриагаа бичиж эхлээрэй", "Tap to record your voice")}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-400" aria-live="polite">
                        {recording ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")} · ${left} ${t("сек үлдлээ", "sec left")}` : t("Дуусмагц зогсоох товчийг дарна уу", "Tap stop when you are finished")}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-pink-50" role="progressbar" aria-label={t("Бичлэгийн хугацаа", "Recording time")} aria-valuemin={0} aria-valuemax={MAX_SECONDS} aria-valuenow={seconds}>
                    <div className={`h-full rounded-full transition-[width] duration-500 ${recording ? "bg-rose-400" : "bb-bg-E0679F"}`} style={{ width: `${(seconds / MAX_SECONDS) * 100}%` }} />
                  </div>
                </>
              ) : (
                <p className="text-center text-sm font-semibold leading-relaxed text-slate-500">
                  {t("Энэ төхөөрөмжид дуу бичих боломжгүй байна. Та бичвэрээр түүхээ үлдээж болно.", "Voice recording is not available on this device. You can write your story instead.")}
                </p>
              )}
            </div>
          )
        ) : (
          <div>
            <textarea value={text} onChange={(event) => setText(event.target.value.slice(0, MAX_TEXT))} rows={6} maxLength={MAX_TEXT}
              placeholder={t("Асуултуудыг дагаад бичээрэй…", "Use the prompts to write your story…")} className="w-full resize-none rounded-2xl border-2 border-slate-100 bg-white p-3 text-sm font-semibold text-slate-700 outline-none focus:border-pink-300" />
            <p className="text-right text-[11px] font-bold text-slate-400">{text.length}/{MAX_TEXT}</p>
          </div>
        )}

        {error && <p role="alert" className="text-sm font-bold text-rose-600">{error}</p>}
        <button type="button" onClick={send} disabled={sending || recording || (mode === "audio" ? !clip : !text.trim())}
          className="w-full rounded-2xl bb-bg-E0679F py-3.5 text-sm font-extrabold text-white disabled:opacity-50">
          {sending ? t("Илгээж байна…", "Sending…") : t("Илгээх", "Send")}
        </button>
      </div>
    </BottomSheet>
  );
}
