"use client";

import { useCallback, useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { Check, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { cn } from "@/lib/cn";
import { LEITNER_STAGES } from "@/lib/leitnerStages";
import { useVocabularyPronunciation } from "@/hooks/useVocabularyPronunciation";
import styles from "./review.module.css";
import { BackButton } from "@/components/ui/IconButton";
import {
    getChineseTextStyle,
    getHighlightStyle,
    getPersianTextStyle,
    useLearningPreferences,
} from "@/lib/learningPreferences";

interface Example {
    id?: number;
    type?: "video" | "text";
    url?: string;
    poster?: string;
    zh_text?: string;
    sentence_ch?: string;
    sentence_fa?: string;
    target_text?: string;
    pinyin?: string;
    sense_order?: number;
}

interface Definition {
    id: number;
    lang_code: string;
    definition_text: string;
    part_of_speech: string;
    sense_order?: number;
    notes?: string | null;
}

interface Collocation {
    id: number;
    phrase_zh: string;
    phrase_pinyin?: string;
    translation_target?: string;
    sense_order?: number;
}

interface Word {
    id: number;
    chinese: string;
    pinyin: string;
    audio_url?: string;
    audio_pinyin?: string;
    persian_meaning?: string;
    chinese_meaning?: string;
    composition?: string;
    definitions?: Definition[];
    examples?: Example[];
    collocations?: Collocation[];
}

interface Flashcard {
    id: number;
    box_number: number;
    next_review_at: string;
    word: Word;
}

const BOX_STYLES: Record<number, { label: string; border: string; text: string; soft: string }> = {
    1: { label: "جعبه ۱", border: "border-red-500", text: "text-red-600", soft: "bg-red-50 text-red-600" },
    2: { label: "جعبه ۲", border: "border-amber-500", text: "text-amber-700", soft: "bg-amber-50 text-amber-700" },
    3: { label: "جعبه ۳", border: "border-emerald-500", text: "text-emerald-700", soft: "bg-emerald-50 text-emerald-700" },
    4: { label: "جعبه ۴", border: "border-sky-500", text: "text-sky-700", soft: "bg-sky-50 text-sky-700" },
    5: { label: "جعبه ۵", border: "border-[#155aa6]", text: "text-[#155aa6]", soft: "bg-[#eef6ff] text-[#155aa6]" },
};

const BOX_INTERVALS: Record<number, number> = {
    1: 1,
    2: 3,
    3: 7,
    4: 15,
    5: 30,
};

type BackTabType = "examples" | "composition" | "persian" | "chinese";

const backTabs: { key: BackTabType; label: string }[] = [
    { key: "chinese", label: "معنی چینی" },
    { key: "persian", label: "معنی فارسی" },
    { key: "composition", label: "ترکیب واژگانی" },
    { key: "examples", label: "مثال‌ها" },
];

export default function LeitnerReviewPage() {
    const router = useRouter();
    const { preferences } = useLearningPreferences();
    const [cards, setCards] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sessionComplete, setSessionComplete] = useState(false);
    const [activeBackTab, setActiveBackTab] = useState<BackTabType>("chinese");
    const currentCard = cards[currentIndex];
    const pronunciation = useVocabularyPronunciation(currentCard?.word || { id: 0, chinese: "" }, Boolean(currentCard && !sessionComplete && !loading));

    const fetchReviewCards = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const response = await api.get("/leitner/review", { params: { limit: 1000 } });
            const nextCards = Array.isArray(response.data.cards) ? response.data.cards : [];
            setCards(nextCards);
            setCurrentIndex(0);
            setIsFlipped(false);
            setActiveBackTab("chinese");
            setSessionComplete(nextCards.length === 0);
        } catch (error) {
            console.error("Failed to fetch review cards:", error);
            setLoadError("کارت‌های مرور دریافت نشدند. اتصال را بررسی و دوباره تلاش کن.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchReviewCards();
    }, [fetchReviewCards]);

    const handleReview = async (remembered: boolean) => {
        if (isSubmitting) return;
        const currentCard = cards[currentIndex];
        if (!currentCard) return;
        setLoadError(null);
        setIsSubmitting(true);

        try {
            await api.post("/leitner/review", {
                card_id: currentCard.id,
                remembered,
            });

            if (currentIndex + 1 < cards.length) {
                setCurrentIndex(currentIndex + 1);
                setIsFlipped(false);
                setActiveBackTab("chinese");
            } else {
                setSessionComplete(true);
            }
        } catch (error) {
            console.error("Failed to submit review:", error);
            setLoadError("نتیجه مرور ذخیره نشد. دوباره تلاش کن.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const highlightKeyword = (text: string, keyword: string) => {
        if (!text || !keyword) return text;
        const parts = text.split(keyword);
        if (parts.length === 1) return text;
        return parts.map((part, i) => (
            <span key={`${part}-${i}`}>
                {part}
                {i < parts.length - 1 && (
                    <span
                        className="font-cjk px-1 font-bold"
                        style={getHighlightStyle(preferences.leitnerHighlightColor)}
                        lang="zh-CN"
                    >
                        {keyword}
                    </span>
                )}
            </span>
        ));
    };

    if (loading) {
        return (
            <div className="flex min-h-full items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-[#155aa6]" />
            </div>
        );
    }

    if (loadError && cards.length === 0) {
        return (
            <div className="flex min-h-full flex-col items-center justify-center bg-[#f7f8fa] p-6 text-center" dir="rtl">
                <p className="max-w-xs text-sm font-bold leading-7 text-red-600">{loadError}</p>
                <button
                    type="button"
                    onClick={() => void fetchReviewCards()}
                    className="mt-5 rounded-full bg-[#155aa6] px-7 py-3 text-sm font-black text-white"
                >
                    تلاش دوباره
                </button>
            </div>
        );
    }

    if (sessionComplete) {
        return (
            <div className="flex min-h-full flex-col items-center justify-center bg-[#f7f8fa] p-6 text-center" dir="rtl">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#eef6ff]">
                    <Image
                        src="/assets/chinverse/icons/Laitner.svg"
                        alt=""
                        width={54}
                        height={54}
                        className="h-14 w-14 object-contain"
                        unoptimized
                    />
                </div>
                <h2 className="mb-2 text-2xl font-black text-slate-950">آفرین! مرور امروز تمام شد</h2>
                <p className="mb-8 max-w-xs text-sm leading-7 text-slate-500">
                    برای امروز کارتی برای مرور نداری. وقتی زمان مرور بعدی برسد، کارت‌ها دوباره اینجا می‌آیند.
                </p>
                <button
                    onClick={() => router.push("/leitner")}
                    className="rounded-full bg-[#155aa6] px-8 py-3 text-base font-black text-white shadow-[0_10px_18px_rgba(21,90,166,0.28)] transition hover:bg-[#0f4e92]"
                >
                    بازگشت به لایتنر
                </button>
            </div>
        );
    }

    const currentBox = normalizeBoxNumber(currentCard.box_number);
    const boxStyle = BOX_STYLES[currentBox];
    const stage = LEITNER_STAGES[currentBox];
    const rememberedBox = Math.min(currentBox + 1, 5);
    const rememberedInterval = BOX_INTERVALS[rememberedBox] || 1;
    const chineseTextStyle = getChineseTextStyle(preferences);
    const persianTextStyle = getPersianTextStyle(preferences);

    const examples = sortBySense(currentCard.word.examples || []);
    const collocations = sortBySense(currentCard.word.collocations || []);
    const definitions = sortBySense(currentCard.word.definitions || []);
    const persianDefinitions = definitions.filter((item) => item.lang_code === "fa");
    const chineseDefinitions = definitions.filter((item) => item.lang_code === "zh");

    return (
        <div className="min-h-full bg-[#f7f8fa] px-4 pb-28 pt-4" dir="rtl">
            <main className="mx-auto flex w-full max-w-[430px] flex-col">
                <header className="grid grid-cols-[40px_1fr_72px] items-center gap-3" dir="ltr">
                    <BackButton onClick={() => router.push("/leitner")} className="justify-self-end" />
                    <h1 className="text-center text-lg font-black text-slate-950" dir="rtl">مرور لغات</h1>
                    <div className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-[#155aa6] shadow-sm">
                        {toPersianDigits(currentIndex + 1)} / {toPersianDigits(cards.length)}
                    </div>
                </header>

                <section aria-label="مرحلهٔ یادگیری" className="mt-4 flex items-center gap-3 px-1">
                    <Image src={stage.image} alt={stage.title} width={60} height={60} className="h-15 w-15 shrink-0 object-contain" unoptimized />
                    <div className="min-w-0">
                        <h2 className="text-sm font-black text-slate-800">{stage.title}</h2>
                        <p className="mt-1 text-[13px] leading-6 text-slate-600">{stage.message}</p>
                    </div>
                </section>

                <section aria-label={isFlipped ? "پشت کارت" : "روی کارت"} className={cn("mt-4 overflow-hidden rounded-[18px] border-2 bg-white shadow-[0_12px_26px_rgba(15,23,42,0.10)]", stage.border)}>
                    {!isFlipped ? (
                        <div className="flex min-h-[340px] flex-col items-center justify-center px-6 py-8 text-center">
                            <span className={cn("rounded-full px-3 py-1 text-[11px] font-black", boxStyle.soft)}>
                                {boxStyle.label}
                            </span>
                            <div className="mt-8 flex items-center justify-center gap-4">
                                <span className="font-cjk min-w-0 break-words text-[3rem] font-bold leading-tight text-slate-900" dir="ltr" lang="zh-CN">
                                    {currentCard.word.chinese}
                                </span>
                                <button
                                    onClick={() => pronunciation.playing ? pronunciation.stop() : void pronunciation.play()}
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef6ff] text-[#155aa6] transition hover:bg-[#dbeafe]"
                                    aria-label={pronunciation.playing ? "توقف تلفظ" : "پخش تلفظ"}
                                >
                                    <Image
                                        src="/assets/chinverse/icons/Speaker.svg"
                                        alt=""
                                        width={23}
                                        height={23}
                                        className="h-6 w-6 object-contain"
                                        unoptimized
                                    />
                                </button>
                            </div>
                            {pronunciation.error && <p role="alert" className="mt-3 text-xs leading-6 text-red-700">{pronunciation.error}</p>}
                            <button
                                onClick={() => setIsFlipped(true)}
                                className="mt-10 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#155aa6] text-sm font-black text-white shadow-[0_10px_18px_rgba(21,90,166,0.25)] transition active:scale-[0.98]"
                            >
                                دیدن پشت کارت
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            <div className="shrink-0 px-4 pb-2 pt-5 text-center">
                                <div className="flex items-center justify-center gap-3">
                                    <button
                                        onClick={() => pronunciation.playing ? pronunciation.stop() : void pronunciation.play()}
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef6ff] text-[#155aa6]"
                                        aria-label={pronunciation.playing ? "توقف تلفظ" : "پخش تلفظ"}
                                    >
                                        <Image
                                            src="/assets/chinverse/icons/Speaker.svg"
                                            alt=""
                                            width={18}
                                            height={18}
                                            className="h-5 w-5 object-contain"
                                            unoptimized
                                        />
                                    </button>
                                    <span className={cn("font-cjk min-w-0 break-words text-3xl font-black", boxStyle.text)} dir="ltr" lang="zh-CN">
                                        {currentCard.word.chinese}
                                    </span>
                                </div>
                                <p className="font-latin mt-2 break-words text-center! text-base font-bold text-slate-600" dir="ltr">
                                    {currentCard.word.pinyin}
                                </p>
                                {pronunciation.error && <p role="alert" className="mt-2 text-xs leading-6 text-red-700">{pronunciation.error}</p>}
                                {currentCard.word.audio_url && currentCard.word.audio_pinyin && /[/|,，;；]/.test(currentCard.word.pinyin) && (
                                    <p className="mt-2 text-xs text-slate-500" dir="rtl">تلفظ این صدا: <span className="font-latin" dir="ltr">{currentCard.word.audio_pinyin}</span></p>
                                )}
                            </div>

                            <div role="tablist" aria-label="اطلاعات لغت" className="grid grid-cols-4 gap-1 px-2 py-2" dir="rtl">
                                {backTabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        id={`leitner-tab-${tab.key}`}
                                        role="tab"
                                        aria-selected={activeBackTab === tab.key}
                                        aria-controls="leitner-card-details"
                                        tabIndex={activeBackTab === tab.key ? 0 : -1}
                                        onKeyDown={(event) => {
                                            const index = backTabs.indexOf(tab);
                                            let nextIndex: number;
                                            if (event.key === "ArrowLeft") nextIndex = (index + 1) % backTabs.length;
                                            else if (event.key === "ArrowRight") nextIndex = (index + backTabs.length - 1) % backTabs.length;
                                            else if (event.key === "Home") nextIndex = 0;
                                            else if (event.key === "End") nextIndex = backTabs.length - 1;
                                            else return;
                                            event.preventDefault();
                                            setActiveBackTab(backTabs[nextIndex].key);
                                            document.getElementById(`leitner-tab-${backTabs[nextIndex].key}`)?.focus();
                                        }}
                                        onClick={() => setActiveBackTab(tab.key)}
                                        className={cn(
                                            styles.tab, "min-w-0 rounded-xl px-1 py-2 transition",
                                            activeBackTab === tab.key
                                                ? "bg-[#155aa6] text-white"
                                                : "bg-slate-100 text-slate-600 hover:bg-[#eef6ff] hover:text-[#155aa6]",
                                        )}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div id="leitner-card-details" role="tabpanel" aria-labelledby={`leitner-tab-${activeBackTab}`} tabIndex={0} className="min-h-[160px] px-3 py-4" dir="rtl">
                                {activeBackTab === "examples" && (
                                    <div className="space-y-4">
                                        {examples.length === 0 ? (
                                            <EmptyText>مثالی موجود نیست</EmptyText>
                                        ) : (
                                            examples.map((example, i) => (
                                                <div key={example.id ?? i} className="rounded-[14px] bg-slate-50 p-3">
                                                    {example.type === "video" && example.url && (
                                                        <video
                                                            src={example.url}
                                                            poster={example.poster}
                                                            controls
                                                            className="mb-3 aspect-video w-full rounded-xl bg-black"
                                                        />
                                                    )}
                                                    <p className="font-cjk text-slate-900" style={chineseTextStyle} dir="ltr" lang="zh-CN">
                                                        {toPersianDigits(example.sense_order || i + 1)}. {highlightKeyword(example.sentence_ch || example.zh_text || "", currentCard.word.chinese)}
                                                    </p>
                                                    {example.pinyin && (
                                                        <p className="font-latin mt-1 text-xs font-semibold leading-6 text-slate-400" dir="ltr" lang="en">
                                                            {example.pinyin}
                                                        </p>
                                                    )}
                                                    {(example.sentence_fa || example.target_text) && (
                                                        <p className="mt-2 text-slate-500" style={persianTextStyle}>
                                                            {example.sentence_fa || example.target_text}
                                                        </p>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeBackTab === "composition" && (
                                    collocations.length > 0 ? (
                                        <CollocationList
                                            items={collocations}
                                            keyword={currentCard.word.chinese}
                                            style={chineseTextStyle}
                                            highlight={highlightKeyword}
                                        />
                                    ) : (
                                        <TextLines
                                            value={currentCard.word.composition}
                                            empty="ترکیب واژگانی موجود نیست"
                                            chinese
                                            keyword={currentCard.word.chinese}
                                            style={chineseTextStyle}
                                            highlight={highlightKeyword}
                                        />
                                    )
                                )}

                                {activeBackTab === "persian" && (
                                    persianDefinitions.length > 0 ? (
                                        <DefinitionList items={persianDefinitions} style={persianTextStyle} />
                                    ) : (
                                        <TextLines
                                            value={currentCard.word.persian_meaning}
                                            empty="معنی فارسی موجود نیست"
                                            style={persianTextStyle}
                                        />
                                    )
                                )}

                                {activeBackTab === "chinese" && (
                                    chineseDefinitions.length > 0 ? (
                                        <DefinitionList items={chineseDefinitions} style={chineseTextStyle} chinese />
                                    ) : (
                                        <TextLines
                                            value={currentCard.word.chinese_meaning}
                                            empty="معنی چینی موجود نیست"
                                            chinese
                                            style={chineseTextStyle}
                                        />
                                    )
                                )}
                            </div>

                            <div className="border-t border-slate-100 bg-white p-4">
                                {loadError && (
                                    <p className="mb-3 rounded-[12px] bg-red-50 px-3 py-2 text-center text-xs font-bold text-red-600" role="alert">
                                        {loadError}
                                    </p>
                                )}
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => handleReview(false)}
                                        disabled={isSubmitting}
                                        className={cn(styles.decision, "flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl bg-red-700 px-2 py-3 text-white transition active:scale-[0.98] disabled:opacity-50")}
                                    >
                                        <span className="flex items-center gap-1"><X size={16} aria-hidden="true" />یادم نیست</span>
                                        <span className={styles.schedule}>(جعبه ۱، مرور فردا)</span>
                                    </button>
                                    <button
                                        onClick={() => handleReview(true)}
                                        disabled={isSubmitting}
                                        className={cn(styles.decision, "flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl bg-emerald-700 px-2 py-3 text-white transition active:scale-[0.98] disabled:opacity-50")}
                                    >
                                        <span className="flex items-center gap-1"><Check size={16} aria-hidden="true" />یادم هست</span>
                                        <span className={styles.schedule}>({BOX_STYLES[rememberedBox].label}، مرور {toPersianDigits(rememberedInterval)} روز بعد)</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

            </main>
        </div>
    );
}

function TextLines({
    value,
    empty,
    chinese = false,
    keyword = "",
    style,
    highlight,
}: {
    value?: string;
    empty: string;
    chinese?: boolean;
    keyword?: string;
    style: CSSProperties;
    highlight?: (text: string, keyword: string) => ReactNode;
}) {
    if (!value) return <EmptyText>{empty}</EmptyText>;

    return (
        <div className="space-y-3">
            {value.split("\n").map((line, i) => (
                <p
                    key={`${line}-${i}`}
                    className={cn("rounded-[14px] bg-slate-50 p-3 text-slate-800", chinese && "font-cjk")}
                    style={style}
                    dir={chinese ? "ltr" : "rtl"}
                    lang={chinese ? "zh-CN" : "fa"}
                >
                    {toPersianDigits(i + 1)}. {highlight && keyword ? highlight(line, keyword) : line}
                </p>
            ))}
        </div>
    );
}

function DefinitionList({
    items,
    style,
    chinese = false,
}: {
    items: Definition[];
    style: CSSProperties;
    chinese?: boolean;
}) {
    return (
        <div className="space-y-3">
            {items.map((item) => (
                <div key={item.id} className="rounded-[14px] bg-slate-50 p-3">
                    <div className="mb-1 flex items-center justify-between gap-3 text-[11px] font-bold text-slate-400">
                        <span>{item.part_of_speech}</span>
                        <span>{toPersianDigits(item.sense_order || 1)}</span>
                    </div>
                    <p
                        className={cn("text-slate-800", chinese && "font-cjk")}
                        style={style}
                        dir={chinese ? "ltr" : "rtl"}
                        lang={chinese ? "zh-CN" : "fa"}
                    >
                        {item.definition_text}
                    </p>
                    {item.notes && (
                        <p className="mt-2 text-xs leading-6 text-slate-500" dir={chinese ? "ltr" : "rtl"}>
                            {item.notes}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}

function CollocationList({
    items,
    keyword,
    style,
    highlight,
}: {
    items: Collocation[];
    keyword: string;
    style: CSSProperties;
    highlight: (text: string, keyword: string) => ReactNode;
}) {
    return (
        <div className="space-y-3">
            {items.map((item) => (
                <div key={item.id} className="rounded-[14px] bg-slate-50 p-3">
                    <p className="font-cjk text-slate-800" style={style} dir="ltr" lang="zh-CN">
                        {toPersianDigits(item.sense_order || 1)}. {highlight(item.phrase_zh, keyword)}
                    </p>
                    {item.phrase_pinyin && (
                        <p className="font-latin mt-1 text-xs font-semibold leading-6 text-slate-400" dir="ltr" lang="en">
                            {item.phrase_pinyin}
                        </p>
                    )}
                    {item.translation_target && (
                        <p className="mt-2 text-sm leading-7 text-slate-500" dir="rtl" lang="fa">
                            {item.translation_target}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}

function EmptyText({ children }: { children: ReactNode }) {
    return (
        <p className="rounded-[14px] bg-slate-50 px-4 py-6 text-center text-sm font-bold text-slate-400">
            {children}
        </p>
    );
}

function normalizeBoxNumber(value: number) {
    return Math.max(1, Math.min(5, value || 1));
}

function sortBySense<T extends { sense_order?: number }>(items: T[]) {
    return [...items].sort((a, b) => (a.sense_order || 1) - (b.sense_order || 1));
}

function toPersianDigits(value: string | number) {
    const digits = "۰۱۲۳۴۵۶۷۸۹";
    return String(value).replace(/\d/g, (digit) => digits[Number(digit)]);
}
