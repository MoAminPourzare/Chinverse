"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays, ImageIcon, Loader2, User as UserIcon } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { BackButton } from "@/components/ui/IconButton";
import LikeButton from "@/components/engagement/LikeButton";
import PostComments from "@/components/engagement/PostComments";
import { useOptionalCurrentUserId } from "@/hooks/useOptionalCurrentUserId";
import { cn } from "@/lib/cn";
import { getMediaUrl } from "@/lib/media";
import { getProfileHref } from "@/utils/profileHref";
import { getDirectionalTextProps, getTextAlign } from "@/lib/textDirection";
import { postService, PostDetail } from "@/services/post.service";

export default function PostDetailPage() {
    const params = useParams();
    const router = useRouter();
    const postId = Number(params.id);
    const [post, setPost] = useState<PostDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [commentsCount, setCommentsCount] = useState(0);
    const currentUserId = useOptionalCurrentUserId();

    useEffect(() => {
        let cancelled = false;

        const fetchPost = async () => {
            setLoading(true);
            try {
                const data = await postService.getPost(postId);
                if (!cancelled) {
                    setPost(data);
                    setCommentsCount(data.comments_count || 0);
                }
            } catch (error) {
                console.error("Failed to fetch post", error);
                if (!cancelled) {
                    setPost(null);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        if (postId) {
            void fetchPost();
        }

        return () => {
            cancelled = true;
        };
    }, [postId]);

    if (loading) {
        return (
            <div className="flex min-h-full items-center justify-center bg-[#f7f8fb]">
                <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin text-[#155aa6]" />
                    در حال بارگذاری پست…
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-full bg-[#f7f8fb] px-4 py-6" dir="rtl">
                <EmptyState
                    icon={<ImageIcon size={30} />}
                    title="پست پیدا نشد"
                    description="ممکن است این پست حذف شده باشد یا دیگر در دسترس نباشد."
                />
            </div>
        );
    }

    return (
        <div className="min-h-full bg-[#f7f8fb] pb-28" dir="rtl">
            <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-4">
                <header className="flex items-center justify-between">
                    <BackButton onClick={() => router.back()} />
                    <Link href="/" className="text-xs font-black text-[#155aa6]">
                        خانه
                    </Link>
                </header>

                <article className="overflow-hidden rounded-[30px] border border-white bg-white shadow-[0_22px_60px_rgba(15,23,42,0.10)]">
                    <div className="p-4">
                        <PostAuthor post={post} currentUserId={currentUserId} />
                    </div>

                    <div className="relative mx-4 aspect-[4/3] overflow-hidden rounded-[26px] bg-slate-100">
                        {post.image_url ? (
                            <Image
                                src={getMediaUrl(post.image_url)}
                                alt={post.caption || "پست"}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 640px"
                                priority
                                unoptimized
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-slate-300">
                                <ImageIcon size={48} />
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <LikeButton targetType="post" targetId={post.id} initialCount={post.likes_count || 0} />
                            <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
                                <CalendarDays size={15} className="text-slate-400" />
                                {post.created_at ? new Date(post.created_at).toLocaleDateString("fa-IR") : "تاریخ نامشخص"}
                            </div>
                        </div>

                        {post.caption && (
                            <p className={cn("whitespace-pre-wrap rounded-[24px] bg-slate-50 px-4 py-4 text-sm leading-8 text-slate-700", getTextAlign(post.caption))} {...getDirectionalTextProps(post.caption)}>
                                {post.caption}
                            </p>
                        )}

                        <PostComments postId={post.id} initialCount={commentsCount} onCountChange={setCommentsCount} />
                    </div>
                </article>
            </main>
        </div>
    );
}

function PostAuthor({ post, currentUserId }: { post: PostDetail; currentUserId: number | null }) {
    const provider = post.provider;
    const profileHref = getProfileHref(provider?.id, currentUserId);

    return (
        <div className="flex items-center gap-3">
            <Link
                href={profileHref}
                className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[19px] bg-slate-100"
            >
                {provider?.avatar_url ? (
                    <Image
                        src={getMediaUrl(provider.avatar_url)}
                        alt={provider.display_name || "کاربر"}
                        fill
                        className="object-cover"
                        sizes="48px"
                        unoptimized
                    />
                ) : (
                    <UserIcon className="h-5 w-5 text-slate-400" />
                )}
            </Link>
            <div className="min-w-0 flex-1">
                <Link href={profileHref} className={cn("block truncate text-sm font-black text-slate-950", getTextAlign(provider?.display_name))} {...getDirectionalTextProps(provider?.display_name)}>
                    {provider?.display_name || "کاربر چین‌ورس"}
                </Link>
                <p className={cn("mt-0.5 truncate text-xs font-semibold text-slate-400", getTextAlign(provider?.headline))} {...getDirectionalTextProps(provider?.headline)}>
                    {provider?.headline || "عضو جامعه چین‌ورس"}
                </p>
            </div>
        </div>
    );
}
