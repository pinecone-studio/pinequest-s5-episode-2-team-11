"use client";

import { useEffect, useState } from "react";
import Avatar from "./Avatar";

export default function FamilyMemberPhoto({ member, size = 36 }) {
  const [photo, setPhoto] = useState("");

  useEffect(() => {
    try {
      setPhoto(localStorage.getItem(`bloomy:profile-photo:${member?.id}`) ?? "");
    } catch {
      setPhoto("");
    }
  }, [member?.id]);

  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/90"
      style={{ width: size, height: size }}
    >
      {photo ? (
        <img src={photo} alt={`${member?.display_name || "Охин"}-ийн профайл зураг`} className="h-full w-full object-cover" />
      ) : (
        <Avatar
          look={member?.avatar_look}
          skin={member?.avatar_skin}
          crop="12 8 96 96"
          size={size}
          label={`${member?.display_name || "Охин"}-ы дүр`}
        />
      )}
    </span>
  );
}
