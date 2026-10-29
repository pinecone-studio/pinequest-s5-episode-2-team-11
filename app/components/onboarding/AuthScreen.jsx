"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check, ChevronLeft, Eye, EyeOff, Loader2, Heart, X } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import RoleSelect from "./RoleSelect";
import InstallGuide from "./InstallGuide";
import BloomyLogo from "../ui/BloomyLogo";
import { toDateStr } from "../../../lib/dates";
import { t } from "../../../lib/i18n";

// Шинэ бүртгэлийн нууц үгийн доод урт (хуучин 6 тэмдэгттэй бүртгэлүүд нэвтэрсээр байна)
const MIN_SIGNUP_PASSWORD = 8;

/** Нэвтрэх / бүртгүүлэх. stage: "install" → "role" → "signup" | "login" */
export default function AuthScreen() {
  const { signUp, signIn } = useFamily();
  const [stage, setStage] = useState("install");
  const [role, setRole] = useState(null);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const returnToRoleSelect = () => {
      setStage("install");
      setMessage("");
    };
    window.addEventListener("bloomy-auth-back", returnToRoleSelect);
    return () => window.removeEventListener("bloomy-auth-back", returnToRoleSelect);
  }, []);

  if (stage === "install") {
    return <InstallGuide onContinue={() => setStage("role")} />;
  }

  if (stage === "role") {
    return (
      <RoleSelect
        onBack={() => setStage("install")}
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
  const isDaughter = role === "daughter";
  const passwordLongEnough = password.length >= (isSignup ? MIN_SIGNUP_PASSWORD : 6);
  const canSubmit =
    email.includes("@") &&
    passwordLongEnough &&
    (!isSignup || (name.trim().length > 0 && (!isDaughter || birthDate)));

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit || busy) return;
    setBusy(true);
    setMessage("");
    let err;
    if (isSignup) {
      err = await signUp({ role, name, birthDate: isDaughter ? birthDate : null, email, password });
      if (err === "existing_user") {
        setStage("login");
        err = await signIn({ email, password });
      }
    } else {
      err = await signIn({ email, password });
    }
    setBusy(false);
    if (err) setMessage(err);
  };

  const inputCls =
    "w-full rounded-2xl border-2 bb-border-F8D3E6 bb-focus-border-F48FB1 outline-none px-4 py-3 font-bold text-slate-700 bb-bg-FFF7FB transition focus:shadow-md focus:shadow-pink-100";

  return (
    <form onSubmit={submit} className="px-2 pt-4 pb-10 bloom-fade">
      <button
        type="button"
        onClick={() => {
          setStage("role");
          setMessage("");
        }}
        className="mb-4 -ml-1 inline-flex items-center gap-1 rounded-full py-1.5 pl-1.5 pr-3 text-sm font-extrabold text-slate-500 transition hover:bg-pink-50 active:scale-95"
        aria-label={t("Буцах", "Back")}
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" /> {t("Буцах", "Back")}
      </button>
      {!isSignup && (
        <div className="mb-3">
          <BloomyLogo className="w-16 h-16" />
        </div>
      )}
      {isSignup && (
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bb-bg-FDE7F1 px-3 py-1.5 text-xs font-extrabold bb-text-B83B7E">
          <Heart className="h-3.5 w-3.5 fill-current" /> {t("Bloomy · Шинэ бүртгэл", "Bloomy · Sign up")}
        </span>
      )}
      <h2 className="text-2xl font-black text-slate-700">
        {isSignup ? (role === "mother" ? t("Асран хамгаалагчийн бүртгэл", "Guardian account") : t("Өсвөр насны охины бүртгэл", "Teen girl account")) : t("Тавтай морил", "Welcome")}
      </h2>
      {!isSignup && <p className="mt-1 text-lg text-slate-500 font-semibold">{t("Имэйл, нууц үгээрээ нэвтэрнэ үү.", "Sign in with your email and password.")}</p>}

      <div className="mt-6 space-y-4">
        {isSignup && (
          <div>
            <label
              htmlFor="name"
              className="block text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2"
            >
              {role === "mother" ? t("Таны нэр", "Your name") : t("Чиний нэр", "Your name")}
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              autoComplete="given-name"
              maxLength={40}
            />
          </div>
        )}
        {isSignup && isDaughter && (
          <div>
            <label
              htmlFor="birth-date"
              className="block text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2"
            >
              {t("Төрсөн өдөр", "Birthday")}
            </label>
            <input
              id="birth-date"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className={inputCls}
              max={toDateStr()}
              min="1990-01-01"
              autoComplete="bday"
            />
          </div>
        )}
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2"
          >
            {t("Имэйл", "Email")}
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            autoComplete="email"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2"
          >
            {t("Нууц үг", "Password")}
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputCls} pr-12`}
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={isSignup ? MIN_SIGNUP_PASSWORD : undefined}
              aria-describedby={isSignup ? "password-rule" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1"
              aria-label={showPw ? t("Нууц үг нуух", "Hide password") : t("Нууц үг харах", "Show password")}
            >
              {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {isSignup && (
            <p
              id="password-rule"
              aria-live="polite"
              className={`mt-2 flex items-center gap-1.5 text-xs font-bold ${
                passwordLongEnough ? "text-emerald-600" : password ? "text-rose-500" : "text-slate-400"
              }`}
            >
              {passwordLongEnough ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : password ? <X className="h-3.5 w-3.5" strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
              {t(`Дор хаяж ${MIN_SIGNUP_PASSWORD} тэмдэгт`, `At least ${MIN_SIGNUP_PASSWORD} characters`)}
              {password && !passwordLongEnough && ` · ${t(`${MIN_SIGNUP_PASSWORD - password.length} дутуу`, `${MIN_SIGNUP_PASSWORD - password.length} more`)}`}
            </p>
          )}
        </div>
      </div>

      {message && (
        <p className="mt-4 text-sm font-semibold bb-text-7C4DCC flex items-start gap-1.5 bloom-pop">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {message}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit || busy}
        className="mt-6 w-full bb-grad-sos bb-disabled-bg-F8D3E6 text-white font-extrabold rounded-2xl py-4 active:scale-95 transition shadow-lg bb-shadow-F48FB1-30 flex items-center justify-center gap-2"
      >
        {busy && <Loader2 className="w-5 h-5 animate-spin" />}
        {isSignup ? t("Бүртгүүлэх", "Sign up") : t("Нэвтрэх", "Sign in")}
      </button>

      <button
        type="button"
        onClick={() => {
          setStage(isSignup ? "login" : "role");
          setMessage("");
        }}
        className="mt-4 w-full text-sm font-bold text-slate-500"
      >
        {isSignup ? t("Бүртгэлтэй юу? Нэвтрэх", "Have an account? Sign in") : t("Бүртгэлгүй юу? Шинээр бүртгүүлэх", "No account? Sign up")}
      </button>
    </form>
  );
}
