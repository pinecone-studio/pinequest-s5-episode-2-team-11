// «Хэрэглэлийн заавар»-ын алхам бүрийн энгийн SVG зураг. k = lib/padGuide.js доторх ill.

const PINK = "#F48FB1";
const ROSE = "#E0679F";
const LAV = "#B794F4";
const LAV_LIGHT = "#E9DDFC";
const BLUSH = "#FDE7F1";
const RED = "#F06292";
const sw = { strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" };

function Pad({ x, y, w, h }) {
  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx={w / 2} fill="#fff" stroke={PINK} {...sw} />
      <rect x={x + w * 0.22} y={y + h * 0.16} width={w * 0.56} height={h * 0.68} rx={w * 0.28} fill={BLUSH} />
    </>
  );
}

const Undies = () => (
  <path d="M38 26 H162 V42 Q132 50 118 116 H82 Q68 50 38 42 Z" fill="#fff" stroke={LAV} {...sw} />
);

const Label = ({ x, y, children }) => (
  <text
    x={x}
    y={y}
    textAnchor="middle"
    fontSize={12}
    fontWeight={800}
    fill="#64748B"
    fontFamily="Nunito, sans-serif"
  >
    {children}
  </text>
);

const Cross = ({ cx, cy }) => (
  <>
    <circle cx={cx} cy={cy} r={14} fill={RED} />
    <path
      d={`M${cx - 6} ${cy - 6} L${cx + 6} ${cy + 6} M${cx + 6} ${cy - 6} L${cx - 6} ${cy + 6}`}
      stroke="#fff"
      strokeWidth={3.5}
      strokeLinecap="round"
    />
  </>
);

