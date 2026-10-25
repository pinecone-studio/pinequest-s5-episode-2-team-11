"use client";

/**
 * Avatar — Bloomy-ийн өөрийн дүр (SVG, давхаргаар зурна).
 *   look    = { hair, top, bottom, shoes, acc }  (lib/wardrobe.js-ийн id-ууд)
 *   skin    = SKIN_TONES-ийн индекс
 *   walking = true бол хөл, гар хөдөлж алхана
 *   idle    = true бол зөөлөн хөвж, нүдээ анивчина
 *   crop    = "x y w h" — зөвхөн тухайн хэсгийг харуулна (дэлгүүрийн жижиг зураг)
 */

import { SKIN_TONES, STARTER_LOOK, itemById } from "../../../lib/wardrobe";

const HIP_L = "52px 138px";
const HIP_R = "68px 138px";
const SHOULDER_L = "40px 100px";
const SHOULDER_R = "80px 100px";

const ANIM = `
.av-walk .av-body{animation:avBob .5s ease-in-out infinite}
.av-walk .av-leg-l,.av-walk .av-arm-r{animation:avSwing .5s ease-in-out infinite alternate}
.av-walk .av-leg-r,.av-walk .av-arm-l{animation:avSwing .5s ease-in-out infinite alternate-reverse}
@keyframes avSwing{from{transform:rotate(-16deg)}to{transform:rotate(16deg)}}
@keyframes avBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
.av-idle .av-body{animation:avFloat 3.2s ease-in-out infinite}
.av-eyes{animation:avBlink 4.5s ease-in-out infinite}
@keyframes avFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes avBlink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
@media (prefers-reduced-motion: reduce){.av-walk *,.av-idle *,.av-eyes{animation:none!important}}
`;

/* ---------------- Үс ---------------- */
function HairBack({ item }) {
  const c = item.color;
  switch (item.kind) {
    case "long":
      return <path d="M22 60 Q20 16 60 15 Q100 16 98 60 L101 124 Q60 134 19 124 Z" fill={c} />;
    case "bob":
      return <path d="M19 62 Q17 15 60 15 Q103 15 101 62 L102 88 Q60 98 18 88 Z" fill={c} />;
    case "buns":
      return (
        <g fill={c}>
          <circle cx="30" cy="24" r="15" />
          <circle cx="90" cy="24" r="15" />
          <path d="M23 60 Q22 18 60 17 Q98 18 97 60 Z" />
        </g>
      );
    case "pony":
      return (
        <g fill={c}>
          <path d="M23 60 Q22 18 60 17 Q98 18 97 60 Z" />
          <ellipse cx="102" cy="62" rx="11" ry="30" transform="rotate(12 102 62)" />
          <circle cx="94" cy="30" r="7" fill="#F48FB1" />
        </g>
      );
    default:
      return null;
  }
}

function HairFront({ item }) {
  const c = item.color;
  if (item.kind === "bob")
    return <path d="M24 60 Q23 20 60 20 Q97 20 96 60 L90 44 Q60 37 30 44 Z" fill={c} />;
  if (item.kind === "long")
    return <path d="M24 60 Q26 21 60 20 Q94 21 96 60 Q86 40 68 37 Q62 47 47 43 Q34 47 24 60 Z" fill={c} />;
  // buns, pony — хажуу тийш самнасан
  return <path d="M24 58 Q25 20 60 20 Q95 20 96 58 Q84 34 58 34 Q38 36 24 58 Z" fill={c} />;
}

/* ---------------- Чимэглэл ---------------- */
// (cx, cy) төвтэй зүрх
const heart = (cx, cy, k = 1) => {
  const p = (dx, dy) => `${cx + dx * k} ${cy + dy * k}`;
  return `M${p(0, 6)} C${p(-9, 0)} ${p(-9, -7)} ${p(-4, -7)} C${p(-2, -8)} ${p(0, -6)} ${p(0, -4)} C${p(0, -6)} ${p(2, -8)} ${p(4, -7)} C${p(9, -7)} ${p(9, 0)} ${p(0, 6)} Z`;
};

