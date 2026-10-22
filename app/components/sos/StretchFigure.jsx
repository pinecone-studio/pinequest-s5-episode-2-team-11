export default function StretchFigure({ type, active }) {
  const stroke = active ? "#B83B7E" : "#94A3B8";
  const common = { stroke, strokeWidth: 5, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" };
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full">
      <rect x="4" y="70" width="112" height="6" rx="3" fill={active ? "#FDE7F1" : "#F1F5F9"} />
      {type === "child" && (
        <g>
          <circle cx="30" cy="61" r="7" fill={stroke} />
          <path d="M88 56 L44 59" {...common} />
          <path d="M44 59 L12 66" {...common} />
          <path d="M88 56 L62 68 L96 68" {...common} />
        </g>
      )}
      {type === "knees" && (
        <g>
          <circle cx="16" cy="62" r="7" fill={stroke} />
          <path d="M24 64 L70 64" {...common} />
          <path d="M70 64 L60 36 L82 32" {...common} />
          <path d="M34 63 L58 40" {...common} />
        </g>
      )}
      {type === "twist" && (
        <g>
          <circle cx="16" cy="62" r="7" fill={stroke} />
          <path d="M24 64 L68 64" {...common} />
          <path d="M68 64 L86 50 L102 64" {...common} />
          <path d="M36 64 L36 38" {...common} />
          <path d="M44 64 L56 44" {...common} />
        </g>
      )}
    </svg>
  );
}
