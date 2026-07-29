export type ValidationResult = { ok: true } | { ok: false; message: string };

export const normalizeDigits = (value: string) => {
    const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
    const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

    return value
        .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
        .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)));
};

export const normalizeIranMobile = (value: string) => {
    let phone = normalizeDigits(value).trim().replace(/[^\d+]/g, "");
    if (phone.startsWith("+98")) phone = `0${phone.slice(3)}`;
    if (phone.startsWith("0098")) phone = `0${phone.slice(4)}`;
    return phone;
};

const PERSIAN_NAME_PATTERN = /^[آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهیءئؤۀة\s‌]+$/u;

export const normalizePersianName = (value: string) => value
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .trim();

export const hasOnlyPersianNameCharacters = (value: string) => {
    const normalized = normalizePersianName(value);
    return !normalized || PERSIAN_NAME_PATTERN.test(normalized);
};

export const validatePersianName = (value: string): ValidationResult => {
    const name = normalizePersianName(value);
    if (!name) {
        return { ok: false, message: "نام و نام خانوادگی را وارد کن." };
    }
    if (!PERSIAN_NAME_PATTERN.test(name)) {
        return { ok: false, message: "نام را فقط با حروف فارسی بنویس؛ زبان صفحه‌کلید را روی فارسی بگذار." };
    }
    if (name.length < 2) {
        return { ok: false, message: "نام و نام خانوادگی باید حداقل ۲ حرف باشد." };
    }
    if (name.length > 120) {
        return { ok: false, message: "نام و نام خانوادگی نباید بیشتر از ۱۲۰ کاراکتر باشد." };
    }
    return { ok: true };
};

export const validationMessage = (result: ValidationResult) => (result.ok ? "" : result.message);

export const cleanApiValidationMessage = (message?: string) =>
    (message || "مقدار واردشده معتبر نیست.").replace(/^Value error,\s*/i, "");

export const validateRequired = (value: string, label: string): ValidationResult => {
    if (!value.trim()) {
        return { ok: false, message: `${label} را وارد کن.` };
    }
    return { ok: true };
};

export const validateTextLength = (
    value: string,
    label: string,
    options: { min?: number; max?: number; required?: boolean } = {},
): ValidationResult => {
    const cleanValue = value.trim();

    if (options.required && !cleanValue) {
        return { ok: false, message: `${label} را وارد کن.` };
    }
    if (cleanValue && options.min && cleanValue.length < options.min) {
        return { ok: false, message: `${label} باید حداقل ${options.min} کاراکتر باشد.` };
    }
    if (options.max && cleanValue.length > options.max) {
        return { ok: false, message: `${label} نباید بیشتر از ${options.max} کاراکتر باشد.` };
    }
    return { ok: true };
};

export const validateEmail = (value: string): ValidationResult => {
    const email = value.trim();
    if (!email) {
        return { ok: false, message: "ایمیل را وارد کن." };
    }
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(email)) {
        return { ok: false, message: "ایمیل را با ساختار درست وارد کن؛ مثل name@example.com" };
    }
    return { ok: true };
};

export const validateIranMobile = (value: string): ValidationResult => {
    const phone = normalizeIranMobile(value);
    if (!phone) {
        return { ok: false, message: "شماره موبایل را وارد کن." };
    }
    if (!/^09\d{9}$/.test(phone)) {
        return { ok: false, message: "شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود؛ مثل 09121234567" };
    }
    return { ok: true };
};

export const validatePassword = (value: string): ValidationResult => {
    if (!value) {
        return { ok: false, message: "رمز عبور را وارد کن." };
    }
    if (value.length < 8) {
        return { ok: false, message: "رمز عبور باید حداقل ۸ کاراکتر باشد." };
    }
    if (new TextEncoder().encode(value).length > 72) {
        return { ok: false, message: "رمز عبور خیلی طولانی است؛ حداکثر ۷۲ بایت مجاز است." };
    }
    if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
        return { ok: false, message: "رمز عبور باید حداقل یک حرف انگلیسی و یک عدد داشته باشد." };
    }
    return { ok: true };
};

