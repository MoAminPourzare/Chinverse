"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookPlus, Layers3, Loader2, Plus, Video } from "lucide-react";
import { fetchAllCourses, fetchCourseTaxonomy, type CategorySummary, type Course } from "@/lib/courses";
import { contentAdminService } from "@/lib/content-admin";

type JsonInput = string;

const emptyJson = "{}";

const parseJson = (value: JsonInput): Record<string, unknown> => {
    const trimmed = value.trim();
    if (!trimmed) {
        return {};
    }

    try {
        const parsed = JSON.parse(trimmed);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
        return {};
    }
};

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
        setSaving("course");
        setMessage("");

        try {
            if (!courseForm.subcategory_id || !courseForm.title.trim() || !courseForm.slug.trim()) {
                setMessage("برای ساخت course، subcategory، title و slug لازم است.");
                return;
            }

            const payload = {
                subcategory_id: Number(courseForm.subcategory_id),
                title: courseForm.title.trim(),
                slug: courseForm.slug.trim(),
                description: courseForm.description.trim(),
                cover_image_url: courseForm.cover_image_url.trim(),
                level: courseForm.level.trim(),
                metadata_json: parseJson(courseForm.metadata_json),
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
            setMessage("Course با موفقیت ساخته شد.");
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

        setSaving("section");
        setMessage("");

        try {
            if (!sectionForm.title.trim()) {
                setMessage("عنوان section را وارد کن.");
                return;
            }

            const payload = {
                title: sectionForm.title.trim(),
                order_index: Number(sectionForm.order_index || 0),
                metadata_json: parseJson(sectionForm.metadata_json),
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
            setMessage("Section با موفقیت ساخته شد.");
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

        setSaving("lesson");
        setMessage("");

        try {
            if (!lessonForm.title.trim() || !lessonForm.video_url.trim()) {
                setMessage("برای ساخت lesson، title و video URL لازم است.");
                return;
            }

            const payload = {
                title: lessonForm.title.trim(),
                duration_minutes: Number(lessonForm.duration_minutes || 0),
                is_free: lessonForm.is_free,
                video_url: lessonForm.video_url.trim(),
                metadata_json: parseJson(lessonForm.metadata_json),
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
            setMessage("Lesson با موفقیت ساخته شد.");
        } catch (error) {
            console.error("Failed to create lesson:", error);
            setMessage("ساخت lesson انجام نشد.");
        } finally {
            setSaving("");
        }
    };

    return (
        <div className="min-h-full bg-gray-50" dir="rtl">
            <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4">
                    <Link href="/" className="text-gray-600">
                        <ArrowRight size={24} />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">مدیریت محتوا</h1>
                        <p className="text-xs text-gray-500">Course، Section و Lesson را از همین‌جا اضافه کن.</p>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-6xl space-y-4 px-4 py-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900">شروع سریع</h2>
                            <p className="text-xs text-gray-500">
                                اول course بساز، بعد section و lesson را روی همان course اضافه کن.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={loadData}
                            className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700"
                        >
                            <Loader2 size={14} />
                            تازه‌سازی
                        </button>
                    </div>

                    {message && (
                        <div className="rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-700">
                            {message}
                        </div>
                    )}
                </div>

                <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                        <BookPlus size={18} className="text-blue-600" />
                        <h2 className="text-base font-semibold text-gray-900">ساخت Course</h2>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="space-y-1">
                            <span className="text-xs font-medium text-gray-600">Subcategory</span>
                            <select
                                value={courseForm.subcategory_id}
                                onChange={(e) => setCourseForm((current) => ({ ...current, subcategory_id: e.target.value }))}
                                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
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
                            <span className="text-xs font-medium text-gray-600">Level</span>
                            <select
                                value={courseForm.level}
                                onChange={(e) => setCourseForm((current) => ({ ...current, level: e.target.value }))}
                                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                            >
                                <option value="beginner">beginner</option>
                                <option value="intermediate">intermediate</option>
                                <option value="advanced">advanced</option>
                            </select>
                        </label>

                        <label className="space-y-1">
                            <span className="text-xs font-medium text-gray-600">Title</span>
                            <input
                                value={courseForm.title}
                                onChange={(e) => setCourseForm((current) => ({ ...current, title: e.target.value }))}
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                            />
                        </label>

                        <label className="space-y-1">
                            <span className="text-xs font-medium text-gray-600">Slug</span>
                            <input
                                value={courseForm.slug}
                                onChange={(e) => setCourseForm((current) => ({ ...current, slug: e.target.value }))}
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                            />
                        </label>

                        <label className="space-y-1 md:col-span-2">
                            <span className="text-xs font-medium text-gray-600">Description</span>
                            <textarea
                                value={courseForm.description}
                                onChange={(e) => setCourseForm((current) => ({ ...current, description: e.target.value }))}
                                rows={3}
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                            />
                        </label>

                        <label className="space-y-1 md:col-span-2">
                            <span className="text-xs font-medium text-gray-600">Cover image URL</span>
                            <input
                                value={courseForm.cover_image_url}
                                onChange={(e) => setCourseForm((current) => ({ ...current, cover_image_url: e.target.value }))}
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                            />
                        </label>

                        <label className="space-y-1 md:col-span-2">
                            <span className="text-xs font-medium text-gray-600">Metadata JSON</span>
                            <textarea
                                value={courseForm.metadata_json}
                                onChange={(e) => setCourseForm((current) => ({ ...current, metadata_json: e.target.value }))}
                                rows={4}
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm font-mono outline-none focus:border-blue-500"
                            />
                        </label>
                    </div>

                    <button
                        type="button"
                        onClick={handleCreateCourse}
                        disabled={saving === "course"}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-70"
                    >
                        {saving === "course" ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        ساخت Course
                    </button>
                </section>

                <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                        <Layers3 size={18} className="text-blue-600" />
                        <h2 className="text-base font-semibold text-gray-900">ساخت Section</h2>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="space-y-1">
                            <span className="text-xs font-medium text-gray-600">Course</span>
                            <select
                                value={sectionForm.course_id}
                                onChange={(e) => setSectionForm((current) => ({ ...current, course_id: e.target.value }))}
                                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
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
                            <span className="text-xs font-medium text-gray-600">Order index</span>
                            <input
                                type="number"
                                value={sectionForm.order_index}
                                onChange={(e) => setSectionForm((current) => ({ ...current, order_index: e.target.value }))}
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                            />
                        </label>

                        <label className="space-y-1 md:col-span-2">
                            <span className="text-xs font-medium text-gray-600">Title</span>
                            <input
                                value={sectionForm.title}
                                onChange={(e) => setSectionForm((current) => ({ ...current, title: e.target.value }))}
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                            />
                        </label>

                        <label className="space-y-1 md:col-span-2">
                            <span className="text-xs font-medium text-gray-600">Metadata JSON</span>
                            <textarea
                                value={sectionForm.metadata_json}
                                onChange={(e) => setSectionForm((current) => ({ ...current, metadata_json: e.target.value }))}
                                rows={3}
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm font-mono outline-none focus:border-blue-500"
                            />
                        </label>
                    </div>

                    <button
                        type="button"
                        onClick={handleCreateSection}
                        disabled={saving === "section"}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-70"
                    >
                        {saving === "section" ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        ساخت Section
                    </button>
                </section>

                <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                        <Video size={18} className="text-blue-600" />
                        <h2 className="text-base font-semibold text-gray-900">ساخت Lesson</h2>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="space-y-1">
                            <span className="text-xs font-medium text-gray-600">Course</span>
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
                                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
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
                            <span className="text-xs font-medium text-gray-600">Section</span>
                            <select
                                value={lessonForm.section_id}
                                onChange={(e) => setLessonForm((current) => ({ ...current, section_id: e.target.value }))}
                                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
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
                            <span className="text-xs font-medium text-gray-600">Title</span>
                            <input
                                value={lessonForm.title}
                                onChange={(e) => setLessonForm((current) => ({ ...current, title: e.target.value }))}
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                            />
                        </label>

                        <label className="space-y-1">
                            <span className="text-xs font-medium text-gray-600">Duration minutes</span>
                            <input
                                type="number"
                                value={lessonForm.duration_minutes}
                                onChange={(e) => setLessonForm((current) => ({ ...current, duration_minutes: e.target.value }))}
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                            />
                        </label>

                        <label className="space-y-1">
                            <span className="text-xs font-medium text-gray-600">Video URL</span>
                            <input
                                value={lessonForm.video_url}
                                onChange={(e) => setLessonForm((current) => ({ ...current, video_url: e.target.value }))}
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                            />
                        </label>

                        <label className="flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-2 md:col-span-2">
                            <input
                                type="checkbox"
                                checked={lessonForm.is_free}
                                onChange={(e) => setLessonForm((current) => ({ ...current, is_free: e.target.checked }))}
                                className="h-4 w-4"
                            />
                            <span className="text-sm text-gray-700">Free lesson</span>
                        </label>

                        <label className="space-y-1 md:col-span-2">
                            <span className="text-xs font-medium text-gray-600">Metadata JSON</span>
                            <textarea
                                value={lessonForm.metadata_json}
                                onChange={(e) => setLessonForm((current) => ({ ...current, metadata_json: e.target.value }))}
                                rows={4}
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm font-mono outline-none focus:border-blue-500"
                            />
                        </label>
                    </div>

                    <button
                        type="button"
                        onClick={handleCreateLesson}
                        disabled={saving === "lesson"}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-70"
                    >
                        {saving === "lesson" ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        ساخت Lesson
                    </button>
                </section>

                {loading && (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-4 text-center text-sm text-gray-500">
                        در حال بارگذاری...
                    </div>
                )}
            </main>
        </div>
    );
}
