import { PHASE_COLORS, PHASES } from "../../lib/data";

export default function CycleRing({ day, cycleLength, periodLength, phaseKey, daysUntil, daysLate = 0 }) {
  const size = 236;
  const stroke = 16;
  const r = (size - stroke) / 2 - 10;
  const C = 2 * Math.PI * r;
  const ovDay = cycleLength - 14;
  const gap = 4;
  const segments = [
    { key: "period", from: 1, to: periodLength },
    { key: "follicular", from: periodLength + 1, to: ovDay - 2 },
    { key: "ovulation", from: ovDay - 1, to: ovDay + 1 },
    { key: "luteal", from: ovDay + 2, to: cycleLength },
  ];
  const angle = ((day - 0.5) / cycleLength) * 2 * Math.PI - Math.PI / 2;
  const mx = size / 2 + r * Math.cos(angle);
  const my = size / 2 + r * Math.sin(angle);
  const color = PHASE_COLORS[phaseKey];

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="overflow-visible">
        <circle cx={size / 2} cy={size / 2} r={r - 22} fill="#FAF8F5" />
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {segments.map((s) => {
            const len = ((s.to - s.from + 1) / cycleLength) * C - gap;
            const offset = -((s.from - 1) / cycleLength) * C;
            const active = s.key === phaseKey;
            return (
              <circle
                key={s.key}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={PHASE_COLORS[s.key]}
                strokeWidth={stroke}
                strokeOpacity={active ? 1 : 0.35}
                strokeLinecap="round"
                strokeDasharray={`${Math.max(len - stroke * 0.6, 1)} ${C}`}
                strokeDashoffset={offset - stroke * 0.3}
                style={{ transition: "stroke-opacity .5s ease" }}
              />
            );
          })}
        </g>
        <circle cx={mx} cy={my} r={17} fill={color} opacity={0.25} />
        <circle cx={mx} cy={my} r={11} fill="white" stroke={color} strokeWidth={4} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-10">
        <span className="text-xs font-bold text-slate-400">
          {day}/{cycleLength} өдөр
        </span>
        {phaseKey === "period" ? (
          <>
            <span className="text-sm font-bold text-slate-500 mt-1">Сарын тэмдгийн</span>
            <span className="text-5xl font-black text-slate-700 leading-none">{day}</span>
            <span className="text-sm font-bold text-slate-500">дэх өдөр</span>
          </>
        ) : daysLate > 0 || daysUntil === 0 ? (
          <>
            <span className="text-xs font-bold text-slate-500 mt-1 leading-tight">Сарын тэмдэг</span>
            <span className="text-3xl font-black text-slate-700 leading-tight">удахгүй</span>
            <span className="text-xs font-bold text-slate-500">ирэх магадлалтай</span>
          </>
        ) : daysUntil <= 7 ? (
          <>
            <span className="text-xs font-bold text-slate-500 mt-1 leading-tight">Сарын тэмдэг ирэхэд</span>
            <span className="text-5xl font-black text-slate-700 leading-none">{daysUntil}</span>
            <span className="text-xs font-bold text-slate-500">хоног үлдлээ</span>
          </>
        ) : (
          <>
            <span className="text-5xl font-black text-slate-700 leading-none mt-1">{day}</span>
            <span className="text-xs font-bold text-slate-500 leading-tight">
              дэх өдөр · {daysUntil} хоногийн дараа
            </span>
          </>
        )}
        <span
          className="mt-2 px-3 py-1 rounded-full text-xs font-extrabold text-slate-700"
          style={{ background: `${color}55` }}
        >
          {PHASES[phaseKey].name}
        </span>
      </div>
    </div>
  );
}
