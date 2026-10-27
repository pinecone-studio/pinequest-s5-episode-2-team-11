"use client";

import { useState } from "react";
import { AlertCircle, ArrowLeft, ChevronDown, ChevronRight, Droplets, Heart, MessageCircle, Package, Shirt, Sparkles, BookOpen, Users } from "lucide-react";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";
import { useTheme } from "../../../context/ThemeContext";

const topics = [
  {
    icon: AlertCircle,
    title: "Өвдөлтийг нь бүү үл тоогоорой 💗",
    text: "“Бүгд л тэгдэг, тэс” гэж хэлэлгүй, охиноо тайван сонсоод юу тус болохыг нь асуугаарай. Өвдөлт нь хичээлдээ явах, өдөр тутмын зүйлээ хийхэд саад болохоор хүчтэй байвал эмчид үзүүлээрэй.",
  },
  {
    icon: Heart,
    title: "Сэтгэл санааг нь ойлгож дэмжих 🌷",
    text: "Охин тань эмзэг, ууртай эсвэл гунигтай байвал “Даавар чинь хөдөлж байна уу?” гэж шоолохын оронд тайван сонсоорой. “Чамд яаж туслах вэ?” гэж асуухад л охин тань ойлгогдож, тайвширч болно.",
  },
  {
    icon: Package,
    title: "Тухтай хэрэглэл сонгоход нь туслах 🌸",
    text: "Хэрэглэл хүн бүрт өөр өөр тухтай байдаг. Охиноосоо юу нь эвтэйхэн байгааг асууж, өөрт нь тохирох хэрэглэлээ сонгоход нь дэмжээрэй.",
  },
  {
    icon: Sparkles,
    title: "Асгарахаас санаа зовох үед нь дэмжих 🎒",
    text: "Сургуульд авч явах жижиг уутанд нь нөөц хэрэглэл хийж өгөөрэй. Хувцсанд нь цус нэвчсэн ч ичих зүйл биш, хамтдаа зохицуулж болно гэж тайвшруулаарай.",
  },
  {
    icon: Shirt,
    title: "Цус болсон хувцсыг хамт цэвэрлэх 👕",
    text: "Хувцсанд нь цусны толбо гарвал аль болох хурдан хүйтэн усаар зайлж, савандаж угаагаарай. Халуун ус толбыг тогтоож болзошгүй. Охиноо буруутгалгүй, тайван туслаарай.",
  },
  {
    icon: Droplets,
    title: "Цэвэрлэгээг нь тайлбарлаж өгөх 🫧",
    text: "Гадна хэсгийг бүлээн усаар зөөлөн угаахад хангалттай. Дотор талыг угаах хэрэггүй шүү 🫧",
  },
  {
    icon: MessageCircle,
    title: "Яриаг нь эртхэн эхлүүлээрэй 🌱",
    text: "Анхны сарын тэмдэг ирэхээс нь өмнө бага багаар ярилцаарай. Тэгвэл охин тань юу болохыг мэдэж, сандрах нь багасна. Ойролцоогоор 8–9 наснаас нь насанд нь тохируулан ярьж эхэлж болно.",
  },
];

const courseLessons = [
  {
    icon: MessageCircle,
    title: "1. Хэзээнээс ярьж эхлэх вэ?",
    text: "Ойролцоогоор 8–9 наснаас нь биеийн өөрчлөлтийн тухай энгийнээр ярьж эхлээрэй. Нэг удаа урт тайлбарлахын оронд өдөр тутмын яриандаа бага багаар оруулж, асуултад нь тайван хариулаарай. Хүүхэд бүрийн бойжилтын хэмнэл өөр байдаг.",
  },
  {
    icon: Heart,
    title: "2. Биед юу болдог вэ?",
    text: "“Чиний бие өсөж том болох явцдаа умайн дотор зөөлөн бүрхүүл бэлддэг. Тэр бүрхүүл хэрэггүй болсон үед бага хэмжээний цустай хамт үтрээгээр гардаг. Үүнийг сарын тэмдэг гэдэг. Энэ бол биеийн хэвийн үйл явц” гэж насанд нь тохируулан тайлбарлаарай.",
  },
  {
    icon: Sparkles,
    title: "3. “Ирлээ” гэхэд эхний минутад юу хэлэх вэ?",
    text: "Эхлээд тайван байж, “Надад хэлсэнд баярлалаа. Чи зүгээр ээ, энэ бол хэвийн зүйл. Би чамтай хамт байна. Одоо чамд юу хэрэгтэй байна?” гэж хэлээрэй. Дараа нь ариун цэврийн хэрэглэл, цэвэр хувцас санал болгож, хувийн орон зайг нь хүндлээрэй.",
  },
  {
    icon: AlertCircle,
    title: "4. Худал ойлголтыг хэрхэн залруулах вэ?",
    text: "“Сарын тэмдгийн цус бохир биш, биеэс гарах хэвийн цус. Сарын тэмдэгтэй үед усанд орж, сургуульдаа явж, дуртай үйл ажиллагаагаа хийж болно. Хүн бүрийн мөчлөг, өвдөлт өөр байдаг” гэж баримтаар, ичээхгүй тайлбарлаарай. “Заавал тэсэх ёстой” гэж хэлэлгүй, хүчтэй өвдөлт эсвэл санаа зовоосон цус алдалт байвал эмчтэй зөвлөлдөөрэй.",
  },
  {
    icon: Users,
    title: "5. Аавууд юу хийж болох вэ?",
    text: "Аавууд ч бас тайван, хүндэтгэлтэй ярилцаж, хэрэглэл авч өгөх, нөөц хэрэглэл бэлдэх, угаалга эсвэл эмчид очиход тусалж болно. “Ээжээсээ асуу” гэж бүх хариуцлагыг шилжүүлэхийн оронд охиноо сонсож, нууцыг нь зөвшөөрөлгүй бусдад ярихгүй байх нь чухал.",
  },
];

