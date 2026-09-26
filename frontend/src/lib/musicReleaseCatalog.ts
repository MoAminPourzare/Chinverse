export type MusicReleaseCatalogItem = {
    slug: string;
    title: string;
    coverPaths?: string[];
    coverPositions?: string[];
} & ({ kind: "album"; year: number; trackCount: number } | { kind: "song"; year?: never; trackCount?: never });

const assetRoot = "/assets/chinverse/course-profiles/موسیقی";
const album = (folder: string, slug: string, title: string, year: number, trackCount: number, ...files: string[]): MusicReleaseCatalogItem => ({
    slug, title, kind: "album", year, trackCount,
    coverPaths: files.map((file) => `${assetRoot}/${folder}/${encodeURIComponent(file)}`),
});

/** Titles, ordering and counts follow the owner screenshots, including repeated song cards. */
export const MUSIC_RELEASE_CATALOG: Record<string, MusicReleaseCatalogItem[]> = {
    "jay-chou": [
        album("周杰伦 Jay", "greatest-works-of-art", "最伟大的作品", 2022, 12, "9c16fdfaaf51f3de378d0e1975fa5b153a2979ab.jpeg"),
        album("周杰伦 Jay", "bedtime-stories", "周杰伦的床边故事", 2016, 12, "周杰伦的床边故事.png"),
        album("周杰伦 Jay", "aiyo-not-bad", "哎呦，不错哦", 2014, 12, "1200x1200bf-60.jpg"),
        album("周杰伦 Jay", "opus-12", "十二新作", 2012, 12, "FjXIQELdtvJjb4ASpXRInD7X_Rcs.jpg!730x0.jpg"),
        album("周杰伦 Jay", "exclamation-mark", "惊叹号", 2011, 11, "039a27c0a9ee4ac2892122be6ffc8997.jpeg"),
        album("周杰伦 Jay", "the-era", "跨时代", 2010, 11, "fF6Xwg1id.png"),
        album("周杰伦 Jay", "capricorn", "魔杰座", 2008, 11, "fF6bYEc5y.png"),
        album("周杰伦 Jay", "on-the-run", "我很忙", 2007, 10, "fF6hztqXj.png"),
        album("周杰伦 Jay", "still-fantasy", "依然范特西", 2006, 10, "fF6iiPreE.png"),
        album("周杰伦 Jay", "novembers-chopin", "十一月的萧邦", 2005, 12, "fF6jNng95.png"),
        album("周杰伦 Jay", "common-jasmine-orange", "七里香", 2004, 10, "fF6jqyBem.png"),
        album("周杰伦 Jay", "ye-hui-mei", "叶惠美", 2003, 11, "fF6kGeK2M.png"),
        album("周杰伦 Jay", "eight-dimensions", "八度空间", 2002, 10, "fF6kkxacI.png"),
        album("周杰伦 Jay", "fantasy", "范特西", 2001, 10, "fF6lGYoky.png"),
        album("周杰伦 Jay", "jay", "Jay", 2000, 10, "u=766582930,1482429919&fm=253&app=138&f=JPEG.jpg"),
    ],
    gem: [
        album("G.E.M", "revelation", "启示录", 2022, 10, "Revelation(1).png"),
        album("G.E.M", "city-zoo", "摩天动物", 2019, 13, "摩天动物园.png"),
        album("G.E.M", "heartbeat", "新的心跳", 2015, 11, "新的心跳(1).png"),
        album("G.E.M", "xposed", "Xposed", 2012, 10, "Xposed(1).png"),
        album("G.E.M", "my-secret", "我的秘密", 2010, 10, "maxresdefault.png"),
        album("G.E.M", "eighteen", "18...", 2009, 12, "hq720.jpg"),
        album("G.E.M", "gem", "G.E.M.", 2008, 5, "s3727450.jpg"),
    ],
    "jj-lin": [
        album("林俊杰 JJ Lin", "happily-painfully-after", "重拾_快乐", 2023, 12, "Happily.png"),
        { ...album("林俊杰 JJ Lin", "drifter-like-you-do", "幸存者—如你", 2020, 13, "image_257676131761206.jpg", "image_301670630655251.jpg"), coverPositions: ["25% center", "center"] },
        album("林俊杰 JJ Lin", "message-in-a-bottle", "伟大的渺小", 2017, 11, "伟大的渺小.png"),
        album("林俊杰 JJ Lin", "from-me-to-myself", "和自己对话", 2015, 10, "from me to myself.png"),
        album("林俊杰 JJ Lin", "genesis", "新地球", 2015, 11, "新地球 .png"),
        album("林俊杰 JJ Lin", "stories-untold", "因你而在", 2013, 13, "因你而在.png"),
        album("林俊杰 JJ Lin", "lost-n-found", "学不会", 2011, 12, "学不会.png"),
        album("林俊杰 JJ Lin", "she-says", "她说", 2010, 14, "他说.png"),
        album("林俊杰 JJ Lin", "hundred-days", "100天", 2009, 12, "100天.png"),
        album("林俊杰 JJ Lin", "sixology", "JJ陆", 2008, 11, "JJ陆.png"),
        album("林俊杰 JJ Lin", "westside", "西界", 2007, 11, "西界.png"),
        album("林俊杰 JJ Lin", "cao-cao", "曹操", 2006, 11, "曹操.png"),
        album("林俊杰 JJ Lin", "number-89757", "编号89757", 2005, 11, "编号89757.png"),
        album("林俊杰 JJ Lin", "second-heaven", "第二天堂", 2004, 11, "第二天堂.png"),
        album("林俊杰 JJ Lin", "music-voyager", "乐行者", 2003, 11, "乐行者.png"),
    ],
    auro: [
        { kind: "song", slug: "a-spray-of-plum-blossoms", title: "一剪梅" },
        { kind: "song", slug: "colorful-clouds-chasing-the-moon", title: "彩云追月" },
        { kind: "song", slug: "daughter-love", title: "女儿情" },
        { kind: "song", slug: "forgotten-time", title: "被遗忘的时光" },
        { kind: "song", slug: "east-wind-again-last-night", title: "昨夜小楼又东风" },
        { kind: "song", slug: "in-that-distant-place", title: "在那遥远的地方" },
        { kind: "song", slug: "green-island-serenade", title: "绿岛小夜曲" },
        { kind: "song", slug: "daughter-love-2", title: "女儿情" },
        { kind: "song", slug: "dream-camel-bells", title: "梦驼铃" },
        { kind: "song", slug: "new-butterfly-dream", title: "新鸳鸯蝴蝶梦" },
        { kind: "song", slug: "on-the-other-side-of-the-water", title: "在水一方" },
    ],
};
