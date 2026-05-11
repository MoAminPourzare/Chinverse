'use client';

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, BriefcaseBusiness, CalendarDays, ImageIcon, MessageCircle, User as UserIcon } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Surface from "@/components/ui/Surface";
import { getMediaUrl } from "@/lib/media";
import { ServiceWithProvider, userService } from "@/services/user.service";

export default function ServiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const serviceId = Number(params.id);
    const [service, setService] = useState<ServiceWithProvider | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchService = async () => {
            try {
                const data = await userService.getPublicService(serviceId);
                setService(data);
            } catch (error) {
                console.error("Failed to fetch service", error);
            } finally {
                setLoading(false);
            }
        };

        if (serviceId) {
            fetchService();
        }
    }, [serviceId]);

    if (loading) {
        return (
            <div className="flex min-h-full items-center justify-center">
                <div className="h-9 w-9 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
            </div>
        );
    }

    if (!service) {
        return (
            <div className="min-h-full px-4 pb-8 pt-4" dir="rtl">
                <EmptyState
                    icon={<BriefcaseBusiness size={30} />}
                    title="خدمت پیدا نشد"
                    description="ممکن است این خدمت حذف شده باشد یا دیگر در دسترس نباشد."
                    action={<PrimaryButton href="/showcase">بازگشت به ویترین</PrimaryButton>}
                />
            </div>
        );
    }

    const providerName = service.provider?.display_name || "ارائه‌دهنده چین‌ورس";
    const chatHref = service.provider?.id ? `/chat/${service.provider.id}` : "/showcase";
    const publishedAt = service.created_at
        ? new Date(service.created_at).toLocaleDateString("fa-IR")
        : "نامشخص";

    return (
        <div className="min-h-full px-4 pb-8 pt-4" dir="rtl">
            <main className="mx-auto flex w-full max-w-2xl flex-col gap-4">
                <header className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
                        aria-label="بازگشت"
                    >
                        <ArrowRight size={20} />
                    </button>
                    <Link href="/showcase" className="text-xs font-bold text-rose-600">
                        ویترین خدمات
                    </Link>
                </header>

                <Surface className="overflow-hidden p-0">
                    <div className="p-5 pb-3">
                        <h1 className="text-xl font-black leading-9 text-slate-950">
                            {service.title}
                        </h1>
                    </div>

                    <div className="relative mx-5 aspect-[4/3] overflow-hidden rounded-[24px] bg-gradient-to-br from-slate-100 to-rose-50">
                        {service.banner_url ? (
                            <Image
                                src={getMediaUrl(service.banner_url)}
                                alt={service.title}
                                fill
                                className="object-cover"
                                sizes="430px"
                                priority
                                unoptimized
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-rose-300">
                                <ImageIcon size={54} />
                            </div>
                        )}
                    </div>

                    <div className="space-y-3 p-5">
                        <div className="grid gap-2 text-sm text-slate-600">
                            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                <span className="inline-flex items-center gap-2 font-bold text-slate-700">
                                    <CalendarDays size={16} className="text-rose-500" />
                                    تاریخ انتشار
                                </span>
                                <span className="text-xs font-semibold text-slate-500">{publishedAt}</span>
                            </div>

                            <Link
                                href={service.provider?.id ? `/users/${service.provider.id}` : "#"}
                                className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 transition hover:bg-rose-50"
                            >
                                <span className="font-bold text-slate-700">منتشر شده توسط</span>
                                <span className="flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-500">
                                    <Avatar src={service.provider?.avatar_url} name={providerName} />
                                    <span className="truncate">{providerName}</span>
                                </span>
                            </Link>
                        </div>
                    </div>
                </Surface>

                <Surface className="p-5">
                    <h2 className="mb-3 text-base font-black text-slate-900">توضیحات خدمت</h2>
                    <p className="whitespace-pre-wrap text-sm leading-8 text-slate-700">
                        {service.description}
                    </p>
                </Surface>

                <div className="sticky bottom-4 z-10">
                    <PrimaryButton
                        href={chatHref}
                        className="w-full shadow-[0_18px_40px_rgba(244,63,94,0.28)]"
                        leadingIcon={<MessageCircle size={19} />}
                    >
                        درخواست مشاوره
                    </PrimaryButton>
                </div>
            </main>
        </div>
    );
}

function Avatar({ src, name }: { src?: string | null; name?: string | null }) {
    return (
        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
            {src ? (
                <Image
                    src={getMediaUrl(src)}
                    alt={name || "کاربر"}
                    fill
                    className="object-cover"
                    sizes="32px"
                    unoptimized
                />
            ) : (
                <UserIcon size={16} className="text-slate-400" />
            )}
        </span>
    );
}
