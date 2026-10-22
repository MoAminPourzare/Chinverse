// JavaScript معمولی: این تابع هنگام اجرای صفحه، عدد را به متن تبدیل می‌کند.
// کامنت JSDoc زیر فقط برای راهنمای ویرایشگر و بررسی نوع است؛ دستور اجرایی نیست.
/** @param {number} amount */
export function formatPrice(amount) {
    return new Intl.NumberFormat("fa-IR").format(amount);
}
