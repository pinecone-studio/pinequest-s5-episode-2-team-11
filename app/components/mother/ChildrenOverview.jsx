"use client";

import { Users, ChevronRight } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { PHASE_COLORS, PHASES } from "../../../lib/data";
import { getPhaseKey } from "../../../lib/helpers";
import { cycleStatus } from "../../../lib/dates";
import SectionTitle from "../ui/SectionTitle";
import Card from "../ui/Card";

function childSummary(child) {
  const cycleLength = child.cycle_length ?? 28;
  const cycle = cycleStatus(child.last_period_start, cycleLength);
  if (!cycle) {
    return { color: "#CBD5E1", text: child.no_period_yet ? "Сарын тэмдэг хараахан ирээгүй" : "Мөчлөгөө оруулаагүй" };
  }
  const phaseKey = getPhaseKey(cycle.day, cycleLength, child.period_length ?? 5);
  const isPeriod = phaseKey === "period";
  const detail = cycle.daysLate > 0
    ? `${cycle.daysLate} хоног хоцорсон`
    : isPeriod
      ? `${cycle.displayDay} дэх өдөр`
      : `${cycle.daysUntil} хоногийн дараа`;
  return { color: PHASE_COLORS[phaseKey], text: `${PHASES[phaseKey].short} · ${detail}` };
}

/** 2+ охинтой үед бүх охины мөчлөгийг нэг дор харуулна. Дарвал тэр охин сонгогдоно. */
export default function ChildrenOverview() {
  const { children, activeChildId, setActiveChildId } = useFamily();
  if (children.length < 2) return null;

  return (
    <Card>
      <SectionTitle icon={Users} title="Охидын тойм" />
      <div className="space-y-2">
        {children.map((child) => {
          const { color, text } = childSummary(child);
          const active = child.id === activeChildId;
          return (
            <button
              key={child.id}
              type="button"
              onClick={() => setActiveChildId(child.id)}
              aria-pressed={active}
              className={`w-full flex items-center gap-3 rounded-2xl p-3 text-left border-2 transition active:scale-[0.98] ${active ? "bb-border-F48FB1 bb-bg-FFF7FB" : "border-slate-100 bg-white"}`}
            >
              <span className="w-3 h-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-700 truncate">{child.display_name || "Охин"}</p>
                <p className="text-xs font-semibold text-slate-500">{text}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
          );
        })}
      </div>
    </Card>
  );
}
