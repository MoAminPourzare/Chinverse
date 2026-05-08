import type { ReactNode } from "react";
import Surface from "@/components/ui/Surface";

interface AuthShellProps {
    title: string;
    subtitle: string;
    children: ReactNode;
    footer?: ReactNode;
}

const highlights = [
    "تمرین هانزی",
    "پینیین و لحن‌ها",
    "پیشرفت روزانه",
    "زنجیره یادگیری",
];

export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
    return (
        <div className="min-h-full bg-[linear-gradient(180deg,#f8fbff_0%,#f4f7fb_100%)]" dir="rtl">
            <main className="mx-auto grid min-h-full max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                <Surface className="overflow-hidden bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_50%,#334155_100%)] text-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
                    <div className="p-6 sm:p-8">
                        <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-white/80">
                            ChinVerse
                        </div>

                        <div className="mt-8 max-w-xl">
                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                {title}
                            </h1>
                            <p className="mt-4 text-sm leading-7 text-white/72 sm:text-base">
                                {subtitle}
                            </p>
                        </div>

                        <div className="mt-8 grid gap-3 sm:grid-cols-2">
                            {highlights.map((item) => (
                                <div
                                    key={item}
                                    className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-3 text-sm font-medium text-white/85 backdrop-blur"
                                >
                                    {item}
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 rounded-[26px] border border-white/10 bg-white/8 p-5 backdrop-blur">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
                                برای یادگیری
                            </p>
                            <p className="mt-2 text-lg font-semibold text-white">
                                تجربه‌ای آرام، متمرکز و حرفه‌ای برای یادگیری چینی.
                            </p>
                        </div>
                    </div>
                </Surface>

                <div className="flex flex-col gap-4">
                    <Surface className="p-5 sm:p-8">
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
