import { getMediaUrl } from "@/lib/media";

export type ArticleSpan = { text: string; bold: boolean };
export type ArticleBlock =
    | { type: "paragraph" | "quote"; spans: ArticleSpan[] }
    | { type: "heading"; text: string; level: 2 | 3 }
    | { type: "list"; items: string[]; ordered: boolean }
    | { type: "image"; src: string; alt: string; caption?: string | null };
export interface ArticleDocument {
    version: 1;
    category: string;
    subtitle?: string | null;
    blocks: ArticleBlock[];
}

export function articleMediaUrl(value: string) {
    return value.startsWith("/assets/chinverse/articles/") ? value : getMediaUrl(value);
}

export function readingMinutes(text: string) {
    return Math.max(1, Math.ceil(text.trim().split(/\s+/u).filter(Boolean).length / 180));
}

export function articleHref(article: { id: number; slug?: string | null }) {
    return `/articles/${encodeURIComponent(article.slug || String(article.id))}`;
}
