import type { UserProfile } from "@/services/user.service";

export function getProfileJobTitles(profile?: Pick<UserProfile, "headline" | "job_titles"> | null): string[] {
    const titles = profile?.job_titles?.length ? profile.job_titles : [profile?.headline || ""];
    return [...new Set(titles.map((title) => title.trim()).filter(Boolean))];
}
