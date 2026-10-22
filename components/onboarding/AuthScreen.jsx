"use client";

import { useState } from "react";
import { ChevronLeft, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useFamily } from "../../context/FamilyContext";
import RoleSelect from "./RoleSelect";

/** Нэвтрэх / бүртгүүлэх. stage: "role" → "signup" | "login" */
export default function AuthScreen() {
  const { signUp, signIn } = useFamily();
  const [stage, setStage] = useState("role");
  const [role, setRole] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  if (stage === "role") {
    return (
      <RoleSelect
        onPick={(r) => {
          setRole(r);
          setStage("signup");
          setMessage("");
        }}
        onLogin={() => {
          setStage("login");
          setMessage("");
        }}
      />
    );
  }

  const isSignup = stage === "signup";
  const canSubmit = email.includes("@") && password.length >= 6 && (!isSignup || name.trim().length > 0);

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit || busy) return;
    setBusy(true);
    setMessage("");
    const err = isSignup ? await signUp({ role, name, email, password }) : await signIn({ email, password });
    setBusy(false);
    if (err) setMessage(err);
  };

  const inputCls =
    "w-full rounded-2xl border-2 border-slate-100 bb-focus-border-81C784 outline-none px-4 py-3 font-bold text-slate-700 bg-white";

  return (
    <form onSubmit={submit} className="px-2 pt-4 pb-10 bloom-fade">
      <button
        type="button"
        onClick={() => setStage("role")}
        className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-slate-600 mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Буцах
      </button>

      <div className="text-5xl mb-3">{isSignup ? (role === "mother" ? "👩" : "👧") : "🌿"}</div>
      <h2 className="text-2xl font-black text-slate-700">
        {isSignup ? (role === "mother" ? "Ээжийн бүртгэл" : "Охины бүртгэл") : "Тавтай морил"}
      </h2>
      <p className="mt-1 text-slate-500 font-semibold">
        {isSignup ? "Хэдхэн секундэд бүртгүүлээрэй." : "Имэйл, нууц үгээрээ нэвтэрнэ үү."}
      </p>

      <div className="mt-6 space-y-4">
        {isSignup && (
          <div>
            <label
              htmlFor="name"
              className="block text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2"
            >
              {role === "mother" ? "Таны нэр" : "Чиний нэр"}
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              placeholder={role === "mother" ? "жишээ нь: Сараа" : "жишээ нь: Ану"}
              autoComplete="given-name"
              maxLength={40}
            />
          </div>
        )}
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2"
          >
            Имэйл
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            placeholder="name@gmail.com"
            autoComplete="email"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2"
          >
            Нууц үг
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputCls} pr-12`}
              placeholder="дор хаяж 6 тэмдэгт"
              autoComplete={isSignup ? "new-password" : "current-password"}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1"
              aria-label={showPw ? "Нууц үг нуух" : "Нууц үг харах"}
            >
              {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {message && (
        <p className="mt-4 text-sm font-semibold bb-text-C2674F flex items-start gap-1.5 bloom-pop">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {message}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit || busy}
        className="mt-6 w-full bb-bg-5E9E64 bb-disabled-bg-C8E6C9 text-white font-extrabold rounded-2xl py-4 active:scale-95 transition shadow-lg bb-shadow-81C784-30 flex items-center justify-center gap-2"
      >
        {busy && <Loader2 className="w-5 h-5 animate-spin" />}
        {isSignup ? "Бүртгүүлэх" : "Нэвтрэх"}
      </button>

      <button
        type="button"
        onClick={() => {
          setStage(isSignup ? "login" : "role");
          setMessage("");
        }}
        className="mt-4 w-full text-sm font-bold text-slate-500"
      >
        {isSignup ? "Бүртгэлтэй юу? Нэвтрэх" : "Бүртгэлгүй юу? Шинээр бүртгүүлэх"}
      </button>
    </form>
  );
}
