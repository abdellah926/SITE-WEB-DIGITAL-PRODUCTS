"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl" className="h-full">
      <body className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-stone-50 px-4 text-center text-stone-900">
        <p className="text-6xl font-black text-amber-800">500</p>
        <p className="text-lg">حدث خطأ غير متوقع.</p>
        <button
          onClick={reset}
          className="rounded-full bg-amber-700 px-6 py-2.5 font-medium text-white hover:bg-amber-800"
        >
          إعادة المحاولة
        </button>
        <p className="sr-only">{error.message}</p>
      </body>
    </html>
  );
}