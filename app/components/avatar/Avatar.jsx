"use client";

/**
 * Avatar — Bloomy-ийн пиксел дүр (SVG, 4px-ийн торон дээр давхаргаар зурна).
 *   look    = { hair, top, bottom, shoes, acc }  (lib/wardrobe.js-ийн id-ууд)
 *   skin    = SKIN_TONES-ийн индекс
 *   mood    = өнөөдрийн сэтгэл санаа (1–5) → царайны илэрхийлэл; null бол энгийн инээмсэглэл
 *   walking = true бол хөл, гар хөдөлж алхана
 *   idle    = true бол зөөлөн хөвж, нүдээ анивчина
 *   crop    = "x y w h" — зөвхөн тухайн хэсгийг харуулна (дэлгүүрийн жижиг зураг)
 */

import { SKIN_TONES, STARTER_LOOK, itemById } from "../../../lib/wardrobe";
import { t } from "../../../lib/i18n";

// Нэг пиксел = 4 нэгж → viewBox 120×200 нь 30×50 пикселийн тор.
// Дүрийг бүхэлд нь OFF мөрөөр доош шилжүүлж төвд байрлуулна.
const U = 4;
const OFF = 3;
const HIP_L = "48px 144px";
const HIP_R = "72px 144px";
const SHOULDER_L = "36px 108px";
const SHOULDER_R = "84px 108px";

const ANIM = `
.av-walk .av-body{animation:avBob .5s steps(2) infinite}
.av-walk .av-leg-l,.av-walk .av-arm-r{animation:avSwing .5s ease-in-out infinite alternate}
.av-walk .av-leg-r,.av-walk .av-arm-l{animation:avSwing .5s ease-in-out infinite alternate-reverse}
@keyframes avSwing{from{transform:rotate(-14deg)}to{transform:rotate(14deg)}}
@keyframes avBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.av-idle .av-body{animation:avFloat 3.2s steps(4) infinite}
.av-eyes{animation:avBlink 4.5s ease-in-out infinite}
@keyframes avFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes avBlink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
@media (prefers-reduced-motion: reduce){.av-walk *,.av-idle *,.av-eyes{animation:none!important}}
`;

/* ---------------- Пикселийн туслахууд ---------------- */
// Өнгийг бараан (k < 0) эсвэл цайвар (k > 0) болгоно
const shade = (hex, k) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k);
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
};

// rows = [[y, x0, x1], ...] мөрүүд; line өгвөл 1 пикселийн хүрээтэй зурна
function Px({ rows, fill, line, opacity }) {
  return (
    <g opacity={opacity}>
      {line &&
        rows.map(([y, a, b], i) => (
          <rect key={`l${i}`} x={(a - 1) * U} y={(y + OFF - 1) * U} width={(b - a + 3) * U} height={3 * U} fill={line} />
        ))}
      {rows.map(([y, a, b], i) => (
        <rect key={i} x={a * U} y={(y + OFF) * U} width={(b - a + 1) * U} height={U} fill={fill} />
      ))}
    </g>
  );
}

// Нүд, ам зэрэг нарийн хэсгийг 2 нэгжийн жижиг пикселээр зурна.
// map = мөр бүр тэмдэгт, colors = { тэмдэгт: өнгө }, flip = хэвтээ толин тусгал
const F = 2;
function Sprite({ map, x, y, colors, flip = false, opacity }) {
  const w = map[0].length;
  return (
    <g opacity={opacity}>
      {map.flatMap((row, j) =>
        [...row].map(
          (ch, i) =>
            colors[ch] && (
              <rect key={`${i}-${j}`} x={(x + (flip ? w - 1 - i : i)) * F} y={(y + j) * F + OFF * U} width={F} height={F} fill={colors[ch]} />
            ),
        ),
      )}
    </g>
  );
}

const block = (y0, y1, a, b) => Array.from({ length: y1 - y0 + 1 }, (_, i) => [y0 + i, a, b]);
// Төв тэнхлэгээр (14.5) толин тусгал хийж хоёр талыг нь гаргана
const both = (rows) => [...rows, ...rows.map(([y, a, b]) => [y, 29 - b, 29 - a])];
// Долгионтой үс: 2 мөр тутамд 1 пиксел шилжинэ
const wave = (y) => Math.floor(y / 2) % 2;