function Accessory({ item }) {
  const c = item.color;
  switch (item.kind) {
    case "bow":
      return (
        <g transform="translate(84 22)">
          <path d="M0 0 L-14 -9 L-14 9 Z M0 0 L14 -9 L14 9 Z" fill={c} />
          <circle r="4" fill={c} stroke="#fff" strokeWidth="1.5" />
        </g>
      );
    case "headband":
      return <path d="M25 46 Q60 6 95 46" fill="none" stroke={c} strokeWidth="7" strokeLinecap="round" />;
    case "stars":
      return (
        <g fill={c} stroke="#E8B53A" strokeWidth="1">
          <path d="M33 38 l3 6 6 1 -4.5 4 1 6 -5.5 -3 -5.5 3 1 -6 -4.5 -4 6 -1 Z" />
          <path d="M44 28 l2.4 4.6 5 .8 -3.6 3.4 .8 5 -4.6 -2.4 -4.6 2.4 .8 -5 -3.6 -3.4 5 -.8 Z" />
        </g>
      );
    case "glasses":
      return (
        <g fill={c} opacity=".9">
          <path d={heart(47, 64, 1.3)} />
          <path d={heart(73, 64, 1.3)} />
          <rect x="54" y="62" width="12" height="2.5" rx="1.2" />
        </g>
      );
    case "ears":
      return (
        <g>
          <path d="M28 34 L30 8 L50 24 Z" fill={c} stroke="#E9E4EE" strokeWidth="1.5" />
          <path d="M92 34 L90 8 L70 24 Z" fill={c} stroke="#E9E4EE" strokeWidth="1.5" />
          <path d="M33 28 L34 15 L44 23 Z M87 28 L86 15 L76 23 Z" fill={item.accent} />
        </g>
      );
    default:
      return null;
  }
}

/* ---------------- Хөл (өмд, гутал хамт хөдөлнө) ---------------- */
function Leg({ x, skin, bottom, shoes, className, origin }) {
  const cover = bottom.kind === "pants" || bottom.kind === "joggers" ? 50 : bottom.kind === "shorts" ? 16 : 0;
  return (
    <g className={className} style={{ transformOrigin: origin }}>
      <rect x={x} y="136" width="13" height="52" rx="6" fill={skin} />
      {cover > 0 && <rect x={x - 1} y="134" width="15" height={cover} rx="5" fill={bottom.color} />}
      {bottom.kind === "joggers" && <rect x={x - 1} y="178" width="15" height="6" rx="3" fill={bottom.accent} />}
      {shoes.kind === "boot" ? (
        <g>
          <rect x={x - 2} y="172" width="17" height="20" rx="5" fill={shoes.color} />
          <rect x={x - 3} y="189" width="21" height="6" rx="3" fill={shoes.accent} />
        </g>
      ) : (
        <g>
          <rect x={x - 3} y="184" width="21" height="10" rx="5" fill={shoes.color} stroke="#D9D3E0" strokeWidth="1" />
          <rect x={x - 3} y="191" width="21" height="4" rx="2" fill={shoes.accent} />
        </g>
      )}
    </g>
  );
}

/* ---------------- Гар (ханцуй хамт) ---------------- */
function Arm({ x, skin, top, className, origin }) {
  const long = top.kind !== "tee" && top.kind !== "heart";
  return (
    <g className={className} style={{ transformOrigin: origin }}>
      <rect x={x} y="98" width="11" height="40" rx="5.5" fill={skin} />
      <rect x={x - 1} y="96" width="13" height={long ? 38 : 16} rx="6" fill={top.color} stroke={top.accent} strokeWidth="1" />
      {top.kind === "stripe" &&
        [106, 116, 126].map((y) => <rect key={y} x={x - 1} y={y} width="13" height="3" fill={top.accent} />)}
      <circle cx={x + 5.5} cy="139" r="6" fill={skin} />
    </g>
  );
}