const Tick = ({ cx, cy }) => (
  <>
    <circle cx={cx} cy={cy} r={14} fill={ROSE} />
    <path
      d={`M${cx - 6} ${cy} L${cx - 1} ${cy + 5} L${cx + 7} ${cy - 5}`}
      fill="none"
      stroke="#fff"
      strokeWidth={3.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </>
);

const PARTS = {
  choose: (
    <>
      <Pad x={76} y={20} w={48} h={96} />
      <circle cx={56} cy={42} r={4} fill={PINK} />
      <circle cx={146} cy={91} r={4} fill={LAV} />
    </>
  ),
  dayPad: (
    <>
      <Pad x={60} y={24} w={48} h={96} />
      <line x1={118} y1={24} x2={118} y2={120} stroke="#B83B7E" strokeWidth={2} strokeLinecap="round" />
      <line x1={114} y1={24} x2={122} y2={24} stroke="#B83B7E" strokeWidth={2} strokeLinecap="round" />
      <line x1={114} y1={120} x2={122} y2={120} stroke="#B83B7E" strokeWidth={2} strokeLinecap="round" />
      <text x={134} y={72} textAnchor="middle" fontSize={10} fontWeight={800} fill="#B83B7E" fontFamily="Nunito, sans-serif" transform="rotate(-90 134 72)">
        20–25 см
      </text>
    </>
  ),
  nightPad: (
    <>
      <Pad x={54} y={18} w={60} h={108} />
      <line x1={124} y1={18} x2={124} y2={126} stroke="#705ACB" strokeWidth={2} strokeLinecap="round" />
      <line x1={120} y1={18} x2={128} y2={18} stroke="#705ACB" strokeWidth={2} strokeLinecap="round" />
      <line x1={120} y1={126} x2={128} y2={126} stroke="#705ACB" strokeWidth={2} strokeLinecap="round" />
      <text x={140} y={72} textAnchor="middle" fontSize={10} fontWeight={800} fill="#705ACB" fontFamily="Nunito, sans-serif" transform="rotate(-90 140 72)">
        25–30 см
      </text>
    </>
  ),
  wash: (
    <>
      <path
        d="M60 30 H118 Q132 30 132 44 V54"
        fill="none"
        stroke={LAV}
        strokeWidth={10}
        strokeLinecap="round"
      />
      <rect x={50} y={22} width={20} height={18} rx={6} fill={LAV} />
      {[0, 1, 2].map((i) => (
        <ellipse key={i} cx={132 + (i - 1) * 7} cy={70 + i * 14} rx={3.5} ry={6} fill="#A5C8F5" />
      ))}
      <rect x={34} y={92} width={56} height={30} rx={10} fill={PINK} />
      <rect x={44} y={100} width={36} height={6} rx={3} fill="#fff" opacity={0.6} />
      {[
        [52, 84, 7],
        [68, 78, 5],
        [82, 86, 6],
        [100, 96, 8],
        [160, 100, 6],
      ].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="#fff" stroke={LAV_LIGHT} strokeWidth={2.5} />
      ))}
    </>
  ),
  alert: (
    <>
      <path d="M100 18 L170 124 H30 Z" fill="#FFF0D5" stroke="#E9B45A" strokeWidth={4} strokeLinejoin="round" />
      <path d="M100 52 V84" stroke="#A86113" strokeWidth={8} strokeLinecap="round" />
      <circle cx={100} cy={103} r={4.5} fill="#A86113" />
    </>
  ),
  open: (
    <>
      <Pad x={56} y={28} w={52} h={92} />
      <rect
        x={112}
        y={40}
        width={22}
        height={80}
        rx={8}
        fill={LAV_LIGHT}
        stroke={LAV}
        strokeWidth={2.5}
        transform="rotate(18 123 80)"
      />
      <path d="M150 60 Q166 44 160 26 M160 26 L152 32 M160 26 L166 34" fill="none" stroke={ROSE} {...sw} />
    </>
  ),
  place: (
    <>
      <Undies />
      <Pad x={87} y={46} w={26} h={64} />
      <path d="M100 8 V30 M92 22 L100 30 L108 22" fill="none" stroke={ROSE} {...sw} />
    </>
  ),
  wings: (
    <>
      <Undies />
      <ellipse cx={82} cy={80} rx={12} ry={9} fill="#fff" stroke={PINK} strokeWidth={3} />
      <ellipse cx={118} cy={80} rx={12} ry={9} fill="#fff" stroke={PINK} strokeWidth={3} />
      <Pad x={87} y={46} w={26} h={64} />
      <path d="M66 70 Q54 82 66 96" fill="none" stroke={ROSE} {...sw} />
      <path d="M134 70 Q146 82 134 96" fill="none" stroke={ROSE} {...sw} />
    </>
  ),
  clock: (
    <>
      <circle cx={100} cy={68} r={46} fill="#fff" stroke={LAV} strokeWidth={4} />
      {[0, 1, 2, 3].map((i) => {
        const an = (i * Math.PI) / 2;
        return <circle key={i} cx={100 + 36 * Math.sin(an)} cy={68 - 36 * Math.cos(an)} r={3} fill={LAV} />;
      })}
      <path d="M100 68 V42 M100 68 L120 78" stroke={ROSE} strokeWidth={4} strokeLinecap="round" />
      <path
        d="M100 22 A46 46 0 0 1 146 68"
        fill="none"
        stroke={PINK}
        strokeWidth={8}
        strokeLinecap="round"
        opacity={0.55}
      />
      <Label x={100} y={134}>
        3–4 цаг
      </Label>
    </>
  ),
  roll: (
    <>
      <circle cx={100} cy={70} r={40} fill="#fff" stroke={PINK} strokeWidth={3} />
      <path
        d="M100 70 m0 -8 a8 8 0 1 1 -8 8 a16 16 0 1 1 16 16 a24 24 0 1 1 -24 -24"
        fill="none"
        stroke={PINK}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path d="M40 40 Q30 70 46 98 M46 98 L38 92 M46 98 L48 88" fill="none" stroke={ROSE} {...sw} />
    </>
  ),
  wrap: (
    <>
      <rect x={56} y={34} width={88} height={72} rx={18} fill={LAV_LIGHT} stroke={LAV} strokeWidth={3} />
      <path d="M56 70 Q100 52 144 70" fill="none" stroke={LAV} strokeWidth={3} />
      <path d="M100 34 V106" stroke="#fff" strokeWidth={4} opacity={0.8} />
      <path d="M100 92 C88 82 92 72 100 78 C108 72 112 82 100 92 Z" fill={PINK} />
    </>
  ),
  bin: (
    <>
      <rect x={30} y={46} width={54} height={72} rx={10} fill={LAV_LIGHT} stroke={LAV} strokeWidth={3} />
      <rect x={24} y={36} width={66} height={12} rx={6} fill={LAV} />
      <path d="M46 62 V104 M57 62 V104 M68 62 V104" stroke="#fff" strokeWidth={3} strokeLinecap="round" />
      <Tick cx={84} cy={36} />
      <rect x={128} y={44} width={40} height={24} rx={6} fill="#fff" stroke="#CBD5E1" strokeWidth={3} />
      <path
        d="M118 70 H178 Q176 100 156 104 L160 118 H136 L140 104 Q120 100 118 70 Z"
        fill="#fff"
        stroke="#CBD5E1"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Cross cx={176} cy={40} />
    </>
  ),
  pouch: (
    <>
      <path
        d="M54 52 H146 L138 118 Q136 124 128 124 H72 Q64 124 62 118 Z"
        fill={LAV_LIGHT}
        stroke={LAV}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path d="M54 52 Q100 40 146 52" fill="none" stroke={LAV} strokeWidth={3} />
      <path
        d="M82 50 Q82 22 100 22 Q118 22 118 50"
        fill="none"
        stroke={LAV}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <path d="M100 100 C86 88 90 76 100 83 C110 76 114 88 100 100 Z" fill={PINK} />
    </>
  ),
};

export default function PadIllustration({ k }) {
  if (k === "wrapped") {
    return <div className="wrapped-pad-art"><img src="/assets/pad-wrapped.svg" alt="Задлаагүй хэрэглэл" /></div>;
  }

  return (
    <svg viewBox="0 0 200 140" className="w-full h-full" role="img" aria-hidden="true">
      <circle cx={100} cy={72} r={66} fill={BLUSH} opacity={0.7} />
      {PARTS[k]}
    </svg>
  );
}
