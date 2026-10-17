"use client";

import Image from "@/components/ui/PublicMediaImage";
import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send, Trash2, User as UserIcon } from "lucide-react";
import { useOptionalCurrentUserId } from "@/hooks/useOptionalCurrentUserId";
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
    ownerId?: number;
    contained?: boolean;
}

export default function PostComments({
    postId,
    initialCount = 0,
    onCountChange,
    defaultOpen = false,
    showToggle = true,
    className,
    ownerId,
    contained = false,
}: PostCommentsProps) {
    const [open, setOpen] = useState(defaultOpen);
    const [comments, setComments] = useState<EngagementComment[]>([]);
    const [draft, setDraft] = useState("");
    const [displayCount, setDisplayCount] = useState(initialCount);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [loadError, setLoadError] = useState(false);
    const [retry, setRetry] = useState(0);
    const listRef = useRef<HTMLDivElement>(null);
    const currentUserId = useOptionalCurrentUserId();
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const onCountChangeRef = useRef(onCountChange);

    useEffect(() => {
        onCountChangeRef.current = onCountChange;
    }, [onCountChange]);

    useEffect(() => {
        setDisplayCount(initialCount);
        setConfirmDeleteId(null);
    }, [initialCount]);

    const deleteComment = async (id: number) => {
        if (deletingId !== null) return;
        setDeletingId(id);
        setError("");
        try {
            await engagementService.deleteComment("post", postId, id);
            const next = comments.filter((comment) => comment.id !== id);
            setComments(next);
            setDisplayCount(next.length);
            onCountChangeRef.current?.(next.length);
            setConfirmDeleteId(null);
        } catch { setError("حذف دیدگاه انجام نشد. دوباره تلاش کن."); }
        finally { setDeletingId(null); }
    };

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
            setLoadError(false);
            try {
                const data = await engagementService.getComments("post", postId);
                if (!cancelled) {
                    setComments(data);
                    setDisplayCount(data.length);
                    onCountChangeRef.current?.(data.length);
                }
            } catch {
                if (!cancelled) setLoadError(true);
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
    }, [open, postId, retry]);

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
            if (contained) requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }));
        } catch (error) {
            console.error("Failed to create comment", error);
            setError("ثبت دیدگاه انجام نشد. لطفا دوباره تلاش کن.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={cn(contained ? "flex min-h-0 flex-1 flex-col" : "mt-3 border-t border-slate-100 pt-3", className)}>
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
                <div className={cn(contained ? "flex min-h-0 flex-1 flex-col gap-3" : "space-y-3", showToggle && "mt-3")}>
                    <div className={cn("flex items-center gap-2 rounded-[22px] border border-slate-200 bg-white px-3 py-2", contained && "order-2 shrink-0")}>
                        <input
                            value={draft}
                            dir={draft.trim() ? "auto" : "rtl"}
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
                            placeholder="دیدگاهت رو بنویس"
                            aria-label="دیدگاهت رو بنویس"
                            className="min-w-0 flex-1 bg-transparent text-right text-sm text-slate-800 outline-none placeholder:text-right placeholder:text-slate-400"
                        />
                        <button
                            type="button"
                            onClick={() => void submitComment()}
                            disabled={!draft.trim() || submitting}
                            aria-label="ارسال دیدگاه"
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#155aa6] text-white transition hover:bg-[#0f4e92] disabled:cursor-not-allowed disabled:bg-slate-200"
                        >
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        </button>
                    </div>
                    {error && <p role="alert" className={cn("text-xs font-bold leading-5 text-rose-600", contained && "order-1 shrink-0")}>{error}</p>}

                    <div ref={listRef} role="region" aria-label="فهرست دیدگاه‌ها" tabIndex={contained ? 0 : undefined} className={cn(contained && "min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-2xl focus-visible:outline-2 focus-visible:outline-[#155aa6]")}>
                    {loading ? (
                        <div className="flex items-center justify-center py-4 text-xs font-bold text-slate-400">
                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                            در حال دریافت دیدگاه‌ها…
                        </div>
                    ) : loadError ? (
                        <div role="alert" className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
                            <p>دیدگاه‌ها دریافت نشد. دوباره تلاش کن.</p>
                            <button type="button" onClick={() => setRetry(value => value + 1)} className="mt-3 min-h-11 rounded-xl bg-white px-4 font-bold">تلاش دوباره</button>
                        </div>
                    ) : comments.length > 0 ? (
                        <div className="space-y-2">
                            {comments.map((comment) => (
                                <div key={comment.id}>
                                    <CommentItem comment={comment} canDelete={currentUserId !== null && (comment.user_id === currentUserId || ownerId === currentUserId)} onDelete={() => setConfirmDeleteId(comment.id)} />
                                    {confirmDeleteId === comment.id && <div className="rounded-2xl bg-rose-50 p-3" role="group" aria-label="تأیید حذف دیدگاه">
                                        <p className="text-sm text-slate-800">این دیدگاه حذف بشه؟</p>
                                        <div className="mt-2 flex gap-2">
                                            <button type="button" disabled={deletingId !== null} onClick={() => void deleteComment(comment.id)} className="min-h-12 rounded-xl bg-rose-700 px-4 text-sm text-white">{deletingId === comment.id ? "در حال حذف…" : "حذف"}</button>
                                            <button type="button" disabled={deletingId !== null} onClick={() => setConfirmDeleteId(null)} className="min-h-12 rounded-xl bg-white px-4 text-sm text-slate-700">انصراف</button>
                                        </div>
                                    </div>}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="rounded-2xl bg-slate-50 px-4 py-4 text-center text-xs font-bold text-slate-400">
                            هنوز دیدگاهی ثبت نشده است.
                        </p>
                    )}
                    </div>
                </div>
            )}
        </div>
    );
}

function CommentItem({ comment, canDelete, onDelete }: { comment: EngagementComment; canDelete: boolean; onDelete: () => void }) {
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
                    <div className="flex shrink-0 items-center gap-1">
                        {canDelete && <button type="button" onClick={onDelete} aria-label="حذف دیدگاه" className="flex h-11 w-11 items-center justify-center rounded-xl text-rose-700 hover:bg-rose-100"><Trash2 size={16} /></button>}
                        <span className="text-[10px] font-semibold text-slate-400">
                            {new Date(comment.created_at).toLocaleDateString("fa-IR")}
                        </span>
                    </div>
                </div>
                <p className={cn("mt-1 whitespace-pre-wrap text-sm leading-7 text-slate-600", getTextAlign(comment.content))} {...getDirectionalTextProps(comment.content)}>{comment.content}</p>
            </div>
        </div>
    );
}
