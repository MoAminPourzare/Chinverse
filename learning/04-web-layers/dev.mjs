// سرور محلی این درس؛ از بسته‌های موجود frontend استفاده می‌کند و چیزی نصب نمی‌کند.
import "./check.mjs";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

if (process.exitCode) process.exit(process.exitCode);

const requireFrontend = createRequire(new URL("../../frontend/package.json", import.meta.url));
const ts = requireFrontend("typescript");
const { createServer } = await import(pathToFileURL(requireFrontend.resolve("vite")).href);
const root = fileURLToPath(new URL(".", import.meta.url));
const frontendModules = fileURLToPath(new URL("../../frontend/node_modules", import.meta.url));

await mkdir(join(root, "generated"), { recursive: true });
for (const name of ["BookCard", "App"]) {
    const source = await readFile(join(root, "src", `${name}.tsx`), "utf8");
    const result = ts.transpileModule(source, {
        fileName: `${name}.tsx`,
        compilerOptions: {
            target: ts.ScriptTarget.ES2020,
            module: ts.ModuleKind.ESNext,
            jsx: ts.JsxEmit.ReactJSX,
            removeComments: true,
        },
    });
    await writeFile(join(root, "generated", `${name}.js`), result.outputText, "utf8");
}

const server = await createServer({
    configFile: false,
    root,
    cacheDir: join(root, ".vite-cache"),
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
    server: {
        host: "127.0.0.1",
        port: 4173,
        strictPort: true,
        fs: { allow: [root, frontendModules] },
    },
});

await server.listen();
server.printUrls();
console.log("درس مستقل آماده است. برای توقف در ترمینال Ctrl+C بزن.");
console.log("generated/ برای مقایسهٔ آموزشی TypeScript → JavaScript است؛ اجرای صفحه با تبدیل Vite انجام می‌شود.");

for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, async () => {
        await server.close();
        process.exit(0);
    });
}
