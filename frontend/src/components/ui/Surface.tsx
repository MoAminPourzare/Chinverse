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
                "rounded-[28px] border border-white/70 bg-white/85 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl",
                className,
            )}
            {...props}
        >
            {children}
        </Component>
    );
}
