export default function App() {
    return (
        <main className="page-shell">
            <h1>کتابخانهٔ کوچک ما</h1>
            <p>همان یک کارت، این بار با React و JSX.</p>
            <article className="book-card">
                <span className="book-topic">JavaScript</span>
                <h2>جاوااسکریپت کاربردی</h2>
                <p className="book-price">۲۰۰٬۰۰۰ تومان</p>
                <button className="choose-button" type="button">انتخاب کتاب</button>
            </article>
        </main>
    );
}
