# Bloomy — багийн ажлын заавар

## Фолдерын бүтэц

```
app/
  page.tsx                  → Application бүрхүүлийг дууддаг
  layout.tsx, manifest.ts   → апп-ын нэр, дүрс, PWA тохиргоо
  api/ai/route.ts           → AI (Gemini API) — СЕРВЕР дээр ажиллана, API key энд
components/
  Application.jsx           → контекст provider болон аппын бүрхүүлийг холбодог
  AppProviders.jsx          → Family, Friends provider-ууд
  layout/                   → үндсэн бүрхүүл, толгой, доод навигаци, дэлгэц сонголт
  system/                   → ачаалал, тохиргооны алдаа, өгөгдөл татах алдааны дэлгэц
  ui/                       → дахин ашиглах жижиг хэсгүүд (Card, SectionTitle, PageHeader…)
  onboarding/               → нэвтрэх/бүртгүүлэх, ээжийн код, охин код оруулах, мөчлөг тохируулах
  daughter/                 → охины дэлгэцүүд (Өнөөдөр, Зөвлөмж, Хэрэгсэл, мөчлөгийн тойрог)
  mother/                   → ээжийн дэлгэцүүд (Халамж, Хэрэгсэл, Мэдэгдэл)
  learn/                    → боловсролын хэсэг
  settings/                 → «Би» хэсэг (профайл, нууцлал, гарах)
  sos/                      → SOS цонх
context/
  FamilyContext.jsx         → бүх өгөгдөл: Supabase-ээс татах, хадгалах, realtime синк
lib/
  data.js                   → статик текст: мөчлөгийн үе, зөвлөмж, сэтгэл санаа, SOS…
  helpers.js, dates.js      → туслах функцууд (мөчлөгийн тооцоо)
  supabase.js               → Supabase холболт
  ai-client.js              → апп → /api/ai хүсэлт
supabase/
  schema.sql                → database-ийн бүтэц + аюулгүй байдлын дүрэм (RLS)
styles/bloom.css            → өнгө (bb-*), анимейшн (bloom-*)
```

Тохируулах заавар: **SETUP.md**

## Хэн юун дээр ажиллах вэ (санал)

| Хүн | Фолдер | Branch-ийн жишээ |
|---|---|---|
| 1 | `components/daughter/` | `feature/daughter-insights` |
| 2 | `components/mother/` | `feature/mother-supplies` |
| 3 | `components/learn/`, `lib/data.js` | `feature/learn-quiz` |
| 4 | `components/onboarding/`, `components/settings/`, `components/sos/` | `fix/sos-timer` |
| 5 | `app/api/ai/route.ts` (AI-ийн prompt) | `feature/ai-prompts` |

**`context/FamilyContext.jsx`, `components/layout/AppShell.jsx`, `supabase/schema.sql`-ийг нэг удаад зөвхөн нэг хүн засна.** Бүх дэлгэц эдгээрээс хамаардаг тул хоёр хүн зэрэг засвал conflict гарна. Эдгээрт өөрчлөлт хэрэгтэй бол issue дээр бичээд, нэг хүн хариуцна.

## Шинэ state эсвэл үйлдэл нэмэх

1. `context/FamilyContext.jsx` дотор `useState` эсвэл функц нэмнэ.
2. Файлын төгсгөлд байрлах `value = { ... }` дотор нэрийг нь нэмнэ.
3. Дэлгэц дээрээ: `const { шинэНэр } = useFamily();`

## Шинэ таб (дэлгэц) нэмэх

1. `components/<хэсэг>/ШинэДэлгэц.jsx` үүсгэнэ (одоо байгаа дэлгэцүүдийн аль нэгийг загвар болгон хуулж болно).
2. `components/layout/BottomNavigation.jsx` дотор таб, `components/layout/CurrentScreen.jsx` дотор дэлгэцээ холбоно.

## Git урсгал

```bash
git checkout main
git pull                                # хамгийн сүүлийн хувилбарыг татна
git checkout -b feature/daughter-insights   # issue бүрт шинэ branch

# ... кодоо засна ...

git add .
git commit -m "Daughter insights: add water reminder (#12)"   # issue-ийн дугаарыг бичнэ
git push -u origin feature/daughter-insights
```

Дараа нь GitHub дээр **Pull Request** нээгээд нэг хүнээр шалгуулж, `main` руу merge хийнэ.

## Database өөрчлөх бол

1. `supabase/schema.sql`-д өөрчлөлтөө нэмнэ (`create table if not exists`, `add column if not exists` гэх мэт — дахин ажиллуулахад аюулгүй байхаар).
2. Supabase → SQL Editor дээр файлаа дахин **Run** хийнэ.
3. Шинэ хүснэгт бол RLS policy заавал нэмнэ — үгүй бол хэн ч харж чадахгүй (эсвэл бүгд харна!).
