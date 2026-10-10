"use client";

import { Dialog, DialogPanel, DialogTitle, Description } from "@headlessui/react";
import Link from "next/link";
import { useState } from "react";
import { vocabularyKnowledgeService, type VocabularyStates } from "@/services/vocabularyKnowledge.service";

export default function LessonCompletionActions({ words, loadingWords, wordsFailed, onRetryWords, onKnown, onNext, onLogin }: {
    words: string[];
    loadingWords: boolean;
    wordsFailed: boolean;
    onRetryWords: () => void;
    onKnown: (states: VocabularyStates) => void;
    onNext?: () => void;
    onLogin?: () => void;
}) {
    const [confirm, setConfirm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");
    const markKnown = async () => {
        if (saving) return;
        setSaving(true);
        setError("");
        try {
            onKnown(await vocabularyKnowledgeService.markKnown(words));
            setSaved(true);
            setConfirm(false);
        } catch {
            setError("ذخیرهٔ وضعیت واژه‌ها انجام نشد. دوباره تلاش کن.");
        } finally { setSaving(false); }
    };
    const button = "flex min-h-12 w-full items-center justify-center rounded-2xl border border-[#d5e1ef] bg-white px-4 py-3 text-sm font-bold text-[#155aa6] disabled:opacity-50";
    return <section className="space-y-2 rounded-[24px] border border-[#dfe6f0] bg-[#eef6ff] p-4" aria-label="پایان درس">
        <h2 className="mb-3 text-center font-bold text-slate-900">درس تموم شد!</h2>
        <button type="button" className={button} disabled={loadingWords || wordsFailed || words.length === 0 || saved} onClick={() => onLogin ? onLogin() : setConfirm(true)}>بقیه لغت‌ها رو بلدم</button>
        <Link href="/community" className={button}>آیا سوالی داری؟</Link>
        <button type="button" className={button + " !bg-[#155aa6] !text-white"} disabled={!onNext} onClick={onNext}>پخش درس بعدی</button>
        {saved && <p role="status" className="text-sm leading-7 text-emerald-800">لغت‌های باقی‌مونده به حالت «می‌دونم» تغییر کردن.</p>}
        {!onNext && <p className="text-center text-xs leading-6 text-slate-600">به آخرین درس این دوره رسیدی.</p>}
        {wordsFailed && <button type="button" onClick={onRetryWords} className="min-h-12 text-sm text-rose-700">دریافت دوبارهٔ واژه‌های درس</button>}
        <Dialog open={confirm} onClose={() => { if (!saving) setConfirm(false); }} className="relative z-[1100]" dir="rtl">
            <div className="fixed inset-0 bg-black/45" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-5">
                <DialogPanel className="w-full max-w-[390px] rounded-3xl bg-white p-5 shadow-xl">
                    <DialogTitle className="font-bold text-slate-900">بقیه لغت‌ها رو بلدم</DialogTitle>
                    <Description className="mt-3 text-sm leading-7 text-slate-700">با انجام این کار تموم لغات باقیمونده در این درس به حالت می‌دونم تغییر می‌کنن، آیا هنوز می‌خوای ادامه بدی؟</Description>
                    {error && <p role="alert" className="mt-3 text-sm leading-7 text-rose-700">{error}</p>}
                    <div className="mt-5 grid grid-cols-2 gap-3">
                        <button type="button" disabled={saving} onClick={() => void markKnown()} className={button + " !bg-[#155aa6] !text-white"}>{saving ? "در حال ذخیره…" : "آره"}</button>
                        <button type="button" data-autofocus disabled={saving} onClick={() => setConfirm(false)} className={button}>نه</button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    </section>;
}
