# برنامه اجرای لانچ نسخه ۱

تاریخ بررسی: ۵ اکتبر ۲۰۲۶. موعد درخواستی مالک: ۶ اکتبر، به وقت تهران.

این سند برنامه اجرا و یافته‌های بررسی است؛ هیچ مایگریشن اصلی، تنظیم حساب، دیپلوی، تگ یا اعلام عمومی در این بررسی انجام نشده است. رودمپ فعلی موعد ۸ اکتبر را مشروط به قبولی R0–R8 می‌داند.

## تصمیم‌های مشخص‌شده

- PWA: https://mehrchain.pages.dev
- APK: ساخت توسط GitHub Actions؛ نسخه نصب‌شده باید از همان بک‌اند Render و دیتابیس واقعی استفاده کند.
- مسیر ورود اولیه موردنظر ایمیل/پسورد با تأیید OTP از Resend بود. با روشن شدن عدم امکان خرید دامنه، این مسیر برای ۵–۱۰ صندوق مستقل مسدود است: Resend بدون دامنه تأییدشده فقط ارسال آزمایشی به ایمیل مالک حساب را مجاز می‌کند. پیشنهاد اجرایی تست اولیه: Google Sign-In واقعی روی PWA؛ Resend فقط برای تست ارسال به مالک نگه داشته شود. این تغییر مسیر هنوز پیکربندی نشده است.
- رفتار ضروری حمایت: یک عادت می‌تواند N حامی داشته باشد؛ Spark امروز صاحب عادت برای همه حامیان نمایش داده شود؛ هر حامی قلب ساده بفرستد و صاحب عادت حمایت دریافتی را ببیند. رفتار فعلی Heart فقط وضعیت حمایت ارسال‌شده است و این معیار را کامل نمی‌کند.
- مالک دامنه و هاست جدا ندارد؛ حساب‌های Resend، Render، Cloudflare و Neon را با GitHub ساخته/وارد شده است. هاست جدا برای پشته فعلی لازم نیست؛ دامنه تحت مالکیت برای ارسال عمومی Resend هنوز لازم است.
- مالک تأیید کرد Chain الزاماً اتصال دو عادت است؛ هر حامی باید عادت خودش را به عادت طرف مقابل وصل کند. یک عادت می‌تواند چند اتصال با عادت‌های دیگر داشته باشد.
- پیشنهاد برای دعوت، با توجه به ترجیح مالک: یک لینک مشترک برای هر عادت، قابل پذیرش توسط چند کاربر تا انقضا یا لغو. هر پذیرش یک جفت اتصال دوطرفه مستقل بسازد؛ پذیرش توسط صاحب دعوت و ایجاد اتصال تکراری همان جفت عادت رد شوند. کد فعلی هر دعوت را پس از یک پذیرش مصرف می‌کند؛ این پیشنهاد هنوز پیاده نشده است.
- مرورگر انتخاب‌شده مالک برای داشبوردها Chrome است. بررسی ابزار مرورگر فقط IAB و MCP Apps را برگرداند؛ Chrome متصل نبود. تصاویر ارسالی شواهد لحظه ثبت تصویر هستند؛ دسترسی زنده به داشبوردها فراهم نشده و تنظیمی تغییر نکرده است.

## نتیجه بررسی فعلی

### تنظیم واقعی Google و بررسی Render در مرورگر

