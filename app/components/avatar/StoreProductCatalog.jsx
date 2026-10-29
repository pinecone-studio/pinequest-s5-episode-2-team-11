"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, ShoppingBag } from "lucide-react";

export default function StoreProductCatalog({ accessToken }) {
  const [products, setProducts] = useState([]);
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");

  const loadCatalog = useCallback(async () => {
    if (!accessToken) {
      setError("Дэлгүүр ашиглахын тулд нэвтэрнэ үү.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/store/catalog", {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Дэлгүүр ачаалж чадсангүй.");
      if (result.error) throw new Error(result.error);
      setProducts(result.products);
      setBudget(result.budget);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Дэлгүүр ачаалж чадсангүй.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const purchase = async (product) => {
    if (!accessToken || busyId) return;
    setBusyId(product.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/store/checkout", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Энэ барааг авах боломжгүй байна.");
      setMessage(result.message);
      await loadCatalog();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Энэ барааг авах боломжгүй байна.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <section className="mt-4 rounded-2xl border border-slate-100 bg-white p-3">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bb-bg-FDE7F1 bb-text-B83B7E">
          <ShoppingBag className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-black text-slate-700">Хэрэглэх дэлгүүр</p>
          <p className="text-xs font-semibold text-slate-500">Насанд тохирох бараа л харагдана</p>
        </div>
      </div>
      <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-semibold leading-relaxed text-amber-800">
        Энэ нь жишээ каталог бөгөөд бодит eMonos үнэ, бараа эсвэл захиалга биш. Түр захиалга бүртгэж, асран хамгаалагчид мэдэгдэнэ.
      </p>
      {budget && (
        <div className="mt-3 rounded-xl bb-bg-E9DDFC-50 p-3 text-xs font-bold text-slate-600">
          <p>Өдрийн төсөв: {Math.max(0, budget.dailyLimitMnt - budget.dailySpentMnt).toLocaleString("mn-MN")}₮ үлдсэн</p>
          <p className="mt-1">Долоо хоногийн төсөв: {Math.max(0, budget.weeklyLimitMnt - budget.weeklySpentMnt).toLocaleString("mn-MN")}₮ үлдсэн</p>
          <p className="mt-1">Амттаны төсөв: {Math.max(0, budget.sweetsWeeklyLimitMnt - budget.sweetsWeeklySpentMnt).toLocaleString("mn-MN")}₮ үлдсэн</p>
        </div>
      )}
      {loading ? (
        <div className="flex justify-center py-5"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
      ) : error && products.length === 0 ? (
        <p role="alert" className="py-4 text-center text-sm font-semibold text-rose-600">{error}</p>
      ) : products.length === 0 ? (
        <p className="py-4 text-center text-sm font-semibold text-slate-400">Одоогоор авах боломжтой бараа алга.</p>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {products.map((product) => (
            <article key={product.id} className="overflow-hidden rounded-xl border border-slate-100 bg-white">
              <div className="flex h-24 items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
                {product.image_url ? (
                  <img src={product.image_url} alt="" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-4xl" aria-hidden="true">{product.emoji}</span>
                )}
              </div>
              <div className="p-2">
                <p className="text-[10px] font-bold text-slate-400">{product.merchant}</p>
                <p className="mt-0.5 min-h-8 text-xs font-extrabold leading-snug text-slate-700">{product.name}</p>
                <p className="mt-1 text-sm font-black bb-text-B83B7E">{product.price_mnt.toLocaleString("mn-MN")}₮</p>
                <button
                  type="button"
                  onClick={() => purchase(product)}
                  disabled={Boolean(busyId)}
                  className="mt-2 w-full rounded-lg bb-bg-E0679F py-2 text-xs font-extrabold text-white disabled:opacity-50"
                >
                  {busyId === product.id ? "Бүртгэж байна…" : "Авах хүсэлт"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {message && <p role="status" className="mt-3 text-xs font-bold text-emerald-700">{message}</p>}
      {error && products.length > 0 && <p role="alert" className="mt-3 text-xs font-bold text-rose-600">{error}</p>}
    </section>
  );
}
