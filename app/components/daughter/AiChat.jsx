"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircleHeart, Send, Trash2, ShieldCheck } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { autoReply } from "../../../lib/chat-replies";
import { askAi } from "../../../lib/ai-client";
import { supabase } from "../../../lib/supabase";
import SectionTitle from "../ui/SectionTitle";
import Card from "../ui/Card";
import ChatAvatar from "./ChatAvatar";

const STARTERS = [
  "Сарын тэмдэг гэж юу вэ? 🌸",
  "Найзтайгаа муудалцчихлаа 😔",
  "Хичээлдээ яаж төвлөрөх вэ? 📚",
  "Өөртөө итгэлтэй болохыг хүсч байна ✨",
];

const GREETING =
  "Сайн уу! Би Блүми эгч байна 🌷 Бие махбод, сэтгэл санаа, найз нөхөд, сургууль — юу ч хамаагүй асуугаарай. Ичих зүйл огт байхгүй 💗";

export default function AiChat() {
  const { session } = useFamily();
  const userId = session?.user?.id;
  const storageKey = `bloom:chat:${userId ?? "guest"}`;
  // Нэвтэрсэн үед Supabase-ийн chat_messages (supabase/chat-messages.sql), эс бөгөөс энэ утсан дээр
  const useDb = Boolean(supabase && userId);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [typing, setTyping] = useState(null); // { index, shown } — бичигдэж буй хариу
  const [chips, setChips] = useState([]);
  const listRef = useRef(null);

  useEffect(() => {
    if (useDb) {
      let cancelled = false;
      supabase
        .from("chat_messages")
        .select("role, content")
        .eq("user_id", userId)
        .order("id", { ascending: false })
        .limit(40)
        .then(({ data, error }) => {
          if (error) console.warn("[chat_messages] load:", error.message);
          if (!cancelled && data) setMessages(data.reverse());
        });
      return () => {
        cancelled = true;
      };
    }
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
      if (Array.isArray(saved)) setMessages(saved);
    } catch {
      /* localStorage боломжгүй */
    }
  }, [storageKey, useDb, userId]);

  useEffect(() => {
    if (useDb) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages.slice(-40)));
    } catch {
      /* localStorage боломжгүй */
    }
  }, [messages, storageKey, useDb]);

  const saveToDb = async (rows) => {
    if (!useDb) return;
    const { error } = await supabase.from("chat_messages").insert(rows.map((m) => ({ ...m, user_id: userId })));
    if (error) console.warn("[chat_messages] save:", error.message);
  };

  // Хариуг үсэг үсгээр гаргана — энэ үед аватар ярьж байгаа мэт хөдөлнө
  useEffect(() => {
    if (!typing) return;
    const full = messages[typing.index]?.content ?? "";
    if (typing.shown >= full.length) {
      setTyping(null);
      return;
    }
    const t = setTimeout(() => setTyping({ ...typing, shown: typing.shown + 2 }), 28);
    return () => clearTimeout(t);
  }, [typing, messages]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, thinking, typing]);

  const busy = thinking || Boolean(typing);

  const send = async (text) => {
    const content = text.trim();
    if (!content || busy) return;
    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setDraft("");
    setChips([]);
    setThinking(true);
    // Аюулын сэдэвт тогтмол хариу (тусламжийн утас) өгнө, бусад үед AI
    const fallback = autoReply(content);
    let reply = fallback.reply;
    let nextChips = fallback.chips;
    if (fallback.urgent) {
      await new Promise((r) => setTimeout(r, 600));
    } else {
      const ai = await askAi(session, { type: "daughter_chat", messages: next.slice(-8) }, 30000);
      if (typeof ai?.reply === "string" && ai.reply.trim()) {
        reply = ai.reply.trim();
        nextChips = Array.isArray(ai.chips) ? ai.chips : [];
      }
    }
    setThinking(false);
    setMessages([...next, { role: "assistant", content: reply }]);
    setChips(nextChips);
    setTyping({ index: next.length, shown: 0 });
    saveToDb([
      { role: "user", content },
      { role: "assistant", content: reply },
    ]);
  };

  const clear = () => {
    setMessages([]);
    setTyping(null);
    setChips([]);
    if (useDb) {
      supabase
        .from("chat_messages")
        .delete()
        .eq("user_id", userId)
        .then(({ error }) => {
          if (error) console.warn("[chat_messages] clear:", error.message);
        });
    }
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* localStorage боломжгүй */
    }
  };

  return (
    <Card>
      <SectionTitle
        icon={MessageCircleHeart}
        title="Блүми эгчээс асуу"
        right={
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={clear}
                className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center active:scale-90"
                aria-label="Яриаг устгах"
              >
                <Trash2 className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
        }
      />

      {/* Аватар */}
      <div className="flex items-center gap-3 rounded-3xl bb-grad-4 p-3">
        <ChatAvatar talking={Boolean(typing)} />
        <div className="flex-1">
          <p className="font-black text-slate-700">Блүми эгч</p>
          <p className="text-xs font-semibold text-slate-500">
            {thinking ? "Бодож байна…" : typing ? "Ярьж байна…" : "Чиний итгэлт найз 🌷"}
          </p>
        </div>
      </div>

      {/* Мессежүүд */}
      <div ref={listRef} className="mt-3 max-h-96 overflow-y-auto space-y-3 pr-1">
        <Bubble role="assistant">{GREETING}</Bubble>
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role}>
            {typing?.index === i ? m.content.slice(0, typing.shown) : m.content}
          </Bubble>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 rounded-3xl rounded-bl-lg px-4 py-3 flex gap-1.5">
              {[0, 150, 300].map((d) => (
                <span
                  key={d}
                  className="w-2 h-2 rounded-full bb-bg-F48FB1 animate-bounce"
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
            </div>
          </div>
        )}
        {!busy && (messages.length === 0 || chips.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {(messages.length === 0 ? STARTERS : chips).map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-xs font-extrabold rounded-full px-3 py-2 bg-white border bb-border-E9DDFC text-slate-600 active:scale-95 transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Бичих хэсэг */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="mt-3"
      >
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={600}
            placeholder="Асуух зүйлээ бичээрэй…"
            aria-label="Мессеж"
            className="flex-1 min-w-0 rounded-2xl bb-bg-FFF7FB border-2 bb-border-E9DDFC px-4 py-3 text-sm font-semibold outline-none bb-focus-border-F48FB1"
          />
          <button
            type="submit"
            disabled={!draft.trim() || busy}
            className="w-12 rounded-2xl bb-bg-E0679F text-white flex items-center justify-center active:scale-95 transition disabled:opacity-40"
            aria-label="Илгээх"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="mt-2 flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-400">
          <ShieldCheck className="w-3 h-3" /> Хувийн мэдээллээ бүү хуваалц
        </p>
      </form>
    </Card>
  );
}

function Bubble({ role, children }) {
  const mine = role === "user";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <p
        className={`max-w-[85%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm font-semibold leading-relaxed ${
          mine
            ? "bb-bg-E0679F text-white rounded-br-lg"
            : "bg-white text-slate-700 border border-slate-100 rounded-bl-lg"
        }`}
      >
        {children}
      </p>
    </div>
  );
}
