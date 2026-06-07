"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { getMediaUrl } from "@/lib/media";
import { getDirectionalTextProps, getTextAlign } from "@/lib/textDirection";
import { engagementService, EngagementComment } from "@/services/engagement.service";
import { validateTextLength, validationMessage } from "@/validation";

interface PostCommentsProps {
    postId: number;
    initialCount?: number;
    onCountChange?: (count: number) => void;
    defaultOpen?: boolean;
    showToggle?: boolean;
    className?: string;
}

export default function PostComments({
    postId,
    initialCount = 0,
    onCountChange,
    defaultOpen = false,
    showToggle = true,
    className,
}: PostCommentsProps) {
    const [open, setOpen] = useState(defaultOpen);
    const [comments, setComments] = useState<EngagementComment[]>([]);
    const [draft, setDraft] = useState("");
    const [displayCount, setDisplayCount] = useState(initialCount);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const onCountChangeRef = useRef(onCountChange);

    useEffect(() => {
        onCountChangeRef.current = onCountChange;
    }, [onCountChange]);

    useEffect(() => {
        setDisplayCount(initialCount);
    }, [initialCount]);

    useEffect(() => {
        if (defaultOpen) {
            setOpen(true);
        }
    }, [defaultOpen, postId]);

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
                    onCountChangeRef.current?.(data.length);
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
    }, [open, postId]);

    const submitComment = async () => {
        const content = draft.trim();
        const validationError = validationMessage(validateTextLength(content, "دیدگاه", { required: true, max: 4000 }));
        setError(validationError);
        if (validationError || submitting) return;
        setSubmitting(true);
        try {
            const created = await engagementService.createComment("post", postId, content);
            const nextComments = [...comments, created];
            setComments(nextComments);
            setDisplayCount(nextComments.length);
            onCountChangeRef.current?.(nextComments.length);
            setDraft("");
            setError("");
        } catch (error) {
            console.error("Failed to create comment", error);
            setError("ثبت دیدگاه انجام نشد. لطفا دوباره تلاش کن.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={cn("mt-3 border-t border-slate-100 pt-3", className)}>
            {showToggle && (
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-2 text-xs font-black text-slate-500 transition hover:bg-[#eef6ff] hover:text-[#155aa6]"
            >
                <MessageCircle size={15} />
                {open ? "بستن دیدگاه‌ها" : `${displayCount.toLocaleString("fa-IR")} دیدگاه`}
            </button>
            )}

            {open && (
                <div className={cn("space-y-3", showToggle && "mt-3")}>
                    <div className="flex items-center gap-2 rounded-[22px] border border-slate-200 bg-white px-3 py-2">
                        <input
                            value={draft}
                            dir="auto"
                            onChange={(event) => {
                                setDraft(event.target.value);
                                if (error) setError("");
                            }}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    event.preventDefault();
                                    void submitComment();
                                }
                            }}
                            placeholder="دیدگاهت را بنویس"
                            className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                        />
                        <button
                            type="button"
                            onClick={() => void submitComment()}
                            disabled={!draft.trim() || submitting}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#155aa6] text-white transition hover:bg-[#0f4e92] disabled:cursor-not-allowed disabled:bg-slate-200"
                        >
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        </button>
                    </div>
                    {error && <p className="text-xs font-bold leading-5 text-rose-600">{error}</p>}

                    {loading ? (
                        <div className="flex items-center justify-center py-4 text-xs font-bold text-slate-400">
                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                            در حال دریافت دیدگاه‌ها…
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
                    <p className={cn("truncate text-xs font-black text-slate-800", getTextAlign(comment.author?.display_name))} {...getDirectionalTextProps(comment.author?.display_name)}>{comment.author?.display_name || "کاربر چین‌ورس"}</p>
                    <span className="shrink-0 text-[10px] font-semibold text-slate-400">
                        {new Date(comment.created_at).toLocaleDateString("fa-IR")}
                    </span>
                </div>
                <p className={cn("mt-1 whitespace-pre-wrap text-sm leading-7 text-slate-600", getTextAlign(comment.content))} {...getDirectionalTextProps(comment.content)}>{comment.content}</p>
            </div>
        </div>
    );
}
