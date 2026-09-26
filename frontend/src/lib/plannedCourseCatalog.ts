export interface PlannedCatalogCourse {
    slug: string;
    title: string;
    cardTitle?: string;
    subtitle?: string;
    cardSubtitle?: string;
    coverPath: string;
    detailCoverPath?: string;
    detailImageAspect?: "square" | "video";
    lessonCount: number;
    chapterCount?: number;
    countSummary?: string;
    lessonGroupCounts?: Record<number, number>;
    practiceCount?: number;
    description: string[];
    introductionHeading?: string;
    audience: string[];
    fallbackLessonTitle?: string;
    knownLessonTitles?: Record<number, string>;
    knownLessonSubtitles: Record<number, string>;
    knownLessonThumbnails?: Record<number, string>;
}

export const getPlannedCourse = <T extends PlannedCatalogCourse>(catalog: T[], slug: string | undefined): T | undefined =>
    catalog.find((course) => course.slug === slug);

export const getPlannedItemCount = (course: PlannedCatalogCourse): number =>
    course.lessonCount + (course.practiceCount || 0);

export const getPlannedLessonTitle = (course: PlannedCatalogCourse, position: number): string =>
    course.knownLessonTitles?.[position] || (position > course.lessonCount && position <= getPlannedItemCount(course)
        ? `练习${position - course.lessonCount}`
        : course.fallbackLessonTitle ? `${course.fallbackLessonTitle} ${position}` : `第${position}课`);