/* ---------------- Үс ---------------- */
const DOME = [[2, 12, 17], [3, 9, 20], [4, 7, 22], [5, 6, 23], [6, 6, 23]];
// Үзүүртэй, бага зэрэг хажуу тийш эргэсэн үсний зулай
const BANGS = [
  ...DOME,
  [7, 6, 23],
  [8, 6, 23],
  [9, 6, 11], [9, 13, 17], [9, 19, 23],
  [10, 6, 10], [10, 14, 16], [10, 20, 23],
  [11, 6, 8], [11, 15, 15], [11, 21, 23],
];
// Долгионтой хажуу үс, доод үзүүр нь шовх болж нарийсна
const locks = (y0, y1) =>
  both([
    ...Array.from({ length: y1 - y0 + 1 }, (_, i) => [y0 + i, 4 + wave(y0 + i), 6 + wave(y0 + i)]),
    [y1 + 1, 5 + wave(y1 + 1), 6 + wave(y1 + 1)],
    [y1 + 2, 5 + wave(y1 + 2), 5 + wave(y1 + 2)],
  ]);
// Урт үс доошоо бага зэрэг дэлгэрч, үзүүр нь хэдэн салаа болно
const LONG_BACK = [
  ...DOME,
  ...Array.from({ length: 24 }, (_, i) => {
    const y = 7 + i;
    const flare = y > 21 ? 1 : 0;
    return [y, 4 + wave(y) - flare, 25 - wave(y) + flare];
  }),
  ...both([[31, 3, 9], [32, 3, 5], [32, 7, 9], [33, 4, 4], [33, 8, 8]]),
  [31, 10, 19],
];
const LONG_STRANDS = both(Array.from({ length: 15 }, (_, i) => [15 + i, 7 + wave(15 + i), 7 + wave(15 + i)]));

function HairBack({ item }) {
  const c = shade(item.color, -0.12);
  const line = shade(item.color, -0.45);
  const dark = shade(item.color, -0.28);
  const light = shade(item.color, 0.22);
  switch (item.kind) {
    case "long":
      return (
        <g>
          <Px rows={LONG_BACK} fill={c} line={line} />
          <Px rows={LONG_STRANDS} fill={dark} />
          <Px rows={both([[31, 4, 4], [30, 5, 5]])} fill={light} />
        </g>
      );
    case "bob":
      return (
        <g>
          <Px rows={[...DOME, ...block(7, 17, 5, 24), ...block(18, 20, 4, 25), [21, 5, 24]]} fill={c} line={line} />
          <Px rows={both([[19, 5, 6], [20, 6, 7]])} fill={light} />
        </g>
      );
    case "buns":
      return (
        <g>
          <Px
            rows={[...DOME, ...block(7, 13, 5, 24), ...both([[0, 6, 8], [1, 5, 9], [2, 5, 9], [3, 6, 8]])]}
            fill={c}
            line={line}
          />
          {/* боодлын эргэлт ба гялбаа */}
          <Px rows={both([[2, 8, 9], [3, 7, 8]])} fill={dark} />
          <Px rows={both([[1, 6, 6], [0, 7, 7]])} fill={light} />
        </g>
      );
    case "pony": {
      // сүүл дундаа өргөн, доошоо шовх болж нарийсна
      const tail = Array.from({ length: 23 }, (_, i) => {
        const y = 6 + i;
        const w = wave(y);
        return [y, 23 + w, (i < 14 ? 26 : i < 19 ? 25 : 24) + w];
      });
      return (
        <g>
          <Px rows={[...DOME, ...block(7, 14, 5, 24), ...tail, [29, 24, 24]]} fill={c} line={line} />
          <Px rows={tail.slice(3, 18).map(([y, a]) => [y, a + 1, a + 1])} fill={dark} />
          <Px rows={tail.slice(3, 12).map(([y, a]) => [y, a, a])} fill={light} />
          <Px rows={[[6, 23, 25], [7, 23, 25]]} fill="#F48FB1" line="#D86A93" />
        </g>
      );
    }
    default:
      return null;
  }
}

