"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Check, Volume2, X } from "lucide-react";
import api from "@/lib/api";
import { getMediaUrl } from "@/lib/media";

interface VocabularyDefinition {
    id: number;
    lang_code: string;
    definition_text: string;
    part_of_speech: string;
    sense_order?: number;
    notes?: string | null;
}

interface VocabularyExample {
    id: number;
    zh_text: string;
    pinyin: string;
    target_text: string;
    sense_order?: number;
}

interface VocabularyCollocation {
    id: number;
    phrase_zh: string;
    phrase_pinyin: string;
    translation_target: string;
    sense_order?: number;
}

interface VocabularyWord {
    id: number;
    chinese: string;
    pinyin: string;
    audio_url?: string | null;
    level?: string;
    hsk_level?: number | null;
    source?: string;
    source_word_id?: string | null;
    persian_meaning?: string | null;
    chinese_meaning?: string | null;
    composition?: string | null;
    notes?: string | null;
    definitions?: VocabularyDefinition[];
    examples?: VocabularyExample[];
    collocations?: VocabularyCollocation[];
}

interface VocabularyModalProps {
    word: VocabularyWord;
    isOpen: boolean;
    onClose: () => void;
}

type TabType = "persian" | "chinese" | "composition" | "examples";

const tabs: { key: TabType; label: string }[] = [
    { key: "persian", label: "معنی فارسی" },
    { key: "chinese", label: "معنی چینی" },
    { key: "composition", label: "ترکیب واژگانی" },
    { key: "examples", label: "مثال‌ها" },
];

const sortBySense = <T extends { sense_order?: number }>(items: T[]) =>
    [...items].sort((a, b) => ((a.sense_order || 1) - (b.sense_order || 1)) || (("id" in a ? Number(a.id) : 0) - ("id" in b ? Number(b.id) : 0)));

const groupBySense = <T extends { sense_order?: number }>(items: T[]) => {
    const groups = new Map<number, T[]>();
    for (const item of sortBySense(items)) {
        const senseOrder = item.sense_order || 1;
        groups.set(senseOrder, [...(groups.get(senseOrder) || []), item]);
    }
    return Array.from(groups.entries()).map(([senseOrder, senseItems]) => ({
        senseOrder,
        items: senseItems,
    }));
};

