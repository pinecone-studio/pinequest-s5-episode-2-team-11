/**
 * "Блүми эгч" автомат чатбот — AI-гүй, түлхүүр үгээр хариулна (8–12 насны охидод).
 * Сэдвүүдийг дарааллаар нь шалгана: аюулын сэдэв хамгийн түрүүнд.
 * keys: мессежид агуулагдах үгийн үндэс (жижиг үсгээр), монгол ба англи.
 * replies/chips: list([[mn, en]]) — хандах үедээ сонгосон хэлээр гарна.
 */
import { list } from "./i18n";

export const CHAT_TOPICS = [
  {
    id: "danger",
    keys: [
      "хүчир", "зодо", "зодуул", "цохи", "айлга", "дарамт", "гомдоо", "биед минь хүр",
      "нууц хадгал", "амиа", "үхмээр", "үхэх", "өөрийгөө гэмт", "зүсэ", "аюулд", "аюултай", "хулгайл",
      "abuse", "hit me", "hits me", "beat me", "hurt me", "hurts me", "touched me", "touch me",
      "keep a secret", "kill myself", "suicide", "want to die", "self harm", "self-harm", "cut myself",
      "hurt myself", "not safe", "unsafe", "kidnap",
    ],
    replies: list([
      [
        "Чи надад хэлсэн нь маш зоригтой алхам байна 🤍 Энэ чиний буруу огт биш. Яг одоо итгэдэг том хүндээ — ээж, аав, багшдаа хэлээрэй. Яаралтай аюулд байвал 102 (цагдаа) руу залгаарай.",
        "Telling me was a really brave thing to do 🤍 This is not your fault at all. Please tell a trusted adult — your mom, dad or teacher — right now. If you are in danger, call 102 (police).",
      ],
    ]),
    chips: list([["Том хүнд яаж хэлэх вэ?", "How do I tell an adult?"]]),
  },
  {
    id: "urgent",
    keys: [
      "их цус", "цус зогсо", "ухаан алд", "ухаан бал", "маш их өвд", "тэвчихгүй", "халуурч",
      "a lot of blood", "so much blood", "won't stop bleeding", "bleeding won't stop", "faint", "passed out",
      "unbearable", "really bad pain", "fever",
    ],
    replies: list([
      [
        "Энэ анхаарал хэрэгтэй байна 🤍 Яг одоо ээж, аав эсвэл ойр байгаа том хүндээ хэлээрэй. Маш хүнд байвал 103 (түргэн тусламж) руу залгаарай. Чи ганцаараа биш шүү.",
        "This needs attention 🤍 Please tell your mom, dad or the closest adult right now. If it feels really bad, call 103 (ambulance). You are not alone.",
      ],
    ]),
  },
  {
    id: "tell-adult",
    keys: ["том хүнд яаж", "яаж хэлэх", "ээждээ яаж", "ичээд хэлж", "how do i tell", "how to tell", "tell an adult", "shy to tell", "embarrassed to tell"],
    replies: list([
      [
        "«Ээж ээ, надад нэг чухал зүйл ярих хэрэгтэй байна» гэж эхлэхэд хангалттай 🌷 Хэлэхэд хэцүү бол цаасан дээр бичээд өгч болно. Ээж, аав чинь чамд туслахыг хүсдэг шүү.",
        "You can simply start with \"Mom, I need to talk to you about something important\" 🌷 If saying it out loud feels hard, you can write it on paper and hand it to her. Your parents want to help you.",
      ],
    ]),
  },
  {
    id: "greeting",
    keys: ["сайн уу", "сайн байна", "сайнуу", "мэнд", "hello", "hey", "good morning"],
    replies: list([
      [
        "Сайн уу! 🌷 Өнөөдөр юу сонирхож байна? Бие махбод, сэтгэл санаа, найз нөхөд — юу ч асууж болно.",
        "Hi there! 🌷 What's on your mind today? Body, feelings, friends — you can ask me anything.",
      ],
      ["Сайн уу, дүү минь 💗 Өнөөдөр өдөр чинь ямар байна?", "Hey, little sis 💗 How is your day going?"],
    ]),
    chips: list([
      ["Сарын тэмдэг гэж юу вэ? 🌸", "What is a period? 🌸"],
      ["Сэтгэл муу байна 😔", "I feel down 😔"],
    ]),
  },
  {
    id: "thanks",
    keys: ["баярлалаа", "баярлаа", "гоё", "ойлголоо", "thanks", "thank"],
    replies: list([
      ["Зүгээр ээ 💗 Өөр асуух зүйл гарвал хэзээ ч надад бичээрэй!", "Anytime 💗 If you have another question, just write to me!"],
      ["Чамд тусалж чадсандаа баяртай байна 🌷", "I'm so glad I could help 🌷"],
    ]),
  },
  {
    id: "who",
    keys: ["чи хэн", "хүн үү", "робот", "who are you", "are you human", "are you real", "robot", "are you ai", "are you an ai"],
    replies: list([
      [
        "Би Блүми эгч — энэ апп доторх автомат туслах 🤖🌷 Би хүн биш, эмч ч биш. Гэхдээ чамд хэрэгтэй мэдээллийг энгийнээр хэлж өгөхийг хичээдэг!",
        "I'm Big Sis Bloomy — an automatic helper inside this app 🤖🌷 I'm not a human and not a doctor, but I try to explain things simply for you!",
      ],
    ]),
  },
  {
    id: "first-period",
    keys: ["анхны", "анх удаа", "эхэлсэн", "ирчихлээ", "ирчихсэн", "хэзээ ирэх", "хэдэн настай", "first period", "when will i get", "got my period", "started my period"],
    replies: list([
      [
        "Сарын тэмдэг ихэвчлэн 9–15 насны хооронд анх ирдэг — хүн бүрт өөр байх нь хэвийн 🌸 Ирвэл сандрах хэрэггүй: хэрэглэл хэрэглээд, ээж эсвэл итгэдэг том хүндээ хэлээрэй. Тэд чамд туслахдаа баяртай байх болно.",
        "Most girls get their first period somewhere between 9 and 15 — everyone's timing is different, and that's normal 🌸 If it comes, don't panic: use a pad and tell your mom or a trusted adult. They'll be happy to help you.",
      ],
    ]),
    chips: list([
      ["Ариун цэврийн хэрэглэл яаж хэрэглэх вэ?", "How do I use a pad?"],
      ["Гэдэс өвдөж байна", "My tummy hurts"],
    ]),
  },
  {
    id: "period",
    keys: ["сарын тэмдэг", "сарын", "мөчлөг", "цус гар", "period", "menstru", "cycle"],
    replies: list([
      [
        "Сарын тэмдэг бол охины бие том болж байгаагийн эрүүл, хэвийн шинж 🌸 Сар бүр умайн доторх зөөлөн давхарга гадагшилдаг бөгөөд ихэвчлэн 3–7 хоног үргэлжилдэг. Ичих зүйл огт биш!",
        "A period is a healthy, normal sign that your body is growing up 🌸 Each month the soft lining inside the womb leaves the body, usually over 3–7 days. It's nothing to be shy about!",
      ],
    ]),
    chips: list([
      ["Анхны сарын тэмдэг хэзээ ирэх вэ?", "When will my first period come?"],
      ["Ариун цэврийн хэрэглэл яаж хэрэглэх вэ?", "How do I use a pad?"],
    ]),
  },
  {
    id: "pads",
    keys: ["хэрэглэл", "тампон", "ариун цэвэр", "солих", "угаах", "pad", "tampon", "menstrual cup"],
    replies: list([
      [
        "Ариун цэврийн хэрэглэлийг дотуур өмднийхөө дунд наалдамхай талаар нь наана 🌷 3–4 цаг тутам, эсвэл норсон үед сольж байгаарай. Хэрэглэсэн хэрэглэлээ цаасанд ороож хогийн саванд хая. Сургуулийн цүнхэндээ 2–3 хэрэглэл хийж явбал тайван байна!",
        "Stick the pad in the middle of your underwear, sticky side down 🌷 Change it every 3–4 hours, or sooner if it feels full. Wrap the used one in paper and put it in the bin. Keeping 2–3 pads in your school bag helps you feel calm!",
      ],
    ]),
    chips: list([["Сургууль дээр ирчихвэл яах вэ?", "What if it starts at school?"]]),
  },
  {
    id: "school-period",
    keys: ["сургууль дээр ирчих", "хичээл дээр ирчих", "толбо", "ичмээр", "starts at school", "at school", "leak", "stain"],
    replies: list([
      [
        "Санаа зоволтгүй, энэ олон охинд тохиолддог 🤍 Багш эсвэл сургуулийн эмчээс хэрэглэл асууж болно. Толбо гарвал цамцаа бэлхүүсээрээ уяж болно. Гэртээ ирээд хүйтэн усаар угаавал толбо арилдаг!",
        "Don't worry, this happens to lots of girls 🤍 You can ask a teacher or the school nurse for a pad. If there's a stain, tie a sweater around your waist. At home, cold water washes the stain out!",
      ],
    ]),
  },
  {
    id: "cramps",
    keys: ["базла", "гэдэс өвд", "хэвлий өвд", "өвдөж", "өвдөөд", "нуруу өвд", "cramp", "tummy hurt", "stomach hurt", "belly hurt", "back hurt", "pain"],
    replies: list([
      [
        "Сарын тэмдгийн үед гэдэс базлах нь хэвийн 🤍 Халуун жин хэвлий дээрээ тавих, бүлээн ус уух, хөнгөн сунгалт хийх нь тусална. Апп доторх SOS товчийг дараад амьсгалын дасгал хийгээрэй. Хэт их өвдвөл том хүндээ заавал хэлээрэй.",
        "Cramps during a period are normal 🤍 A warm water bottle on your tummy, warm drinks and gentle stretching can help. Try the SOS button in the app for a breathing exercise. If it hurts a lot, please tell an adult.",
      ],
    ]),
  },
  {
    id: "body",
    keys: ["хөх", "үс ург", "өсөлт", "биеийн өөрчлөлт", "бие өөрчл", "батга", "хөлс", "үнэр", "өндөр", "breast", "boob", "puberty", "acne", "pimple", "sweat", "smell", "body chang", "hair grow"],
    replies: list([
      [
        "Өсвөр насанд бие өөрчлөгдөх нь бүрэн хэвийн 🌱 Хөх томрох, шинэ газар үс ургах, батга гарах, хөлрөх — эдгээр нь бүгд том болж буйн шинж. Хүн бүр өөр хурдаар өсдөг тул бусадтай харьцуулах хэрэггүй!",
        "Your body changing as you grow is completely normal 🌱 Breasts growing, new hair, spots and sweating are all signs of growing up. Everyone grows at their own speed, so there's no need to compare!",
      ],
      [
        "Батга, хөлс бол дааврын өөрчлөлтийн хэвийн шинж ✨ Өдөр бүр нүүрээ зөөлөн угааж, усанд орж, цэвэр хувцас өмсөхөд л хангалттай.",
        "Spots and sweat are normal signs of hormone changes ✨ Gently washing your face, showering and wearing clean clothes every day is enough.",
      ],
    ]),
  },
  {
    id: "body-image",
    keys: ["тарган", "туранхай", "муухай", "царай муу", "жин", "хоолоо хас", "өөртөө дургүй", "i'm fat", "im fat", "too fat", "ugly", "skinny", "weight", "diet", "hate my body"],
    replies: list([
      [
        "Чиний бие чамайг гүйлгэж, инээлгэж, тэврүүлж байдаг гайхалтай бие 💗 Хүн бүрийн бие өөр бөгөөд бүгд үзэсгэлэнтэй. Өлсгөлөн барих, хоолоо хасах нь өсөж буй биед хортой. Санаа зовоод байвал ээждээ эсвэл эмчид хэлээрэй.",
        "Your body is amazing — it lets you run, laugh and hug 💗 Every body is different, and every body is beautiful. Skipping meals is harmful for a growing body. If you're worried, talk to your mom or a doctor.",
      ],
    ]),
  },
  {
    id: "sad",
    keys: ["гуниг", "уйл", "сэтгэл муу", "ганцаар", "хэн ч", "муу байна", "уйтгар", "sad", "cry", "lonely", "alone", "nobody", "feel down", "upset"],
    replies: list([
      [
        "Гунигтай байхад хэцүү шүү дээ 🤍 Мэдрэмж бүр хэвийн бөгөөд өнгөрдөг. Нүдээ аниад 4 удаа гүнзгий амьсгаа аваад үзээрэй. Чамд юу болсныг итгэдэг хүндээ ярьвал илүү хөнгөн болно. Би ч бас сонсож байна — юу болов?",
        "Feeling sad is really hard 🤍 Every feeling is okay, and it will pass. Try closing your eyes and taking 4 slow, deep breaths. Talking to someone you trust can make it lighter. I'm listening too — what happened?",
      ],
    ]),
    chips: list([
      ["Найзтайгаа муудалцчихлаа 😔", "I fought with my friend 😔"],
      ["Санаа зовоод байна", "I'm worried"],
    ]),
  },
  {
    id: "angry",
    keys: ["уурла", "ууртай", "уур хүр", "бухимд", "цочро", "angry", "mad at", "annoyed", "frustrat", "furious"],
    replies: list([
      [
        "Уурлах нь хэвийн мэдрэмж 🔥 Хэнийг ч гомдоохгүйгээр гаргах нь чухал. 10 хүртэл тоолох, цаасан дээр бичээд урах, гадаа гарч гүйх нь тусалдаг. Тайвширсны дараа яагаад уурласнаа ярилцаж болно.",
        "Anger is a normal feeling 🔥 What matters is letting it out without hurting anyone. Counting to 10, writing it down and ripping up the paper, or running outside can help. Once you're calm, you can talk about why you felt angry.",
      ],
    ]),
  },
  {
    id: "worry",
    keys: ["санаа зов", "айж", "айгаад", "түгш", "стресс", "сандар", "worri", "worry", "scared", "afraid", "anxious", "nervous", "stress", "panic"],
    replies: list([
      [
        "Санаа зовох нь бие чинь чамайг хамгаалах гэж байгаа арга 🌷 4 секунд амьсгаа аваад, 4 секунд барьж, 4 секундэд гаргаарай — 3 удаа давт. Юунд санаа зовж байгаагаа том хүнтэй ярилцвал хүнд ачаа хөнгөрдөг.",
        "Worrying is your body's way of trying to protect you 🌷 Breathe in for 4 seconds, hold for 4, breathe out for 4 — repeat 3 times. Sharing your worry with an adult makes it feel lighter.",
      ],
    ]),
  },
  {
    id: "bullying",
    keys: ["шоол", "дээрэлх", "доромж", "тохуурх", "гадуурх", "хэлээд байна", "bully", "bullied", "tease", "make fun", "mean to me", "left out", "laugh at me"],
    replies: list([
      [
        "Хэн ч чамайг шоолох, доромжлох эрхгүй 🤍 Энэ чиний буруу биш. Багш, ээж, аавдаа заавал хэлээрэй — тэд үүнийг зогсоож чадна. Үргэлжилж байвал дахин хэлж, тусламж хүсээрэй.",
        "Nobody has the right to tease or put you down 🤍 It's not your fault. Please tell a teacher, your mom or dad — they can make it stop. If it keeps happening, tell them again and keep asking for help.",
      ],
    ]),
  },
  {
    id: "family",
    keys: ["ээж", "аав", "эгч", "ахдаа", "дүү", "гэр бүл", "загна", "mom", "mum", "dad", "sister", "brother", "family", "parents", "scold"],
    replies: list([
      [
        "Гэр бүлтэйгээ ярилцах заримдаа хэцүү байдаг 🏠 Тайван үед «Би ингэж мэдэрч байна» гэж эхлээд үзээрэй. Ээж, аав чинь чамд хайртай бөгөөд чамайг ойлгохыг хүсдэг.",
        "Talking with family can be hard sometimes 🏠 Try starting with \"I feel…\" when everyone is calm. Your mom and dad love you and want to understand you.",
      ],
    ]),
  },
  {
    id: "friends",
    keys: ["найз", "муудал", "хэрүүл", "маргал", "таалагд", "хайртай", "friend", "fight", "argu", "crush"],
    replies: list([
      [
        "Найзуудын хооронд маргаан гарах нь хэвийн 🤝 Тайвширсны дараа «Би ингэж мэдэрсэн» гэж өөрийнхөө мэдрэмжийг хэлээд үзээрэй. Жинхэнэ найз чамайг сонсож, хүндэлдэг. Эвлэрэх анхны алхмыг хийх нь зоригтой хэрэг!",
        "Friends argue sometimes, and that's normal 🤝 Once you're calm, try telling her \"I felt…\". A true friend listens and respects you. Taking the first step to make up is brave!",
      ],
      [
        "Найзтай холбоотой асуудал зүрх шимшрүүлдэг 💗 Түүнтэй ганцаараа тайван ярилцаж болох уу? Хэцүү бол ээж эсвэл багшаасаа зөвлөгөө аваарай.",
        "Friendship troubles can really hurt 💗 Could you talk with her calmly, just the two of you? If that's hard, ask your mom or teacher for advice.",
      ],
    ]),
  },
  {
    id: "school",
    keys: ["хичээл", "шалгалт", "сургууль", "төвлөр", "даалгавар", "дүн", "багш", "school", "homework", "exam", "test", "focus", "study", "teacher"],
    replies: list([
      [
        "Хичээлдээ төвлөрөхийн тулд 25 минут хичээллээд 5 минут амраарай 📚 Утсаа өөр өрөөнд тавь. Ус ууж, сайн унтах нь тархинд их тус болно. Ойлгохгүй зүйл байвал багшаасаа асуух нь ичмээр биш, ухаалаг хэрэг!",
        "To focus, study for 25 minutes and then rest for 5 📚 Leave your phone in another room. Drinking water and sleeping well really help your brain. Asking your teacher when you don't understand isn't embarrassing — it's smart!",
      ],
    ]),
  },
  {
    id: "confidence",
    keys: ["итгэл", "итгэлтэй", "би чадахгүй", "би муу", "ичимхий", "confiden", "i can't", "i cant", "shy", "not good enough"],
    replies: list([
      [
        "Чи өөрийнхөөрөө байхад л хангалттай гайхалтай ✨ Өдөр бүр өөртөө 1 сайхан үг хэлж, амжилтаа — хичнээн жижиг ч бай — бичиж аваарай. Шинэ зүйл туршихад алдах нь сурч буйн шинж!",
        "Just being yourself is already amazing ✨ Each day, say one kind thing to yourself and write down your wins — even tiny ones. Making mistakes when you try something new means you're learning!",
      ],
    ]),
  },
  {
    id: "sleep",
    keys: ["нойр", "унта", "ядар", "ядраад", "сульд", "sleep", "tired", "exhausted"],
    replies: list([
      [
        "Чиний насныханд өдөрт 9–12 цаг унтах хэрэгтэй 🌙 Унтахаас 1 цагийн өмнө утсаа тавиад, өрөөгөө харанхуй, сэрүүн байлгаарай. Өглөө нарны гэрэлд гарах нь сэргэхэд тусална.",
        "Kids your age need about 9–12 hours of sleep 🌙 Put your phone away 1 hour before bed and keep your room dark and cool. Morning sunlight helps you wake up fresh.",
      ],
    ]),
  },
];

