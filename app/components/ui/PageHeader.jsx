export default function PageHeader({ sub, title, right }) {
  return (
    <div className="flex items-end justify-between gap-2 bloom-fade">
      <div>
        <p className="text-sm font-bold text-slate-400">{sub}</p>
        <h2 className="text-2xl font-black text-slate-700 leading-tight">{title}</h2>
      </div>
      {right}
    </div>
  );
}
