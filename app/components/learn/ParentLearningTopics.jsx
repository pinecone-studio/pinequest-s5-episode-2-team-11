"use client";

import { useState } from "react";
import { AlertCircle, ChevronDown, Droplets, Heart, MessageCircle, Package, Shirt, Sparkles } from "lucide-react";
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

export default function ParentLearningTopics() {
  const [expanded, setExpanded] = useState(null);
  const { theme } = useTheme();
  const headingColor = theme === "dark" ? "#d9a8bd" : "#a15f7c";
  const bodyColor = theme === "dark" ? "#ded5e2" : "#526070";

  return (
    <Card className="parent-learning-card">
      <SectionTitle
        icon={Sparkles}
        title="Охиноо дэмжихэд туслах санаанууд 💗"
        tone="peach"
        titleStyle={{ color: headingColor }}
      />
      <div className="space-y-3">
        {topics.map(({ icon: Icon, title, text }) => {
          const isOpen = expanded === title;
          return (
            <section key={title} className={`parent-topic rounded-2xl bg-white p-4 ${isOpen ? "parent-topic-open" : ""}`}>
              <button
                type="button"
                onClick={() => setExpanded((current) => (current === title ? null : title))}
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
      <p className="mt-3 text-xs font-semibold leading-relaxed text-slate-400" style={{ color: bodyColor }}>
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
    </Card>
  );
}