export const CHAT_FALLBACKS = list([
  [
    "Сонирхолтой асуулт байна 🌷 Би энэ талаар сайн мэдэхгүй байна. Ээж, аав эсвэл багшаасаа асуугаад үзээрэй. Харин сарын тэмдэг, бие махбод, сэтгэл санаа, найз нөхөд, хичээлийн талаар асуувал туслах болно!",
    "That's an interesting question 🌷 I'm not sure about that one — try asking your mom, dad or teacher. But I can help with periods, your body, feelings, friends and school!",
  ],
  [
    "Чамайг ойлгохыг хичээж байна 💗 Арай өөрөөр бичээд үзэх үү? Жишээ нь: «гэдэс өвдөж байна», «найзтайгаа муудалцлаа», «шалгалтаас айж байна».",
    "I'm trying to understand you 💗 Could you write it a little differently? For example: \"my tummy hurts\", \"I fought with my friend\", \"I'm scared of my exam\".",
  ],
]);

/** Мессежид тохирох хариу ба дараагийн асуултын санааг буцаана. */
export function autoReply(text) {
  const t = text.toLowerCase();
  const topic = CHAT_TOPICS.find((tp) => tp.keys.some((k) => t.includes(k)));
  const pool = topic?.replies ?? CHAT_FALLBACKS;
  return {
    reply: pool[Math.floor(Math.random() * pool.length)],
    chips: topic?.chips ? [...topic.chips] : [],
    urgent: topic?.id === "danger" || topic?.id === "urgent",
  };
}
