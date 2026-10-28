"use client";

/**
 * Team-only feedback results. Data comes from /api/admin/feedback, which
 * answers 404 unless the signed-in email is in ADMIN_EMAILS — so everyone
 * else sees only "404". Aggregates only; no user ids.
 */
import { useEffect, useState } from "react";
import { featureLabel } from "../../../lib/feedback";
import { supabase } from "../../../lib/supabase";

type Range = "7" | "30" | "all";
const RANGES: [Range, string][] = [["7", "7 хоног"], ["30", "30 хоног"], ["all", "Бүгд"]];
const LABEL: Record<string, string> = {
  yes: "Тийм", maybe: "Магадгүй", no: "Үгүй", some: "Бага зэрэг", less: "Багассан", same: "Адилхан", more: "Нэмэгдсэн",
};

async function token() {
  const { data } = await supabase!.auth.getSession();
  return data.session?.access_token ?? "";
}

function Pct({ values }: { values: Record<string, number> }) {
  const { answered, ...rest } = values;
  return (
    <div className="space-y-1">
      {Object.entries(rest).map(([key, value]) => (
        <div key={key} className="flex items-center gap-2 text-xs font-bold text-slate-600">
          <span className="w-24 shrink-0 truncate">{LABEL[key] ?? featureLabel(key)}</span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-pink-400" style={{ width: `${value}%` }} /></span>
          <span className="w-10 text-right">{value}%</span>
        </div>
      ))}
      <p className="text-[11px] font-semibold text-slate-400">Хариулсан: {answered}</p>
    </div>
  );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="space-y-2 rounded-2xl border border-slate-200 p-3"><h2 className="text-sm font-black text-slate-700">{title}</h2>{children}</section>;
}

function Thumbs({ rows }: { rows: { target: string; upRate: number; total: number }[] }) {
  if (!rows.length) return <p className="text-xs font-semibold text-slate-400">Өгөгдөл алга</p>;
  return (
    <table className="w-full text-left text-xs font-bold text-slate-600">
      <tbody>{rows.map((row) => <tr key={row.target} className="border-t border-slate-100"><td className="py-1 pr-2 break-all">{row.target}</td><td className="py-1 text-right">👍 {row.upRate}%</td><td className="py-1 pl-2 text-right text-slate-400">{row.total}</td></tr>)}</tbody>
    </table>
  );
}

