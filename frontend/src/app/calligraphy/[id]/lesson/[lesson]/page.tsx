"use client";

import { useParams } from "next/navigation";
import CalligraphyDetailPage from "@/components/course/CalligraphyDetailPage";
import PlannedLessonPage from "@/components/course/PlannedLessonPage";
import { CALLIGRAPHY_CATALOG, getCalligraphyCourse } from "@/lib/calligraphyCatalog";

export default function CalligraphyLessonPage() {
    const params = useParams<{ id: string; lesson: string }>();
    const course = getCalligraphyCourse(params?.id);
    const position = Number(params?.lesson);
    // Legacy flat URLs cannot identify a level with its own lesson numbering.
    if (course?.levels && Number.isInteger(position) && position >= 1 && position <= course.lessonCount) {
        return <CalligraphyDetailPage />;
    }
    return (
        <PlannedLessonPage
            domain="calligraphy"
            title="خطاطی"
            basePath="/calligraphy"
            catalog={CALLIGRAPHY_CATALOG}
            unitLabel="درس"
            unitPlural="درس‌ها"
            requirePublishedMedia
        />
    );
}
