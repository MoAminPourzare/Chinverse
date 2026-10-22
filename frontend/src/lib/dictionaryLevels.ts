export const DICTIONARY_LEVELS = [
    ...Array.from({ length: 6 }, (_, index) => ({ value: `HSK${index + 1}`, label: `HSK ${index + 1}` })),
    { value: "HSK7-9", label: "HSK 7–9" },
    { value: "NON-HSK", label: "خارج از HSK" },
];

export function dictionaryLevelLabel(word: { level?: string | null; hsk_level?: number | null }): string {
    const level = word.level?.trim() || "";
    if (/^HSK\s*7\s*[-–]\s*9$/i.test(level)) return "HSK 7–9";
    if (level === "NON-HSK") return "خارج از HSK";
    if (word.hsk_level) return `HSK ${word.hsk_level}`;
    return level;
}
