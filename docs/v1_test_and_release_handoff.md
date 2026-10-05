# ادامهٔ دقیق تست و انتشار نسخهٔ ۱

آخرین ثبت: ۶ اکتبر ۲۰۲۶، منطقهٔ زمانی تهران. «فردا» در این گزارش یعنی ۷ اکتبر.

## تصمیم فعلی

- آمادهٔ شروع تست داخلی PWA هستیم. قبولی ورود واقعی و مسیر کامل دو حساب هنوز ثبت نشده است.
- ساخت APK موفق شده و فایل آزمایشی موجود است؛ نصب و ورود روی گوشی هنوز تأیید نشده‌اند.
- برای دریافت APK به تگ جدید نیاز نداریم. `v1.0.0` پس از قبولی تست داخلی، دو موج تست انسانی و تعیین تکلیف ریسک‌های انتشار ساخته شود.
- هیچ نتیجهٔ تست انسانی، بازنشانی Secret یا ورود موفق گوگل را بدون شاهد جدید «انجام‌شده» نزنید.

## وضعیت و شواهد ثبت‌شده

| بخش | نتیجهٔ واقعی | محدودیت شاهد |
| --- | --- | --- |
| Render | revision `483f6c4dce26b87154fb8ea0dcc50cb05b512dd6` با وضعیت Live | ورود معتبر گوگل و مسیر کامل کاربران روی production هنوز آزمایش نشده |
| Pages | revision `742177338d9d9035e78c626dfff191dfa420a21d` فعال؛ تفاوتش با revision بک‌اند فقط مستندات است | ممکن است PWA باز، bundle قبلی را نگه دارد |
| API | `GET /api` مستقیم Render و از Pages هر دو 200؛ `POST /api/auth/google` با `idToken` نامعتبر 401 | پاسخ root، قبولی همهٔ endpointها نیست |
| Google | Client ID عمومی یکسان در Render و Production buildِ Pages؛ پنجرهٔ رسمی GIS با همین ID دیده شد | popup انتخاب حساب در مرورگر داخلی باز نشد؛ تست نهایی در Chrome عادی |
| Production DB | اتصال واقعی Render با Neon تطبیق داده شد؛ هدف ابتدا فاقد جدول public بود؛ بکاپ تازه و release migrations اجرا شدند؛ deploy مجدد و schema diff صفر | هدف قدیمی `.env` محلی، دیتابیس production فعلی نیست |
| Rehearsal | سه حساب موقت: لینک مشترک، جلوگیری از Spark تکراری همزمان، قلب دریافتی، انقضای روزانه، مالکیت، لغو دعوت و قطع مستقل اتصال گذشت | اجرای مستقیم serviceها روی شاخهٔ آزمایشی؛ تست HTTP/Google دو حساب نیست |
| Recovery | شاخه‌ای از snapshot پیش از تغییر ساخته شد و خالی‌بودن دیتابیس بازیابی تأیید شد | بازیابی اطلاعات واقعی کاربران یا تغییر اتصال سرویس زنده تمرین نشده |
| خودکار | بک‌اند: 102 تست در 12 فایل؛ فرانت‌اند: 151 تست در 31 فایل؛ هر دو build production موفق | شمارش تست، جایگزین تست انسانی نیست |
| APK CI | اجرای `37374644940` روی `7421773` موفق؛ artifact `mehrchain-apk-builds` موجود و منقضی نشده | سلامت build، به معنای قبولی ورود Android نیست |
| Dependency audit | `npm audit --omit=dev`: 19 مورد؛ 1 Low، 4 Moderate، 14 High، صفر Critical | exploitability و اثر بر مسیرهای عمومی هنوز بررسی نشده |

اجرای APK: https://github.com/farzad-bahadorifar/mehrchain/actions/runs/37374644940

Artifact فعلی در ۲۰ اکتبر ۲۰۲۶ حدود ۰۰:۴۹ تهران منقضی می‌شود. نتیجهٔ اجرای تازه و تاریخ انقضای آن را هنگام دریافت بررسی کنید؛ push بعدی ممکن است artifact تازه بسازد.

## آنچه در هسته اصلاح شد

