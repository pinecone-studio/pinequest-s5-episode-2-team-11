/** Bloomy-ийн дүрийн жижиг дүрсүүд — emoji-ийн оронд */

// 🌸 дэлбээ (дэлгүүрийн мөнгө)
export function PetalIcon({ size = 16, className = "" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      {[0, 72, 144, 216, 288].map((r) => (
        <ellipse key={r} cx="12" cy="6.6" rx="4.2" ry="5.4" fill="#F48FB1" transform={`rotate(${r} 12 12)`} />
      ))}
      <circle cx="12" cy="12" r="3.2" fill="#FFD45C" />
    </svg>
  );
}

// ⭐ XP
export function XpIcon({ size = 16, className = "" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <path
        d="M12 2.5l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.5l-5.4 2.9 1-6.1L3.2 9l6.1-.9z"
        fill="#B794F4"
        stroke="#9B74E0"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Алхалтын дүр зургийн чимэглэл
export function Cloud({ w = 56, opacity = 0.9 }) {
  return (
    <svg viewBox="0 0 56 26" width={w} height={(w * 26) / 56} aria-hidden="true" style={{ opacity }}>
      <path d="M12 24 Q2 24 3 16 Q4 9 12 10 Q15 2 25 3 Q34 3 36 11 Q46 8 50 15 Q55 24 44 24 Z" fill="#fff" />
    </svg>
  );
}

export function Tree({ h = 64, tone = "#9ED3BA" }) {
  return (
    <svg viewBox="0 0 40 64" width={(h * 40) / 64} height={h} aria-hidden="true">
      <rect x="17" y="40" width="6" height="22" rx="3" fill="#C9A386" />
      <circle cx="20" cy="26" r="16" fill={tone} />
      <circle cx="12" cy="34" r="10" fill={tone} />
      <circle cx="28" cy="34" r="10" fill={tone} />
      <circle cx="15" cy="22" r="4" fill="#fff" opacity=".35" />
    </svg>
  );
}

export function Flower({ size = 18, color = "#F48FB1" }) {
  return (
    <svg viewBox="0 0 24 30" width={size} height={(size * 30) / 24} aria-hidden="true">
      <path d="M12 14 L12 29" stroke="#7FBF9C" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 23 Q17 19 19 22 Q16 26 12 24" fill="#7FBF9C" />
      {[0, 72, 144, 216, 288].map((r) => (
        <ellipse key={r} cx="12" cy="6" rx="3.4" ry="4.6" fill={color} transform={`rotate(${r} 12 11)`} />
      ))}
      <circle cx="12" cy="11" r="2.6" fill="#FFD45C" />
    </svg>
  );
}

export function Sparkle({ size = 14, color = "#fff", className = "" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <path d="M12 1 C13 9 15 11 23 12 C15 13 13 15 12 23 C11 15 9 13 1 12 C9 11 11 9 12 1 Z" fill={color} />
    </svg>
  );
}

// Дэлгүүрийн жижиг зурагт тухайн хэсгийг тайрч харуулах
export const SLOT_CROP = {
  hair: "8 2 104 100",
  acc: "8 2 104 100",
  top: "20 84 80 62",
  bottom: "24 126 72 70",
  shoes: "34 168 52 30",
};
