import { HSK_CATALOG } from "@/lib/hskCatalog";
import { PRONUNCIATION_CATALOG } from "@/lib/pronunciationCatalog";
import { CHARACTER_CATALOG } from "@/lib/characterCatalog";
import { GRAMMAR_CATALOG } from "@/lib/grammarCatalog";
import { IDIOMS_CATALOG } from "@/lib/idiomsCatalog";
import { PRACTICAL_CATALOG } from "@/lib/practicalCatalog";
import { VLOGS_CATALOG } from "@/lib/vlogsCatalog";
import { SYNONYMS_CATALOG } from "@/lib/synonymsCatalog";
import { CLASSICAL_CATALOG } from "@/lib/classicalCatalog";
import { SERIES_CATALOG } from "@/lib/seriesCatalog";
import { MOVIE_CATALOG } from "@/lib/movieCatalog";
import { CARTOON_CATALOG } from "@/lib/cartoonCatalog";
import { COOKING_CATALOG } from "@/lib/cookingCatalog";
import { PODCAST_CATALOG } from "@/lib/podcastCatalog";
import { MUSIC_ARTIST_CATALOG } from "@/lib/musicArtistCatalog";
import { MARTIAL_ARTS_CATALOG } from "@/lib/martialArtsCatalog";
import { ENERGY_HEALTH_CATALOG } from "@/lib/energyHealthCatalog";
import { CALLIGRAPHY_CATALOG } from "@/lib/calligraphyCatalog";
import { TEA_CULTURE_CATALOG } from "@/lib/teaCultureCatalog";
import { CULTURE_TEXTS_CATALOG } from "@/lib/cultureTextsCatalog";
import { HISTORICAL_STORIES_CATALOG } from "@/lib/historicalStoriesCatalog";
import { CLASSICAL_POETRY_CATALOG } from "@/lib/classicalPoetryCatalog";
import { FESTIVALS_CUSTOMS_CATALOG } from "@/lib/festivalsCustomsCatalog";
import { TOPIC_TALKS_CATALOG } from "@/lib/topicTalksCatalog";
import { getCourseDetailHref, getDisplayCount, type Course } from "@/lib/courses";
import type { CollectionKey } from "@/lib/savedCollections";

interface CatalogItem {
    slug: string; title: string; coverPath?: string; posterPath?: string; portraitPath?: string;
    lessonCount?: number; episodeCount?: number; episodeTitles?: string[];
    groups?: { episodeCount: number }[]; releases?: unknown[];
}

export const COLLECTION_CATALOGS: Record<string, CatalogItem[]> = {
    hsk: HSK_CATALOG, pronunciation: PRONUNCIATION_CATALOG, characters: CHARACTER_CATALOG,
    grammar: GRAMMAR_CATALOG, idioms: IDIOMS_CATALOG, practical: PRACTICAL_CATALOG,
    vlogs: VLOGS_CATALOG, synonyms: SYNONYMS_CATALOG, classical: CLASSICAL_CATALOG,
    series: SERIES_CATALOG, movies: MOVIE_CATALOG, cartoons: CARTOON_CATALOG,
    cooking: COOKING_CATALOG, podcasts: PODCAST_CATALOG, music: MUSIC_ARTIST_CATALOG, "topic-talks": TOPIC_TALKS_CATALOG,
    "martial-arts": MARTIAL_ARTS_CATALOG, "energy-health": ENERGY_HEALTH_CATALOG,
    calligraphy: CALLIGRAPHY_CATALOG, "tea-culture": TEA_CULTURE_CATALOG,
    "culture-texts": CULTURE_TEXTS_CATALOG, "historical-stories": HISTORICAL_STORIES_CATALOG,
    "classical-poetry": CLASSICAL_POETRY_CATALOG, "festivals-customs": FESTIVALS_CUSTOMS_CATALOG,
};

export interface SavedCollectionCard { key: string; href: string; title: string; cover?: string; countText: string }

export const getCatalogCollection = ({ domain, slug }: CollectionKey): SavedCollectionCard | undefined => {
    const item = COLLECTION_CATALOGS[domain]?.find((entry) => entry.slug === slug);
    if (!item) return undefined;
    const count = item.lessonCount || item.episodeCount || item.episodeTitles?.length
        || item.groups?.reduce((total, group) => total + group.episodeCount, 0) || item.releases?.length;
    const unit = domain === "music" ? "اثر" : ["series", "movies", "cartoons", "podcasts"].includes(domain) ? "قسمت" : "درس";
    return { key: `${domain}/${slug}`, href: `/${domain}/${slug}`, title: item.title,
        cover: item.coverPath || item.posterPath || item.portraitPath, countText: count ? `${count} ${unit}` : "مجموعه" };
};

export const mergeSavedCollections = (courses: Course[], keys: CollectionKey[]): SavedCollectionCard[] => {
    const entries = new Map<string, SavedCollectionCard>();
    for (const key of keys) {
        const item = getCatalogCollection(key);
        if (item) entries.set(item.key, item);
    }
    for (const course of courses) {
        const canonical = course.slug && course.subcategory_slug
            ? getCatalogCollection({ domain: course.subcategory_slug, slug: course.slug }) : undefined;
        const item = canonical || { key: `course/${course.id}`, href: getCourseDetailHref(course), title: course.title,
            cover: course.cover_image_url || undefined, countText: getDisplayCount(course, ["lesson_count", "episodes_count", "tracks_count"], "بخش") };
        if (!entries.has(item.key)) entries.set(item.key, item);
    }
    return [...entries.values()];
};
