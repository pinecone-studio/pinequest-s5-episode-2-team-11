"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useFamily } from "./FamilyContext";
import { supabase } from "../lib/supabase";

const ONBOARDING_CACHE_KEY = "bloomy_onboarding_done";
const OnboardingContext = createContext(null);

function getSupabaseErrorDetails(error) {
  return {
    code: error?.code ?? "unknown",
    message: error?.message ?? String(error),
    details: error?.details ?? "",
    hint: error?.hint ?? "",
  };
}

function isOnboardingMigrationMissing(error) {
  return ["42703", "PGRST204"].includes(error?.code)
    && /onboarding_completed/i.test(`${error?.message ?? ""} ${error?.details ?? ""}`);
}

function isOnboardingPermissionMissing(error) {
  return error?.code === "42501"
    && /onboarding_completed|profiles/i.test(`${error?.message ?? ""} ${error?.details ?? ""}`);
}

function readOnboardingCache(userId) {
  try {
    const saved = window.localStorage.getItem(ONBOARDING_CACHE_KEY);
    if (!saved) return false;
    const cache = JSON.parse(saved);
    return cache?.userId === userId && cache?.done === true;
  } catch {
    return false;
  }
}

function writeOnboardingCache(userId) {
  try {
    window.localStorage.setItem(ONBOARDING_CACHE_KEY, JSON.stringify({ userId, done: true }));
  } catch (error) {
    console.warn("Bloom onboarding local cache unavailable:", error);
  }
}

export function OnboardingProvider({ children }) {
  const { session, profile, ready, setToast } = useFamily();
  const userId = session?.user?.id ?? null;
  const role = profile?.role ?? null;
  const [isOpen, setIsOpen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setIsOpen(false);
    setError("");

    if (!userId) {
      setIsCompleted(false);
      return () => {
        cancelled = true;
      };
    }

    const cachedDone = readOnboardingCache(userId);
    setIsCompleted(cachedDone);

    if (!ready || !role || !supabase) {
      return () => {
        cancelled = true;
      };
    }

    const checkCompletion = async () => {
      const { data, error: queryError } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", userId)
        .maybeSingle();

      if (queryError) throw queryError;
      if (!data) throw new Error("Onboarding profile was not found");
      if (cancelled) return;

      const completed = data.onboarding_completed === true;
      if (completed) {
        setIsCompleted(true);
        writeOnboardingCache(userId);
      } else if (cachedDone) {
        const { error: syncError } = await supabase
          .from("profiles")
          .update({ onboarding_completed: true })
          .eq("id", userId);
        if (syncError) throw syncError;
      } else {
        setIsCompleted(false);
        setIsOpen(true);
      }
    };

    checkCompletion().catch((loadError) => {
      if (cancelled) return;
      const details = getSupabaseErrorDetails(loadError);
      if (isOnboardingMigrationMissing(loadError) || isOnboardingPermissionMissing(loadError)) {
        if (cachedDone) {
          console.warn("Bloom onboarding is saved on this device; run the Supabase migration to sync it across devices.", details);
          return;
        }
        console.warn("Bloom onboarding migration is not applied; showing the tutorial with device-only completion for now.", details);
        setIsOpen(true);
        setError("Supabase-ийн тохиргоо дутуу байна. supabase/onboarding-completed-migration.sql файлыг Supabase SQL Editor дээр ажиллуулаарай.");
        setToast("Зааврын тохиргоо дутуу байна.");
        return;
      }
      console.error("Bloom onboarding status check failed:", JSON.stringify(details));
      setError("Зааврын төлөвийг шалгаж чадсангүй. Интернэтээ шалгаад дахин оролдоорой.");
      setToast("Зааврын төлөвийг шалгаж чадсангүй.");
    });

    return () => {
      cancelled = true;
    };
  }, [userId, role, ready, setToast]);

  const openTutorial = useCallback(() => {
    if (!role) return;
    setError("");
    setIsOpen(true);
  }, [role]);

  const finishTutorial = useCallback(async () => {
    if (isCompleted) {
      setIsOpen(false);
      return true;
    }
    if (!userId || !role || !supabase) {
      setError("Зааврыг хадгалахад шаардлагатай мэдээлэл олдсонгүй.");
      return false;
    }

    setIsSaving(true);
    setError("");
    try {
      const { data, error: updateError } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", userId)
        .select("id")
        .maybeSingle();

      if (updateError) throw updateError;
      if (!data) throw new Error("Onboarding profile update did not affect a row");

      writeOnboardingCache(userId);
      setIsCompleted(true);
      setIsOpen(false);
      return true;
    } catch (saveError) {
      if (isOnboardingMigrationMissing(saveError) || isOnboardingPermissionMissing(saveError)) {
        writeOnboardingCache(userId);
        setIsCompleted(true);
        setIsOpen(false);
        setToast("Зааврыг энэ төхөөрөмжид хадгаллаа. Бусад төхөөрөмжид хадгалахын тулд Supabase migration ажиллуулаарай.");
        console.warn("Bloom onboarding is saved on this device only; run the Supabase migration to sync it across devices.", getSupabaseErrorDetails(saveError));
        return true;
      }
      console.error("Bloom onboarding completion save failed:", saveError);
      setError("Зааврыг хадгалж чадсангүй. Интернэтээ шалгаад дахин оролдоорой.");
      setToast("Зааврыг хадгалж чадсангүй.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [isCompleted, role, setToast, userId]);

  return (
    <OnboardingContext.Provider value={{ isOpen, isCompleted, isSaving, error, openTutorial, finishTutorial }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const value = useContext(OnboardingContext);
  if (!value) throw new Error("useOnboarding must be used within OnboardingProvider");
  return value;
}
