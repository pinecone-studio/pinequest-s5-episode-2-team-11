bun# Bloomy 🌿

Өсвөр насны охид болон тэдний ээж / асран хамгаалагчдад зориулсан сарын тэмдэг, халамжийн апп.

## Боломжууд

**👧 Охин**
- Мөчлөгийн тооцоо, мөчлөгийн цагираг (дараагийн сарын тэмдэг, үе шат)
- Өдөр бүрийн сэтгэл санаа сонгох → AI зөвлөмж
- SOS — өвдөлт намдаах сунгалтын дасгал, «Ээжид мэдэгдэх»
- Ариун цэврийн хэрэгслийн үлдэгдэл хянах
- Өнөөдрийн ордын зурхай
- Сурах булан — хэрэглэл хэрэглэх заавар зурагтай
- Найзууд: найзын кодоор холбогдож, яаралтай үед хэрэглэл SOS илгээх (чатгүй, тогтсон хариултууд)

**👩 Ээж / асран хамгаалагч**
- Охины халамжийн статус бодит хугацаанд
- AI сануулга, мэдэгдэл
- Хэрэгслийн үлдэгдэл → «Нөхөн дүүргэсэн»

**Бусад**
- 🔒 Гэр бүл бүр хаалттай, охин юуг хуваалцахаа өөрөө шийднэ
- 🌙 Цайвар / бараан горим
- 📱 Утсанд апп шиг суулгана (PWA)

## Технологи

Next.js 16 · React 19 · Tailwind CSS 4 · Supabase (Auth, Postgres, Realtime) · Gemini API

## Эхлэх

1. Supabase-ийн SQL Editor дээр `supabase/schema.sql`, дараа нь `supabase/friends.sql`-ийг ажиллуулна.
2. Төслийн үндсэн фолдерт `.env.local` үүсгэнэ:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   GEMINI_API_KEY=таны-gemini-api-key
   # GEMINI_MODEL=gemini-3.8-flash   # заавал биш
   ```

3. Ажиллуулна:

   ```bash
   npm install
   npm run dev      # → http://localhost:3000
   npm run phone    # утаснаас турших (0.0.0.0 дээр)
   ```

> AI key байхгүй ч апп ажиллана — AI-ийн оронд бэлэн зөвлөмжүүд харагдана.

## Скриптүүд

| Команд | Үйлдэл |
|---|---|
| `npm run dev` | Хөгжүүлэлтийн сервер |
| `npm run phone` | Сүлжээн дэх утаснаас нээх боломжтой dev сервер |
| `npm run build` | Production build |
| `npm run start` | Production сервер |

## Бүтэц

```
app/
  api/ai/          Gemini API-р AI зөвлөмж
  api/horoscope/   Өнөөдрийн ордын зурхай (gogo.mn)
  components/      daughter · mother · friends · learn · sos · onboarding · settings · layout · ui
  daughter/ mother/ friends/ learn/ settings/   Хуудсууд
context/           FamilyContext · FriendsContext · ThemeContext
lib/               Supabase клиент, огноо/мөчлөгийн тооцоо, туслах функцууд
supabase/          schema.sql, friends.sql
public/            Лого, PWA дүрснүүд
```

## Дэлгэрэнгүй

- Бүрэн тохируулах заавар, Vercel-д гаргах, демо хийх дараалал: **[SETUP.md](./SETUP.md)**
- Багаар ажиллах: **[TEAM.md](./TEAM.md)**
