"use client";

import { useState } from "react";
import SearchableOptionList from "@/components/ui/SearchableOptionList";
import { COUNTRY_REGION_OPTIONS, getProvinceOptions } from "@/profileOptions";

export default function LocationFilterOptions({ values, onToggle, onClear }: {
    values: string[];
    onToggle: (value: string) => void;
    onClear: () => void;
}) {
    const [country, setCountry] = useState(() => values[0]?.split(" / ")[0] || "");
    const provinces = getProvinceOptions(country);
    return <div className="flex min-h-0 flex-1 flex-col gap-4">
        <SearchableOptionList label="کشور/منطقه" options={COUNTRY_REGION_OPTIONS} selectedValues={values.filter((value) => !value.includes(" / "))}
            onSelect={(value) => { setCountry(value); onToggle(value); }} clearLabel="همهٔ کشورها" onClear={onClear}
            scrollClassName={provinces.length ? "max-h-[25dvh]" : "flex-1"} />
        {provinces.length > 0 && <div className="flex min-h-0 flex-1 flex-col border-t border-slate-200 pt-3">
            <h3 className="mb-2 text-sm font-bold text-slate-800">استان‌های {country}</h3>
            <SearchableOptionList key={country} label="استان" options={provinces}
                selectedValues={values.filter((value) => value.startsWith(country + " / ")).map((value) => value.split(" / ")[1])}
                onSelect={(province) => onToggle(country + " / " + province)} scrollClassName="flex-1" />
        </div>}
    </div>;
}