const splitLines = (value?: string | null) =>
    (value || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

export default function VocabularyModal({ word, isOpen, onClose }: VocabularyModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>("persian");
    const [isInLeitner, setIsInLeitner] = useState(false);
    const [isCheckingLeitner, setIsCheckingLeitner] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [leitnerError, setLeitnerError] = useState<string | null>(null);

    const persianDefinitions = useMemo(
        () => sortBySense((word.definitions || []).filter((item) => item.lang_code === "fa")),
        [word.definitions],
    );
    const chineseDefinitions = useMemo(
        () => sortBySense((word.definitions || []).filter((item) => item.lang_code === "zh")),
        [word.definitions],
    );
    const examples = useMemo(() => sortBySense(word.examples || []), [word.examples]);
    const collocations = useMemo(() => sortBySense(word.collocations || []), [word.collocations]);
    const examplesBySense = useMemo(() => groupBySense(examples), [examples]);
    const collocationsBySense = useMemo(() => groupBySense(collocations), [collocations]);
    const persianDefinitionBySense = useMemo(() => {
        const definitions = new Map<number, VocabularyDefinition>();
        persianDefinitions.forEach((definition) => {
            const senseOrder = definition.sense_order || 1;
            if (!definitions.has(senseOrder)) definitions.set(senseOrder, definition);
        });
        return definitions;
    }, [persianDefinitions]);

    useEffect(() => {
        if (!isOpen || word.id === undefined || word.id === null) return;

        let cancelled = false;
        setActiveTab("persian");
        setIsInLeitner(false);
        setIsAdding(false);
        setLeitnerError(null);
        setIsCheckingLeitner(true);

        const checkLeitner = async () => {
            try {
                const response = await api.get(`/leitner/check/${word.id}`);
                if (!cancelled) {
                    setIsInLeitner(Boolean(response.data.in_leitner));
                }
            } catch (error) {
                console.error("Failed to check leitner status:", error);
                if (!cancelled) {
                    setLeitnerError("وضعیت لایتنر بررسی نشد. دوباره تلاش کن.");
                }
            } finally {
                if (!cancelled) {
                    setIsCheckingLeitner(false);
                }
            }
        };

        void checkLeitner();

        return () => {
            cancelled = true;
        };
    }, [isOpen, word.id]);

    useEffect(() => {
        if (!isOpen) return;

        const previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = previousBodyOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const playAudio = () => {
        if (!word.audio_url) return;
        void new Audio(getMediaUrl(word.audio_url)).play().catch((error) => {
            console.error("Failed to play vocabulary audio:", error);
        });
    };

    const handleAddToLeitner = async () => {
        if (word.id === undefined || word.id === null || isInLeitner || isAdding || isCheckingLeitner) return;
        setLeitnerError(null);
        setIsAdding(true);
        try {
            await api.post("/leitner/add", { word_id: word.id });
            setIsInLeitner(true);
        } catch (error) {
            console.error("Failed to add to leitner:", error);
            setLeitnerError("افزودن واژه انجام نشد. اتصال را بررسی و دوباره تلاش کن.");
        } finally {
            setIsAdding(false);
        }
    };

    const highlightWord = (text: string, targetWord: string) => {
        const parts = text.split(targetWord);
        if (parts.length === 1) return text;
        return parts.map((part, i) => (
            <React.Fragment key={`${part}-${i}`}>
                {part}
                {i < parts.length - 1 && (
                    <span className="font-cjk font-bold text-[#155aa6]" lang="zh-CN">
                        {targetWord}
                    </span>
                )}
            </React.Fragment>
        ));
    };

    const renderEmpty = (message: string) => (
        <p className="rounded-2xl bg-slate-50 px-4 py-5 text-center text-sm text-slate-400">{message}</p>
    );

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-hidden overscroll-none px-4 py-5">
            <div className="modal-backdrop-motion absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="vocabulary-word-title"
                className="modal-panel-motion relative flex h-[min(720px,calc(100dvh-40px))] w-full max-w-[390px] flex-col overflow-hidden rounded-[30px] border border-white/70 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]"
            >
                <div className="shrink-0 border-b border-slate-100 px-5 pb-4 pt-5 text-center">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 rounded-2xl p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="بستن اطلاعات واژه"
                    >
                        <X size={24} />
                    </button>

                    <div className="mb-2 flex items-center justify-center gap-3">
                        <h2 id="vocabulary-word-title" className="font-cjk text-[2.35rem] font-bold leading-tight text-[#155aa6]" dir="ltr" lang="zh-CN">
                            {word.chinese}
                        </h2>
                        <button
                            onClick={playAudio}
                            disabled={!word.audio_url}
                            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef6ff] text-[#155aa6] transition-colors hover:bg-[#dbeafe] disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="پخش تلفظ"
                        >
                            <Volume2 size={20} />
                        </button>
                    </div>

                    <p className="font-latin text-base text-gray-600 sm:text-lg" dir="ltr" lang="en">
                        {word.pinyin}
                    </p>
                    {(word.hsk_level || word.level) && (
                        <span className="mt-3 inline-flex rounded-full bg-[#eef6ff] px-3 py-1 text-xs font-bold text-[#155aa6]">
                            {word.hsk_level ? `HSK ${word.hsk_level}` : word.level}
                        </span>
                    )}
                </div>

                <div className="no-scrollbar flex shrink-0 overflow-x-auto border-b border-slate-200 px-3" dir="rtl">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`shrink-0 px-2.5 py-3 text-xs font-bold transition-colors ${
                                activeTab === tab.key
                                    ? "border-b-2 border-[#155aa6] text-[#155aa6]"
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div key={activeTab} className="tab-content-motion min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4" dir="rtl">
                    {activeTab === "persian" && (
                        <div className="space-y-3">
                            {persianDefinitions.length > 0
                                ? persianDefinitions.map((item) => (
                                      <div key={item.id} className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
                                          <div className="mb-1 flex items-center justify-between gap-3 text-[11px] text-slate-400">
                                              <span>{item.part_of_speech}</span>
                                              <span>معنی {item.sense_order || 1}</span>
                                          </div>
                                          <p className="text-sm leading-7 text-slate-800" dir="rtl" lang="fa">
                                              {item.sense_order || 1}. {item.definition_text}
                                          </p>
                                          {item.notes && <p className="mt-2 text-xs leading-6 text-slate-500">{item.notes}</p>}
                                      </div>
                                  ))
                                : splitLines(word.persian_meaning).map((line, i) => (
                                      <p key={line} className="text-sm leading-7 text-slate-800" dir="rtl" lang="fa">
                                          {i + 1}. {line}
                                      </p>
                                  ))}
                            {persianDefinitions.length === 0 && splitLines(word.persian_meaning).length === 0 && renderEmpty("معنی فارسی موجود نیست")}
                        </div>
                    )}

                    {activeTab === "chinese" && (
                        <div className="space-y-3">
                            {chineseDefinitions.length > 0
                                ? chineseDefinitions.map((item) => (
                                      <div key={item.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                                          <div className="mb-1 flex items-center justify-between gap-3 text-[11px] text-slate-400">
                                              <span>{item.part_of_speech}</span>
                                              <span>Sense {item.sense_order || 1}</span>
                                          </div>
                                          <p className="font-cjk text-sm leading-7 text-slate-800" dir="ltr" lang="zh-CN">
                                              {item.sense_order || 1}. {item.definition_text}
                                          </p>
                                      </div>
                                  ))
                                : splitLines(word.chinese_meaning).map((line, i) => (
                                      <p key={line} className="font-cjk text-sm leading-7 text-slate-800" dir="ltr" lang="zh-CN">
                                          {i + 1}. {line}
                                      </p>
                                  ))}
                            {chineseDefinitions.length === 0 && splitLines(word.chinese_meaning).length === 0 && renderEmpty("معنی چینی موجود نیست")}
                        </div>
                    )}

                    {activeTab === "composition" && (
                        <div className="space-y-3">
                            {collocationsBySense.length > 0
                                ? collocationsBySense.map((group) => {
                                      const definition = persianDefinitionBySense.get(group.senseOrder);
                                      return (
                                          <section key={group.senseOrder} className="rounded-3xl bg-slate-50 px-4 py-3.5">
                                              <div className="mb-3 border-b border-slate-200/80 pb-2 text-right">
                                                  <span className="inline-flex rounded-full bg-[#eef6ff] px-3 py-1 text-[11px] font-black text-[#155aa6]">
                                                      معنی {group.senseOrder}
                                                  </span>
                                                  {definition && (
                                                      <p className="mt-2 text-xs font-bold leading-6 text-slate-500" dir="rtl" lang="fa">
                                                          {definition.definition_text}
                                                      </p>
                                                  )}
                                              </div>
                                              <ol className="space-y-2" dir="ltr">
                                                  {group.items.map((item, index) => (
                                                      <li key={item.id} className="rounded-2xl bg-white px-3 py-2.5">
                                                          <div className="flex items-start gap-2">
                                                              <span className="mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#eef6ff] px-1.5 text-xs font-black text-[#155aa6]">
                                                                  {index + 1}
                                                              </span>
                                                              <div className="min-w-0 flex-1">
                                                                  <p className="font-cjk text-base font-bold text-slate-800" lang="zh-CN">
                                                                      {highlightWord(item.phrase_zh, word.chinese)}
                                                                  </p>
                                                                  {item.phrase_pinyin && (
                                                                      <p className="mt-1 font-latin text-xs text-slate-500" dir="ltr" lang="en">
                                                                          {item.phrase_pinyin}
                                                                      </p>
                                                                  )}
                                                                  {item.translation_target && (
                                                                      <p className="mt-2 text-sm text-slate-700" dir="rtl" lang="fa">
                                                                          {item.translation_target}
                                                                      </p>
                                                                  )}
                                                              </div>
                                                          </div>
                                                      </li>
                                                  ))}
                                              </ol>
                                          </section>
                                      );
                                  })
                                : splitLines(word.composition).map((line, i) => (
                                      <p key={line} className="font-cjk text-sm leading-7 text-slate-800" dir="ltr" lang="zh-CN">
                                          {i + 1}. {highlightWord(line, word.chinese)}
                                      </p>
                                  ))}
                            {collocations.length === 0 && splitLines(word.composition).length === 0 && renderEmpty("ترکیب واژگانی موجود نیست")}
                        </div>
                    )}

                    {activeTab === "examples" && (
                        <div className="space-y-4">
                            {examplesBySense.map((group) => {
                                const definition = persianDefinitionBySense.get(group.senseOrder);
                                return (
                                    <section key={group.senseOrder} className="rounded-3xl bg-slate-50 px-4 py-3.5">
                                        <div className="mb-3 border-b border-slate-200/80 pb-2 text-right">
                                            <span className="inline-flex rounded-full bg-[#eef6ff] px-3 py-1 text-[11px] font-black text-[#155aa6]">
                                                معنی {group.senseOrder}
                                            </span>
                                            {definition && (
                                                <p className="mt-2 text-xs font-bold leading-6 text-slate-500" dir="rtl" lang="fa">
                                                    {definition.definition_text}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            {group.items.map((example, index) => (
                                                <div key={example.id} className="rounded-2xl bg-white px-3 py-2.5">
                                                    <p className="font-cjk text-sm leading-7 text-slate-800" dir="ltr" lang="zh-CN">
                                                        {index + 1}. {highlightWord(example.zh_text, word.chinese)}
                                                    </p>
                                                    {example.pinyin && (
                                                        <p className="mt-1 font-latin text-xs leading-6 text-slate-500" dir="ltr" lang="en">
                                                            {example.pinyin}
                                                        </p>
                                                    )}
                                                    {example.target_text && (
                                                        <p className="mt-2 text-sm leading-7 text-slate-700" dir="rtl" lang="fa">
                                                            {example.target_text}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                );
                            })}
                            {examples.length === 0 && renderEmpty("مثالی موجود نیست")}
                        </div>
                    )}
                </div>

                <div className="shrink-0 border-t border-slate-100 bg-white p-4">
                    {leitnerError && (
                        <p className="mb-3 rounded-2xl bg-red-50 px-3 py-2 text-center text-xs font-bold leading-5 text-red-600" role="alert">
                            {leitnerError}
                        </p>
                    )}
                    <button
                        onClick={handleAddToLeitner}
                        disabled={isInLeitner || isAdding || isCheckingLeitner}
                        className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-bold transition-all ${
                            isInLeitner
                                ? "cursor-default bg-green-500 text-white"
                                : isAdding || isCheckingLeitner
                                  ? "cursor-wait bg-gray-400 text-white"
                                  : "bg-[#155aa6] text-white hover:bg-[#0f4e92] active:scale-[0.98]"
                        }`}
                    >
                        {isInLeitner ? (
                            <>
                                <Check size={20} />
                                اضافه شد
                            </>
                        ) : isAdding ? (
                            "در حال افزودن..."
                        ) : isCheckingLeitner ? (
                            "در حال بررسی..."
                        ) : (
                            "اضافه کردن به لایتنر"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
