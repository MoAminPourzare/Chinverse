"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

/** Anchored to the app frame so scrolling the forum never moves the shortcut. */
export default function ForumSupportShortcut() {
    const pathname = usePathname();
    const search = useSearchParams();
    const inForum = pathname === "/community" || (pathname === "/" && search.get("tab") !== "daily");
    if (!inForum) return null;

    return <Link href="/support" aria-label="پشتیبانی" className="app-support-button forum-support-shortcut">
        <Image src="/assets/chinverse/icons/support_agent_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg" alt="" width={29} height={29} className="size-[29px] brightness-0 invert" unoptimized />
    </Link>;
}
