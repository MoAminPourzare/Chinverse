import { copyFileSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(frontend, "public");
const packageDir = path.resolve(process.argv[2] || path.join(frontend, "../.tmp/font-package/package"));
const fontDir = path.join(publicDir, "fonts/wenkai-screen");
mkdirSync(fontDir, { recursive: true });
const sourceCss = readFileSync(path.join(packageDir, "lxgwwenkaigbscreen.css"), "utf8");
const chineseRanges = [[0x2e80, 0x303f], [0x3100, 0x31bf], [0x3400, 0x4dbf], [0x4e00, 0x9fff], [0xf900, 0xfaff], [0xfe10, 0xfe1f], [0xfe30, 0xfe4f], [0xff00, 0xffef], [0x20000, 0x323af]];
const faces = [];
let fontBytes = 0;
for (const face of sourceCss.matchAll(/@font-face\s*\{([^}]+)\}/g)) {
    const ranges = face[1].match(/unicode-range:\s*([^;\n}]+)/)[1];
    const filtered = [];
    for (const range of ranges.split(",")) {
        const [start, end = start] = range.trim().replace(/^U\+/i, "").split("-").map((hex) => parseInt(hex, 16));
        for (const [lower, upper] of chineseRanges) {
            const lo = Math.max(start, lower), hi = Math.min(end, upper);
            if (lo <= hi) filtered.push(`U+${lo.toString(16)}${hi > lo ? `-${hi.toString(16)}` : ""}`);
        }
    }
    if (!filtered.length) continue;
    const sourceFile = face[1].match(/url\('([^']+)'\)/)[1];
    const filename = path.basename(sourceFile);
    copyFileSync(path.join(packageDir, sourceFile), path.join(fontDir, filename));
    fontBytes += statSync(path.join(fontDir, filename)).size;
    faces.push(`@font-face {\n  font-family: "LXGW WenKai GB Screen";\n  font-style: normal;\n  font-weight: 400 900;\n  font-display: swap;\n  src: url("/fonts/wenkai-screen/${filename}") format("woff2");\n  unicode-range: ${filtered.join(", ")};\n}`);
}
copyFileSync(path.join(packageDir, "OFL.txt"), path.join(fontDir, "OFL.txt"));
copyFileSync(path.join(packageDir, "LICENSE"), path.join(fontDir, "WEBFONT-LICENSE.txt"));
writeFileSync(path.join(frontend, "src/app/chinese-font.css"), `/* LXGW WenKai GB Screen; lxgw-wenkai-screen-webfont 1.7.0, SIL OFL 1.1.\n   Original GB glyphs; CJK-only unicode ranges keep Persian and pinyin separate.\n   Shards load on demand from the same origin, never from an external font CDN. */\n${faces.join("\n")}\n`);

const assetDir = path.join(publicDir, "assets/chinverse");
const replacements = new Map([
    ["rgb(42,48,107)", "rgb(199,205,250)"], ["#2a306b", "#c7cdfa"],
    ["rgb(29,77,141)", "rgb(139,187,241)"], ["#1d4d8d", "#8bbbf1"],
]);
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === "dark") return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
});
const themed = {};
for (const file of walk(assetDir).filter((file) => file.endsWith(".svg"))) {
    const original = readFileSync(file, "utf8");
    const transformed = original.replace(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)|#[\da-f]{6}\b/gi, (paint, r, g, b) => replacements.get(r ? `rgb(${r},${g},${b})` : paint.toLowerCase()) || paint);
    if (transformed === original) continue;
    const relative = path.relative(assetDir, file).split(path.sep).join("/");
    const target = path.join(assetDir, "dark", relative);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, transformed);
    themed[`/assets/chinverse/${relative}`] = `/assets/chinverse/dark/${relative}`;
}
writeFileSync(path.join(frontend, "src/lib/themedAssets.json"), JSON.stringify(themed, null, 2) + "\n");
console.log(JSON.stringify({ fontShards: faces.length, fontBytes, themedIllustrations: Object.keys(themed).length }));
