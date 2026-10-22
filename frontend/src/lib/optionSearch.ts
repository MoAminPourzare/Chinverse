function normalizeSearchText(value: string) {
    return value.normalize("NFKC").toLocaleLowerCase("fa")
        .replace(/[يى]/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/[\u064b-\u065f\u0670]/g, "")
        .replace(/[\u200c\u200d]/g, " ")
        .trim();
}

export function filterOptionsByQuery(options: readonly string[], query: string): string[] {
    const tokens = normalizeSearchText(query).split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return [...options];
    return options.filter((option) => {
        const normalized = normalizeSearchText(option).replace(/\s+/g, "");
        return tokens.every((token) => normalized.includes(token));
    });
}
