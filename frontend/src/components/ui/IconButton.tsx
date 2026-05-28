import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";

const baseIconButtonClass =
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#d5e1ef] bg-white/90 text-slate-600 shadow-sm transition hover:bg-[#eef6ff] hover:text-[#155aa6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155aa6]/30";

interface BackButtonProps {
    href?: string;
    onClick?: () => void;
    label?: string;
    className?: string;
    iconSize?: number;
}

export function BackButton({
    href,
    onClick,
    label = "بازگشت",
    className,
    iconSize = 21,
}: BackButtonProps) {
    const classes = cn(baseIconButtonClass, className);

    if (href) {
        return (
            <Link href={href} className={classes} aria-label={label}>
                <ArrowRight size={iconSize} />
            </Link>
        );
    }

    return (
        <button type="button" onClick={onClick} className={classes} aria-label={label}>
            <ArrowRight size={iconSize} />
        </button>
    );
}

interface IconButtonProps {
    children: ReactNode;
    onClick?: () => void;
    href?: string;
    label: string;
    className?: string;
    type?: "button" | "submit" | "reset";
}

export function IconButton({
    children,
    onClick,
    href,
    label,
    className,
    type = "button",
}: IconButtonProps) {
    const classes = cn(baseIconButtonClass, className);

    if (href) {
        return (
            <Link href={href} className={classes} aria-label={label}>
                {children}
            </Link>
        );
    }

    return (
        <button type={type} onClick={onClick} className={classes} aria-label={label}>
            {children}
        </button>
    );
}

interface HeaderIconProps {
    children: ReactNode;
    className?: string;
}

export function HeaderIcon({ children, className }: HeaderIconProps) {
    return (
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl", className)}>
            {children}
        </div>
    );
}

export const headerContainerClass =
    "sticky top-3 z-40 mb-5 flex items-center justify-between rounded-[28px] border border-white/70 bg-white/90 px-4 py-3 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl";

interface AppHeaderProps {
    title: ReactNode;
    backHref?: string;
    onBack?: () => void;
    icon?: ReactNode;
    className?: string;
    titleClassName?: string;
    iconClassName?: string;
}

export function AppHeader({
    title,
    backHref,
    onBack,
    icon,
    className,
    titleClassName,
    iconClassName,
}: AppHeaderProps) {
    return (
        <header
            className={cn(
                "sticky top-3 z-40 mb-5 min-h-[66px] rounded-[28px] border border-white/70 bg-white/90 px-4 py-3 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl",
                className,
            )}
        >
            <div className="relative flex min-h-10 items-center justify-center">
                {(backHref || onBack) && (
                    <BackButton
                        href={backHref}
                        onClick={onBack}
                        className="absolute right-0 top-1/2 -translate-y-1/2"
                    />
                )}
                <div className={cn("min-w-0 px-14 text-center", titleClassName)}>
                    {typeof title === "string" ? (
                        <h1 className="truncate text-base font-black text-slate-950">{title}</h1>
                    ) : (
                        title
                    )}
                </div>
                <HeaderIcon className={cn("absolute left-0 top-1/2 -translate-y-1/2", iconClassName)}>
                    {icon}
                </HeaderIcon>
            </div>
        </header>
    );
}