/* ---------------- Бие ---------------- */
function Torso({ top }) {
  return (
    <g>
      {top.kind === "hoodie" && <path d="M38 102 Q60 82 82 102 L78 110 Q60 96 42 110 Z" fill={top.accent} />}
      <rect x="38" y="95" width="44" height="45" rx="12" fill={top.color} stroke={top.accent} strokeWidth="1.2" />
      {top.kind === "stripe" &&
        [106, 116, 126].map((y) => <rect key={y} x="38.6" y={y} width="42.8" height="3" fill={top.accent} />)}
      {top.kind === "heart" && (
        <path d="M60 126 C50 119 49 111 54 110 C57 109 60 112 60 114 C60 112 63 109 66 110 C71 111 70 119 60 126 Z" fill={top.accent} />
      )}
      {top.kind === "hoodie" && (
        <g>
          <rect x="47" y="122" width="26" height="12" rx="5" fill={top.accent} opacity=".6" />
          <path d="M55 100 L54 114 M65 100 L66 114" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
    </g>
  );
}

function Waist({ bottom }) {
  if (bottom.kind === "skirt")
    return (
      <g>
        <path d="M39 132 L81 132 L88 158 Q60 164 32 158 Z" fill={bottom.color} />
        <path d="M48 134 L45 158 M60 134 L60 161 M72 134 L75 158" stroke={bottom.accent} strokeWidth="1.5" opacity=".6" />
      </g>
    );
  return <rect x="38" y="131" width="44" height="14" rx="5" fill={bottom.color} />;
}

export default function Avatar({
  look = STARTER_LOOK,
  skin = 0,
  walking = false,
  idle = false,
  label = "Миний дүр",
  crop = "0 0 120 200",
  size = 120,
  className = "",
}) {
  const [, , cw, ch] = crop.split(" ").map(Number);
  const get = (slot) => itemById(look?.[slot]) ?? itemById(STARTER_LOOK[slot]);
  const hair = get("hair");
  const top = get("top");
  const bottom = get("bottom");
  const shoes = get("shoes");
  const acc = get("acc");
  const s = SKIN_TONES[skin] ?? SKIN_TONES[0];

  return (
    <svg
      viewBox={crop}
      width={size}
      height={(size * ch) / cw}
      className={`${walking ? "av-walk" : idle ? "av-idle" : ""} ${className}`}
      role="img"
      aria-label={label}
    >
      <style>{ANIM}</style>
      <g className="av-body">
        <HairBack item={hair} />
        <Leg x={46} skin={s} bottom={bottom} shoes={shoes} className="av-leg-l" origin={HIP_L} />
        <Leg x={61} skin={s} bottom={bottom} shoes={shoes} className="av-leg-r" origin={HIP_R} />
        <Waist bottom={bottom} />
        <rect x="54" y="86" width="12" height="12" rx="4" fill={s} />
        <Arm x={29} skin={s} top={top} className="av-arm-l" origin={SHOULDER_L} />
        <Arm x={80} skin={s} top={top} className="av-arm-r" origin={SHOULDER_R} />
        <Torso top={top} />
        {/* толгой */}
        <ellipse cx="60" cy="58" rx="35" ry="36" fill={s} />
        <ellipse cx="25" cy="62" rx="5" ry="7" fill={s} />
        <ellipse cx="95" cy="62" rx="5" ry="7" fill={s} />
        {/* нүүр */}
        <g className="av-eyes" style={{ transformOrigin: "60px 64px" }}>
          <ellipse cx="47" cy="64" rx="3.6" ry="4.6" fill="#2B2230" />
          <ellipse cx="73" cy="64" rx="3.6" ry="4.6" fill="#2B2230" />
          <circle cx="48.3" cy="62.4" r="1.2" fill="#fff" />
          <circle cx="74.3" cy="62.4" r="1.2" fill="#fff" />
        </g>
        <ellipse cx="40" cy="74" rx="5" ry="3" fill="#F48FB1" opacity=".45" />
        <ellipse cx="80" cy="74" rx="5" ry="3" fill="#F48FB1" opacity=".45" />
        <path d="M55 76 Q60 81 65 76" fill="none" stroke="#2B2230" strokeWidth="2" strokeLinecap="round" />
        <HairFront item={hair} />
        <Accessory item={acc} />
      </g>
    </svg>
  );
}
