"use client";

import { useEffect, useMemo, useState } from "react";
import type React from "react";
import Link from "next/link";
import {
    BookOpen,
    AlertTriangle,
    CheckCircle2,
    Database,
    Download,
    FileText,
    Flag,
    Layers3,
    Loader2,
    Plus,
    RefreshCw,
    Save,
    Search,
    ShieldCheck,
    Trash2,
    Upload,
    Users,
    Video,
} from "lucide-react";
import { adminService, type AdminDictionaryImportResult, type AdminDictionaryWord, type AdminOverview, type AdminUserSummary } from "@/lib/admin";
import { contentAdminService } from "@/lib/content-admin";
import { fetchAllCourses, fetchCourseTaxonomy, type CategorySummary, type Course } from "@/lib/courses";
import { isHttpStatus } from "@/lib/http";
import Surface from "@/components/ui/Surface";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { BackButton } from "@/components/ui/IconButton";
import {
    normalizeDigits,
    parseJsonObject,
    validateJsonObject,
    validateNonNegativeNumber,
    validateTextLength,
    validateUrl,
    validationMessage,
} from "@/validation";
import { cn } from "@/lib/cn";

type AdminTab = "dashboard" | "content" | "dictionary" | "import" | "users";

const tabs: Array<{ id: AdminTab; label: string; icon: typeof ShieldCheck }> = [
    { id: "dashboard", label: "داشبورد", icon: ShieldCheck },
    { id: "content", label: "محتوا و ویدیو", icon: Video },
    { id: "dictionary", label: "دیکشنری", icon: Database },
    { id: "import", label: "ورود فایل", icon: Upload },
    { id: "users", label: "کاربران", icon: Users },
];

const emptyJson = "{}";
const fieldClass = "w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#155aa6] focus:ring-4 focus:ring-[#155aa6]/12";
const textAreaClass = `${fieldClass} min-h-24 resize-y leading-7`;
const panelClass = "border-white/80 bg-white/90 shadow-[0_18px_48px_rgba(15,23,42,0.08)]";

const emptyWordForm = {
    id: 0,
    chinese: "",
    pinyin: "",
    level: "custom",
    hsk_level: "",
    source: "manual",
    source_word_id: "",
    status: "published",
    audio_url: "",
    persian_meaning: "",
    chinese_meaning: "",
    composition: "",
    notes: "",
    definitions_text: "",
    examples_text: "",
    collocations_text: "",
};

function validateSlug(value: string) {
    const slug = value.trim();
    if (!slug) return "نامک دوره را وارد کن.";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        return "نامک فقط می‌تواند شامل حروف انگلیسی کوچک، عدد و خط تیره باشد.";
    }
    return "";
}

function parsePipeRows<T>(value: string, mapper: (parts: string[]) => T | null): T[] {
    return value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => mapper(line.split("|").map((part) => part.trim())))
        .filter((item): item is T => Boolean(item));
}

function formatDate(value?: string) {
    if (!value) return "";
    return new Date(value).toLocaleDateString("fa-IR", { month: "short", day: "numeric" });
}

function toPersianDigits(value: string | number) {
    const digits = "۰۱۲۳۴۵۶۷۸۹";
    return String(value).replace(/\d/g, (digit) => digits[Number(digit)]);
}

type DictionaryMissingKey = "pinyin" | "audio" | "persian" | "chinese" | "composition" | "definitions" | "examples" | "collocations" | "notes";

const dictionaryMissingOptions: Array<{ key: DictionaryMissingKey; label: string }> = [
    { key: "pinyin", label: "پین‌یین" },
    { key: "audio", label: "صدا" },
    { key: "persian", label: "معنی فارسی" },
    { key: "chinese", label: "معنی چینی" },
    { key: "composition", label: "ترکیب واژگانی" },
    { key: "definitions", label: "تعریف‌ها" },
    { key: "examples", label: "مثال‌ها" },
    { key: "collocations", label: "ترکیب‌ها" },
    { key: "notes", label: "یادداشت" },
];

function isBlank(value?: string | null) {
    return !value || !value.trim();
}

function getDictionaryMissingFields(word: AdminDictionaryWord): DictionaryMissingKey[] {
    const missing: DictionaryMissingKey[] = [];
    if (isBlank(word.pinyin)) missing.push("pinyin");
    if (isBlank(word.audio_url)) missing.push("audio");
    if (isBlank(word.persian_meaning)) missing.push("persian");
    if (isBlank(word.chinese_meaning)) missing.push("chinese");
    if (isBlank(word.composition)) missing.push("composition");
    if (!word.definitions?.length) missing.push("definitions");
    if (!word.examples?.length) missing.push("examples");
    if (!word.collocations?.length) missing.push("collocations");
    if (isBlank(word.notes)) missing.push("notes");
    return missing;
}

function getMissingLabel(key: DictionaryMissingKey) {
    return dictionaryMissingOptions.find((item) => item.key === key)?.label || key;
}

function getDictionaryReviewStats(words: AdminDictionaryWord[]) {
    const withMissing = words.filter((word) => getDictionaryMissingFields(word).length > 0).length;
    const complete = Math.max(words.length - withMissing, 0);
    const missingAudio = words.filter((word) => isBlank(word.audio_url)).length;
    return { total: words.length, complete, withMissing, missingAudio };
}

