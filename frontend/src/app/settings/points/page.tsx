"use client";

import Image from "next/image";
import { BackButton } from "@/components/ui/IconButton";

export default function PointsSettingsPage() {
    return (
        <div className="min-h-full bg-[#f7f8fb] px-6 pb-8 pt-4" dir="rtl">
            <header className="relative flex h-11 items-center justify-center">
                <BackButton href="/settings" className="absolute right-0 top-0" />
                <h1 className="text-[18px] font-black text-[#2f3238]">امتیازات</h1>
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center">
                    <Image src="/assets/chinverse/icons/Star.svg" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
                </div>
            </header>
        </div>
    );
}
