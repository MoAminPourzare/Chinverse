import type { ScreenMediaCatalogItem } from "@/lib/screenMediaCatalog";

export default function ScreenMediaCredits({ item }: { item: ScreenMediaCatalogItem }) {
    const credits = item.credits || [
        { label: item.directors.length > 1 ? "کارگردانان:" : "کارگردان:", items: item.directors },
        { label: "بازیگران اصلی:", items: item.cast },
    ];

    return (
        <dl className="mt-6 space-y-6 text-right text-[12px] leading-6 text-[#40464f] dark:text-slate-300">
            <div>
                <dt className="font-bold text-[#343941] dark:text-white">ژانر:</dt>
                <dd>{item.genres.join("، ")}</dd>
            </div>
            <div>
                <dt className="font-bold text-[#343941] dark:text-white">سال انتشار:</dt>
                <dd>{item.year.toLocaleString("fa-IR", { useGrouping: false })} - {item.country}</dd>
            </div>
            {credits.map((credit) => (
                <div key={credit.label}>
                    <dt className="font-bold text-[#343941] dark:text-white">{credit.label}</dt>
                    <dd>
                        <ul>{credit.items.map((entry) => <li key={entry}>{entry}</li>)}</ul>
                    </dd>
                </div>
            ))}
        </dl>
    );
}
