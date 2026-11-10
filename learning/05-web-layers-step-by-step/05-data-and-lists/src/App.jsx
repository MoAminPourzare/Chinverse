import { books } from "./books.js";
import { formatPrice } from "./format-price.js";

export default function App() {
    return (
        <main className="page-shell">
            <h1>کتابخانهٔ کوچک ما</h1>
            <span className="count-badge">{books.length} کتاب</span>
            <div id="book-list" className="book-list">
                {books.map((book) => (
                    <article key={book.id} className="book-card">
                        <span className="book-topic">{book.topic}</span>
                        <h2>{book.title}</h2>
                        <p className="book-price">{formatPrice(book.price)} تومان</p>
                        <button className="choose-button" type="button">انتخاب کتاب</button>
                    </article>
                ))}
            </div>
        </main>
    );
}
