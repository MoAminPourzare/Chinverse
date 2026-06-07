export type TextDirection = "rtl" | "ltr";

const rtlPattern = /[\u0590-\u08ff\ufb1d-\ufdff\ufe70-\ufefc]/;
const cjkPattern = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;
const latinPattern = /[A-Za-z]/;
const ltrPattern = /[A-Za-z\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;

export function getTextDirection(value?: string | null, fallback: TextDirection = "rtl"): TextDirection {
    const text = value?.trim();
    if (!text) return fallback;

    const rtlIndex = text.search(rtlPattern);
    const ltrIndex = text.search(ltrPattern);

    if (rtlIndex === -1 && ltrIndex === -1) return fallback;
    if (rtlIndex === -1) return "ltr";
    if (ltrIndex === -1) return "rtl";

    return rtlIndex < ltrIndex ? "rtl" : "ltr";
}

export function getTextAlign(value?: string | null, fallback: TextDirection = "rtl") {
    return getTextDirection(value, fallback) === "rtl" ? "text-right" : "text-left";
}

export function getTextLanguage(value?: string | null): "fa" | "zh-CN" | "en" | undefined {
    const text = value?.trim();
    if (!text) return undefined;
    if (getTextDirection(text) === "rtl") return "fa";
    if (cjkPattern.test(text)) return "zh-CN";
    if (latinPattern.test(text)) return "en";
    return undefined;
}

export function getDirectionalTextProps(value?: string | null, fallback: TextDirection = "rtl") {
    const lang = getTextLanguage(value);
    return {
        dir: getTextDirection(value, fallback),
        ...(lang ? { lang } : {}),
    };
}
