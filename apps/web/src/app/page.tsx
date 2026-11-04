import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 bg-white/80 backdrop-blur shadow-xl rounded-2xl border border-stone-200">
        <h1 className="text-2xl font-bold text-stone-900 mb-2">
          سالن زیبایی VIP
        </h1>
        <p className="text-stone-600 mb-6 text-sm">
          پلتفرم یکپارچه مدیریت عملیات، رزرو و دسترسی پرسنل
        </p>
        <Link
          href="/login"
          className="inline-flex w-full justify-center items-center py-3 px-4 rounded-xl text-white bg-rose-900 hover:bg-rose-800 transition font-medium"
        >
          ورود کارکنان
        </Link>
      </div>
    </main>
  );
}
