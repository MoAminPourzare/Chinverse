import { books } from "./books.js";
import BookCard from "./BookCard";

export default function App() {
    return (
        <main className="page-shell">
            <h1>کتابخانهٔ کوچک ما</h1>
            <span className="count-badge">{books.length} کتاب</span>
            <div id="book-list" className="book-list">
                {books.map((book) => <BookCard key={book.id} book={book} />)}
            </div>
        </main>
    );
}
