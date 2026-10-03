import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getMusicArtist, MUSIC_ARTIST_CATALOG } from "@/lib/musicArtistCatalog";
import { getFirstPublishedScreenMediaLesson } from "@/lib/screenMediaCatalog";

describe("music artist catalog", () => {
    it("matches the four owner-reference cards in display order", () => {
        expect(MUSIC_ARTIST_CATALOG.map((artist) => [artist.slug, artist.title, artist.displayName])).toEqual([
            ["jay-chou", "周杰伦", "Jay Chou"],
            ["gem", "邓紫棋", "G. E. M"],
            ["jj-lin", "林俊杰", "JJ Lin"],
            ["auro", "阿若 Auro", "Auro"],
        ]);
    });

    it("keeps profile content complete without inventing ratings or duration", () => {
        for (const artist of MUSIC_ARTIST_CATALOG) {
            expect(artist.pinyin).toBeTruthy();
            expect(artist.portraitPath).toBeTruthy();
            expect(artist.biography.length).toBeGreaterThan(0);
            expect(artist.styles.length).toBeGreaterThan(0);
            expect(artist).not.toHaveProperty("rating");
            expect(artist).not.toHaveProperty("duration");
        }
        expect(getMusicArtist("auro")?.pinyin).toBe("ā ruò");
        expect(getMusicArtist("missing")).toBeUndefined();
    });

    it("matches every reference album title, year and song count in order", () => {
        const rows = (slug: string) => getMusicArtist(slug)?.releases.map((release) => [release.title, release.year, release.trackCount]);
        expect(rows("jay-chou")).toEqual([
            ["最伟大的作品", 2022, 12], ["周杰伦的床边故事", 2016, 12], ["哎呦，不错哦", 2014, 12],
            ["十二新作", 2012, 12], ["惊叹号", 2011, 11], ["跨时代", 2010, 11],
            ["魔杰座", 2008, 11], ["我很忙", 2007, 10], ["依然范特西", 2006, 10],
            ["十一月的萧邦", 2005, 12], ["七里香", 2004, 10], ["叶惠美", 2003, 11],
            ["八度空间", 2002, 10], ["范特西", 2001, 10], ["Jay", 2000, 10],
        ]);
        expect(rows("gem")).toEqual([
            ["启示录", 2022, 10], ["摩天动物", 2019, 13], ["新的心跳", 2015, 11],
            ["Xposed", 2012, 10], ["我的秘密", 2010, 10], ["18...", 2009, 12], ["G.E.M.", 2008, 5],
        ]);
        expect(rows("jj-lin")).toEqual([
            ["重拾_快乐", 2023, 12], ["幸存者—如你", 2020, 13], ["伟大的渺小", 2017, 11],
            ["和自己对话", 2015, 10], ["新地球", 2015, 11], ["因你而在", 2013, 13],
            ["学不会", 2011, 12], ["她说", 2010, 14], ["100天", 2009, 12],
            ["JJ陆", 2008, 11], ["西界", 2007, 11], ["曹操", 2006, 11],
            ["编号89757", 2005, 11], ["第二天堂", 2004, 11], ["乐行者", 2003, 11],
        ]);
    });

    it("preserves the eleven Auro cards without merging repeated titles", () => {
        const releases = getMusicArtist("auro")!.releases;
        expect(releases.map((release) => release.title)).toEqual([
            "一剪梅", "彩云追月", "女儿情", "被遗忘的时光", "昨夜小楼又东风", "在那遥远的地方",
            "绿岛小夜曲", "女儿情", "梦驼铃", "新鸳鸯蝴蝶梦", "在水一方",
        ]);
        expect(new Set(releases.map((release) => release.slug)).size).toBe(11);
        expect(releases.every((release) => release.kind === "song" && !release.coverPaths && !release.year && !release.trackCount)).toBe(true);
    });

    it("resolves all portraits and album covers to local files", () => {
        for (const artist of MUSIC_ARTIST_CATALOG) {
            const paths = [artist.portraitPath, artist.detailPortraitPath, ...artist.releases.flatMap((release) => release.coverPaths || [])];
            for (const path of paths.filter((path): path is string => Boolean(path))) {
                expect(existsSync(join(process.cwd(), "public", decodeURIComponent(path))), path).toBe(true);
            }
            if (artist.slug !== "auro") expect(artist.releases.every((release) => release.coverPaths?.length)).toBe(true);
        }
        expect(getMusicArtist("jj-lin")?.releases[1].coverPaths).toHaveLength(2);
    });

    it("links playback only to a media-backed published track", () => {
        const course = {
            id: 18,
            title: "music",
            description: "",
            level: "music",
            sections: [
                { id: 2, order_index: 2, lessons: [{ id: 42, media_id: 9 }] },
                { id: 1, order_index: 1, lessons: [{ id: 41, media_id: null }] },
            ],
        };
        expect(getFirstPublishedScreenMediaLesson(course)?.id).toBe(42);
        expect(getFirstPublishedScreenMediaLesson({ ...course, sections: [{ id: 1, lessons: [{ id: 41, media_id: null }] }] })).toBeUndefined();
    });
});
