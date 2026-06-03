"use client";

import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, ImageIcon, MessageCircle, User as UserIcon, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { getMediaUrl } from "@/lib/media";
import { getProfileHref } from "@/utils/profileHref";
import { getDirectionalTextProps, getTextAlign } from "@/lib/textDirection";
import LikeButton from "@/components/engagement/LikeButton";
import PostComments from "@/components/engagement/PostComments";
import { useOptionalCurrentUserId } from "@/hooks/useOptionalCurrentUserId";

export interface PostViewerProvider {
    id?: number | null;
    display_name?: string | null;
    avatar_url?: string | null;
    headline?: string | null;
}

export interface PostViewerData {
    id: number;
    image_url?: string | null;
    caption?: string | null;
    created_at?: string | null;
    likes_count?: number | null;
    comments_count?: number | null;
    provider?: PostViewerProvider | null;
}

interface PostViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    post: PostViewerData | null;
    onCommentCountChange?: (count: number) => void;
    fallbackTitle?: string;
}

export default function PostViewerModal({
    isOpen,
    onClose,
    post,
    onCommentCountChange,
    fallbackTitle = "پست گالری",
}: PostViewerModalProps) {
    const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});
    const currentUserId = useOptionalCurrentUserId();
    const liveCommentsCount = post ? commentCounts[post.id] ?? (post.comments_count || 0) : 0;

    const handleCommentCountChange = (count: number) => {
        if (post) {
            setCommentCounts((previous) => ({ ...previous, [post.id]: count }));
        }
        onCommentCountChange?.(count);
    };

    if (!post) return null;

    const provider = post.provider;
    const hasProvider = Boolean(provider?.display_name || provider?.headline || provider?.avatar_url);

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[140]" onClose={onClose} dir="rtl">
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-950/35 backdrop-blur-md" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto px-3 py-4 sm:px-5 sm:py-7">
                    <div className="flex min-h-full items-start justify-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="-translate-y-3 opacity-0 scale-[0.98]"
                            enterTo="translate-y-0 opacity-100 scale-100"
                            leave="ease-in duration-180"
                            leaveFrom="translate-y-0 opacity-100 scale-100"
                            leaveTo="-translate-y-2 opacity-0 scale-[0.98]"
                        >
                            <Dialog.Panel className="modal-panel-motion w-full max-w-[430px] overflow-hidden rounded-[10px] border border-white/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)] sm:max-w-[520px]">
                                <header className="relative bg-[#dfe3eb] px-3 py-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-slate-600 shadow-sm transition hover:bg-white hover:text-[#155aa6]"
                                        aria-label="بستن"
                                    >
                                        <X size={18} />
                                    </button>

                                    <div className="mr-11 flex min-w-0 items-center justify-end gap-2">
                                        {hasProvider ? (
                                            <Link
                                                href={getProfileHref(provider?.id, currentUserId)}
                                                className="flex min-w-0 items-center gap-2"
                                                onClick={(event) => {
                                                    if (!provider?.id) event.preventDefault();
                                                }}
                                            >
                                                <div className="min-w-0 text-right">
                                                    <p className={cn("truncate text-sm font-black text-slate-950", getTextAlign(provider?.display_name))} {...getDirectionalTextProps(provider?.display_name)}>
                                                        {provider?.display_name || "کاربر چین‌ورس"}
                                                    </p>
                                                    {provider?.headline ? (
                                                        <p className={cn("mt-0.5 truncate text-[11px] font-semibold text-slate-500", getTextAlign(provider.headline))} {...getDirectionalTextProps(provider.headline)}>
                                                            {provider.headline}
                                                        </p>
                                                    ) : null}
                                                </div>
                                                <Avatar src={provider?.avatar_url} name={provider?.display_name} />
                                            </Link>
                                        ) : (
                                            <div className="flex min-w-0 items-center gap-2">
                                                <Dialog.Title className="truncate text-sm font-black text-slate-950">
                                                    {fallbackTitle}
                                                </Dialog.Title>
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#155aa6] shadow-sm">
                                                    <ImageIcon size={19} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </header>

                                <div className="relative aspect-[1/1.08] w-full bg-slate-100 sm:aspect-square">
                                    {post.image_url ? (
                                        <Image
                                            src={getMediaUrl(post.image_url)}
                                            alt={post.caption || fallbackTitle}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 640px) 100vw, 520px"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-slate-300">
                                            <ImageIcon size={52} />
                                        </div>
                                    )}
                                </div>

                                <section className="px-4 pb-5 pt-3">
                                    <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <LikeButton targetType="post" targetId={post.id} initialCount={post.likes_count || 0} compact />
                                            <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-slate-500">
                                                <MessageCircle size={16} />
                                                {liveCommentsCount.toLocaleString("fa-IR")}
                                            </span>
                                        </div>

                                        {post.created_at ? (
                                            <span className="inline-flex min-w-0 items-center gap-1.5 text-slate-500">
                                                <CalendarDays size={15} className="text-slate-400" />
                                                <span className="truncate">تاریخ انتشار: {new Date(post.created_at).toLocaleDateString("fa-IR")}</span>
                                            </span>
                                        ) : null}
                                    </div>

                                    {post.caption ? (
                                        <p className={cn("mt-3 whitespace-pre-wrap text-[13px] font-medium leading-7 text-slate-700", getTextAlign(post.caption))} {...getDirectionalTextProps(post.caption)}>
                                            {post.caption}
                                        </p>
                                    ) : null}

                                    <div className="mt-4 border-t border-slate-100 pt-4">
                                        <div className="mb-3 flex items-center justify-between gap-2">
                                            <h3 className="text-sm font-black text-slate-900">دیدگاه‌ها</h3>
                                            <span className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-black text-slate-400">
                                                {liveCommentsCount.toLocaleString("fa-IR")}
                                            </span>
                                        </div>
                                        <PostComments
                                            postId={post.id}
                                            initialCount={liveCommentsCount}
                                            onCountChange={handleCommentCountChange}
                                            defaultOpen
                                            showToggle={false}
                                            className="mt-0 border-t-0 pt-0"
                                        />
                                    </div>
                                </section>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

function Avatar({ src, name }: { src?: string | null; name?: string | null }) {
    return (
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#155aa6] bg-white shadow-sm">
            {src ? (
                <Image
                    src={getMediaUrl(src)}
                    alt={name || "کاربر"}
                    fill
                    className="object-cover"
                    sizes="44px"
                    unoptimized
                />
            ) : (
                <UserIcon size={18} className="text-slate-400" />
            )}
        </div>
    );
}