- Google OAuth Web Client ساخته‌شده توسط مالک: `367374125567-qp8ooa1rrak6o49qs9sn8l9doiefrq76.apps.googleusercontent.com`، نام MehrChain Web.
- originهای ذخیره‌شده در صفحه کلاینت: `https://mehrchain.pages.dev`، `http://localhost` و `http://localhost:4300` تأیید شدند.
- GOOGLE_CLIENT_ID به متغیرهای Render اضافه و با Save only ذخیره شد. فرم به حالت نمایش برگشت و کلید در فهرست پایدار دیده شد؛ هیچ deploy جدیدی اجرا نشد. مقدار سایر متغیرهای Runtime خوانده/نمایش داده نشد.
- Render سرویس `srv-dandihrtqb8s73bi54s0`، شاخه main، پلن Free، Frankfurt و Blueprint managed دارد.
- آخرین deploy موفق/Live: `80994ce8035242c240427283dd646ddc461c3689`، ۱۹ سپتامبر ۲۰۲۶ ساعت ۲۲:۴۴:۵۲ تهران؛ مدت build/deploy نمایش‌داده‌شده ۲ دقیقه و ۴۰ ثانیه. لاگ تاریخی خارج retention بود.
- Build Command فعلی داشبورد: `npm install --include=dev && npx prisma generate --schema=apps/mehrchain-backend/prisma/schema.prisma && NX_DAEMON=false npx nx build mehrchain-backend`.
- Start Command فعلی داشبورد: `node dist/mehrchain-backend/main.js`.
- Start صحیح با خروجی webpack تطبیق داده شد: `node dist/mehrchain-backend/main.js`؛ مسیر قدیمی اشتباه render.yaml اصلاح شد. Build پیشنهادی مخزن با `npm ci --legacy-peer-deps` است؛ Build فعلی داشبورد install است.
- Audience حالت Testing دارد، اما ورود ساده Google از الزام فهرست کاربران مستثناست؛ نتیجه بررسی رسمی در بخش ۶ اکتبر آمده است.

- revision محلی بررسی‌شده: `16d37b8`؛ وضعیت Git پیش از این سند تمیز بود.
- اجرای مجدد تست‌های فرانت‌اند و بک‌اند موفق بود؛ فرانت‌اند ۱۴۸ تست در ۳۱ فایل دارد.
- build production هر دو پروژه موفق بود؛ هشدارهای Angular metadata و qrcode مانع build نشدند.
- build محلی بدون GOOGLE_CLIENT_ID انجام شد؛ این درباره متغیرهای ذخیره‌شده در Pages/Render نتیجه‌ای نمی‌دهد.
- probeهای GET /api و POST /api/auth/google با توکن عمداً نامعتبر، از این محیط برای Pages و Render خطای اتصال دادند. هیچ status واقعی دریافت نشد؛ وضعیت عمومی تأیید نشده است.
- آمار دیتابیس در راهنمای مایگریشن مربوط به بررسی قبلی است. این جلسه اتصال یا داده‌های دیتابیس اصلی را دوباره تأیید نکرده است.
- گراف نسل `2026-10-05T19:42:56Z` بررسی شد. traceها بخشی از فراخوانی‌های سرویس را نشان ندادند و coverage تغییر metadata را گزارش کرد؛ نتیجه‌های مهم با خواندن مستقیم منبع تطبیق داده شدند. این بررسی گواهی جامع امنیت یا همه قابلیت‌ها نیست.

## موارد هسته که باید پیش از انتشار بررسی/اصلاح شوند

| مورد | شواهد کد | معیار قبولی |
| --- | --- | --- |
| دریافت حمایت | `chain.service.ts` بک‌اند، sendHeart فقط heartSent اتصال متعلق به فرستنده را تغییر می‌دهد؛ getConnections اتصال‌های همان کاربر را برمی‌گرداند؛ کارت فقط heartSent را نمایش می‌دهد | صاحب عادت Spark کند؛ حداقل دو حامی در خواندن تازه انجام امروز را ببینند؛ هر دو قلب بفرستند؛ صاحب عادت حمایت‌های دریافتی را ببیند؛ حمایت‌های ارسالی با دریافتی اشتباه نشوند |
| جهت فعالیت شریک | `chain-notification.service.ts` با userCommitmentId فیلتر می‌کند؛ در اتصال گیرنده، عادت تکمیل‌شده partnerCommitmentId است | Spark توسط A، فعالیت/خوانده‌نشده B را برای همان عادت تغییر دهد؛ فعالیت دیگران تغییر نکند |
| دقت streak | completeCommitment در `commitments.service.ts` در هر روز جدید currentStreak را افزایش می‌دهد، بدون بررسی فاصله روزها | پس از یک روز فاصله، streak مطابق تعریف محصول محاسبه شود؛ currentDay و مجموع دفعات مستقل بمانند |
| بازگشت از Resting/Fading | کارت پیش از lastCompletedDate، وضعیت RESTING/FADING را بررسی می‌کند؛ notification فعلی آن وضعیت را به ACTIVE برنمی‌گرداند | شریک بعد از Spark امروز، Completed today دیده شود؛ منتظر نیمه‌شب نماند |
| زمان و اجرای روزانه | Spark روز UTC دارد؛ cron از زمان محلی process استفاده می‌کند و درون web service اجرا می‌شود | مبنای روز صریح و یکسان باشد؛ تست عبور از نیمه‌شب و جبران اجرای ازدست‌رفته انجام شود |
| اتصال APK | androidScheme=https و hostname پیش‌فرض localhost؛ allowlist بک‌اند شامل https://localhost نیست؛ Pages Function هدر Origin را به Render منتقل می‌کند | درخواست واقعی WebView، ثبت‌نام/ورود و خواندن/نوشتن را بدون خطای CORS کامل کند |

