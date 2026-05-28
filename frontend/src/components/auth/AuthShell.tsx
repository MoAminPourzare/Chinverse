import type { ReactNode } from "react";
import Surface from "@/components/ui/Surface";
import { AppHeader } from "@/components/ui/IconButton";

interface AuthShellProps {
    title: string;
    subtitle?: string;
    children: ReactNode;
    footer?: ReactNode;
    backHref?: string;
    icon?: ReactNode;
    iconClassName?: string;
}

export default function AuthShell({
    title,
    children,
    footer,
    backHref = "/",
    icon,
    iconClassName = "bg-[#eef6ff] text-[#155aa6]",
}: AuthShellProps) {
    return (
        <div className="min-h-full bg-[linear-gradient(180deg,#f8fbff_0%,#f4f7fb_100%)]" dir="rtl">
            <main className="mx-auto flex min-h-full w-full max-w-[430px] flex-col gap-5 px-4 py-5">
                <AppHeader
                    title={title}
                    backHref={backHref}
                    icon={icon}
                    iconClassName={iconClassName}
                />

                <div className="flex flex-1 flex-col gap-4 pt-2">
                    <Surface className="p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
                        {children}
                    </Surface>
                    {footer && (
                        <Surface className="px-5 py-4 sm:px-6">
                            {footer}
                        </Surface>
                    )}
                </div>
            </main>
        </div>
    );
}
