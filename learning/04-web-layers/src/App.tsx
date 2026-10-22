import { useState } from "react";
import { books } from "./books";
import BookCard from "./BookCard";
import Inspector from "./Inspector";

export default function App() {
    // React این دو وضعیت را بین renderها نگه می‌دارد.
    const [query, setQuery] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // این قسمت منطق JavaScript است، حتی اگر داخل فایل .tsx نوشته شده باشد.
    const normalizedQuery = query.trim().toLowerCase();
    const visibleBooks = books.filter((book) =>
        `${book.title} ${book.topic}`.toLowerCase().includes(normalizedQuery),
    );
    const selectedBook = books.find((book) => book.id === selectedId);

    function handleSelect(bookId: string) {
        // تغییر state را درخواست می‌کنیم؛ تغییر متن و کلاس DOM کار React DOM است.
        setSelectedId((current) => current === bookId ? null : bookId);
    }

    return (
        <div className="page-shell">
            <header className="hero">
                <span className="eyebrow">آزمایشگاه مستقل · درس ۰۴</span>
                <h1>از کد تا صفحه</h1>
                <p>یک فروشگاه کوچک برای دیدن نقش هر فناوری، از تعریف داده تا تغییر دکمه در مرورگر.</p>
                <div className="layer-strip" aria-label="لایه‌های مثال">
                    <span>TypeScript · قرارداد</span><span>JavaScript · اجرا</span>
                    <span>JSX · توصیف</span><span>React · وضعیت</span><span>DOM · صفحهٔ فعلی</span>
                </div>
            </header>

            <main className="lesson-grid">
                <section className="store-panel" aria-labelledby="store-heading">
                    <div className="panel-heading">
                        <div><span className="eyebrow">۱ / با مثال کار کن</span><h2 id="store-heading">کتابخانهٔ کوچک ما</h2></div>
                        <span className="count-badge">{visibleBooks.length} کتاب</span>
                    </div>

                    <label className="search-label" htmlFor="book-search">جست‌وجوی عنوان یا فناوری</label>
                    <input
                        id="book-search"
                        className="search-input"
                        placeholder="مثلاً React یا تایپ‌اسکریپت"
                        value={query}
                        onChange={(event) => setQuery(event.currentTarget.value)}
                    />

                    <div id="selection-summary" className="selection-summary" aria-live="polite">
                        <span>انتخاب فعلی</span>
                        <strong>{selectedBook?.title ?? "هنوز کتابی انتخاب نکرده‌ای"}</strong>
                    </div>

                    <div id="book-list" className="book-list">
                        {visibleBooks.map((book) => (
                            <BookCard
                                key={book.id}
                                book={book}
                                selected={book.id === selectedId}
                                onSelect={handleSelect}
                            />
                        ))}
                        {visibleBooks.length === 0 && <p className="empty-state">کتابی پیدا نشد؛ عبارت جست‌وجو را تغییر بده.</p>}
                    </div>

                    <div className="state-panel">
                        <h3>state فعلی در React</h3>
                        <pre dir="ltr">{JSON.stringify({ query, selectedId }, null, 2)}</pre>
                        <p>تایپ کن یا یک کتاب را انتخاب کن؛ این مقدارها تغییر می‌کنند و نمایش دوباره محاسبه می‌شود.</p>
                    </div>
                    <a className="text-link" href="/direct-dom.html">همین ایده را بدون React، با DOM مستقیم ببین ←</a>
                </section>

                <Inspector />
            </main>

            <section className="technology-map">
                <span className="eyebrow">۳ / هر ابزار چه مسئولیتی دارد؟</span>
                <div className="role-grid">
                    <div><h3>HTML + CSS</h3><p>HTML نقطهٔ شروع سند است. CSS ظاهر، فاصله و رنگ کارت‌ها را مشخص می‌کند.</p></div>
                    <div><h3>TypeScript</h3><p>ورودی درست کتاب و کامپوننت را هنگام توسعه بررسی می‌کند. نوع Book به مرورگر فرستاده نمی‌شود.</p></div>
                    <div><h3>JavaScript + JSX</h3><p>فیلتر و handlerها منطق اجرایی‌اند. JSX ساختار نمایش را توصیف می‌کند و قبل از اجرا به JavaScript تبدیل می‌شود.</p></div>
                    <div><h3>React + React DOM</h3><p>React وضعیت و محاسبهٔ رابط را مدیریت می‌کند؛ React DOM تغییرات لازم را در درخت صفحه اعمال می‌کند.</p></div>
                    <div><h3>Vite</h3><p>سرور توسعه و تبدیل فایل‌های این مثال است. تبدیل سریع فایل با بررسی نوع TypeScript دو کار جدا هستند.</p></div>
                    <div><h3>Next.js کجاست؟</h3><p>در این مثال استفاده نشده. برای ساخت صفحه‌های مسیر‌دار و اجرای بخش‌های سرور در پروژهٔ اصلی به آن می‌رسیم.</p></div>
                </div>
            </section>
            <footer>داده‌ها آموزشی‌اند · انتخاب با تازه‌سازی صفحه پاک می‌شود · هیچ اتصال دیتابیس یا ثبت سفارش نداریم</footer>
        </div>
    );
}