Render در پیکربندی مخزن free است. خاموش شدن سرویس پس از بی‌فعالیتی، اجرای cron درون process را غیرقابل اتکا می‌کند. این استنتاج نیازمند بررسی پلن واقعی Render است. صرف روشن نگه‌داشتن سرویس هم جای منطق جبران روزهای ازدست‌رفته را نمی‌گیرد.

مرز روز فعلی UTC است؛ برای کاربر تهران نیمه‌شب UTC ساعت ۰۳:۳۰ است. تغییر به روز محلی کاربر یک تصمیم محصول و نیازمند طراحی سازگار است.

## دسترسی‌ها را چگونه فراهم کنیم

### داشبوردها

۱. خودت در Chrome یا Edge به Resend، سرویس DNS، Render، Cloudflare، Neon و GitHub وارد شو.
۲. فقط نام مرورگر و لینک صفحه پروژه/سرویس را بده. رمز ورود، کد دومرحله‌ای، OTP، کلید یا connection string را در چت نفرست.
۳. ابزار مرورگر در این جلسه موجود است؛ دسترسی واقعی به تب و session باید در شروع کار بررسی شود. ورود به حساب و مراحل احراز هویت را خودت انجام بده.
۴. اگر session قابل دسترس نبود، همان مرحله را از داشبورد خودت انجام بده و فقط وضعیت غیرمحرمانه یا خطای پاک‌سازی‌شده را گزارش کن.

### اتصال خصوصی برای تمرین دیتابیس

۱. در Neon شاخه تمرین جدا از production بساز.
۲. Connection details را برای همان شاخه باز کن و اتصال direct را بردار، نه pooled.
۳. برای دسترسی محلی، فایل `D:/projects/mehrchain/.env.launch.local` را در ویرایشگر خودت ایجاد کن. این نام با قانون `.env.*.local` در Git نادیده گرفته می‌شود؛ قبل از استفاده دوباره بررسی می‌کنیم.
۴. فقط برای شاخه‌های آزمایشی، URL را در متغیرهای زیر ذخیره کن؛ مقدارها را در چت یا خروجی ترمینال نمایش نده:

```dotenv
NEON_EMPTY_DATABASE_URL=
NEON_REHEARSAL_DATABASE_URL=
NEON_RECOVERY_DATABASE_URL=
```

۵. در چت فقط بگو «فایل آماده است» و نام/شناسه غیرمحرمانه شاخه‌ها را بده. ابزار اجرا باید فایل را خصوصی بارگذاری و متغیر شاخه انتخاب‌شده را برای همان فرمان به DATABASE_URL نگاشت کند؛ اسکریپت موجود این نام‌های جدید را خودکار نمی‌خواند.
۶. برای production ابتدا هدف Render و نقطه بازیابی را مشخص می‌کنیم؛ هیچ URL اصلی را با شاخه تمرین جایگزین نمی‌کنیم.

RESEND_API_KEY و JWT_SECRET در Render بمانند. مقدارهای امضای APK در GitHub Secrets بمانند. برای اجرای smoke رمزهای دو حساب کاملاً آزمایشی می‌توانند خصوصی در همین فایل محلی با نام‌های SMOKE_* ذخیره شوند؛ گزارش نتیجه هیچ credential یا token ندارد.

## ترتیب اجرای ضروری

### ۱. فعال کردن Resend

