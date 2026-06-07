import { createElement, type ComponentType } from "react";
import {
    Facebook,
    Instagram,
    Linkedin,
    MessageCircle,
    Send,
    Twitter,
} from "lucide-react";

const WeChatIcon = ({ className = "" }: { className?: string }) =>
    createElement("img", {
        src: "/assets/chinverse/icons/Wechat.svg",
        alt: "",
        className,
    });

export type SocialPlatform = {
    id: string;
    name: string;
    icon: ComponentType<{ className?: string }>;
    placeholder: string;
    profileUrl: (handle: string) => string;
    handlePattern: RegExp;
    errorMessage: string;
};

export const socialPlatforms: SocialPlatform[] = [
    {
        id: "instagram",
        name: "Instagram",
        icon: Instagram,
        placeholder: "chinverse_app",
        profileUrl: (handle) => `https://instagram.com/${handle}`,
        handlePattern: /^[A-Za-z0-9._]{1,30}$/,
        errorMessage: "آیدی Instagram فقط می‌تواند شامل حرف، عدد، نقطه و زیرخط باشد.",
    },
    {
        id: "twitter",
        name: "X / Twitter",
        icon: Twitter,
        placeholder: "chinverse_app",
        profileUrl: (handle) => `https://x.com/${handle}`,
        handlePattern: /^[A-Za-z0-9_]{1,15}$/,
        errorMessage: "آیدی X/Twitter باید فقط شامل حرف، عدد یا زیرخط و حداکثر ۱۵ کاراکتر باشد.",
    },
    {
        id: "linkedin",
        name: "LinkedIn",
        icon: Linkedin,
        placeholder: "chinverse-academy",
        profileUrl: (handle) => handle.startsWith("in/") ? `https://linkedin.com/${handle}` : `https://linkedin.com/in/${handle}`,
        handlePattern: /^(in\/)?[A-Za-z0-9-]{3,100}$/,
        errorMessage: "آیدی LinkedIn باید فقط شامل حرف، عدد و خط تیره باشد.",
    },
    {
        id: "telegram",
        name: "Telegram",
        icon: Send,
        placeholder: "chinverse_app",
        profileUrl: (handle) => `https://t.me/${handle}`,
        handlePattern: /^[A-Za-z0-9_]{5,32}$/,
        errorMessage: "آیدی Telegram باید ۵ تا ۳۲ کاراکتر و شامل حرف، عدد یا زیرخط باشد.",
    },
    {
        id: "whatsapp",
        name: "WhatsApp",
        icon: MessageCircle,
        placeholder: "989123456789",
        profileUrl: (handle) => `https://wa.me/${handle}`,
        handlePattern: /^[1-9][0-9]{7,14}$/,
        errorMessage: "شماره WhatsApp را با کد کشور، فقط عدد و بدون + وارد کن.",
    },
    {
        id: "wechat",
        name: "WeChat",
        icon: WeChatIcon,
        placeholder: "chinverse_id",
        profileUrl: (handle) => `weixin://dl/chat?${encodeURIComponent(handle)}`,
        handlePattern: /^[A-Za-z][A-Za-z0-9_-]{5,19}$/,
        errorMessage: "WeChat ID باید با حرف شروع شود و ۶ تا ۲۰ کاراکتر شامل حرف، عدد، خط تیره یا زیرخط باشد.",
    },
    {
        id: "facebook",
        name: "Facebook",
        icon: Facebook,
        placeholder: "chinverse.app",
        profileUrl: (handle) => `https://facebook.com/${handle}`,
        handlePattern: /^[A-Za-z0-9.]{5,50}$/,
        errorMessage: "آیدی Facebook فقط می‌تواند شامل حرف، عدد و نقطه باشد.",
    },
];

const legacyPlatformAliases: Record<string, string> = {
    x: "twitter",
};

export const getSocialPlatform = (platformId: string) => {
    const normalizedId = legacyPlatformAliases[platformId] || platformId;
    return socialPlatforms.find((platform) => platform.id === normalizedId) || socialPlatforms[0];
};

export const normalizeSocialHandle = (platformId: string, rawHandle: string) => {
    const platform = getSocialPlatform(platformId);
    let handle = rawHandle.trim();

    handle = handle.replace(/^https?:\/\/(www\.)?/i, "");
    handle = handle.replace(/^@+/, "");
    handle = handle.replace(/\/+$/, "");

    if (platform.id === "instagram") {
        handle = handle.replace(/^instagram\.com\//i, "");
    }
    if (platform.id === "twitter") {
        handle = handle.replace(/^(x\.com|twitter\.com)\//i, "");
    }
    if (platform.id === "telegram") {
        handle = handle.replace(/^(t\.me|telegram\.me)\//i, "");
    }
    if (platform.id === "whatsapp") {
        handle = handle.replace(/^(wa\.me\/|api\.whatsapp\.com\/send\?phone=)/i, "");
        handle = handle.replace(/[^\d]/g, "");
    }
    if (platform.id === "wechat") {
        handle = handle.replace(/^(weixin:\/\/dl\/chat\?|wechat:)/i, "");
    }
    if (platform.id === "linkedin") {
        handle = handle.replace(/^(linkedin\.com\/)/i, "");
    }
    if (platform.id === "facebook") {
        handle = handle.replace(/^(facebook\.com|fb\.com)\//i, "");
    }

    return handle.split(/[/?#]/)[0];
};

export const validateSocialHandle = (platformId: string, handle: string) => {
    const platform = getSocialPlatform(platformId);
    return platform.handlePattern.test(handle);
};

export const getSocialProfileUrl = (platformId: string, handle: string) => {
    const platform = getSocialPlatform(platformId);
    return platform.profileUrl(normalizeSocialHandle(platformId, handle));
};

export const getSocialLinkTarget = (platformId: string) => {
    const platform = getSocialPlatform(platformId);
    return platform.id === "wechat" ? undefined : "_blank";
};

export const getSocialLinkRel = (platformId: string) => {
    const platform = getSocialPlatform(platformId);
    return platform.id === "wechat" ? undefined : "noopener noreferrer";
};
