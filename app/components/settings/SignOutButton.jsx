"use client";

import { useState } from "react";
import { useFamily } from "../../../context/FamilyContext";
import BottomSheet from "../ui/BottomSheet";
import { t } from "../../../lib/i18n";

export default function SignOutButton() {
  const { signOut } = useFamily();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-slate-100 bg-white py-3 text-center text-sm font-extrabold text-rose-600 transition active:scale-95"
      >
        {t("Гарах", "Sign out")}
      </button>
      {open && (
        <BottomSheet title={t("Гарах", "Sign out")} onClose={() => setOpen(false)}>
          <div className="space-y-3 pb-2">
            <p className="text-base font-black text-slate-700">{t("Гарахдаа итгэлтэй байна уу?", "Are you sure you want to sign out?")}</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-2xl bg-slate-100 py-3 text-sm font-extrabold text-slate-600">{t("Болих", "Cancel")}</button>
              <button type="button" onClick={() => { setOpen(false); signOut(); }} className="rounded-2xl bg-rose-500 py-3 text-sm font-extrabold text-white">{t("Гарах", "Sign out")}</button>
            </div>
          </div>
        </BottomSheet>
      )}
    </>
  );
}
