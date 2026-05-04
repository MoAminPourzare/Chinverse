import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "ChinVerse",
  description: "Chinese learning app for Persian speakers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa">
      <body className="antialiased bg-gray-100 flex justify-center h-dvh overflow-hidden">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