1. اشتراک یک عادت بین چند نفر با یک لینک تا زمان انقضا/لغو؛ هر گیرنده باید عادت عمومی خودش را وصل کند. دعوت به خود و زوج تکراری رد می‌شود.
2. ثبت انجام عادت، اتصال‌های حامی آن عادت را به‌روزرسانی می‌کند؛ نمایش دو طرف از دیتابیس خوانده می‌شود.
3. Spark همزمان برای یک روز دوباره شمرده نمی‌شود؛ streak بعد از فاصله از 1 شروع می‌شود.
4. قلب ارسالی timestamp روزانه دارد؛ صاحب عادت قلب دریافتی هر حامی را جدا می‌بیند. روز تقویمی فعلی UTC است.
5. قطع یک زوج، بقیهٔ حامیان را قطع نمی‌کند. API لغو دعوت اضافه شده؛ دکمهٔ لغو دعوت هنوز در UI اضافه نشده است.
6. وضعیت Chain مستقل از اجراشدن cron در زمان خواب Render محاسبه می‌شود؛ reminder همان وضعیت را بررسی می‌کند و dormant یادآوری غیرقابل‌اجرا نشان نمی‌دهد.
7. صفحهٔ Chain هنگام بازبودن تقریباً هر 15 ثانیه refresh می‌کند؛ WebSocket نیست.
8. Client ID به build APK تزریق می‌شود و CORS مبداهای Capacitor اضافه شده؛ این تغییرات محدودیت ورود گوگل در WebView را حل نمی‌کنند.

## آدرس‌ها و تنظیمات برای ادامه

- PWA: https://mehrchain.pages.dev
- API مصرف‌شده توسط frontend production و APK: `https://mehrchain.pages.dev/api`؛ Pages proxy به Render می‌رسد.
- Render: https://mehrchain-api.onrender.com ؛ سرویس `mehrchain-api` / `srv-dandihrtqb8s73bi54s0`.
- Build واقعی Render: `npm install --include=dev && npx prisma generate --schema=apps/mehrchain-backend/prisma/schema.prisma && NX_DAEMON=false npx nx build mehrchain-backend`.
- Start واقعی: `node dist/mehrchain-backend/main.js`؛ آخرین runtime مشاهده‌شده Node `20.20.2` است. build محلی/CI با Node 22 انجام شده؛ نسخهٔ dashboard را 22 فرض نکنید.
- Pages build: `npx nx build mehrchain-frontend --configuration=production`؛ output: `dist/mehrchain-frontend/browser`؛ main، automatic deployments دوباره Enabled است؛ build cache Disabled است.
- Google project: `gemini-cli-project-465718`؛ Web Client: `MehrChain Web`؛ origin عمومی `https://mehrchain.pages.dev`.
- Client ID عمومی: `367374125567-qp8ooa1rrak6o49qs9sn8l9doiefrq76.apps.googleusercontent.com`.
- ورود فعلی `google.accounts.id` با هویت پایه است. طبق استثنای Google، نبود فهرست ایمیل تست‌کنندگان الزاماً مانع این مسیر نیست؛ یک حساب مستقل را واقعاً تست کنید. منبع: https://support.google.com/cloud/answer/15549945?hl=en
- Resend دامنهٔ تأییدشده ندارد؛ ارسال عمومی OTP به دوستان آماده نیست. Google sign-in با OTP ایمیل یکی نیست. OTP ایمیل/پسورد را مسیر تست فعلی اعلام نکنید.

### Neon و فایل‌های خصوصی

- Project: `spring-tree-03479681` / `mehrchain-db`، Frankfurt.
- Production: `br-purple-smoke-b1c8adr2`.
- Rehearsal: `v1-migration-rehearsal-20261006` / `br-odd-tooth-b1u2wzb0`، حذف خودکار ندارد.
- Snapshot: `v1-recovery-snapshot-20261006` / `br-sparkling-firefly-b14mjne5`، حذف خودکار ندارد؛ آن را هدف آزمایش نوشتنی نکنید.
- Drill: `v1-recovery-drill-20261006` / `br-morning-darkness-b1dtiug8`، حذف خودکار یک‌روزه؛ حدود ۷ اکتبر ۰۰:۲۳ تهران. در ادامه ابتدا وجود آن را بررسی کنید؛ در صورت انقضا دوباره از snapshot بسازید.
- History retention مشاهده‌شده 6 ساعت است؛ برای بازیابی آینده فقط به آن تکیه نکنید. snapshot قدیمی، داده‌های ثبت‌شده پس از خودش را شامل نمی‌شود.
- connection stringها در `.env.launch.local` و بکاپ‌ها در `docs/backups/`، همگی gitignored هستند. فقط نام کلید/مسیر را گزارش کنید؛ مقدار، رمز و URL خصوصی را در چت، Git یا log عمومی نریزید.
- شواهد/اسکریپت‌های موقت: `tmp/launch-evidence/`؛ برای استفادهٔ مجدد ابتدا محتوای اسکریپت و guard هدف را بررسی کنید. اتصال خصوصی، مجوز اجرای خودکار روی production نیست.
- migrations اعمال‌شده: `20261005000000_release_baseline` و `20261006000000_daily_chain_hearts`. فایل SQL اعمال‌شده را تغییر ندهید؛ برای تغییر schema، migration جدید تهیه کنید. نام واقعی baseline را با release directory تطبیق دهید.
- راهنمای عملیات: [database_migration_procedure.md](database_migration_procedure.md). پیش از تغییر بعدی، بکاپ تازه و تمرین با دادهٔ نماینده روی شاخهٔ آزمایشی لازم است؛ baseline کامل را دوباره دستی روی production اجرا نکنید.

