"use client";

import Link from "next/link";
import {
    ArrowRight,
    CalendarDays,
    ChevronLeft,
    Crown,
    Gift,
    Info,
    LogIn,
    LogOut,
    Settings2,
    SlidersHorizontal,
    Trash2,
    User,
    UserPlus,
    type LucideIcon,
} from "lucide-react";
import Surface from "@/components/ui/Surface";
import { cn } from "@/lib/cn";

const primarySettings = [
    {
        title: "تنظیمات نگارشی",
        subtitle: "متن، پین‌یین، هایلایت و سرعت پخش",
        href: "/settings/appearance",
        icon: SlidersHorizontal,
        iconClassName: "bg-blue-50 text-blue-700",
    },
    {
        title: "هدف و فعالیت روزانه",
        subtitle: "زمان تمرین، لغات روزانه و مسیر استریک",
        href: "/settings/daily",
        icon: CalendarDays,
        iconClassName: "bg-amber-50 text-amber-700",
    },
    {
        title: "خرید و مدیریت اشتراک",
        subtitle: "پلن VIP، وضعیت اشتراک و پرداخت",
        href: "/settings/subscription",
        icon: Crown,
        iconClassName: "bg-rose-50 text-rose-700",
    },
    {
        title: "دعوت دوستان و کد رفرال",
        subtitle: "لینک دعوت، آمار دعوت‌ها و پاداش‌ها",
        href: "/settings/referrals",
        icon: Gift,
        iconClassName: "bg-emerald-50 text-emerald-700",
    },
];

const accountItems = [
    {
        title: "حساب کاربری",
        subtitle: "پروفایل و اطلاعات عمومی",
        href: "/profile",
        icon: User,
        iconClassName: "bg-rose-50 text-rose-600",
    },
    {
        title: "درباره چین‌ورس",
        subtitle: "اطلاعات برنامه و مسیر محصول",
        href: "/about",
        icon: Info,
        iconClassName: "bg-slate-100 text-slate-600",
    },
];

export default function SettingsPage() {
    return (
        <div className="min-h-full bg-[#f7f8fb] px-4 pb-8 pt-4" dir="rtl">
            <header className="sticky top-3 z-40 mb-5 flex items-center justify-between rounded-[28px] border border-white/70 bg-white/90 px-4 py-3 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                <Link
                    href="/profile"
                    className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-600 transition hover:bg-slate-100"
                    aria-label="بازگشت"
                >
                    <ArrowRight size={22} />
                </Link>
                <div className="text-center">
                    <h1 className="text-base font-black text-slate-950">تنظیمات</h1>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-400">حساب، یادگیری، اشتراک و دعوت</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-rose-50 text-blue-700">
                    <Settings2 size={22} />
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-2xl flex-col gap-4">
                <Surface className="overflow-hidden border-white bg-white/95 p-0 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
                    <div className="border-b border-slate-100 px-5 py-4">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-rose-500">Settings</p>
                        <h2 className="mt-1 text-lg font-black text-slate-950">بخش‌های اصلی تنظیمات</h2>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {primarySettings.map((item) => (
                            <SettingsRow key={item.href} {...item} />
                        ))}
                    </div>
                </Surface>

                <Surface className="overflow-hidden border-white bg-white/90 p-0">
                    <div className="divide-y divide-slate-100">
                        {accountItems.map((item) => (
                            <SettingsRow key={item.href} {...item} compact />
                        ))}
                    </div>
                </Surface>

                <Surface className="overflow-hidden border-white bg-white/90 p-0">
                    <div className="divide-y divide-slate-100">
                        <StaticActionRow
                            title="ورود"
                            subtitle="برای حساب‌های موجود"
                            href="/login"
                            icon={LogIn}
                            iconClassName="bg-emerald-50 text-emerald-600"
                        />
                        <StaticActionRow
                            title="ثبت نام"
                            subtitle="ساخت حساب تازه"
                            href="/signup"
                            icon={UserPlus}
                            iconClassName="bg-violet-50 text-violet-600"
                        />
                        <StaticActionRow
                            title="خروج"
                            subtitle="بعدا به حساب برگرد"
                            href="/login"
                            icon={LogOut}
                            iconClassName="bg-orange-50 text-orange-600"
                        />
                        <StaticActionRow
                            title="حذف حساب کاربری"
                            subtitle="عملیات حساس و غیرقابل بازگشت"
                            href="/profile"
                            icon={Trash2}
                            iconClassName="bg-red-50 text-red-600"
                            danger
                        />
                    </div>
                </Surface>
            </main>
        </div>
    );
}

function SettingsRow({
    title,
    subtitle,
    href,
    icon: Icon,
    iconClassName,
    compact = false,
}: {
    title: string;
    subtitle: string;
    href: string;
    icon: LucideIcon;
    iconClassName: string;
    compact?: boolean;
}) {
    return (
        <Link
            href={href}
            className={cn(
                "group flex items-center gap-4 px-5 text-right transition hover:bg-slate-50",
                compact ? "py-3.5" : "py-4",
            )}
        >
            <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px]", iconClassName)}>
                <Icon size={21} />
            </div>
            <div className="min-w-0 flex-1">
                <h3 className="text-sm font-black text-slate-900">{title}</h3>
                <p className="mt-1 line-clamp-1 text-xs font-semibold leading-5 text-slate-400">{subtitle}</p>
            </div>
            <ChevronLeft className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:-translate-x-0.5 group-hover:text-slate-500" />
        </Link>
    );
}

function StaticActionRow({
    title,
    subtitle,
    href,
    icon: Icon,
    iconClassName,
    danger = false,
}: {
    title: string;
    subtitle: string;
    href: string;
    icon: LucideIcon;
    iconClassName: string;
    danger?: boolean;
}) {
    return (
        <Link href={href} className="group flex items-center gap-4 px-5 py-3.5 text-right transition hover:bg-slate-50">
            <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px]", iconClassName)}>
                <Icon size={20} />
            </div>
            <div className="min-w-0 flex-1">
                <h3 className={cn("text-sm font-black", danger ? "text-red-600" : "text-slate-900")}>{title}</h3>
                <p className="mt-1 line-clamp-1 text-xs font-semibold leading-5 text-slate-400">{subtitle}</p>
            </div>
            <ChevronLeft className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:-translate-x-0.5 group-hover:text-slate-500" />
        </Link>
    );
}
