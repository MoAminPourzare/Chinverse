"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";
import { useReturnTo } from "@/hooks/useReturnTo";

const baseIconButtonClass =
    "flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl border border-[#d5e1ef] bg-white/90 text-slate-600 shadow-sm transition hover:bg-[#eef6ff] hover:text-[#155aa6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155aa6]/30 dark:border-[#344050] dark:bg-[#1b232e]/90 dark:text-[#aeb9c7] dark:hover:bg-[#243142] dark:hover:text-[#72b6ff]";

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
    const classes = cn(baseIconButtonClass, "app-back-button", className);
    const returnHref = useReturnTo(href || "");

    if (href) {
        return (
            <Link href={returnHref} className={classes} aria-label={label} data-back-button>
                <ArrowLeft size={iconSize} />
            </Link>
        );
    }

    return (
        <button type="button" onClick={onClick} className={classes} aria-label={label} data-back-button>
            <ArrowLeft size={iconSize} />
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
        <div className={cn("flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl", className)}>
            {children}
        </div>
    );
}

export const headerContainerClass =
    "page-toolbar sticky top-4 z-40 mx-auto mb-5 w-full max-w-[430px] rounded-[22px] px-3 py-3";

interface AppHeaderProps {
    title: ReactNode;
    backHref?: string;
    backLabel?: string;
    onBack?: () => void;
    icon?: ReactNode;
    className?: string;
    titleClassName?: string;
    iconClassName?: string;
    backControl?: ReactNode;
    actions?: ReactNode;
    sticky?: boolean;
}

export function AppHeader({
    title,
    backHref,
    backLabel,
    onBack,
    icon,
    className,
    titleClassName,
    iconClassName,
    backControl,
    actions,
    sticky = true,
}: AppHeaderProps) {
    return (
        <header data-page-header data-header-variant="card" data-header-sticky={sticky ? undefined : "false"}
            className={cn(
                headerContainerClass,
                className,
            )}
        >
            <div className={cn("grid min-h-[46px] items-start gap-2", actions ? "grid-cols-[96px_minmax(0,1fr)_96px]" : "grid-cols-[46px_minmax(0,1fr)_46px]")} dir="rtl">
                <div className="flex min-h-[46px] items-start justify-start">
                {backControl ?? ((backHref || onBack) && (
                    <BackButton
                        href={backHref}
                        label={backLabel}
                        onClick={onBack}
                        className="page-toolbar-back"
                    />
                ))}
                </div>
                <div data-header-title className={cn("min-w-0 self-center text-center", titleClassName)}>
                    {typeof title === "string" ? (
                        <h1 className="text-[15px] font-black leading-7 text-[#20294e] dark:text-slate-100">{title}</h1>
                    ) : (
                        title
                    )}
                </div>
                {actions ? <div className="flex min-h-[46px] items-center justify-end gap-1">{actions}</div> : <HeaderIcon className={cn("page-toolbar-icon", iconClassName)}>
                    {icon}
                </HeaderIcon>}
            </div>
        </header>
    );
}
