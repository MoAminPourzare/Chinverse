// ابزار مشترک تمام فازها؛ کد قابل تمرین در practice یا پوشهٔ هر فاز قرار دارد.
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolvePhase } from "./phases.mjs";
import { checkPhase } from "./check.mjs";

try {
    const phase = resolvePhase(process.argv[2]);
    if (!checkPhase(phase)) process.exit(1);

    const requireFrontend = createRequire(new URL("../../frontend/package.json", import.meta.url));
    const ts = requireFrontend("typescript");
    const { createServer } = await import(pathToFileURL(requireFrontend.resolve("vite")).href);
    const frontendModules = fileURLToPath(new URL("../../frontend/node_modules", import.meta.url));

    // فقط وقتی Inspector وجود دارد، نسخهٔ مقایسه‌ای بساز؛ اجرای اصلی صفحه همچنان با Vite است.
    if (existsSync(join(phase.root, "src", "Inspector.tsx"))) {
        await mkdir(join(phase.root, "generated"), { recursive: true });
        for (const name of ["BookCard", "App"]) {
            const source = await readFile(join(phase.root, "src", `${name}.tsx`), "utf8");
            const result = ts.transpileModule(source, {
                fileName: `${name}.tsx`,
                compilerOptions: {
                    target: ts.ScriptTarget.ES2020,
                    module: ts.ModuleKind.ESNext,
                    jsx: ts.JsxEmit.ReactJSX,
                    removeComments: true,
                },
            });
            await writeFile(join(phase.root, "generated", `${name}.js`), result.outputText, "utf8");
        }
    }

    const port = Number(process.env.LESSON_PORT ?? 4174);
    if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("LESSON_PORT باید یک شمارهٔ پورت معتبر بین 1024 و 65535 باشد.");
    const server = await createServer({
        configFile: false,
        envFile: false,
        root: phase.root,
        cacheDir: join(phase.root, ".vite-cache"),
        oxc: { jsx: { runtime: "automatic" } },
        css: { postcss: { plugins: [] } },
        resolve: {
            alias: {
                react: dirname(requireFrontend.resolve("react/package.json")),
                "react-dom": dirname(requireFrontend.resolve("react-dom/package.json")),
            },
            dedupe: ["react", "react-dom"],
        },
        optimizeDeps: { include: ["react", "react-dom/client", "react/jsx-runtime"] },
        server: { host: "127.0.0.1", port, strictPort: true, fs: { allow: [phase.root, frontendModules] } },
    });
    await server.listen();
    console.log(`\n${phase.id} — ${phase.title}\nپوشهٔ فعال: ${phase.root}`);
    server.printUrls();
    console.log("برای تغییر فاز یا توقف، Ctrl+C بزن. بررسی کد فقط هنگام شروع اجرا می‌شود.");
    if (existsSync(join(phase.root, "src", "Inspector.tsx"))) console.log("خروجی generated هنگام شروع ساخته می‌شود؛ بعد از تغییر سورس سرور را دوباره اجرا کن.");
    for (const signal of ["SIGINT", "SIGTERM"]) {
        process.once(signal, async () => {
            await server.close();
            process.exit(0);
        });
    }
} catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
}
