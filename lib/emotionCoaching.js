/**
 * Emotion coaching for guardians: 5 steps (notice → connect → listen → name → solve together),
 * with "✅ say" / "❌ don't say" phrases per signal type. DRAFT — content to be reviewed.
 * Signal types: sad, pain, hug, alone, talk (only pain + talk can be sent by the girl today).
 */
export const COACHING_DRAFT = true;

export const COACHING_STEPS = [
  { id: "notice", title: "1. Анзаар", lesson: "Охины үг, царай, үйлдэлд гарсан өөрчлөлтийг анзаар. Бүх мэдрэмж хэвийн." },
  { id: "connect", title: "2. Ойртох боломж", lesson: "Хүнд мэдрэмж бол засах асуудал биш, ойртох боломж. Утсаа тавиад, хажууд нь оч." },
  { id: "listen", title: "3. Сонс", lesson: "Зөвлөгөө өгөх, засах гэж яарахгүй. Эхлээд бүрэн сонсоод, толгой дохи." },
  { id: "name", title: "4. Нэрлэ", lesson: "Түүний мэдрэмжийг үгээр нэрлэхэд тусал: «Чи гунигтай байна уу?»" },
  { id: "solve", title: "5. Хамтдаа шийд", lesson: "Мэдрэмж тайвширсны дараа юу хийхийг хамтдаа сонго. Шийдлийг тулгахгүй." },
];

export const COACHING_STEPS_EN = [
  { id: "notice", title: "1. Notice", lesson: "Notice changes in your daughter's words, expressions, or actions. All feelings are valid." },
  { id: "connect", title: "2. Get close", lesson: "A difficult feeling is not a problem to fix; it is a chance to connect. Put your phone down and sit with her." },
  { id: "listen", title: "3. Listen", lesson: "Don't rush to advise or fix things. Listen fully first and show you're present." },
  { id: "name", title: "4. Name it", lesson: "Help her put the feeling into words: “Are you feeling sad?”" },
  { id: "solve", title: "5. Solve it together", lesson: "Once things feel calmer, choose what to do together. Don't force a solution." },
];

export const SIGNAL_LABELS = {
  sad: "😢 Гунигтай байна",
  pain: "🌡️ Өвдөж байна",
  hug: "🤗 Тэвэрмээр байна",
  alone: "🫧 Ганцаардаж байна",
  talk: "💬 Ярилцмаар байна",
};

export const SIGNAL_LABELS_EN = {
  sad: "😢 I feel sad",
  pain: "🌡️ I'm in pain",
  hug: "🤗 I want a hug",
  alone: "🫧 I feel lonely",
  talk: "💬 I want to talk",
};

/** say / avoid per step (same order as COACHING_STEPS). */
export const COACHING = {
  sad: [
    { say: "«Өнөөдөр жаахан гунигтай харагдаж байна.»", avoid: "«Гунигтай байх юу байгаа юм?»" },
    { say: "«Би хажууд чинь сууя. Яарах юм алга.»", avoid: "«Одоо завгүй байна, дараа ярья.»" },
    { say: "«Ярих уу? Би сонсож байна.»", avoid: "«Ингэх хэрэгтэй байсан юм…»" },
    { say: "«Чамайг гомдсон юм шиг санагдлаа, тийм үү?»", avoid: "«Битгий уйл, зүгээр шүү дээ.»" },
    { say: "«Юу хийвэл чамд дээр санагдах вэ?»", avoid: "«Маргааш л мартчихна.»" },
  ],
  pain: [
    { say: "«Өвдөж байгааг чинь мэдлээ. Би ойрхон байна.»", avoid: "«Бүх эмэгтэй өвддөг, тэвч.»" },
    { say: "«Халуун жин бэлдээд ирье.»", avoid: "«Ийм юманд сургуулиа тасалж болохгүй.»" },
    { say: "«Хаана, яаж өвдөж байна?»", avoid: "«Хэтрүүлж байна.»" },
    { say: "«Их тавгүй байгаа биз дээ.»", avoid: "«Энэ чинь юу ч биш.»" },
    { say: "«Амрах уу, эсвэл бага зэрэг алхах уу? Хүчтэй өвдөөд байвал эмчид хамт очъё.»", avoid: "«Өөрөө л зохицуул.»" },
  ],
  hug: [
    { say: "«Тэврүүлмээр байгааг чинь мэдлээ 🤍»", avoid: "«Том болсон хүүхэд чинь…»" },
    { say: "Үг хэлэлгүй тэвэр.", avoid: "«Дараа, одоо биш.»" },
    { say: "«Чи юу ч хэлэх шаардлагагүй.»", avoid: "«Яасан бэ? Хэлээдэх.» гэж шахах" },
    { say: "«Ядарсан өдөр байсан уу?»", avoid: "«Хөөх, сонин юм.»" },
    { say: "«Өнөө орой хамт кино үзэх үү?»", avoid: "Юу ч болоогүй мэт өнгөрөх" },
  ],
  alone: [
    { say: "«Ганцаардаж байгааг чинь мэдлээ.»", avoid: "«Найз нөхөдтэй чинь ч юу болоод байгаа юм?»" },
    { say: "«Хамт цай ууя.»", avoid: "«Өрөөндөө л суу.»" },
    { say: "«Юу болсныг хүсвэл ярь, би сонсоё.»", avoid: "«Чи л буруу байсан байх.»" },
    { say: "«Хэн ч ойлгохгүй байгаа юм шиг санагдаж байна уу?»", avoid: "«Битгий жүжиглэ.»" },
    { say: "«Энэ долоо хоногт хэнтэй уулзмаар байна?»", avoid: "Найзыг нь шууд дуудаж шийдэх" },
  ],
  talk: [
    { say: "«Ярилцмаар байна гэж хэлсэнд баярлалаа.»", avoid: "«Юу болсон бэ? Хурдан хэл.»" },
    { say: "«Чамд одоо цаг гаргая.»", avoid: "«Завгүй байна.» гэж хойшлуулах" },
    { say: "«Би сонсож байна.»", avoid: "Яриаг нь тасалж зөвлөгөө өгөх" },
    { say: "«Чи … гэж мэдэрсэн юм байна.»", avoid: "«Тийм юманд санаа зовох хэрэггүй.»" },
    { say: "«Одоо юу хийвэл дээр вэ, хамтдаа бодъё.»", avoid: "«За, ингээд л шийдчих.»" },
  ],
};

