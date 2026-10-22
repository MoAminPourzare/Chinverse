// این فایل یک درس مستقل است؛ هیچ دادهٔ برنامه یا دیتابیس را تغییر نمی‌دهد.
// اجرا از ریشهٔ پروژه: node .\learning\javascript\02-modern-js.mjs
import getBookBySlug, { books } from "./02-book-catalog.mjs";

// تابع یک مقدار است؛ می‌توان آن را به تابع دیگری داد.
const isAvailable = (book) => book.stock > 0;
console.log("نتیجهٔ callback:", isAvailable(books[0]));
console.log("find:", books.find(isAvailable)?.title);
console.log("filter:", books.filter(isAvailable).map((book) => book.slug));
console.log("map:", books.map((book) => book.title));

// callback به متغیرهای محدودهٔ پیرامون دسترسی دارد.
const requestedSlug = "web-design";
const selectedBook = books.find((book) => book.slug === requestedSlug);
console.log("closure:", selectedBook?.title);

// برگرداندن شیء از arrow function با بدنهٔ کوتاه به پرانتز نیاز دارد.
const toSummary = (book) => ({ slug: book.slug, title: book.title });
console.log("خروجی شیء:", books.map(toSummary));

// destructuring نام ویژگی و نام متغیر را می‌تواند متفاوت کند.
const { title: selectedTitle, stock = 10 } = selectedBook;
console.log("destructuring:", selectedTitle, stock);

// ?? فقط null و undefined را جایگزین می‌کند؛ || سایر مقدارهای falsy را هم.
console.log("?? با صفر:", books[0].stock ?? 10);
console.log("|| با صفر:", books[0].stock || 10);
console.log("شناسهٔ ناشناخته:", getBookBySlug("missing")?.title ?? "پیدا نشد");

// انتساب معمولی شیء را کپی نمی‌کند؛ spread فقط کپی سطح اول می‌سازد.
const original = { title: "Original", details: { language: "fa" } };
const alias = original;
const updated = { ...original, title: "Updated" };
console.log("همان شیء:", alias === original);
console.log("کپی سطح اول:", updated === original);
console.log("شیء تودرتوی مشترک:", updated.details === original.details);
console.log("عنوان اصلی حفظ شد:", original.title);

// طول خروجی map برابر ورودی است؛ callback بدون return مقدار undefined می‌دهد.
const missingReturn = books.map((book) => { book.title; });
console.log("return فراموش‌شده:", missingReturn);
