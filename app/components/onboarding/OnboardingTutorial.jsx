"use client";

import { useEffect, useRef, useState } from "react";
import { onboardingSteps } from "./onboardingSteps";

export default function OnboardingTutorial({ role, onFinish, isSaving, error }) {
  const steps = onboardingSteps[role] ?? [];
  const [activeStep, setActiveStep] = useState(0);
  const touchStartX = useRef(null);
  const skipButtonRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    skipButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Tab") {
        const focusable = dialogRef.current?.querySelectorAll("button:not(:disabled)");
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
        return;
      }
      if (event.key === "ArrowRight") setActiveStep((current) => Math.min(current + 1, steps.length - 1));
      if (event.key === "ArrowLeft") setActiveStep((current) => Math.max(current - 1, 0));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [steps.length]);

  if (!steps.length) return null;

  const lastStep = activeStep === steps.length - 1;
  const finish = () => {
    if (!isSaving) onFinish();
  };
  const onTouchEnd = (event) => {
    if (touchStartX.current == null) return;
    const distance = event.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(distance) > 50) {
      setActiveStep((current) => Math.min(Math.max(current + (distance < 0 ? 1 : -1), 0), steps.length - 1));
    }
    touchStartX.current = null;
  };

  return (
    <div
      className="onboarding-overlay fixed inset-0 z-[120] flex items-center justify-center"
      style={{
        paddingTop: "max(1rem, env(safe-area-inset-top))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Bloomy аппын заавар"
        ref={dialogRef}
        className="onboarding-dialog flex h-full w-full max-w-md flex-col"
      >
        <header className="flex shrink-0 items-center justify-between gap-3">
          <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-extrabold text-slate-600 shadow-sm">
            {activeStep + 1} / {steps.length}
          </span>
          <button
            ref={skipButtonRef}
            type="button"
            onClick={finish}
            disabled={isSaving}
            className="min-h-11 rounded-full bg-white px-4 py-2 text-sm font-extrabold text-slate-700 shadow-sm transition hover:bg-pink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 disabled:opacity-60"
            aria-label="Зааврыг алгасах"
          >
            Алгасах
          </button>
        </header>

        <div
          className="onboarding-carousel my-4 flex min-h-0 flex-1 items-center overflow-hidden rounded-[2rem]"
          onTouchStart={(event) => {
            touchStartX.current = event.touches[0].clientX;
          }}
          onTouchEnd={onTouchEnd}
        >
          <div className="onboarding-track flex h-full w-full" aria-live="polite" style={{ transform: `translateX(-${activeStep * 100}%)` }}>
            {steps.map((step, index) => (
              <article
                key={`${role}-${step.title}`}
                aria-hidden={activeStep !== index}
                className="onboarding-card flex h-full w-full shrink-0 flex-col items-center justify-center rounded-[2rem] border border-pink-100 bg-white px-6 text-center shadow-xl shadow-pink-200/50"
              >
                <span aria-hidden="true" className="mb-7 flex h-32 w-32 items-center justify-center rounded-full bg-pink-50 text-7xl">
                  {step.icon}
                </span>
                <h1 className="text-2xl font-black leading-tight text-slate-800">{step.title}</h1>
                <p className="mt-4 max-w-sm text-base font-semibold leading-relaxed text-slate-600">{step.description}</p>
              </article>
            ))}
          </div>
        </div>

        <footer className="shrink-0">
          {error && <p role="alert" className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-center text-sm font-bold text-rose-700">{error}</p>}
          <ol className="mb-4 flex list-none items-center justify-center gap-2 p-0" aria-label="Зааврын явц">
            {steps.map((step, index) => (
              <li key={step.title} aria-current={activeStep === index ? "step" : undefined} aria-label={`${index + 1}-р алхам`}>
                <span aria-hidden="true" className={`block h-2.5 rounded-full transition-all ${activeStep === index ? "w-7 bg-pink-600" : "w-2.5 bg-pink-200"}`} />
              </li>
            ))}
          </ol>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setActiveStep((current) => Math.max(current - 1, 0))}
              disabled={activeStep === 0 || isSaving}
              className="min-h-12 flex-1 rounded-2xl border-2 border-pink-200 bg-white px-4 py-3 text-base font-extrabold text-pink-800 transition hover:bg-pink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 disabled:opacity-45"
              aria-label="Өмнөх алхам"
            >
              Буцах
            </button>
            <button
              type="button"
              onClick={lastStep ? finish : () => setActiveStep((current) => Math.min(current + 1, steps.length - 1))}
              disabled={isSaving}
              className="min-h-12 flex-1 rounded-2xl bg-pink-700 px-4 py-3 text-base font-extrabold text-white shadow-lg shadow-pink-200 transition hover:bg-pink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-700 focus-visible:ring-offset-2 disabled:opacity-60"
              aria-label={lastStep ? "Зааврыг дуусгаж эхлэх" : "Дараагийн алхам"}
            >
              {isSaving ? "Хадгалж байна…" : lastStep ? "Эхлэх" : "Дараах"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
