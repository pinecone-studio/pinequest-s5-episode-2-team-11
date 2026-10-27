"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { ageOnDate } from "../../../lib/purchase-policy.js";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";

const money = (value) => Number.isSafeInteger(Number(value)) && Number(value) >= 0 ? Number(value) : null;

export default function ChildPurchaseControls() {
  const { children, activeChildId, setActiveChildId, session } = useFamily();
  const childId = activeChildId ?? children[0]?.id ?? "";
  const [data, setData] = useState(null);
  const [dailyLimit, setDailyLimit] = useState("20000");
  const [weeklyLimit, setWeeklyLimit] = useState("80000");
  const [categoryValues, setCategoryValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const childAge = data ? ageOnDate(data.child.birthDate) : null;

  const load = useCallback(async () => {
    if (!childId || !session?.access_token) {
      setLoading(false);
      setData(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/store/parent-settings?childId=${encodeURIComponent(childId)}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Тохиргоо ачаалж чадсангүй.");
      setData(result);
      setDailyLimit(String(result.limits.daily_limit_mnt));
      setWeeklyLimit(String(result.limits.weekly_limit_mnt));
      setCategoryValues(Object.fromEntries(result.categories.map((category) => [
        category.id,
        {
          enabled: Boolean(category.rule?.enabled),
          daily: category.rule?.daily_limit_mnt == null ? "" : String(category.rule.daily_limit_mnt),
          weekly: category.rule?.weekly_limit_mnt == null
            ? category.default_weekly_limit == null ? "" : String(category.default_weekly_limit)
            : String(category.rule.weekly_limit_mnt),
        },
      ])));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Тохиргоо ачаалж чадсангүй.");
    } finally {
      setLoading(false);
    }
  }, [childId, session?.access_token]);

  useEffect(() => {
    load();
  }, [load]);

  const updateCategory = (id, patch) => setCategoryValues((current) => ({
    ...current,
    [id]: { ...current[id], ...patch },
  }));

  const save = async (event) => {
    event.preventDefault();
    if (!data || saving) return;
    const daily = money(dailyLimit);
    const weekly = money(weeklyLimit);
    if (daily === null || weekly === null || daily > 10_000_000 || weekly > 50_000_000) {
      setError("Өдрийн болон долоо хоногийн төсвийг зөв оруулна уу.");
      return;
    }

    const categoryLimits = data.categories
      .filter((category) => !category.always_blocked)
      .map((category) => ({
        categoryId: category.id,
        dailyLimitMnt: categoryValues[category.id]?.daily === "" ? null : money(categoryValues[category.id]?.daily),
        weeklyLimitMnt: categoryValues[category.id]?.weekly === "" ? null : money(categoryValues[category.id]?.weekly),
        invalid:
          (categoryValues[category.id]?.daily !== "" && money(categoryValues[category.id]?.daily) === null) ||
          (categoryValues[category.id]?.weekly !== "" && money(categoryValues[category.id]?.weekly) === null),
      }));
    if (categoryLimits.some((rule) =>
      rule.invalid ||
      (rule.dailyLimitMnt !== null && rule.dailyLimitMnt > 10_000_000) ||
      (rule.weeklyLimitMnt !== null && rule.weeklyLimitMnt > 50_000_000)
    )) {
      setError("Ангиллын төсвийн дүн буруу байна.");
      return;
    }

    categoryLimits.forEach((rule) => delete rule.invalid);

    setSaving(true);
    setError("");
    setStatus("");
    try {
      const response = await fetch("/api/store/parent-settings", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          dailyLimitMnt: daily,
          weeklyLimitMnt: weekly,
          feminineHygieneEnabled: Boolean(categoryValues.feminine_hygiene?.enabled),
          categoryLimits,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Тохиргоог хадгалж чадсангүй.");
      setStatus("Худалдан авалтын тохиргоо хадгалагдлаа.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Тохиргоог хадгалж чадсангүй.");
    } finally {
      setSaving(false);
    }
  };

  if (!children.length) return null;

  return (
    <Card className="p-3">
      <SectionTitle icon={ShieldCheck} title="Хүүхдийн худалдан авалт" />
      {children.length > 1 && (
        <label className="mb-3 block text-xs font-bold text-slate-500">
          Хүүхэд
          <select
            value={childId}
            onChange={(event) => setActiveChildId(event.target.value)}
            className="mt-1 w-full rounded-xl border-2 border-slate-100 bg-white px-3 py-2 text-sm font-bold text-slate-700"
          >
            {children.map((child) => <option key={child.id} value={child.id}>{child.display_name}</option>)}
          </select>
        </label>
      )}
      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
      ) : error && !data ? (
        <p role="alert" className="text-sm font-bold text-rose-600">{error}</p>
      ) : data ? (
        <>
          <p className="mb-3 text-xs font-semibold text-slate-500">
            {data.child.name} · төрсөн өдөр: {data.child.birthDate ?? "тодорхойгүй"} · насны хязгаар төрсөн өдрөөс автоматаар тооцогдоно.
          </p>
          <form onSubmit={save} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <MoneyField id="daily-purchase-limit" label="Өдрийн нийт төсөв" value={dailyLimit} onChange={setDailyLimit} />
              <MoneyField id="weekly-purchase-limit" label="7 хоногийн нийт төсөв" value={weeklyLimit} onChange={setWeeklyLimit} />
            </div>
            <div className="space-y-2">
              {data.categories.filter((category) => !category.always_blocked).map((category) => {
                const values = categoryValues[category.id] ?? { enabled: false, daily: "", weekly: "" };
                return (
                  <div key={category.id} className="rounded-xl bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-extrabold text-slate-700">{category.label}</p>
                        {category.parent_approval && (
                          <p className="mt-0.5 text-[10px] font-semibold text-slate-500">Зөвхөн {category.minimum_age}–{category.maximum_age} насанд</p>
                        )}
                        {category.id === "sweets" && (
                          <p className="mt-0.5 text-[10px] font-semibold text-slate-500">Анхны 7 хоногийн хязгаар: 10,000₮</p>
                        )}
                      </div>
                      {category.parent_approval && (
                        <label className="flex shrink-0 items-center gap-2 text-[11px] font-bold text-slate-600">
                          Зөвшөөрөх
                          <input
                            type="checkbox"
                            checked={values.enabled}
                            disabled={
                              !values.enabled &&
                              (childAge === null ||
                                childAge < category.minimum_age ||
                                childAge > category.maximum_age)
                            }
                            onChange={(event) => updateCategory(category.id, { enabled: event.target.checked })}
                            className="h-4 w-4 accent-pink-500"
                          />
                        </label>
                      )}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <MoneyField
                        id={`${category.id}-daily-limit`}
                        label="Өдрийн хязгаар · хоосон = нийт төсөв"
                        value={values.daily}
                        onChange={(value) => updateCategory(category.id, { daily: value })}
                      />
                      <MoneyField
                        id={`${category.id}-weekly-limit`}
                        label="7 хоногийн хязгаар"
                        value={values.weekly}
                        onChange={(value) => updateCategory(category.id, { weekly: value })}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] font-semibold leading-relaxed text-slate-500">
              Эм, витамин, насны хязгаартай бараа болон ангилалгүй барааг үргэлж хориглоно. Эдгээр хориог өөрчлөх боломжгүй.
            </p>
            {error && <p role="alert" className="text-xs font-bold text-rose-600">{error}</p>}
            {status && <p role="status" className="text-xs font-bold text-emerald-700">{status}</p>}
            <button type="submit" disabled={saving} className="w-full rounded-xl bb-bg-E0679F py-2.5 text-sm font-extrabold text-white disabled:opacity-50">
              {saving ? "Хадгалж байна…" : "Хязгаар хадгалах"}
            </button>
          </form>

          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="mb-2 text-sm font-black text-slate-700">Худалдан авалт ба хориглосон оролдлого</p>
            {data.attempts.length === 0 ? (
              <p className="text-xs font-semibold text-slate-400">Одоогоор бүртгэл алга.</p>
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {data.attempts.map((attempt) => (
                  <div key={attempt.id} className={`rounded-xl p-2.5 ${attempt.allowed ? "bg-emerald-50" : "bg-rose-50"}`}>
                    <p className="text-xs font-extrabold text-slate-700">{attempt.product_name}</p>
                    <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
                      {attempt.sku ?? "SKU тодорхойгүй"} · {attempt.total_mnt.toLocaleString("mn-MN")}₮ · {new Date(attempt.created_at).toLocaleString("mn-MN")}
                    </p>
                    {!attempt.allowed && <p className="mt-1 text-[10px] font-bold text-rose-700">Хориглосон · {attempt.reason}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </Card>
  );
}

function MoneyField({ id, label, value, onChange }) {
  return (
    <label htmlFor={id} className="block text-[10px] font-bold leading-tight text-slate-500">
      {label}
      <input
        id={id}
        type="number"
        min="0"
        step="100"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-bold text-slate-700"
      />
    </label>
  );
}
