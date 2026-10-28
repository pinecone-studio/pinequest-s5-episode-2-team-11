"use client";

import { useEffect, useState } from "react";
import { feedbackRequest } from "../../../lib/feedback-client";
import Card from "../ui/Card";
import FeedbackSurvey from "./FeedbackSurvey";
import SosFollowUpCard from "./SosFollowUpCard";

/**
 * Bottom of the Today page (never a pop-up, never a push). The server decides:
 * ≥ 7 days of use, nothing in 30 days, < 3 «Дараа», and not a hard day.
 */
export default function FeedbackPromptCard({ role }) {
  const [status, setStatus] = useState(null);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    feedbackRequest("status").then((result) => { if (!cancelled && !result.error) setStatus(result); });
    return () => { cancelled = true; };
  }, []);

  if (!status) return null;
  const isDaughter = role === "daughter";

  return (
    <>
      {isDaughter && status.sosFollowUp && <SosFollowUpCard requestId={status.sosFollowUp.id} />}
      {status.eligible && !hidden && (
        <Card className="!p-4">
          <p className="text-sm font-extrabold text-slate-700">
            {isDaughter ? "Bloomy-д чиний санаа хэрэгтэй байна 💌" : "Bloomy-г сайжруулахад туслаарай"}
            <span className="ml-1 text-xs font-bold text-slate-400">(1 минут)</span>
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => { feedbackRequest("dismiss"); setHidden(true); }} className="rounded-2xl bg-slate-100 py-2.5 text-sm font-extrabold text-slate-500">Дараа</button>
            <button type="button" onClick={() => { feedbackRequest("start"); setOpen(true); }} className="rounded-2xl bb-bg-E0679F py-2.5 text-sm font-extrabold text-white">Эхлэх</button>
          </div>
        </Card>
      )}
      {open && <FeedbackSurvey role={isDaughter ? "daughter" : "guardian"} noPeriodYet={status.noPeriodYet} onClose={() => { setOpen(false); setHidden(true); }} />}
    </>
  );
}
