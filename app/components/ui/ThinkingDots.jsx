import { t } from "../../../lib/i18n";

export default function ThinkingDots({ label = t("AI бодож байна…", "AI is thinking…") }) {
  return (
    <div className="flex items-center gap-2 py-6 justify-center">
      {[0, 150, 300].map((d) => (
        <span
          key={d}
          className="w-2 h-2 rounded-full bb-bg-F48FB1 animate-bounce"
          style={{ animationDelay: `${d}ms` }}
        />
      ))}
      <span className="text-xs font-bold text-slate-400 ml-1">{label}</span>
    </div>
  );
}
