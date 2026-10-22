import type { Book } from "./types";
import { formatPrice } from "./format-price.js";

// TypeScript: چه ورودی‌هایی برای این کامپوننت معتبر هستند؟
interface BookCardProps {
    book: Book;
    selected: boolean;
    onSelect: (bookId: string) => void;
}

export default function BookCard({ book, selected, onSelect }: BookCardProps) {
    // JSX: نمایش مطلوب بر اساس ورودی‌های فعلی؛ شیء DOM را دستی تغییر نمی‌دهیم.
    return (
        <article className={selected ? "book-card is-selected" : "book-card"}>
            <span className="book-topic">{book.topic}</span>
            <h3>{book.title}</h3>
            <p className="book-price">{formatPrice(book.price)} <small>تومان</small></p>
            <button
                type="button"
                className="choose-button"
                aria-pressed={selected}
                onClick={() => onSelect(book.id)}
            >
                {selected ? "انتخاب شده ✓" : "انتخاب کتاب"}
            </button>
        </article>
    );
}