function HairFront({ item }) {
  const c = item.color;
  const sides =
    item.kind === "long"
      ? locks(12, 22)
      : item.kind === "bob"
        ? both([...block(12, 19, 5, 7), [20, 5, 8], [21, 6, 8]])
        : locks(12, 15);
  return (
    <g>
      <Px rows={[...BANGS, ...sides]} fill={c} line={shade(c, -0.45)} />
      {/* нүүр талын сүүдэр, үсний ширхэг */}
      <Px rows={sides.map(([y, a, b]) => (a < 15 ? [y, b, b] : [y, a, a]))} fill={shade(c, -0.16)} />
      <Px
        rows={[[6, 14, 14], [7, 13, 13], [8, 12, 12], [7, 17, 17], [8, 18, 18], [8, 8, 8], [9, 7, 7], [8, 21, 21], [9, 22, 22]]}
        fill={shade(c, -0.22)}
      />
      {/* гялбаа (анимэ маягийн цагираг) */}
      <Px rows={[[4, 10, 11], [4, 18, 19], [5, 8, 12], [5, 17, 21], [6, 7, 7], [6, 22, 22]]} fill={shade(c, 0.32)} />
      <Sprite map={["WWW.", ".WW."]} x={18} y={10} colors={{ W: shade(c, 0.62) }} />
      <Sprite map={[".WWW", ".WW."]} x={37} y={10} colors={{ W: shade(c, 0.62) }} />
      <Px rows={[[9, 15, 15], [10, 15, 15]]} fill={shade(c, 0.18)} />
    </g>
  );
}

/* ---------------- Нүүр ---------------- */
const FACE = [[6, 9, 20], [7, 8, 21], ...block(8, 18, 7, 22), [19, 8, 21], [20, 9, 20], [21, 11, 18]];

// Зүүн нүд (баруун нь толин тусгал): L сормуус, D/M/B хүүхэн хараа (бараан → цайвар), W гялбаа
const EYE_MAP = [
  "LLLLLLL.",
  ".LLLLLLL",
  ".DDDDDDD",
  ".DWWDDDD",
  ".DWWMMMD",
  ".DMMMMMD",
  ".DMMMBMD",
  ".DBBBBWD",
  "..BBBBB.",
  "...MMM..",
];
const eyeColors = (eye) => ({
  L: "#2E2228",
  D: shade(eye, -0.5),
  M: eye,
  B: shade(eye, 0.45),
  W: "#FFFFFF",
});
const BLUSH_MAP = ["..PPPP..", ".PWPPPP.", "..PPPP.."];
const MOUTH_MAP = ["M..M", ".MM."];

// Сэтгэл санааны царай (lib/log-entries MOODS: 5 маш сайхан … 1 хэцүү).
// eyes = нүдний зураг, brow = хөмсөг (заавал биш), mouth, blush = хацрын тод байдал
const HAPPY_EYE = ["........", "........", "........", "..LLLL..", ".LL..LL.", ".L....L.", "........", "........", "........", "........"];
const SQUEEZE_EYE = ["........", "........", ".LL.....", "...LL...", ".....LL.", "...LL...", ".LL.....", "........", "........", "........"];
const MOOD_FACES = {
  5: { eyes: HAPPY_EYE, mouth: ["MMMM", "MTTM", ".MM."], blush: 0.95 },
  4: { eyes: EYE_MAP, mouth: MOUTH_MAP, blush: 0.75 },
  3: { eyes: EYE_MAP, mouth: [".MM."], blush: 0.4 },
  2: { eyes: EYE_MAP, brow: ["....LL", "LLLL.."], mouth: [".MM.", "M..M"], blush: 0.35 },
  1: { eyes: SQUEEZE_EYE, brow: ["....LL", "LLLL.."], mouth: [".MM.", "M..M"], blush: 0.5, sweat: true },
};

