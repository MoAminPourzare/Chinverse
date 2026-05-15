"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Loader2, MessageCircle, Send, User as UserIcon } from "lucide-react";
import { getMediaUrl } from "@/lib/media";
import { engagementService, EngagementComment } from "@/services/engagement.service";

interface PostCommentsProps {
    postId: number;
    initialCount?: number;
    onCountChange?: (count: number) => void;
}

export default function PostComments({ postId, initialCount = 0, onCountChange }: PostCommentsProps) {
    const [open, setOpen] = useState(false);
    const [comments, setComments] = useState<EngagementComment[]>([]);
    const [draft, setDraft] = useState("");
    const [displayCount, setDisplayCount] = useState(initialCount);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        setDisplayCount(initialCount);
    }, [initialCount]);

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        const loadComments = async () => {
            setLoading(true);
            try {
                const data = await engagementService.getComments("post", postId);
                if (!cancelled) {
                    setComments(data);
                    setDisplayCount(data.length);
                    onCountChange?.(data.length);
                }
            } catch (error) {
                console.error("Failed to load comments", error);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };
        void loadComments();
        return () => {
            cancelled = true;
        };
    }, [onCountChange, open, postId]);

    const submitComment = async () => {
        const content = draft.trim();
        if (!content || submitting) return;
        setSubmitting(true);
        try {
            const created = await engagementService.createComment("post", postId, content);
            const nextComments = [...comments, created];
            setComments(nextComments);
            setDisplayCount(nextComments.length);
            onCountChange?.(nextComments.length);
            setDraft("");
        } catch (error) {
            console.error("Failed to create comment", error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mt-3 border-t border-slate-100 pt-3">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-2 text-xs font-black text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
            >
                <MessageCircle size={15} />
                {open ? "بستن دیدگاه‌ها" : `${displayCount.toLocaleString("fa-IR")} دیدگاه`}
            </button>

            {open && (
                <div className="mt-3 space-y-3">
                    <div className="flex items-center gap-2 rounded-[22px] border border-slate-200 bg-white px-3 py-2">
                        <input
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    event.preventDefault();
                                    void submitComment();
                                }
                            }}
                            placeholder="دیدگاهت را بنویس..."
                            className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                        />
                        <button
                            type="button"
                            onClick={() => void submitComment()}
                            disabled={!draft.trim() || submitting}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200"
                        >
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-4 text-xs font-bold text-slate-400">
                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                            در حال دریافت دیدگاه‌ها...
                        </div>
                    ) : comments.length > 0 ? (
                        <div className="space-y-2">
                            {comments.map((comment) => (
                                <CommentItem key={comment.id} comment={comment} />
                            ))}
                        </div>
                    ) : (
                        <p className="rounded-2xl bg-slate-50 px-4 py-4 text-center text-xs font-bold text-slate-400">
                            هنوز دیدگاهی ثبت نشده است.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

function CommentItem({ comment }: { comment: EngagementComment }) {
    return (
        <div className="flex items-start gap-2 rounded-[20px] bg-slate-50 p-3">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white">
                {comment.author?.avatar_url ? (
                    <Image
                        src={getMediaUrl(comment.author.avatar_url)}
                        alt={comment.author.display_name || "کاربر"}
                        fill
                        className="object-cover"
                        sizes="36px"
                        unoptimized
                    />
                ) : (
                    <UserIcon size={17} className="text-slate-400" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-black text-slate-800">{comment.author?.display_name || "کاربر چین‌ورس"}</p>
                    <span className="shrink-0 text-[10px] font-semibold text-slate-400">
                        {new Date(comment.created_at).toLocaleDateString("fa-IR")}
                    </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-slate-600">{comment.content}</p>
            </div>
        </div>
    );
}
