import { Check } from "lucide-react";

const PHONE =
  "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z";

/** Дугуй «дуудлага» товч. stage: "idle" | "ringing" | "sent" */
export default function SosCallButton({ size, stage, onClick, disabled = false, ariaLabel = "Хэрэглэл хэрэгтэй байна — найзууддаа дохио илгээх" }) {
  const ringing = stage === "ringing";
  return (
    <button
      onClick={onClick}
      disabled={disabled || ringing}
      aria-label={ariaLabel}
      className="relative shrink-0 rounded-full flex items-center justify-center transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      style={{ width: size, height: size }}
    >
      <span className="absolute inset-0 rounded-full bx-halo" />
      {ringing && <span className="absolute inset-0 rounded-full bx-halo animate-ping" />}
      <span
        className={`relative rounded-full bb-grad-sos flex items-center justify-center shadow-lg bx-shadow-sos ${
          ringing ? "bloom-wiggle" : ""
        }`}
        style={{ width: size * 0.78, height: size * 0.78 }}
      >
        {stage === "sent" ? (
          <Check className="text-white" style={{ width: size * 0.36, height: size * 0.36 }} />
        ) : (
          <svg
            viewBox="0 0 24 24"
            width={size * 0.34}
            height={size * 0.34}
            fill="none"
            stroke="white"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={PHONE} />
          </svg>
        )}
      </span>
    </button>
  );
}
