"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, MessageCircle, Search, Sparkles, User as UserIcon } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Surface from "@/components/ui/Surface";
import { cn } from "@/lib/cn";
import { getMediaUrl } from "@/lib/media";
import { chatService, ConversationPreview } from "@/services/chat.service";

export default function ChatPage() {
    const [conversations, setConversations] = useState<ConversationPreview[]>([]);
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const fetchConversations = async () => {
            try {
                const data = await chatService.getConversations();
                if (isMounted) {
                    setConversations(data);
                }
            } catch (error) {
                console.error("Failed to fetch conversations", error);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchConversations();
        const interval = window.setInterval(fetchConversations, 12_000);

        return () => {
            isMounted = false;
            window.clearInterval(interval);
        };
    }, []);

    const filteredConversations = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return conversations;

        return conversations.filter((conversation) => {
            const name = conversation.user.display_name?.toLowerCase() || "";
            const message = conversation.last_message.toLowerCase();
            return name.includes(normalized) || message.includes(normalized);
        });
    }, [conversations, query]);

    const unreadTotal = conversations.reduce((total, item) => total + item.unread_count, 0);

    return (
        <div className="min-h-full px-4 pb-8 pt-4" dir="rtl">
            <section className="overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 text-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
                <div className="relative p-5">
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_46%,#334155_100%)]" />
                    <div className="absolute -left-12 top-0 h-44 w-44 rounded-full bg-rose-500/30 blur-3xl" />
                    <div className="absolute -bottom-20 right-10 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl" />
                    <div className="absolute left-16 bottom-2 h-28 w-28 rounded-full bg-amber-300/15 blur-3xl" />
                    <div className="relative">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <Link
                                href="/profile"
                                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white transition hover:bg-white/15"
                                aria-label="بازگشت"
                            >
                                <ArrowRight size={19} />
                            </Link>
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
                                <Sparkles size={14} />
                                {unreadTotal > 0 ? `${unreadTotal} پیام جدید` : "پیام ها"}
                            </div>
                        </div>
                        <h1 className="text-2xl font-black tracking-tight">گفت وگوها</h1>
                        <p className="mt-3 text-sm leading-7 text-white/72">
                            پیام های خصوصی و ارتباط با کاربران را از اینجا دنبال کن.
                        </p>
                        <label className="mt-5 flex items-center gap-3 rounded-[22px] border border-white/15 bg-white/10 px-4 py-3 text-white/70 backdrop-blur">
                            <Search size={18} />
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="جستجو در گفتگوها"
                                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/45"
                            />
                        </label>
                    </div>
                </div>
            </section>

            <main className="mx-auto mt-5 w-full max-w-2xl">
                <Surface className="overflow-hidden p-0">
                    {isLoading ? (
                        <div className="flex min-h-[260px] items-center justify-center">
                            <div className="h-9 w-9 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
                        </div>
                    ) : filteredConversations.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {filteredConversations.map((conversation) => (
                                <ConversationRow key={conversation.user.id} conversation={conversation} />
                            ))}
                        </div>
                    ) : conversations.length > 0 ? (
                        <EmptyState
                            className="border-0 bg-transparent shadow-none"
                            icon={<Search size={30} />}
                            title="گفتگویی پیدا نشد"
                            description="عبارت جستجو را کوتاه تر یا متفاوت تر وارد کن."
                        />
                    ) : (
                        <EmptyState
                            className="border-0 bg-transparent shadow-none"
                            icon={<MessageCircle size={30} />}
                            title="هنوز گفتگویی نداری"
                            description="برای شروع پیام، از صفحه ویترین وارد پروفایل کاربر موردنظر شو."
                            action={<PrimaryButton href="/showcase">رفتن به ویترین</PrimaryButton>}
                        />
                    )}
                </Surface>
            </main>
        </div>
    );
}

function ConversationRow({ conversation }: { conversation: ConversationPreview }) {
    const displayName = conversation.user.display_name || "کاربر چین ورس";
    const lastTime = new Date(conversation.last_message_time).toLocaleTimeString("fa-IR", {
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <Link
            href={`/chat/${conversation.user.id}`}
            className="flex items-center gap-3 px-4 py-4 transition hover:bg-rose-50/60"
        >
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[22px] bg-slate-100">
                {conversation.user.avatar_url ? (
                    <Image
                        src={getMediaUrl(conversation.user.avatar_url)}
                        alt={displayName}
                        fill
                        className="object-cover"
                        sizes="56px"
                        unoptimized
                    />
                ) : (
                    <UserIcon className="text-slate-400" size={22} />
                )}
                <span
                    className={cn(
                        "absolute bottom-0.5 left-0.5 h-3.5 w-3.5 rounded-full border-2 border-white",
                        conversation.is_online ? "bg-emerald-400" : "bg-slate-300",
                    )}
                />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="truncate text-sm font-black text-slate-900">{displayName}</h2>
                    <span className="shrink-0 text-[11px] text-slate-400">{lastTime}</span>
                </div>
                <p className="mt-1 line-clamp-1 text-xs leading-6 text-slate-500">
                    {conversation.last_message || "پیامی ثبت نشده"}
                </p>
            </div>
            {conversation.unread_count > 0 && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-500 px-2 text-[11px] font-black text-white">
                    {conversation.unread_count}
                </span>
            )}
        </Link>
    );
}
