"use client";

/** Профайл хуудсан дээрх «Миний код» (зөвхөн охинд) */

import { useState } from "react";
import { Copy, Check, UserPlus } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { useFriends } from "../../../context/FriendsContext";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";

export default function MyFriendCode() {
  const { setToast } = useFamily();
  const { active, friendCode } = useFriends();
  const [copied, setCopied] = useState(false);
  if (!active) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(friendCode);
      setToast("Найзын код хуулагдлаа 📋");
    } catch {
      setToast(`Чиний код: ${friendCode}`);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card>
      <SectionTitle icon={UserPlus} title="Миний код" />
      <div className="flex items-center gap-2 rounded-2xl bb-bg-FDE7F1 p-3">
        <p className="flex-1 text-2xl font-black tracking-widest bb-text-B83B7E">{friendCode || "……"}</p>
        <button
          onClick={copy}
          disabled={!friendCode}
          className="w-11 h-11 rounded-2xl bg-white bb-text-B83B7E flex items-center justify-center active:scale-90"
          aria-label="Найзын кодоо хуулах"
        >
          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
        </button>
      </div>
    </Card>
  );
}