- مالک نام دامنه تحت کنترل و سرویس DNS را مشخص کند. `mehrchain.pages.dev` دامنه ارسال ایمیل تحت کنترل DNS مالک نیست.
- در Resend بخش Domains دامنه/زیردامنه ارسال را اضافه کنیم؛ دقیقاً رکوردهای تولیدشده همان داشبورد را در DNS وارد کنیم و وضعیت Verified بگیریم. رکوردها را حدس نمی‌زنیم.
- مالک کلید ارسال بسازد و مستقیم در Render Environment با نام RESEND_API_KEY ذخیره کند.
- MAIL_FROM آدرسی از دامنه تأییدشده باشد؛ NODE_ENV=production و JWT_SECRET موجود باشند. مقدارها در فرانت‌اند قرار نگیرند.
- بعد از دیپلوی دو صندوق مستقل ایمیل، دریافت واقعی، resend، کد اشتباه/منقضی و login پس از verify آزمایش شوند.
- ارسال با دامنه پیش‌فرض resend.dev را قبولی ارسال عمومی حساب نکنیم؛ کد هنوز fallback فرستنده دارد، برخلاف ادعای حذف آن در بخشی از رودمپ.

### ۲. تمرین دیتابیس و بازیابی

- یک دیتابیس واقعاً خالی برای اجرای baseline لازم است. شاخه معمولی کپی schema/data است و schema-only هم جدول دارد؛ هیچ‌کدام خودبه‌خود دیتابیس خالی مناسب CREATE baseline نیست. می‌توان یک database جدید و خالی فقط در شاخه disposable ساخت و خالی بودن آن را تأیید کرد.
- یک کپی از شاخه فعلی برای تمرین upgrade بسازیم و کپی جدا برای recovery نگه داریم.
- روی دیتابیس خالی: release-migrate deploy دو بار، سپس zero drift و بررسی روابط.
- روی کپی موجود: بکاپ، شمارش، بررسی orphan، patch افزایشی در صورت نیاز، zero drift، resolve-baseline و deploy دوباره.
- بازگشت به کپی پیش از تغییر را تمرین کنیم و شمارش/مالکیت داده را بررسی کنیم.
- دستورهای دقیق مرجع: `docs/database_migration_procedure.md`.

### ۳. ارتقای production

- هدف DATABASE_URL واقعی Render را خصوصی با Neon تطبیق دهیم؛ آمار قبلی کافی نیست.
- پیش از تغییر recovery branch/snapshot و export خصوصی بگیریم و زمان/شناسه آن را ثبت کنیم.
- در پنجره بدون نوشتن، فقط patch موردنیاز را طبق راهنما اجرا کنیم؛ سپس شمارش، zero drift و baseline واقعی Prisma.
- از legacy migration chain، migrate reset و db push با data loss استفاده نکنیم. baseline کامل روی دیتابیس پر اجرا نشود.
- در شکست اعتبارسنجی، ادامه انتشار متوقف و مسیر بازیابی آزمایش‌شده استفاده شود.

### ۴. دیپلوی

- اول اصلاح‌های لازم هسته و build/test؛ سپس schema آماده؛ بعد Render، سپس Pages.
- Render build/start مطابق render.yaml، Node 22؛ SHA واقعی دیپلوی و سلامت startup ثبت شوند.
- GET /api پاسخ واقعی بدهد؛ POST /api/auth/google با ورودی نامعتبر، خطای auth/validation بدهد نه missing route. تست مسیر ایمیل هم جدا ضروری است.
- Pages build: `npx nx build mehrchain-frontend --configuration=production --skip-nx-cache`.
- publish directory: `dist/mehrchain-frontend/browser`؛ Functions ریشه پروژه و proxy حفظ شوند.
- APK فعلی هم API را از `https://mehrchain.pages.dev/api` می‌خواند و Pages به Render proxy می‌کند؛ اتصال مستقیم Android به Render تنظیم فعلی نیست.

### ۵. دو حساب و APK آزمایشی

