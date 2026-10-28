"use client";

import { useState } from "react";
import { AlertCircle, ArrowLeft, ChevronDown, ChevronRight, Droplets, Heart, MessageCircle, Package, Shirt, Sparkles, BookOpen, Users } from "lucide-react";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";
import { useTheme } from "../../../context/ThemeContext";
import { t } from "../../../lib/i18n";

const topics = [
  {
    icon: AlertCircle,
    get title() { return t("Өвдөлтийг нь бүү үл тоогоорой 💗", "Don't dismiss her pain 💗"); },
    get text() { return t("“Бүгд л тэгдэг, тэс” гэж хэлэлгүй, охиноо тайван сонсоод юу тус болохыг нь асуугаарай. Өвдөлт нь хичээлдээ явах, өдөр тутмын зүйлээ хийхэд саад болохоор хүчтэй байвал эмчид үзүүлээрэй.", "Instead of saying \"everyone goes through it, just deal with it,\" listen calmly and ask what helps. If the pain is strong enough to stop her going to school or doing daily things, see a doctor."); },
  },
  {
    icon: Heart,
    get title() { return t("Сэтгэл санааг нь ойлгож дэмжих 🌷", "Understand and support her feelings 🌷"); },
    get text() { return t("Охин тань эмзэг, ууртай эсвэл гунигтай байвал “Даавар чинь хөдөлж байна уу?” гэж шоолохын оронд тайван сонсоорой. “Чамд яаж туслах вэ?” гэж асуухад л охин тань ойлгогдож, тайвширч болно.", "If your daughter is sensitive, angry or sad, listen calmly instead of teasing \"Is it your hormones?\" Just asking \"How can I help you?\" can make her feel understood and calmer."); },
  },
  {
    icon: Package,
    get title() { return t("Тухтай хэрэглэл сонгоход нь туслах 🌸", "Help her choose comfortable supplies 🌸"); },
    get text() { return t("Хэрэглэл хүн бүрт өөр өөр тухтай байдаг. Охиноосоо юу нь эвтэйхэн байгааг асууж, өөрт нь тохирох хэрэглэлээ сонгоход нь дэмжээрэй.", "Different supplies feel comfortable for different people. Ask your daughter what works for her and support her in choosing what suits her."); },
  },
  {
    icon: Sparkles,
    get title() { return t("Асгарахаас санаа зовох үед нь дэмжих 🎒", "Support her when she worries about leaks 🎒"); },
    get text() { return t("Сургуульд авч явах жижиг уутанд нь нөөц хэрэглэл хийж өгөөрэй. Хувцсанд нь цус нэвчсэн ч ичих зүйл биш, хамтдаа зохицуулж болно гэж тайвшруулаарай.", "Pack spare supplies in a small bag for school. Reassure her that a leak on her clothes is nothing to be ashamed of and you can handle it together."); },
  },
  {
    icon: Shirt,
    get title() { return t("Цус болсон хувцсыг хамт цэвэрлэх 👕", "Clean stained clothes together 👕"); },
    get text() { return t("Хувцсанд нь цусны толбо гарвал аль болох хурдан хүйтэн усаар зайлж, савандаж угаагаарай. Халуун ус толбыг тогтоож болзошгүй. Охиноо буруутгалгүй, тайван туслаарай.", "If there's a blood stain, rinse it in cold water as soon as possible and wash with soap. Hot water can set the stain. Help calmly, without blaming her."); },
  },
  {
    icon: Droplets,
    get title() { return t("Цэвэрлэгээг нь тайлбарлаж өгөх 🫧", "Explain how to keep clean 🫧"); },
    get text() { return t("Гадна хэсгийг бүлээн усаар зөөлөн угаахад хангалттай. Дотор талыг угаах хэрэггүй шүү 🫧", "Gently washing the outside with warm water is enough. There's no need to wash inside 🫧"); },
  },
  {
    icon: MessageCircle,
    get title() { return t("Яриаг нь эртхэн эхлүүлээрэй 🌱", "Start the conversation early 🌱"); },
    get text() { return t("Анхны сарын тэмдэг ирэхээс нь өмнө бага багаар ярилцаарай. Тэгвэл охин тань юу болохыг мэдэж, сандрах нь багасна. Ойролцоогоор 8–9 наснаас нь насанд нь тохируулан ярьж эхэлж болно.", "Talk a little at a time before her first period. Then she'll know what to expect and panic less. You can start around age 8–9 in an age-appropriate way."); },
  },
];

