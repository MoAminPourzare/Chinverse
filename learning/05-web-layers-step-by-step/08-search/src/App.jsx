import { useState } from "react";
import { books } from "./books.js";
import BookCard from "./BookCard";

export default function App() {
    const [query, setQuery] = useState("");
    const [selectedId, setSelectedId] = useState(null);
    const normalizedQuery = query.trim().toLowerCase();
    const visibleBooks = books.filter((book) =>
        `${book.title} ${book.topic}`.toLowerCase().includes(normalizedQuery),
    );
    const selectedBook = books.find((book) => book.id === selectedId);

    function handleSelect(bookId) {
        setSelectedId((current) => current === bookId ? null : bookId);
    }

    return (
        <main className="page-shell">
            <h1>کتابخانهٔ کوچک ما</h1>
            <span className="count-badge">{visibleBooks.length} کتاب</span>
            <label className="search-label" htmlFor="book-search">جست‌وجوی عنوان یا فناوری</label>
            <input
                id="book-search"
                className="search-input"
                placeholder="مثلاً React یا تایپ‌اسکریپت"
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
            />
            <div id="selection-summary" className="selection-summary" aria-live="polite">
                انتخاب فعلی: {selectedBook?.title ?? "هنوز کتابی انتخاب نکرده‌ای"}
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
            <section className="state-panel" aria-label="وضعیت برنامه">
                <h2>state فعلی</h2>
                <pre dir="ltr">{JSON.stringify({ query, selectedId }, null, 2)}</pre>
            </section>
        </main>
    );
}
