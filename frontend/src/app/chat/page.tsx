"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search, User as UserIcon, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { BackButton } from "@/components/ui/IconButton";
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

    return (
        <div className="min-h-full bg-[#f7f8fa] px-5 pb-8 pt-5" dir="rtl">
            <header className="grid grid-cols-[44px_1fr_44px] items-center">
                <BackButton href="/community" className="justify-self-end" />
                <h1 className="text-center text-lg font-black text-slate-900">پیام‌ها</h1>
                <span aria-hidden />
            </header>

            <label className="mt-8 flex h-[52px] items-center gap-3 rounded-full bg-[#e2e5eb] px-4 text-slate-500 focus-within:ring-4 focus-within:ring-[#155aa6]/10">
                {query ? (
                    <button
                        type="button"
                        onClick={() => setQuery("")}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-white"
                        aria-label="پاک کردن جستجو"
                    >
                        <X size={18} />
                    </button>
                ) : (
                    <Search size={20} className="text-slate-700" />
                )}
                <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="جستجو بین پیام‌ها..."
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
            </label>

            <main className="mt-6">
                {isLoading ? (
                    <div className="flex min-h-[340px] items-center justify-center">
                        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#155aa6] border-t-transparent" />
                    </div>
                ) : filteredConversations.length > 0 ? (
                    <div className="space-y-3">
                        {filteredConversations.map((conversation) => (
                            <ConversationRow key={conversation.user.id} conversation={conversation} />
                        ))}
                    </div>
                ) : conversations.length > 0 ? (
                    <EmptySearchState />
                ) : (
                    <EmptyMessagesState />
                )}
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
            className="flex items-center gap-3 rounded-[24px] border border-[#e0e5ee] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition hover:border-[#155aa6]/30 hover:shadow-[0_10px_28px_rgba(21,90,166,0.10)]"
        >
            <div className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#155aa6] bg-white">
                {conversation.user.avatar_url ? (
                    <Image
                        src={getMediaUrl(conversation.user.avatar_url)}
                        alt={displayName}
                        fill
                        className="object-cover"
                        sizes="52px"
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
                    <span className="shrink-0 text-[11px] font-semibold text-slate-400">{lastTime}</span>
                </div>
                <p className="mt-1 line-clamp-1 text-xs leading-6 text-slate-500">
                    {conversation.last_message || "هنوز پیامی ثبت نشده"}
                </p>
            </div>

            {conversation.unread_count > 0 && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#155aa6] px-2 text-[11px] font-black text-white">
                    {conversation.unread_count}
                </span>
            )}
        </Link>
    );
}

function EmptyMessagesState() {
    return (
        <div className="flex min-h-[430px] flex-col items-center justify-center px-5 text-center">
            <Image
                src="/assets/chinverse/icons/chat-message-hover-pinch.svg"
                alt=""
                width={168}
                height={168}
                className="h-[168px] w-[168px] object-contain"
            />
            <h2 className="mt-7 text-lg font-black text-slate-900">هنوز پیامی دریافت نکردی!</h2>
        </div>
    );
}

function EmptySearchState() {
    return (
        <div className="flex min-h-[320px] flex-col items-center justify-center px-5 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#155aa6]/10 text-[#155aa6]">
                <Search size={34} />
            </div>
            <h2 className="mt-6 text-lg font-black text-slate-900">نتیجه‌ای پیدا نشد</h2>
            <p className="mt-2 max-w-[260px] text-sm leading-7 text-slate-500">
                عبارت جستجو را کوتاه‌تر یا متفاوت‌تر وارد کن.
            </p>
        </div>
    );
}
