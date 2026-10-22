// بررسی نمایش اولیه با نسخهٔ React نصب‌شدهٔ پروژه؛ مرورگر و کلیک را شبیه‌سازی نمی‌کند.
// اجرا از ریشه: node .\learning\react\03-check-initial-render.mjs
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { runInThisContext } from "node:vm";

const requireFromFrontend = createRequire(new URL("../../frontend/package.json", import.meta.url));
const typescript = requireFromFrontend("typescript");
const React = requireFromFrontend("react");
const { renderToStaticMarkup } = requireFromFrontend("react-dom/server");
const source = await readFile(new URL("03-BookStore.tsx", import.meta.url), "utf8");

const compiled = typescript.transpileModule(source, {
    fileName: "03-BookStore.tsx",
    compilerOptions: {
        target: typescript.ScriptTarget.ES2017,
        module: typescript.ModuleKind.CommonJS,
        jsx: typescript.JsxEmit.ReactJSX,
    },
});

const lessonModule = { exports: {} };
const loadLesson = runInThisContext(
    `(function (require, module, exports) { ${compiled.outputText}\n })`,
    { filename: "03-BookStore.compiled.cjs" },
);
loadLesson(requireFromFrontend, lessonModule, lessonModule.exports);

const html = renderToStaticMarkup(React.createElement(lessonModule.exports.default));
console.log("React version:", React.version);
console.log("نمایش اولیه با موفقیت ساخته شد؛ طول HTML:", html.length);
console.log(html);
console.log("این اجرا فقط نمایش اولیه را بررسی می‌کند؛ تعامل دکمه‌ها در مرورگر اجرا نشده است.");
