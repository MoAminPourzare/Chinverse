"use client";

import { useEffect, useMemo, useState } from "react";
import { BookPlus, Layers3, Loader2, Plus, Video } from "lucide-react";
import { fetchAllCourses, fetchCourseTaxonomy, type CategorySummary, type Course } from "@/lib/courses";
import { contentAdminService } from "@/lib/content-admin";
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

const emptyJson = "{}";
const fieldClass = "w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#155aa6] focus:ring-4 focus:ring-[#155aa6]/12";
const monoFieldClass = `${fieldClass} font-mono`;
const panelClass = "rounded-[28px] border border-white/70 bg-white/85 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.07)] backdrop-blur-xl";

function validateSlug(value: string) {
    const slug = value.trim();
    if (!slug) return "نامک دوره را وارد کن.";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        return "نامک دوره فقط می‌تواند شامل حروف انگلیسی کوچک، عدد و خط تیره بین کلمات باشد.";
    }
    return "";
}

export default function ContentAdminPage() {
    const [categories, setCategories] = useState<CategorySummary[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<"course" | "section" | "lesson" | "">("");
    const [message, setMessage] = useState("");

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
        is_free: false,
        metadata_json: emptyJson,
    });

    const selectedCourse = useMemo(() => {
        const courseId = Number(lessonForm.course_id || sectionForm.course_id || courses[0]?.id || 0);
        return courses.find((course) => course.id === courseId) || courses[0];
    }, [courses, lessonForm.course_id, sectionForm.course_id]);

    const selectedSections = selectedCourse?.sections || [];

    useEffect(() => {
        if (courses.length === 0) {
            return;
        }

        setSectionForm((current) =>
            current.course_id ? current : { ...current, course_id: String(courses[0].id) }
        );
        setLessonForm((current) =>
            current.course_id ? current : { ...current, course_id: String(courses[0].id) }
        );
    }, [courses]);

    useEffect(() => {
        if (!selectedCourse || lessonForm.section_id) {
            return;
        }

        const firstSection = selectedCourse.sections?.[0];
        if (firstSection) {
            setLessonForm((current) => ({ ...current, section_id: String(firstSection.id) }));
        }
    }, [lessonForm.section_id, selectedCourse]);

    const loadData = async () => {
        setLoading(true);
        setMessage("");

        try {
            const [taxonomyData, courseData] = await Promise.all([
                fetchCourseTaxonomy(),
                fetchAllCourses(),
            ]);
            setCategories(taxonomyData);
            setCourses(courseData);
        } catch (error) {
            console.error("Failed to load admin data:", error);
            setMessage("بارگذاری اطلاعات انجام نشد.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const updateCourse = (updatedCourse: Course) => {
        setCourses((current) => {
            const exists = current.some((course) => course.id === updatedCourse.id);
            if (!exists) {
                return [updatedCourse, ...current];
            }
            return current.map((course) => (course.id === updatedCourse.id ? updatedCourse : course));
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
        if (validationError) {
            setMessage(validationError);
            return;
        }

        setSaving("course");
        setMessage("");

        try {
            const payload = {
                subcategory_id: Number(courseForm.subcategory_id),
                title: courseForm.title.trim(),
                slug: courseForm.slug.trim(),
                description: courseForm.description.trim(),
                cover_image_url: courseForm.cover_image_url.trim(),
                level: courseForm.level.trim(),
                metadata_json: parseJsonObject(courseForm.metadata_json),
            };

            const created = await contentAdminService.createCourse(payload);
            updateCourse(created);
            setCourseForm({
                subcategory_id: courseForm.subcategory_id,
                title: "",
                slug: "",
                description: "",
                cover_image_url: "",
                level: courseForm.level,
                metadata_json: emptyJson,
            });
            setSectionForm((current) => ({ ...current, course_id: String(created.id) }));
            setLessonForm((current) => ({ ...current, course_id: String(created.id) }));
            setMessage("دوره با موفقیت ساخته شد.");
        } catch (error) {
            console.error("Failed to create course:", error);
            setMessage("ساخت course انجام نشد.");
        } finally {
            setSaving("");
        }
    };

    const handleCreateSection = async () => {
        const courseId = Number(sectionForm.course_id);
        if (!courseId) {
            setMessage("اول یک course انتخاب کن.");
            return;
        }
        const validationError =
            validationMessage(validateTextLength(sectionForm.title, "عنوان بخش", { required: true, min: 1, max: 180 })) ||
            validationMessage(validateNonNegativeNumber(sectionForm.order_index, "ترتیب نمایش", { max: 9999 })) ||
            validationMessage(validateJsonObject(sectionForm.metadata_json, "اطلاعات تکمیلی بخش"));
        if (validationError) {
            setMessage(validationError);
            return;
        }

        setSaving("section");
        setMessage("");

        try {
            const payload = {
                title: sectionForm.title.trim(),
                order_index: Number(normalizeDigits(sectionForm.order_index || "0")),
                metadata_json: parseJsonObject(sectionForm.metadata_json),
            };

            const updated = await contentAdminService.createSection(courseId, payload);
            updateCourse(updated);
            const createdSectionId = updated.sections?.[updated.sections.length - 1]?.id;
            setSectionForm((current) => ({
                ...current,
                title: "",
                order_index: "0",
                metadata_json: emptyJson,
            }));
            setLessonForm((current) => ({
                ...current,
                section_id: createdSectionId ? String(createdSectionId) : current.section_id,
            }));
            setMessage("بخش با موفقیت ساخته شد.");
        } catch (error) {
            console.error("Failed to create section:", error);
            setMessage("ساخت section انجام نشد.");
        } finally {
            setSaving("");
        }
    };

    const handleCreateLesson = async () => {
        const sectionId = Number(lessonForm.section_id);
        if (!sectionId) {
            setMessage("اول یک section انتخاب کن.");
            return;
        }
        const validationError =
            validationMessage(validateTextLength(lessonForm.title, "عنوان درس", { required: true, min: 1, max: 180 })) ||
            validationMessage(validateNonNegativeNumber(lessonForm.duration_minutes, "مدت زمان درس", { max: 1000 })) ||
            validationMessage(validateUrl(lessonForm.video_url, "آدرس ویدیو", { required: true, allowRelative: true })) ||
            validationMessage(validateJsonObject(lessonForm.metadata_json, "اطلاعات تکمیلی درس"));
        if (validationError) {
            setMessage(validationError);
            return;
        }

        setSaving("lesson");
        setMessage("");

        try {
            const payload = {
                title: lessonForm.title.trim(),
                duration_minutes: Number(normalizeDigits(lessonForm.duration_minutes || "0")),
                is_free: lessonForm.is_free,
                video_url: lessonForm.video_url.trim(),
                metadata_json: parseJsonObject(lessonForm.metadata_json),
            };

            const updated = await contentAdminService.createLesson(sectionId, payload);
            updateCourse(updated);
            setLessonForm((current) => ({
                ...current,
                title: "",
                duration_minutes: "0",
                video_url: "",
                metadata_json: emptyJson,
            }));
            setMessage("درس با موفقیت ساخته شد.");
        } catch (error) {
            console.error("Failed to create lesson:", error);
            setMessage("ساخت lesson انجام نشد.");
        } finally {
            setSaving("");
        }
    };

    return (
        <div className="min-h-full" dir="rtl">
            <header className="sticky top-3 z-10 mx-4 rounded-[28px] border border-white/70 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur-xl">
                <div className="mx-auto grid max-w-6xl grid-cols-[44px_1fr_44px] items-center gap-3 px-4 py-4">
                    <BackButton href="/" className="justify-self-end" />
                    <div className="text-center">
                        <h1 className="text-lg font-bold text-gray-900">مدیریت محتوا</h1>
                        <p className="text-xs text-gray-500">دوره، بخش و درس را از همین‌جا اضافه کن.</p>
                    </div>
                    <span aria-hidden />
                </div>
            </header>

            <main className="mx-auto max-w-6xl space-y-4 px-4 py-5">
                <div className={panelClass}>
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900">شروع سریع</h2>
                            <p className="text-xs text-gray-500">
                                اول دوره بساز، بعد بخش و درس را روی همان دوره اضافه کن.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={loadData}
                            className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
                        >
                            <Loader2 size={14} />
                            تازه‌سازی
                        </button>
                    </div>

                    {message && (
                        <div className="rounded-2xl bg-[#eef6ff] px-3 py-2 text-sm font-semibold text-[#155aa6]">
                            {message}
                        </div>
                    )}
                </div>

                <section className={panelClass}>
                    <div className="mb-4 flex items-center gap-2">
                        <BookPlus size={18} className="text-[#155aa6]" />
                        <h2 className="text-base font-semibold text-gray-900">ساخت دوره</h2>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="space-y-1">
                            <span className="text-xs font-medium text-gray-600">زیرمجموعه</span>
                            <select
                                value={courseForm.subcategory_id}
                                onChange={(e) => setCourseForm((current) => ({ ...current, subcategory_id: e.target.value }))}
                                className={fieldClass}
                            >
                                <option value="">انتخاب کن</option>
                                {categories.map((category) => (
                                    <optgroup key={category.id} label={category.name}>
                                        {category.subcategories.map((subcategory) => (
                                            <option key={subcategory.id} value={subcategory.id}>
                                                {subcategory.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </label>

                        <label className="space-y-1">
                            <span className="text-xs font-medium text-gray-600">سطح</span>
                            <select
                                value={courseForm.level}
                                onChange={(e) => setCourseForm((current) => ({ ...current, level: e.target.value }))}
                                className={fieldClass}
                            >
                                <option value="beginner">مقدماتی</option>
                                <option value="intermediate">متوسط</option>
                                <option value="advanced">پیشرفته</option>
                            </select>
                        </label>

                        <label className="space-y-1">
                            <span className="text-xs font-medium text-gray-600">عنوان</span>
                            <input
                                value={courseForm.title}
                                onChange={(e) => setCourseForm((current) => ({ ...current, title: e.target.value }))}
                                className={fieldClass}
                            />
                        </label>

                        <label className="space-y-1">
                            <span className="text-xs font-medium text-gray-600">نامک</span>
                            <input
                                value={courseForm.slug}
                                onChange={(e) => setCourseForm((current) => ({ ...current, slug: e.target.value }))}
                                className={fieldClass}
                            />
                        </label>

                        <label className="space-y-1 md:col-span-2">
                            <span className="text-xs font-medium text-gray-600">توضیحات</span>
                            <textarea
                                value={courseForm.description}
                                onChange={(e) => setCourseForm((current) => ({ ...current, description: e.target.value }))}
                                rows={3}
                                className={fieldClass}
                            />
                        </label>

                        <label className="space-y-1 md:col-span-2">
                            <span className="text-xs font-medium text-gray-600">آدرس تصویر کاور</span>
                            <input
                                value={courseForm.cover_image_url}
                                onChange={(e) => setCourseForm((current) => ({ ...current, cover_image_url: e.target.value }))}
                                className={fieldClass}
                            />
                        </label>

                        <label className="space-y-1 md:col-span-2">
                            <span className="text-xs font-medium text-gray-600">اطلاعات تکمیلی</span>
                            <textarea
                                value={courseForm.metadata_json}
                                onChange={(e) => setCourseForm((current) => ({ ...current, metadata_json: e.target.value }))}
                                rows={4}
                                className={monoFieldClass}
                            />
                        </label>
                    </div>

                    <button
                        type="button"
                        onClick={handleCreateCourse}
                        disabled={saving === "course"}
                        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#155aa6] to-[#50bca4] px-4 py-2 text-sm font-medium text-white disabled:opacity-70"
                    >
                        {saving === "course" ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        ساخت دوره
                    </button>
                </section>

                <section className={panelClass}>
                    <div className="mb-4 flex items-center gap-2">
                        <Layers3 size={18} className="text-[#155aa6]" />
                        <h2 className="text-base font-semibold text-gray-900">ساخت بخش</h2>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="space-y-1">
                            <span className="text-xs font-medium text-gray-600">دوره</span>
                            <select
                                value={sectionForm.course_id}
                                onChange={(e) => setSectionForm((current) => ({ ...current, course_id: e.target.value }))}
                                className={fieldClass}
                            >
                                <option value="">انتخاب کن</option>
                                {courses.map((course) => (
                                    <option key={course.id} value={course.id}>
                                        {course.title}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="space-y-1">
                            <span className="text-xs font-medium text-gray-600">ترتیب نمایش</span>
                            <input
                                type="number"
                                value={sectionForm.order_index}
                                onChange={(e) => setSectionForm((current) => ({ ...current, order_index: e.target.value }))}
                                className={fieldClass}
                            />
                        </label>

                        <label className="space-y-1 md:col-span-2">
                            <span className="text-xs font-medium text-gray-600">عنوان</span>
                            <input
                                value={sectionForm.title}
                                onChange={(e) => setSectionForm((current) => ({ ...current, title: e.target.value }))}
                                className={fieldClass}
                            />
                        </label>

                        <label className="space-y-1 md:col-span-2">
                            <span className="text-xs font-medium text-gray-600">اطلاعات تکمیلی</span>
                            <textarea
                                value={sectionForm.metadata_json}
                                onChange={(e) => setSectionForm((current) => ({ ...current, metadata_json: e.target.value }))}
                                rows={3}
                                className={monoFieldClass}
                            />
                        </label>
                    </div>

                    <button
                        type="button"
                        onClick={handleCreateSection}
                        disabled={saving === "section"}
                        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#155aa6] to-[#50bca4] px-4 py-2 text-sm font-medium text-white disabled:opacity-70"
                    >
                        {saving === "section" ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        ساخت بخش
                    </button>
                </section>

                <section className={panelClass}>
                    <div className="mb-4 flex items-center gap-2">
                        <Video size={18} className="text-[#155aa6]" />
                        <h2 className="text-base font-semibold text-gray-900">ساخت درس</h2>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="space-y-1">
                            <span className="text-xs font-medium text-gray-600">دوره</span>
                            <select
                                value={lessonForm.course_id}
                                onChange={(e) => {
                                    const nextCourseId = e.target.value;
                                    const nextCourse = courses.find((course) => course.id === Number(nextCourseId));
                                    setLessonForm((current) => ({
                                        ...current,
                                        course_id: nextCourseId,
                                        section_id: nextCourse?.sections?.[0]?.id ? String(nextCourse.sections[0].id) : "",
                                    }));
                                }}
                                className={fieldClass}
                            >
                                <option value="">انتخاب کن</option>
                                {courses.map((course) => (
                                    <option key={course.id} value={course.id}>
                                        {course.title}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="space-y-1">
                            <span className="text-xs font-medium text-gray-600">بخش</span>
                            <select
                                value={lessonForm.section_id}
                                onChange={(e) => setLessonForm((current) => ({ ...current, section_id: e.target.value }))}
                                className={fieldClass}
                            >
                                <option value="">انتخاب کن</option>
                                {selectedSections.map((section) => (
                                    <option key={section.id} value={section.id}>
                                        {section.title}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="space-y-1 md:col-span-2">
                            <span className="text-xs font-medium text-gray-600">عنوان</span>
                            <input
                                value={lessonForm.title}
                                onChange={(e) => setLessonForm((current) => ({ ...current, title: e.target.value }))}
                                className={fieldClass}
                            />
                        </label>

                        <label className="space-y-1">
                            <span className="text-xs font-medium text-gray-600">مدت زمان به دقیقه</span>
                            <input
                                type="number"
                                value={lessonForm.duration_minutes}
                                onChange={(e) => setLessonForm((current) => ({ ...current, duration_minutes: e.target.value }))}
                                className={fieldClass}
                            />
                        </label>

                        <label className="space-y-1">
                            <span className="text-xs font-medium text-gray-600">آدرس ویدیو</span>
                            <input
                                value={lessonForm.video_url}
                                onChange={(e) => setLessonForm((current) => ({ ...current, video_url: e.target.value }))}
                                className={fieldClass}
                            />
                        </label>

                        <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 md:col-span-2">
                            <input
                                type="checkbox"
                                checked={lessonForm.is_free}
                                onChange={(e) => setLessonForm((current) => ({ ...current, is_free: e.target.checked }))}
                                className="h-4 w-4"
                            />
                            <span className="text-sm text-gray-700">درس رایگان</span>
                        </label>

                        <label className="space-y-1 md:col-span-2">
                            <span className="text-xs font-medium text-gray-600">اطلاعات تکمیلی</span>
                            <textarea
                                value={lessonForm.metadata_json}
                                onChange={(e) => setLessonForm((current) => ({ ...current, metadata_json: e.target.value }))}
                                rows={4}
                                className={monoFieldClass}
                            />
                        </label>
                    </div>

                    <button
                        type="button"
                        onClick={handleCreateLesson}
                        disabled={saving === "lesson"}
                        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#155aa6] to-[#50bca4] px-4 py-2 text-sm font-medium text-white disabled:opacity-70"
                    >
                        {saving === "lesson" ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        ساخت درس
                    </button>
                </section>

                {loading && (
                    <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/80 p-4 text-center text-sm text-slate-500">
                        در حال بارگذاری...
                    </div>
                )}
            </main>
        </div>
    );
}
