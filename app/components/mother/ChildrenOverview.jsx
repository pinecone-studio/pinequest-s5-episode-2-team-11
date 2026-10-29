"use client";

import { Users } from "lucide-react";
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
    return { color: "#CBD5E1", text: child.no_period_yet ? "Ирээгүй" : "Бүртгэлгүй" };
  }
  const phaseKey = getPhaseKey(cycle.day, cycleLength, child.period_length ?? 5);
  const isPeriod = phaseKey === "period";
  const detail = cycle.daysLate > 0
    ? `${cycle.daysLate} хон хоцорсон`
    : isPeriod
      ? `${cycle.displayDay}-р өдөр`
      : `${cycle.daysUntil} хон үлдсэн`;
  return { color: PHASE_COLORS[phaseKey], text: `${PHASES[phaseKey].short} · ${detail}` };
}

/** Сонгосон охины мөчлөгийн товч мэдээлэл. */
export default function ChildrenOverview() {
  const { children, activeChildId } = useFamily();
  if (children.length < 2) return null;
  const child = children.find((item) => item.id === activeChildId) ?? children[0];
  const { color, text } = childSummary(child);

  return (
    <Card className="!p-3">
      <SectionTitle icon={Users} title="Сонгосон охин" />
      <div className="flex items-center gap-3 rounded-2xl bb-bg-FFF7FB px-3 py-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black text-white" style={{ backgroundColor: color }}>
          {(child.display_name || "О").slice(0, 1).toLocaleUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-700">{child.display_name || "Охин"}</p>
          <p className="truncate text-xs font-semibold text-slate-500">{text}</p>
        </div>
      </div>
    </Card>
  );
}
