// ابزار کمکی آموزش؛ منطق فروشگاه در App و BookCard است.
import { useState } from "react";
import source from "./BookCard.tsx?raw";
import compiled from "../generated/BookCard.js?raw";

type View = "source" | "compiled" | "dom";

export default function Inspector() {
    const [view, setView] = useState<View>("source");
    const [domSnapshot, setDomSnapshot] = useState("برای خواندن DOM فعلی، دکمهٔ «خواندن DOM» را بزن.");

    function readDom() {
        const list = document.getElementById("book-list");
        const html = list?.outerHTML ?? "فهرست در DOM پیدا نشد.";
        setDomSnapshot(html.replace(/></g, ">\n<"));
        setView("dom");
    }

    return (
        <aside className="inspector" aria-label="مقایسهٔ کد و DOM">
            <span className="eyebrow">۲ / پشت صحنه را ببین</span>
            <h2>یک کامپوننت، سه نما</h2>
            <div className="tabs" role="group" aria-label="انتخاب نمای کد">
                <button type="button" aria-pressed={view === "source"} onClick={() => setView("source")}>سورس TSX</button>
                <button type="button" aria-pressed={view === "compiled"} onClick={() => setView("compiled")}>JavaScript تبدیل‌شده</button>
                <button type="button" aria-pressed={view === "dom"} onClick={readDom}>خواندن DOM</button>
            </div>
            <p className="inspector-note">
                {view === "source" && "تعریف نوع‌ها، منطق JavaScript و JSX را کنار هم ببین. این همان فایل BookCard.tsx است."}
                {view === "compiled" && "این خروجی آموزشی TypeScript از همین فایل است: interface حذف شده و JSX به فراخوانی JavaScript تبدیل شده. خروجی dev در Vite جزئیات ابزاری متفاوتی دارد."}
                {view === "dom" && "این متن از DOM واقعیِ فهرست در لحظهٔ زدن دکمه خوانده شده است. بعد از تغییر انتخاب، دوباره «خواندن DOM» را بزن؛ دنبال is-selected و aria-pressed بگرد."}
            </p>
            <pre className="code-view" dir="ltr" tabIndex={0}><code>{view === "source" ? source : view === "compiled" ? compiled : domSnapshot}</code></pre>
        </aside>
    );
}
