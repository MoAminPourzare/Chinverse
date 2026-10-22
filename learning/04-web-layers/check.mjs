// ابزار اجرا و بررسی درس؛ جزو منطق فروشگاه نیست.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const requireFrontend = createRequire(new URL("../../frontend/package.json", import.meta.url));
const ts = requireFrontend("typescript");
const configPath = fileURLToPath(new URL("tsconfig.json", import.meta.url));
const loaded = ts.readConfigFile(configPath, ts.sys.readFile);
if (loaded.error) throw new Error(ts.flattenDiagnosticMessageText(loaded.error.messageText, "\n"));

const config = ts.parseJsonConfigFileContent(loaded.config, ts.sys, fileURLToPath(new URL(".", import.meta.url)));
const host = ts.createCompilerHost(config.options);
if (process.argv.includes("--demo-error")) {
    // اشتباه عمدی فقط در نسخهٔ داخل حافظه است؛ فایل books.ts را تغییر نمی‌دهیم.
    const originalReadFile = host.readFile.bind(host);
    const target = fileURLToPath(new URL("src/books.ts", import.meta.url)).replaceAll("\\", "/").toLowerCase();
    host.readFile = (name) => {
        const source = originalReadFile(name);
        return name.replaceAll("\\", "/").toLowerCase() === target
            ? source?.replace("price: 200000", 'price: "200000"')
            : source;
    };
    console.log("آزمایش آموزشی: قیمت کتاب اول فقط در حافظه از number به string تبدیل شد.");
}
const program = ts.createProgram(config.fileNames, config.options, host);
const diagnostics = [...config.errors, ...ts.getPreEmitDiagnostics(program)];
if (diagnostics.length) {
    console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCanonicalFileName: (name) => name,
        getCurrentDirectory: ts.sys.getCurrentDirectory,
        getNewLine: () => "\n",
    }));
    process.exitCode = 1;
} else {
    console.log("TypeScript: نمونهٔ آموزشی خطای نوع ندارد.");
}
