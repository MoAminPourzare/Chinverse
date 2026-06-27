import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { getFirstVideoChineseSrtPath, getFirstVideoPersianSrtPath } from "@/lib/server/firstVideo";
import { parseSrt } from "@/lib/srt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const [chineseSource, persianSource] = await Promise.all([
            readFile(getFirstVideoChineseSrtPath(), "utf8"),
            readFile(getFirstVideoPersianSrtPath(), "utf8"),
        ]);
        const chineseCues = parseSrt(chineseSource);
        const persianCues = parseSrt(persianSource);

        if (chineseCues.length !== persianCues.length) {
            throw new Error(`Subtitle cue count mismatch: zh=${chineseCues.length}, fa=${persianCues.length}`);
        }

        const transcript = chineseCues.map((chineseCue, index) => {
            const persianCue = persianCues[index];
            const timingDifference = Math.max(
                Math.abs(chineseCue.start - persianCue.start),
                Math.abs(chineseCue.end - persianCue.end),
            );
            if (chineseCue.id !== persianCue.id || timingDifference > 0.01) {
                throw new Error(`Subtitle alignment mismatch at cue ${chineseCue.id}`);
            }

            return {
                id: chineseCue.id,
                start: chineseCue.start,
                end: chineseCue.end,
                chinese: chineseCue.text,
                persian: persianCue.text,
                highlightedWords: [],
            };
        });

        return NextResponse.json(
            {
                title: "火烧裳尾",
                source: "firstVideo",
                transcript,
            },
            { headers: { "Cache-Control": "no-store" } },
        );
    } catch (error) {
        console.error("Failed to load first video subtitles", error);
        return NextResponse.json({ detail: "زیرنویس ویدیوی آزمایشی بارگذاری نشد." }, { status: 500 });
    }
}
