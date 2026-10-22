import { Loader2 } from "lucide-react";
import BloomyLogo from "../ui/BloomyLogo";

export default function Splash({ text }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4 bloom-fade">
      <div className="w-20 h-20 rounded-3xl bb-grad-1 flex items-center justify-center shadow-xl bb-shadow-F48FB1-30 bloom-float">
        <BloomyLogo className="w-14 h-14" />
      </div>
      <p className="flex items-center gap-2 text-sm font-bold text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" /> {text}
      </p>
    </div>
  );
}
