import { Settings2 } from "lucide-react";

export default function NotConfigured() {
  return (
    <div className="px-2 pt-8 bloom-fade space-y-4">
      <div className="w-16 h-16 rounded-2xl bb-bg-E9DDFC-60 flex items-center justify-center">
        <Settings2 className="w-8 h-8 bb-text-7C4DCC" />
      </div>
      <h2 className="text-2xl font-black text-slate-700">Supabase тохируулаагүй байна</h2>
      <p className="text-slate-500 font-semibold leading-relaxed">
        Төслийн үндсэн фолдерт <code className="font-mono bg-white px-1 rounded">.env.local</code> файл
        үүсгээд Supabase-ийн хаягаа оруулна уу. Дэлгэрэнгүйг <b>SETUP.md</b>-ээс үзээрэй.
      </p>
      <pre className="bg-slate-800 text-slate-100 text-xs rounded-2xl p-4 overflow-x-auto">
        {`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
GEMINI_API_KEY=таны-gemini-api-key`}
      </pre>
      <p className="text-xs font-semibold text-slate-400">
        Файлаа хадгалсны дараа серверээ дахин эхлүүлнэ (npm run dev).
      </p>
    </div>
  );
}
