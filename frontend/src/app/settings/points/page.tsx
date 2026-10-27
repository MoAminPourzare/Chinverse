"use client";

import Image from "@/components/ui/PublicMediaImage";
import { AppHeader } from "@/components/ui/IconButton";

export default function PointsSettingsPage() {
    return (
        <div className="min-h-full bg-[#f7f8fb] px-4 pb-8 pt-4 dark:bg-[#10151c]" dir="rtl">
            <AppHeader title="امتیازات" backHref="/settings" icon={<Image src="/assets/chinverse/icons/Star.svg" alt="" width={28} height={28} />} />
        </div>
    );
}
