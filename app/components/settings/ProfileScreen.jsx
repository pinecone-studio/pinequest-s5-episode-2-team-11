"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, LogOut, Pencil, Share2, Users } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";
import PageHeader from "../ui/PageHeader";
import MyFriendCode from "../friends/MyFriendCode";
import FamilyMemberPhoto from "../avatar/FamilyMemberPhoto";

export default function ProfileScreen() {
  const {
    profile,
    session,
    view,
    familyCode,
    linked,
    daughterName,
    daughters,
    selectedDaughterId,
    selectDaughter,
    copied,
    copyCode,
    shareCode,
    codeInput,
    setCodeInput,
    codeError,
    setCodeError,
    joinFamily,
    joining,
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
      <Card>
        
        <SectionTitle icon={Users} title="Гэр бүл" />
        {isMother ? (
          <>
            <p className="text-sm font-bold bb-text-B83B7E">
              {linked
                ? `✓ ${daughters.length} охин холбогдсон`
                : "Охидоо урих гэр бүлийн код"}
            </p>
            {daughters.length > 1 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-extrabold text-slate-500">Хянах охиноо сонгоно уу</p>
                <div className="flex flex-wrap gap-2">
                  {daughters.map((daughter) => (
                    <button
                      key={daughter.id}
                      type="button"
                      onClick={() => selectDaughter(daughter.id)}
                      aria-pressed={selectedDaughterId === daughter.id}
                      className={`flex items-center gap-2 rounded-full py-2 pl-2 pr-4 text-sm font-extrabold transition ${selectedDaughterId === daughter.id ? "bb-bg-E0679F text-white" : "bb-bg-FFF7FB bb-text-B83B7E"}`}
                    >
                      <FamilyMemberPhoto member={daughter} />
                      <span>{daughter.display_name || "Охин"}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-400">Сонгосон охины мөчлөг, халамжийн мэдээлэл харагдана.</p>
              </div>
            )}
            <div className="mt-3 flex items-center gap-2">
              <span className="flex-1 rounded-2xl bb-bg-FFF7FB py-3 text-center text-lg font-black tracking-wider text-slate-600">
                {familyCode || "…"}
              </span>
              <button
                onClick={copyCode}
                className="w-12 h-12 rounded-2xl bb-bg-FDE7F1 bb-text-B83B7E flex items-center justify-center active:scale-90"
                aria-label="Кодыг хуулах"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
              <button
                onClick={shareCode}
                className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-100 bb-text-B83B7E flex items-center justify-center active:scale-90"
                aria-label="Кодыг хуваалцах"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : linked ? (
          <>
            <p className="text-sm font-bold bb-text-B83B7E">✓ Асран хамгаалагчтайгаа холбогдсон</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="flex-1 rounded-2xl bb-bg-FFF7FB py-3 text-center text-lg font-black tracking-wider text-slate-600">
                {familyCode || "…"}
              </span>
              <button
                onClick={copyCode}
                className="w-12 h-12 rounded-2xl bb-bg-FDE7F1 bb-text-B83B7E flex items-center justify-center active:scale-90"
                aria-label="Кодыг хуулах"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
              <button
                onClick={shareCode}
                className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-100 bb-text-B83B7E flex items-center justify-center active:scale-90"
                aria-label="Кодыг хуваалцах"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold leading-relaxed text-slate-500">
              Асран хамгаалагчийнхаа Bloomy профайлаас гэр бүлийн кодыг аваад энд оруулж холбогдоорой.
            </p>
            <div className="mt-3 flex items-center rounded-2xl border-2 border-slate-100 bb-focus-within-border-F48FB1 bg-white overflow-hidden">
              <span className="pl-4 font-black bb-text-F48FB1">BLOOM-</span>
              <input
                id="family-code-join"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={codeInput}
                onChange={(event) => {
                  setCodeInput(event.target.value.replace(/\D/g, ""));
                  setCodeError("");
                }}
                onKeyDown={(event) => event.key === "Enter" && joinFamily()}
                className="flex-1 min-w-0 py-3 pr-4 pl-1 text-xl font-black tracking-widest text-slate-700 outline-none bg-transparent"
                placeholder="000000"
                aria-label="Асран хамгаалагчийн гэр бүлийн код"
              />
            </div>
            {codeError && (
              <p className="mt-2 text-sm font-semibold bb-text-7C4DCC flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {codeError}
              </p>
            )}
            <button
              onClick={joinFamily}
              disabled={codeInput.length !== 6 || joining}
              className="mt-3 w-full bb-bg-E0679F bb-disabled-bg-F8D3E6 text-white font-extrabold rounded-2xl py-3 active:scale-95 transition flex items-center justify-center gap-2"
            >
              {joining && <Loader2 className="w-5 h-5 animate-spin" />}
              Гэр бүлийн кодоор холбогдох
            </button>
          </>
        )}
      </Card>

      <MyFriendCode />
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