function Face({ skin, eye, mood }) {
  const colors = eyeColors(eye);
  const f = MOOD_FACES[mood] ?? MOOD_FACES[4];
  return (
    <g>
      {/* хацрын бүдэг сүүдэр */}
      <Px rows={[[20, 10, 19]]} fill={shade(skin, -0.06)} />
      <g className="av-eyes" style={{ transformOrigin: `60px ${(14 + OFF) * U}px` }}>
        <Sprite map={f.eyes} x={15} y={24} colors={colors} />
        <Sprite map={f.eyes} x={37} y={24} colors={colors} flip />
      </g>
      {f.brow && (
        <>
          <Sprite map={f.brow} x={16} y={22} colors={{ L: "#2E2228" }} />
          <Sprite map={f.brow} x={38} y={22} colors={{ L: "#2E2228" }} flip />
        </>
      )}
      <Sprite map={BLUSH_MAP} x={13} y={34} colors={{ P: "#F59DB2", W: "#FFFFFF" }} opacity={f.blush} />
      <Sprite map={BLUSH_MAP} x={39} y={34} colors={{ P: "#F59DB2", W: "#FFFFFF" }} opacity={f.blush} flip />
      <Sprite map={f.mouth} x={28} y={38} colors={{ M: "#C25A6A", T: "#F48FB1" }} />
      {f.sweat && <Sprite map={[".S.", "SSS", "SWS", ".S."]} x={44} y={28} colors={{ S: "#8EC9F5", W: "#FFFFFF" }} />}
    </g>
  );
}

/* ---------------- Чимэглэл ---------------- */
const heartRows = (a, y = 12) => [
  [y, a, a + 1], [y, a + 3, a + 4], [y + 1, a, a + 4], [y + 2, a, a + 4], [y + 3, a + 1, a + 3], [y + 4, a + 2, a + 2],
];
const star = (x, y) => [[y - 1, x, x], [y, x - 1, x + 1], [y + 1, x, x]];

// Үсний хавчаар (2 нэгжийн пиксел): L хүрээ, C өнгө, "." нүх — үс харагдана
const CLIP_MAP = ["LLLLLLLL..", "LCCCCCCCL.", "LC.....CCL", "LCCCCCCCCL", ".LLLLLLLL."];
// Хавчаарын зүүн үзүүрт суух дүрс: L хүрээ, K нүд, W үр, P хамар, G/M accent
const CLIP_MOTIFS = {
  heart: [".LL.LL.", "LCCLCCL", "LCCCCCL", ".LCCCL.", "..LCL..", "...L..."],
  star: ["...L...", "..LCL..", "LLLCLLL", "LCCCCCL", ".LCCCL.", "LCLLLCL", "LL...LL"],
  strawberry: ["..GG..", ".LGGL.", "LCCCCL", "LCWCWL", "LCCCCL", ".LCWL.", "..LL.."],
  cat: ["L.....L", "LL...LL", "LCLLLCL", "LCCCCCL", "LCKCKCL", "LCCPCCL", ".LCCCL.", "..LLL.."],
  bear: ["LL...LL", "LCLLLCL", "LCCCCCL", "LCKCKCL", "LCCMCCL", ".LCCCL.", "..LLL.."],
};

