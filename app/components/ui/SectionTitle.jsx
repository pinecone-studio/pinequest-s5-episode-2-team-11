export default function SectionTitle({ icon: Icon, title, right, tone = "sage", titleStyle }) {
  const bg = tone === "peach" ? "bb-bg-E9DDFC-60" : "bb-bg-FDE7F1";
  const fg = tone === "peach" ? "bb-text-7C4DCC" : "bb-text-B83B7E";
  return (
    <div className="flex items-center justify-between mb-3 gap-2">
      <div className="flex items-center gap-2">
        {Icon && (
          <span className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${fg}`} />
          </span>
        )}
        <h3 className="font-extrabold text-slate-700 text-base" style={titleStyle}>{title}</h3>
      </div>
      {right}
    </div>
  );
}
