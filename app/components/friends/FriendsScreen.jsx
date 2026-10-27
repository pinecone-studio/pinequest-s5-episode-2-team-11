"use client";

/**
 * Найзууд болон хэрэглэл хүсэх хэсэг.
 * Өгөгдөл: context/FriendsContext.jsx · Database: supabase/friends.sql
 */

import { useState } from "react";
import { Users, Plus, Lock, UserPlus, Loader2, ChevronRight, Phone, X } from "lucide-react";
import { useFriends } from "../../../context/FriendsContext";
import { GROUP_EMOJIS, PLACE_MAX } from "../../../lib/friends";
import { AVATAR_BACKGROUNDS } from "../../../lib/wardrobe";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";
import SosCallButton from "./SosCallButton";
import FriendReplies from "./FriendReplies";
import IncomingSosCard from "./IncomingSosCard";
import AvatarCard from "../avatar/AvatarCard";
import Avatar from "../avatar/Avatar";
import BottomSheet from "../ui/BottomSheet";

const Label = ({ children }) => (
  <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2">{children}</p>
);

const chip = (on, onCls, offCls = "bg-white border-slate-100 text-slate-500") =>
  `px-3 py-1.5 rounded-full text-xs font-extrabold border-2 transition ${on ? onCls : offCls}`;

export default function FriendsScreen() {

  const F = useFriends();
  const { friends, sosStage, outgoing, replyText } = F;
  const [sheet, setSheet] = useState(null); // "supplies" | "friends" | "groups"
  const nameOf = (id) => friends.find((f) => f.id === id)?.display_name ?? "…";
  const firstReply = outgoing?.responses?.[0];

  return (
    <div className="space-y-4 pb-2">
      {/* ---------- Гарчиг ---------- */}
      <div className="flex items-center justify-between gap-3 bloom-fade">
        <h2 className="text-2xl font-black text-slate-800">Найзууд</h2>
        <button
          onClick={() => setSheet("friends")}
          className="inline-flex items-center gap-1.5 rounded-full bb-bg-FDE7F1 bb-text-B83B7E px-3 py-2 text-xs font-extrabold active:scale-95 transition"
        >
          <UserPlus className="w-4 h-4" /> Найз нэмэх
        </button>
      </div>

      <IncomingSosCard />

      {/* ---------- Хэрэглэл хүсэх ---------- */}
      <button
        onClick={() => setSheet("supplies")}
        className="w-full flex items-center gap-3 rounded-3xl p-3 bb-grad-sos-soft border bb-border-F8D3E6 shadow-sm text-left active:scale-95 transition"
      >
        <span className="w-12 h-12 shrink-0 rounded-full bb-grad-sos text-white flex items-center justify-center shadow-md">
          <Phone className="w-5 h-5" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-black text-slate-800">
            {sosStage === "sent" ? "Дохио очлоо 📣" : sosStage === "ringing" ? "Илгээж байна…" : "хэрэглэл хэрэгтэй юу?"}
          </span>
          <span className="block text-xs font-semibold text-slate-500 bx-trunc">
            {firstReply ? `${firstReply.responder_name}: ${replyText(firstReply.reply)}` : "Найзууддаа хэрэглэл хэрэгтэйгээ мэдэгд"}
          </span>
        </span>
        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {/* ---------- Найзуудын дүр ---------- */}
      <Card className="!p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-black text-slate-800">
            Миний найзууд <span className="text-slate-400">· {friends.length}</span>
          </p>
          <button onClick={() => setSheet("groups")} className="text-xs font-extrabold bb-text-B83B7E">
            Бүлгүүд
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {friends.map((friend) => (
            <div key={friend.id} className="w-20 shrink-0 text-center">
              <div
                className="rounded-2xl overflow-hidden flex justify-center pt-1.5 border border-slate-100"
                style={{ background: AVATAR_BACKGROUNDS.find((o) => o.id === friend.avatar_background)?.background ?? AVATAR_BACKGROUNDS[0].background }}
              >
                <Avatar look={friend.avatar_look} skin={friend.avatar_skin} label={`${friend.display_name}-ийн дүр`} idle size={56} />
              </div>
              <p className="mt-1 truncate text-xs font-extrabold text-slate-600">{friend.display_name}</p>
            </div>
          ))}
          <button
            onClick={() => setSheet("friends")}
            className="w-20 shrink-0 flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed bb-border-F8D3E6 bb-text-B83B7E text-xs font-extrabold"
            style={{ minHeight: 112 }}
          >
            <Plus className="w-5 h-5" /> Нэмэх
          </button>
        </div>
      </Card>

      {/* ---------- Миний дүр · Алхалт · Дэлгүүр ---------- */}
      <AvatarCard />

      {sheet === "sos" && (
        <BottomSheet title="хэрэглэл хэрэгтэй юу?" onClose={() => setSheet(null)}>
          <SosPanel />
        </BottomSheet>
      )}
      {sheet === "friends" && (
        <BottomSheet title="Найз нэмэх" onClose={() => setSheet(null)}>
          <MyFriends />
        </BottomSheet>
      )}
      {sheet === "groups" && (
        <BottomSheet title="Бүлгүүд" onClose={() => setSheet(null)}>
          <MyGroups nameOf={nameOf} />
        </BottomSheet>
      )}
    </div>
  );
}

