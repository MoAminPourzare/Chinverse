import type { CSSProperties, ReactNode } from "react";

interface Collocation {
    id: number;
    phrase_zh: string;
    phrase_pinyin?: string;
    translation_target?: string;
    sense_order?: number;
}

interface Definition {
    definition_text: string;
    sense_order?: number;
}

interface VocabularyCollocationsProps {
    items: Collocation[];
    definitions: Definition[];
    composition?: string | null;
    keyword: string;
    highlight: (text: string, keyword: string) => ReactNode;
    chineseStyle?: CSSProperties;
    persianStyle?: CSSProperties;
}

/** The same sense groups and phrase numbering in the dictionary and review cards. */
export default function VocabularyCollocations({ items, definitions, composition, keyword, highlight, chineseStyle, persianStyle }: VocabularyCollocationsProps) {
    const groups = new Map<number, Collocation[]>();
    for (const item of [...items].sort((a, b) => (a.sense_order || 1) - (b.sense_order || 1) || a.id - b.id)) {
        const sense = item.sense_order || 1;
        groups.set(sense, [...(groups.get(sense) || []), item]);
    }
    const lines = (composition || "").split("\n").map((line) => line.trim()).filter(Boolean);

    return (
        <div className="space-y-3">
            {Array.from(groups, ([sense, phrases]) => {
                const definition = definitions.find((item) => (item.sense_order || 1) === sense);
                return (
                    <section key={sense} aria-label={`ترکیب‌های معنی ${sense}`} className="rounded-3xl bg-slate-50 px-4 py-3.5">
                        <div className="mb-3 border-b border-slate-200/80 pb-2 text-right" dir="rtl">
                            <span className="inline-flex rounded-full bg-[#eef6ff] px-3 py-1 text-[11px] font-black text-[#155aa6]">معنی {sense}</span>
                            {definition && <p className="mt-2 text-xs font-bold leading-6 text-slate-500" dir="rtl" lang="fa" style={persianStyle}>{definition.definition_text}</p>}
                        </div>
                        <ol className="space-y-2" dir="ltr">
                            {phrases.map((item, index) => (
                                <li key={item.id} className="rounded-2xl bg-white px-3 py-2.5">
                                    <div className="flex items-start gap-2">
                                        <span className="mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#eef6ff] px-1.5 text-xs font-black text-[#155aa6]">{index + 1}</span>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-cjk text-base font-bold text-slate-800" dir="ltr" lang="zh-CN" style={{ ...chineseStyle, textAlign: "left" }}>{highlight(item.phrase_zh, keyword)}</p>
                                            {item.phrase_pinyin && <p className="mt-1 font-latin text-xs text-slate-500" dir="ltr" lang="en" style={{ textAlign: "left" }}>{item.phrase_pinyin}</p>}
                                            {item.translation_target && <p className="mt-2 text-sm text-slate-700" dir="rtl" lang="fa" style={{ ...persianStyle, textAlign: "right" }}>{item.translation_target}</p>}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </section>
                );
            })}
            {!items.length && lines.map((line, index) => <p key={`${index}-${line}`} className="font-cjk text-sm leading-7 text-slate-800" dir="ltr" lang="zh-CN" style={{ ...chineseStyle, textAlign: "left" }}>{index + 1}. {highlight(line, keyword)}</p>)}
            {!items.length && !lines.length && <p className="rounded-[14px] bg-slate-50 px-4 py-6 text-center text-sm font-bold text-slate-400">ترکیب واژگانی موجود نیست</p>}
        </div>
    );
}
