// درس مستقل React؛ این فایل route یا بخشی از build چین‌ورس نیست.
// تمام داده‌ها ساختگی‌اند و هیچ درخواست شبکه یا ذخیرهٔ دائمی نداریم.
// این کامپوننت‌ها برای اجرا به محیط React و mount شدن در یک root نیاز دارند.
import { useState, type ReactNode } from "react";

type Book = {
    id: string;
    title: string;
    price: number;
};

const books: Book[] = [
    { id: "js", title: "JavaScript", price: 200000 },
    { id: "react", title: "React", price: 300000 },
    { id: "ts", title: "TypeScript", price: 250000 },
];

type PanelProps = {
    title: string;
    children: ReactNode;
};

function Panel({ title, children }: PanelProps) {
    return (
        <section>
            <h2>{title}</h2>
            {children}
        </section>
    );
}

type BookCardProps = {
    book: Book;
    isSelected: boolean;
    onSelect: (bookId: string) => void;
};

function BookCard({ book, isSelected, onSelect }: BookCardProps) {
    return (
        <article>
            <h3>{book.title}</h3>
            <p>قیمت: {book.price} تومان</p>
            <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelect(book.id)}
            >
                {isSelected ? "انتخاب شده" : "انتخاب کتاب"}
            </button>
        </article>
    );
}

function BookStore() {
    const [query, setQuery] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // دادهٔ قابل محاسبه، state جداگانه ندارد.
    const visibleBooks = books.filter((book) =>
        book.title.toLowerCase().includes(query.trim().toLowerCase()),
    );
    const selectedBook = books.find((book) => book.id === selectedId);

    function handleSelect(bookId: string) {
        setSelectedId(bookId);
    }

    return (
        <Panel title="فروشگاه کتاب">
            <label>
                جست‌وجو در عنوان کتاب‌ها
                <input
                    value={query}
                    onChange={(event) => setQuery(event.currentTarget.value)}
                />
            </label>

            <p>تعداد نتیجه‌ها: {visibleBooks.length}</p>
            <p>کتاب انتخاب‌شده: {selectedBook?.title ?? "هنوز انتخاب نکرده‌ای"}</p>

            {visibleBooks.length === 0 ? (
                <p>کتابی مطابق جست‌وجو پیدا نشد.</p>
            ) : (
                <div>
                    {visibleBooks.map((book) => (
                        <BookCard
                            key={book.id}
                            book={book}
                            isSelected={book.id === selectedId}
                            onSelect={handleSelect}
                        />
                    ))}
                </div>
            )}
        </Panel>
    );
}

function SnapshotCounter() {
    const [count, setCount] = useState(0);

    function replaceThreeTimes() {
        setCount(count + 1);
        setCount(count + 1);
        setCount(count + 1);
    }

    function incrementThreeTimes() {
        setCount((previous) => previous + 1);
        setCount((previous) => previous + 1);
        setCount((previous) => previous + 1);
    }

    return (
        <Panel title="state و صف به‌روزرسانی">
            <p>شمارنده: {count}</p>
            <button type="button" onClick={replaceThreeTimes}>سه جایگزینی؛ افزایش یک واحد</button>
            <button type="button" onClick={incrementThreeTimes}>سه updater؛ افزایش سه واحد</button>
            <button type="button" onClick={() => setCount(0)}>صفرکردن</button>
        </Panel>
    );
}

export default function ReactLesson() {
    return (
        <main lang="fa" dir="rtl">
            <h1>آموزش مستقل React</h1>
            <BookStore />
            <SnapshotCounter />
        </main>
    );
}
