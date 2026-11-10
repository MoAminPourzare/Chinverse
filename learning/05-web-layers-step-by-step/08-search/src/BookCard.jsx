import { formatPrice } from "./format-price.js";

export default function BookCard({ book, selected, onSelect }) {
    return (
        <article className={selected ? "book-card is-selected" : "book-card"}>
            <span className="book-topic">{book.topic}</span>
            <h2>{book.title}</h2>
            <p className="book-price">{formatPrice(book.price)} تومان</p>
            <button
                className="choose-button"
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(book.id)}
            >
                {selected ? "انتخاب شده ✓" : "انتخاب کتاب"}
            </button>
        </article>
    );
}
