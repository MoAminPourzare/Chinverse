import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "light";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    leadingIcon?: ReactNode;
    href?: string;
}

const variantClasses: Record<Variant, string> = {
    primary: "bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-[0_16px_30px_rgba(244,63,94,0.24)] hover:from-rose-600 hover:to-orange-600",
    secondary: "bg-slate-900 text-white shadow-[0_16px_30px_rgba(15,23,42,0.18)] hover:bg-slate-800",
    ghost: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    light: "bg-white text-slate-900 shadow-[0_16px_30px_rgba(15,23,42,0.08)] hover:bg-slate-100 border border-white/20",
};

export default function PrimaryButton({
    variant = "primary",
    leadingIcon,
    className,
    children,
    href,
    ...props
}: PrimaryButtonProps) {
    const classes = cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2",
        variantClasses[variant],
        className,
    );

    if (href) {
        return (
            <Link href={href} className={classes}>
                {leadingIcon}
                {children}
            </Link>
        );
    }

    return (
        <button
            className={classes}
            {...props}
        >
            {leadingIcon}
            {children}
        </button>
    );
}