- دو حساب disposable با OTP واقعی بسازیم؛ یکی در PWA و یکی در APK یا مرورگر مستقل.
- بدون تگ عمومی: workflow_dispatch با publish_release=false خروجی آزمایشی بگیریم. workflow فعلی با push به main و PR هم build می‌گیرد؛ محدود به tag نیست.
- چهار Secret امضا را طبق `docs/android_signing_guide.md` بررسی کنیم: ANDROID_KEYSTORE_BASE64، KEYSTORE_PASSWORD، KEY_ALIAS، KEY_PASSWORD. keystore قبلی حفظ شود تا آپدیت نصب‌شده قابل نصب بماند.
- `scripts/release-smoke.cjs` برای ایمیل/پسورد اجرا شود؛ حذف B فقط وقتی صریحاً disposable است فعال شود.
- افزون بر smoke: تست یک صاحب عادت و دو حامی برای اثبات 1 به N؛ ورودی لینک قبل از ورود، Copy/Share/QR، رفت‌وبرگشت به ایمیل OTP از APK، refresh/راه‌اندازی مجدد و قطع شبکه بررسی شوند.
- دعوت APK را حداقل با مرورگر مقصد هم تست کنیم؛ باز شدن خودکار آن در app نیازمند تأیید deep link است و در این بررسی اثبات نشده است.
- پذیرش دریافت حمایت، فاصله چندروزه، مرز روز و جهت activity به آزمون‌های فعلی اضافه شوند؛ سبز بودن تست موجود این موارد را اثبات نکرد.

### ۶. تست انسانی و تصمیم انتشار

- فقط بعد از قبولی دو حساب، ۲–۳ نفر موج اول؛ سپس بقیه تا ۵–۱۰ نفر طبق `docs/field_test_protocol.md`.
- حداقل یک نفر solo، یک جفت chain و یک نصب واقعی Android؛ نتایج با alias و بدون OTP/token/password ثبت شود.
- قطع شبکه باید خطای قابل فهم بدهد؛ success یا celebration کاذب نداشته باشیم.
- حذف حساب disposable، token قدیمی و باقی ماندن عادت‌های شریک با API و SQL بررسی شوند.
- اگر موارد حیاتی باز ماند، خروجی فردا release candidate/تست خصوصی باشد. تگ رسمی v1.0.0 و اعلان عمومی پس از قبولی؛ workflow با tag v* Release عمومی می‌سازد.

## خارج از مسیر ضروری فردا

Three.js و تصویر badge، مقالات، طراحی جدید، چندزبانه‌سازی، WebSocket، خیریه و انتشار Play Store در مسیر فوری ورود/عادت/حمایت قرار ندارند. با محدودیت دامنه، پیشنهاد تست اولیه ورود واقعی گوگل است؛ مسیر OTP عمومی تا فراهم شدن فرستنده تأییدشده آماده محسوب نشود.

## محدودیت‌های جدید مالک: بدون خرید دامنه، تست اولیه از ایران

