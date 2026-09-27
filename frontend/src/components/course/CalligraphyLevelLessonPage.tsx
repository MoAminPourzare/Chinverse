"use client";

import { useParams } from "next/navigation";
import CatalogEntryPage from "@/components/course/CatalogEntryPage";
import { getCalligraphyCourse } from "@/lib/calligraphyCatalog";
import { getPublishedCalligraphyLevelLesson } from "@/lib/calligraphyPublished";
import { usePublishedPlannedCourse } from "@/lib/usePublishedPlannedCourse";

export default function CalligraphyLevelLessonPage() {
    const params = useParams<{ id: string; level: string; lesson: string }>();
    const course = getCalligraphyCourse(params?.id);
    const level = course?.levels?.find((item) => item.slug === params?.level);
    const { publishedCourse, isLoading, hasError } = usePublishedPlannedCourse("calligraphy", course);
    const position = Number(params?.lesson);
    const valid = course && level && Number.isInteger(position) && position >= 1 && position <= level.lessonCount;
    const lesson = valid ? getPublishedCalligraphyLevelLesson(publishedCourse, level, position) : undefined;
    const backHref = course && level ? `/calligraphy/${course.slug}/level/${level.slug}` : course ? `/calligraphy/${course.slug}` : "/explore/calligraphy";
    return <CatalogEntryPage
        entry={valid ? { collectionTitle: `${course.title} · ${level.title}`, title: `第${position}课`, subtitle: lesson?.title } : undefined}
        backHref={backHref} isLoading={isLoading} hasError={hasError}
        watchHref={publishedCourse && lesson ? `/watch/calligraphy/${publishedCourse.id}?lesson=${lesson.id}` : undefined}
        previousHref={valid && position > 1 ? `${backHref}/lesson/${position - 1}` : undefined}
        nextHref={valid && position < level.lessonCount ? `${backHref}/lesson/${position + 1}` : undefined}
    />;
}