export default function ParentLearningTopics() {
  const [expanded, setExpanded] = useState({});
  const [activePage, setActivePage] = useState(null);
  const { theme } = useTheme();
  const headingColor = theme === "dark" ? "#d9a8bd" : "#8a3e46";
  const bodyColor = theme === "dark" ? "#ded5e2" : "#526070";

  if (activePage) {
    const isCourse = activePage === "course";
    const pageItems = isCourse ? courseLessons : topics;
    return (
      <div className="space-y-4 bloom-fade">
        <button
          type="button"
          onClick={() => setActivePage(null)}
          className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-extrabold text-[#B83B7E]"
        >
          <ArrowLeft className="h-4 w-4" /> Буцах
        </button>
        <Card className="parent-learning-card">
          <SectionTitle
            icon={isCourse ? BookOpen : Sparkles}
            title={isCourse ? "Эцэг эхийн бэлтгэл курс" : "Охиноо дэмжихэд туслах санаанууд 💗"}
            tone="peach"
            titleStyle={{ color: headingColor }}
          />
          <p className="mb-4 text-sm font-semibold leading-relaxed text-slate-500" style={{ color: bodyColor }}>
            {isCourse
              ? "Анхны сарын тэмдэг ирэхээс өмнө асран хамгаалагчид зориулсан 5 богино хичээл"
              : "Охиноо сарын тэмдгийн үед болон өмнө нь ойлгож, дэмжихэд туслах санаанууд."}
          </p>
          <div className="space-y-3">
            {pageItems.map(({ icon: Icon, title, text }) => {
              const isOpen = Boolean(expanded[title]);
              return (
                <section key={title} className={`parent-topic rounded-2xl bg-white p-4 ${isOpen ? "parent-topic-open" : ""}`}>
                  <button
                    type="button"
                    onClick={() => setExpanded((current) => ({ ...current, [title]: !current[title] }))}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-3 text-left active:opacity-80"
                  >
                    <span className="parent-topic-title flex min-w-0 flex-1 items-center gap-2 font-extrabold" style={{ color: headingColor }}>
                      <Icon className="h-4 w-4 shrink-0 bb-text-B83B7E" /> {title}
                    </span>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bb-text-B83B7E" aria-hidden="true">
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </span>
                  </button>
                  {isOpen && <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-600" style={{ color: bodyColor }}>{text}</p>}
                </section>
              );
            })}
          </div>
          {!isCourse && (
            <p className="mt-4 text-xs font-semibold leading-relaxed text-slate-400" style={{ color: bodyColor }}>
              Дэлгэрэнгүй: {" "}
              <a className="underline" style={{ color: bodyColor }} href="https://www.acog.org/womens-health/faqs/your-first-period" target="_blank" rel="noreferrer">ACOG · Эхний сарын тэмдэг</a>
              {" · "}
              <a className="underline" style={{ color: bodyColor }} href="https://www.acog.org/womens-health/faqs/vulvovaginal-health" target="_blank" rel="noreferrer">ACOG · Гаднах бэлэг эрхтний арчилгаа</a>
              {" · "}
              <a className="underline" style={{ color: bodyColor }} href="https://www.nhs.uk/conditions/periods/period-problems/" target="_blank" rel="noreferrer">NHS · Сэтгэл санаа ба сарын тэмдэг</a>
              {" · "}
              <a className="underline" style={{ color: bodyColor }} href="https://www.acog.org/womens-health/faqs/dysmenorrhea-painful-periods" target="_blank" rel="noreferrer">ACOG · Өвдөлттэй сарын тэмдэг</a>
              {" · "}
              <a className="underline" style={{ color: bodyColor }} href="https://www.unicef.org/parenting/health/talking-about-periods-at-home" target="_blank" rel="noreferrer">UNICEF · Гэртээ ярилцах нь</a>
            </p>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setActivePage("support")}
        className="flex w-full items-center gap-5 rounded-3xl border border-pink-100 bg-white p-6 text-left shadow-md transition hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-pink-100 text-[#B83B7E]"><Sparkles className="h-7 w-7" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-black leading-snug" style={{ color: headingColor }}>Охиноо дэмжихэд туслах санаанууд 💗</span>
          <span className="mt-1.5 block text-sm font-semibold leading-relaxed" style={{ color: bodyColor }}>Өдөр тутамд нь ойлгож, туслах 7 санаа</span>
        </span>
        <ChevronRight className="h-6 w-6 shrink-0 text-[#B83B7E]" />
      </button>
      <button
        type="button"
        onClick={() => setActivePage("course")}
        className="flex w-full items-center gap-5 rounded-3xl border border-pink-100 bg-white p-6 text-left shadow-md transition hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-pink-100 text-[#B83B7E]">
          <BookOpen className="h-7 w-7" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-black leading-snug" style={{ color: headingColor }}>Эцэг эхийн бэлтгэл курс</span>
          <span className="mt-1.5 block text-sm font-semibold leading-relaxed" style={{ color: bodyColor }}>Анхны сарын тэмдгийн өмнөх 5 богино хичээл</span>
        </span>
        <ChevronRight className="h-6 w-6 shrink-0 text-[#B83B7E]" />
      </button>
    </div>
  );
}