- ایمیل/OTP برای عموم با همین Resend و بدون دامنه تأییدشده عملی نیست؛ VPN یا API proxy محدودیت فرستنده Resend را رفع نمی‌کند. ارسال به صندوق مالک فقط آزمون محدود delivery است، نه قبولی ورود ۵–۱۰ نفر.
- Google Sign-In با OTP ارسالی MehrChain متفاوت است. برنامه public Web Client ID لازم دارد؛ کد دومرحله‌ای احتمالی حساب Google توسط خود کاربر در صفحه Google وارد می‌شود و به مدل داده نمی‌شود.
- برای PWA یک OAuth Web application با origin دقیق `https://mehrchain.pages.dev` ساخته شود؛ برای توسعه `http://localhost` و `http://localhost:4300`. branding/audience و test users متناسب با وضعیت کنسول تنظیم شوند؛ scopes پایه email/profile/openid کافی‌اند. redirect route خیالی اضافه نشود.
- public GOOGLE_CLIENT_ID یکسان در Render runtime و Pages production build ذخیره شود؛ backend و frontend دوباره deploy شوند. ID عمومی قابل ارسال در چت است؛ client secret، token و OTP لازم نیستند.
- APK دارای WebView است؛ موفقیت Google روی PWA اثبات ورود Google داخل APK نیست. OAuth در embedded user-agent محدود است؛ مسیر معتبر native/system browser و بازگشت امن به برنامه باید طراحی/تست شود. ثبت origin جدید به‌تنهایی این مسئله را رفع نمی‌کند. اگر تا موعد انجام نشد، نتیجه تست اولیه را صریحاً PWA-only ثبت کنیم و APK را تأییدشده اعلام نکنیم.
- مسیر API برنامه همچنان Pages /api به Render است. SDK و صفحه ورود Google از دستگاه شرکت‌کننده به Google متصل می‌شوند؛ proxy API این بخش را پوشش نمی‌دهد.
- تست‌کنندگان داخل ایران وضعیت دسترسی را با و بدون VPN موجود خودشان ثبت کنند؛ وضعیت شبکه، auth و save جدا گزارش شوند. استفاده از proxy تضمین رفع محدودیت حساب/سرویس نیست. هیچ نصب یا تغییر proxy سیستمی در این بررسی انجام نشده است.
- یک آزمون از شبکه خارج ایران برای مخاطب اصلی انجام شود؛ دسترسی تست‌کننده داخل ایران به‌تنهایی درباره دسترسی کاربران خارج نتیجه نمی‌دهد.
- طبق تصاویر مالک: Render سرویس mehrchain-api را Deployed با Updated=16d نشان می‌دهد؛ Pages به commit آماده‌سازی اشاره دارد؛ Neon دو پروژه و برای mehrchain-db یک branch نمایش می‌دهد؛ Resend صفحه No sent emails yet دارد. revision واقعی، جدول‌ها و متغیرها باید در صفحه جزئیات بررسی شوند؛ تصاویر کافی نیستند.
- اطلاعات غیرمحرمانه لازم بعدی: Web Client ID و وضعیت origin/audience؛ Render commit/build/start و نام متغیرهای تنظیم‌شده بدون مقدار؛ Pages build/publish/revision؛ Neon project/branch/database identifiers بدون URL/رمز. سایر پروژه‌های Neon دست‌نخورده بمانند.
- به دلیل Google-only بودن، release-smoke فعلی با پسورد ناشناخته حساب‌های Google قابل اجرا نیست؛ چک‌لیست واقعی مرورگر/API انجام شود و نتیجه اسکریپت جعل نشود.
- بررسی زنده در مرورگر داخلی Codex: `https://mehrchain.pages.dev/api` صفحه HTML با عنوان Render - Application loading برگرداند؛ خواندن تازه بعدی هم همین صفحه بود. دسترسی به مسیر برقرار شد، ولی پاسخ موردانتظار API مشاهده نشد. log نمایشی interstitial را با startup log واقعی یا سلامت بک‌اند یکی ندانیم؛ دریافت HTML از API در cold start باید در تست و مدیریت خطای فرانت‌اند لحاظ شود.

منابع این محدودیت‌ها: https://resend.com/docs/api-reference/errors و https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid و https://developers.google.com/identity/protocols/oauth2/policies

## منابع سرویس‌ها

### اجرای اصلاحات هسته و دیتابیس در ۶ اکتبر

