import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type SurfaceProps = HTMLAttributes<HTMLDivElement> & {
    as?: "div" | "section" | "article" | "header" | "footer";
};

export default function Surface({
    as: Component = "div",
    className,
    children,
    ...props
}: SurfaceProps) {
    return (
        <Component
            className={cn(
                "rounded-[28px] border border-white/70 bg-white/85 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-[#2b3542] dark:bg-[#171d26]/90 dark:shadow-[0_18px_60px_rgba(0,0,0,0.28)]",
                className,
            )}
            {...props}
        >
            {children}
        </Component>
    );
}
