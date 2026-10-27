import { Settings2 } from "lucide-react";
import { t } from "../../../lib/i18n";

export default function NotConfigured() {
  return (
    <div className="px-2 pt-8 bloom-fade space-y-4">
      <div className="w-16 h-16 rounded-2xl bb-bg-E9DDFC-60 flex items-center justify-center">
        <Settings2 className="w-8 h-8 bb-text-7C4DCC" />
      </div>
      <h2 className="text-2xl font-black text-slate-700">{t("Supabase тохируулаагүй байна", "Supabase isn't configured")}</h2>
      <p className="text-slate-500 font-semibold leading-relaxed">
        {t("Төслийн үндсэн фолдерт", "Create a")} <code className="font-mono bg-white px-1 rounded">.env.local</code> {t("файл үүсгээд Supabase-ийн хаягаа оруулна уу. Дэлгэрэнгүйг", "file in the project root and add your Supabase details. See")} <b>SETUP.md</b>{t("-ээс үзээрэй.", "for details.")}
      </p>
      <pre className="bg-slate-800 text-slate-100 text-xs rounded-2xl p-4 overflow-x-auto">
        {t(`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
GEMINI_API_KEY=таны-gemini-api-key`, `NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
GEMINI_API_KEY=your-gemini-api-key`)}
      </pre>
      <p className="text-xs font-semibold text-slate-400">
        {t("Файлаа хадгалсны дараа серверээ дахин эхлүүлнэ (npm run dev).", "After saving the file, restart the server (npm run dev).")}
      </p>
    </div>
  );
}
