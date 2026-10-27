"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";

export default function AddSupplyForm() {
  const { addSupply } = useFamily();
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (!label.trim() || saving) return;
    setSaving(true);
    setError("");
    const added = await addSupply(label);
    if (added) {
      setLabel("");
      setOpen(false);
    } else setError("Нэмэгдсэнгүй. Supabase тохиргоогоо шалгаад дахин оролдоно уу.");
    setSaving(false);
  };

  return (
    <div className="mt-4 border-t border-pink-50 pt-3">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-pink-200 py-3 text-sm font-extrabold bb-text-B83B7E hover:bg-pink-50">
          <Plus className="h-4 w-4" /> Өөр зүйл нэмэх
        </button>
      ) : (
        <form onSubmit={submit}>
          <label htmlFor="new-supply" className="mb-2 block text-sm font-extrabold text-slate-700">Хэрэглэлийн нэр</label>
          <div className="flex gap-2">
            <input id="new-supply" autoFocus value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Жишээ нь: Нөөц дотуур өмд" maxLength={40} className="min-w-0 flex-1 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-pink-300 focus:bg-white" />
            <button type="submit" disabled={!label.trim() || saving} className="flex shrink-0 items-center gap-1 rounded-2xl bb-bg-FDE7F1 bb-text-B83B7E px-4 py-3 text-sm font-extrabold disabled:opacity-50"><Plus className="h-4 w-4" />Нэмэх</button>
            <button type="button" onClick={() => { setOpen(false); setError(""); }} className="rounded-2xl bg-slate-100 px-3 text-slate-500" aria-label="Болих"><X className="h-4 w-4" /></button>
          </div>
          {error && <p role="alert" className="mt-2 text-xs font-semibold text-rose-600">{error}</p>}
        </form>
      )}
    </div>
  );
}
