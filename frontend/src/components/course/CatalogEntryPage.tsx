import Link from "@/components/ui/ReturnAwareLink";
import { Play } from "lucide-react";
import { BackButton } from "@/components/ui/IconButton";

interface CatalogEntryPageProps {
    entry?: { collectionTitle: string; title: string; subtitle?: string; summary?: string };
    backHref: string;
    watchHref?: string;
    isLoading?: boolean;
    hasError?: boolean;
    previousHref?: string;
    nextHref?: string;
}

/** Opening an entry is independent from whether its media has been published. */
export default function CatalogEntryPage({ entry, backHref, watchHref, isLoading, hasError, previousHref, nextHref }: CatalogEntryPageProps) {
    if (!entry) {
        return <main className="mx-auto max-w-[430px] px-5 py-8" dir="rtl">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">این بخش پیدا نشد</h1>
            <Link back href={backHref} className="mt-5 inline-flex rounded-xl bg-[#155aa6] px-4 py-3 text-sm font-bold text-white">بازگشت به فهرست</Link>
        </main>;
    }
    const status = hasError ? "وضعیت ویدیو دریافت نشد؛ دوباره صفحه را باز کن."
        : isLoading ? "در حال بررسی ویدیوی منتشرشده…"
            : watchHref ? "ویدیو آمادهٔ پخش است." : "فایل اصلی این بخش هنوز منتشر نشده است.";
    return <div className="min-h-full bg-[#f7f8fa] pb-28 dark:bg-[#10151c]" dir="rtl">
        <main className="mx-auto w-full max-w-[430px] px-4 py-5">
            <header data-page-header className="grid grid-cols-[40px_1fr_40px] items-center gap-3" dir="ltr">
                <BackButton href={backHref} label={`بازگشت به ${entry.collectionTitle}`} />
                <div className="min-w-0 text-center">
                    <p className="text-[11px] font-bold text-[#155aa6] dark:text-sky-300">{entry.collectionTitle}</p>
                    <h1 className="mt-1 break-words font-cjk text-lg font-bold text-[#343941] dark:text-white">{entry.title}</h1>
                </div>
                <span aria-hidden />
            </header>
            <section className="mt-5 overflow-hidden rounded-[22px] bg-[#17202c] p-7 text-center text-white" aria-label="وضعیت ویدیو">
                <Play size={30} className="mx-auto" aria-hidden />
                <h2 className="mt-4 text-base font-bold">{watchHref ? "ویدیو آماده است" : "ویدیو هنوز منتشر نشده"}</h2>
                <p className="mt-2 text-xs leading-6 text-slate-300" role="status">{status}</p>
                {watchHref && <Link href={watchHref} className="mt-4 inline-flex rounded-xl bg-white px-4 py-3 text-xs font-bold text-[#155aa6]">تماشای ویدیو</Link>}
            </section>
            <section className="mt-4 rounded-[20px] border border-[#dfe6f0] bg-white p-4 dark:border-slate-700 dark:bg-[#18212b]">
                {entry.subtitle && <p className="break-words font-cjk text-sm leading-7 text-[#343941] dark:text-slate-100" dir="auto">{entry.subtitle}</p>}
                {entry.summary && <p className="mt-2 text-xs leading-6 text-[#59616c] dark:text-slate-300">{entry.summary}</p>}
                <Link back href={backHref} className="mt-3 inline-flex py-2 text-xs font-bold text-[#155aa6] dark:text-sky-300">بازگشت به مجموعه</Link>
            </section>
            {(previousHref || nextHref) && <nav className="mt-4 flex gap-2" aria-label="جابجایی بین قسمت‌ها">
                {previousHref && <Link href={previousHref} className="flex-1 rounded-xl border border-[#dfe6f0] bg-white px-3 py-3 text-center text-xs font-bold text-[#59616c] dark:border-slate-700 dark:bg-[#18212b] dark:text-slate-200">قسمت قبلی</Link>}
                {nextHref && <Link href={nextHref} className="flex-1 rounded-xl bg-[#155aa6] px-3 py-3 text-center text-xs font-bold text-white">قسمت بعدی</Link>}
            </nav>}
        </main>
    </div>;
}
