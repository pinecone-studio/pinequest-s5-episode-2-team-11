import { PHASE_COLORS, PHASES } from "../../../lib/data";

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
  const bloom = phaseKey === "period"
    ? Math.max(0, (periodLength - day) / Math.max(periodLength - 1, 1))
    : daysUntil <= 7
      ? Math.min(1, (8 - daysUntil) / 7)
      : 0;
  const blossomColors = ["#A79ADD", "#E5B6D0", "#E8CE98", "#A8D8D3", "#C9A6D7"];
  // Reveal flowers in a sequence spread around the ring, so the first buds do not clump together.
  const revealOrder = [0, 9, 4, 13, 2, 11, 6, 15, 1, 10, 5, 14, 3, 12, 7, 16, 8, 17];
  const flowerSpots = revealOrder.map((spot, i) => {
    const angle = (spot / 18) * 2 * Math.PI - Math.PI / 2;
    const radius = 120 + (i % 3) * 3;
    return {
      x: 150 + radius * Math.cos(angle),
      y: 150 + radius * Math.sin(angle),
      rotation: (angle * 180) / Math.PI + 90,
      color: blossomColors[i % blossomColors.length],
      growth: Math.max(0, Math.min(1, bloom * 18 - i)),
    };
  });

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg
        aria-hidden="true"
        viewBox="0 0 300 300"
        className="pointer-events-none absolute -left-8 -top-8 z-10 h-[300px] w-[300px] overflow-visible"
      >
        {flowerSpots.map((flower, i) => (
          <g key={i} transform={`translate(${flower.x} ${flower.y}) rotate(${flower.rotation})`}>
            <g className="cycle-bloom-flower" style={{ opacity: flower.growth, transform: `scale(${0.3 + flower.growth * 0.7})`, transformOrigin: "35px 14px" }}>
              <path d="M-25 4C-11-5 7 5 24-2" fill="none" stroke="#9CAF83" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M-17 1C-22-7-17-13-11-10C-8-6-12-2-17 1ZM-10 0C-11 7-5 11 0 7C0 3-4 0-10 0ZM0 1C0-7 6-11 11-7C11-3 7 0 0 1ZM10-1C11 5 16 8 21 4C20 1 16-1 10-1Z" fill="#BDD0A3" stroke="#94A982" strokeWidth="1" strokeLinejoin="round" />
              <path d="M-5-1C-9-8-5-14 1-13C7-12 8-6 4-2C9 2 7 9 1 9C-4 9-7 4-5-1Z" fill={flower.color} opacity="0.9" />
              <circle cx="0" cy="-2" r="1.8" fill="#EBCB83" />
              {i % 2 === 0 && (
                <g transform="translate(16 -8) scale(.55)" fill="#DAB0CE" opacity=".9">
                  <circle cx="0" cy="-3" r="2.5" /><circle cx="3" cy="0" r="2.5" />
                  <circle cx="0" cy="3" r="2.5" /><circle cx="-3" cy="0" r="2.5" />
                  <circle cx="0" cy="0" r="1.2" fill="#E8CC91" />
                </g>
              )}
              {i % 3 === 0 && <path d="M-24 4C-30-2-34-1-35 3C-32 7-28 7-24 4Z" fill="#B7C8A0" />}
            </g>
          </g>
        ))}
      </svg>
      <svg width={size} height={size} className="overflow-visible">
        <circle className="cycle-ring-center" cx={size / 2} cy={size / 2} r={r - 22} fill="#FFF7FB" />
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
      <div className="cycle-ring-copy absolute inset-0 flex flex-col items-center justify-center text-center px-10">
        <span className="text-xs font-bold text-slate-400">
          {day}/{cycleLength} өдөр
        </span>
        {phaseKey === "period" ? (
          <>
            <span className="text-sm font-bold text-slate-500 mt-1">Сарын тэмдгийн</span>
            <span className="text-5xl font-black text-slate-700 leading-none">{day}</span>
            <span className="text-sm font-bold text-slate-500">дэх өдөр</span>
          </>
        ) : daysLate > 0 ? (
          <>
            <span className="text-sm font-black text-slate-700 mt-1 leading-tight">Хоцорч байна</span>
            <span className="text-[9px] font-bold text-slate-500 leading-tight">Эхний жилүүдэд ингэх нь хэвийн 💗</span>
          </>
        ) : daysUntil <= 7 ? (
          <>
            <span className="text-xs font-bold text-slate-500 mt-1 leading-tight">Сарын тэмдэг</span>
            <span className="text-2xl font-black text-slate-700 leading-tight">ойртож байна</span>
            <span className="text-[10px] font-bold text-slate-500">хугацаа өөр байж болно</span>
          </>
        ) : (
          <>
            <span className="text-5xl font-black text-slate-700 leading-none mt-1">{day}</span>
            <span className="text-xs font-bold text-slate-500 leading-tight">дэх өдөр</span>
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
