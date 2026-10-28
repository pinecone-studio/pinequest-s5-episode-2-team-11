"use client";

/**
 * usePremium — охины Bloomy Plus эрх (supabase/premium-subscriptions.sql).
 * Асран хамгаалагч Тохиргоо хэсгээс асаана. Ачаалах хүртэл / алдаа гарвал эрхгүй гэж үзнэ.
 */

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

const NONE = { active: false, expiresAt: null };

export function usePremium(userId) {
  const [premium, setPremium] = useState(NONE);

  useEffect(() => {
    setPremium(NONE);
    if (!supabase || !userId) return;
    let cancelled = false;
    supabase
      .from("premium_subscriptions")
      .select("active, expires_at")
      .eq("child_id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.warn("[premium_subscriptions] load:", error.message);
        if (cancelled || !data) return;
        const live = data.active && (!data.expires_at || new Date(data.expires_at) > new Date());
        setPremium({ active: Boolean(live), expiresAt: live ? data.expires_at : null });
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return premium;
}
