import { open, readFile, stat } from "node:fs/promises";
import type { NextRequest } from "next/server";
import { getFirstVideoPath } from "@/lib/server/firstVideo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VIDEO_CONTENT_TYPE = "video/mp4";

export async function GET(request: NextRequest) {
    try {
        const videoPath = getFirstVideoPath();
        const fileStat = await stat(videoPath);
        const range = request.headers.get("range");

        if (!range) {
            const file = await readFile(videoPath);
            return new Response(new Uint8Array(file), {
                status: 200,
                headers: {
                    "Accept-Ranges": "bytes",
                    "Cache-Control": "no-store",
                    "Content-Length": String(fileStat.size),
                    "Content-Type": VIDEO_CONTENT_TYPE,
                },
            });
        }

        const match = range.match(/^bytes=(\d*)-(\d*)$/);
        if (!match) {
            return new Response(null, {
                status: 416,
                headers: { "Content-Range": `bytes */${fileStat.size}` },
            });
        }

        const isSuffixRange = !match[1] && Boolean(match[2]);
        const suffixLength = isSuffixRange ? Number(match[2]) : 0;
        const requestedStart = isSuffixRange
            ? Math.max(fileStat.size - suffixLength, 0)
            : match[1]
                ? Number(match[1])
                : 0;
        const requestedEnd = isSuffixRange
            ? fileStat.size - 1
            : match[2]
                ? Number(match[2])
                : fileStat.size - 1;
        const start = Math.max(0, requestedStart);
        const end = Math.min(requestedEnd, fileStat.size - 1);

        if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= fileStat.size) {
            return new Response(null, {
                status: 416,
                headers: { "Content-Range": `bytes */${fileStat.size}` },
            });
        }

        const length = end - start + 1;
        const handle = await open(videoPath, "r");
        const buffer = Buffer.allocUnsafe(length);
        try {
            await handle.read(buffer, 0, length, start);
        } finally {
            await handle.close();
        }

        return new Response(new Uint8Array(buffer), {
            status: 206,
            headers: {
                "Accept-Ranges": "bytes",
                "Cache-Control": "no-store",
                "Content-Length": String(length),
                "Content-Range": `bytes ${start}-${end}/${fileStat.size}`,
                "Content-Type": VIDEO_CONTENT_TYPE,
            },
        });
    } catch (error) {
        console.error("Failed to stream first video", error);
        return new Response("Video not found", { status: 404 });
    }
}
