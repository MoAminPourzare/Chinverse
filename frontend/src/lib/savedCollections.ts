import api from "@/lib/api";
import { checkCourseSaved, saveCourse, unsaveCourse } from "@/lib/courses";

export interface CollectionKey { domain: string; slug: string }
export interface BookmarkTarget { domain: string; slug?: string; courseId?: number }

const catalogPath = ({ domain, slug }: BookmarkTarget) =>
    `/collections/${encodeURIComponent(domain)}/${encodeURIComponent(slug || "")}`;

export const fetchSavedCollectionKeys = async (): Promise<CollectionKey[]> => {
    const response = await api.get<CollectionKey[]>("/collections/saved", { params: { limit: 1000 }, chinverseCacheTtlMs: 0 });
    return Array.isArray(response.data) ? response.data : [];
};

export const checkCollectionSaved = async (target: BookmarkTarget): Promise<boolean> => {
    if (!target.slug) return target.courseId ? checkCourseSaved(target.courseId) : false;
    const response = await api.get<{ saved: boolean }>(`${catalogPath(target)}/saved`, { chinverseCacheTtlMs: 0 });
    // Recognize previously saved published courses as well as catalog bookmarks.
    return Boolean(response.data.saved) || (target.courseId ? await checkCourseSaved(target.courseId) : false);
};

export const updateCollectionSaved = async (target: BookmarkTarget, saved: boolean): Promise<boolean> => {
    if (!target.slug) {
        if (!target.courseId) throw new Error("Missing collection identity");
        return saved ? saveCourse(target.courseId) : unsaveCourse(target.courseId);
    }
    if (saved) {
        const response = await api.post<{ saved: boolean }>(`${catalogPath(target)}/save`);
        return Boolean(response.data.saved);
    }
    // Remove an older published-course bookmark too, so it cannot reappear.
    if (target.courseId) await unsaveCourse(target.courseId);
    const response = await api.delete<{ saved: boolean }>(`${catalogPath(target)}/save`);
    return Boolean(response.data.saved);
};

export const getBookmarkErrorMessage = (error: unknown): string => {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 401) return "برای ذخیره کردن مجموعه وارد حساب کاربری شو.";
    if (status === 403) return "حساب کاربری اجازهٔ ذخیره کردن این مجموعه را ندارد.";
    if (status === 429) return "کمی صبر کن و دوباره ذخیره را امتحان کن.";
    return "ذخیرهٔ مجموعه انجام نشد؛ دوباره تلاش کن.";
};