function Accessory({ item }) {
  const c = item.color;
  const a = item.accent ?? shade(c, -0.2);
  const line = shade(c, -0.4);
  switch (item.kind) {
    case "bow":
      return (
        <g>
          <Px rows={[[3, 19, 20], [3, 23, 24], [4, 19, 24], [5, 19, 20], [5, 23, 24]]} fill={c} line={line} />
          <Px rows={[[4, 21, 22]]} fill={shade(c, -0.2)} />
        </g>
      );
    case "headband":
      return <Px rows={[[4, 9, 20], [5, 7, 8], [5, 21, 22], [6, 6, 6], [6, 23, 23]]} fill={c} line={line} />;
    case "stars":
      return <Px rows={[...star(8, 7), ...star(11, 5)]} fill={c} line="#E8B53A" />;
    case "glasses":
      return (
        <g opacity={0.88}>
          <Px rows={[...heartRows(8), ...heartRows(17)]} fill={c} line={line} />
          <Px rows={[[13, 13, 16]]} fill={line} />
        </g>
      );
    case "ears":
      return (
        <g>
          <Px rows={both([[0, 7, 7], [1, 7, 8], [2, 7, 9], [3, 7, 10]])} fill={c} line="#CFC8D8" />
          <Px rows={both([[2, 8, 8], [3, 8, 9]])} fill={a} />
        </g>
      );
    case "headphones":
      return (
        <g>
          <Px rows={[[2, 9, 20], [3, 7, 22], ...both([[4, 6, 7], ...block(5, 8, 5, 6)])]} fill={c} line={line} />
          <Px rows={both(block(9, 16, 3, 6))} fill={c} line={line} />
          <Px rows={both(block(11, 14, 4, 5))} fill={a} />
        </g>
      );
    case "beret":
      return (
        <g>
          <Px rows={[[0, 14, 15], [1, 9, 20], [2, 6, 23], [3, 5, 24], [4, 5, 24], [5, 7, 22]]} fill={c} line={line} />
          <Px rows={[[5, 7, 22]]} fill={a} />
          <Px rows={[[2, 9, 11]]} fill={shade(c, 0.3)} />
        </g>
      );
    case "clip": {
      const motif = CLIP_MOTIFS[item.motif];
      const bar = motif ? shade(c, 0.55) : c;
      return (
        <g>
          <Sprite map={CLIP_MAP} x={38} y={12} colors={{ L: line, C: bar }} />
          {motif ? (
            <Sprite
              map={motif}
              x={33}
              y={9}
              colors={{ L: line, C: c, G: a, M: a, K: "#2E2228", W: "#FFF4D6", P: "#F48FB1" }}
            />
          ) : (
            <Sprite map={CLIP_MAP} x={39} y={17} colors={{ L: shade(a, -0.4), C: a }} />
          )}
        </g>
      );
    }
    case "sprout":
      return (
        <g>
          <Px rows={[[1, 14, 14], [2, 14, 14]]} fill={a} />
          <Px rows={[[0, 11, 13], [1, 12, 13], [0, 16, 18], [1, 16, 17]]} fill={c} line={line} />
        </g>
      );
    default:
      return null;
  }
}

/* ---------------- Хөл (өмд, гутал хамт хөдөлнө) ---------------- */
const COVER = { pants: 41, joggers: 41, shorts: 35, ripped: 41, cargo: 41, overalls: 41 };

function Shoe({ x, shoes, skin, skinLine }) {
  const { color: c, accent: a } = shoes;
  const line = shade(c, -0.3);
  const sole = [[43, x - 1, x + 2]];
  const foot = [[42, x - 1, x + 2], ...sole];
  switch (shoes.kind) {
    case "boot":
      return (
        <g>
          <Px rows={[...block(38, 41, x, x + 1), ...foot]} fill={c} line={shade(c, -0.35)} />
          <Px rows={sole} fill={a} />
        </g>
      );
    case "hightop":
      return (
        <g>
          <Px rows={[...block(39, 41, x, x + 1), ...foot]} fill={c} line={shade(c, -0.35)} />
          <Px rows={[...sole, [40, x, x + 1]]} fill={a} />
          <Px rows={[[42, x - 1, x - 1]]} fill={a} />
        </g>
      );
    case "chunky":
      return (
        <g>
          <Px rows={[[41, x - 1, x + 2], ...foot]} fill={c} line={line} />
          <Px rows={sole} fill={a} />
          <Px rows={[[41, x, x]]} fill="#FFFFFF" />
        </g>
      );
    case "slipper": {
      const ears = [[39, x - 1, x - 1], [40, x - 1, x - 1], [39, x + 2, x + 2], [40, x + 2, x + 2]];
      return (
        <g>
          <Px rows={[...ears, [41, x - 1, x + 2], ...foot]} fill={c} line={shade(c, -0.25)} />
          <Px rows={[[40, x - 1, x - 1], [40, x + 2, x + 2]]} fill={a} />
          <Sprite map={["K..K", ".PP."]} x={x * 2} y={83} colors={{ K: "#2E2228", P: a }} />
        </g>
      );
    }
    case "sandal":
      return (
        <g>
          <Px rows={foot} fill={skin} line={skinLine} />
          <Px rows={sole} fill={c} />
          <Px rows={[[40, x, x + 1], [42, x, x]]} fill={c} />
          <Px rows={[[43, x - 1, x + 2]]} fill={a} opacity={0.5} />
        </g>
      );
    default:
      return (
        <g>
          <Px rows={foot} fill={c} line={line} />
          {shoes.kind === "mary" ? <Px rows={[[42, x, x]]} fill={shade(c, 0.35)} /> : <Px rows={sole} fill={a} />}
        </g>
      );
  }
}

