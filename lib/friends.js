import { t } from "./i18n";


export const SOS_PLACES = [
  { id: "class", get label() { return t("🏫 Анги", "🏫 Classroom"); }, get short() { return t("Ангид", "In class"); } },
  { id: "wc", get label() { return t("🚻 Бие засах газар", "🚻 Restroom"); }, get short() { return t("Бие засах газарт", "In the restroom"); } },
  { id: "hall", get label() { return t("🚶‍♀️ Коридор", "🚶‍♀️ Hallway"); }, get short() { return t("Коридорт", "In the hallway"); } },
  { id: "gym", get label() { return t("🏀 Заал", "🏀 Gym"); }, get short() { return t("Биеийн тамирын зааланд", "In the gym"); } },
];

export const GROUP_EMOJIS = ["🌸", "💗", "🦋", "🍓", "⭐"];

export const SOS_REPLIES = {
  get coming() { return t("Надад байна! Одоо очлоо 🏃‍♀️", "I have one! Coming now 🏃‍♀️"); },
  get in_bag() { return t("Цүнхэнд минь байгаа, түр хүлээгээрэй 💗", "It's in my bag, wait a moment 💗"); },
  get bring() { return t("Би бас авчирч өгье ✨", "I'll bring one too ✨"); },
  get no() { return t("Надад байхгүй байна, уучлаарай 🙏", "I don't have one, sorry 🙏"); },
};

export const PLACE_MAX = 40;

export const placeOf = (value) => {
  const text = (value ?? "").trim();
  return SOS_PLACES.find((p) => p.id === text) ?? { id: text, label: text, short: text };
};

export const SOS_WINDOW_HOURS = 3;

export const FRIEND_ERRORS = {
  get invalid_code() { return t("Ийм найзын код олдсонгүй. Дахин шалгаарай.", "Friend code not found. Check it again."); },
  get own_code() { return t("Энэ чиний өөрийн код байна 🙂", "That's your own code 🙂"); },
  get teens_only() { return t("Зөвхөн охидын бүртгэлтэй хүнийг найзаар нэмж болно.", "You can only add people with a girl account as friends."); },
  get invalid_group() { return t("Бүлэг олдсонгүй.", "Group not found."); },
  get empty_group() { return t("Бүлэгт найз алга байна. Эхлээд найзаа нэмээрэй.", "The group has no friends. Add a friend first."); },
  get empty_recipients() { return t("Мэдэгдэл илгээх найзаа сонгоно уу.", "Choose friends to notify."); },
  get not_friends() { return t("Сонгосон хүн найзуудын жагсаалтад байхгүй байна.", "The selected person isn't in your friends list."); },
  get invalid_place() { return t("Байршлын мэдээлэл хэт урт байна.", "The location is too long."); },
  get too_soon() { return t("Дохио дөнгөж очсон. Түр хүлээгээрэй 💗", "An alert was just sent. Please wait a moment 💗"); },
  get not_recipient() { return t("Энэ дохиог хариулах боломжгүй.", "You can't reply to this alert."); },
};

export const friendError = (e) =>
  Object.entries(FRIEND_ERRORS).find(([k]) => e?.message?.includes(k))?.[1] ??
  t("Алдаа гарлаа. Интернэтээ шалгаад дахин оролдоно уу.", "Something went wrong. Check your internet and try again.");
