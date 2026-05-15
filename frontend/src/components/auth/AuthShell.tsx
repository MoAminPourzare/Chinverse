import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Surface from "@/components/ui/Surface";

interface AuthShellProps {
    title: string;
    subtitle: string;
    children: ReactNode;
    footer?: ReactNode;
    backHref?: string;
}

const highlights = [
    "تمرین هانزی",
    "پینیین و لحن‌ها",
    "پیشرفت روزانه",
    "زنجیره یادگیری",
];

export default function AuthShell({ title, subtitle, children, footer, backHref = "/" }: AuthShellProps) {
    return (
        <div className="min-h-full bg-[linear-gradient(180deg,#f8fbff_0%,#f4f7fb_100%)]" dir="rtl">
            <main className="mx-auto grid min-h-full max-w-5xl gap-4 px-4 py-4 lg:grid-cols-[0.95fr_1fr] lg:items-center">
                <Surface className="overflow-hidden bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_50%,#334155_100%)] text-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
                    <div className="p-5 sm:p-6">
                        <div className="flex items-center justify-between gap-3">
                            <Link
                                href={backHref}
                                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white/85 transition hover:bg-white/15 hover:text-white"
                                aria-label="بازگشت"
                            >
                                <ArrowRight size={19} />
                            </Link>
                            <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-white/80">
                                ChinVerse
                            </div>
                        </div>

                        <div className="mt-5 max-w-xl">
                            <h1 className="text-2xl font-black leading-9 tracking-tight sm:text-3xl">
                                {title}
                            </h1>
                            <p className="mt-3 text-sm leading-7 text-white/72">
                                {subtitle}
                            </p>
                        </div>

                        <div className="mt-5 grid gap-2 sm:grid-cols-2">
                            {highlights.map((item) => (
                                <div
                                    key={item}
                                    className="rounded-[20px] border border-white/10 bg-white/8 px-3 py-2.5 text-xs font-bold text-white/85 backdrop-blur"
                                >
                                    {item}
                                </div>
                            ))}
                        </div>

                        <div className="mt-5 rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
                                برای یادگیری
                            </p>
                            <p className="mt-2 text-sm font-bold leading-7 text-white">
                                تجربه‌ای آرام، متمرکز و حرفه‌ای برای یادگیری چینی.
                            </p>
                        </div>
                    </div>
                </Surface>

                <div className="flex flex-col gap-4">
                    <Surface className="p-5 sm:p-6">
                        {children}
                    </Surface>
                    {footer && (
                        <Surface className="px-5 py-4 sm:px-6">
                            {footer}
                        </Surface>
                    )}
                </div>
            </main>
        </div>
    );
}