## مراحل باقی‌مانده به ترتیب

### 1. بازنشانی Secret افشاشده — مالک

- Google Cloud → Google Auth Platform → Clients → MehrChain Web → بخش Client secrets.
- Secret جدید/بازنشانی را خود مالک تکمیل کند؛ قبلی را غیرفعال کند. نتیجه فقط «بازنشانی شد» ثبت شود، نه مقدار جدید.
- این پیاده‌سازی ورود فقط Client ID عمومی را لازم دارد؛ Secret جدید را در frontend، Pages یا این گفتگو قرار ندهید. دستیار انجام این مرحله را هنوز تأیید نکرده است.

### 2. ورود واقعی PWA — مالک + دستیار

- همهٔ تب‌ها و پنجره‌های نصب‌شدهٔ MehrChain را ببندید و در Chrome دوباره باز کنید. اگر نسخهٔ قدیمی همچنان دیده شد، دادهٔ سایت را فقط با آگاهی از خروج از حساب پاک کنید؛ قبل از حذف دادهٔ آزمایشیِ ذخیره‌نشده آن را ثبت کنید.
- «I have an account» → «Sign In with Google» → دکمهٔ رسمی گوگل. VPN/شبکه را وسط ورود عوض نکنید.
- با حساب A وارد شوید؛ خروج/ورود مجدد باید به همان کاربر برسد. سپس B در پروفایل مستقل/دستگاه دیگر وارد شود؛ ایمیلش را از قبل لازم نیست به دستیار بدهید.
- اگر خطا بود، متن خطا، مرحله، مرورگر و VPN روشن/خاموش را بفرستید؛ رمز، OTP، ID token یا JWT نفرستید.
- معیار قبولی: ورود واقعی هر دو حساب، ماندگاری هویت بعد از خروج/ورود و نبود mock/offline fallback. صرفاً دیدن دکمهٔ گوگل کافی نیست.

### 3. پذیرش داخلی کامل — قبل از دعوت دوستان

- مطابق [field_test_protocol.md](field_test_protocol.md) و [release_readiness_review.md](release_readiness_review.md) اجرا کنید.
- A یک عادت خصوصی بسازد، Spark بزند، refresh و خروج/ورود کند؛ در دستگاه دیگر همان داده دیده شود. دو ضربهٔ سریع شمارش را دو برابر نکند.
- A یک عادت عمومی و دعوت بسازد؛ B لینک را در حالت خروج باز کند، وارد شود و عادت عمومی خودش را وصل کند. هر دو اتصال را بعد از refresh ببینند.
- برای یک‌به‌چند، C همین لینک را با عادت خودش قبول کند. انجام عادت A برای B و C دیده شود؛ قلب B/C برای A دیده شود. قطع B نباید C را قطع کند.
- تست مالکیت، تعویض حساب، خطای قطع شبکه و نبود موفقیت کاذب لازم است. حذف دائمی فقط روی حسابی که مالک صریحاً disposable اعلام کرده؛ ابتدا معیار و اثر آن را بررسی کنید. توکن قدیمیِ حساب حذف‌شده باید رد شود و عادت طرف دیگر باقی بماند.
- برای روز بعد/UTC midnight، تاریخ، timezone و رفتار streak/قلب ثبت شود؛ ساعت production را برای تست دستکاری نکنید.
- اسکریپت `scripts/release-smoke.cjs` ورود ایمیل/پسورد می‌خواهد؛ برای Google-only از تست دستی استفاده کنید، نه رمز ساختگی.
- معیار قبولی: همهٔ مراحل حیاتی Pass، نتیجهٔ private با alias و revisionها ثبت شده، هیچ P0 باز نمانده. موارد Not attempted را Pass حساب نکنید.

### 4. APK آزمایشی — موازی با تست PWA

