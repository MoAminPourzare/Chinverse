export function getSocialActionError(error: unknown, action: 'message' | 'network'): string {
    const response = (error as { response?: { status?: number } } | null)?.response;
    if (response?.status === 401) return 'نشستت پایان یافته. دوباره وارد حساب شو و تلاش کن.';
    if (response?.status === 403) return 'اجازهٔ انجام این کار را نداری. وضعیت تأیید حسابت را بررسی کن.';
    if (response?.status === 404) return 'این کاربر در دسترس نیست.';
    if (response?.status === 400) return action === 'message'
        ? 'ارسال این پیام ممکن نیست. متن پیام و گیرنده را بررسی کن.'
        : 'اتصال شبکه با این کاربر ممکن نیست.';
    if (response?.status === 429) return 'کمی صبر کن و دوباره تلاش کن.';
    return action === 'message'
        ? 'ارسال پیام انجام نشد. اتصال را بررسی کن و دوباره تلاش کن.'
        : 'تغییر شبکه ذخیره نشد. اتصال را بررسی کن و دوباره تلاش کن.';
}
