"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-dvh bg-slate-950 text-white flex items-center justify-center p-6">
        <main className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
          <h1 className="text-xl font-bold">مشکلی پیش آمد</h1>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            اتصال یا اجرای برنامه با خطا روبه‌رو شد. دوباره تلاش کنید؛ اگر مشکل ادامه داشت، صفحه را تازه کنید.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-5 min-h-11 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            تلاش دوباره
          </button>
        </main>
      </body>
    </html>
  );
}
