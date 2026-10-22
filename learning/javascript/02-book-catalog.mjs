// درس مستقل: export نام‌دار برای داده و export پیش‌فرض برای تابع جست‌وجو.
export const books = [
    { slug: "js-basics", title: "JavaScript", price: 200000, stock: 0 },
    { slug: "web-design", title: "Web Design", price: 300000, stock: 5 },
];

export default function getBookBySlug(slug) {
    return books.find((book) => book.slug === slug);
}
