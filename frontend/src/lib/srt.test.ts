import { describe, expect, it } from "vitest";
import { parseSrt } from "./srt";

describe("SRT parser", () => {
  it("parses BOM, CRLF, comma/dot timestamps, and multiline text", () => {
    const cues = parseSrt(
      "\uFEFF1\r\n00:00:01,250 --> 00:00:03.500\r\n你好\r\nسلام\r\n\r\n"
      + "00:00:04,000 --> 00:00:05,000 position:50%\r\n再见",
    );

    expect(cues).toEqual([
      { id: 1, start: 1.25, end: 3.5, text: "你好\nسلام" },
      { id: 2, start: 4, end: 5, text: "再见" },
    ]);
  });

  it("rejects malformed or reversed cues", () => {
    expect(() => parseSrt("1\nnot-a-time\ntext")).toThrow("Invalid SRT cue");
    expect(() => parseSrt("1\n00:99:00,000 --> 00:99:01,000\ntext"))
      .toThrow("Invalid SRT timestamp");
    expect(() => parseSrt("1\n00:00:02,000 --> 00:00:01,000\ntext"))
      .toThrow("ends before it starts");
  });
});
