// Хэл солих (Монгол / English).
//   t("Сайн уу", "Hello")  → сонгосон хэлээр буцаана
//   L({ mn, en })          → хос утгаас сонгоно (string өгвөл тэр чигээр нь)
// Компонент дотор useT() (context/LanguageContext) дуудаж хэл солигдоход дахин зурагдана.
// lib/ доторх тогтмол өгөгдөлд `get label() { return t(...) }` хэлбэрээр бичвэл
// хандах үед нь орчуулагдана.

export const LANGS = ["mn", "en"];
export const LANG_STORAGE_KEY = "bloomy-language";

let current = "mn";

export const getLang = () => current;
export const setCurrentLang = (lang) => {
  if (LANGS.includes(lang)) current = lang;
};

export const t = (mn, en) => (current === "en" && en != null ? en : mn);

export const L = (value) =>
  value && typeof value === "object" && "mn" in value ? (current === "en" && value.en != null ? value.en : value.mn) : value;

// Огноо/тоо форматлах locale
export const locale = () => (current === "en" ? "en-US" : "mn-MN");

const EN_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const EN_WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MN_WEEKDAYS = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"];

// month: 1–12. «10 сар» / «October»
export const monthName = (month) => (current === "en" ? EN_MONTHS[month - 1] : `${month} сар`);
// «2025 оны 10 сар» / «October 2025» (year өгөхгүй бол он гарахгүй)
export const monthTitle = (month, year) =>
  current === "en" ? `${EN_MONTHS[month - 1]}${year ? ` ${year}` : ""}` : `${year ? `${year} оны ` : ""}${month} сар`;
// «10 сарын 28» / «Oct 28»; year өгвөл «2025 оны 10 сарын 28» / «Oct 28, 2025»
export const monthDay = (month, day, year) =>
  current === "en"
    ? `${EN_MONTHS[month - 1].slice(0, 3)} ${day}${year ? `, ${year}` : ""}`
    : `${year ? `${year} оны ` : ""}${month} сарын ${day}`;
// «2025 он» / «2025»
export const yearLabel = (year) => (current === "en" ? `${year}` : `${year} он`);
// Даваа гарагаас эхэлсэн 7 хоногийн товчлол
export const weekdaysShort = () => (current === "en" ? EN_WEEKDAYS : MN_WEEKDAYS);
