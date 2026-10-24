"use client";

/**
 * Найзууд · Хэрэглэлийн SOS — хэрэглэл дуусахад бүлгийн найзууддаа нэг товшилтоор дохио илгээнэ.
 * Өгөгдөл: context/FriendsContext.jsx · Database: supabase/friends.sql
 */

import { useRef, useState } from "react";
import { Users, Plus, Lock, Copy, Check, UserPlus, Loader2, Heart, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { useFriends } from "../../../context/FriendsContext";
import { GROUP_EMOJIS, PLACE_MAX } from "../../../lib/friends";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";
import SosCallButton from "./SosCallButton";
import FriendReplies from "./FriendReplies";
import IncomingSosCard from "./IncomingSosCard";
import AvatarCard from "../avatar/AvatarCard";
import Avatar from "../avatar/Avatar";

const Label = ({ children }) => (
  <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2">{children}</p>
);

const chip = (on, onCls, offCls = "bg-white border-slate-100 text-slate-500") =>
  `px-3 py-1.5 rounded-full text-xs font-extrabold border-2 transition ${on ? onCls : offCls}`;

export default function FriendsScreen() {
  const { setToast } = useFamily();
  const F = useFriends();
  const { friends, groups, activeGroup, sosStage, placeInfo } = F;
  const nameOf = (id) => friends.find((f) => f.id === id)?.display_name ?? "…";

  return (
    <div className="space-y-4 pb-2">
      {/* ---------- Гарчиг (жижиг) ---------- */}
      <div className="flex items-center gap-3 bloom-fade">
        <div className="w-10 h-10 rounded-2xl bb-grad-sos-soft border bb-border-F8D3E6 flex items-center justify-center shrink-0">
          <Heart className="w-5 h-5 bb-text-B83B7E fill-current" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.16em] bb-text-B83B7E">Найзууд · SOS</p>
          <h2 className="text-xl leading-tight font-black text-slate-800">Пад хэрэгтэй юу?</h2>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-100 px-2.5 py-1 text-xs font-extrabold text-slate-500 shrink-0">
          <Users className="w-3.5 h-3.5 bb-text-7C4DCC" /> {friends.length}
        </span>
      </div>

      <IncomingSosCard />

      {/* ---------- SOS илгээх (жижиг) ---------- */}
      <Card className="!p-4 bb-grad-7">
        <Label>Хэнд илгээх вэ?</Label>
        {groups.length ? (
          <div className="flex flex-wrap gap-2">
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => F.setActiveGroupId(g.id)}
                className={chip(
                  activeGroup?.id === g.id,
                  "bb-bg-F48FB1 border-transparent text-white",
                  "bg-white bb-border-F8D3E6 text-slate-500",
                )}
              >
                {g.emoji} {g.name}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm font-semibold text-slate-400">
            {friends.length
              ? "Бүлэг алга байна — доороос үүсгээрэй."
              : "Эхлээд найзаа кодоор нэмээд бүлэг үүсгээрэй."}
          </p>
        )}

        <label
          htmlFor="sos-place"
          className="block mt-3 mb-2 text-xs font-extrabold uppercase tracking-widest text-slate-400"
        >
          Хаана байна?
        </label>
        <input
          id="sos-place"
          value={F.place}
          onChange={(e) => F.setPlace(e.target.value.slice(0, PLACE_MAX))}
          maxLength={PLACE_MAX}
          placeholder="ж: 2-р давхрын бие засах газар"
          autoComplete="off"
          className="w-full rounded-2xl border-2 border-slate-100 bg-white px-4 py-2.5 font-bold text-slate-700 outline-none bb-focus-border-F48FB1"
        />

        <div className="mt-4 flex items-center gap-4">
          <SosCallButton size={84} stage={sosStage} onClick={F.sendSos} />
          <div className="flex-1 min-w-0">
            <p className="text-lg font-black text-slate-800 leading-tight">
              {sosStage === "ringing"
                ? "Дохио илгээж байна…"
                : sosStage === "sent"
                  ? "Дохио очлоо 📣"
                  : "Пад хэрэгтэй байна"}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500 leading-snug">
              {sosStage === "idle"
                ? activeGroup
                  ? `Товчийг дарахад «${activeGroup.name}» бүлгийн ${activeGroup.members.length} найзад очно.`
                  : "Эхлээд бүлэг үүсгээрэй."
                : placeInfo.short
                  ? `📍 ${placeInfo.short} — найзууддаа мэдэгдлээ.`
                  : "Найзууддаа мэдэгдлээ."}
            </p>
          </div>
        </div>

        <FriendReplies />
        {sosStage === "sent" && (
          <button
            onClick={F.resolveSos}
            className="mt-3 w-full rounded-2xl py-3 font-extrabold bb-bg-FDE7F1 bb-text-B83B7E active:scale-95 transition"
          >
            Болсон, баярлалаа 💗
          </button>
        )}
      </Card>

            {/* ---------- Миний дүр · Алхалт · Дэлгүүр ---------- */}
      <AvatarCard />

      {/* ---------- Найзууд + бүлгүүд нэг дор ---------- */}
      <Card>
        <MyFriends setToast={setToast} />
        <div className="my-5 border-t border-slate-100" />
        <MyGroups nameOf={nameOf} />
      </Card>
    </div>
  );
}

/* ================= Миний найзууд: код, нэмэх, жагсаалт ================= */

function MyFriends({ setToast }) {
  const { friendCode, friends, addFriend, removeFriend } = useFriends();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

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
      <SectionTitle icon={UserPlus} title="Миний найзууд" />

      {friends.length > 0 && <FriendsAvatarCarousel friends={friends} />}

      <div className="flex items-center gap-2 rounded-2xl bb-bg-FDE7F1 p-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Миний найзын код</p>
          <p className="text-2xl font-black tracking-widest bb-text-B83B7E">{friendCode || "……"}</p>
        </div>
        <button
          onClick={copy}
          disabled={!friendCode}
          className="w-11 h-11 rounded-2xl bg-white bb-text-B83B7E flex items-center justify-center active:scale-90"
          aria-label="Найзын кодоо хуулах"
        >
          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
        </button>
      </div>
      <p className="mt-2 text-xs font-semibold text-slate-400">
        Энэ кодоо зөвхөн итгэдэг найздаа өг. Найз чинь кодыг чинь оруулахад та хоёр найз болно.
      </p>

      <form onSubmit={submit} className="mt-4 flex gap-2">
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

function FriendsAvatarCarousel({ friends }) {
  const listRef = useRef(null);

  const scroll = (direction) => {
    listRef.current?.scrollBy({ left: direction * 180, behavior: "smooth" });
  };

  return (
    <section aria-label="Найзуудын дүр" className="mt-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Найзуудын дүр</p>
        {friends.length > 1 && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => scroll(-1)}
              aria-label="Өмнөх найзын дүр"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-100 text-slate-500"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label="Дараагийн найзын дүр"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-100 text-slate-500"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      <div
        ref={listRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2"
      >
        {friends.map((friend) => (
          <div
            key={friend.id}
            className="flex w-28 shrink-0 snap-start flex-col items-center rounded-2xl border border-slate-100 bg-white px-2 pt-2"
          >
            <Avatar look={friend.avatar_look} skin={friend.avatar_skin} idle size={76} />
            <p className="w-full truncate pb-2 text-center text-xs font-extrabold text-slate-600">
              {friend.display_name}
            </p>
          </div>
        ))}
      </div>
    </section>
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
        <Lock className="w-3.5 h-3.5 shrink-0" /> Бүлэгт чат байхгүй — зөвхөн SOS дохио очно.
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
