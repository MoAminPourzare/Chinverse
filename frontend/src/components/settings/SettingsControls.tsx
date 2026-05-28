"use client";

import { useState } from "react";
import { Check, ChevronLeft, X } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";

export type SettingOption = {
    value: string;
    label: string;
    swatch?: string;
    description?: string;
};

export type ActiveSheet = {
    id: string;
    title: string;
    subtitle?: string;
    value: string;
    options: SettingOption[];
    onSelect: (value: string) => void;
};

export function useOptionSheet() {
    const [activeSheet, setActiveSheet] = useState<ActiveSheet | null>(null);

    return {
        activeSheet,
        openSheet: setActiveSheet,
        closeSheet: () => setActiveSheet(null),
    };
}

interface SelectSettingRowProps {
    label: string;
    value: string;
    options: SettingOption[];
    onOpen: (value: string, options: SettingOption[]) => void;
    swatches?: boolean;
}

export function SelectSettingRow({ label, value, options, onOpen, swatches = false }: SelectSettingRowProps) {
    const activeOption = options.find((option) => option.value === value) || options[0];

    return (
        <button
            type="button"
            onClick={() => onOpen(value, options)}
            className="flex min-h-[62px] w-full items-center justify-between gap-3 px-4 py-3 text-right transition hover:bg-[#f8fbff] active:bg-[#eef6ff]"
        >
            <span className="text-sm font-black text-slate-800">{label}</span>
            <span className="flex min-w-0 items-center gap-2 text-left">
                {swatches && activeOption?.swatch && (
                    <span
                        className="h-4 w-4 shrink-0 rounded-full ring-2 ring-white shadow"
                        style={{ backgroundColor: activeOption.swatch }}
                    />
                )}
                <span className="max-w-[130px] truncate text-xs font-bold text-slate-500">{activeOption?.label}</span>
                <ChevronLeft className="h-4 w-4 shrink-0 text-[#155aa6]" />
            </span>
        </button>
    );
}

interface SwitchSettingRowProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export function SwitchSettingRow({ label, checked, onChange }: SwitchSettingRowProps) {
    return (
        <div className="flex min-h-[62px] items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm font-black text-slate-800">{label}</span>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative h-8 w-14 rounded-full p-1 transition ${
                    checked ? "bg-[#155aa6]" : "bg-slate-300"
                }`}
                aria-pressed={checked}
                aria-label={label}
            >
                <span
                    className={`block h-6 w-6 rounded-full bg-white shadow transition ${
                        checked ? "-translate-x-6" : "translate-x-0"
                    }`}
                />
            </button>
        </div>
    );
}

export function OptionSheet({ sheet, onClose }: { sheet: ActiveSheet; onClose: () => void }) {
    const handleSelect = (value: string) => {
        sheet.onSelect(value);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/45 px-3 pb-3 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-[430px] overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.24)]"
                onClick={(event) => event.stopPropagation()}
                dir="rtl"
            >
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
                    <div className="min-w-0">
                        <h2 className="text-base font-black text-slate-950">{sheet.title}</h2>
                    </div>
                    <IconButton onClick={onClose} label="بستن">
                        <X size={19} />
                    </IconButton>
                </div>

                <div className="max-h-[58vh] overflow-y-auto p-3">
                    <div className="space-y-2">
                        {sheet.options.map((option) => {
                            const active = option.value === sheet.value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className={`flex w-full items-center justify-between gap-3 rounded-[24px] border px-4 py-3 text-right transition ${
                                        active
                                            ? "border-[#d5e1ef] bg-[#eef6ff] text-[#155aa6] shadow-[0_12px_28px_rgba(21,90,166,0.12)]"
                                            : "border-slate-100 bg-slate-50 text-slate-700 hover:bg-slate-100"
                                    }`}
                                >
                                    <span className="flex min-w-0 items-center gap-3">
                                        {option.swatch && (
                                            <span
                                                className="h-5 w-5 shrink-0 rounded-full ring-2 ring-white shadow"
                                                style={{ backgroundColor: option.swatch }}
                                            />
                                        )}
                                        <span className="block text-sm font-black">{option.label}</span>
                                    </span>
                                    <span
                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl ${
                                            active ? "bg-[#155aa6] text-white" : "bg-white text-transparent"
                                        }`}
                                    >
                                        <Check size={16} />
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
