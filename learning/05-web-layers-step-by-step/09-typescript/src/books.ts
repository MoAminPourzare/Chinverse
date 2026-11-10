import type { Book } from "./types";

// این آرایه دادهٔ واقعیِ همین مثال است؛ Book[] فقط قرارداد نوع آن است.
export const books: Book[] = [
    { id: "js", title: "جاوااسکریپت کاربردی", topic: "JavaScript", price: 200000 },
    { id: "react", title: "ساخت رابط با ری‌اکت", topic: "React", price: 300000 },
    { id: "ts", title: "تایپ‌اسکریپت در عمل", topic: "TypeScript", price: 250000 },
];
