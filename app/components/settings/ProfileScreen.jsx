"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, LogOut } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";
import PageHeader from "../ui/PageHeader";
import MyFriendCode from "../friends/MyFriendCode";
import FamilyLinkingSection from "./FamilyLinkingSection";

export default function ProfileScreen() {
  const {
    profile,
    session,
    view,
    updateName,
    updateEmail,
    setToast,
    signOut,
  } = useFamily();
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(profile?.display_name ?? "");
  const [emailInput, setEmailInput] = useState(session?.user?.email ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState("");
  const photoInput = useRef(null);
  const isMother = view === "mother";

  useEffect(() => {
    if (!profile?.id) {
      setProfilePhoto("");
      return;
    }
    setProfilePhoto(localStorage.getItem(`bloomy:profile-photo:${profile.id}`) ?? "");
  }, [profile?.id]);

  const changeProfilePhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !profile?.id) return;

    try {
      const url = URL.createObjectURL(file);
      const photo = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement("canvas");
          const size = Math.min(image.naturalWidth, image.naturalHeight);
          canvas.width = 256;
          canvas.height = 256;
          const context = canvas.getContext("2d");
          context.drawImage(
            image,
            (image.naturalWidth - size) / 2,
            (image.naturalHeight - size) / 2,
            size,
            size,
            0,
            0,
            256,
            256,
          );
          URL.revokeObjectURL(url);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        };
        image.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("Unable to read image"));
        };
        image.src = url;
      });
      localStorage.setItem(`bloomy:profile-photo:${profile.id}`, photo);
      setProfilePhoto(photo);
      setToast("Профайл зураг шинэчлэгдлээ 📷");
    } catch {
      setToast("Зураг хадгалж чадсангүй. Өөр зураг сонгоод үзээрэй.");
    }
    event.target.value = "";
  };
  return (
    <div className="space-y-4">
      <PageHeader sub={isMother ? "Асран хамгаалагчийн бүртгэл" : "Миний бүртгэл"} title="Профайл" />

      <p className="text-sm font-bold text-slate-400">Профайл</p>

      <Card className="p-5">
        <div className="flex flex-col items-center text-center">
          <span className="relative mb-3 h-24 w-24">
            <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bb-bg-FDE7F1 text-5xl">
              {profilePhoto ? <img src={profilePhoto} alt="Профайл зураг" className="h-full w-full object-cover" /> : isMother ? "🤝" : "🌱"}
            </span>
            <input ref={photoInput} type="file" accept="image/*" onChange={changeProfilePhoto} className="hidden" aria-label="Профайл зураг сонгох" />
            <button
              type="button"
              onClick={() => photoInput.current?.click()}
              aria-label="Профайл зураг солих"
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white text-slate-500 shadow-sm"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </span>

          {editingName ? (
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                setSavingProfile(true);
                const nameSaved = await updateName(name);
                const emailSaved = nameSaved && await updateEmail(emailInput);
                setSavingProfile(false);
                if (emailSaved) {
                  if (emailInput.trim() === session?.user?.email) setToast("Профайлын мэдээлэл хадгалагдлаа ✓");
                  setEditingName(false);
                }
              }}
              className="w-full space-y-3 text-left"
            >
              <label className="block text-xs font-extrabold text-slate-500" htmlFor="profile-name">Хэрэглэгчийн нэр</label>
              <input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={40} required className="w-full rounded-2xl border-2 border-slate-100 bb-focus-border-F48FB1 bg-white px-4 py-3 font-bold text-slate-700 outline-none" />
              <label className="block text-xs font-extrabold text-slate-500" htmlFor="profile-email">Gmail / имэйл</label>
              <input id="profile-email" type="email" value={emailInput} onChange={(event) => setEmailInput(event.target.value)} required className="w-full rounded-2xl border-2 border-slate-100 bb-focus-border-F48FB1 bg-white px-4 py-3 font-bold text-slate-700 outline-none" />
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setEditingName(false)} disabled={savingProfile} className="flex-1 rounded-2xl bg-slate-100 py-3 font-extrabold text-slate-500">Болих</button>
                <button type="submit" disabled={savingProfile} className="flex-1 rounded-2xl bb-bg-E0679F py-3 font-extrabold text-white disabled:opacity-60">{savingProfile ? "Хадгалж байна…" : "Хадгалах"}</button>
              </div>
            </form>
          ) : (
            <>
              <h3 className="max-w-full truncate text-xl font-black text-slate-700">{profile?.display_name || "—"}</h3>
              <button
                type="button"
                onClick={() => {
                  setName(profile?.display_name ?? "");
                  setEmailInput(session?.user?.email ?? "");
                  setEditingName(true);
                }}
                className="mt-3 flex items-center gap-2 rounded-xl bb-bg-FDE7F1 px-4 py-2 text-sm font-extrabold bb-text-B83B7E"
              >
                <Pencil className="h-4 w-4" /> Засах
              </button>
            </>
          )}
        </div>
      </Card>

      <MyFriendCode />
      <FamilyLinkingSection />
      <button
        type="button"
        onClick={signOut}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-100 bg-white py-3 font-extrabold bb-text-7C4DCC transition active:scale-95"
      >
        <LogOut className="h-4 w-4" /> Гарах
      </button>
    </div>
  );
}
