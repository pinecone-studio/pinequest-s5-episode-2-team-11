export default function SectionTitle({ icon: Icon, title, right, tone = "sage" }) {
  const bg = tone === "peach" ? "bb-bg-FFD8CC-60" : "bb-bg-E8F5E9";
  const fg = tone === "peach" ? "bb-text-C2674F" : "bb-text-4F8A55";
  return (
    <div className="flex items-center justify-between mb-3 gap-2">
      <div className="flex items-center gap-2">
        {Icon && (
          <span className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${fg}`} />
          </span>
        )}
        <h3 className="font-extrabold text-slate-700 text-base">{title}</h3>
      </div>
      {right}
    </div>
  );
}