- جهت activity به partnerCommitmentId اصلاح شد؛ Spark وضعیت resting/fading را فعال می‌کند و streak پس از فاصله روزها از ۱ آغاز می‌شود.
- لینک دعوت تا انقضا/لغو مصرف نمی‌شود؛ اتصال دو عادت الزامی است؛ duplicate رد می‌شود. لغو دعوت اتصال‌های قبلی را قطع نمی‌کند.
- heartSentAt به‌صورت migration جدید به زنجیره release اضافه شد؛ baseline اعمال‌شده ویرایش نشد. heartReceived از اتصال معکوس محاسبه و روی کارت جدا نمایش داده می‌شود؛ حمایت دیروز به امروز منتقل نمی‌شود.
- محاسبه UTC missed days مستقل از cron اجرا می‌شود و اجرای تکراری، missed days را دوباره افزایش نمی‌دهد. feed باز هر ۱۵ ثانیه تازه می‌شود.
- تست‌های فعلی بک‌اند (۱۰۱) و فرانت‌اند (۱۵۰) و build production هر دو موفق شدند. بررسی واقعی سرویس‌ها روی Neon با سه حساب موقت، لینک مشترک، دو حامی، Spark هم‌زمان بدون تکرار log، مالکیت و قطع مستقل اتصال موفق شد؛ حساب‌های آزمون پاک شدند. این آزمون ورود Google یا مسیر مرورگر/API HTTP نبود.
- snapshot پیش از تغییرات در شاخه `v1-recovery-snapshot-20261006` باقی است. child آزمایشی `v1-recovery-drill-20261006` / `br-morning-darkness-b1dtiug8` از آن ساخته و اتصالش با وضعیت خالی اولیه تأیید شد؛ حذف خودکار child پس از یک روز است. بازیابی دیتابیس دارای داده یا تعویض بک‌اند زنده آزموده نشد.
- Render production پس از بکاپ تازه، baseline و migration قلب را دریافت کرد؛ deploy دوم و diff با exit code صفر تأیید شدند. این هدف پیش از شروع هیچ جدول برنامه نداشت؛ داده کاربری حذف نشد.
- CORS برای originهای واقعی Capacitor تکمیل شد و GitHub Actions کلاینت عمومی Google را به build می‌دهد. این‌ها محدودیت OAuth در WebView را رفع نمی‌کنند؛ ورود APK هنوز تأیید نشده است.
- دیپلوی خودکار Pages موقتاً برای رعایت ترتیب backend سپس frontend غیرفعال شده است؛ بعد از سلامت Render باید فعال و دیپلوی فرانت اجرا شود.

### بررسی زنده Google و Render در ۵ اکتبر

- Web Client ID مالک در Render به نام `GOOGLE_CLIENT_ID` با **Save only** ذخیره شد؛ هیچ دیپلوی جدید اجرا نشد. مقدار متغیرهای محرمانه خوانده نشد.
- originهای Google: `https://mehrchain.pages.dev`، `http://localhost` و `http://localhost:4300`؛ redirect URI ثبت نشده است.
- Audience روی External / Testing است؛ فهرست Test users خالی است. راهنمای رسمی Google برای Sign in with Google و درخواست صرفاً openid/email/profile استثنا دارد: فهرست ایمیل از پیش لازم نیست. کد فعلی از `google.accounts.id` استفاده می‌کند و scope اضافی درخواست نمی‌کند. ادعای قبلی الزام افزودن همه تست‌کنندگان اصلاح شد؛ بعد از دیپلوی، یک حساب خارج از فهرست باید واقعاً آزمایش شود.
- آخرین دیپلوی موفق Render: `80994ce8035242c240427283dd646ddc461c3689`، وضعیت Live/Succeeded، ۱۹ سپتامبر ۲۰۲۶ ساعت ۲۲:۴۴:۵۲ تهران. SHA قدیمی با HEAD آماده‌سازی محلی متفاوت است.
- Build فعلی داشبورد: `npm install --include=dev && npx prisma generate --schema=apps/mehrchain-backend/prisma/schema.prisma && NX_DAEMON=false npx nx build mehrchain-backend`.
- Start فعلی داشبورد صحیح است: `node dist/mehrchain-backend/main.js`. تنظیم output در webpack و فایل build موجود همین مسیر را تأیید کردند. مسیر اشتباه `dist/apps/...` در `render.yaml` محلی اصلاح شد؛ هنوز push نشده است.
- مانع ورود Pages در ۶ اکتبر با ورود مالک رفع شد؛ GOOGLE_CLIENT_ID عمومی یکسان در محیط Production ذخیره و پس از reload از ردیف input تأیید شد. تنظیم روی دیپلوی بعدی اعمال می‌شود؛ هنوز redeploy اجرا نشده است. Build فعلی `npx nx build mehrchain-frontend --configuration=production` و output صحیح `dist/mehrchain-frontend/browser` است؛ main دارای automatic deployments است و نسخه فعلی Pages روی `16d37b854b86e99e856072cbfd57758e77e8c84b` است.
- پیش از Deploy هنوز تمرین مایگریشن/بازیابی Neon و اصلاح موارد حیاتی هسته لازم است؛ تنظیم Client ID به‌تنهایی پذیرش نسخه یک نیست.

