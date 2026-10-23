"use client";

/**
 * Найзууд · Пад SOS — пад дуусахад бүлгийн найзууддаа нэг товшилтоор дохио илгээнэ.
 * Өгөгдөл: context/FriendsContext.jsx · Database: supabase/friends.sql
 */

import { useState } from "react";
import { Bell, Users, Plus, Lock, Copy, Check, UserPlus, Loader2, Heart, ShieldCheck } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { useFriends } from "../../../context/FriendsContext";
import { GROUP_EMOJIS, SOS_PLACES } from "../../../lib/friends";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";
import SosCallButton from "./SosCallButton";
import FriendReplies from "./FriendReplies";
import IncomingSosCard from "./IncomingSosCard";

const Label = ({ children }) => (
  <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2">{children}</p>
);

const chip = (on, onCls, offCls = "bg-white border-slate-100 text-slate-500") =>
  `px-3 py-1.5 rounded-full text-xs font-extrabold border-2 transition ${on ? onCls : offCls}`;

export default function FriendsScreen() {
  const { profile, setToast } = useFamily();
  const F = useFriends();
  const { friends, groups, activeGroup, sosStage, placeInfo } = F;
  const nameOf = (id) => friends.find((f) => f.id === id)?.display_name ?? "…";

  return (
    <div className="space-y-5 pb-2">
      <section className="relative overflow-hidden rounded-[2rem] bb-grad-sos-soft border bb-border-F8D3E6 px-5 py-5 shadow-sm bloom-fade">
        <span className="absolute -right-7 -top-10 h-36 w-36 rounded-full bg-white/50" />
        <span className="absolute right-16 -bottom-10 h-24 w-24 rounded-full bb-bg-E9DDFC-60" />
        <div className="relative flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/80 shadow-sm flex items-center justify-center shrink-0">
            <Heart className="w-6 h-6 bb-text-B83B7E fill-current" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.16em] bb-text-B83B7E">Найзууд · SOS</p>
            <h2 className="mt-1 text-2xl leading-tight font-black text-slate-800">Бие биедээ тусалъя</h2>
            <p className="mt-1 text-sm font-semibold text-slate-600 leading-snug">Пад хэрэгтэй үедээ итгэдэг найзууддаа дохио илгээгээрэй.</p>
          </div>
        </div>
        <div className="relative mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-extrabold text-slate-600"><Users className="w-3.5 h-3.5 bb-text-7C4DCC" /> {friends.length} найз</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-extrabold text-slate-600"><ShieldCheck className="w-3.5 h-3.5 bb-text-B83B7E" /> Зөвхөн бүлэгт</span>
        </div>
      </section>

      <IncomingSosCard />

      {/* ---------- SOS илгээх ---------- */}
      <Card className="!p-5 bb-grad-7">
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

        <div className="mt-4">
          <Label>Хаана байна?</Label>
        </div>
        <div className="flex flex-wrap gap-2">
          {SOS_PLACES.map((p) => (
            <button
              key={p.id}
              onClick={() => F.setPlace(p.id)}
              className={chip(F.place === p.id, "bb-bg-E9DDFC bb-border-B794F4 bb-text-7C4DCC")}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center pt-7 pb-4">
          <SosCallButton size={140} stage={sosStage} onClick={F.sendSos} />
          <p className="mt-5 text-xl font-black text-slate-800">
            {sosStage === "ringing"
              ? "Дохио илгээж байна…"
              : sosStage === "sent"
                ? "Дохио очлоо 📣"
                : "Пад хэрэгтэй байна"}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-500 text-center max-w-xs leading-snug">
            {sosStage === "idle"
              ? activeGroup
                ? `Нэг товшилт л хангалттай — «${activeGroup.name}» бүлгийн ${activeGroup.members.length} найзад мэдэгдэл очно.`
                : "Эхлээд бүлэг үүсгээрэй."
              : `${placeInfo.short} байгаагаа найзууддаа мэдэгдлээ.`}
          </p>
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

      {/* ---------- Найзын утсанд хэрхэн харагдах ---------- */}
      <Card>
        <SectionTitle icon={Bell} title="Найзын утсанд ингэж очно" />
        <div className="rounded-[1.5rem] bb-grad-9 p-3 border bb-border-F8D3E6">
          <div className="rounded-xl bg-white/95 p-3 flex gap-3 items-start shadow-lg">
            <span className="w-9 h-9 rounded-xl bb-grad-sos flex items-center justify-center shrink-0 text-white text-lg">
              🌸
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between gap-2 text-xs font-bold text-slate-400">
                <span className="uppercase tracking-wider">Bloomy</span>
                <span>одоо</span>
              </div>
              <p className="text-sm font-extrabold text-slate-800 leading-snug">
                🆘 {profile?.display_name || "Чи"}: Яг одоо пад хэрэгтэй байна
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                📍 {placeInfo.short} · Нөөц байвал туслаарай
              </p>
              <div className="mt-2 flex gap-2">
                <span className="text-xs font-extrabold rounded-full px-3 py-1 bb-bg-F48FB1 text-white">
                  Надад байна
                </span>
                <span className="text-xs font-extrabold rounded-full px-3 py-1 bg-slate-100 text-slate-500">
                  Байхгүй
                </span>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-3 flex items-start justify-center gap-1.5 text-xs font-semibold text-slate-400 text-center leading-relaxed">
          <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" /> Найз чинь Bloomy дээр нэг товшилтоор хариулна. Дохио зөвхөн бүлгийн гишүүдэд очно.
        </p>
      </Card>

      <MyFriends setToast={setToast} />
      <MyGroups nameOf={nameOf} />
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
    <Card>
      <SectionTitle icon={UserPlus} title="Миний найзууд" />

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
    </Card>
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
    <Card>
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
    </Card>
  );
}
