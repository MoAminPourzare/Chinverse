'use client';

import { MessageCircle } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";

export default function ChatPage() {
    return (
        <div className="min-h-full px-4 pb-8 pt-4" dir="rtl">
            <PageHeader title="پیام‌ها" subtitle="گفت‌وگوهای چین‌ورس" backHref="/profile" />
            <main className="mx-auto mt-5 w-full max-w-2xl">
                <EmptyState
                    icon={<MessageCircle size={30} />}
                    title="گفت‌وگویی انتخاب نشده است"
                    description="برای شروع پیام، از صفحه ویترین وارد پروفایل یا خدمت موردنظر شو."
                    action={<PrimaryButton href="/community">رفتن به تالار گفتگو</PrimaryButton>}
                />
            </main>
        </div>
    );
}
