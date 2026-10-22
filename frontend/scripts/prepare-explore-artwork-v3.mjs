// Prepare the owner's first learning set and all six complete panoramic banners.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const source = path.join(repo, "فایل های اپلیکیشن من/تصاویر بخش کاوش2");
const target = path.join(repo, "frontend/public/assets/chinverse/explore");
const sets = [
    {
        directory: "یادگیری زبان چینی/ست اول",
        width: 768,
        files: {
            hsk: "HSK.png",
            pronunciation: "تلفظ.png",
            characters: "کاراکتر.png",
            grammar: "گرامر.png",
            idioms: "اصطلاحات و ضرب المثل‌های ادبی.png",
            practical: "چینی کاربردی.png",
            vlogs: "یادگیری با ولاگ.png",
            synonyms: "واژگان هم معنی.png",
            classical: "زبان چینی کلاسیک.png",
        },
    },
    {
        directory: "سرگرمی چینی/ست اول",
        width: 1536,
        files: {
            music: "موسیقی.png",
            podcasts: "پادکست.png",
            "topic-talks": "گفتارهای موضوعی.png",
            movies: "فیلم.png",
            series: "سریال.png",
            cartoons: "انیمیشن و کارتون.png",
        },
    },
];

await fs.mkdir(target, { recursive: true });
const outputs = [];
for (const set of sets) {
    for (const [id, filename] of Object.entries(set.files)) {
        const input = path.join(source, set.directory, filename);
        const output = path.join(target, `${id}-v3.webp`);
        // Keep each original composition and aspect ratio, with no source crop.
        const info = await sharp(input)
            .resize({ width: set.width, withoutEnlargement: true })
            .webp({ quality: 88, effort: 6 })
            .toFile(output);
        outputs.push({ id, width: info.width, height: info.height, bytes: info.size });
    }
}
console.log(JSON.stringify({ images: outputs, totalBytes: outputs.reduce((sum, image) => sum + image.bytes, 0) }, null, 2));
