'use client';

import { BellRing } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

export default function NotificationsPage() {
    return (
        <div className="min-h-full px-4 pb-8 pt-4" dir="rtl">
            <PageHeader title="اعلان‌ها" subtitle="خبرها و پیام‌های مهم حساب" backHref="/profile" />
            <main className="mx-auto mt-5 w-full max-w-2xl">
                <EmptyState
                    icon={<BellRing size={30} />}
                    title="فعلا اعلانی نداری"
                    description="وقتی پیام جدید، پاسخ تالار گفتگو یا رویداد مهمی داشته باشی، اینجا نمایش داده می‌شود."
                />
            </main>
        </div>
    );
}
