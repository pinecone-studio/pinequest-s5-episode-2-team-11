"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Send, Trash2 } from "lucide-react";
import Avatar from "../avatar/Avatar";
import { AVATAR_BACKGROUNDS } from "../../../lib/wardrobe";

const PAGE_SIZE = 20;

export function GroupPhotoComposer({ groups, accessToken, onPosted }) {
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const selectedGroup = groups.find((group) => group.id === groupId) ?? groups[0] ?? null;

  useEffect(() => {
    if (!groups.some((group) => group.id === groupId)) setGroupId(groups[0]?.id ?? "");
  }, [groups, groupId]);

  const postPhoto = async (event) => {
    event.preventDefault();
    if (!selectedGroup || !file || busy) return;
    setBusy(true);
    setError("");

    const form = new FormData();
    form.set("groupId", selectedGroup.id);
    form.set("photo", file);
    try {
      const response = await fetch("/api/group-photos", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Зураг нийтэлж чадсангүй.");
      setError(result.notificationWarning || "");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      onPosted(selectedGroup.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Зураг нийтэлж чадсангүй.");
    } finally {
      setBusy(false);
    }
  };

  if (!groups.length) {
    return <p className="rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-400">Зураг нийтлэхийн тулд эхлээд бүлэгт нэгдээрэй.</p>;
  }

  return (
    <form onSubmit={postPhoto} className="mb-4 space-y-3 rounded-2xl border border-pink-100 bg-white p-3">
      <label className="block text-xs font-extrabold uppercase tracking-widest text-slate-400" htmlFor="group-photo-destination">
        Бүлэгт зураг нийтлэх
      </label>
      <select
        id="group-photo-destination"
        value={selectedGroup?.id ?? ""}
        onChange={(event) => setGroupId(event.target.value)}
        className="w-full rounded-xl border-2 border-slate-100 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 outline-none bb-focus-border-F48FB1"
      >
        {groups.map((group) => (
          <option key={group.id} value={group.id}>{group.emoji} {group.name}</option>
        ))}
      </select>
      {selectedGroup && (
        <p className="text-xs font-semibold text-slate-500">
          Энэ зураг {selectedGroup.members.length + 1} гишүүнд харагдана.
        </p>
      )}
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-pink-200 bg-pink-50/50 px-3 py-3 text-sm font-bold text-slate-600">
        <ImagePlus className="h-4 w-4 bb-text-B83B7E" />
        {file ? file.name : "Зураг сонгох · JPG, PNG, WebP · 8 MB хүртэл"}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setError("");
          }}
        />
      </label>
      {error && <p role="alert" className="text-xs font-bold text-rose-600">{error}</p>}
      <button
        type="submit"
        disabled={!file || busy || !accessToken}
        className="flex w-full items-center justify-center gap-2 rounded-xl bb-bg-E0679F py-2.5 text-sm font-extrabold text-white active:scale-[0.99] disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Нийтлэх
      </button>
    </form>
  );
}

export function GroupPhotoFeed({ group, accessToken, viewerId, refreshKey }) {
  const [photos, setPhotos] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [confirmingId, setConfirmingId] = useState(null);

  const loadPage = async (nextPage, append = false) => {
    if (!accessToken) {
      setError("Зураг үзэхийн тулд дахин нэвтэрнэ үү.");
      setLoading(false);
      return;
    }
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/group-photos?groupId=${encodeURIComponent(group.id)}&page=${nextPage}`,
        { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Зургуудыг ачаалж чадсангүй.");
      setPhotos((current) => append ? [...current, ...result.photos] : result.photos);
      setPage(nextPage);
      setHasMore(result.hasMore);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Зургуудыг ачаалж чадсангүй.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPhotos([]);
    setPage(0);
    loadPage(0);
  }, [group.id, accessToken, refreshKey]);

  const deletePhoto = async (photoId) => {
    if (confirmingId !== photoId) {
      setConfirmingId(photoId);
      return;
    }
    try {
      const response = await fetch("/api/group-photos", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ photoId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Зургийг устгаж чадсангүй.");
      setPhotos((current) => current.filter((photo) => photo.id !== photoId));
      setConfirmingId(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Зургийг устгаж чадсангүй.");
      setConfirmingId(null);
    }
  };

  return (
    <section className="border-t border-slate-100 px-3 pb-3 pt-3">
      <h3 className="mb-3 text-sm font-black text-slate-700">Бүлгийн зургууд</h3>
      {loading ? (
        <div className="flex justify-center py-5"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
      ) : error && photos.length === 0 ? (
        <p role="alert" className="py-3 text-center text-sm font-semibold text-rose-600">{error}</p>
      ) : photos.length === 0 ? (
        <p className="py-3 text-center text-sm font-semibold text-slate-400">Одоогоор зураг алга.</p>
      ) : (
        <div className="space-y-4">
          {photos.map((photo) => (
            <article key={photo.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
              <div className="flex items-center gap-2.5 p-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full"
                  style={{ background: AVATAR_BACKGROUNDS.find((item) => item.id === photo.uploader.avatar_background)?.background ?? AVATAR_BACKGROUNDS[0].background }}
                >
                  <Avatar
                    look={photo.uploader.avatar_look}
                    skin={photo.uploader.avatar_skin}
                    size={34}
                    label={`${photo.uploader.display_name}-ийн дүр`}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold text-slate-700">{photo.uploader.display_name}</span>
                  <time className="block text-xs font-semibold text-slate-400" dateTime={photo.created_at}>
                    {new Date(photo.created_at).toLocaleString("mn-MN", { dateStyle: "medium", timeStyle: "short" })}
                  </time>
                </span>
                {(photo.uploader_id === viewerId || group.owner_id === viewerId) && (
                  <button
                    type="button"
                    onClick={() => deletePhoto(photo.id)}
                    aria-label={confirmingId === photo.id ? "Зургийг устгахыг батлах" : "Зураг устгах"}
                    className="rounded-lg p-2 text-slate-400 hover:text-rose-600"
                  >
                    {confirmingId === photo.id ? <span className="text-xs font-bold">Устгах?</span> : <Trash2 className="h-4 w-4" />}
                  </button>
                )}
              </div>
              <ProtectedPhoto imageUrl={photo.image_url} accessToken={accessToken} />
            </article>
          ))}
          {error && <p role="alert" className="text-center text-xs font-bold text-rose-600">{error}</p>}
          {hasMore && (
            <button
              type="button"
              onClick={() => loadPage(page + 1, true)}
              disabled={loadingMore}
              className="w-full rounded-xl bg-slate-50 py-2.5 text-sm font-extrabold text-slate-600 disabled:opacity-50"
            >
              {loadingMore ? "Ачаалж байна…" : "Дараагийн зургууд"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function ProtectedPhoto({ imageUrl, accessToken }) {
  const [src, setSrc] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = "";
    setSrc("");
    setError(false);
    fetch(imageUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Зургийг ачаалж чадсангүй.");
        objectUrl = URL.createObjectURL(await response.blob());
        setSrc(objectUrl);
      })
      .catch((cause) => {
        if (cause.name !== "AbortError") setError(true);
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageUrl, accessToken]);

  if (error) return <p className="p-4 text-center text-xs font-semibold text-rose-600">Зураг ачаалж чадсангүй.</p>;
  return src
    ? <img src={src} alt="Бүлэгт нийтэлсэн зураг" className="max-h-[28rem] w-full bg-slate-50 object-contain" />
    : <div className="h-48 animate-pulse bg-slate-50" aria-label="Зураг ачаалж байна" />;
}
