"use client";

/**
 * PremiumControls — асран хамгаалагч охин бүрт Bloomy Plus-ийг асаах/унтраах.
 * ДЕМО: жинхэнэ төлбөр байхгүй; асаахад 30 хоногийн эрх өгнө (app/api/premium).
 */

import { useCallback, useEffect, useState } from "react";
import { Crown, Loader2 } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { useT } from "../../../context/LanguageContext";
import { supabase } from "../../../lib/supabase";
import { locale } from "../../../lib/i18n";
import { PREMIUM_ITEMS } from "../../../lib/wardrobe";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";

const isLive = (row) => Boolean(row?.active && (!row.expires_at || new Date(row.expires_at) > new Date()));

export default function PremiumControls() {
  const { children, session } = useFamily();
  const t = useT();
  const [rows, setRows] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const childIds = children.map((child) => child.id).join(",");

  const load = useCallback(async () => {
    if (!supabase || !childIds) return setLoading(false);
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from("premium_subscriptions")
      .select("child_id, active, expires_at")
      .in("child_id", childIds.split(","));
    if (loadError) console.warn("[premium_subscriptions] load:", loadError.message);
    setRows(Object.fromEntries((data ?? []).map((row) => [row.child_id, row])));
    setLoading(false);
  }, [childIds]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (childId, active) => {
    if (!session?.access_token || savingId) return;
    setSavingId(childId);
    setError("");
    try {
      const response = await fetch("/api/premium", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ childId, active }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setRows((current) => ({ ...current, [childId]: result }));
    } catch (cause) {
      setError(cause instanceof Error && cause.message ? cause.message : t("Хадгалж чадсангүй.", "Couldn't save."));
    } finally {
      setSavingId(null);
    }
  };

  if (!children.length) return null;

  return (
    <Card className="p-3">
      <SectionTitle icon={Crown} title="Bloomy Plus" />
      <p className="mb-3 text-xs font-semibold leading-relaxed text-slate-500">
        {t(
          `Охин тань ${PREMIUM_ITEMS.length} онцгой хувцас, хавчаар, гутлыг алхаж цуглуулсан дэлбээгээрээ авах боломжтой болно. Демо: одоогоор төлбөргүй, 30 хоногоор идэвхжинэ.`,
          `Your daughter can get ${PREMIUM_ITEMS.length} special outfits, clips and shoes with the petals she earns by walking. Demo: currently free, active for 30 days.`,
        )}
      </p>
      {loading ? (
        <div className="flex justify-center py-3"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
      ) : (
        <div className="space-y-2">
          {children.map((child) => {
            const row = rows[child.id];
            const on = isLive(row);
            const saving = savingId === child.id;
            return (
              <div key={child.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-extrabold text-slate-700">{child.display_name}</p>
                  <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
                    {on
                      ? t(
                          `Идэвхтэй · ${new Date(row.expires_at).toLocaleDateString(locale())} хүртэл`,
                          `Active · until ${new Date(row.expires_at).toLocaleDateString(locale())}`,
                        )
                      : t("Идэвхгүй", "Off")}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={t(`${child.display_name}-д Bloomy Plus`, `Bloomy Plus for ${child.display_name}`)}
                  disabled={saving}
                  onClick={() => toggle(child.id, !on)}
                  className={`h-7 w-12 shrink-0 rounded-full p-1 transition-colors disabled:opacity-50 ${on ? "bb-bg-E0679F" : "bg-slate-200"}`}
                >
                  <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : ""}`} />
                </button>
              </div>
            );
          })}
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-xs font-bold text-rose-600">{error}</p>}
    </Card>
  );
}
