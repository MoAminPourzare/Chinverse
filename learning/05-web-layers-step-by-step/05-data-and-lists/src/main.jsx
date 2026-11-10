import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

const container = document.getElementById("root");
if (!container) throw new Error("محل شروع رابط پیدا نشد.");

createRoot(container).render(<App />);
