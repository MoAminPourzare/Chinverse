// درس مستقل اول JavaScript: این فایل بخشی از برنامهٔ چین‌ورس نیست.
// تمام اطلاعات کتاب‌ها مثال آموزشی است؛ فایل به شبکه یا دیتابیس وصل نمی‌شود.
// اجرا از ریشهٔ پروژه: node .\learning\javascript\01-basics.js

// ۱. مقدار، متغیر و تغییر مقدار
const storeName = "فروشگاه کتاب";
let visitorCount = 2;
visitorCount = visitorCount + 1;

console.log("نام فروشگاه:", storeName);
console.log("تعداد بازدیدکننده:", visitorCount);
console.log("متن و عدد برابرند؟", "3" === 3);

// ۲. شیء: چند ویژگی مربوط به یک چیز
const book = {
    id: "book-1",
    title: "JavaScript مقدماتی",
    price: 200000,
    available: true,
};

console.log("عنوان کتاب:", book.title);
console.log("متن با مقدار متغیر:", `کتاب ${book.title}، قیمت ${book.price}`);

// ۳. آرایه: فهرستی از چند چیز؛ شمارهٔ اولین عضو صفر است
const books = [
    book,
    {
        id: "book-2",
        title: "طراحی وب مقدماتی",
        price: 300000,
        available: false,
    },
];

console.log("تعداد کتاب‌ها:", books.length);
console.log("عنوان اولین کتاب:", books[0].title);
console.log("عنوان دومین کتاب:", books[1].title);
console.log("عضو سوم وجود دارد؟", books[2]);

// ۴. تابع: تعریف ورودی، انجام کار و برگرداندن نتیجه
function calculateTotal(unitPrice, quantity) {
    const total = unitPrice * quantity;
    return total;
}

const firstOrderTotal = calculateTotal(200000, 2);
console.log("مجموع سفارش:", firstOrderTotal);

// ۵. شرط و return: انتخاب خروجی مناسب
function getAvailabilityMessage(selectedBook) {
    if (selectedBook === undefined) {
        return "کتاب پیدا نشد";
    }

    if (selectedBook.available) {
        return "کتاب موجود است";
    }

    return "کتاب فعلاً ناموجود است";
}

console.log("وضعیت کتاب اول:", getAvailabilityMessage(books[0]));
console.log("وضعیت کتاب دوم:", getAvailabilityMessage(books[1]));
console.log("وضعیت کتاب ناموجود:", getAvailabilityMessage(books[2]));

// ۶. جست‌وجو: هر عضو را بررسی کن و اولین عضو مطابق را برگردان
function findBookById(requestedId) {
    for (const currentBook of books) {
        if (currentBook.id === requestedId) {
            return currentBook;
        }
    }

    return undefined;
}

const selectedId = "book-2";
const selectedBook = findBookById(selectedId);

if (selectedBook === undefined) {
    console.log("نتیجهٔ جست‌وجو: کتاب پیدا نشد");
} else {
    console.log("کتاب انتخاب‌شده:", selectedBook.title);
    console.log("وضعیت کتاب انتخاب‌شده:", getAvailabilityMessage(selectedBook));
}

const missingBook = findBookById("book-99");
console.log("نتیجهٔ شناسهٔ ناشناخته:", getAvailabilityMessage(missingBook));

// ۷. تمرین همراه پاسخ: سفارش سه جلد کتاب اول
const exerciseTotal = calculateTotal(books[0].price, 3);
console.log("پاسخ تمرین سه جلد:", exerciseTotal);
