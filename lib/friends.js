// Найзууд · Пад SOS — тогтмол өгөгдөл

export const SOS_PLACES = [
  { id: "class", label: "🏫 Анги", short: "Ангид" },
  { id: "wc", label: "🚻 Бие засах газар", short: "Бие засах газарт" },
  { id: "hall", label: "🚶‍♀️ Коридор", short: "Коридорт" },
  { id: "gym", label: "🏀 Заал", short: "Биеийн тамирын зааланд" },
];

export const GROUP_EMOJIS = ["🌸", "💗", "🦋", "🍓", "⭐"];

// Чат байхгүй — найз зөвхөн эдгээрээс сонгож хариулна (database-д код нь хадгалагдана)
export const SOS_REPLIES = {
  coming: "Надад байна! Одоо очлоо 🏃‍♀️",
  in_bag: "Цүнхэнд минь байгаа, түр хүлээгээрэй 💗",
  bring: "Би бас авчирч өгье ✨",
  no: "Надад байхгүй байна, уучлаарай 🙏",
};

export const placeOf = (id) => SOS_PLACES.find((p) => p.id === id) ?? SOS_PLACES[0];

// Хэдэн цагийн өмнөх SOS-ийг харуулах вэ
export const SOS_WINDOW_HOURS = 3;

export const FRIEND_ERRORS = {
  invalid_code: "Ийм найзын код олдсонгүй. Дахин шалгаарай.",
  own_code: "Энэ чиний өөрийн код байна 🙂",
  teens_only: "Зөвхөн охидын бүртгэлтэй хүнийг найзаар нэмж болно.",
  invalid_group: "Бүлэг олдсонгүй.",
  empty_group: "Бүлэгт найз алга байна. Эхлээд найзаа нэмээрэй.",
  too_soon: "Дохио дөнгөж очсон. Түр хүлээгээрэй 💗",
  not_recipient: "Энэ дохиог хариулах боломжгүй.",
};

export const friendError = (e) =>
  Object.entries(FRIEND_ERRORS).find(([k]) => e?.message?.includes(k))?.[1] ??
  "Алдаа гарлаа. Интернэтээ шалгаад дахин оролдоно уу.";
