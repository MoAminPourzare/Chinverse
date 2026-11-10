// ابزار آمادهٔ درس؛ فازهای اول بررسی نحو و فازهای ۹ و ۱۰ بررسی نوع دارند.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { phases, resolvePhase } from "./phases.mjs";

const requireFrontend = createRequire(new URL("../../frontend/package.json", import.meta.url));
const ts = requireFrontend("typescript");

function showDiagnostics(diagnostics) {
    console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCanonicalFileName: (name) => name,
        getCurrentDirectory: ts.sys.getCurrentDirectory,
        getNewLine: () => "\n",
    }));
}

function sourceFiles(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        if (["generated", ".vite-cache", "node_modules"].includes(entry.name)) return [];
        const filename = join(directory, entry.name);
        if (entry.isDirectory()) return sourceFiles(filename);
        return /\.(js|jsx|ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts") ? [filename] : [];
    });
}

export function checkPhase(phase, demoError = false) {
    const configPath = join(phase.root, "tsconfig.json");
    if (!existsSync(configPath)) {
        if (demoError) throw new Error("آزمایش خطای نوع را روی فاز 09 یا 10 اجرا کن.");
        const files = sourceFiles(phase.root);
        const diagnostics = files.flatMap((filename) => ts.transpileModule(readFileSync(filename, "utf8"), {
            fileName: filename,
            reportDiagnostics: true,
            compilerOptions: {
                target: ts.ScriptTarget.ES2020,
                module: ts.ModuleKind.ESNext,
                jsx: ts.JsxEmit.ReactJSX,
                allowJs: true,
            },
        }).diagnostics ?? []);
        if (diagnostics.length) showDiagnostics(diagnostics);
        else console.log(`${phase.id}: ${files.length ? "نحو JavaScript/JSX بررسی شد؛ بررسی نوع در فاز 09 اضافه می‌شود." : "صفحهٔ HTML/CSS آماده است؛ هنوز کد JavaScript برای بررسی نداریم."}`);
        return diagnostics.length === 0;
    }

    const loaded = ts.readConfigFile(configPath, ts.sys.readFile);
    if (loaded.error) {
        showDiagnostics([loaded.error]);
        return false;
    }
    const config = ts.parseJsonConfigFileContent(loaded.config, ts.sys, phase.root);
    const host = ts.createCompilerHost(config.options);
    if (demoError) {
        const originalReadFile = host.readFile.bind(host);
        const target = join(phase.root, "src", "books.ts").replaceAll("\\", "/").toLowerCase();
        host.readFile = (filename) => {
            const source = originalReadFile(filename);
            return filename.replaceAll("\\", "/").toLowerCase() === target
                ? source?.replace("price: 200000", 'price: "200000"')
                : source;
        };
        console.log("آزمایش آموزشی: فقط نسخهٔ حافظهٔ قیمت تغییر کرد؛ فایل اصلی دست‌نخورده است.");
    }
    const program = ts.createProgram(config.fileNames, config.options, host);
    const diagnostics = [...config.errors, ...ts.getPreEmitDiagnostics(program)];
    if (diagnostics.length) showDiagnostics(diagnostics);
    else console.log(`${phase.id}: بررسی نوع TypeScript موفق بود.`);
    return diagnostics.length === 0;
}

// واردکردن این فایل از dev.mjs فقط تابع را در اختیار آن می‌گذارد؛ این بخش مخصوص اجرای مستقیم است.
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
    try {
        const input = process.argv.slice(2).find((argument) => !argument.startsWith("--")) ?? "all";
        const demoError = process.argv.includes("--demo-error");
        if (demoError && input === "all") throw new Error("برای آزمایش خطا یک فاز مشخص بده: npm run check -- 09 --demo-error");
        const selected = input === "all" ? phases.map((phase) => resolvePhase(phase.id)) : [resolvePhase(input)];
        const results = selected.map((phase) => checkPhase(phase, demoError));
        if (results.some((success) => !success)) process.exitCode = 1;
    } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    }
}