/* ================= Хэрэглэл хүсэлт илгээх ================= */

function SupplyRequestPanel() {
  const F = useFriends();
  const { friends, groups, sosStage, placeInfo } = F;
  const [ids, setIds] = useState([]);
  const toggle = (id) => setIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  if (!friends.length) {
    return <p className="py-6 text-center text-sm font-semibold text-slate-400">Эхлээд найзаа кодоор нэмээрэй 🌸</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Хэнд?</Label>
        <div className="flex flex-wrap gap-2">
          {groups.map((g) => {
            const on = g.members.length > 0 && g.members.length === ids.length && g.members.every((id) => ids.includes(id));
            return (
              <button key={g.id} onClick={() => setIds(g.members)} className={chip(on, "bb-bg-B794F4 border-transparent text-white")}>
                {g.emoji} {g.name}
              </button>
            );
          })}
          {friends.map((f) => (
            <button key={f.id} onClick={() => toggle(f.id)} className={chip(ids.includes(f.id), "bb-bg-F48FB1 border-transparent text-white")}>
              {ids.includes(f.id) ? "✓ " : ""}
              {f.display_name}
            </button>
          ))}
        </div>
      </div>

      <input
        value={F.place}
        onChange={(e) => F.setPlace(e.target.value.slice(0, PLACE_MAX))}
        maxLength={PLACE_MAX}
        placeholder="📍 Хаана байна? (заавал биш)"
        aria-label="Хаана байна?"
        autoComplete="off"
        className="w-full rounded-2xl border-2 border-slate-100 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 outline-none bb-focus-border-F48FB1"
      />

      <div className="flex items-center gap-4">
        <SosCallButton size={72} stage={sosStage} disabled={!ids.length} onClick={() => F.sendSos(ids)} />
        <p className="flex-1 text-sm font-semibold text-slate-500 leading-snug">
          {sosStage === "ringing"
            ? "Дохио илгээж байна…"
            : sosStage === "sent"
              ? placeInfo.short
                ? `📍 ${placeInfo.short} — найзууддаа мэдэгдлээ.`
                : "Найзууддаа мэдэгдлээ."
              : ids.length
                ? `${ids.length} найзад дохио очно. Товчийг дар.`
                : "Хэнд илгээхээ сонго."}
        </p>
      </div>

      <FriendReplies />
      {sosStage === "sent" && (
        <button onClick={F.resolveSos} className="w-full rounded-2xl py-3 font-extrabold bb-bg-FDE7F1 bb-text-B83B7E active:scale-95 transition">
          Болсон, баярлалаа 💗
        </button>
      )}
    </div>
  );
}

/* ================= Миний найзууд: код, нэмэх, жагсаалт ================= */

