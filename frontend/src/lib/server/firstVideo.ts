import "server-only";

import { existsSync } from "node:fs";
import path from "node:path";

const FIRST_VIDEO_DIRECTORY_CANDIDATES = [
    path.resolve(process.cwd(), "..", "firstVideo"),
    path.resolve(process.cwd(), "firstVideo"),
];

export const getFirstVideoDirectory = (): string => {
    const directory = FIRST_VIDEO_DIRECTORY_CANDIDATES.find((candidate) => existsSync(candidate));
    if (!directory) {
        throw new Error("firstVideo directory was not found");
    }
    return directory;
};

export const getFirstVideoPath = (): string => path.join(getFirstVideoDirectory(), "6799269.mp4");
export const getFirstVideoChineseSrtPath = (): string => path.join(getFirstVideoDirectory(), "7524117.srt");
export const getFirstVideoPersianSrtPath = (): string => path.join(getFirstVideoDirectory(), "7524117.fa.srt");
