"use client";

import { useId, useState } from "react";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { filterOptionsByQuery } from "@/lib/optionSearch";

interface SearchableOptionListProps {
    label: string;
    options: readonly string[];
    selectedValues: string[];
    onSelect: (value: string) => void;
    searchable?: boolean;
    clearLabel?: string;
    onClear?: () => void;
    scrollClassName?: string;
}

export default function SearchableOptionList({
    label, options, selectedValues, onSelect, searchable = true,
    clearLabel, onClear, scrollClassName = "max-h-72",
}: SearchableOptionListProps) {
    const [query, setQuery] = useState("");
    const id = useId();
    const visibleOptions = filterOptionsByQuery(options, query);
    const optionClass = (active: boolean) => cn(
        "flex min-h-11 items-center justify-center gap-1.5 rounded-[16px] border px-3 py-2 text-center text-[12px] font-black leading-5 transition-colors",
        active ? "border-[#155aa6] bg-[#155aa6] text-white shadow-sm"
            : "border-[#dbe5f0] bg-[#f8fbff] text-slate-600 hover:border-[#155aa6]/30 hover:bg-[#eef6ff] hover:text-[#155aa6]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155aa6] focus-visible:ring-offset-2",
    );

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
            {searchable && (
                <label className="relative block shrink-0">
                    <span className="sr-only">جست‌وجوی {label}</span>
                    <Search aria-hidden className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-[#155aa6]" />
                    <input
                        type="search"
                        dir="rtl"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                if (visibleOptions.length === 1) onSelect(visibleOptions[0]);
                            }
                        }}
                        placeholder={`جست‌وجوی ${label}`}
                        aria-controls={id}
                        className="h-11 w-full rounded-xl border border-[#d5e1ef] bg-white py-2 pl-3 pr-10 text-right text-sm text-slate-900 outline-none placeholder:text-right focus:border-[#155aa6] focus:ring-2 focus:ring-[#155aa6]/15"
                    />
                </label>
            )}
            {clearLabel && onClear && (
                <button type="button" onClick={onClear} aria-pressed={selectedValues.length === 0} className={optionClass(selectedValues.length === 0)}>
                    {clearLabel}
                </button>
            )}
            <div id={id} className={cn("min-h-0 overflow-y-auto overscroll-contain p-1", scrollClassName)}>
                <div role="group" aria-label={`گزینه‌های ${label}`} className="grid grid-cols-2 gap-2">
                    {visibleOptions.map((option) => {
                        const active = selectedValues.includes(option);
                        return (
                            <button key={option} type="button" onClick={() => onSelect(option)} aria-pressed={active} className={optionClass(active)}>
                                {active && <Check aria-hidden size={14} className="shrink-0" />}
                                <span>{option}</span>
                            </button>
                        );
                    })}
                </div>
                {visibleOptions.length === 0 && (
                    <p role="status" className="py-6 text-center text-sm font-medium text-slate-500">گزینه‌ای پیدا نشد.</p>
                )}
            </div>
        </div>
    );
}
