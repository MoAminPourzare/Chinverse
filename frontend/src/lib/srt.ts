export interface SrtCue {
    id: number;
    start: number;
    end: number;
    text: string;
}

const TIMESTAMP_PATTERN = /^(\d{1,2}):(\d{2}):(\d{2})[,.](\d{3})$/;

const parseTimestamp = (value: string): number => {
    const match = value.trim().match(TIMESTAMP_PATTERN);
    if (!match) {
        throw new Error(`Invalid SRT timestamp: ${value}`);
    }

    const [, hours, minutes, seconds, milliseconds] = match;
    if (Number(minutes) >= 60 || Number(seconds) >= 60) {
        throw new Error(`Invalid SRT timestamp: ${value}`);
    }
    return (
        Number(hours) * 3600
        + Number(minutes) * 60
        + Number(seconds)
        + Number(milliseconds) / 1000
    );
};

export const parseSrt = (source: string): SrtCue[] => {
    const blocks = source
        .replace(/^\uFEFF/, "")
        .replace(/\r\n?/g, "\n")
        .trim()
        .split(/\n{2,}/);

    return blocks.map((block, index) => {
        const lines = block.split("\n");
        const numericId = Number(lines[0]?.trim());
        const timingLineIndex = Number.isFinite(numericId) ? 1 : 0;
        const timingLine = lines[timingLineIndex] || "";
        const [startValue, endValue] = timingLine.split(/\s+-->\s+/);

        if (!startValue || !endValue) {
            throw new Error(`Invalid SRT cue at block ${index + 1}`);
        }

        const start = parseTimestamp(startValue);
        const end = parseTimestamp(endValue.split(/\s+/)[0]);
        if (end <= start) {
            throw new Error(`SRT cue ${numericId || index + 1} ends before it starts`);
        }

        return {
            id: Number.isFinite(numericId) ? numericId : index + 1,
            start,
            end,
            text: lines.slice(timingLineIndex + 1).join("\n").trim(),
        };
    });
};
