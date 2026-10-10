import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { gzipSync } from "node:zlib";

const root = process.cwd();
const publicDir = join(root, "public");
const chunksDir = join(root, ".next", "static", "chunks");
const watchManifest = join(
    root,
    ".next",
    "server",
    "app",
    "watch",
    "[domain]",
    "[courseId]",
    "page_client-reference-manifest.js",
);

const integerBudget = (name, fallback) => {
    const value = Number(process.env[name]);
    return Number.isSafeInteger(value) && value > 0 ? value : fallback;
};

const budgets = {
    publicBytes: integerBudget("CHINVERSE_PUBLIC_ASSET_BUDGET_BYTES", 80 * 1024 * 1024),
    totalJavaScriptBytes: integerBudget("CHINVERSE_JS_BUDGET_BYTES", 4 * 1024 * 1024),
    singleChunkBytes: integerBudget("CHINVERSE_CHUNK_BUDGET_BYTES", 600 * 1024),
    hlsGzipBytes: integerBudget("CHINVERSE_HLS_GZIP_BUDGET_BYTES", 180 * 1024),
};

const walk = (directory) => {
    if (!existsSync(directory)) return [];
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const target = join(directory, entry.name);
        return entry.isDirectory() ? walk(target) : [target];
    });
};

if (!existsSync(watchManifest)) {
    throw new Error("Production build is missing. Run `npm run build` before the performance budget check.");
}

const publicFiles = walk(publicDir);
const chunkFiles = walk(chunksDir).filter((file) => file.endsWith(".js"));
const publicBytes = publicFiles.reduce((total, file) => total + statSync(file).size, 0);
const totalJavaScriptBytes = chunkFiles.reduce((total, file) => total + statSync(file).size, 0);
const oversizedChunks = chunkFiles.filter((file) => statSync(file).size > budgets.singleChunkBytes);
const hlsChunks = chunkFiles.filter((file) => {
    const source = readFileSync(file, "utf8");
    return source.includes("Hls.isSupported") || (source.includes("MANIFEST_LOADING") && source.includes("FRAG_LOADING"));
});
const initialWatchManifest = readFileSync(watchManifest, "utf8");
const initialHlsChunks = hlsChunks.filter((file) => initialWatchManifest.includes(relative(chunksDir, file).replaceAll("\\", "/")));
const oversizedHlsChunks = hlsChunks.filter((file) => gzipSync(readFileSync(file)).length > budgets.hlsGzipBytes);

const failures = [];
if (publicBytes > budgets.publicBytes) failures.push(`public assets ${publicBytes} > ${budgets.publicBytes}`);
if (totalJavaScriptBytes > budgets.totalJavaScriptBytes) failures.push(`JavaScript ${totalJavaScriptBytes} > ${budgets.totalJavaScriptBytes}`);
if (oversizedChunks.length) failures.push(`oversized chunks: ${oversizedChunks.map((file) => relative(root, file)).join(", ")}`);
if (!hlsChunks.length) failures.push("hls.js async chunk was not found");
if (initialHlsChunks.length) failures.push("hls.js is part of the watch route initial payload");
if (oversizedHlsChunks.length) failures.push(`hls.js gzip exceeds ${budgets.hlsGzipBytes} bytes`);

console.log(JSON.stringify({
    publicBytes,
    publicBudgetBytes: budgets.publicBytes,
    totalJavaScriptBytes,
    javascriptBudgetBytes: budgets.totalJavaScriptBytes,
    hlsChunks: hlsChunks.map((file) => ({
        file: relative(root, file),
        rawBytes: statSync(file).size,
        gzipBytes: gzipSync(readFileSync(file)).length,
    })),
}, null, 2));

if (failures.length) {
    throw new Error(`Performance budget failed: ${failures.join("; ")}`);
}
