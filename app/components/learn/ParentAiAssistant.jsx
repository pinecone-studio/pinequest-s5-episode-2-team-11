"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, MessageCircle, Send, Sparkles, Trash2 } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { askAi } from "../../../lib/ai-client";
import Card from "../ui/Card";
import ChatAvatar from "../daughter/ChatAvatar";

const SUGGESTIONS = ["Яаж тайван ярилцах вэ?", "Охиноо яаж дэмжих вэ?"];
const GREETING = "Сайн уу! Би Блүми, таны туслах 🌷 Охиноо дэмжих талаар юу асуух вэ?";

export default function ParentAiAssistant() {
  const { session } = useFamily();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, busy]);

  const send = async (value) => {
    const content = value.trim();
    if (!content || busy) return;
    const nextMessages = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setDraft("");
    setBusy(true);
    const result = await askAi(session, { type: "parent_chat", messages: nextMessages.slice(-8) });
    const reply = result?.reply || "Охиноо тайван сонсоод, яг одоо түүнд юу хэрэгтэй байгааг асуугаарай. Сарын тэмдгийн талаар бол хамтдаа ярилцаж, хэрэгтэй зүйлсийг нь бэлдэж өгч болно. 💗";
    setMessages([...nextMessages, { role: "assistant", content: reply }]);
    setBusy(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="parent-ai-launcher flex w-full items-center gap-3 rounded-3xl p-3 text-left active:scale-[0.99]"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bb-bg-FDE7F1">
          <ChatAvatar size={38} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="parent-ai-title flex items-center gap-1.5 text-sm font-black">
            Блүмигээс асуугаарай <Sparkles className="h-3.5 w-3.5 bb-text-B83B7E" />
          </span>
          <span className="block text-xs font-semibold text-slate-500">Охиноо дэмжих санаа энд бий 🌷</span>
        </span>
        <MessageCircle className="h-5 w-5 bb-text-B83B7E" />
      </button>
    );
  }

  return (
    <Card>
      <div className="flex items-center gap-3 rounded-3xl bb-grad-4 p-3">
        <ChatAvatar talking={busy} size={54} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 font-black text-slate-700">
            Таны туслах Блүми <Sparkles className="h-4 w-4 bb-text-B83B7E" />
          </p>
          <p className="text-xs font-semibold text-slate-500">Охиноо дэмжих талаар хамтдаа ярилцъя 🌷</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 active:scale-90"
            aria-label="Чатыг цэвэрлэх"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => setOpen(false)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 active:scale-90"
          aria-label="Чатыг хураах"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      <div ref={listRef} className="mt-3 max-h-72 space-y-3 overflow-y-auto pr-1">
        <ChatBubble role="assistant">{GREETING}</ChatBubble>
        {messages.map((message, index) => (
          <ChatBubble key={`${index}-${message.role}`} role={message.role}>{message.content}</ChatBubble>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="rounded-3xl rounded-bl-lg border border-slate-100 bg-white px-4 py-3 text-xs font-semibold text-slate-400">
              Блүми бодож байна… 💭
            </div>
          </div>
        )}
      </div>

      {messages.length === 0 && !busy && (
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => send(suggestion)}
              className="rounded-full bg-white px-3 py-2 text-xs font-extrabold text-slate-600 border border-slate-100 active:scale-95"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form
        className="mt-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          send(draft);
        }}
      >
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={600}
          rows={2}
          placeholder="Блүмигээс асуугаарай…"
          aria-label="AI туслахаас асуух"
          className="min-w-0 flex-1 resize-none rounded-2xl bb-bg-FFF7FB border-2 bb-border-E9DDFC px-3 py-2.5 text-sm font-semibold outline-none bb-focus-border-F48FB1"
        />
        <button
          type="submit"
          disabled={!draft.trim() || busy}
          aria-label="Асуулт илгээх"
          className="flex h-11 w-11 items-center justify-center rounded-2xl bb-bg-E0679F text-white active:scale-95 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
      <p className="mt-2 flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-400">
        <MessageCircle className="h-3 w-3" /> Яриагаа үргэлжлүүлэн асуугаарай
      </p>
    </Card>
  );
}

function ChatBubble({ role, children }) {
  const mine = role === "user";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[88%] rounded-3xl px-3.5 py-2.5 text-sm font-semibold leading-relaxed ${mine ? "bb-bg-FDE7F1 text-slate-700 rounded-br-lg" : "bg-white border border-slate-100 text-slate-600 rounded-bl-lg"}`}>
        {children}
      </div>
    </div>
  );
}
