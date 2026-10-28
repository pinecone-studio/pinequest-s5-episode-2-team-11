"use client";

import { useEffect, useState } from "react";
import { Check, ChevronRight, Copy, Tag, X } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { useAvatar } from "./useAvatar";
import { t } from "../../../lib/i18n";
import Card from "../ui/Card";
import StoreProductCatalog from "./StoreProductCatalog";

const COUPONS = [
  { id: "bloom10", cost: 300, discount: "10%", get title() { return t("Хэрэгслийн худалдан авалтад", "For supply purchases"); } },
  { id: "care15", cost: 300, discount: "15%", get title() { return t("Өөртөө тавих анхааралд", "For self-care"); } },
];

export default function CouponRewards({ featured = false }) {
  const { profile, session, setToast } = useFamily();
  const avatar = useAvatar(profile?.id, setToast);
  const couponStorageKey = `bloom:claimed-coupons:${profile?.id ?? "guest"}`;
  const [claimedCoupons, setClaimedCoupons] = useState([]);
  const [copiedCoupon, setCopiedCoupon] = useState("");
  const [couponOpen, setCouponOpen] = useState(false);

  useEffect(() => {
    try { setClaimedCoupons(JSON.parse(localStorage.getItem(couponStorageKey) || "[]")); }
    catch { setClaimedCoupons([]); }
  }, [couponStorageKey]);

  const claimCoupon = (coupon) => {
    if (!avatar.loaded) return;
    if (avatar.availableXp < coupon.cost) {
      setToast(t(`${coupon.cost - avatar.availableXp} XP нэмж цуглуулаарай ✨`, `Collect ${coupon.cost - avatar.availableXp} more XP ✨`));
      return;
    }
    if (!avatar.spendXp(coupon.cost)) return;
    const code = `BLM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const next = [...claimedCoupons, { ...coupon, code, claimedAt: new Date().toISOString() }];
    setClaimedCoupons(next);
    try { localStorage.setItem(couponStorageKey, JSON.stringify(next)); } catch { /* localStorage боломжгүй */ }
    setToast(t(`${coupon.cost} XP-ээр купон авлаа 💗`, `Got a coupon for ${coupon.cost} XP 💗`));
  };

  const copyCoupon = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCoupon(code);
      window.setTimeout(() => setCopiedCoupon(""), 1800);
    } catch { setCopiedCoupon(""); }
  };

  return (
    <>
      <button type="button" onClick={() => setCouponOpen(true)} className={`${featured ? "" : "mt-3"} flex w-full items-center gap-4 rounded-3xl ${featured ? "bg-gradient-to-r from-[#e0679f] to-[#b83b7e] p-5 text-white shadow-xl bb-shadow-F48FB1-30" : "bg-slate-50 px-3 py-3 text-left"} text-left active:scale-[0.99] transition-transform`}>
        <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${featured ? "bg-white/20 text-white" : "bb-bg-FDE7F1 bb-text-B83B7E"}`}><Tag className="h-7 w-7" /></span>
        <span className="min-w-0 flex-1">
          <span className={`block ${featured ? "text-xl text-white" : "text-sm text-slate-700"} font-extrabold`}>{t("XP-ээр авах купон", "Coupons for XP")}</span>
          <span className={`mt-1 block ${featured ? "text-sm text-white/85" : "text-xs text-slate-500"} font-bold`}>{avatar.loaded ? `${avatar.availableXp} XP` : t("XP ачаалж байна…", "Loading XP…")} {t("цуглуулсан XP-ээр урамшуулал аваарай", "get rewards with the XP you collect")}</span>
        </span>
        <ChevronRight className={`h-6 w-6 shrink-0 ${featured ? "text-white" : "text-slate-400"}`} />
      </button>

      {couponOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setCouponOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="coupon-dialog-title" onClick={(event) => event.stopPropagation()} className="coupon-dialog-shell max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-[2rem] border border-pink-100 bg-[#fff7fb] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[2rem]">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 id="coupon-dialog-title" className="text-lg font-black text-slate-800">{t("Купон ба урамшуулал", "Coupons & rewards")}</h2>
              <button type="button" onClick={() => setCouponOpen(false)} aria-label={t("Купон цонх хаах", "Close coupons")} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500"><X className="h-5 w-5" /></button>
            </div>
            <Card>
              <div className="mb-3 flex items-center justify-between rounded-2xl bb-bg-E9DDFC-50 px-3 py-2.5">
                <span className="text-xs font-bold text-slate-600">{t("Зарцуулах боломжтой XP", "XP available to spend")}</span>
                <span className="text-sm font-black bb-text-7C4DCC">{avatar.loaded ? avatar.availableXp : "…"} XP</span>
              </div>
              <div className="space-y-3">
                {COUPONS.map((coupon) => (
                  <div key={coupon.id} className="coupon-offer-card overflow-hidden rounded-2xl border border-pink-100 bg-gradient-to-r from-pink-50 to-purple-50 p-3">
                    <div className="flex items-center gap-3">
                      <div className="coupon-discount flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-white text-pink-600 shadow-sm"><span className="text-base font-black leading-none">{coupon.discount}</span><span className="mt-1 text-[9px] font-extrabold uppercase">off</span></div>
                      <div className="min-w-0 flex-1"><p className="text-sm font-extrabold text-slate-700">{coupon.title}</p><p className="coupon-offer-detail mt-0.5 text-[11px] font-semibold text-slate-500">{coupon.cost} {t("XP-ээр авах · нэг удаа", "Get with XP · one time")}</p></div>
                      <button type="button" onClick={() => claimCoupon(coupon)} disabled={!avatar.loaded || avatar.availableXp < coupon.cost} className="shrink-0 rounded-xl bg-pink-500 px-3 py-2 text-xs font-extrabold text-white active:scale-95 disabled:opacity-50">{claimedCoupons.some((item) => item.id === coupon.id) ? t("Дахин авах", "Get again") : t("XP-ээр авах", "Get with XP")}</button>
                    </div>
                  </div>
                ))}
              </div>
              <StoreProductCatalog accessToken={session?.access_token} />
              {claimedCoupons.length > 0 && <div className="mt-4 space-y-2"><p className="text-xs font-extrabold text-slate-600">Миний купонууд</p>{claimedCoupons.map((coupon) => <div key={coupon.code} className="coupon-issued-code flex items-center justify-between gap-2 rounded-xl border border-dashed border-pink-200 bg-white px-3 py-2"><div><span className="font-mono text-xs font-black tracking-wider text-pink-700">{coupon.code}</span><span className="ml-2 text-[11px] font-semibold text-slate-500">{coupon.discount} · {coupon.title}</span></div><button type="button" onClick={() => copyCoupon(coupon.code)} aria-label={`${coupon.code} код хуулах`} className="flex shrink-0 items-center gap-1 text-xs font-bold text-slate-500">{copiedCoupon === coupon.code ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copiedCoupon === coupon.code ? "Хууллаа" : "Хуулах"}</button></div>)}</div>}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
