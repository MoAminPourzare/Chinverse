// Runtime copies of the owner's latest Explore set; source PNGs stay intact.
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const source = path.join(repo, "فایل های اپلیکیشن من/آخرین ورژن تصاویر کاوش");
const target = path.join(repo, "frontend/public/assets/chinverse/explore/v4");
const sets = [
    {
        directory: "یادگیری زبان چینی",
        files: {
            "learning-icon": "آیکون اصلی.png", "learning-hero": "بنر بالای صفحه.png",
            hsk: "HSK.png", idioms: "اصطلاحات و ضرب المثل های ادبی.png", pronunciation: "تلفظ.png",
            characters: "کاراکتر.png", grammar: "گرامر.png", practical: "چینی کاربردی2.png",
            synonyms: "واژگان هم معنی2.png", classical: "زبان چینی کلاسیک.png", vlogs: "یادگیری با ولاگ.png",
        },
    },
    {
        directory: "سرگرمی چینی",
        files: {
            "entertainment-icon": "آیکون اصلی.png", "entertainment-hero": "Dreamy ChinaVerse Study Nook.png",
            podcasts: "پادکست 2.png", "topic-talks": "گفتارهای موضوعی.png", movies: "فیلم.png",
            series: "سریال.png", cartoons: "انیمیشن و کارتون.png", music: "موسیقی.png",
        },
    },
    {
        directory: "هنر و مهارتهای چینی",
        files: {
            "arts-icon": "آیکون اصلی.png 2.png", "arts-hero": "Chinese Calligraphy and Culinary Charm.png",
            cooking: "آشپزی.2.png", "martial-arts": "هنرهای رزمی.png", "energy-health": "تمرین های انرژی و سلامت.png", calligraphy: "خطاطی3.png",
        },
    },
    {
        directory: "فرهنگ و اندیشه چینی",
        files: {
            "culture-icon": "آیکون اصلی.png", "culture-hero": "A Girl’s Springtime Chinese Tale.png",
            "festivals-customs": "آییین ها و جشن ها.2.png", "china-beyond-language": "چین، فراتر از زبان.png",
            "historical-stories": "داستان های کهن.png", "classical-poetry": "Chinese Poetry Book with Cherry Blossoms.png",
            "culture-texts": "متون کلاسیک آموزشی.png", "tea-culture": "فرهنگ چای.png",
        },
    },
];

await fs.mkdir(target, { recursive: true });
const manifest = [];
for (const set of sets) {
    for (const [id, filename] of Object.entries(set.files)) {
        const hero = id.endsWith("-hero");
        const output = path.join(target, `${id}.webp`);
        const info = await sharp(path.join(source, set.directory, filename))
            .resize({ width: hero ? 1200 : 640, height: hero ? undefined : 640, fit: "inside", withoutEnlargement: true })
            .webp({ quality: hero ? 90 : 86, effort: 6 }).toFile(output);
        const relative = path.relative(repo, output).replaceAll(path.sep, "/");
        const sha256 = crypto.createHash("sha256").update(await fs.readFile(output)).digest("hex");
        manifest.push({ path: relative, sha256, width: info.width, height: info.height, bytes: info.size });
    }
}

// Preserve the inventory's existing review policy; do not assert rights evidence.
const registryPath = path.join(repo, "docs/PHASE_5_MEDIA_LICENSE_REGISTRY.csv");
const registry = await fs.readFile(registryPath, "utf8");
const additions = manifest.filter(image => !registry.includes(`${image.path},`)).map(image =>
    `${image.path},${image.sha256},image,,,,review_required,Owner-provided latest Explore artwork; resized to WebP with original transparency and composition preserved.`,
);
if (additions.length) await fs.appendFile(registryPath, `${registry.endsWith("\n") ? "" : "\n"}${additions.join("\n")}\n`);
console.log(JSON.stringify({ images: manifest, registered: additions.length, totalBytes: manifest.reduce((sum, image) => sum + image.bytes, 0) }, null, 2));
