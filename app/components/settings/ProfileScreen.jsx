"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Copy, Loader2, LogOut, Pencil, Share2, Users } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";
import PageHeader from "../ui/PageHeader";
import MyFriendCode from "../friends/MyFriendCode";
import FamilyLinkingSection from "./FamilyLinkingSection";
import { t } from "../../../lib/i18n";

export default function ProfileScreen() {
  const {
    profile,
    session,
    view,
    guardianGender,
    updateName,
    updateGuardianGender,
    updateEmail,
    setToast,
    signOut,
  } = useFamily();
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(profile?.display_name ?? "");
  const [emailInput, setEmailInput] = useState(session?.user?.email ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingGender, setSavingGender] = useState(false);
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
      setToast(t("Профайл зураг шинэчлэгдлээ 📷", "Profile photo updated 📷"));
    } catch {
      setToast(t("Зураг хадгалж чадсангүй. Өөр зураг сонгоод үзээрэй.", "Couldn't save the photo. Try a different one."));
    }
    event.target.value = "";
  };
  return (
    <div className="space-y-4">
      <PageHeader sub={isMother ? t("Асран хамгаалагчийн бүртгэл", "Guardian account") : t("Миний бүртгэл", "My account")} title={t("Профайл", "Profile")} />

      <p className="text-sm font-bold text-slate-400">{t("Профайл", "Profile")}</p>

      <Card className="p-5">
        <div className="flex flex-col items-center text-center">
          <span className="relative mb-3 h-24 w-24">
            <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bb-bg-FDE7F1 text-5xl">
              {profilePhoto ? <img src={profilePhoto} alt={t("Профайл зураг", "Profile photo")} className="h-full w-full object-cover" /> : isMother ? "🤝" : "🌱"}
            </span>
            <input ref={photoInput} type="file" accept="image/*" onChange={changeProfilePhoto} className="hidden" aria-label={t("Профайл зураг сонгох", "Choose profile photo")} />
            <button
              type="button"
              onClick={() => photoInput.current?.click()}
              aria-label={t("Профайл зураг солих", "Change profile photo")}
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
                  if (emailInput.trim() === session?.user?.email) setToast(t("Профайлын мэдээлэл хадгалагдлаа ✓", "Profile saved ✓"));
                  setEditingName(false);
                }
              }}
              className="w-full space-y-3 text-left"
            >
              <label className="block text-xs font-extrabold text-slate-500" htmlFor="profile-name">{t("Хэрэглэгчийн нэр", "Username")}</label>
              <input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={40} required className="w-full rounded-2xl border-2 border-slate-100 bb-focus-border-F48FB1 bg-white px-4 py-3 font-bold text-slate-700 outline-none" />
              <label className="block text-xs font-extrabold text-slate-500" htmlFor="profile-email">{t("Gmail / имэйл", "Gmail / email")}</label>
              <input id="profile-email" type="email" value={emailInput} onChange={(event) => setEmailInput(event.target.value)} required className="w-full rounded-2xl border-2 border-slate-100 bb-focus-border-F48FB1 bg-white px-4 py-3 font-bold text-slate-700 outline-none" />
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setEditingName(false)} disabled={savingProfile} className="flex-1 rounded-2xl bg-slate-100 py-3 font-extrabold text-slate-500">{t("Болих", "Cancel")}</button>
                <button type="submit" disabled={savingProfile} className="flex-1 rounded-2xl bb-bg-E0679F py-3 font-extrabold text-white disabled:opacity-60">{savingProfile ? t("Хадгалж байна…", "Saving…") : t("Хадгалах", "Save")}</button>
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
                <Pencil className="h-4 w-4" /> {t("Засах", "Edit")}
              </button>
            </>
          )}
        </div>
      </Card>

      {isMother && (
        <Card className="!p-4">
          <h2 className="text-sm font-black text-slate-700">{t("Танд тохирох зөвлөгөө", "Tips for you")}</h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">
            {t("Энэ мэдээлэл зөвхөн таны зөвлөгөөг тохируулахад ашиглагдана.", "This is only used to tailor your tips.")}
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2">
            {[
              { value: "female", label: t("Эмэгтэй", "Female") },
              { value: "male", label: t("Эрэгтэй", "Male") },
              { value: "unspecified", label: t("Хэлэхгүй байя", "Prefer not to say") },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={guardianGender === option.value}
                disabled={savingGender || guardianGender == null}
                onClick={async () => {
                  if (guardianGender === option.value) return;
                  setSavingGender(true);
                  try {
                    await updateGuardianGender(option.value);
                  } finally {
                    setSavingGender(false);
                  }
                }}
                className={`min-h-11 rounded-xl border px-4 py-2 text-left text-sm font-extrabold transition disabled:opacity-60 ${
                  guardianGender === option.value
                    ? "border-pink-300 bb-bg-FDE7F1 bb-text-B83B7E"
                    : "border-slate-100 bg-white text-slate-600"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {savingGender && <p role="status" className="mt-2 text-xs font-semibold text-slate-500">{t("Хадгалж байна…", "Saving…")}</p>}
        </Card>
      )}

      <MyFriendCode />
      <FamilyLinkingSection />
      <button
        type="button"
        onClick={signOut}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-100 bg-white py-3 font-extrabold bb-text-7C4DCC transition active:scale-95"
      >
        <LogOut className="h-4 w-4" /> {t("Гарах", "Sign out")}
      </button>
    </div>
  );
}
