# VocabFlow

تطبيق شخصي (مستخدم واحد) لتعلّم الفرنسية بالتكرار المتباعد عبر خوارزمية **SM-2**.
مصدر الكلمات هو Google Sheet، والتقدّم كله مُخزَّن في PostgreSQL (Neon).

## الستاك

- **TanStack Start + TanStack Router** (Vite plugin)
- **Drizzle ORM** + **Neon** Postgres (driver `neon-http`)
- **Zod** للتحقق من المدخلات والبيئة
- **Tailwind CSS v4** (CSS-first، mobile-first)
- **TypeScript** صارم (بدون `any`)
- النطق عبر **Web Speech API** المدمجة في المتصفح (`fr-FR`)
- النشر على **Vercel** (عبر Nitro، كشف تلقائي)

## الإعداد المحلي

```bash
npm install
cp .env.example .env   # ثم املأ DATABASE_URL
npm run db:migrate     # إنشاء الجداول في Neon
npm run dev            # http://localhost:3000
```

### متغيرات البيئة (خادمية فقط — بدون بادئة VITE_)

| المتغير | الوصف |
|---|---|
| `DATABASE_URL` | سلسلة اتصال Neon (المجمّعة/pooled). تُقرأ من `process.env` فقط. |
| `GOOGLE_SHEET_ID` | معرّف الشيت العام. |
| `GOOGLE_SHEET_GID` | معرّف التبويب (gid). |

> الشيت يجب أن يكون "Anyone with the link – Viewer". تتم القراءة عبر تصدير CSV من gviz بدون أي مفتاح API.

## الأوامر

| الأمر | الوظيفة |
|---|---|
| `npm run dev` | خادم التطوير |
| `npm run build` | بناء الإنتاج |
| `npm run typecheck` | فحص الأنواع الصارم |
| `npm run db:generate` | توليد ملفات الترحيل من المخطط |
| `npm run db:migrate` | تطبيق الترحيلات على قاعدة البيانات |
| `npm run db:studio` | واجهة Drizzle Studio |
| `npm run verify:sm2` | اختبار خوارزمية SM-2 |
| `npm run verify:sheet` | اختبار قراءة/تحليل الشيت الفعلي |

## البنية

```
src/
  routes/        __root.tsx · index.tsx (لوحة الإحصائيات) · review.tsx · words.tsx
  components/     Flashcard · PronounceButton · StatCard · SyncButton · AppHeader · …
  server/         words.ts · review.ts · sync.ts   (Server Functions)
  db/             schema.ts (3 جداول) · index.ts (عميل Neon)
  lib/            sm2.ts · sheet.ts · speech.ts · stats.ts · env.ts
  schemas/        word.ts (Zod + DTOs)
drizzle/          ملفات ترحيل SQL
```

## النشر على Vercel

1. أنشئ مشروعًا على Vercel من هذا المستودع — يُكتشف TanStack Start تلقائيًا (لا حاجة لضبط أمر البناء أو مجلد الإخراج).
2. أضف متغيرات البيئة الثلاثة في إعدادات المشروع (Production + Preview).
3. شغّل الترحيلات مرة واحدة مقابل قاعدة Neon: `npm run db:migrate` (محليًا مع `DATABASE_URL` للإنتاج، أو عبر خطوة بناء).
4. Node 20+ (مثبّت عبر `engines`).

## كيف تعمل المزامنة

`syncFromSheet` يجلب CSV من gviz، يحلّله بالموضع (A=الفرنسية، B=النوع، C=المعنى العربي، D=المثال)،
ويُدرج الصفوف الجديدة فقط (مطابقة حرفية على `frenchText`)، ويُنشئ لكل كلمة جديدة سطر `word_progress`
مبدئيًا (`dueDate = الآن`) لتظهر فورًا في طابور المراجعة. تُشغَّل صامتة مرة واحدة لكل جلسة + زر "مزامنة الآن".
