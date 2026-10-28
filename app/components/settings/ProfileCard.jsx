"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { t } from "../../../lib/i18n";
import Card from "../ui/Card";

async function squarePhoto(file) {
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const size = Math.min(image.naturalWidth, image.naturalHeight);
      canvas.width = 256;
      canvas.height = 256;
      canvas.getContext("2d").drawImage(image, (image.naturalWidth - size) / 2, (image.naturalHeight - size) / 2, size, size, 0, 0, 256, 256);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read image"));
    };
    image.src = url;
  });
}

/**
 * Profile photo (this device only), name and email with the existing edit form.
 * `compact` is the daughter's header row; `subtitle` e.g. "Түв. 3 · 🌸 12".
 */
export default function ProfileCard({ compact = false, subtitle = null }) {
  const { profile, session, view, updateName, updateEmail, setToast } = useFamily();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.display_name ?? "");
  const [emailInput, setEmailInput] = useState(session?.user?.email ?? "");
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState("");
  const photoInput = useRef(null);
  const fallback = view === "mother" ? "🤝" : "🌱";

  useEffect(() => {
    if (!profile?.id) { setPhoto(""); return; }
    try { setPhoto(localStorage.getItem(`bloomy:profile-photo:${profile.id}`) ?? ""); } catch { setPhoto(""); }
  }, [profile?.id]);

  const changePhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !profile?.id) return;
    try {
      const next = await squarePhoto(file);
      localStorage.setItem(`bloomy:profile-photo:${profile.id}`, next);
      setPhoto(next);
      setToast(t("Профайл зураг шинэчлэгдлээ 📷", "Profile photo updated 📷"));
    } catch {
      setToast(t("Зураг хадгалж чадсангүй. Өөр зураг сонгоод үзээрэй.", "Could not save the photo. Try a different one."));
    }
    event.target.value = "";
  };

  const startEdit = () => {
    setName(profile?.display_name ?? "");
    setEmailInput(session?.user?.email ?? "");
    setEditing(true);
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    const nameSaved = await updateName(name);
    const emailSaved = nameSaved && await updateEmail(emailInput);
    setSaving(false);
    if (emailSaved) {
      if (emailInput.trim() === session?.user?.email) setToast(t("Профайлын мэдээлэл хадгалагдлаа ✓", "Profile saved ✓"));
      setEditing(false);
    }
  };

  const size = compact ? "h-14 w-14 text-3xl" : "h-24 w-24 text-5xl";
  const avatar = (
    <span className={`relative shrink-0 ${compact ? "h-14 w-14" : "mb-3 h-24 w-24"}`}>
      <span className={`flex items-center justify-center overflow-hidden rounded-full bb-bg-FDE7F1 ${size}`}>
        {photo ? <img src={photo} alt={t("Профайл зураг", "Profile photo")} className="h-full w-full object-cover" /> : fallback}
      </span>
      <input ref={photoInput} type="file" accept="image/*" onChange={changePhoto} className="hidden" aria-label={t("Профайл зураг сонгох", "Choose profile photo")} />
      <button
        type="button"
        onClick={() => photoInput.current?.click()}
        aria-label={t("Профайл зураг солих", "Change profile photo")}
        className={`absolute bottom-0 right-0 flex items-center justify-center rounded-full border-2 border-white bg-white text-slate-500 shadow-sm ${compact ? "h-6 w-6 -right-1" : "h-8 w-8"}`}
      >
        <Pencil className={compact ? "h-3 w-3" : "h-4 w-4"} />
      </button>
    </span>
  );

  const form = (
    <form onSubmit={save} className="mt-3 w-full space-y-3 text-left">
      <label className="block text-xs font-extrabold text-slate-500" htmlFor="profile-name">{t("Хэрэглэгчийн нэр", "Display name")}</label>
      <input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={40} required className="w-full rounded-2xl border-2 border-slate-100 bb-focus-border-F48FB1 bg-white px-4 py-3 font-bold text-slate-700 outline-none" />
      <label className="block text-xs font-extrabold text-slate-500" htmlFor="profile-email">{t("Имэйл", "Email")}</label>
      <input id="profile-email" type="email" value={emailInput} onChange={(event) => setEmailInput(event.target.value)} required className="w-full rounded-2xl border-2 border-slate-100 bb-focus-border-F48FB1 bg-white px-4 py-3 font-bold text-slate-700 outline-none" />
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={() => setEditing(false)} disabled={saving} className="flex-1 rounded-2xl bg-slate-100 py-3 font-extrabold text-slate-500">{t("Болих", "Cancel")}</button>
        <button type="submit" disabled={saving} className="flex-1 rounded-2xl bb-bg-E0679F py-3 font-extrabold text-white disabled:opacity-60">{saving ? t("Хадгалж байна…", "Saving…") : t("Хадгалах", "Save")}</button>
      </div>
    </form>
  );

  const editButton = (
    <button type="button" onClick={startEdit} className="flex shrink-0 items-center gap-1.5 rounded-xl bb-bg-FDE7F1 px-3 py-2 text-sm font-extrabold bb-text-B83B7E">
      <Pencil className="h-4 w-4" /> {t("Засах", "Edit")}
    </button>
  );

  if (compact) {
    return (
      <Card className="!p-4">
        <div className="flex items-center gap-3">
          {avatar}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-black text-slate-700">{profile?.display_name || "—"}</h3>
            {subtitle && <p className="text-xs font-bold text-slate-400">{subtitle}</p>}
          </div>
          {!editing && editButton}
        </div>
        {editing && form}
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex flex-col items-center text-center">
        {avatar}
        {editing ? form : (
          <>
            <h3 className="max-w-full truncate text-xl font-black text-slate-700">{profile?.display_name || "—"}</h3>
            <div className="mt-3">{editButton}</div>
          </>
        )}
      </div>
    </Card>
  );
}
