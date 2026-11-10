const button = document.getElementById("choose-button");
const card = document.getElementById("book-card");
const summary = document.getElementById("selection-summary");
if (!button || !card || !summary) throw new Error("بخش‌های لازم صفحه پیدا نشدند.");

let selected = false;

button.addEventListener("click", () => {
    selected = !selected;
    button.textContent = selected ? "انتخاب شده ✓" : "انتخاب کتاب";
    button.setAttribute("aria-pressed", String(selected));
    card.classList.toggle("is-selected", selected);
    summary.textContent = selected ? "انتخاب فعلی: جاوااسکریپت کاربردی" : "هنوز کتابی انتخاب نکرده‌ای";
});