export const validateReferralCode = (value: string): ValidationResult => {
    const code = value.trim().toUpperCase().replace(/[-\s]/g, "");
    if (!code) {
        return { ok: true };
    }
    if (!/^[A-Z0-9]{4,32}$/.test(code)) {
        return { ok: false, message: "ساختار کد دعوت درست نیست؛ فقط ۴ تا ۳۲ حرف انگلیسی یا عدد وارد کن." };
    }
    return { ok: true };
};

export const IMAGE_FILE_EXTENSIONS = [
    "jpg",
    "jpeg",
    "jfif",
    "png",
    "webp",
    "heic",
    "heif",
    "gif",
    "avif",
    "bmp",
    "tif",
    "tiff",
] as const;

export const IMAGE_FILE_MIME_TYPES = [
    "image/jpeg",
    "image/pjpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
    "image/heic-sequence",
    "image/heif-sequence",
    "image/gif",
    "image/avif",
    "image/bmp",
    "image/x-ms-bmp",
    "image/tiff",
] as const;

const ADJUSTABLE_IMAGE_EXTENSIONS = ["jpg", "jpeg", "jfif", "png", "webp"] as const;
const ADJUSTABLE_IMAGE_MIME_TYPES = ["image/jpeg", "image/pjpeg", "image/png", "image/webp"] as const;
const CONVERTED_ON_UPLOAD_EXTENSIONS = ["heic", "heif", "bmp", "tif", "tiff"] as const;
const CONVERTED_ON_UPLOAD_MIME_TYPES = [
    "image/heic",
    "image/heif",
    "image/heic-sequence",
    "image/heif-sequence",
    "image/bmp",
    "image/x-ms-bmp",
    "image/tiff",
] as const;

export const IMAGE_FILE_FORMAT_LABEL = "JPG، PNG، WEBP، HEIC، HEIF، GIF، AVIF، BMP یا TIFF";
export const IMAGE_FILE_ACCEPT = [
    ...IMAGE_FILE_EXTENSIONS.map((extension) => `.${extension}`),
    ...IMAGE_FILE_MIME_TYPES,
].join(",");

const getFileExtension = (file: File) => {
    const lastDot = file.name.lastIndexOf(".");
    if (lastDot <= 0 || lastDot === file.name.length - 1) return "";
    return file.name.slice(lastDot + 1).toLowerCase();
};
const isOneOf = <T extends readonly string[]>(value: string, values: T) => values.includes(value as T[number]);

export const isAdjustableImageFile = (file: File) => {
    const extension = getFileExtension(file);
    const mimeType = file.type.toLowerCase();
    if (isOneOf(extension, IMAGE_FILE_EXTENSIONS)) {
        return isOneOf(extension, ADJUSTABLE_IMAGE_EXTENSIONS);
    }
    return isOneOf(extension, ADJUSTABLE_IMAGE_EXTENSIONS) || isOneOf(mimeType, ADJUSTABLE_IMAGE_MIME_TYPES);
};

export const isImageConvertedOnUpload = (file: File) => {
    const extension = getFileExtension(file);
    const mimeType = file.type.toLowerCase();
    if (isOneOf(extension, IMAGE_FILE_EXTENSIONS)) {
        return isOneOf(extension, CONVERTED_ON_UPLOAD_EXTENSIONS);
    }
    return isOneOf(extension, CONVERTED_ON_UPLOAD_EXTENSIONS) || isOneOf(mimeType, CONVERTED_ON_UPLOAD_MIME_TYPES);
};