export default function AdminFeedbackPage() {
  const [range, setRange] = useState<Range>("30");
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "404" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    (async () => {
      const response = await fetch(`/api/admin/feedback?range=${range}`, { headers: { Authorization: `Bearer ${await token()}` }, cache: "no-store" });
      if (cancelled) return;
      if (response.status === 404) return setStatus("404");
      if (!response.ok) return setStatus("error");
      setData(await response.json());
      setStatus("ok");
    })();
    return () => { cancelled = true; };
  }, [range]);

  const downloadCsv = async () => {
    const response = await fetch(`/api/admin/feedback?range=${range}&format=csv`, { headers: { Authorization: `Bearer ${await token()}` } });
    if (!response.ok) return;
    const url = URL.createObjectURL(await response.blob());
    const link = Object.assign(document.createElement("a"), { href: url, download: `bloomy-feedback-${range}.csv` });
    link.click();
    URL.revokeObjectURL(url);
  };

  if (status === "404") {
    return <div className="fixed inset-0 z-[300] flex items-center justify-center bg-white text-slate-500"><p className="text-sm font-black">404 · Хуудас олдсонгүй</p></div>;
  }

  const d = data?.daughters;
  const g = data?.guardians;
  return (
    <div className="fixed inset-0 z-[300] overflow-y-auto bg-white p-4 text-slate-700">
      <div className="mx-auto max-w-md space-y-3 pb-10">
        <h1 className="text-xl font-black">Санал хүсэлтийн үр дүн</h1>
        <div className="flex flex-wrap items-center gap-2">
          {RANGES.map(([id, label]) => (
            <button key={id} type="button" onClick={() => setRange(id)} className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${range === id ? "bg-pink-500 text-white" : "bg-slate-100 text-slate-600"}`}>{label}</button>
          ))}
          <button type="button" onClick={downloadCsv} disabled={status !== "ok"} className="ml-auto rounded-full bg-slate-700 px-3 py-1.5 text-xs font-extrabold text-white disabled:opacity-50">CSV татах</button>
        </div>
        {status === "loading" && <p className="text-sm font-bold text-slate-400">Ачаалж байна…</p>}
        {status === "error" && <p className="text-sm font-bold text-rose-600">Ачаалж чадсангүй. feedback.sql ажилласан эсэхийг шалгана уу.</p>}
        {status === "ok" && d && g && <>
          <Box title={`👧 Охид · ${d.responses} хариулт`}>
            <p className="text-sm font-bold">Дундаж инээмсэглэл: {d.avgSmiley ?? "—"} / 5</p>
            <p className="pt-1 text-xs font-black text-slate-500">Сарын тэмдгийн талаар ичих нь</p>
            <Pct values={d.embarrassment} />
            <p className="pt-1 text-xs font-black text-slate-500">Анхны сарын тэмдгээс өмнө — санаа зовох нь</p>
            <Pct values={d.worryBeforeFirst} />
            <p className="pt-1 text-xs font-black text-slate-500">Хамгийн их таалагдсан хэсэг</p>
            <Pct values={d.favorite} />
            {Object.entries(d.again as Record<string, Record<string, number>>).filter(([, values]) => values.answered > 0).map(([feature, values]) => (
              <div key={feature}><p className="pt-1 text-xs font-black text-slate-500">Дахиад «{featureLabel(feature)}»</p><Pct values={values} /></div>
            ))}
          </Box>
          <Box title={`👩 Асран хамгаалагч · ${g.responses} хариулт`}>
            <p className="text-2xl font-black">NPS {g.nps ?? "—"}</p>
            <p className="text-[11px] font-semibold text-slate-400">%(9–10) − %(0–6) · {g.npsAnswered} хариулт</p>
            <p className="text-sm font-bold">Ашиглахад амар: {g.avgEase ?? "—"} / 5 · Нууцлалд итгэх: {g.avgTrust ?? "—"} / 5</p>
            <p className="pt-1 text-xs font-black text-slate-500">Охинтойгоо ярилцахад тусалсан уу</p>
            <Pct values={g.helpedTalk} />
            <p className="pt-1 text-xs font-black text-slate-500">6,900₮/сар төлөх үү</p>
            <Pct values={g.pay} />
          </Box>
          <Box title="👍 Хичээл (бага нь эхэндээ)"><Thumbs rows={data.micro.lessons} /></Box>
          <Box title="👍 Блүми эгч (тогтмол/AI)"><Thumbs rows={data.micro.bloomyBySource} /></Box>
          <Box title="👍 Блүми эгчийн хариулт бүр (бага нь эхэндээ)"><Thumbs rows={data.micro.bloomyAnswers.slice(0, 20)} /></Box>
          <Box title="👍 Таамаг · SOS-ийн дараа"><Thumbs rows={[...data.micro.forecast, ...data.micro.sos]} /></Box>
          <Box title="✍️ Чөлөөт санал (шинэ нь эхэндээ)">
            {data.freeText.length ? data.freeText.map((row: any, index: number) => (
              <p key={index} className="border-t border-slate-100 pt-1 text-xs font-semibold text-slate-600"><span className="mr-1">{row.role === "daughter" ? "👧" : "👩"}</span>{row.text}<span className="ml-1 text-slate-400">· {row.created_at.slice(0, 10)}</span></p>
            )) : <p className="text-xs font-semibold text-slate-400">Алга</p>}
          </Box>
        </>}
      </div>
    </div>
  );
}
