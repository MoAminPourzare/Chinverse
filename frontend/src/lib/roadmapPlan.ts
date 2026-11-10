import type { Course } from "@/lib/courses";
import { HSK_CATALOG, getHskLessonNumber, getHskLessonTopic, type HskCatalogCourse } from "@/lib/hskCatalog";
import type { LearningPath, LearningPathStep } from "@/lib/learningPath";

type PublishedStep = LearningPathStep & { key: string; availability: "published" };
type UpcomingStep = Omit<LearningPathStep, "lesson_id" | "course_id" | "state"> & {
    key: string;
    lesson_id: null;
    course_id: null;
    state: "locked";
    availability: "upcoming";
};
export type RoadmapItem = PublishedStep | UpcomingStep;

function plannedLessons(book: HskCatalogCourse, afterPosition = 0): UpcomingStep[] {
    return Array.from({ length: book.lessonCount - afterPosition }, (_, offset) => {
        const index = afterPosition + offset;
        const number = getHskLessonNumber(book, index).toLocaleString("fa-IR");
        const part = book.lessonPart ? (index % 2 === 0 ? " · بخش اول" : " · بخش دوم") : "";
        return {
            key: `planned:${book.slug}:${index + 1}`, availability: "upcoming", state: "locked",
            lesson_id: null, course_id: null, domain: "hsk", course_title: book.title,
            title: `درس ${number}${part}`, summary: getHskLessonTopic(book, index),
            duration_minutes: 0, cover_url: book.coverPath, kind: "lesson",
        };
    });
}

/** Upcoming slots never have playback IDs. They cannot affect server unlocks. */
export function buildRoadmapPlan(path: LearningPath, courses: Course[]) {
    const published: PublishedStep[] = path.steps.map(step => ({ ...step, key: `lesson:${step.lesson_id}`, availability: "published" }));
    const lastHsk = [...path.steps].reverse().find(step => step.kind === "lesson" && step.domain === "hsk");
    let upcoming: UpcomingStep[];
    if (!lastHsk) {
        // The public HSK syllabus exists even before its videos are published.
        upcoming = plannedLessons(HSK_CATALOG[0]);
    } else {
        const course = courses.find(item => item.id === lastHsk.course_id && item.subcategory_slug === "hsk");
        const book = HSK_CATALOG.find(item => item.slug === course?.slug);
        const pathIds = new Set(path.steps.filter(step => step.course_id === lastHsk.course_id).map(step => step.lesson_id));
        const positions = course?.sections?.flatMap(section => section.lessons || [])
            .filter(lesson => pathIds.has(lesson.id))
            .map(lesson => lesson.metadata_json?.lesson_index)
            .filter((position): position is number => typeof position === "number" && Number.isInteger(position) && position > 0 && Boolean(book && position <= book.lessonCount)) || [];
        if (book && positions.length > 0 && positions.length === pathIds.size) {
            const after = Math.max(...positions);
            const nextBook = HSK_CATALOG.find(item => item.order > book.order);
            upcoming = after < book.lessonCount ? plannedLessons(book, after) : nextBook ? plannedLessons(nextBook) : [];
        } else {
            // Without a verified lesson index, show real book milestones instead
            // of guessing which published lesson belongs in a syllabus slot.
            const normalize = (value: string) => value.replace(/\s+/g, "").toUpperCase();
            const knownBook = book || [...HSK_CATALOG].sort((a, b) => b.title.length - a.title.length)
                .find(item => normalize(lastHsk.course_title).startsWith(normalize(item.title)));
            upcoming = HSK_CATALOG.filter(item => !knownBook || item.order > knownBook.order).map(item => ({
                key: `planned:${item.slug}`, availability: "upcoming", state: "locked", lesson_id: null, course_id: null,
                domain: "hsk", course_title: "ادامهٔ برنامهٔ آموزشی", title: item.title,
                summary: item.tagline, duration_minutes: 0, cover_url: item.coverPath, kind: "lesson",
            }));
        }
    }
    return { steps: [...published, ...upcoming] as RoadmapItem[], total_count: published.length + upcoming.length,
        completed_count: path.completed_count, upcoming_count: upcoming.length };
}
