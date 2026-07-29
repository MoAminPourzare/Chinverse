import type { ResumeData } from "@/services/user.service";

export type VisibleSocialLink = {
    platform: string;
    handle: string;
};

export type ResumePreviewItem = {
    title?: string;
    subtitle?: string;
    meta?: string;
};

type RawSocialLink = {
    platform?: string | null;
    handle?: string | null;
};

export const cleanProfileText = (value?: string | null) => value?.trim() || "";

export const getVisibleWebsites = (websites?: Array<string | null> | null): string[] =>
    (websites ?? []).map(cleanProfileText).filter((url): url is string => Boolean(url));

export const getVisibleSocials = (socials?: RawSocialLink[] | null): VisibleSocialLink[] =>
    (socials ?? [])
        .map((social) => ({
            platform: cleanProfileText(social.platform),
            handle: cleanProfileText(social.handle),
        }))
        .filter((social) => Boolean(social.platform && social.handle));

export const hasResumePreviewItemContent = (item: ResumePreviewItem) =>
    Boolean(cleanProfileText(item.title) || cleanProfileText(item.subtitle) || cleanProfileText(item.meta));

const cleanResumeItems = <T extends object>(items?: T[]): T[] =>
    (items ?? [])
        .map((item) =>
            Object.fromEntries(
                Object.entries(item).map(([key, value]) => [key, cleanProfileText(String(value ?? ""))]),
            ) as T,
        )
        .filter((item) => Object.values(item).some((value) => cleanProfileText(String(value ?? ""))));

export const cleanResumeData = (resume?: ResumeData | null): ResumeData => ({
    work_experiences: cleanResumeItems(resume?.work_experiences),
    educations: cleanResumeItems(resume?.educations),
    certificates: cleanResumeItems(resume?.certificates),
    awards: cleanResumeItems(resume?.awards),
    skills: cleanResumeItems(resume?.skills),
    languages: cleanResumeItems(resume?.languages),
});

export const isResumeEmpty = (resume?: ResumeData | null) => {
    if (!resume) return true;

    const cleanResume = cleanResumeData(resume);
    const sections = [
        cleanResume.work_experiences,
        cleanResume.educations,
        cleanResume.certificates,
        cleanResume.awards,
        cleanResume.skills,
        cleanResume.languages,
    ];

    return sections.every((items) => items.length === 0);
};
