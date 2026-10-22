export default function LoadError({ kind, onRetry, onSignOut }) {
  return (
    <div className="px-2 pt-10 bloom-fade space-y-4 text-center">
      <div className="text-5xl">🌧️</div>
      <h2 className="text-xl font-black text-slate-700">Мэдээллээ татаж чадсангүй</h2>
      <p className="text-sm font-semibold text-slate-500 leading-relaxed">
        {kind === "no_profile"
          ? "Таны профайл олдсонгүй. Supabase дээр schema.sql бүрэн ажилласан эсэхийг шалгаад дахин оролдоно уу."
          : "Интернэт холболтоо шалгаад дахин оролдоно уу."}
      </p>
      <button
        onClick={onRetry}
        className="w-full bb-bg-5E9E64 text-white font-extrabold rounded-2xl py-4 active:scale-95 transition"
      >
        Дахин оролдох
      </button>
      <button
        onClick={onSignOut}
        className="w-full rounded-2xl bg-white border-2 border-slate-100 py-4 font-extrabold text-slate-600 active:scale-95 transition"
      >
        Гарах
      </button>
    </div>
  );
}
