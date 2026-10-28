"use client";

import Card from "../ui/Card";
import MicroFeedback from "./MicroFeedback";

/** The day after she sent a friend SOS: asked once (the server stops offering it after an answer). */
export default function SosFollowUpCard({ requestId }) {
  return (
    <Card className="!p-4">
      <MicroFeedback targetType="sos" targetId={requestId} question="Найз чинь туслаж чадсан уу?" options={[["yes", "Тийм"], ["no", "Үгүй"]]} className="text-sm" />
    </Card>
  );
}
