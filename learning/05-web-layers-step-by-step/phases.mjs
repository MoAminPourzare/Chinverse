import { fileURLToPath } from "node:url";
import { join } from "node:path";

export const courseRoot = fileURLToPath(new URL(".", import.meta.url));
export const phases = [
    {
        "id": "01",
        "folder": "01-html",
        "title": "ساخت یک صفحهٔ ثابت با HTML"
    },
    {
        "id": "02",
        "folder": "02-css",
        "title": "اضافه‌کردن ظاهر با CSS"
    },
    {
        "id": "03",
        "folder": "03-javascript-dom",
        "title": "یک رفتار کوچک با JavaScript و DOM"
    },
    {
        "id": "04",
        "folder": "04-react-jsx",
        "title": "بازسازی نمای ثابت با React و JSX"
    },
    {
        "id": "05",
        "folder": "05-data-and-lists",
        "title": "ساخت فهرست رابط از داده"
    },
    {
        "id": "06",
        "folder": "06-components-props",
        "title": "استخراج کارت و دادن props"
    },
    {
        "id": "07",
        "folder": "07-selection-state",
        "title": "انتخاب مشترک با state و callback"
    },
    {
        "id": "08",
        "folder": "08-search",
        "title": "جست‌وجو و دادهٔ مشتق‌شده"
    },
    {
        "id": "09",
        "folder": "09-typescript",
        "title": "اضافه‌کردن قراردادهای TypeScript"
    },
    {
        "id": "10",
        "folder": "10-complete",
        "title": "نسخهٔ کامل با ابزار مشاهده و مقایسه"
    }
];

export function resolvePhase(input = "practice") {
    if (input === "practice") return { id: "practice", folder: "practice", title: "تمرین خودت", root: join(courseRoot, "practice") };
    const phase = phases.find((item) => item.id === input || item.folder === input);
    if (!phase) throw new Error("فاز نامعتبر است. از 01 تا 10 یا practice استفاده کن.");
    return { ...phase, root: join(courseRoot, phase.folder) };
}
