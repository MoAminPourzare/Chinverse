import { formatPrice } from "./format-price.js";

export default function BookCard({ book }) {
    return (
        <article className="book-card">
            <span className="book-topic">{book.topic}</span>
            <h2>{book.title}</h2>
            <p className="book-price">{formatPrice(book.price)} تومان</p>
            <button className="choose-button" type="button">انتخاب کتاب</button>
        </article>
    );
}
