"use client";

/**
 * Avatar — layered full-body dress-up character (our own SVG art).
 *   config  = AvatarConfig (lib/avatar.ts); old callers may still pass look + skin
 *   size    = "sm" | "md" | "lg" or a width in px (height is 1.5×)
 *   pose    = "stand" (only pose for now)
 *   mood    = today's mood 1–5 → mouth; null = soft smile
 *   walking = bouncy walk; idle = breathing + blink (both off with reduced motion)
 *   headOnly (or legacy `crop`) = head-and-shoulders crop for small lists
 */
import { useMemo } from "react";
import { layersFor, migrateLook, normalizeConfig } from "../../../lib/avatar";
import { useLayerMarkup } from "./avatarLayers";

const SIZES = { sm: 48, md: 120, lg: 220 };
const FULL_VIEW = "0 0 512 768";
const HEAD_VIEW = "56 24 400 400";

const ANIM = `
.bav-idle .bav-figure{animation:bavBreathe 3.6s ease-in-out infinite;transform-origin:256px 745px;transform-box:view-box}
.bav-walk .bav-figure{animation:bavWalk .5s ease-in-out infinite alternate;transform-origin:256px 745px;transform-box:view-box}
.bav-blink .av-eyes{animation:bavBlink 4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
@keyframes bavBreathe{0%,100%{transform:scale(1)}50%{transform:scale(1.02)}}
@keyframes bavWalk{from{transform:translateY(0) rotate(-2deg)}to{transform:translateY(-14px) rotate(2deg)}}
@keyframes bavBlink{0%,94%,100%{transform:scaleY(1)}97%{transform:scaleY(.1)}}
@media (prefers-reduced-motion: reduce){.bav-figure,.av-eyes{animation:none!important}}
`;

const MOUTHS = {
  happy: <path d="M232 296 Q256 326 280 296" fill="none" stroke="#7A3E4E" strokeWidth="9" strokeLinecap="round" />,
  smile: <path d="M240 300 Q256 316 272 300" fill="none" stroke="#7A3E4E" strokeWidth="8" strokeLinecap="round" />,
  neutral: <path d="M242 306 L270 306" fill="none" stroke="#7A3E4E" strokeWidth="8" strokeLinecap="round" />,
  sad: <path d="M240 312 Q256 298 272 312" fill="none" stroke="#7A3E4E" strokeWidth="8" strokeLinecap="round" />,
};
const mouthFor = (mood) => (mood >= 5 ? "happy" : mood === 4 ? "smile" : mood === 3 ? "neutral" : mood ? "sad" : "smile");

export default function Avatar({
  config,
  look,
  skin,
  size = "md",
  pose = "stand",
  mood = null,
  walking = false,
  idle = false,
  headOnly = false,
  crop,
  label = "Дүр",
  className = "",
}) {
  const resolved = useMemo(() => (config ? normalizeConfig(config) : look ? migrateLook(look, skin) : normalizeConfig(null)), [config, look, skin]);
  const layers = useMemo(() => layersFor(resolved), [resolved]);
  const markup = useLayerMarkup(layers.map((layer) => layer.src));
  const head = headOnly || Boolean(crop);
  const width = typeof size === "number" ? size : SIZES[size] ?? SIZES.md;
  const height = head ? width : width * 1.5;
  const motion = walking ? "bav-walk" : idle ? "bav-idle" : "";

  return (
    <svg
      viewBox={head ? HEAD_VIEW : FULL_VIEW}
      width={width}
      height={height}
      role="img"
      aria-label={label}
      data-pose={pose}
      className={`${motion} ${idle || walking ? "bav-blink" : ""} ${className}`}
      style={{ overflow: "visible", flexShrink: 0 }}
    >
      <style>{ANIM}</style>
      <g className="bav-figure">
        {layers.map(({ layer, src, vars }) => (
          <g key={layer} data-layer={layer} style={vars}>
            {markup[src] != null && <g dangerouslySetInnerHTML={{ __html: markup[src] }} />}
            {layer === "face" && markup[src] != null && MOUTHS[mouthFor(mood)]}
          </g>
        ))}
      </g>
    </svg>
  );
}
