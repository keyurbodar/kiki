import { describe, expect, it } from "vitest";
import { isMockUploadUrl, readAvatarUploadTarget } from "./upload";

describe("isMockUploadUrl", () => {
  it("treats .invalid hosts as mock targets", () => {
    expect(isMockUploadUrl("https://uploads.invalid/a")).toBe(true);
    expect(isMockUploadUrl("https://uploads.example.com/a")).toBe(false);
  });
});

describe("readAvatarUploadTarget", () => {
  it("reads the upload URL and avatar key", () => {
    expect(
      readAvatarUploadTarget({
        uploadUrl: "https://x.invalid",
        avatarKey: "k",
      }),
    ).toEqual({ uploadUrl: "https://x.invalid", avatarKey: "k" });
  });

  it("rejects anything else", () => {
    expect(readAvatarUploadTarget(null)).toBeUndefined();
    expect(readAvatarUploadTarget({ uploadUrl: 1 })).toBeUndefined();
  });
});
