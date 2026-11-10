import { useState } from "react";
import { books } from "./books.js";
import BookCard from "./BookCard";

export default function App() {
    const [selectedId, setSelectedId] = useState(null);
    const selectedBook = books.find((book) => book.id === selectedId);

    function handleSelect(bookId) {
        setSelectedId((current) => current === bookId ? null : bookId);
    }

    return (
        <main className="page-shell">
            <h1>کتابخانهٔ کوچک ما</h1>
            <span className="count-badge">{books.length} کتاب</span>
            <div id="selection-summary" className="selection-summary" aria-live="polite">
                انتخاب فعلی: {selectedBook?.title ?? "هنوز کتابی انتخاب نکرده‌ای"}
            </div>
            <div id="book-list" className="book-list">
                {books.map((book) => (
                    <BookCard
                        key={book.id}
                        book={book}
                        selected={book.id === selectedId}
                        onSelect={handleSelect}
                    />
                ))}
            </div>
            <section className="state-panel" aria-label="وضعیت برنامه">
                <h2>state فعلی</h2>
                <pre dir="ltr">{JSON.stringify({ selectedId }, null, 2)}</pre>
            </section>
        </main>
    );
}
