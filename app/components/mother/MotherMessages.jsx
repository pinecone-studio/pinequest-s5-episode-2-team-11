+"use client";

import { useFamily } from "../../../context/FamilyContext";
import { useRouter } from "next/navigation";
import { Bell, ChevronLeft } from "lucide-react";
import SectionTitle from "../ui/SectionTitle";
import Card from "../ui/Card";
import PageHeader from "../ui/PageHeader";

export default function MotherMessages() {
  const router = useRouter();
  const { momInbox, setTab } = useFamily();

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

    </div>
  );
}
