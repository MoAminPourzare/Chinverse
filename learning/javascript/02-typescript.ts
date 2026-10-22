// درس مستقل TypeScript؛ این فایل در build برنامهٔ فرانت وارد نمی‌شود.
// نوع‌ها در JavaScript خروجی باقی نمی‌مانند و دادهٔ خارجی را اعتبارسنجی نمی‌کنند.
export type BookFormat = "paper" | "ebook";

export interface Book {
    slug: string;
    title: string;
    format: BookFormat;
    stock?: number;
}

const books: Book[] = [
    { slug: "js-basics", title: "JavaScript", format: "paper", stock: 0 },
    { slug: "web-design", title: "Web Design", format: "ebook" },
];

export const getBook = (slug: string | undefined): Book | undefined =>
    books.find((book) => book.slug === slug);

// narrowing: بعد از این بررسی، TypeScript می‌داند book دیگر undefined نیست.
export function getBookTitle(slug: string | undefined): string {
    const book = getBook(slug);
    if (book === undefined) return "پیدا نشد";
    return book.title;
}

// generic ارتباط نوع ورودی و خروجی را حفظ می‌کند.
export function first<T>(items: T[]): T | undefined {
    return items[0];
}

const firstBook = first(books);
const firstNumber = first([10, 20]);

// unknown برای دادهٔ نامطمئن؛ typeof واقعاً هنگام اجرا بررسی می‌شود.
export function parseSlug(input: unknown): string | undefined {
    return typeof input === "string" ? input : undefined;
}

console.log(getBookTitle("js-basics"), firstBook?.title, firstNumber, parseSlug(123));
