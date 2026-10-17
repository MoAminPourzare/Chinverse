// This recovery document is served under /api, which even older workers leave
// to the network. It can repair navigation without loading the React app.
export const pwaRecoveryHtml = `<!doctype html>
<html lang="fa-IR" dir="rtl"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive">
<title>چین‌ورس | باز کردن نسخهٔ تازه</title>
<link rel="stylesheet" href="/offline.css">
<script src="/api/pwa/recover?asset=script" defer></script>
</head><body><main><section class="offline-card">
<h1>داریم نسخهٔ تازه رو باز می‌کنیم…</h1>
<p id="recovery-status" role="status">چند لحظه صبر کن؛ اطلاعات حساب و تنظیماتت حفظ می‌شن.</p>
<button id="recovery-retry" type="button" hidden>تلاش دوباره</button>
<noscript><p>برای باز کردن نسخهٔ تازه، JavaScript مرورگرت رو فعال کن.</p></noscript>
</section></main></body></html>`;

export const pwaRecoveryScript = String.raw`(() => {
  const status = document.getElementById("recovery-status");
  const retry = document.getElementById("recovery-retry");
  const recover = async () => {
    retry.hidden = true;
    status.textContent = "چند لحظه صبر کن؛ اطلاعات حساب و تنظیماتت حفظ می‌شن.";
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        const owned = registrations.filter((registration) => {
          if (registration.scope !== window.location.origin + "/") return false;
          const workers = [registration.active, registration.waiting, registration.installing].filter(Boolean);
          return workers.some((worker) => {
            const url = new URL(worker.scriptURL);
            return url.origin === window.location.origin && url.pathname === "/sw.js";
          });
        });
        await Promise.all(owned.map((registration) => registration.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter((key) => key.startsWith("chinverse-shell-")).map((key) => caches.delete(key)));
      }
      // No cookies, account data, localStorage or sessionStorage are cleared.
      window.location.replace("/");
    } catch {
      status.textContent = "نسخهٔ تازه باز نشد. دوباره تلاش کن.";
      retry.hidden = false;
    }
  };
  retry.addEventListener("click", () => { void recover(); });
  return recover();
})();`;
