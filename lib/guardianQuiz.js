/**
 * «🧠 Та хэр мэдэх вэ?» — guardian knowledge quiz. Every card is DRAFT
 * (draft: true) until a health professional reviews it. Results stay on the guardian's device.
 */
export const GUARDIAN_QUIZ = [
  { id: "bath", statement: "Сарын тэмдэгтэй үед усанд орж болохгүй", answer: false, explain: "Шүршүүрт орох, үсээ угаах нь эрүүл ахуйд сайн, өвдөлтийг ч багасгадаг.", draft: true },
  { id: "irregular", statement: "Эхний 1–2 жилд мөчлөг жигд бус байх нь хэвийн", answer: true, explain: "Бие дасах хүртэл мөчлөг 21–45 хоногийн хооронд хэлбэлзэж болно.", draft: true },
  { id: "length", statement: "Сарын тэмдэг ихэвчлэн 2–7 хоног үргэлжилдэг", answer: true, explain: "2–7 хоног хэвийн. 7 хоногоос удаан бол эмчид хандаарай.", draft: true },
  { id: "heavy", statement: "1–2 цаг тутамд пад солих шаардлагатай бол эмчид хандах хэрэгтэй", answer: true, explain: "Ийм их цус алдалт хэдэн цаг үргэлжилбэл эмчид үзүүлэх хэрэгтэй.", draft: true },
  { id: "pain", statement: "Хүчтэй өвдөлт бол хэвийн, тэвчих хэрэгтэй", answer: false, explain: "Бага зэрэг базлах нь хэвийн. Харин үргэлж хүчтэй өвдөж, хичээлдээ явж чадахгүй бол эмчид хандаарай.", draft: true },
  { id: "sport", statement: "Сарын тэмдэгтэй үед дасгал хөдөлгөөн хийж болохгүй", answer: false, explain: "Хөнгөн хөдөлгөөн базлалтыг багасгахад тусалдаг.", draft: true },
  { id: "age", statement: "Анхны сарын тэмдэг ихэвчлэн 10–15 насанд ирдэг", answer: true, explain: "Охин бүрийнх өөр цагтаа ирнэ. 8 наснаас өмнө эсвэл 15 нас хүртэл ирээгүй бол эмчтэй зөвлөлдөөрэй.", draft: true },
  { id: "who-starts", statement: "Сарын тэмдгийн талаар ярилцахыг охин өөрөө эхлүүлэх ёстой", answer: false, explain: "Том хүн тайван, энгийнээр эхлүүлбэл охинд хамаагүй хялбар байдаг.", draft: true },
  { id: "mood", statement: "Сарын тэмдэг ирэхийн өмнө сэтгэл санаа өөрчлөгдөх нь хэвийн", answer: true, explain: "Даавар өөрчлөгддөг тул ядрах, сэтгэл хөдлөх нь элбэг. Зэмлэхийн оронд дэмжээрэй.", draft: true },
  { id: "secret", statement: "Сарын тэмдгийг гэр бүлийнхнээсээ нууцлах нь зөв", answer: false, explain: "Энэ бол ичих зүйл биш. Гэрт энгийнээр ярьдаг бол охин тусламж хэрэгтэй үедээ хэлж чадна.", draft: true },
];