const courseLessons = [
  {
    icon: MessageCircle,
    get title() { return t("1. Хэзээнээс ярьж эхлэх вэ?", "1. When should I start talking?"); },
    get text() { return t("Ойролцоогоор 8–9 наснаас нь биеийн өөрчлөлтийн тухай энгийнээр ярьж эхлээрэй. Нэг удаа урт тайлбарлахын оронд өдөр тутмын яриандаа бага багаар оруулж, асуултад нь тайван хариулаарай. Хүүхэд бүрийн бойжилтын хэмнэл өөр байдаг.", "Start talking simply about body changes from around age 8–9. Instead of one long talk, bring it up little by little in everyday conversation and answer her questions calmly. Every child develops at her own pace."); },
  },
  {
    icon: Heart,
    get title() { return t("2. Биед юу болдог вэ?", "2. What happens in the body?"); },
    get text() { return t("“Чиний бие өсөж том болох явцдаа умайн дотор зөөлөн бүрхүүл бэлддэг. Тэр бүрхүүл хэрэггүй болсон үед бага хэмжээний цустай хамт үтрээгээр гардаг. Үүнийг сарын тэмдэг гэдэг. Энэ бол биеийн хэвийн үйл явц” гэж насанд нь тохируулан тайлбарлаарай.", "Explain it for her age: \"As your body grows up, it builds a soft lining inside the uterus. When that lining isn't needed, it comes out through the vagina with a small amount of blood. That's called a period. It's a normal thing bodies do.\""); },
  },
  {
    icon: Sparkles,
    get title() { return t("3. “Ирлээ” гэхэд эхний минутад юу хэлэх вэ?", "3. What do I say in the first minute when she tells me it started?"); },
    get text() { return t("Эхлээд тайван байж, “Надад хэлсэнд баярлалаа. Чи зүгээр ээ, энэ бол хэвийн зүйл. Би чамтай хамт байна. Одоо чамд юу хэрэгтэй байна?” гэж хэлээрэй. Дараа нь ариун цэврийн хэрэглэл, цэвэр хувцас санал болгож, хувийн орон зайг нь хүндлээрэй.", "Stay calm first and say: \"Thank you for telling me. You're okay, this is normal. I'm here with you. What do you need right now?\" Then offer supplies and clean clothes, and respect her privacy."); },
  },
  {
    icon: AlertCircle,
    get title() { return t("4. Худал ойлголтыг хэрхэн залруулах вэ?", "4. How do I correct myths?"); },
    get text() { return t("“Сарын тэмдгийн цус бохир биш, биеэс гарах хэвийн цус. Сарын тэмдэгтэй үед усанд орж, сургуульдаа явж, дуртай үйл ажиллагаагаа хийж болно. Хүн бүрийн мөчлөг, өвдөлт өөр байдаг” гэж баримтаар, ичээхгүй тайлбарлаарай. “Заавал тэсэх ёстой” гэж хэлэлгүй, хүчтэй өвдөлт эсвэл санаа зовоосон цус алдалт байвал эмчтэй зөвлөлдөөрэй.", "Explain with facts, without shame: \"Period blood isn't dirty, it's normal blood from the body. You can shower, go to school and do the things you love on your period. Everyone's cycle and pain are different.\" Don't say \"you just have to bear it\" — if there's strong pain or worrying bleeding, talk to a doctor."); },
  },
  {
    icon: Users,
    get title() { return t("5. Аавууд юу хийж болох вэ?", "5. What can dads do?"); },
    get text() { return t("Аавууд ч бас тайван, хүндэтгэлтэй ярилцаж, хэрэглэл авч өгөх, нөөц хэрэглэл бэлдэх, угаалга эсвэл эмчид очиход тусалж болно. “Ээжээсээ асуу” гэж бүх хариуцлагыг шилжүүлэхийн оронд охиноо сонсож, нууцыг нь зөвшөөрөлгүй бусдад ярихгүй байх нь чухал.", "Dads can also talk calmly and respectfully, buy supplies, keep spares ready, and help with laundry or doctor visits. Instead of passing it all off with \"ask your mom,\" listen to your daughter and never share her private things without her permission."); },
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
          <ArrowLeft className="h-4 w-4" /> {t("Буцах", "Back")}
        </button>
        <Card className="parent-learning-card">
          <SectionTitle
            icon={isCourse ? BookOpen : Sparkles}
            title={isCourse ? t("Эцэг эхийн бэлтгэл курс", "Parent prep course") : t("Охиноо дэмжихэд туслах санаанууд 💗", "Ideas to support your daughter 💗")}
            tone="peach"
            titleStyle={{ color: headingColor }}
          />
          <p className="mb-4 text-sm font-semibold leading-relaxed text-slate-500" style={{ color: bodyColor }}>
            {isCourse
              ? t("Анхны сарын тэмдэг ирэхээс өмнө асран хамгаалагчид зориулсан 5 богино хичээл", "5 short lessons for guardians before the first period")
              : t("Охиноо сарын тэмдгийн үед болон өмнө нь ойлгож, дэмжихэд туслах санаанууд.", "Ideas to help you understand and support your daughter before and during her period.")}
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
              {t("Дэлгэрэнгүй:", "Learn more:")} {" "}
              <a className="underline" style={{ color: bodyColor }} href="https://www.acog.org/womens-health/faqs/your-first-period" target="_blank" rel="noreferrer">{t("ACOG · Эхний сарын тэмдэг", "ACOG · Your first period")}</a>
              {" · "}
              <a className="underline" style={{ color: bodyColor }} href="https://www.acog.org/womens-health/faqs/vulvovaginal-health" target="_blank" rel="noreferrer">{t("ACOG · Гаднах бэлэг эрхтний арчилгаа", "ACOG · Vulvar care")}</a>
              {" · "}
              <a className="underline" style={{ color: bodyColor }} href="https://www.nhs.uk/conditions/periods/period-problems/" target="_blank" rel="noreferrer">{t("NHS · Сэтгэл санаа ба сарын тэмдэг", "NHS · Mood and periods")}</a>
              {" · "}
              <a className="underline" style={{ color: bodyColor }} href="https://www.acog.org/womens-health/faqs/dysmenorrhea-painful-periods" target="_blank" rel="noreferrer">{t("ACOG · Өвдөлттэй сарын тэмдэг", "ACOG · Painful periods")}</a>
              {" · "}
              <a className="underline" style={{ color: bodyColor }} href="https://www.unicef.org/parenting/health/talking-about-periods-at-home" target="_blank" rel="noreferrer">{t("UNICEF · Гэртээ ярилцах нь", "UNICEF · Talking at home")}</a>
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
          <span className="block text-lg font-black leading-snug" style={{ color: headingColor }}>{t("Охиноо дэмжихэд туслах санаанууд 💗", "Ideas to support your daughter 💗")}</span>
          <span className="mt-1.5 block text-sm font-semibold leading-relaxed" style={{ color: bodyColor }}>{t("Өдөр тутамд нь ойлгож, туслах 7 санаа", "7 ideas to understand and help every day")}</span>
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
          <span className="block text-lg font-black leading-snug" style={{ color: headingColor }}>{t("Эцэг эхийн бэлтгэл курс", "Parent prep course")}</span>
          <span className="mt-1.5 block text-sm font-semibold leading-relaxed" style={{ color: bodyColor }}>{t("Анхны сарын тэмдгийн өмнөх 5 богино хичээл", "5 short lessons before the first period")}</span>
        </span>
        <ChevronRight className="h-6 w-6 shrink-0 text-[#B83B7E]" />
      </button>
    </div>
  );
}