### بررسی و آماده‌سازی Neon و Resend در ۶ اکتبر

- پروژه مرتبط Neon: `spring-tree-03479681` با نام mehrchain-db؛ production: `br-purple-smoke-b1c8adr2`؛ history retention فعلی ۶ ساعت است.
- از production دو شاخه داده و schema با Auto-delete=Never ساخته شد: `v1-migration-rehearsal-20261006` / `br-odd-tooth-b1u2wzb0` و `v1-recovery-snapshot-20261006` / `br-sparkling-firefly-b14mjne5`. شاخه recovery دست‌نخورده است. ساخت این شاخه اثبات اجرای بازیابی نیست؛ پس از پایان کار، مصرف و پاک‌سازی شاخه‌های آزمایشی بررسی شود.
- اتصال شاخه تمرین به‌صورت خصوصی در `.env.launch.local` ذخیره شد. پیش از اجرا هیچ جدول public نداشت؛ baseline روی همین شاخه آزمایشی deploy شد، deploy دوم هیچ migration معلق نداشت و schema diff با exit code صفر تأیید شد. داده کاربری در این آزمون وجود نداشت؛ آزمون نگهداری داده و recovery هنوز انجام نشده است.
- اتصال واقعی Render با production همین پروژه Neon به‌صورت خصوصی تطبیق داده شد (endpoint یکسان با حذف تفاوت pooler)، اما با `.env` محلی قدیمی متفاوت است. بررسی read-only اتصال واقعی Render هیچ جدول public پیدا نکرد. بنابراین راهنمای patch دیتابیس موجود با ۴ کاربر مربوط به این هدف نیست؛ برای این هدف خالی، مسیر full release baseline لازم است.
- قبل از هر تغییر production، `safe-migrate.js` روی هدف تأییدشده Render اجرا شد و export خصوصی `docs/backups/neon-backup-1791232844361.json` ساخته شد؛ تمام شمارش‌ها صفر هستند. JSON جایگزین snapshot قابل بازیابی نیست. هیچ schema یا history تولیدی تغییر نکرد.
- فایل اتصال خصوصی و artifacts در مسیرهای gitignored هستند؛ secret گوگل ارسالی مالک در هیچ فایل پروژه ذخیره یا استفاده نشد.
- Resend → Domains واقعاً No domains yet و Emails → No sent emails yet است؛ کلید تازه‌ای ساخته نشد و OTP عمومی تأیید نشده است.
- GitHub Actions هنوز GOOGLE_CLIENT_ID را به build APK تزریق نمی‌کند؛ در کنار محدودیت WebView، این هم پیش‌نیاز جداگانه APK است.
- منبع استثنای Test users: https://support.google.com/cloud/answer/15549945?hl=en

- Resend domain verification: https://resend.com/docs/dashboard/domains/introduction
- Pages build settings: https://developers.cloudflare.com/pages/configuration/build-configuration/
- Render free service lifecycle: https://render.com/docs/free
- Capacitor server configuration: https://capacitorjs.com/docs/config
- Neon branching concepts: https://neon.com/blog/instant-branches-schema-only-or-with-data-the-choice-is-yours

### Executed deployment, 6 October 2026

- Core changes pushed as a511100649569899fac7f9f1d7842f9da5b10fac. Render deployed this revision successfully; GET /api returned 200.
- Confirmed production was initially empty. Fresh backup, both release migrations, repeat deploy and schema diff all passed. Recovery drill reproduced the empty pre-change snapshot; populated data recovery is not proven.
- Rehearsal service integration passed with three disposable accounts: shared invite, concurrent Spark deduplication, received hearts, daily expiry, ownership, invite cancellation and isolated disconnect. This is not a two-account Google browser test.
- Reminder follow-up uses the same calendar state as the read API; dormant cards hide unavailable reminders.
- APK workflow now receives the public Google Client ID. Google authentication in the APK remains unverified.
- Pages automatic deployments were temporarily paused for backend-first order. Restore after the final backend revision is live, then trigger a fresh frontend build.
- Remaining acceptance: two independent real Google browser accounts, followed by the initial human test wave. Credential rotation must be completed by the owner; no new secret is needed in the project.
