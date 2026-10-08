"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Dialog, DialogDescription, DialogPanel, DialogTitle } from "@headlessui/react";
import { Check, Minus, Plus, X } from "lucide-react";
import { dailyGoalWordOptions, parseGoalInput } from "@/lib/learningPreferences";
import { cn } from "@/lib/cn";
import styles from "./LeitnerGoalSheet.module.css";

interface LeitnerGoalSheetProps {
    value: number;
    onClose: () => void;
    onSave: (value: number) => void;
}

export default function LeitnerGoalSheet({ value, onClose, onSave }: LeitnerGoalSheetProps) {
    const startsCustom = !dailyGoalWordOptions.some((option) => option.value === value);
    const [customMode, setCustomMode] = useState(startsCustom);
    const [selectedValue, setSelectedValue] = useState(value);
    const [customWords, setCustomWords] = useState(String(startsCustom ? value : 12));
    const inputRef = useRef<HTMLInputElement>(null);
    const customValue = parseGoalInput(customWords, 1);
    const draftValue = customMode ? customValue : selectedValue;
    const changeCustom = (change: number) => {
        const nextValue = (customValue ?? 1) + change;
        if (!Number.isSafeInteger(nextValue) || nextValue < 1) return;
        setCustomMode(true);
        setCustomWords(String(nextValue));
    };

    return (
        <Dialog open onClose={onClose} className="relative z-[140]" dir="rtl">
            <div aria-hidden className="modal-backdrop-motion fixed inset-0 bg-slate-950/45 backdrop-blur-sm" />
            <div className="fixed inset-0 overflow-y-auto p-4">
                <div className="flex min-h-full items-center justify-center">
                    <DialogPanel className="modal-panel-motion flex max-h-[calc(var(--app-visual-height,100dvh)-32px)] w-full max-w-[430px] flex-col overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-2xl dark:border-[#344050] dark:bg-[#171d26]">
                        <div aria-hidden className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-slate-200 dark:bg-slate-600" />
                        <div className="flex justify-end px-4 pt-2">
                            <button type="button" onClick={onClose} aria-label="بستن" className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 dark:border-slate-600 dark:text-slate-200">
                                <X aria-hidden size={21} />
                            </button>
                        </div>
                        <div className="min-h-0 overflow-y-auto px-5 pb-2">
                            <div className={styles.header}>
                                <div>
                                    <DialogTitle className="text-[19px] font-black leading-8 text-slate-950 dark:text-slate-100">هدف روزانه لایتنر</DialogTitle>
                                    <DialogDescription className="mt-3 text-[13px] font-bold leading-7 text-slate-600 dark:text-slate-300">هر روز چند تا لغت میخوای با لایتنر مرور کنی؟</DialogDescription>
                                </div>
                                <div aria-hidden className={styles.art}>
                                    <Image src="/assets/chinverse/icons/Goal.svg" alt="" width={108} height={108} className="absolute right-0 top-0 h-[108px] w-[108px] object-contain" />
                                    <span lang="zh" className={`${styles.flashcard} font-cjk`}>学</span>
                                </div>
                            </div>

                            <div role="radiogroup" aria-label="تعداد لغات هدف روزانه لایتنر" className="mt-5" onKeyDown={(event) => {
                                if (!["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(event.key)) return;
                                const choices = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]'));
                                const current = choices.indexOf(document.activeElement as HTMLButtonElement);
                                if (current < 0) return;
                                event.preventDefault();
                                const offset = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
                                const next = choices[(current + offset + choices.length) % choices.length];
                                next.click();
                                next.focus();
                            }}>
                                <div dir="ltr" className="grid grid-cols-3 gap-2">
                                    {dailyGoalWordOptions.map((option) => {
                                        const active = !customMode && selectedValue === option.value;
                                        return (
                                            <button key={option.value} type="button" role="radio" aria-checked={active} aria-label={`${option.label} – ${option.description}`} tabIndex={active ? 0 : -1} onClick={() => { setSelectedValue(option.value); setCustomMode(false); }} className={cn("relative flex aspect-square min-w-0 flex-col items-center justify-center rounded-[20px] border px-2 pb-2 pt-6 text-center transition", active ? "border-[#155aa6] bg-[#eef6ff] text-[#155aa6] ring-1 ring-[#155aa6] dark:border-[#72b6ff] dark:bg-[#1b3149] dark:text-[#b5daff]" : "border-slate-200 bg-[#f8f9fc] text-slate-900 hover:bg-blue-50 dark:border-slate-600 dark:bg-[#202936] dark:text-slate-100")}>
                                                {active && <span aria-hidden className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#155aa6] text-white"><Check size={13} /></span>}
                                                <span dir="rtl" className="text-[26px] font-black leading-7">{option.value.toLocaleString("fa-IR")} <span className="text-[10px] font-semibold">لغت</span></span>
                                                <span dir="rtl" className="text-[12px] font-bold leading-4">{option.description}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className={`${styles.custom} mt-3 rounded-[20px] border border-slate-200 bg-[#f8f9fc] p-3 dark:border-slate-600 dark:bg-[#202936]`}>
                                    <button type="button" role="radio" aria-checked={customMode} tabIndex={customMode ? 0 : -1} onClick={() => { setCustomMode(true); inputRef.current?.focus(); }} className="flex items-center gap-2 text-right">
                                        <span aria-hidden className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2", customMode ? "border-[#155aa6] bg-[#155aa6] text-white" : "border-slate-300 bg-white dark:border-slate-400 dark:bg-[#171d26]")}>{customMode && <Check size={15} />}</span>
                                        <span><span className="block text-sm font-black text-slate-950 dark:text-slate-100">عدد دلخواه</span><span className="mt-1 block text-[11px] font-medium leading-5 text-slate-600 dark:text-slate-300">مقدار مورد نظر خود را وارد کن</span></span>
                                    </button>
                                    <div>
                                        <div dir="ltr" className="flex items-center justify-center gap-1">
                                            <button type="button" aria-label="کاهش تعداد لغت" onClick={() => changeCustom(-1)} disabled={customValue !== null && customValue <= 1} className={styles.step}><Minus aria-hidden size={18} /></button>
                                            <input ref={inputRef} id="customLeitnerWords" type="text" inputMode="numeric" value={customWords} onFocus={() => setCustomMode(true)} onChange={(event) => { setCustomWords(event.target.value); setCustomMode(true); }} className="h-11 w-[54px] min-w-0 rounded-xl border border-slate-200 bg-white px-1 text-center text-lg font-black text-slate-950 outline-none focus:border-[#155aa6] focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-[#171d26] dark:text-slate-100" aria-invalid={customMode && customValue === null} aria-describedby={customMode && customValue === null ? "customLeitnerError" : undefined} />
                                            <button type="button" aria-label="افزایش تعداد لغت" onClick={() => changeCustom(1)} disabled={customValue === Number.MAX_SAFE_INTEGER} className={styles.step}><Plus aria-hidden size={18} /></button>
                                        </div>
                                        <label htmlFor="customLeitnerWords" className="mt-1 block text-center text-[11px] font-semibold text-slate-600 dark:text-slate-300">لغت در روز</label>
                                    </div>
                                </div>
                            </div>
                            {customMode && customValue === null && <p id="customLeitnerError" role="alert" className="mt-2 text-xs font-medium leading-6 text-rose-700 dark:text-rose-300">یک عدد صحیح، یک یا بیشتر وارد کن.</p>}
                        </div>
                        <div className="shrink-0 px-5 pb-5 pt-3">
                            <button type="button" disabled={draftValue === null} onClick={() => { if (draftValue !== null) onSave(draftValue); }} className="h-[52px] w-full rounded-[20px] bg-[#155aa6] text-base font-black text-white shadow-lg transition hover:bg-[#0f4e92] disabled:opacity-50">ثبت هدف</button>
                        </div>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
}
