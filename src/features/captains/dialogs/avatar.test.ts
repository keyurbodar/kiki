import { describe, expect, it } from "vitest";
import {
  captainAvatarBackgrounds,
  captainAvatarPresets,
  captainPresetSrc,
  hasPrivateImage,
  isPaletteBackground,
  randomCaptainAvatar,
  sameAvatar,
  withoutImage,
} from "./avatar";

describe("captain avatar", () => {
  it("builds the preset image path Capy serves", () => {
    expect(captainPresetSrc("capy-avatar-3")).toBe(
      "/avatars/capy-avatar-3.png",
    );
  });

  it("picks a random preset on a palette colour other than None", () => {
    expect(randomCaptainAvatar(() => 0)).toEqual({
      kind: "preset",
      value: "capy-avatar-1",
      background: captainAvatarBackgrounds[1].value,
    });
    const last = randomCaptainAvatar(() => 0.999);
    expect(last.value).toBe(captainAvatarPresets.at(-1));
    expect(last.background).toBe(captainAvatarBackgrounds.at(-1)?.value);
  });

  it("matches palette colours case-insensitively", () => {
    expect(isPaletteBackground("#ac6a51")).toBe(true);
    expect(isPaletteBackground("#123456")).toBe(false);
  });

  it("tells private pictures from library images", () => {
    const base = {
      kind: "preset",
      value: "capy-avatar-1",
      background: "#AC6A51",
    } as const;
    expect(hasPrivateImage(base)).toBe(false);
    expect(hasPrivateImage({ ...base, image: "blob:x" })).toBe(true);
    expect(hasPrivateImage({ ...base, image: "u", library: "img_1" })).toBe(
      false,
    );
    expect(withoutImage({ ...base, image: "u", library: "img_1" })).toEqual(
      base,
    );
    expect(sameAvatar(base, { ...base })).toBe(true);
    expect(sameAvatar(base, { ...base, library: "img_1" })).toBe(false);
  });
});
