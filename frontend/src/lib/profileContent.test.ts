import { describe, expect, it } from "vitest";
import {
  cleanProfileText,
  cleanResumeData,
  getVisibleSocials,
  getVisibleWebsites,
  hasResumePreviewItemContent,
  isResumeEmpty,
} from "./profileContent";

describe("profile content normalization", () => {
  it("removes whitespace-only profile content", () => {
    expect(cleanProfileText("  متن  ")).toBe("متن");
    expect(getVisibleWebsites([" ", " https://chinverse.ir "])).toEqual(["https://chinverse.ir"]);
    expect(getVisibleSocials([
      { platform: "telegram", handle: " chinverse " },
      { platform: " ", handle: "ignored" },
    ])).toEqual([{ platform: "telegram", handle: "chinverse" }]);
  });

  it("treats resume sections containing only blanks as empty", () => {
    const resume = {
      work_experiences: [{ company: " ", job_title: "", start_date: "", end_date: "" }],
      educations: [],
      certificates: [],
      awards: [],
      skills: [],
      languages: [],
    };

    expect(isResumeEmpty(resume)).toBe(true);
    expect(cleanResumeData(resume).work_experiences).toEqual([]);
    expect(hasResumePreviewItemContent({ title: " ", subtitle: "", meta: "" })).toBe(false);
  });
});
