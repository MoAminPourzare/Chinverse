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

export const getPlannedLessonTitle = (course: PlannedCatalogCourse, position: number): string =>
    course.knownLessonTitles?.[position] || (course.fallbackLessonTitle ? `${course.fallbackLessonTitle} ${position}` : `第${position}课`);
