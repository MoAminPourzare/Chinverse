"use client";

import { useEffect, useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { engagementService, EngagementTargetType } from "@/services/engagement.service";

interface LikeButtonProps {
    targetType: EngagementTargetType;
    targetId: number;
    initialLiked?: boolean;
    initialCount?: number;
    compact?: boolean;
    className?: string;
}

export default function LikeButton({
    targetType,
    targetId,
    initialLiked = false,
    initialCount = 0,
    compact = false,
    className,
}: LikeButtonProps) {
    const [liked, setLiked] = useState(initialLiked);
    const [count, setCount] = useState(initialCount);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const loadState = async () => {
            try {
                const state = await engagementService.getState(targetType, targetId);
                if (!cancelled) {
                    setLiked(state.liked);
                    setCount(state.likes_count);
                }
            } catch {
                if (!cancelled) {
                    setLiked(initialLiked);
                    setCount(initialCount);
                }
            }
        };
        void loadState();
        return () => {
            cancelled = true;
        };
    }, [initialCount, initialLiked, targetId, targetType]);

    const toggleLike = async () => {
        if (loading) return;
        setLoading(true);
        const previousLiked = liked;
        const previousCount = count;
        setLiked(!previousLiked);
        setCount(Math.max(0, previousCount + (previousLiked ? -1 : 1)));
        try {
            const state = previousLiked
                ? await engagementService.unlike(targetType, targetId)
                : await engagementService.like(targetType, targetId);
            setLiked(state.liked);
            setCount(state.likes_count);
        } catch (error) {
            console.error("Failed to update like", error);
            setLiked(previousLiked);
            setCount(previousCount);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={toggleLike}
            disabled={loading}
            className={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-full border text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-70",
                compact ? "h-9 px-3" : "h-11 px-4",
                liked
                    ? "border-rose-100 bg-rose-50 text-rose-600 shadow-[0_10px_24px_rgba(244,63,94,0.12)]"
                    : "border-slate-200 bg-white text-slate-500 hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600",
                className,
            )}
            aria-pressed={liked}
            aria-label={liked ? "حذف لایک" : "لایک کردن"}
        >
            {loading ? (
                <Loader2 size={compact ? 15 : 17} className="animate-spin" />
            ) : (
                <Heart size={compact ? 15 : 17} className={liked ? "fill-current" : ""} />
            )}
            <span>{count.toLocaleString("fa-IR")}</span>
        </button>
    );
}