- GitHub → Actions → اجرای موفق لینک بالا → Artifacts → `mehrchain-apk-builds`؛ ZIP را دریافت کنید. دریافت artifact ممکن است ورود GitHub بخواهد.
- برای نصب آزمایشی `mehrchain-debug.apk` یا فایل debug پیش‌فرض `mehrchain.apk` را انتخاب کنید. `mehrchain-release-unsigned.apk` قابل توزیع نصب‌شدنیِ release نیست. وجود release امضاشده را بدون بررسی artifact/مرحلهٔ signing فرض نکنید.
- روی گوشی واقعی: نصب، بازشدن، دسترسی API، ورود گوگل، خروج/ورود، عادت، Spark، دعوت و قلب را امتحان کنید؛ نسخهٔ PWA و APK هر دو به دادهٔ همان حساب برسند.
- اگر Google در WebView/مبدا `https://localhost` رد شد، راه‌حل جداگانهٔ native sign-in یا مرورگر سیستمی با بازگشت معتبر لازم است؛ فقط افزودن Client ID/CORS کافی نیست. طراحی و پیاده‌سازی آن کار باقی‌مانده است. منبع سیاست: https://developers.google.com/identity/protocols/oauth2/policies
- در صورت مسدودبودن auth APK، موج انسانی با PWA ادامه یابد و APK «آمادهٔ کاربران» اعلام نشود؛ ورود جعلی/OTP افشاشده به‌عنوان workaround اضافه نکنید.
- ساخت تازه بدون tag: push main یا Actions → Run workflow با `publish_release=false`؛ artifact تازه همان run را دریافت کنید.
- **نکتهٔ workflow:** شرط فعلی `prerelease` همهٔ `v1.*` را رسمی محسوب می‌کند، حتی `v1.0.0-rc.*`. پیش از انتشار RC این شرط اصلاح و بررسی شود. فعلاً برای build داخلی tag نزنید و `publish_release=false` بماند.
- `android/app/build.gradle` اکنون `versionCode=1` و `versionName="1.0"` دارد؛ تگ Git خودکار این‌ها را تغییر نمی‌دهد. پیش از توزیع release، نسخه و سیاست افزایش versionCode/امضای ثابت را تعیین کنید. کلید امضا را عمومی نکنید.

### 5. ارزیابی امنیت و بازیابی

- dependency audit جدید را ثبت کنید؛ advisoryهای runtime و بسته‌های واقعاً واردشده در bundle/server را جدا بررسی کنید. برای هر High، مسیر اثر، اصلاح یا دلیل عدم اثر و شاهد بنویسید؛ شمارش به‌تنهایی severity محصول را تعیین نمی‌کند.
- `npm audit fix --force` یا ارتقای major بی‌بررسی انجام ندهید. اصلاحات مرتبط را تست و به ترتیب backend سپس frontend deploy کنید.
- اگر اثر یکی از موارد بر auth، نشت اطلاعات، دسترسی حساب‌ها یا از دست‌رفتن داده اثبات شد، P0 و مانع گسترش تست است؛ پیش از انتشار عمومی disposition روشن همهٔ موارد لازم است.
- تمرین recovery با دادهٔ نماینده روی rehearsal: بکاپ، دادهٔ آزمایشی، تغییر کنترل‌شده، restore در شاخهٔ مستقل و مقایسهٔ شمارش/روابط. بازنشانی production یا اتصال کورکورانه به snapshot خالی ممنوع است.

### 6. تست فردا و سپس نسخهٔ نهایی

- هدف ۷ اکتبر: اول پایان مراحل 1–3؛ سپس 2–3 نفر حدود 20 دقیقه، حداقل یک موبایل و یک کاربر solo. بعد از رفع blockers، بقیه تا مجموع 5–10 نفر.
- VPN روشن/خاموش، ISP به‌صورت اختیاری، مرحلهٔ شکست و cold start را ثبت کنید؛ IP و اطلاعات شخصی لازم نیست. Render رایگان ممکن است اولین پاسخ را 50 ثانیه یا بیشتر عقب بیندازد؛ این را از خطای ذخیره جدا کنید.
- دستیار به دوستان پیام نمی‌فرستد مگر مالک صریحاً مخاطب و پیام را مشخص کند. نتایج واقعی را با alias در فایل خصوصی نگه دارید.
- بعد از قبولی: revision قبول‌شده را pin، pending changes را بررسی، build/APK/امضا/versionCode و release notes را تأیید کنید؛ سپس تگ `v1.0.0` و Release. workflow با push تگ `v*` خودکار Release عمومی می‌سازد، پس tag صرفاً نام‌گذاری داخلی نیست.
- اگر هسته در PWA قبول شد ولی APK auth قبول نشد، محدودهٔ انتشار را صریحاً PWA-only ثبت کنید؛ Android را جداگانه منتشر کنید.

## پیام پیشنهادی برای ادامهٔ همین کار

«ابتدا docs/v1_test_and_release_handoff.md و checkpoint جدید docs/development_roadmap.md را بخوان. وضعیت live SHAها، اجرای APK و نتیجهٔ مالک دربارهٔ reset و ورود گوگل را بررسی کن. اسرار را نمایش نده و production را از .env قدیمی حدس نزن. از مرحلهٔ انجام‌نشده ادامه بده: ابتدا ورود دو حساب و پذیرش داخلی، سپس APK روی گوشی، ارزیابی ریسک و موج انسانی. نتیجهٔ آزمون service/rehearsal را قبولی Google/production حساب نکن. قبل از تغییر جدید، هدف DB و بکاپ را تأیید کن. بدون قبولی gateها، تگ نهایی و Release عمومی نساز.»
