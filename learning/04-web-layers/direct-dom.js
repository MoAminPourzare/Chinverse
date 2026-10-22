// این صفحه React ندارد. تمام تغییرات دکمه با DOM API انجام می‌شود.
const button = document.getElementById("direct-button");
const output = document.getElementById("direct-dom-output");
if (!button || !output) throw new Error("دکمه یا محل نمایش خروجی پیدا نشد.");

let selected = false;
output.textContent = button.outerHTML;

button.addEventListener("click", () => {
    selected = !selected;
    button.textContent = selected ? "انتخاب شده ✓" : "انتخاب کتاب";
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
    output.textContent = button.outerHTML;
});
