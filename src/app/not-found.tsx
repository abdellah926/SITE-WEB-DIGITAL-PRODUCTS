import Link from "next/link";

export default async function NotFoundPage() {
  return (
    <div dir="rtl" className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-stone-50 px-4 text-center text-stone-900">
      <p className="text-6xl font-black text-amber-800">404</p>
      <p className="text-lg">الصفحة غير موجودة.</p>
      <Link
        href="/"
        className="rounded-full bg-amber-700 px-6 py-3 font-medium text-white hover:bg-amber-800"
      >
        العودة للرئيسية
      </Link>
    </div>
  );
}