export default function AdminPanelPage() {
    const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
    const [overview, setOverview] = useState<AdminOverview | null>(null);
    const [users, setUsers] = useState<AdminUserSummary[]>([]);
    const [words, setWords] = useState<AdminDictionaryWord[]>([]);
    const [categories, setCategories] = useState<CategorySummary[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState("");
    const [message, setMessage] = useState("");
    const [accessError, setAccessError] = useState("");
    const [needsMfaEnrollment, setNeedsMfaEnrollment] = useState(false);
    const [dictionarySearch, setDictionarySearch] = useState("");
    const [userSearch, setUserSearch] = useState("");
    const [importResult, setImportResult] = useState<AdminDictionaryImportResult | null>(null);

    const [courseForm, setCourseForm] = useState({
        subcategory_id: "",
        title: "",
        slug: "",
        description: "",
        cover_image_url: "",
        level: "beginner",
        metadata_json: emptyJson,
    });

    const [sectionForm, setSectionForm] = useState({
        course_id: "",
        title: "",
        order_index: "0",
        metadata_json: emptyJson,
    });

    const [lessonForm, setLessonForm] = useState({
        course_id: "",
        section_id: "",
        title: "",
        duration_minutes: "0",
        video_url: "",
        thumbnail_url: "",
        is_free: false,
        metadata_json: JSON.stringify(
            {
                transcript: [
                    {
                        id: 1,
                        start: 0,
                        end: 3.5,
                        chinese: "示例字幕",
                        persian: "نمونه زیرنویس",
                        highlightedWords: ["示例"],
                    },
                    {
                        id: 2,
                        start: 3.5,
                        end: 7,
                        chinese: "视频播放时，字幕会自动滚动。",
                        persian: "وقتی ویدیو پخش می‌شود، زیرنویس خودکار اسکرول می‌کند.",
                        highlightedWords: ["字幕", "自动"],
                    },
                ],
            },
            null,
            2,
        ),
    });

    const [wordForm, setWordForm] = useState(emptyWordForm);

    const selectedCourse = useMemo(() => {
        const courseId = Number(lessonForm.course_id || sectionForm.course_id || courses[0]?.id || 0);
        return courses.find((course) => course.id === courseId) || courses[0] || null;
    }, [courses, lessonForm.course_id, sectionForm.course_id]);

    const selectedSections = selectedCourse?.sections || [];
    const totalLessons = courses.reduce((total, course) => total + (course.sections?.reduce((sum, section) => sum + (section.lessons?.length || 0), 0) || 0), 0);

    const loadAdminData = async () => {
        setLoading(true);
        setAccessError("");
        setNeedsMfaEnrollment(false);
        setMessage("");
        try {
            const access = await adminService.getAdminAccess();
            if (!access.is_admin) {
                setAccessError("این حساب نقش مدیر ندارد.");
                return;
            }
            if (!access.mfa_enabled || !access.mfa_verified) {
                setNeedsMfaEnrollment(!access.mfa_enabled);
                setAccessError(
                    access.mfa_enabled
                        ? "برای ورود به پنل، دوباره با کد احراز هویت دومرحله‌ای وارد شو."
                        : "پیش از ورود به پنل، احراز هویت دومرحله‌ای مدیر را فعال کن.",
                );
                return;
            }
            const overviewData = await adminService.getOverview();
            const [userResult, wordResult, taxonomyResult, courseResult] = await Promise.allSettled([
                adminService.listUsers(userSearch),
                adminService.listDictionary(dictionarySearch),
                fetchCourseTaxonomy(),
                fetchAllCourses(),
            ]);
            setOverview(overviewData);
            setUsers(userResult.status === "fulfilled" ? userResult.value : []);
            setWords(wordResult.status === "fulfilled" ? wordResult.value : []);
            setCategories(taxonomyResult.status === "fulfilled" ? taxonomyResult.value : []);
            setCourses(courseResult.status === "fulfilled" ? courseResult.value : []);

            const failedSections = [userResult, wordResult, taxonomyResult, courseResult].filter((result) => result.status === "rejected");
            if (failedSections.length) {
                console.error("Some admin sections failed to load:", failedSections);
                setMessage("پنل ادمین باز شد، اما بعضی بخش‌ها کامل لود نشدند. صفحه را refresh کن یا لاگ بک‌اند را چک کن.");
            }
        } catch (error) {
            console.error("Failed to load admin panel:", error);
            setAccessError(isHttpStatus(error, 401) || isHttpStatus(error, 403) ? "برای ورود به پنل مدیریت، وارد حساب مدیر تاییدشده شو." : "پنل ادمین باز نشد. اتصال یا سرور را بررسی کن.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadAdminData();
        // Initial panel bootstrap should not refetch on search-field edits.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!courses.length) return;
        setSectionForm((current) => current.course_id ? current : { ...current, course_id: String(courses[0].id) });
        setLessonForm((current) => current.course_id ? current : { ...current, course_id: String(courses[0].id) });
    }, [courses]);

    useEffect(() => {
        if (!selectedCourse || lessonForm.section_id) return;
        const firstSection = selectedCourse.sections?.[0];
        if (firstSection) {
            setLessonForm((current) => ({ ...current, section_id: String(firstSection.id) }));
        }
    }, [lessonForm.section_id, selectedCourse]);

    const refreshDictionary = async () => {
        setSaving("dictionary-refresh");
        try {
            const loadedWords = await adminService.listDictionary(dictionarySearch, { limit: 1000 });
            setWords(loadedWords);
            setMessage(`${toPersianDigits(loadedWords.length)} کلمه از دیکشنری بارگذاری شد.`);
        } catch (error) {
            console.error("Failed to refresh dictionary", error);
            setMessage("بارگذاری کلمات دیکشنری انجام نشد. بک‌اند را ری‌استارت کن و دوباره تلاش کن.");
        } finally {
            setSaving("");
        }
    };

    const refreshUsers = async () => {
        setUsers(await adminService.listUsers(userSearch));
    };

    const updateUserRole = async (userId: number, role: AdminUserSummary["role"]) => {
        setSaving(`user-role:${userId}`);
        setMessage("");
        try {
            const updated = await adminService.updateUserRole(userId, role);
            setUsers((current) => current.map((user) => user.id === userId ? updated : user));
            setMessage("نقش کاربر تغییر کرد و نشست‌های قبلی او بسته شد.");
        } catch (error) {
            console.error("Failed to update user role", error);
            setMessage("تغییر نقش انجام نشد؛ نقش خود مدیر از داخل پنل قابل تغییر نیست.");
        } finally {
            setSaving("");
        }
    };

    const updateUserStatus = async (userId: number, status: "active" | "suspended") => {
        if (status === "suspended" && !window.confirm("این حساب تعلیق و همه نشست‌هایش بسته شود؟")) return;
        setSaving(`user-status:${userId}`);
        setMessage("");
        try {
            const updated = await adminService.updateUserStatus(userId, status);
            setUsers((current) => current.map((user) => user.id === userId ? updated : user));
            setMessage(status === "active" ? "حساب دوباره فعال شد." : "حساب تعلیق و نشست‌های آن بسته شد.");
        } catch (error) {
            console.error("Failed to update user status", error);
            setMessage("تغییر وضعیت انجام نشد؛ وضعیت حساب خود مدیر از داخل پنل قابل تغییر نیست.");
        } finally {
            setSaving("");
        }
    };

    useEffect(() => {
        if (activeTab !== "dictionary") return;
        void refreshDictionary();
        // Dictionary tab should always pull the latest DB data when opened.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const updateCourse = (updatedCourse: Course) => {
        setCourses((current) => {
            const exists = current.some((course) => course.id === updatedCourse.id);
            return exists ? current.map((course) => course.id === updatedCourse.id ? updatedCourse : course) : [updatedCourse, ...current];
        });
    };

    const handleCreateCourse = async () => {
        const validationError =
            (!courseForm.subcategory_id ? "زیرمجموعه دوره را انتخاب کن." : "") ||
            validationMessage(validateTextLength(courseForm.title, "عنوان دوره", { required: true, min: 2, max: 180 })) ||
            validateSlug(courseForm.slug) ||
            validationMessage(validateTextLength(courseForm.description, "توضیحات دوره", { required: true, min: 10, max: 8000 })) ||
            validationMessage(validateUrl(courseForm.cover_image_url, "آدرس تصویر کاور", { required: true, allowRelative: true })) ||
            validationMessage(validateJsonObject(courseForm.metadata_json, "اطلاعات تکمیلی دوره"));
        if (validationError) return setMessage(validationError);

        setSaving("course");
        try {
            const created = await contentAdminService.createCourse({
                subcategory_id: Number(courseForm.subcategory_id),
                title: courseForm.title.trim(),
                slug: courseForm.slug.trim(),
                description: courseForm.description.trim(),
                cover_image_url: courseForm.cover_image_url.trim(),
                level: courseForm.level,
                metadata_json: parseJsonObject(courseForm.metadata_json),
            });
            updateCourse(created);
            setCourseForm((current) => ({ ...current, title: "", slug: "", description: "", cover_image_url: "", metadata_json: emptyJson }));
            setSectionForm((current) => ({ ...current, course_id: String(created.id) }));
            setLessonForm((current) => ({ ...current, course_id: String(created.id) }));
            setMessage("دوره ساخته شد.");
        } catch (error) {
            console.error("Failed to create course", error);
            setMessage("ساخت دوره انجام نشد.");
        } finally {
            setSaving("");
        }
    };

    const handleCreateSection = async () => {
        const courseId = Number(sectionForm.course_id);
        const validationError =
            (!courseId ? "اول یک دوره انتخاب کن." : "") ||
            validationMessage(validateTextLength(sectionForm.title, "عنوان بخش", { required: true, min: 1, max: 180 })) ||
            validationMessage(validateNonNegativeNumber(sectionForm.order_index, "ترتیب نمایش", { max: 9999 })) ||
            validationMessage(validateJsonObject(sectionForm.metadata_json, "اطلاعات تکمیلی بخش"));
        if (validationError) return setMessage(validationError);

        setSaving("section");
        try {
            const updated = await contentAdminService.createSection(courseId, {
                title: sectionForm.title.trim(),
                order_index: Number(normalizeDigits(sectionForm.order_index || "0")),
                metadata_json: parseJsonObject(sectionForm.metadata_json),
            });
            updateCourse(updated);
            const createdSectionId = updated.sections?.[updated.sections.length - 1]?.id;
            setSectionForm((current) => ({ ...current, title: "", order_index: "0", metadata_json: emptyJson }));
            setLessonForm((current) => ({ ...current, section_id: createdSectionId ? String(createdSectionId) : current.section_id }));
            setMessage("بخش ساخته شد.");
        } catch (error) {
            console.error("Failed to create section", error);
            setMessage("ساخت بخش انجام نشد.");
        } finally {
            setSaving("");
        }
    };

    const handleCreateLesson = async () => {
        const sectionId = Number(lessonForm.section_id);
        const validationError =
            (!sectionId ? "اول یک بخش انتخاب کن." : "") ||
            validationMessage(validateTextLength(lessonForm.title, "عنوان درس", { required: true, min: 1, max: 180 })) ||
            validationMessage(validateNonNegativeNumber(lessonForm.duration_minutes, "مدت زمان درس", { max: 1000 })) ||
            validationMessage(validateUrl(lessonForm.video_url, "آدرس ویدیو", { required: true, allowRelative: true })) ||
            (lessonForm.thumbnail_url ? validationMessage(validateUrl(lessonForm.thumbnail_url, "تصویر ویدیو", { allowRelative: true })) : "") ||
            validationMessage(validateJsonObject(lessonForm.metadata_json, "اطلاعات و transcript درس"));
        if (validationError) return setMessage(validationError);

        setSaving("lesson");
        try {
            const updated = await contentAdminService.createLesson(sectionId, {
                title: lessonForm.title.trim(),
                duration_minutes: Number(normalizeDigits(lessonForm.duration_minutes || "0")),
                video_url: lessonForm.video_url.trim(),
                thumbnail_url: lessonForm.thumbnail_url.trim() || null,
                is_free: lessonForm.is_free,
                metadata_json: parseJsonObject(lessonForm.metadata_json),
            });
            updateCourse(updated);
            setLessonForm((current) => ({ ...current, title: "", duration_minutes: "0", video_url: "", thumbnail_url: "" }));
            setMessage("درس و ویدیو ساخته شد.");
        } catch (error) {
            console.error("Failed to create lesson", error);
            setMessage("ساخت درس انجام نشد.");
        } finally {
            setSaving("");
        }
    };

    const wordPayload = () => ({
        chinese: wordForm.chinese.trim(),
        pinyin: wordForm.pinyin.trim(),
        audio_url: wordForm.audio_url.trim() || null,
        level: wordForm.level.trim() || "custom",
        hsk_level: wordForm.hsk_level.trim() ? Number(wordForm.hsk_level.trim()) : null,
        source: wordForm.source.trim() || "manual",
        source_word_id: wordForm.source_word_id.trim() || null,
        status: wordForm.status.trim() || "published",
        persian_meaning: wordForm.persian_meaning.trim() || null,
        chinese_meaning: wordForm.chinese_meaning.trim() || null,
        composition: wordForm.composition.trim() || null,
        notes: wordForm.notes.trim() || null,
        definitions: parsePipeRows(wordForm.definitions_text, ([part, definition, lang, sense, notes]) =>
            definition ? { part_of_speech: part || "unknown", definition_text: definition, lang_code: lang || "fa", sense_order: Number(sense || 1), notes: notes || null } : null
        ),
        examples: parsePipeRows(wordForm.examples_text, ([zh, pinyin, target, sense]) =>
            zh ? { zh_text: zh, pinyin: pinyin || "", target_text: target || "", sense_order: Number(sense || 1) } : null
        ),
        collocations: parsePipeRows(wordForm.collocations_text, ([zh, pinyin, target, sense]) =>
            zh ? { phrase_zh: zh, phrase_pinyin: pinyin || "", translation_target: target || "", sense_order: Number(sense || 1) } : null
        ),
    });

    const handleSaveWord = async () => {
        const validationError =
            validationMessage(validateTextLength(wordForm.chinese, "کلمه چینی", { required: true, min: 1, max: 80 })) ||
            validationMessage(validateTextLength(wordForm.pinyin, "پین‌یین", { max: 160 })) ||
            validationMessage(validateTextLength(wordForm.persian_meaning, "معنی فارسی", { max: 4000 }));
        if (validationError) return setMessage(validationError);

        setSaving("word");
        try {
            const saved = wordForm.id
                ? await adminService.updateDictionaryWord(wordForm.id, wordPayload())
                : await adminService.createDictionaryWord(wordPayload());
            setWords((current) => [saved, ...current.filter((word) => word.id !== saved.id)]);
            setWordForm(emptyWordForm);
            setMessage("کلمه ذخیره شد.");
        } catch (error) {
            console.error("Failed to save dictionary word", error);
            setMessage("ذخیره کلمه انجام نشد.");
        } finally {
            setSaving("");
        }
    };

    const editWord = (word: AdminDictionaryWord) => {
        setWordForm({
            id: word.id,
            chinese: word.chinese || "",
            pinyin: word.pinyin || "",
            level: word.level || "custom",
            hsk_level: word.hsk_level ? String(word.hsk_level) : "",
            source: word.source || "manual",
            source_word_id: word.source_word_id || "",
            status: word.status || "published",
            audio_url: word.audio_url || "",
            persian_meaning: word.persian_meaning || "",
            chinese_meaning: word.chinese_meaning || "",
            composition: word.composition || "",
            notes: word.notes || "",
            definitions_text: word.definitions.map((item) => `${item.part_of_speech} | ${item.definition_text} | ${item.lang_code} | ${item.sense_order || 1} | ${item.notes || ""}`).join("\n"),
            examples_text: word.examples.map((item) => `${item.zh_text} | ${item.pinyin} | ${item.target_text} | ${item.sense_order || 1}`).join("\n"),
            collocations_text: word.collocations.map((item) => `${item.phrase_zh} | ${item.phrase_pinyin} | ${item.translation_target} | ${item.sense_order || 1}`).join("\n"),
        });
        setActiveTab("dictionary");
    };

    const deleteWord = async (word: AdminDictionaryWord) => {
        if (!window.confirm(`کلمه ${word.chinese} حذف شود؟`)) return;
        await adminService.deleteDictionaryWord(word.id);
        setWords((current) => current.filter((item) => item.id !== word.id));
        setMessage("کلمه حذف شد.");
    };

    const handleImportDictionaryFile = async (file: File | null) => {
        if (!file) return;
        setSaving("dictionary-import");
        setImportResult(null);
        try {
            const result = await adminService.importDictionaryFile(file);
            setImportResult(result);
            setWords((current) => [
                ...result.imported_words,
                ...current.filter((word) => !result.imported_words.some((imported) => imported.id === word.id)),
            ]);
            setMessage(`${toPersianDigits(result.created)} کلمه ساخته شد، ${toPersianDigits(result.updated)} کلمه آپدیت شد، ${toPersianDigits(result.failed)} ردیف خطا داشت.`);
        } catch (error) {
            console.error("Failed to import dictionary file", error);
            setMessage("ورود فایل دیکشنری انجام نشد. فرمت CSV/JSON و لاگ بک‌اند را بررسی کن.");
        } finally {
            setSaving("");
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-full items-center justify-center bg-[#f7f8fb]" dir="rtl">
                <div className="flex items-center gap-3 rounded-[24px] bg-white px-5 py-4 text-sm font-bold text-slate-500 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                    <Loader2 className="h-5 w-5 animate-spin text-[#155aa6]" />
                    پنل ادمین در حال آماده‌سازی است…
                </div>
            </div>
        );
    }

    if (accessError) {
        return (
            <div className="min-h-full bg-[#f7f8fb] px-4 py-6" dir="rtl">
                <div className="mx-auto max-w-[520px] rounded-[28px] bg-white p-6 text-center shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                    <ShieldCheck className="mx-auto h-10 w-10 text-[#155aa6]" />
                    <h1 className="mt-4 text-xl font-black text-slate-950">دسترسی امن مدیر لازم است</h1>
                    <p className="mt-3 text-sm leading-7 text-slate-500">{accessError}</p>
                    <Link href={needsMfaEnrollment ? "/account/security" : "/login?next=/admin"} className="mt-5 inline-flex rounded-2xl bg-[#155aa6] px-5 py-3 text-sm font-black text-white">
                        {needsMfaEnrollment ? "تنظیم امنیت حساب" : "ورود مدیر"}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-[#f7f8fb] pb-10" dir="rtl">
            <header className="sticky top-0 z-30 border-b border-white/70 bg-white/88 px-4 py-3 shadow-[0_12px_34px_rgba(15,23,42,0.06)] backdrop-blur-xl">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <BackButton href="/" />
                        <div>
                            <h1 className="text-lg font-black text-slate-950">پنل ادمین چین‌ورس</h1>
                            <p className="text-xs font-bold text-slate-400">محتوا، ویدیو، دیکشنری و کاربران</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/moderation" title="گزارش‌ها" aria-label="مدیریت گزارش‌ها" className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100">
                            <Flag size={17} />
                        </Link>
                        <button
                            type="button"
                            onClick={loadAdminData}
                            className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-200"
                        >
                            <RefreshCw size={15} />
                            تازه‌سازی
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 py-5">
                <nav className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "inline-flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black transition",
                                    active ? "bg-[#155aa6] text-white shadow-[0_12px_28px_rgba(21,90,166,0.24)]" : "bg-white text-slate-600 hover:bg-[#eef6ff] hover:text-[#155aa6]",
                                )}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>

                {message && (
                    <div className="mb-5 rounded-[20px] border border-[#155aa6]/10 bg-[#eef6ff] px-4 py-3 text-sm font-bold leading-7 text-[#155aa6]">
                        {message}
                    </div>
                )}

                <div className="tab-content-motion">
                    {activeTab === "dashboard" && (
                        <DashboardTab overview={overview} courses={courses.length} lessons={totalLessons} words={words} users={users} onEditWord={editWord} />
                    )}

                    {activeTab === "content" && (
                        <ContentTab
                            categories={categories}
                            courses={courses}
                            selectedSections={selectedSections}
                            courseForm={courseForm}
                            sectionForm={sectionForm}
                            lessonForm={lessonForm}
                            saving={saving}
                            setCourseForm={setCourseForm}
                            setSectionForm={setSectionForm}
                            setLessonForm={setLessonForm}
                            onCreateCourse={handleCreateCourse}
                            onCreateSection={handleCreateSection}
                            onCreateLesson={handleCreateLesson}
                        />
                    )}

                    {activeTab === "dictionary" && (
                        <DictionaryTab
                            words={words}
                            wordForm={wordForm}
                            saving={saving}
                            search={dictionarySearch}
                            setSearch={setDictionarySearch}
                            setWordForm={setWordForm}
                            onRefresh={refreshDictionary}
                            onSave={handleSaveWord}
                            onEdit={editWord}
                            onDelete={deleteWord}
                        />
                    )}

                    {activeTab === "import" && (
                        <ImportTab
                            saving={saving}
                            result={importResult}
                            onImport={handleImportDictionaryFile}
                        />
                    )}

                    {activeTab === "users" && (
                        <UsersTab
                            users={users}
                            search={userSearch}
                            setSearch={setUserSearch}
                            onRefresh={refreshUsers}
                            saving={saving}
                            onRoleChange={updateUserRole}
                            onStatusChange={updateUserStatus}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}

function DashboardTab({
    overview,
    courses,
    lessons,
    words,
    users,
    onEditWord,
}: {
    overview: AdminOverview | null;
    courses: number;
    lessons: number;
    words: AdminDictionaryWord[];
    users: AdminUserSummary[];
    onEditWord: (word: AdminDictionaryWord) => void;
}) {
    const fallbackStats = [
        { key: "courses", label: "دوره‌ها", value: courses },
        { key: "lessons", label: "درس‌ها", value: lessons },
        { key: "words", label: "کلمات", value: words.length },
        { key: "users", label: "کاربران", value: users.length },
    ];
    const stats = overview?.stats?.length ? overview.stats : fallbackStats;

    return (
        <div className="motion-list space-y-5">
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {stats.map((stat) => (
                    <Surface key={stat.key} className={cn(panelClass, "p-4")}>
                        <p className="text-xs font-black text-slate-400">{stat.label}</p>
                        <p className="mt-2 text-3xl font-black text-slate-950">{toPersianDigits(stat.value)}</p>
                    </Surface>
                ))}
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                <AdminList title="آخرین دوره‌ها" icon={<BookOpen size={18} />}>
                    {(overview?.recent_courses || []).map((course) => (
                        <div key={course.id} className="rounded-2xl bg-slate-50 px-3 py-2">
                            <p className="line-clamp-1 text-sm font-black text-slate-900">{course.title}</p>
                            <p className="text-xs font-bold text-slate-400">{course.slug} · {formatDate(course.created_at)}</p>
                        </div>
                    ))}
                </AdminList>
                <AdminList title="آخرین کلمات" icon={<Database size={18} />}>
                    {words.slice(0, 6).map((word) => (
                        <button key={word.id} type="button" onClick={() => onEditWord(word)} className="w-full rounded-2xl bg-slate-50 px-3 py-2 text-right transition hover:bg-[#eef6ff]">
                            <p className="font-cjk text-base font-black text-slate-900" dir="ltr">{word.chinese}</p>
                            <p className="text-xs font-bold text-slate-400">{word.pinyin || word.level}</p>
                        </button>
                    ))}
                </AdminList>
                <AdminList title="کاربران جدید" icon={<Users size={18} />}>
                    {users.slice(0, 6).map((user) => (
                        <div key={user.id} className="rounded-2xl bg-slate-50 px-3 py-2">
                            <p className="line-clamp-1 text-sm font-black text-slate-900">{user.display_name || user.email}</p>
                            <p className="text-xs font-bold text-slate-400">{formatDate(user.created_at)} · {user.status}</p>
                        </div>
                    ))}
                </AdminList>
            </section>
        </div>
    );
}

function ContentTab(props: {
    categories: CategorySummary[];
    courses: Course[];
    selectedSections: NonNullable<Course["sections"]>;
    courseForm: Record<string, string>;
    sectionForm: Record<string, string>;
    lessonForm: {
        course_id: string;
        section_id: string;
        title: string;
        duration_minutes: string;
        video_url: string;
        thumbnail_url: string;
        is_free: boolean;
        metadata_json: string;
    };
    saving: string;
    setCourseForm: React.Dispatch<React.SetStateAction<{
        subcategory_id: string;
        title: string;
        slug: string;
        description: string;
        cover_image_url: string;
        level: string;
        metadata_json: string;
    }>>;
    setSectionForm: React.Dispatch<React.SetStateAction<{
        course_id: string;
        title: string;
        order_index: string;
        metadata_json: string;
    }>>;
    setLessonForm: React.Dispatch<React.SetStateAction<{
        course_id: string;
        section_id: string;
        title: string;
        duration_minutes: string;
        video_url: string;
        thumbnail_url: string;
        is_free: boolean;
        metadata_json: string;
    }>>;
    onCreateCourse: () => void;
    onCreateSection: () => void;
    onCreateLesson: () => void;
}) {
    const { categories, courses, selectedSections, courseForm, sectionForm, lessonForm, saving, setCourseForm, setSectionForm, setLessonForm, onCreateCourse, onCreateSection, onCreateLesson } = props;
    return (
        <div className="motion-list grid gap-4 xl:grid-cols-3">
            <Surface className={cn(panelClass, "p-4")}>
                <PanelTitle icon={<BookOpen size={18} />} title="ساخت دوره" subtitle="اول دوره را به یک زیرمجموعه وصل کن." />
                <div className="mt-4 space-y-3">
                    <select value={courseForm.subcategory_id} onChange={(e) => setCourseForm((current) => ({ ...current, subcategory_id: e.target.value }))} className={fieldClass}>
                        <option value="">زیرمجموعه</option>
                        {categories.map((category) => (
                            <optgroup key={category.id} label={category.name}>
                                {category.subcategories.map((subcategory) => (
                                    <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                    <input value={courseForm.title} onChange={(e) => setCourseForm((current) => ({ ...current, title: e.target.value }))} className={fieldClass} placeholder="عنوان دوره" />
                    <input value={courseForm.slug} onChange={(e) => setCourseForm((current) => ({ ...current, slug: e.target.value }))} className={fieldClass} placeholder="slug-example" dir="ltr" />
                    <select value={courseForm.level} onChange={(e) => setCourseForm((current) => ({ ...current, level: e.target.value }))} className={fieldClass}>
                        <option value="beginner">مقدماتی</option>
                        <option value="intermediate">متوسط</option>
                        <option value="advanced">پیشرفته</option>
                    </select>
                    <textarea value={courseForm.description} onChange={(e) => setCourseForm((current) => ({ ...current, description: e.target.value }))} className={textAreaClass} placeholder="توضیحات" />
                    <input value={courseForm.cover_image_url} onChange={(e) => setCourseForm((current) => ({ ...current, cover_image_url: e.target.value }))} className={fieldClass} placeholder="آدرس تصویر کاور" dir="ltr" />
                    <textarea value={courseForm.metadata_json} onChange={(e) => setCourseForm((current) => ({ ...current, metadata_json: e.target.value }))} className={`${textAreaClass} font-mono`} dir="ltr" />
                    <PrimaryButton onClick={onCreateCourse} disabled={saving === "course"} className="w-full" leadingIcon={saving === "course" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}>ساخت دوره</PrimaryButton>
                </div>
            </Surface>

            <Surface className={cn(panelClass, "p-4")}>
                <PanelTitle icon={<Layers3 size={18} />} title="ساخت بخش" subtitle="بخش‌ها درس‌ها را مرتب می‌کنند." />
                <div className="mt-4 space-y-3">
                    <CourseSelect courses={courses} value={sectionForm.course_id} onChange={(value) => setSectionForm((current) => ({ ...current, course_id: value }))} />
                    <input value={sectionForm.title} onChange={(e) => setSectionForm((current) => ({ ...current, title: e.target.value }))} className={fieldClass} placeholder="عنوان بخش" />
                    <input value={sectionForm.order_index} onChange={(e) => setSectionForm((current) => ({ ...current, order_index: e.target.value }))} className={fieldClass} placeholder="ترتیب نمایش" type="number" />
                    <textarea value={sectionForm.metadata_json} onChange={(e) => setSectionForm((current) => ({ ...current, metadata_json: e.target.value }))} className={`${textAreaClass} font-mono`} dir="ltr" />
                    <PrimaryButton onClick={onCreateSection} disabled={saving === "section"} className="w-full" leadingIcon={saving === "section" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}>ساخت بخش</PrimaryButton>
                </div>
            </Surface>

            <Surface className={cn(panelClass, "p-4")}>
                <PanelTitle icon={<Video size={18} />} title="افزودن ویدیو/درس" subtitle="ویدیو فعلا می‌تواند URL خارجی یا مسیر آپلود باشد." />
                <div className="mt-4 space-y-3">
                    <CourseSelect
                        courses={courses}
                        value={lessonForm.course_id}
                        onChange={(value) => {
                            const nextCourse = courses.find((course) => course.id === Number(value));
                            setLessonForm((current) => ({
                                ...current,
                                course_id: value,
                                section_id: nextCourse?.sections?.[0]?.id ? String(nextCourse.sections[0].id) : "",
                            }));
                        }}
                    />
                    <select value={lessonForm.section_id} onChange={(e) => setLessonForm((current) => ({ ...current, section_id: e.target.value }))} className={fieldClass}>
                        <option value="">بخش</option>
                        {selectedSections.map((section) => (
                            <option key={section.id} value={section.id}>{section.title}</option>
                        ))}
                    </select>
                    <input value={lessonForm.title} onChange={(e) => setLessonForm((current) => ({ ...current, title: e.target.value }))} className={fieldClass} placeholder="عنوان درس" />
                    <input value={lessonForm.video_url} onChange={(e) => setLessonForm((current) => ({ ...current, video_url: e.target.value }))} className={fieldClass} placeholder="آدرس ویدیو" dir="ltr" />
                    <input value={lessonForm.thumbnail_url} onChange={(e) => setLessonForm((current) => ({ ...current, thumbnail_url: e.target.value }))} className={fieldClass} placeholder="تصویر ویدیو، اختیاری" dir="ltr" />
                    <input value={lessonForm.duration_minutes} onChange={(e) => setLessonForm((current) => ({ ...current, duration_minutes: e.target.value }))} className={fieldClass} placeholder="مدت به دقیقه" type="number" />
                    <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600">
                        <input type="checkbox" checked={lessonForm.is_free} onChange={(e) => setLessonForm((current) => ({ ...current, is_free: e.target.checked }))} />
                        درس رایگان
                    </label>
                    <textarea value={lessonForm.metadata_json} onChange={(e) => setLessonForm((current) => ({ ...current, metadata_json: e.target.value }))} className={`${textAreaClass} min-h-44 font-mono`} dir="ltr" />
                    <PrimaryButton onClick={onCreateLesson} disabled={saving === "lesson"} className="w-full" leadingIcon={saving === "lesson" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}>افزودن درس</PrimaryButton>
                </div>
            </Surface>
        </div>
    );
}

function DictionaryTab(props: {
    words: AdminDictionaryWord[];
    wordForm: typeof emptyWordForm;
    saving: string;
    search: string;
    setSearch: (value: string) => void;
    setWordForm: React.Dispatch<React.SetStateAction<typeof emptyWordForm>>;
    onRefresh: () => void;
    onSave: () => void;
    onEdit: (word: AdminDictionaryWord) => void;
    onDelete: (word: AdminDictionaryWord) => void;
}) {
    const { words, wordForm, saving, search, setSearch, setWordForm, onRefresh, onSave, onEdit, onDelete } = props;
    const [missingFilter, setMissingFilter] = useState<DictionaryMissingKey | "">("");
    const [hskFilter, setHskFilter] = useState("");
    const [sourceFilter, setSourceFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const stats = useMemo(() => getDictionaryReviewStats(words), [words]);
    const hskLevels = useMemo(
        () => [...new Set(words.map((word) => word.hsk_level).filter((level): level is number => typeof level === "number"))].sort((a, b) => a - b),
        [words],
    );
    const sources = useMemo(
        () => [...new Set(words.map((word) => word.source).filter((source): source is string => Boolean(source)))].sort(),
        [words],
    );
    const statuses = useMemo(
        () => [...new Set(words.map((word) => word.status).filter((status): status is string => Boolean(status)))].sort(),
        [words],
    );
    const visibleWords = useMemo(() => {
        return words.filter((word) => {
            if (missingFilter && !getDictionaryMissingFields(word).includes(missingFilter)) return false;
            if (hskFilter && String(word.hsk_level || "") !== hskFilter) return false;
            if (sourceFilter && word.source !== sourceFilter) return false;
            if (statusFilter && word.status !== statusFilter) return false;
            return true;
        });
    }, [hskFilter, missingFilter, sourceFilter, statusFilter, words]);
    const selectedWord = words.find((word) => word.id === wordForm.id) || null;

    return (
        <div className="motion-list grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
                <Surface className={cn(panelClass, "p-4")}>
                    <PanelTitle icon={<FileText size={18} />} title="بازبینی کلمات" subtitle="کلمات دیکشنری را ببین، فیلدهای خالی را پیدا کن و برای اصلاح انتخاب کن." />
                    <div className="mt-4 grid gap-2 sm:grid-cols-4">
                        <DictionaryReviewStat label="کل کلمات" value={stats.total} tone="blue" />
                        <DictionaryReviewStat label="کامل" value={stats.complete} tone="green" />
                        <DictionaryReviewStat label="نیازمند بررسی" value={stats.withMissing} tone="amber" />
                        <DictionaryReviewStat label="بدون صدا" value={stats.missingAudio} tone="slate" />
                    </div>

                    <div className="mt-4 grid gap-2 lg:grid-cols-[1.3fr_auto]">
                        <div className="relative">
                            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={`${fieldClass} pr-9`}
                                placeholder="جست‌وجوی کلمه، پین‌یین یا معنی فارسی"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={onRefresh}
                            disabled={saving === "dictionary-refresh"}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#155aa6] px-4 py-2.5 text-sm font-black text-white disabled:cursor-wait disabled:opacity-70"
                        >
                            {saving === "dictionary-refresh" && <Loader2 className="h-4 w-4 animate-spin" />}
                            {saving === "dictionary-refresh" ? "در حال بارگذاری" : "جست‌وجو"}
                        </button>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        <select value={missingFilter} onChange={(e) => setMissingFilter(e.target.value as DictionaryMissingKey | "")} className={fieldClass}>
                            <option value="">همه فیلدها</option>
                            {dictionaryMissingOptions.map((item) => (
                                <option key={item.key} value={item.key}>خالی: {item.label}</option>
                            ))}
                        </select>
                        <select value={hskFilter} onChange={(e) => setHskFilter(e.target.value)} className={fieldClass}>
                            <option value="">همه HSKها</option>
                            {hskLevels.map((level) => (
                                <option key={level} value={String(level)}>HSK {level}</option>
                            ))}
                        </select>
                        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className={fieldClass}>
                            <option value="">همه منابع</option>
                            {sources.map((source) => (
                                <option key={source} value={source}>{source}</option>
                            ))}
                        </select>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={fieldClass}>
                            <option value="">همه وضعیت‌ها</option>
                            {statuses.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-500">
                        <span>{toPersianDigits(visibleWords.length)} کلمه از {toPersianDigits(words.length)} مورد نمایش داده می‌شود</span>
                        {(missingFilter || hskFilter || sourceFilter || statusFilter) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setMissingFilter("");
                                    setHskFilter("");
                                    setSourceFilter("");
                                    setStatusFilter("");
                                }}
                                className="text-[#155aa6]"
                            >
                                پاک کردن فیلترها
                            </button>
                        )}
                    </div>

                    <div className="mt-4 max-h-[760px] space-y-2 overflow-y-auto pr-1">
                        {visibleWords.map((word) => {
                            const missing = getDictionaryMissingFields(word);
                            const isSelected = word.id === wordForm.id;
                            return (
                                <div key={word.id} className={cn("rounded-[22px] border bg-slate-50 p-3 transition", isSelected ? "border-[#155aa6]/50 bg-[#eef6ff]" : "border-slate-100")}>
                                    <div className="flex items-start justify-between gap-3">
                                        <button type="button" onClick={() => onEdit(word)} className="min-w-0 flex-1 text-right">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="font-cjk truncate text-2xl font-black text-slate-950" dir="ltr" lang="zh-CN">{word.chinese}</p>
                                                    <p className="truncate font-latin text-xs font-bold text-slate-500" dir="ltr">{word.pinyin || "pinyin خالی"}</p>
                                                </div>
                                                <div className="flex shrink-0 flex-col items-end gap-1">
                                                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-[#155aa6]">
                                                        {word.hsk_level ? `HSK ${word.hsk_level}` : word.level}
                                                    </span>
                                                    <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-black", missing.length ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700")}>
                                                        {missing.length ? `${toPersianDigits(missing.length)} نقص` : "کامل"}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="mt-2 line-clamp-2 text-xs leading-6 text-slate-600">{word.persian_meaning || "معنی فارسی خالی است"}</p>
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                {missing.length ? missing.slice(0, 4).map((item) => (
                                                    <span key={item} className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-amber-700">
                                                        {getMissingLabel(item)}
                                                    </span>
                                                )) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px] font-bold text-emerald-700">
                                                        <CheckCircle2 size={12} />
                                                        آماده نمایش
                                                    </span>
                                                )}
                                                {missing.length > 4 && (
                                                    <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-slate-500">
                                                        +{toPersianDigits(missing.length - 4)}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                        <button type="button" onClick={() => onDelete(word)} className="rounded-2xl bg-white p-2 text-rose-500 transition hover:bg-rose-50" aria-label="حذف">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        {!visibleWords.length && (
                            <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-bold text-slate-400">
                                کلمه‌ای با این فیلتر پیدا نشد.
                            </div>
                        )}
                    </div>
                </Surface>
            </div>

            <Surface className={cn(panelClass, "p-4")}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <PanelTitle
                        icon={<Database size={18} />}
                        title={wordForm.id ? "ویرایش کلمه" : "افزودن کلمه"}
                        subtitle={wordForm.id ? "بعد از اصلاح، ذخیره را بزن تا همین رکورد آپدیت شود." : "برای ساخت دستی کلمه جدید، فیلدهای اصلی را پر کن."}
                    />
                    {selectedWord ? (
                        <div className="flex flex-wrap gap-1.5">
                            {getDictionaryMissingFields(selectedWord).length ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700">
                                    <AlertTriangle size={14} />
                                    {toPersianDigits(getDictionaryMissingFields(selectedWord).length)} فیلد خالی
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
                                    <CheckCircle2 size={14} />
                                    کامل
                                </span>
                            )}
                        </div>
                    ) : null}
                </div>

                <div className="mt-4 space-y-4">
                    <DictionaryFormSection title="اطلاعات اصلی">
                        <DictionaryField label="کلمه چینی">
                            <input value={wordForm.chinese} onChange={(e) => setWordForm((current) => ({ ...current, chinese: e.target.value }))} className="font-cjk w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left text-lg outline-none transition focus:border-[#155aa6] focus:ring-4 focus:ring-[#155aa6]/12" dir="ltr" lang="zh-CN" />
                        </DictionaryField>
                        <DictionaryField label="پین‌یین">
                            <input value={wordForm.pinyin} onChange={(e) => setWordForm((current) => ({ ...current, pinyin: e.target.value }))} className={fieldClass} dir="ltr" />
                        </DictionaryField>
                        <DictionaryField label="سطح متنی">
                            <input value={wordForm.level} onChange={(e) => setWordForm((current) => ({ ...current, level: e.target.value }))} className={fieldClass} />
                        </DictionaryField>
                        <DictionaryField label="شماره HSK">
                            <input value={wordForm.hsk_level} onChange={(e) => setWordForm((current) => ({ ...current, hsk_level: e.target.value }))} className={fieldClass} type="number" min={1} max={9} />
                        </DictionaryField>
                        <DictionaryField label="منبع">
                            <input value={wordForm.source} onChange={(e) => setWordForm((current) => ({ ...current, source: e.target.value }))} className={fieldClass} />
                        </DictionaryField>
                        <DictionaryField label="شناسه کلمه در منبع">
                            <input value={wordForm.source_word_id} onChange={(e) => setWordForm((current) => ({ ...current, source_word_id: e.target.value }))} className={fieldClass} />
                        </DictionaryField>
                        <DictionaryField label="وضعیت انتشار" hint="published یعنی این کلمه برای کاربرها قابل نمایش است. draft یعنی فعلا فقط در ادمین بماند.">
                            <select value={wordForm.status} onChange={(e) => setWordForm((current) => ({ ...current, status: e.target.value }))} className={fieldClass}>
                                <option value="published">published</option>
                                <option value="draft">draft</option>
                            </select>
                        </DictionaryField>
                        <DictionaryField label="آدرس فایل صدا">
                            <input value={wordForm.audio_url} onChange={(e) => setWordForm((current) => ({ ...current, audio_url: e.target.value }))} className={fieldClass} dir="ltr" />
                        </DictionaryField>
                    </DictionaryFormSection>

                    <DictionaryFormSection title="معنی و یادداشت">
                        <DictionaryField label="معنی فارسی">
                            <textarea value={wordForm.persian_meaning} onChange={(e) => setWordForm((current) => ({ ...current, persian_meaning: e.target.value }))} className={textAreaClass} dir="rtl" />
                        </DictionaryField>
                        <DictionaryField label="توضیح چینی">
                            <textarea value={wordForm.chinese_meaning} onChange={(e) => setWordForm((current) => ({ ...current, chinese_meaning: e.target.value }))} className={textAreaClass} dir="ltr" lang="zh-CN" />
                        </DictionaryField>
                        <DictionaryField label="ترکیب واژگانی و توضیحات آموزشی" wide>
                            <textarea value={wordForm.composition} onChange={(e) => setWordForm((current) => ({ ...current, composition: e.target.value }))} className={textAreaClass} />
                        </DictionaryField>
                        <DictionaryField label="یادداشت داخلی یا نکته آموزشی" wide>
                            <textarea value={wordForm.notes} onChange={(e) => setWordForm((current) => ({ ...current, notes: e.target.value }))} className={textAreaClass} />
                        </DictionaryField>
                    </DictionaryFormSection>

                    <DictionaryFormSection title="داده‌های چندبخشی">
                        <DictionaryField label="تعریف‌ها" hint="فرمت هر خط: نقش دستوری | تعریف | fa/zh | شماره معنا | یادداشت" wide>
                            <textarea value={wordForm.definitions_text} onChange={(e) => setWordForm((current) => ({ ...current, definitions_text: e.target.value }))} className={textAreaClass} />
                        </DictionaryField>
                        <DictionaryField label="مثال‌ها" hint="فرمت هر خط: جمله چینی | pinyin | ترجمه فارسی | شماره معنا" wide>
                            <textarea value={wordForm.examples_text} onChange={(e) => setWordForm((current) => ({ ...current, examples_text: e.target.value }))} className={textAreaClass} />
                        </DictionaryField>
                        <DictionaryField label="ترکیب‌ها" hint="فرمت هر خط: عبارت چینی | pinyin | ترجمه | شماره معنا" wide>
                            <textarea value={wordForm.collocations_text} onChange={(e) => setWordForm((current) => ({ ...current, collocations_text: e.target.value }))} className={textAreaClass} />
                        </DictionaryField>
                    </DictionaryFormSection>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    <PrimaryButton onClick={onSave} disabled={saving === "word"} leadingIcon={saving === "word" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}>ذخیره کلمه</PrimaryButton>
                    {wordForm.id ? (
                        <button type="button" onClick={() => setWordForm(emptyWordForm)} className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-600">کلمه جدید</button>
                    ) : null}
                </div>
            </Surface>
        </div>
    );
}

function DictionaryReviewStat({ label, value, tone }: { label: string; value: number; tone: "blue" | "green" | "amber" | "slate" }) {
    const toneClass = {
        blue: "bg-[#eef6ff] text-[#155aa6]",
        green: "bg-emerald-50 text-emerald-700",
        amber: "bg-amber-50 text-amber-700",
        slate: "bg-slate-100 text-slate-600",
    }[tone];
    return (
        <div className={cn("rounded-[20px] px-3 py-3", toneClass)}>
            <p className="text-[11px] font-black opacity-80">{label}</p>
            <p className="mt-1 text-2xl font-black">{toPersianDigits(value)}</p>
        </div>
    );
}

function DictionaryFormSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="rounded-[24px] border border-slate-100 bg-slate-50 p-3">
            <h3 className="px-1 text-sm font-black text-slate-800">{title}</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">{children}</div>
        </section>
    );
}

function DictionaryField({ label, hint, wide, children }: { label: string; hint?: string; wide?: boolean; children: React.ReactNode }) {
    return (
        <label className={cn("block space-y-1.5 text-right", wide && "md:col-span-2")}>
            <span className="block px-1 text-xs font-black text-slate-600">{label}</span>
            {children}
            {hint ? <span className="block px-1 text-[11px] font-bold leading-5 text-slate-400">{hint}</span> : null}
        </label>
    );
}

function ImportTab({
    saving,
    result,
    onImport,
}: {
    saving: string;
    result: AdminDictionaryImportResult | null;
    onImport: (file: File | null) => void;
}) {
    return (
        <div className="motion-list grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            <Surface className={cn(panelClass, "p-4")}>
                <PanelTitle icon={<Upload size={18} />} title="ورود فایل دیکشنری" subtitle="خروجی ChatGPT را به شکل CSV یا JSON وارد کن؛ کلمات تکراری آپدیت می‌شوند." />
                <div className="mt-4 space-y-3">
                    <label className={cn(
                        "flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center transition hover:border-[#155aa6]/40 hover:bg-[#eef6ff]",
                        saving === "dictionary-import" && "pointer-events-none opacity-60",
                    )}>
                        <input
                            type="file"
                            accept=".csv,.json,text/csv,application/json"
                            className="hidden"
                            disabled={saving === "dictionary-import"}
                            onChange={(event) => {
                                onImport(event.target.files?.[0] || null);
                                event.target.value = "";
                            }}
                        />
                        {saving === "dictionary-import" ? (
                            <Loader2 className="h-8 w-8 animate-spin text-[#155aa6]" />
                        ) : (
                            <Upload className="h-8 w-8 text-[#155aa6]" />
                        )}
                        <span className="mt-3 text-sm font-black text-slate-700">
                    {saving === "dictionary-import" ? "در حال ورود فایل…" : "انتخاب فایل CSV یا JSON"}
                        </span>
                        <span className="mt-2 max-w-sm text-xs font-bold leading-6 text-slate-400">
                            فایل باید UTF-8 باشد. ستون اصلی فقط chinese است؛ بقیه ستون‌ها اختیاری‌اند.
                        </span>
                    </label>

                    <div className="grid gap-2 sm:grid-cols-2">
                        <a href="/templates/dictionary_import_template.csv" download className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-100">
                            <Download className="h-4 w-4" />
                            نمونه CSV
                        </a>
                        <a href="/templates/dictionary_import_prompt.txt" download className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-100">
                            <Download className="h-4 w-4" />
                            پرامپت ChatGPT
                        </a>
                    </div>
                </div>
            </Surface>

            <Surface className={cn(panelClass, "p-4")}>
                <PanelTitle icon={<FileText size={18} />} title="نتیجه ورود فایل" subtitle="بعد از import، خلاصه و خطاهای احتمالی اینجا دیده می‌شود." />
                {result ? (
                    <div className="mt-4 space-y-4">
                        <div className="grid gap-3 sm:grid-cols-3">
                            <ImportStat label="ساخته شد" value={result.created} />
                            <ImportStat label="آپدیت شد" value={result.updated} />
                            <ImportStat label="خطا" value={result.failed} />
                        </div>
                        {result.errors.length ? (
                            <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-[24px] bg-slate-50 p-3">
                                {result.errors.map((error) => (
                                    <div key={`${error.row}-${error.chinese || "empty"}`} className="rounded-2xl bg-white px-3 py-2 text-xs font-bold leading-6 text-rose-600">
                                        ردیف {toPersianDigits(error.row)} {error.chinese ? `(${error.chinese})` : ""}: {error.error}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-[24px] bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
                                همه ردیف‌ها بدون خطا وارد شدند.
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="mt-4 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-bold leading-7 text-slate-400">
                        هنوز فایلی وارد نشده است.
                    </div>
                )}
            </Surface>
        </div>
    );
}

function ImportStat({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-[22px] bg-slate-50 px-4 py-3">
            <p className="text-xs font-black text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{toPersianDigits(value)}</p>
        </div>
    );
}

function UsersTab({
    users,
    search,
    setSearch,
    onRefresh,
    saving,
    onRoleChange,
    onStatusChange,
}: {
    users: AdminUserSummary[];
    search: string;
    setSearch: (value: string) => void;
    onRefresh: () => void;
    saving: string;
    onRoleChange: (userId: number, role: AdminUserSummary["role"]) => Promise<void>;
    onStatusChange: (userId: number, status: "active" | "suspended") => Promise<void>;
}) {
    return (
        <Surface className={cn(panelClass, "motion-list p-4")}>
            <PanelTitle icon={<Users size={18} />} title="کاربران" subtitle="نقش‌ها از دیتابیس اعمال می‌شوند و تغییر نقش، نشست‌های قبلی کاربر را می‌بندد." />
            <div className="mt-4 flex gap-2">
                <input value={search} onChange={(e) => setSearch(e.target.value)} className={fieldClass} placeholder="ایمیل یا موبایل" />
                <button type="button" onClick={onRefresh} className="rounded-2xl bg-[#155aa6] px-4 text-sm font-black text-white">جست‌وجو</button>
            </div>
            <div className="mt-4 overflow-hidden rounded-[24px] border border-slate-100">
                {users.map((user) => (
                    <div key={user.id} className="grid gap-1 border-b border-slate-100 bg-white px-4 py-3 last:border-b-0 sm:grid-cols-[1fr_auto]">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-950">{user.display_name || user.email}</p>
                            <p className="truncate text-xs font-bold text-slate-400">{user.email} · {user.phone}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-black text-slate-500">
                            <select
                                value={user.role}
                                onChange={(event) => void onRoleChange(user.id, event.target.value as AdminUserSummary["role"])}
                                disabled={saving === `user-role:${user.id}`}
                                aria-label={`نقش ${user.display_name || user.email}`}
                                className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-black text-slate-700 outline-none focus:border-[#155aa6] disabled:opacity-50"
                            >
                                <option value="user">کاربر</option>
                                <option value="moderator">ناظر</option>
                                <option value="admin">مدیر</option>
                            </select>
                            <select
                                value={user.status === "deleted" ? "suspended" : user.status}
                                onChange={(event) => void onStatusChange(user.id, event.target.value as "active" | "suspended")}
                                disabled={saving === `user-status:${user.id}` || user.status === "deleted"}
                                aria-label={`وضعیت ${user.display_name || user.email}`}
                                className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-black text-slate-700 outline-none focus:border-[#155aa6] disabled:opacity-50"
                            >
                                <option value="active">فعال</option>
                                <option value="suspended">تعلیق</option>
                            </select>
                            <span className={cn("rounded-full px-2.5 py-1", user.is_verified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                                {user.is_verified ? "تأیید شده" : "تأیید نشده"}
                            </span>
                            <span>{formatDate(user.created_at)}</span>
                        </div>
                    </div>
                ))}
            </div>
        </Surface>
    );
}

function AdminList({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <Surface className={cn(panelClass, "p-4")}>
            <PanelTitle icon={icon} title={title} />
            <div className="mt-4 space-y-2">{children}</div>
        </Surface>
    );
}

function PanelTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#eef6ff] text-[#155aa6]">{icon}</div>
            <div>
                <h2 className="text-base font-black text-slate-950">{title}</h2>
                {subtitle ? <p className="mt-1 text-xs font-bold leading-6 text-slate-400">{subtitle}</p> : null}
            </div>
        </div>
    );
}

function CourseSelect({ courses, value, onChange }: { courses: Course[]; value: string; onChange: (value: string) => void }) {
    return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass}>
            <option value="">دوره</option>
            {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
            ))}
        </select>
    );
}
