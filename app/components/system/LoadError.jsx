import { t } from "../../../lib/i18n";

export default function LoadError({ kind, onRetry, onSignOut }) {
  return (
    <div className="px-2 pt-10 bloom-fade space-y-4 text-center">
      <div className="text-5xl">🌧️</div>
      <h2 className="text-xl font-black text-slate-700">{t("Мэдээллээ татаж чадсангүй", "Couldn't load your data")}</h2>
      <p className="text-sm font-semibold text-slate-500 leading-relaxed">
        {kind === "schema"
          ? t("Supabase-ийн профайл schema дутуу байна. supabase/schema.sql-ийг SQL Editor дээр бүрэн ажиллуулаад дахин оролдоно уу.", "The Supabase profile schema is incomplete. Run supabase/schema.sql fully in the SQL Editor and try again.")
          : kind === "no_profile"
          ? t("Таны профайл олдсонгүй. Supabase дээр schema.sql бүрэн ажилласан эсэхийг шалгаад дахин оролдоно уу.", "Your profile wasn't found. Check that schema.sql ran fully on Supabase and try again.")
          : t("Интернэт холболтоо шалгаад дахин оролдоно уу.", "Check your internet connection and try again.")}
      </p>
      <button
        onClick={onRetry}
        className="w-full bb-bg-5E9E64 text-white font-extrabold rounded-2xl py-4 active:scale-95 transition"
      >
        {t("Дахин оролдох", "Try again")}
      </button>
      <button
        onClick={onSignOut}
        className="w-full rounded-2xl bg-white border-2 border-slate-100 py-4 font-extrabold text-slate-600 active:scale-95 transition"
      >
        {t("Гарах", "Sign out")}
      </button>
    </div>
  );
}
