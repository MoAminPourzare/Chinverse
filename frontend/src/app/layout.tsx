import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { headers } from "next/headers";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import { releaseConfig } from "@/config/release";

export const metadata: Metadata = {
  title: "چین‌ورس",
  description: "اپلیکیشن آموزش زبان چینی برای فارسی‌زبان‌ها",
  manifest: "/manifest.json",
  robots: releaseConfig.isPublicRelease
    ? {
        index: true,
        follow: true,
      }
    : {
        index: false,
        follow: false,
        noarchive: true,
        nocache: true,
      },
  icons: {
    icon: [
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const themeBootstrapScript = `
(() => {
  try {
    const raw = localStorage.getItem("chinverse.learningPreferences.v1");
    const preference = raw ? JSON.parse(raw).theme : "light";
    const isDark = preference === "dark" || (preference === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  } catch {
    document.documentElement.dataset.theme = "light";
  }
})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="fa" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#fafafb" />
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: themeBootstrapScript }}
        />
      </head>
      <body className="antialiased text-slate-900">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