export const validateImageFile = (file: File | null, options: { required?: boolean; maxMb?: number } = {}): ValidationResult => {
    const maxMb = options.maxMb ?? 5;
    if (!file) {
        return options.required ? { ok: false, message: "یک تصویر انتخاب کن." } : { ok: true };
    }

    const extension = getFileExtension(file);
    const mimeType = file.type.toLowerCase();
    const hasAllowedExtension = isOneOf(extension, IMAGE_FILE_EXTENSIONS);
    const hasAllowedMimeType = isOneOf(mimeType, IMAGE_FILE_MIME_TYPES);

    if (!hasAllowedExtension || (mimeType && !hasAllowedMimeType && mimeType !== "application/octet-stream")) {
        return { ok: false, message: `فرمت تصویر باید ${IMAGE_FILE_FORMAT_LABEL} باشد.` };
    }
    if (file.size > maxMb * 1024 * 1024) {
        return { ok: false, message: `حجم تصویر نباید بیشتر از ${maxMb} مگابایت باشد.` };
    }
    return { ok: true };
};

export const validateUrl = (
    value: string,
    label: string,
    options: { required?: boolean; allowRelative?: boolean } = {},
): ValidationResult => {
    const url = value.trim();
    if (!url) {
        return options.required ? { ok: false, message: `${label} را وارد کن.` } : { ok: true };
    }
    if (options.allowRelative && url.startsWith("/")) {
        return { ok: true };
    }
    try {
        const parsed = new URL(url);
        if (!["http:", "https:"].includes(parsed.protocol)) {
            return { ok: false, message: `${label} باید با http یا https شروع شود.` };
        }
        return { ok: true };
    } catch {
        return { ok: false, message: `${label} معتبر نیست.` };
    }
};

export const normalizeWebsiteUrl = (value: string) => {
    const url = value.trim();
    if (!url) return "";
    return /^[a-z][a-z\d+.-]*:\/\//i.test(url) ? url : `https://${url}`;
};

export const validateWebsiteUrl = (value: string): ValidationResult => {
    const normalized = normalizeWebsiteUrl(value);
    if (!normalized) {
        return { ok: false, message: "آدرس وب‌سایت را وارد کن." };
    }
    if (normalized.length > 500 || /\s/.test(normalized)) {
        return { ok: false, message: "آدرس وب‌سایت معتبر نیست؛ مثل https://chinverse.ir" };
    }

    try {
        const parsed = new URL(normalized);
        const hostname = parsed.hostname.toLowerCase();
        const labels = hostname.split(".");
        const validLabels = labels.every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label));
        const validTld = /^[a-z]{2,63}$/i.test(labels.at(-1) || "") || (labels.at(-1) || "").startsWith("xn--");

        if (
            !["http:", "https:"].includes(parsed.protocol)
            || parsed.username
            || parsed.password
            || labels.length < 2
            || !validLabels
            || !validTld
        ) {
            return { ok: false, message: "آدرس وب‌سایت معتبر نیست؛ مثل https://chinverse.ir" };
        }
        return { ok: true };
    } catch {
        return { ok: false, message: "آدرس وب‌سایت معتبر نیست؛ مثل https://chinverse.ir" };
    }
};

export const validateJsonObject = (value: string, label: string): ValidationResult => {
    const cleanValue = value.trim();
    if (!cleanValue) return { ok: true };

    try {
        const parsed = JSON.parse(cleanValue);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            return { ok: false, message: `${label} باید یک JSON object معتبر باشد.` };
        }
        return { ok: true };
    } catch {
        return { ok: false, message: `${label} JSON معتبر نیست.` };
    }
};

export const parseJsonObject = (value: string): Record<string, unknown> => {
    const cleanValue = value.trim();
    if (!cleanValue) return {};
    return JSON.parse(cleanValue) as Record<string, unknown>;
};

export const validateNonNegativeNumber = (
    value: string,
    label: string,
    options: { max?: number } = {},
): ValidationResult => {
    const normalized = normalizeDigits(value).trim();
    if (!normalized) return { ok: false, message: `${label} را وارد کن.` };
    const numberValue = Number(normalized);
    if (!Number.isFinite(numberValue) || numberValue < 0) {
        return { ok: false, message: `${label} باید عدد مثبت باشد.` };
    }
    if (options.max !== undefined && numberValue > options.max) {
        return { ok: false, message: `${label} نباید بیشتر از ${options.max} باشد.` };
    }
    return { ok: true };
};
