import { describe, expect, it } from "vitest";
import {
  cleanApiValidationMessage,
  hasOnlyPersianNameCharacters,
  isAdjustableImageFile,
  isImageConvertedOnUpload,
  normalizeDigits,
  normalizeIranMobile,
  normalizePersianName,
  normalizeWebsiteUrl,
  parseJsonObject,
  validateEmail,
  validateImageFile,
  validateIranMobile,
  validateJsonObject,
  validateNonNegativeNumber,
  validatePassword,
  validatePersianName,
  validateReferralCode,
  validateRequired,
  validateTextLength,
  validateUrl,
  validateWebsiteUrl,
  validationMessage,
} from "./validation";

describe("identity validation", () => {
  it("normalizes Persian and Arabic digits", () => {
    expect(normalizeDigits("۱۲٣۴")).toBe("1234");
  });

  it("normalizes Iranian mobile prefixes", () => {
    expect(normalizeIranMobile("+98 912-123-4567")).toBe("09121234567");
    expect(normalizeIranMobile("۰۰۹۸۹۱۲۱۲۳۴۵۶۷")).toBe("09121234567");
  });

  it("validates email, mobile, password, and referral boundaries", () => {
    expect(validateEmail("person@example.com").ok).toBe(true);
    expect(validateEmail("person@example").ok).toBe(false);
    expect(validateIranMobile("09121234567").ok).toBe(true);
    expect(validateIranMobile("9121234567").ok).toBe(false);
    expect(validatePassword("یک رمز طولانی و امن").ok).toBe(true);
    expect(validatePassword("secure123").ok).toBe(false);
    expect(validatePassword("password123456").ok).toBe(false);
    expect(validatePassword("a".repeat(129)).ok).toBe(false);
    expect(validateReferralCode("AB-12").ok).toBe(true);
    expect(validateReferralCode("A!").ok).toBe(false);
  });

  it("normalizes and validates Persian display names", () => {
    expect(normalizePersianName("  علي   رضائي  ")).toBe("علی رضائی");
    expect(hasOnlyPersianNameCharacters("کاربر آزمایشی")).toBe(true);
    expect(hasOnlyPersianNameCharacters("Test User")).toBe(false);
    expect(validatePersianName("").ok).toBe(false);
    expect(validatePersianName("A").ok).toBe(false);
    expect(validatePersianName("ا").ok).toBe(false);
    expect(validatePersianName("کاربر آزمایشی").ok).toBe(true);
  });

  it("validates generic required and length constraints", () => {
    expect(validateRequired("", "عنوان").ok).toBe(false);
    expect(validateRequired("محتوا", "عنوان").ok).toBe(true);
    expect(validateTextLength("", "عنوان", { required: true }).ok).toBe(false);
    expect(validateTextLength("a", "عنوان", { min: 2 }).ok).toBe(false);
    expect(validateTextLength("abcd", "عنوان", { max: 3 }).ok).toBe(false);
    expect(validationMessage({ ok: true })).toBe("");
    expect(cleanApiValidationMessage("Value error, invalid")).toBe("invalid");
    expect(cleanApiValidationMessage()).not.toBe("");
  });
});

describe("image validation", () => {
  it("accepts important image formats by extension", () => {
    const heic = new File(["image"], "camera.HEIC", { type: "application/octet-stream" });
    const avif = new File(["image"], "poster.avif", { type: "image/avif" });

    expect(validateImageFile(heic).ok).toBe(true);
    expect(validateImageFile(avif).ok).toBe(true);
    expect(isImageConvertedOnUpload(heic)).toBe(true);
    expect(isAdjustableImageFile(heic)).toBe(false);
    expect(isAdjustableImageFile(new File(["image"], "photo.webp", { type: "image/webp" }))).toBe(true);
    expect(validateImageFile(new File(["image"], "capture", { type: "image/png" })).ok).toBe(false);
    expect(isAdjustableImageFile(new File(["image"], "capture", { type: "image/png" }))).toBe(true);
    expect(isImageConvertedOnUpload(new File(["image"], "capture", { type: "image/tiff" }))).toBe(true);
  });

  it("rejects a disguised unsupported extension even with an image MIME type", () => {
    const disguised = new File(["image"], "payload.exe", { type: "image/png" });
    expect(validateImageFile(disguised).ok).toBe(false);
  });

  it("enforces required and size limits", () => {
    expect(validateImageFile(null, { required: true }).ok).toBe(false);
    const oversized = new File([new Uint8Array(1050)], "photo.png", { type: "image/png" });
    expect(validateImageFile(oversized, { maxMb: 0.001 }).ok).toBe(false);
    expect(validateImageFile(new File(["x"], "capture", { type: "" })).ok).toBe(false);
  });
});

describe("URL validation", () => {
  it("normalizes and validates website URLs", () => {
    expect(normalizeWebsiteUrl("chinverse.ir")).toBe("https://chinverse.ir");
    expect(validateWebsiteUrl("chinverse.ir").ok).toBe(true);
    expect(validateWebsiteUrl("https://user:pass@example.com").ok).toBe(false);
  });

  it("allows only HTTP(S) and explicitly permitted relative URLs", () => {
    expect(validateUrl("https://chinverse.ir", "URL").ok).toBe(true);
    expect(validateUrl("/uploads/avatar.png", "URL", { allowRelative: true }).ok).toBe(true);
    expect(validateUrl("javascript:alert(1)", "URL").ok).toBe(false);
    expect(validateUrl("", "URL", { required: true }).ok).toBe(false);
    expect(validateUrl("not a url", "URL").ok).toBe(false);
  });
});

describe("structured and numeric validation", () => {
  it("accepts JSON objects and rejects arrays or malformed JSON", () => {
    expect(validateJsonObject("", "metadata").ok).toBe(true);
    expect(validateJsonObject('{"level": 1}', "metadata").ok).toBe(true);
    expect(validateJsonObject("[]", "metadata").ok).toBe(false);
    expect(validateJsonObject("{broken", "metadata").ok).toBe(false);
    expect(parseJsonObject("")).toEqual({});
    expect(parseJsonObject('{"level": 1}')).toEqual({ level: 1 });
  });

  it("normalizes and bounds non-negative numbers", () => {
    expect(validateNonNegativeNumber("", "امتیاز").ok).toBe(false);
    expect(validateNonNegativeNumber("-1", "امتیاز").ok).toBe(false);
    expect(validateNonNegativeNumber("۱۲", "امتیاز", { max: 20 }).ok).toBe(true);
    expect(validateNonNegativeNumber("21", "امتیاز", { max: 20 }).ok).toBe(false);
  });
});
