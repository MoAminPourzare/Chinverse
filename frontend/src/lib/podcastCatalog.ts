import { PODCAST_EPISODE_TITLES } from "@/lib/podcastEpisodeTitles";

export interface PodcastLevelGroup {
    slug: string;
    title: string;
    episodeCount: number;
}

export type PodcastCatalogItem = {
    slug: string;
    title: string;
    titleLines?: string[];
    subtitle: string;
    coverPath: string;
} & ({ episodeTitles: string[]; groups?: never } | { groups: PodcastLevelGroup[]; episodeTitles?: never });

const cover = (filename: string) => `/assets/chinverse/course-profiles/${encodeURIComponent(filename)}`;

export const PODCAST_CATALOG: PodcastCatalogItem[] = [
    {
        slug: "chinese-daily", title: "Chinese Daily Podcast", subtitle: "（简单生活，简单汉语）",
        coverPath: cover("Chinese Daily Podcast.jpeg"),
        groups: [
            { slug: "beginner", title: "初级 (HSK 1–3)", episodeCount: 34 },
            { slug: "intermediate", title: "中级 (HSK 3–4)", episodeCount: 14 },
            { slug: "advanced", title: "高级 (HSK 5–6)", episodeCount: 5 },
        ],
    },
    {
        slug: "practical-mandarin", title: "Practical Mandarin Podcast", titleLines: ["Practical Mandarin", "Podcast"],
        subtitle: "（地道中文表达）", coverPath: cover("地道中文表达.jpeg"),
        episodeTitles: PODCAST_EPISODE_TITLES["practical-mandarin"],
    },
    {
        slug: "chinese-podcast-zone", title: "Chinese Podcast Zone", subtitle: "（情景中文）",
        coverPath: cover("Chinese Podcast Zone.jpeg"), episodeTitles: PODCAST_EPISODE_TITLES["chinese-podcast-zone"],
    },
    {
        slug: "da-peng", title: "大鹏说中文", subtitle: "(# Chinese Talk)",
        coverPath: cover("大鹏说中文.jpeg"), episodeTitles: PODCAST_EPISODE_TITLES["da-peng"],
    },
    {
        slug: "bumingbai", title: "不明白播客", subtitle: "（列表）",
        coverPath: cover("不明白播客.jpeg"), episodeTitles: PODCAST_EPISODE_TITLES.bumingbai,
    },
];

export const getPodcast = (slug: string | undefined): PodcastCatalogItem | undefined =>
    PODCAST_CATALOG.find((podcast) => podcast.slug === slug);

export const getPodcastEpisodeCount = (podcast: PodcastCatalogItem): number =>
    podcast.groups ? podcast.groups.reduce((count, group) => count + group.episodeCount, 0) : podcast.episodeTitles.length;
