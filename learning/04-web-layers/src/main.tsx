import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

// مرورگر HTML اولیه را خوانده و این گره را در DOM ساخته است.
const container = document.getElementById("root");
if (!container) throw new Error("محل شروع رابط پیدا نشد.");

// React DOM مدیریت محتوای این گره را به عهده می‌گیرد.
createRoot(container).render(<App />);
