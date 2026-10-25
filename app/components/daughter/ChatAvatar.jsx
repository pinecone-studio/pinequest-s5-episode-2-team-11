"use client";

/**
 * "Блүми эгч" аватар. Нүд нь байнга анивчина; talking үед ам нь хөдөлж, толгой нь бага зэрэг хөдөлнө.
 */
export default function ChatAvatar({ talking = false, size = 72 }) {
  return (
    <div className={talking ? "bloom-bob" : "bloom-avatar-float"} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        {/* Арын дугуй */}
        <circle cx="50" cy="50" r="48" fill="#FDE7F1" />

        {/* Үсний боов */}
        <circle cx="24" cy="24" r="11" fill="#3B2A3A" />
        <circle cx="76" cy="24" r="11" fill="#3B2A3A" />
        <circle cx="24" cy="24" r="3" fill="#F48FB1" />
        <circle cx="76" cy="24" r="3" fill="#F48FB1" />

        {/* Үс (ар тал) */}
        <path d="M20 52 C18 26 34 16 50 16 C66 16 82 26 80 52 L80 70 L20 70 Z" fill="#3B2A3A" />

        {/* Нүүр */}
        <ellipse cx="50" cy="55" rx="25" ry="27" fill="#FFE0CC" />

        {/* Чих */}
        <ellipse cx="25" cy="57" rx="4" ry="6" fill="#FFD3BA" />
        <ellipse cx="75" cy="57" rx="4" ry="6" fill="#FFD3BA" />

        {/* Үсний зулай */}
        <path d="M25 48 C26 30 38 24 50 24 C62 24 74 30 75 48 C66 40 58 36 50 37 C42 36 34 40 25 48 Z" fill="#3B2A3A" />

        {/* Нүд */}
        <g className="bloom-blink">
          <ellipse cx="40" cy="55" rx="3.4" ry="4.4" fill="#3B2A3A" />
          <ellipse cx="60" cy="55" rx="3.4" ry="4.4" fill="#3B2A3A" />
          <circle cx="41.2" cy="53.4" r="1.2" fill="#fff" />
          <circle cx="61.2" cy="53.4" r="1.2" fill="#fff" />
        </g>

        {/* Хацар */}
        <ellipse cx="33" cy="64" rx="5" ry="3" fill="#F48FB1" opacity="0.55" />
        <ellipse cx="67" cy="64" rx="5" ry="3" fill="#F48FB1" opacity="0.55" />

        {/* Ам */}
        {talking ? (
          <ellipse className="bloom-talk" cx="50" cy="69" rx="5" ry="4" fill="#B83B7E" />
        ) : (
          <path className="bloom-smile" d="M44 67 Q50 73 56 67" stroke="#B83B7E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        )}

        {/* Цэцэг */}
        <g transform="translate(68 36)">
          {[0, 72, 144, 216, 288].map((r) => (
            <ellipse key={r} cx="0" cy="-4" rx="3" ry="4" fill="#F48FB1" transform={`rotate(${r})`} />
          ))}
          <circle r="2.2" fill="#FFD166" />
        </g>
      </svg>
    </div>
  );
}