function MyFriends() {
  const { friends, addFriend, removeFriend } = useFriends();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (code.trim().length !== 6 || busy) return;
    setBusy(true);
    const err = await addFriend(code);
    setBusy(false);
    setError(err ?? "");
    if (!err) setCode("");
  };

  return (
    <div>
      <p className="text-xs font-semibold text-slate-400">
        Найзынхаа кодыг оруулаарай. Өөрийн код чинь <b>Профайл</b> хэсэгт байгаа.
      </p>

      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input
          id="friend-code"
          value={code}
          onChange={(e) => {
            setCode(
              e.target.value
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "")
                .slice(0, 6),
            );
            setError("");
          }}
          placeholder="Найзын код"
          autoComplete="off"
          aria-label="Найзын код"
          className="flex-1 min-w-0 rounded-2xl border-2 border-slate-100 bg-white px-4 py-3 font-black tracking-widest text-slate-700 outline-none bb-focus-border-F48FB1"
        />
        <button
          disabled={code.length !== 6 || busy}
          className="px-4 rounded-2xl bb-grad-sos text-white font-extrabold disabled:opacity-50 flex items-center gap-1"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Нэмэх
        </button>
      </form>
      {error && <p className="mt-2 text-sm font-semibold bb-text-7C4DCC">{error}</p>}

      <div className="mt-4 space-y-2">
        {friends.length === 0 ? (
          <p className="text-sm font-semibold text-slate-400 text-center py-2">Одоогоор найз алга байна 🌸</p>
        ) : (
          friends.map((f) => (
            <div key={f.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2">
              <span className="w-9 h-9 rounded-full bb-bg-E9DDFC bb-text-7C4DCC font-black flex items-center justify-center shrink-0">
                {f.display_name.charAt(0)}
              </span>
              <span className="flex-1 min-w-0 font-extrabold text-slate-700 bx-trunc">{f.display_name}</span>
              <button
                onClick={() => {
                  if (confirmId !== f.id) return setConfirmId(f.id);
                  setConfirmId(null);
                  removeFriend(f);
                }}
                className={`text-xs font-extrabold rounded-full px-3 py-1.5 transition ${
                  confirmId === f.id ? "bb-bg-F48FB1 text-white" : "bg-white text-slate-400"
                }`}
              >
                {confirmId === f.id ? "Дахин дарж хас" : "Хасах"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ================= Миний бүлгүүд ================= */

function MyGroups({ nameOf }) {
  const { friends, groups, activeGroup, setActiveGroupId, createGroup, toggleMember, deleteGroup } =
    useFriends();
  const [editingId, setEditingId] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", emoji: "💗", members: [] });
  const canCreate = draft.name.trim() && draft.members.length > 0;

  const create = async () => {
    if (!canCreate) return;
    const ok = await createGroup({ name: draft.name, emoji: draft.emoji, memberIds: draft.members });
    if (ok) {
      setCreating(false);
      setDraft({ name: "", emoji: "💗", members: [] });
    }
  };

  return (
    <div>
      <SectionTitle
        icon={Users}
        title="Миний бүлгүүд"
        right={
          !creating && (
            <button
              onClick={() => setCreating(true)}
              disabled={!friends.length}
              className="text-xs font-extrabold bb-text-B83B7E bb-bg-FDE7F1 rounded-full px-3 py-1.5 flex items-center gap-1 active:scale-95 disabled:opacity-50"
            >
              <Plus className="w-3 h-3" /> Бүлэг үүсгэх
            </button>
          )
        }
      />

      <div className="space-y-2">
        {groups.map((g) => {
          const on = activeGroup?.id === g.id;
          const editing = editingId === g.id;
          const last = g.members.length <= 1;
          const others = friends.filter((f) => !g.members.includes(f.id));
          return (
            <div
              key={g.id}
              className={`rounded-2xl border-2 transition ${on ? "bb-border-F48FB1 bb-bg-FDE7F1-50" : "border-slate-100 bg-white"}`}
            >
              <div className="flex items-center gap-3 p-3">
                <button
                  onClick={() => setActiveGroupId(g.id)}
                  className="flex-1 min-w-0 flex items-center gap-3 text-left"
                >
                  <span className="w-11 h-11 rounded-2xl bb-bg-E9DDFC flex items-center justify-center text-xl shrink-0">
                    {g.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-slate-700">{g.name}</p>
                    <p className="text-xs font-semibold text-slate-400 bx-trunc">
                      {g.members.length} найз · {g.members.map(nameOf).join(", ")}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setEditingId(editing ? null : g.id);
                    setConfirmDel(null);
                  }}
                  className={`text-xs font-extrabold rounded-full px-3 py-1.5 shrink-0 active:scale-95 transition ${
                    editing ? "bb-bg-F48FB1 text-white" : "bb-bg-E9DDFC bb-text-7C4DCC"
                  }`}
                >
                  {editing ? "Болсон" : "Засах"}
                </button>
              </div>

              {editing && (
                <div className="px-3 pb-3 space-y-3 bloom-pop">
                  <div>
                    <Label>Гишүүд · дарж хасна</Label>
                    <div className="flex flex-wrap gap-2">
                      {g.members.map((id) => (
                        <button
                          key={id}
                          onClick={() => toggleMember(g, { id, display_name: nameOf(id) })}
                          disabled={last}
                          aria-label={`${nameOf(id)}-г бүлгээс хасах`}
                          className={`px-3 py-1.5 rounded-full text-xs font-extrabold border-2 border-transparent bb-bg-B794F4 text-white transition ${
                            last ? "opacity-60" : "active:scale-95"
                          }`}
                        >
                          {nameOf(id)}
                          {last ? "" : " ×"}
                        </button>
                      ))}
                    </div>
                    {last && (
                      <p className="mt-2 text-xs font-semibold text-slate-400">
                        Бүлэгт хамгийн багадаа 1 найз байх ёстой.
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Найз нэмэх</Label>
                    {others.length ? (
                      <div className="flex flex-wrap gap-2">
                        {others.map((f) => (
                          <button
                            key={f.id}
                            onClick={() => toggleMember(g, f)}
                            className="px-3 py-1.5 rounded-full text-xs font-extrabold border-2 bg-white border-slate-100 text-slate-500 active:scale-95 transition"
                          >
                            + {f.display_name}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs font-semibold text-slate-400">
                        Бүх найз чинь энэ бүлэгт байна 💗
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (confirmDel !== g.id) return setConfirmDel(g.id);
                      setEditingId(null);
                      deleteGroup(g);
                    }}
                    className={`w-full rounded-2xl py-2.5 text-sm font-extrabold transition active:scale-95 ${
                      confirmDel === g.id
                        ? "bb-bg-F48FB1 text-white"
                        : "bg-white border-2 bb-border-F8D3E6 bb-text-B83B7E"
                    }`}
                  >
                    {confirmDel === g.id ? "Дахин дарж устгана уу" : "Бүлэг устгах"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-slate-400">
        <Lock className="w-3.5 h-3.5 shrink-0" /> Бүлэгт чат байхгүй — зөвхөн хэрэглэл хүссэн мэдэгдэл очно.
      </p>

      {creating && (
        <div className="mt-4 rounded-2xl border-2 border-dashed bb-border-F8D3E6 p-4 space-y-3 bloom-pop">
          <p className="font-extrabold text-slate-700">Шинэ бүлэг</p>
          <input
            id="group-name"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="Бүлгийн нэр (ж: Ангийн охид)"
            maxLength={24}
            className="w-full rounded-xl border-2 border-slate-100 bg-white px-3 py-2.5 font-bold text-slate-700 outline-none bb-focus-border-F48FB1"
          />
          <div className="flex gap-2">
            {GROUP_EMOJIS.map((em) => (
              <button
                key={em}
                onClick={() => setDraft((d) => ({ ...d, emoji: em }))}
                aria-label={"Бүлгийн тэмдэг " + em}
                className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border-2 ${
                  draft.emoji === em ? "bb-border-F48FB1 bb-bg-FDE7F1" : "border-slate-100 bg-white"
                }`}
              >
                {em}
              </button>
            ))}
          </div>
          <Label>Найзуудаа сонго</Label>
          <div className="flex flex-wrap gap-2">
            {friends.map((f) => {
              const on = draft.members.includes(f.id);
              return (
                <button
                  key={f.id}
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      members: on ? d.members.filter((x) => x !== f.id) : [...d.members, f.id],
                    }))
                  }
                  className={chip(on, "bb-bg-B794F4 border-transparent text-white")}
                >
                  {on ? "✓ " : "+ "}
                  {f.display_name}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setCreating(false)}
              className="flex-1 rounded-2xl py-3 font-extrabold bg-slate-100 text-slate-500"
            >
              Болих
            </button>
            <button
              onClick={create}
              disabled={!canCreate}
              className={`flex-1 rounded-2xl py-3 font-extrabold text-white bb-grad-sos transition ${
                canCreate ? "active:scale-95" : "opacity-60"
              }`}
            >
              Үүсгэх
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
