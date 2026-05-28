"use client";

import Image from "next/image";
import Link from "next/link";
import { BackButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/cn";

type SettingsItem = {
    title: string;
    href: string;
    icon: string;
    danger?: boolean;
};

const settingsItems: SettingsItem[] = [
    {
        title: "حساب کاربری",
        href: "/account",
        icon: "/assets/chinverse/icons/profile.svg",
    },
    {
        title: "مدیریت اشتراک",
        href: "/settings/subscription",
        icon: "/assets/chinverse/icons/Membership.svg",
    },
    {
        title: "هدف روزانه",
        href: "/settings/daily",
        icon: "/assets/chinverse/icons/Goal.svg",
    },
    {
        title: "تنظیمات نگارشی",
        href: "/settings/appearance",
        icon: "/assets/chinverse/icons/Preferences 2.svg",
    },
    {
        title: "درباره چین ورس",
        href: "/settings/about",
        icon: "/assets/chinverse/icons/About chinverse.svg",
    },
    {
        title: "معرفی چین ورس به دوستان",
        href: "/settings/referrals",
        icon: "/assets/chinverse/icons/invite friends.svg",
    },
    {
        title: "امتیازات",
        href: "/settings/points",
        icon: "/assets/chinverse/icons/Star.svg",
    },
    {
        title: "ورود",
        href: "/login",
        icon: "/assets/chinverse/icons/Exit.svg",
    },
    {
        title: "ثبت نام",
        href: "/signup",
        icon: "/assets/chinverse/icons/2 people.svg",
    },
    {
        title: "خروج از حساب کاربری",
        href: "/login",
        icon: "/assets/chinverse/icons/Log out.svg",
    },
    {
        title: "حذف حساب کاربری",
        href: "/profile",
        icon: "/assets/chinverse/icons/Delete.svg",
        danger: true,
    },
];

export default function SettingsPage() {
    return (
        <div className="min-h-full bg-[#f7f8fb] px-6 pb-8 pt-4" dir="rtl">
            <header className="relative flex h-11 items-center justify-center">
                <BackButton href="/profile" className="absolute right-0 top-0" />
                <h1 className="text-[18px] font-black text-[#2f3238]">تنظیمات</h1>
            </header>

            <main className="mx-auto mt-6 flex w-full max-w-[430px] flex-col">
                <div className="space-y-1">
                    {settingsItems.map((item) => (
                        <SettingsRow key={item.href + item.title} item={item} />
                    ))}
                </div>

                <div className="pointer-events-none mt-9 pr-2">
                    <Image
                        src="/assets/chinverse/icons/Setting.svg"
                        alt=""
                        width={160}
                        height={160}
                        className="h-36 w-36 object-contain"
                    />
                </div>
            </main>
        </div>
    );
}

function SettingsRow({ item }: { item: SettingsItem }) {
    return (
        <Link
            href={item.href}
            className="group flex min-h-[53px] items-center gap-3 rounded-[16px] px-1 transition hover:bg-white/70"
        >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                <Image src={item.icon} alt="" width={28} height={28} className="h-7 w-7 object-contain" />
            </div>
            <span className={cn("min-w-0 flex-1 text-[15px] font-black text-[#2f3238]", item.danger && "text-red-600")}>
                {item.title}
            </span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center text-2xl font-light leading-none text-[#155aa6] transition group-hover:-translate-x-0.5">
                ‹
            </span>
        </Link>
    );
}
