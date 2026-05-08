import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "ChinVerse",
  description: "A premium Chinese learning app for Persian speakers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa">
      <body className="antialiased text-slate-900">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