export const COACHING_EN = {
  sad: [
    { say: "“You seem a little sad today.”", avoid: "“What do you have to be sad about?”" },
    { say: "“I'll sit with you. There's no rush.”", avoid: "“I'm busy now; we'll talk later.”" },
    { say: "“Would you like to talk? I'm listening.”", avoid: "“You should have…”" },
    { say: "“It seems like that hurt your feelings, is that right?”", avoid: "“Don't cry, it's fine.”" },
    { say: "“What would help you feel better?”", avoid: "“You'll forget about it tomorrow.”" },
  ],
  pain: [
    { say: "“I can see that you're hurting. I'm here.”", avoid: "“Everyone has cramps; just deal with it.”" },
    { say: "“I'll get you a warm compress.”", avoid: "“You can't miss school for this.”" },
    { say: "“Where does it hurt, and what does it feel like?”", avoid: "“You're exaggerating.”" },
    { say: "“That must feel really uncomfortable.”", avoid: "“It's nothing.”" },
    { say: "“Would you like to rest or take a short walk? If the pain is strong, we can see a doctor together.”", avoid: "“Figure it out yourself.”" },
  ],
  hug: [
    { say: "“I hear that you want a hug 🤍”", avoid: "“You're too old for that…”" },
    { say: "Give her a hug without saying anything.", avoid: "“Later, not now.”" },
    { say: "“You don't have to say anything.”", avoid: "Pressuring her with “What happened? Tell me.”" },
    { say: "“Was it a tiring day?”", avoid: "“Wow, that's weird.”" },
    { say: "“Would you like to watch a movie together tonight?”", avoid: "Acting like nothing happened." },
  ],
  alone: [
    { say: "“I hear that you're feeling lonely.”", avoid: "“What's going on with your friends now?”" },
    { say: "“Let's have tea together.”", avoid: "“Just stay in your room.”" },
    { say: "“You can tell me what happened if you want. I'll listen.”", avoid: "“You were probably the one at fault.”" },
    { say: "“Does it feel like no one understands?”", avoid: "“Stop being dramatic.”" },
    { say: "“Who would you like to spend time with this week?”", avoid: "Inviting a friend without asking her." },
  ],
  talk: [
    { say: "“Thank you for telling me you want to talk.”", avoid: "“What happened? Tell me quickly.”" },
    { say: "“I'll make time for you now.”", avoid: "Putting it off with “I'm busy.”" },
    { say: "“I'm listening.”", avoid: "Interrupting to give advice." },
    { say: "“You felt …”", avoid: "“You don't need to worry about that.”" },
    { say: "“Let's think together about what might help now.”", avoid: "“There, that's settled.”" },
  ],
};

/** Notification events → coaching type. */
export const SIGNAL_TYPE_BY_EVENT = { guardian_signal: "pain", talk_request: "talk" };
