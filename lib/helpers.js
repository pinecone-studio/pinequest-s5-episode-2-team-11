// Туслах функцууд
export function getPhaseKey(day, cycleLength, periodLength) {
  const ovDay = cycleLength - 14;
  if (day <= periodLength) return "period";
  if (day <= ovDay - 2) return "follicular";
  if (day <= ovDay + 1) return "ovulation";
  return "luteal";
}

// Монгол нэрийн илүү (харьяалах) тийн ялгал: Ану → Анугийн
export function genitive(name) {
  const n = name.trim();
  if (!n) return n;
  const last = n.slice(-1).toLowerCase();
  if ("аэиоуөүяеёюы".includes(last)) return `${n}гийн`;
  if (last === "й") return `${n}н`;
  const back = /[аоуя]/i.test(n);
  if (last === "н") return n + (back ? "ы" : "ий");
  return n + (back ? "ын" : "ийн");
}

export function getMomNudges(phaseKey, daysUntil, sharedMood) {
  const moodNudges = {
    sad: "Охин тань өнөөдөр гунигтай байгаа бололтой. Юу ч асуулгүй тэврээд, хажууд нь байгаарай 🤍",
    angry: "Охин тань цочромтгой байна. Зэмлэхийн оронд «Чамд юу хэрэгтэй вэ?» гэж зөөлөн асуугаарай.",
    tired: "Охин тань ядарсан байна. Өнөөдөр гэрийн ажлаас чөлөөлж, эрт унтуулаарай 🌙",
    craving: "Охин тань амттан хүсч байна. Хар шоколад, жимстэй жижиг зууш бэлдээд өгөөрэй 🍫",
  };
  let base;
  if (phaseKey === "period") {
    base = [
      "Өнөөдөр охиндоо халуун чацаргана бэлдэж өгвөл сэтгэл санаа нь тайвширна 🍵",
      "Халуун жин бэлдэж, орон дээр нь тавьчихаарай — базлалтад маш сайн тусална.",
      "Оройн хоолонд төмөр ихтэй үхрийн махтай шөл хийгээрэй 🥣",
      "Өнөөдөр гэрийн ажлаас нь чөлөөлж, амраагаарай.",
    ];
  } else if (daysUntil <= 5) {
    base = [
      "Сургуулийн цүнхэнд нь 2–3 ширхэг хэрэглэл нууцхан хийчихээрэй 🎒",
      "Сэтгэл санаа нь хэлбэлзэж магадгүй — тэвчээртэй, зөөлөн хандаарай.",
      "Банана, самар зэрэг магниар баялаг зууш бэлдэж өгөөрэй 🍌",
      "Унтахын өмнө хамтдаа бүлээн цай ууж, яриа өрнүүлээрэй.",
    ];
  } else {
    base = [
      "Сургууль нь ямар байгааг тайван, шахалтгүй асуугаарай 💬",
      "Хамтдаа гадуур алхаж, ярилцах цаг гаргаарай 🌳",
      "«Сурах» хэсгийг охинтойгоо хамтдаа үзээрэй.",
      "Түүний амжилтыг жижиг ч гэсэн магтаарай 🌸",
    ];
  }
  return sharedMood && moodNudges[sharedMood] ? [moodNudges[sharedMood], ...base] : base;
}

export const nowTime = () => new Date().toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" });
export const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export const formatSeconds = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