function Leg({ x, skin, skinLine, bottom, shoes, className, origin }) {
  const cover = COVER[bottom.kind];
  return (
    <g className={className} style={{ transformOrigin: origin }}>
      <Px rows={block(33, 41, x, x + 1)} fill={skin} line={skinLine} />
      {cover && <Px rows={block(33, cover, x, x + 1)} fill={bottom.color} line={shade(bottom.color, -0.3)} />}
      {bottom.kind === "joggers" && <Px rows={[[41, x, x + 1]]} fill={bottom.accent} />}
      {bottom.kind === "ripped" && (
        <g>
          <Px rows={[[37, x, x + 1]]} fill={skin} />
          <Px rows={[[36, x, x + 1], [38, x + 1, x + 1]]} fill={shade(bottom.color, 0.45)} />
        </g>
      )}
      {bottom.kind === "cargo" && <Px rows={[[36, x, x + 1], [37, x, x + 1], [41, x, x + 1]]} fill={bottom.accent} />}
      {shoes.kind === "mary" && <Px rows={block(37, 41, x, x + 1)} fill={shoes.accent} line={shade(shoes.accent, -0.25)} />}
      <Shoe x={x} shoes={shoes} skin={skin} skinLine={skinLine} />
    </g>
  );
}

/* ---------------- Гар (ханцуй хамт) ---------------- */
const SHORT_SLEEVE = ["tee", "heart", "pinafore"];
const TIEDYE = ["#F48FB1", "#8FB8F0", "#7CC46A", "#B794F4"];

function Arm({ x, skin, skinLine, top, className, origin }) {
  const end = SHORT_SLEEVE.includes(top.kind) ? 26 : 30;
  const sleeve = top.kind === "collar" || top.kind === "pinafore" ? top.accent : top.color;
  return (
    <g className={className} style={{ transformOrigin: origin }}>
      <Px rows={block(24, 32, x, x + 1)} fill={skin} line={skinLine} />
      <Px rows={block(24, end, x, x + 1)} fill={sleeve} line={shade(sleeve, -0.3)} />
      {top.kind === "stripe" && <Px rows={[[25, x, x + 1], [27, x, x + 1], [29, x, x + 1]]} fill={top.accent} />}
      {(top.kind === "long" || top.kind === "hoodie") && <Px rows={[[30, x, x + 1]]} fill={top.accent} />}
      {top.kind === "sweat" && <Px rows={[[30, x, x + 1]]} fill={shade(top.color, -0.12)} />}
      {top.kind === "plaid" && <Px rows={[[26, x, x + 1], [29, x, x + 1]]} fill={top.accent} />}
      {top.kind === "tiedye" && [25, 27, 29].map((y, i) => <Px key={y} rows={[[y, x, x + 1]]} fill={TIEDYE[i]} />)}
      {/* ханцуйн хүрээ гарыг дарсан тул гарыг дахин зурна */}
      <Px rows={block(end + 2, 32, x, x + 1)} fill={skin} />
    </g>
  );
}

/* ---------------- Бие ---------------- */
const TORSO = [[23, 12, 17], ...block(24, 31, 11, 18)];

// Цээжний зураг (2 нэгжийн пиксел): A/P accent, K бараан, Y шар, H зүрх, R/G/W гүзээлзгэнэ
const TOP_MOTIFS = {
  butterfly: ["AA....AA", "AAA..AAA", "AAAKKAAA", ".AAKKAA.", "AAAKKAAA", "AA.KK.AA"],
  flower: [".PP.PP.", "PPPPPPP", ".PPYPP.", "PPPPPPP", ".PP.PP."],
  smile: [".YYYY.", "YKYYKY", "YYYYYY", "YKYYKY", "YYKKYY", ".YYYY."],
  heart: [".HH.HH.", "HHHHHHH", "HHHHHHH", ".HHHHH.", "..HHH..", "...H..."],
  strawberry: ["..GG..", ".RRRR.", "RRWRRR", "RRRRWR", ".RRRR.", "..RR.."],
};

function TopMotif({ name, accent }) {
  const map = TOP_MOTIFS[name];
  if (!map) return null;
  const colors = {
    A: accent,
    P: accent,
    K: name === "smile" ? "#2E2228" : shade(accent, -0.45),
    Y: name === "smile" ? accent : "#FFD45C",
    H: "#F06292",
    R: "#E5484D",
    G: "#7CC46A",
    W: "#FFF4D6",
  };
  // их биеийн төв (x=30), 25-р мөрөөс эхэлнэ
  return <Sprite map={map} x={30 - Math.floor(map[0].length / 2)} y={50} colors={colors} />;
}

