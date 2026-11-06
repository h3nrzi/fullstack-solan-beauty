import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  CalendarCheck,
  Clock,
  ShieldCheck,
  Star,
  Layers,
  ArrowLeft,
  Award,
  Phone,
  MapPin,
  HeartHandshake,
  Coffee,
  Check,
} from 'lucide-react';
import { getServices, getArtists } from '../lib/api';
import { HomeNavbar } from '../components/home/HomeNavbar';
import { FaqAccordion } from '../components/home/FaqAccordion';

export const metadata = {
  title: 'سالن زیبایی سولان VIP | رزرو آنلاین نوبت، شفافیت تعرفه و خدمات تخصصی',
  description:
    'سامانه اختصاصی سالن زیبایی سولان برای مراجعین جدید: مشاهده شفاف تعرفه‌ها، سوابق آرتیست‌ها، تضمین عدم معطلی و رزرو آنلاین نوبت.',
};

export default async function HomePage() {
  const [liveServices, liveArtists] = await Promise.all([
    getServices(),
    getArtists(),
  ]);

  // Curated fallback service lines for a rich first-time visitor experience
  const displayServices =
    liveServices && liveServices.length > 0
      ? liveServices.slice(0, 6)
      : [
          {
            id: 's-color',
            name: 'رنگ، دکلره، بالیاژ و لایت‌های ژورنالی',
            description:
              'اجرای بالیاژ روسی، ایرتاچ، آمبره و ترکیب رنگ‌های اختصاصی بدون آسیب به بافت مو و با مشاوره تست ریشه.',
            fixedPrice: null,
            minPrice: 2800000,
            maxPrice: 6500000,
            durationMinutes: 180,
            fixedDeposit: 500000,
            priceType: 'RANGE' as const,
          },
          {
            id: 's-facial',
            name: 'فیشیال و اسکین‌کر تخصصی VIP',
            description:
              'پاکسازی عمقی، هیدروفیشیال، لایه‌برداری آنزیمی و ماساژ لیفتینگ صورت در اتاق اختصاصی آرامش با تجهیزات استریل.',
            fixedPrice: 1650000,
            minPrice: null,
            maxPrice: null,
            durationMinutes: 90,
            fixedDeposit: 300000,
            priceType: 'FIXED' as const,
          },
          {
            id: 's-keratin',
            name: 'احیا، بوتاکس و نانوکراتین مو',
            description:
              'تراپی پیشرفته تارهای آسیب‌دیده با ماندگاری بالا، صافی ابریشمی و مواد ارگانیک بدون فرمالدئید.',
            fixedPrice: null,
            minPrice: 3200000,
            maxPrice: 7500000,
            durationMinutes: 150,
            fixedDeposit: 600000,
            priceType: 'RANGE' as const,
          },
          {
            id: 's-nails',
            name: 'کاشت، ترمیم و اسپا پدیکور روسی',
            description:
              'مانیکور آپارات بدون زخم، لمینت و استحکام‌سازی ناخن طبیعی با پک‌های اختصاصی استریل‌شده در اتوکلاو.',
            fixedPrice: 680000,
            minPrice: null,
            maxPrice: null,
            durationMinutes: 75,
            fixedDeposit: 150000,
            priceType: 'FIXED' as const,
          },
          {
            id: 's-makeup',
            name: 'میکاپ، گریم تخصصی و خدمات عروس',
            description:
              'کانتورینگ متناسب با ساختار هندسی چهره، تکنیک ضدآب با ماندگاری ۲۴ ساعته و سبک‌های نچرال اروپایی.',
            fixedPrice: null,
            minPrice: 2500000,
            maxPrice: 9000000,
            durationMinutes: 120,
            fixedDeposit: 800000,
            priceType: 'RANGE' as const,
          },
          {
            id: 's-lash',
            name: 'میکروبلیدینگ ابرو، لیفت و مژه',
            description:
              'فیبروز مویی قرینه متناسب با فرم چشم، لیفت و بوتاکس ارگانیک مژه و اکستنشن‌های سبک کلاسیک و والیوم.',
            fixedPrice: 1950000,
            minPrice: null,
            maxPrice: null,
            durationMinutes: 90,
            fixedDeposit: 350000,
            priceType: 'FIXED' as const,
          },
        ];

  // Curated fallback master artists
  const displayArtists =
    liveArtists && liveArtists.length > 0
      ? liveArtists.slice(0, 4)
      : [
          {
            id: 'a-1',
            fullName: 'سارا احمدی',
            bio: 'مستر تکنیک‌های رنگ و بالیاژ مدرن، دانش‌آموخته آکادمی لورال با سابقه بیش از ۹ سال در سالن‌های VIP.',
            experienceYears: 9,
            level: 'MASTER',
            specialties: 'بالیاژ روسی، ایرتاچ، تکنیک‌های بدون دکلره',
          },
          {
            id: 'a-2',
            fullName: 'مریم راد',
            bio: 'کارشناس ارشد پوست و زیبایی، متخصص فیشیال‌های تخصصی و جوانسازی غیرتهاجمی با متدهای بین‌المللی.',
            experienceYears: 7,
            level: 'SENIOR',
            specialties: 'هیدروفیشیال، آنزیم‌تراپی، لیفتینگ دستی',
          },
          {
            id: 'a-3',
            fullName: 'نگین حسینی',
            bio: 'متخصص احیا و هیدروکسی مو، مسلط به جدیدترین متریال‌های ارگانیک برزیلی با حفظ استحکام فیبر مو.',
            experienceYears: 8,
            level: 'MASTER',
            specialties: 'نانوکراتین، بوتاکس مو، فیلرتراپی',
          },
          {
            id: 'a-4',
            fullName: 'الناز شمس',
            bio: 'مدرس مانیکور و پدیکور روسی، متخصص لمینت ناخن‌های شکننده با رعایت سخت‌گیرانه‌ترین اصول بهداشتی.',
            experienceYears: 6,
            level: 'SENIOR',
            specialties: 'مانیکور کمبی، لمینت، طراحی مینیمال',
          },
        ];

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-stone-900 selection:bg-rose-100 selection:text-rose-900">
      {/* Top Navigation */}
      <HomeNavbar />

      <main>
        {/* =========================================================================
            HERO SECTION
            Targeted specifically for first-time visitors
           ========================================================================= */}
        <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24 border-b border-stone-200/60">
          <div className="absolute top-0 right-1/2 -mr-64 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="absolute top-1/3 left-10 w-72 h-72 bg-amber-100/40 rounded-full blur-2xl -z-10 pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-6">
              {/* First-time visitor reassurance pill */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200/80 text-rose-900 text-xs sm:text-sm font-semibold shadow-2xs">
                <Sparkles className="w-4 h-4 text-rose-800" aria-hidden="true" />
                <span>تجربه‌ای لوکس، آرام و بدون معطلی در سالن زیبایی سولان</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900 tracking-tight leading-[1.25] sm:leading-[1.2]">
                زیبایی اختصاصی شما با برترین آرتیست‌ها و{' '}
                <span className="text-rose-900 underline decoration-rose-300 decoration-wavy decoration-2 underline-offset-8">
                  زمان‌بندی تضمین‌شده
                </span>
              </h1>

              {/* Copy explicitly addressing first-time visitors */}
              <p className="text-stone-600 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl mx-auto font-normal">
                اگر برای اولین بار است که به سالن سولان می‌آیید، با آرامش خاطر
                رزرو کنید: تعرفه تمام خدمات کاملاً شفاف است، سوابق آرتیست‌ها مشخص
                بوده، و سیستم هوشمند سالن تضمین می‌کند بدون هیچ‌گونه معطلی در ساعت
                مقرر پذیرش شوید.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
                <Link
                  href="/booking"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-rose-900 text-white font-bold text-sm sm:text-base hover:bg-rose-800 transition-all shadow-md hover:shadow-lg active:scale-[0.99]"
                >
                  <CalendarCheck className="w-5 h-5 text-rose-200" aria-hidden="true" />
                  <span>مشاهده ساعت‌های خالی و رزرو نوبت</span>
                </Link>

                <Link
                  href="/services"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-stone-800 border border-stone-300 font-bold text-sm sm:text-base hover:bg-stone-50 transition-all shadow-2xs"
                >
                  <Layers className="w-4 h-4 text-stone-600" aria-hidden="true" />
                  <span>کاتالوگ خدمات و تعرفه‌ها</span>
                </Link>
              </div>

              {/* Free consultation link */}
              <div className="pt-1">
                <Link
                  href="#consultation"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-stone-500 hover:text-rose-900 font-medium transition-colors"
                >
                  <HeartHandshake className="w-4 h-4 text-rose-700" aria-hidden="true" />
                  <span>برای انتخاب خدمت مطمئن نیستید؟ مشاوره رایگان مراجعین جدید</span>
                  <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* Trust and Key Value Strip */}
            <div className="mt-14 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 p-4 sm:p-6 bg-white/80 backdrop-blur-sm rounded-3xl border border-stone-200/80 shadow-sm">
              <div className="text-center p-3">
                <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="font-extrabold text-lg text-stone-900">۴.۹</span>
                </div>
                <p className="text-xs text-stone-600 font-semibold">رضایت مراجعین</p>
                <p className="text-[11px] text-stone-400">بیش از ۱,۲۰۰ نظر مثبت</p>
              </div>

              <div className="text-center p-3 border-r border-stone-100">
                <div className="flex items-center justify-center gap-1 text-emerald-600 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="font-extrabold text-lg text-stone-900">۰ دقیقه</span>
                </div>
                <p className="text-xs text-stone-600 font-semibold">تضمین عدم معطلی</p>
                <p className="text-[11px] text-stone-400">نوبت‌دهی با ظرفیت دقیق</p>
              </div>

              <div className="text-center p-3 border-r border-stone-100">
                <div className="flex items-center justify-center gap-1 text-rose-900 mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="font-extrabold text-lg text-stone-900">۱۰۰٪</span>
                </div>
                <p className="text-xs text-stone-600 font-semibold">شفافیت تعرفه</p>
                <p className="text-[11px] text-stone-400">بدون هیچ هزینه پنهان</p>
              </div>

              <div className="text-center p-3 border-r border-stone-100">
                <div className="flex items-center justify-center gap-1 text-purple-700 mb-1">
                  <Award className="w-4 h-4" />
                  <span className="font-extrabold text-lg text-stone-900">مستر</span>
                </div>
                <p className="text-xs text-stone-600 font-semibold">آرتیست‌های تاییدشده</p>
                <p className="text-[11px] text-stone-400">سوابق و مدارک معتبر</p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            FIRST-TIME VISITOR STEP-BY-STEP ROADMAP (#guide)
           ========================================================================= */}
        <section id="guide" className="py-16 lg:py-20 bg-stone-100/60 border-b border-stone-200/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold text-rose-900 uppercase tracking-widest block mb-2">
                راهنمای آسان برای مراجعین بار اول
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                اولین تجربه شما در سالن سولان چگونه رقم می‌خورد؟
              </h2>
              <p className="text-stone-600 text-xs sm:text-sm mt-2 leading-relaxed">
                فرآیند رزرو و مراجعه در سالن سولان طوری طراحی شده که شفاف، مطمئن و
                کاملاً متمرکز بر آرامش شما باشد.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Step 1 */}
              <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-900 border border-rose-200/60 font-black flex items-center justify-center text-sm mb-4">
                    ۱
                  </div>
                  <h3 className="font-bold text-stone-900 text-base mb-2">
                    انتخاب خدمت و آرتیست
                  </h3>
                  <p className="text-stone-600 text-xs leading-relaxed">
                    تعرفه پایه، مدت زمان و سابقه آرتیست را بدون نیاز به ثبت‌نام یا
                    تماس بررسی کنید و بهترین گزینه را متناسب با نیاز خود برگزینید.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-rose-900 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>شفافیت کامل قیمت و مدت زمان</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-900 border border-rose-200/60 font-black flex items-center justify-center text-sm mb-4">
                    ۲
                  </div>
                  <h3 className="font-bold text-stone-900 text-base mb-2">
                    انتخاب زمان بدون معطلی
                  </h3>
                  <p className="text-stone-600 text-xs leading-relaxed">
                    تقویم روزانه ساعات آزاد واقعی آرتیست و تجهیزات تخصصی (تخت،
                    سرشور، صندلی) را نمایش می‌دهد تا در بدو ورود صندلی شما آماده
                    باشد.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>آمادگی صندلی در رأس ساعت</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-900 border border-rose-200/60 font-black flex items-center justify-center text-sm mb-4">
                    ۳
                  </div>
                  <h3 className="font-bold text-stone-900 text-base mb-2">
                    ورود آسان و بیعانه امن
                  </h3>
                  <p className="text-stone-600 text-xs leading-relaxed">
                    تنها با وارد کردن شماره موبایل و کد پیامکی نوبت شما ثبت
                    می‌شود. بیعانه دریافتی دارای «اعتبار بدون انقضا» در صورت تغییر
                    موجه است.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-stone-600 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-stone-500" />
                  <span>بدون فرم‌های عضویت طولانی</span>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-rose-900 text-white font-black flex items-center justify-center text-sm mb-4 shadow-2xs">
                    ۴
                  </div>
                  <h3 className="font-bold text-stone-900 text-base mb-2">
                    پذیرایی و مشاوره اختصاصی
                  </h3>
                  <p className="text-stone-600 text-xs leading-relaxed">
                    در بدو ورود در فضای آرام VIP پذیرایی می‌شوید و آرتیست قبل از
                    آغاز کار، جلسه مشاوره و آنالیز مو و پوست را با شما انجام می‌دهد.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-rose-900 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-rose-800" />
                  <span>مشاوره و ارزیابی قبل از اجرا</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            WHY SOLAN BEAUTY (DIFFERENTIATORS FOR FIRST-TIMERS)
           ========================================================================= */}
        <section className="py-16 lg:py-20 border-b border-stone-200/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold text-rose-900 uppercase tracking-widest block mb-2">
                تعهدات ما به شما
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                چرا سالن سولان بهترین انتخاب برای اولین مراجعه شماست؟
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-2xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-900 border border-rose-200/70 flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-stone-900">
                  مدیریت هوشمند و بدون معطلی
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  زمان شما باارزش است. سیستم زمان‌بندی سولان ظرفیت صندلی‌ها و اتاق‌ها
                  را همگام‌سازی می‌کند تا حتی ۱ دقیقه معطل نشوید.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-2xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-900 border border-amber-200/70 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-stone-900">
                  شفافیت کامل در تعرفه و بیعانه
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  تمام قیمت‌ها پیش از شروع خدمت شفاف هستند. هیچ هزینه غافلگیرکننده یا
                  تغییر سلیقه‌ای در پایان کار وجود ندارد.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-2xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-900 border border-purple-200/70 flex items-center justify-center">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-stone-900">
                  مشاوره رایگان پیش از اجرا
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  اگر مطمئن نیستید چه رنگ یا استایلی مناسب شماست، پیش از شروع خدمت با
                  آرتیست مشورت کنید و نمونه کارهای زنده را بررسی نمایید.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-2xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-900 border border-emerald-200/70 flex items-center justify-center">
                  <Coffee className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-stone-900">
                  محیط VIP و استریل پزشکی
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  اتاق‌های فیشیال اختصاصی با تهویه مستقل، ابزارهای استریل‌شده در
                  اتوکلاو و محیط آرام با پذیرایی چای و قهوه ارگانیک.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            FEATURED SERVICE LINES & TARIFF TRANSPARENCY (#services)
           ========================================================================= */}
        <section id="services" className="py-16 lg:py-20 bg-stone-100/50 border-b border-stone-200/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <span className="text-xs font-bold text-rose-900 uppercase tracking-widest block mb-2">
                  شفافیت تعرفه و زمان
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                  لاین‌های تخصصی و محبوب سالن سولان
                </h2>
                <p className="text-stone-600 text-xs sm:text-sm mt-1">
                  تعرفه پایه، مدت زمان و بیعانه مشخص برای هر خدمت، بدون هیچ هزینه پنهان.
                </p>
              </div>

              <Link
                href="/services"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-rose-900 hover:text-rose-800 transition-colors"
              >
                <span>مشاهده کلیه خدمات و مقایسه تعرفه‌ها</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayServices.map((service) => {
                const isFixed = service.priceType === 'FIXED' || service.fixedPrice;
                const priceLabel = isFixed
                  ? `${(service.fixedPrice || 0).toLocaleString('fa-IR')} تومان`
                  : `از ${(service.minPrice || 0).toLocaleString('fa-IR')} تا ${(
                      service.maxPrice || 0
                    ).toLocaleString('fa-IR')} تومان`;

                return (
                  <div
                    key={service.id}
                    className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-2xs hover:shadow-md hover:border-rose-200 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-900 border border-rose-200/70">
                          {isFixed ? 'تعرفه ثابت' : 'بازه تعرفه'}
                        </span>
                        {service.durationMinutes && (
                          <span className="flex items-center gap-1 text-[11px] text-stone-500 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{service.durationMinutes} دقیقه</span>
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-base text-stone-900 mb-2 leading-tight">
                        {service.name}
                      </h3>

                      <p className="text-stone-600 text-xs leading-relaxed mb-4 line-clamp-3">
                        {service.description || 'ارائه خدمت با مرغوب‌ترین متریال و تخصص آرتیست سالن.'}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-stone-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-stone-500">مبنای تعرفه:</span>
                        <span className="font-extrabold text-sm text-stone-900">
                          {priceLabel}
                        </span>
                      </div>

                      {service.fixedDeposit && (
                        <div className="flex items-center justify-between text-[11px] text-stone-500">
                          <span>بیعانه رزرو نوبت:</span>
                          <span className="font-bold text-rose-900">
                            {service.fixedDeposit.toLocaleString('fa-IR')} تومان
                          </span>
                        </div>
                      )}

                      <Link
                        href={`/booking?serviceId=${service.id}`}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-stone-50 hover:bg-rose-900 text-stone-800 hover:text-white font-bold text-xs transition-colors border border-stone-200 hover:border-transparent"
                      >
                        <CalendarCheck className="w-4 h-4" />
                        <span>بررسی ظرفیت و رزرو آنلاین</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =========================================================================
            TOP ARTISTS & SPECIALISTS SHOWCASE (#artists)
           ========================================================================= */}
        <section id="artists" className="py-16 lg:py-20 border-b border-stone-200/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold text-rose-900 uppercase tracking-widest block mb-2">
                تخصص و تجربه
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                آرتیست‌های برجسته و صاحب‌نام سالن سولان
              </h2>
              <p className="text-stone-600 text-xs sm:text-sm mt-2">
                هر خدمت توسط متخصصین با سابقه مشخص، مدارک بین‌المللی و رضایت بالای
                مراجعین ارائه می‌شود.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayArtists.map((artist) => (
                <div
                  key={artist.id}
                  className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-900 font-extrabold flex items-center justify-center text-lg mb-4 shadow-2xs">
                      {artist.fullName ? artist.fullName.charAt(0) : 'آ'}
                    </div>

                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-extrabold text-stone-900 text-base">
                        {artist.fullName}
                      </h3>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-900 border border-purple-200">
                        {artist.level === 'MASTER' ? 'مستر آرتیست' : 'آرتیست ارشد'}
                      </span>
                    </div>

                    {artist.experienceYears && (
                      <span className="text-[11px] text-stone-500 block mb-3">
                        بیش از {artist.experienceYears} سال سابقه تخصصی
                      </span>
                    )}

                    <p className="text-stone-600 text-xs leading-relaxed line-clamp-3">
                      {artist.bio || 'متخصص ارائه‌دهنده خدمات لوکس زیبایی با بالاترین استانداردهای سالن.'}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-stone-100">
                    <Link
                      href="/services?tab=artists"
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-rose-900 hover:bg-rose-50 transition-colors"
                    >
                      <span>مشاهده تخصص‌ها و نمونه‌کار</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            FREE FIRST-TIME CONSULTATION BANNER (#consultation)
           ========================================================================= */}
        <section id="consultation" className="py-16 bg-gradient-to-l from-rose-900 to-rose-950 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-rose-800/30 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-800/60 border border-rose-700/60 text-rose-200 text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>مشاوره و ارزیابی برای مراجعین جدید</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              در انتخاب لاین زیبایی یا سبک مناسب خود تردید دارید؟
            </h2>

            <p className="text-rose-100/90 text-xs sm:text-base leading-relaxed max-w-2xl mx-auto">
              نیازی به تصمیم‌گیری عجولانه نیست. پیش از نوبت قطعی، می‌توانید یک درخواست
              بررسی و مشاوره با آرتیست ثبت کنید تا نوع مو، پوست و سبک مدنظرتان ارزیابی
              شود.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/customer/account"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-rose-950 font-bold text-sm hover:bg-rose-50 transition-all shadow-md active:scale-[0.99]"
              >
                <HeartHandshake className="w-4 h-4 text-rose-900" />
                <span>ورود به حساب مشتری و ثبت درخواست مشاوره</span>
              </Link>

              <Link
                href="/booking"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-rose-800/70 hover:bg-rose-800 text-white border border-rose-700 font-bold text-sm transition-all"
              >
                <CalendarCheck className="w-4 h-4 text-rose-200" />
                <span>رزرو مستقیم نوبت</span>
              </Link>
            </div>
          </div>
        </section>

        {/* =========================================================================
            TESTIMONIALS (SOCIAL PROOF)
           ========================================================================= */}
        <section className="py-16 lg:py-20 border-b border-stone-200/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold text-rose-900 uppercase tracking-widest block mb-2">
                تجربه مشتریان
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                روایت مراجعین از اولین تجربه در سالن سولان
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs space-y-3">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-stone-700 text-xs sm:text-sm leading-relaxed">
                  «اولین بار بود به سولان می‌رفتم و نگران معطلی بودم، اما رأس ساعتی که
                  رزرو کرده بودم صندلی آماده بود و خانم احمدی با حوصله رنگ مناسب موهایم
                  را توضیح دادند. قیمت نهایی هم دقیقاً همان بود که در سایت دیده بودم.»
                </p>
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900">سحر مهدوی</span>
                  <span className="text-[11px] text-stone-400">لاین بالیاژ و لایت</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs space-y-3">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-stone-700 text-xs sm:text-sm leading-relaxed">
                  «اتاق فیشیال واقعاً آرامش‌بخش و به شدت تمیز بود. تمام وسایل جلوی چشم
                  خودم از پک استریل باز شدند. بعد از جلسه پوستم کاملاً شفاف شد و مشاوره
                  مراقبت خانگی بسیار کاربردی بود.»
                </p>
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900">فاطمه نوری</span>
                  <span className="text-[11px] text-stone-400">لاین فیشیال VIP</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs space-y-3">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-stone-700 text-xs sm:text-sm leading-relaxed">
                  «یک بار به دلیل جلسه کاری مجبور شدم نوبتم را تغییر دهم و نگران بودم
                  بیعانه‌ام بسوزد، اما سیستم بدون کوچک‌ترین مشکلی بیعانه را به اعتبار
                  رزرو بعدی تبدیل کرد. این احترام به مشتری فوق‌العاده است.»
                </p>
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900">پریسا دادگر</span>
                  <span className="text-[11px] text-stone-400">لاین مانیکور و ناخن</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            FAQ SECTION FOR FIRST-TIME VISITORS (#faq)
           ========================================================================= */}
        <section id="faq" className="py-16 lg:py-20 bg-stone-100/50 border-b border-stone-200/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold text-rose-900 uppercase tracking-widest block mb-2">
                پاسخ به سوالات شما
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                پرسش‌های متداول مراجعین بار اول
              </h2>
              <p className="text-stone-600 text-xs sm:text-sm mt-2">
                هر آنچه پیش از اولین رزرو و حضور در سالن زیبایی سولان باید بدانید.
              </p>
            </div>

            <FaqAccordion />
          </div>
        </section>
      </main>

      {/* =========================================================================
          SITE FOOTER
         ========================================================================= */}
      <footer className="bg-white border-t border-stone-200 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Col 1: Brand Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-900 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-5 h-5 text-rose-200" aria-hidden="true" />
                </div>
                <div>
                  <span className="font-extrabold text-stone-900 text-base">سالن زیبایی سولان</span>
                  <span className="text-[10px] text-stone-500 block">مرکز تخصصی و اختصاصی VIP</span>
                </div>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                ارائه برترین خدمات زیبایی و مراقبت با بهره‌گیری از متخصصین مجرب، متریال
                اروپایی و سیستم نوبت‌دهی هوشمند بدون اتلاف وقت.
              </p>
            </div>

            {/* Col 2: Navigation Links */}
            <div>
              <h3 className="font-bold text-xs uppercase text-stone-900 tracking-wider mb-3">
                دسترسی سریع
              </h3>
              <ul className="space-y-2 text-xs text-stone-600">
                <li>
                  <Link href="/services" className="hover:text-rose-900 transition-colors">
                    کاتالوگ خدمات و تعرفه‌ها
                  </Link>
                </li>
                <li>
                  <Link href="/services?tab=artists" className="hover:text-rose-900 transition-colors">
                    فهرست آرتیست‌ها و تخصص‌ها
                  </Link>
                </li>
                <li>
                  <Link href="/booking" className="hover:text-rose-900 transition-colors">
                    بررسی ظرفیت و زمان‌های آزاد
                  </Link>
                </li>
                <li>
                  <Link href="#guide" className="hover:text-rose-900 transition-colors">
                    راهنمای مراجعین بار اول
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Customer Portals */}
            <div>
              <h3 className="font-bold text-xs uppercase text-stone-900 tracking-wider mb-3">
                پرتال‌ها و امور مراجعین
              </h3>
              <ul className="space-y-2 text-xs text-stone-600">
                <li>
                  <Link href="/customer/account" className="hover:text-rose-900 transition-colors">
                    ورود به حساب مشتری (پیامکی)
                  </Link>
                </li>
                <li>
                  <Link href="/customer/account" className="hover:text-rose-900 transition-colors">
                    پیگیری نوبت‌ها و استعلام اعتبار بیعانه
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-rose-900 transition-colors text-stone-400 hover:text-stone-700">
                    ورود همکاران و پرسنل سالن
                  </Link>
                </li>
                <li>
                  <Link href="/recovery" className="hover:text-rose-900 transition-colors text-stone-400 hover:text-stone-700">
                    بازیابی اضطراری حساب کاربری پرسنل
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Location & Hours */}
            <div className="space-y-3">
              <h3 className="font-bold text-xs uppercase text-stone-900 tracking-wider mb-1">
                اطلاعات حضور و تماس
              </h3>
              <div className="flex items-start gap-2 text-xs text-stone-600 leading-relaxed">
                <MapPin className="w-4 h-4 text-rose-800 flex-shrink-0 mt-0.5" />
                <span>تهران، منطقه ۱، خیابان فرشته، پلاک ۱۸، ساختمان سولان، واحد اختصاصی VIP</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-600">
                <Clock className="w-4 h-4 text-rose-800 flex-shrink-0" />
                <span>ساعات کاری: همه‌روزه از ۹:۰۰ صبح الی ۲۰:۰۰ شب</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-600">
                <Phone className="w-4 h-4 text-rose-800 flex-shrink-0" />
                <span dir="ltr" className="font-mono">۰۲۱ - ۲۲۰۰xxxx</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-500 gap-2">
            <p>© {new Date().getFullYear()} سالن زیبایی سولان. کلیه حقوق محفوظ است.</p>
            <p>سامانه شفاف نوبت‌دهی و مدیریت هوشمند ظرفیت سالن زیبایی VIP</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
