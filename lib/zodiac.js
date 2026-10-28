// name — API-д дамжуулах монгол нэр, label — дэлгэцэнд харуулах (орчуулагдсан) нэр
import { t } from "./i18n";

// Өрнийн зурхайн 12 орд — огнооны хязгаар нь gogo.mn-тэй ижил
export const ZODIAC_SIGNS = [
  { name: "Матар", get label() { return t("Матар", "Capricorn"); }, emoji: "♑", from: [12, 22], range: "12.22 – 01.19" },
  { name: "Хумх", get label() { return t("Хумх", "Aquarius"); }, emoji: "♒", from: [1, 20], range: "01.20 – 02.18" },
  { name: "Загас", get label() { return t("Загас", "Pisces"); }, emoji: "♓", from: [2, 19], range: "02.19 – 03.20" },
  { name: "Хонь", get label() { return t("Хонь", "Aries"); }, emoji: "♈", from: [3, 21], range: "03.21 – 04.19" },
  { name: "Үхэр", get label() { return t("Үхэр", "Taurus"); }, emoji: "♉", from: [4, 20], range: "04.20 – 05.20" },
  { name: "Ихэр", get label() { return t("Ихэр", "Gemini"); }, emoji: "♊", from: [5, 21], range: "05.21 – 06.21" },
  { name: "Мэлхий", get label() { return t("Мэлхий", "Cancer"); }, emoji: "♋", from: [6, 22], range: "06.22 – 07.22" },
  { name: "Арслан", get label() { return t("Арслан", "Leo"); }, emoji: "♌", from: [7, 23], range: "07.23 – 08.22" },
  { name: "Охин", get label() { return t("Охин", "Virgo"); }, emoji: "♍", from: [8, 23], range: "08.23 – 09.22" },
  { name: "Жинлүүр", get label() { return t("Жинлүүр", "Libra"); }, emoji: "♎", from: [9, 23], range: "09.23 – 10.22" },
  { name: "Хилэнц", get label() { return t("Хилэнц", "Scorpio"); }, emoji: "♏", from: [10, 23], range: "10.23 – 11.22" },
  { name: "Нум", get label() { return t("Нум", "Sagittarius"); }, emoji: "♐", from: [11, 22], range: "11.22 – 12.21" },
];

/** "YYYY-MM-DD" төрсөн өдрөөс орд олно. */
export function zodiacFromBirthDate(birthDate) {
  if (!birthDate) return null;
  const [, m, d] = birthDate.split("-").map(Number);
  const md = m * 100 + d;
  // Хамгийн сүүлд эхэлсэн ордыг хайна; 01.01–01.19 бол Матар (жилийн эцсийнх)
  let sign = ZODIAC_SIGNS[0];
  for (const s of ZODIAC_SIGNS.slice(1)) if (md >= s.from[0] * 100 + s.from[1]) sign = s;
  if (md >= 1222) sign = ZODIAC_SIGNS[0];
  return sign;
}