// Цагаан футболк дээр өмссөн даамтай сарафан — юбка нь бэлхүүсийг дарна
function Pinafore({ top, skin }) {
  const { color: c, accent: a } = top;
  const check = shade(c, 0.3);
  return (
    <g>
      <Px rows={TORSO} fill={a} line={shade(a, -0.3)} />
      <Px rows={[...block(26, 31, 11, 18), [32, 10, 19], [33, 10, 19], [34, 9, 20]]} fill={c} line={shade(c, -0.35)} />
      <Px rows={[[24, 12, 13], [24, 16, 17], [25, 12, 17]]} fill={c} />
      <Px rows={[...block(26, 34, 13, 13), ...block(26, 34, 16, 16), [28, 11, 18], [31, 11, 18], [33, 10, 19]]} fill={check} />
      <Px rows={[[23, 14, 15]]} fill={skin} />
    </g>
  );
}

function Torso({ top, skin }) {
  const { color: c, accent: a } = top;
  if (top.kind === "pinafore") return <Pinafore top={top} skin={skin} />;
  return (
    <g>
      {top.kind === "hoodie" && <Px rows={[[22, 11, 18], [23, 10, 19]]} fill={a} line={shade(a, -0.3)} />}
      <Px rows={TORSO} fill={c} line={shade(c, -0.3)} />
      {/* гэрэл зүүнээс тусна: зүүн тал гэгээтэй, баруун тал сүүдэртэй */}
      <Px rows={block(24, 27, 11, 11)} fill={shade(c, 0.35)} />
      <Px rows={block(24, 31, 18, 18)} fill={shade(c, -0.1)} />
      {top.kind === "stripe" && <Px rows={[[25, 11, 18], [27, 11, 18], [29, 11, 18]]} fill={a} />}
      {top.kind === "heart" && (
        <Px rows={[[25, 12, 13], [25, 16, 17], [26, 12, 17], [27, 13, 16], [28, 14, 15]]} fill={a} />
      )}
      {top.kind === "long" && <Px rows={[[31, 11, 18]]} fill={a} />}
      {top.kind === "hoodie" && (
        <g>
          {!top.motif && <Px rows={[...block(24, 26, 13, 13), ...block(24, 26, 16, 16)]} fill="#FFFFFF" />}
          <Px rows={block(28, 30, 12, 17)} fill={a} />
        </g>
      )}
      {top.kind === "sweat" && <Px rows={[[31, 11, 18]]} fill={shade(c, -0.12)} />}
      {top.kind === "plaid" && (
        <g>
          <Px rows={[...block(24, 31, 13, 13), ...block(24, 31, 16, 16), [26, 11, 18], [29, 11, 18]]} fill={a} />
          <Px rows={[[26, 13, 13], [26, 16, 16], [29, 13, 13], [29, 16, 16]]} fill={shade(c, -0.45)} />
        </g>
      )}
      {top.kind === "tiedye" && (
        <g>
          <Px rows={[[24, 11, 13], [25, 11, 12], [26, 11, 11], [29, 18, 18], [30, 17, 18], [31, 16, 18]]} fill={TIEDYE[0]} />
          <Px rows={[[24, 16, 18], [25, 17, 18], [26, 18, 18], [29, 11, 11], [30, 11, 12], [31, 11, 13]]} fill={TIEDYE[1]} />
          <Px rows={[[26, 14, 15], [27, 13, 16], [28, 13, 16], [29, 14, 15]]} fill={TIEDYE[2]} />
          <Px rows={[[27, 14, 15], [28, 14, 15]]} fill={TIEDYE[3]} />
        </g>
      )}
      {top.kind === "cardigan" && (
        <g>
          <Px rows={[[23, 13, 16], [24, 13, 16], ...block(25, 31, 14, 15)]} fill={a} />
          <Px rows={[[26, 13, 13], [29, 13, 13]]} fill={shade(c, -0.3)} />
        </g>
      )}
      {top.kind === "collar" && (
        <g>
          <Px rows={[[23, 12, 13], [23, 16, 17], [24, 12, 13], [24, 16, 17]]} fill={a} />
          <Px rows={[[25, 14, 15]]} fill={shade(c, -0.4)} />
        </g>
      )}
      {top.motif && <TopMotif name={top.motif} accent={top.kind === "hoodie" || top.kind === "cardigan" ? c : a} />}
      {/* хүзүүний зүсэлт */}
      <Px rows={[[23, 14, 15]]} fill={skin} />
    </g>
  );
}

