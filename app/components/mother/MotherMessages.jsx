+"use client";

import { useFamily } from "../../../context/FamilyContext";
import { useRouter } from "next/navigation";
import { Copy, Users, Bell, Check, HeartHandshake, ChevronLeft } from "lucide-react";
import { MOM_QUICK_NOTES } from "../../../lib/data";
import SectionTitle from "../ui/SectionTitle";
import Card from "../ui/Card";
import PageHeader from "../ui/PageHeader";

export default function MotherMessages() {
  const router = useRouter();
  const { familyCode, linked, daughterName, copied, momInbox, setToast, sendToTeen, copyCode, setTab } = useFamily();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 bloom-fade">
        <button
          onClick={() => {
            setTab("home");
            router.replace("/mother");
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm border border-slate-100 active:scale-90"
          aria-label="Буцах"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <PageHeader sub="Охинтойгоо холбоотой байгаарай" title="Мэдэгдэл 💌" />
      </div>

      <Card>
        <SectionTitle icon={Bell} title="Ирсэн мэдэгдэл" />
        {momInbox.length === 0 ? (
          <p className="text-sm text-slate-400 font-semibold py-6 text-center">Одоогоор мэдэгдэл алга 🌸</p>
        ) : (
          <div className="space-y-2">
            {momInbox.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 rounded-2xl px-3 py-3 ${
                  n.kind === "sos" ? "bb-bg-E9DDFC-50" : "bb-bg-FFF7FB"
                }`}
              >
                <span className="text-xl">
                  {n.kind === "sos" ? "🆘" : n.kind === "supply" ? "🛍️" : n.kind === "period" ? "🩸" : "🌸"}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-700 leading-snug">{n.text}</p>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {linked && (
        <Card>
          <SectionTitle icon={HeartHandshake} title="Охиндоо зөөлөн үг илгээх" />
          <div className="flex flex-wrap gap-2">
            {MOM_QUICK_NOTES.map((q) => (
              <button
                key={q}
                onClick={() => {
                  sendToTeen(q);
                  setToast(`${daughterName}-д илгээлээ 💌`);
                }}
                className="rounded-full bb-bg-FFF7FB border-2 border-slate-100 text-slate-700 text-xs font-extrabold px-3 py-2 bb-hover-border-CDB4F5 active:scale-95 transition"
              >
                {q}
              </button>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <SectionTitle icon={Users} title="Гэр бүлийн код" />
        <div className="flex items-center gap-2">
          <span className="flex-1 rounded-2xl bb-bg-FFF7FB py-3 text-center text-lg font-black tracking-wider text-slate-600">
            {familyCode}
          </span>
          <button
            onClick={copyCode}
            className="w-12 h-12 rounded-2xl bb-bg-FDE7F1 bb-text-B83B7E flex items-center justify-center active:scale-90"
            aria-label="Кодыг хуулах"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
        <p className="mt-2 text-xs font-semibold text-slate-500">
          {linked ? `${daughterName} холбогдсон ✓` : `${daughterName} холбогдохыг хүлээж байна`}
        </p>
      </Card>
    </div>
  );
}
