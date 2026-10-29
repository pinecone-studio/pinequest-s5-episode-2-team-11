import { t } from "./i18n";

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

  // Latin үсгээр бичсэн нэрэнд харьяалахын тийн ялгалыг зураастай залгана.
  if (/[a-z]/i.test(n)) {
    const back = /[aouy]/i.test(n);
    return `${n}-${back ? "ын" : "ийн"}`;
  }

  const last = n.slice(-1).toLowerCase();
  if ("аэиоуөүяеёюы".includes(last)) return `${n}гийн`;
  if (last === "й") return `${n}н`;
  const back = /[аоуя]/i.test(n);
  if (last === "н") return n + (back ? "ы" : "ий");
  return n + (back ? "ын" : "ийн");
}

export function getMomNudges(phaseKey, daysUntil, sharedMood, daughterName = "") {
  const moodNudges = {
    sad: t("Охин тань өнөөдөр гунигтай байгаа бололтой. Юу ч асуулгүй тэврээд, хажууд нь байгаарай 🤍", "Your daughter seems sad today. Give her a hug without asking questions, and stay close 🤍"),
    angry: t("Охин тань цочромтгой байна. Зэмлэхийн оронд «Чамд юу хэрэгтэй вэ?» гэж зөөлөн асуугаарай.", "Your daughter is irritable. Instead of scolding, gently ask \"What do you need?\""),
    tired: t("Охин тань ядарсан байна. Өнөөдөр гэрийн ажлаас чөлөөлж, эрт унтуулаарай 🌙", "Your daughter is tired. Let her skip chores today and go to bed early 🌙"),
    craving: t("Охин тань амттан хүсч байна. Хар шоколад, жимстэй жижиг зууш бэлдээд өгөөрэй 🍫", "Your daughter is craving sweets. Make her a small snack with dark chocolate and fruit 🍫"),
  };
  let base;
  if (phaseKey === "period") {
    base = [
      t("Өнөөдөр охиндоо халуун чацаргана бэлдэж өгвөл сэтгэл санаа нь тайвширна 🍵", "A warm sea-buckthorn drink today will help your daughter relax 🍵"),
      t("Халуун жин бэлдэж, орон дээр нь тавьчихаарай — базлалтад маш сайн тусална.", "Prepare a warm compress and leave it on her bed — it really helps with cramps."),
      t("Оройн хоолонд төмөр ихтэй үхрийн махтай шөл хийгээрэй 🥣", "Make an iron-rich beef soup for dinner 🥣"),
      t("Өнөөдөр гэрийн ажлаас нь чөлөөлж, амраагаарай.", "Let her skip chores today and rest."),
    ];
  } else if (daysUntil <= 5) {
    base = [
      t("Сургуулийн цүнхэнд нь 2–3 ширхэг хэрэглэл нууцхан хийчихээрэй 🎒", "Quietly slip 2–3 pads into her school bag 🎒"),
      t("Сэтгэл санаа нь хэлбэлзэж магадгүй — тэвчээртэй, зөөлөн хандаарай.", "Her mood may swing — be patient and gentle."),
      t("Банана, самар зэрэг магниар баялаг зууш бэлдэж өгөөрэй 🍌", "Prepare magnesium-rich snacks like bananas and nuts 🍌"),
      t("Унтахын өмнө хамтдаа бүлээн цай ууж, яриа өрнүүлээрэй.", "Have warm tea together before bed and chat."),
    ];
  } else {
    base = [
      t("Сургууль нь ямар байгааг тайван, шахалтгүй асуугаарай 💬", "Ask calmly, without pressure, how school is going 💬"),
      t("Хамтдаа гадуур алхаж, ярилцах цаг гаргаарай 🌳", "Make time to walk outside together and talk 🌳"),
      t("«Сурах» хэсгийг охинтойгоо хамтдаа үзээрэй.", "Look through the Learn section with your daughter."),
      t("Түүний амжилтыг жижиг ч гэсэн магтаарай 🌸", "Praise her achievements, even small ones 🌸"),
    ];
  }
  const nudges = sharedMood && moodNudges[sharedMood] ? [moodNudges[sharedMood], ...base] : base;
  if (!daughterName) return nudges;
  return nudges.map((text) => text
    .replace(/Охин тань/g, daughterName)
    .replace(/охиндоо/g, t(`${daughterName}-д`, `To ${daughterName}`))
    .replace(/охиноо/g, `${daughterName}-г`));
}

export const nowTime = () => new Date().toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" });
export const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export const formatSeconds = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