function Waist({ bottom }) {
  const { color: c, accent: a } = bottom;
  if (bottom.kind === "skirt")
    return (
      <g>
        <Px rows={[...block(32, 33, 11, 18), ...block(34, 35, 10, 19), [36, 9, 20]]} fill={c} line={shade(c, -0.3)} />
        <Px rows={[...block(34, 36, 12, 12), ...block(34, 36, 17, 17)]} fill={a} />
        <Px rows={[[32, 11, 13], [34, 10, 11]]} fill={shade(c, 0.35)} />
        <Px rows={[[36, 13, 16]]} fill={shade(c, -0.08)} />
        {bottom.pattern === "plaid" && <Px rows={[...block(32, 36, 14, 15), [34, 10, 19]]} fill={a} opacity={0.75} />}
      </g>
    );
  return (
    <g>
      <Px rows={block(32, 33, 11, 18)} fill={c} line={shade(c, -0.3)} />
      {/* хүрээ хөлийн дээд хэсгийг дарсныг нөхнө */}
      <Px rows={[[34, 11, 12], [34, 17, 18]]} fill={c} />
    </g>
  );
}

// Комбинезоны цээжний хэсэг ба мөрний оосор — цамцны дээр зурна
function Bib({ bottom }) {
  if (bottom.kind !== "overalls") return null;
  const c = bottom.color;
  return (
    <g>
      <Px rows={block(27, 31, 12, 17)} fill={c} line={shade(c, -0.3)} />
      <Px rows={[...block(23, 26, 12, 12), ...block(23, 26, 17, 17)]} fill={c} />
      <Px rows={[[27, 12, 12], [27, 17, 17]]} fill={bottom.accent} />
      <Px rows={[[29, 14, 15]]} fill={shade(c, -0.15)} />
    </g>
  );
}

export default function Avatar({
  look = STARTER_LOOK,
  skin = 0,
  mood = null,
  walking = false,
  idle = false,
  label = t("Миний дүр", "My avatar"),
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
  const eyes = get("eyes");
  const s = SKIN_TONES[skin] ?? SKIN_TONES[0];
  const sl = shade(s, -0.25);

  return (
    <svg
      viewBox={crop}
      width={size}
      height={(size * ch) / cw}
      className={`${walking ? "av-walk" : idle ? "av-idle" : ""} ${className}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={label}
    >
      <style>{ANIM}</style>
      {/* газрын сүүдэр — дүр хөвөхөд хөдлөхгүй */}
      <Px rows={[[44, 8, 21], [45, 10, 19]]} fill="#3A2A3E" opacity={0.1} />
      <g className="av-body">
        <HairBack item={hair} />
        <Leg x={11} skin={s} skinLine={sl} bottom={bottom} shoes={shoes} className="av-leg-l" origin={HIP_L} />
        <Leg x={17} skin={s} skinLine={sl} bottom={bottom} shoes={shoes} className="av-leg-r" origin={HIP_R} />
        <Waist bottom={bottom} />
        <Px rows={block(21, 23, 13, 16)} fill={s} line={sl} />
        <Arm x={8} skin={s} skinLine={sl} top={top} className="av-arm-l" origin={SHOULDER_L} />
        <Arm x={20} skin={s} skinLine={sl} top={top} className="av-arm-r" origin={SHOULDER_R} />
        <Torso top={top} skin={s} />
        <Bib bottom={bottom} />
        <Px rows={FACE} fill={s} line={sl} />
        <Px rows={[[12, 8, 21]]} fill={shade(s, -0.08)} />
        <HairFront item={hair} />
        <Face skin={s} eye={eyes.color} mood={mood} />
        <Accessory item={acc} />
      </g>
    </svg>
  );
}
