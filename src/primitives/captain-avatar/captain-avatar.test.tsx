import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  CAPTAIN_AVATAR_BACKGROUNDS,
  CAPTAIN_AVATARS,
  CaptainAvatar,
  captainAvatarForSeed,
  captainAvatarUrl,
  DEFAULT_CAPTAIN_AVATAR,
  randomCaptainAvatar,
} from "@/primitives/captain-avatar";

afterEach(cleanup);

describe("captain avatar data", () => {
  it("keeps Capy's seven presets and eleven backgrounds", () => {
    expect(CAPTAIN_AVATARS).toHaveLength(7);
    expect(CAPTAIN_AVATARS).not.toContain("capy-avatar-4");
    expect(CAPTAIN_AVATAR_BACKGROUNDS).toHaveLength(11);
    expect(CAPTAIN_AVATAR_BACKGROUNDS[0]).toEqual({
      label: "None",
      value: "#ffffff",
    });
    expect(CAPTAIN_AVATAR_BACKGROUNDS[1]).toEqual({
      label: "Sapphire Blue",
      value: "#4471D0",
    });
  });

  it("resolves every preset to an image url", () => {
    for (const preset of CAPTAIN_AVATARS)
      expect(captainAvatarUrl(preset)).toContain(preset);
    expect(captainAvatarUrl("capy-avatar-4")).toBe("");
  });

  it("starts on capy-avatar-1 over None", () => {
    expect(DEFAULT_CAPTAIN_AVATAR).toEqual({
      kind: "preset",
      value: "capy-avatar-1",
      background: "#ffffff",
    });
  });

  it("picks a seeded preset by char-code sum", () => {
    expect(captainAvatarForSeed("a")).toBe(
      captainAvatarUrl(CAPTAIN_AVATARS[97 % 7] ?? ""),
    );
    expect(captainAvatarForSeed("Atlas")).toBe(captainAvatarForSeed("Atlas"));
  });

  it("never picks None for a new Captain", () => {
    expect(randomCaptainAvatar(() => 0).background).toBe("#4471D0");
    expect(randomCaptainAvatar(() => 0.999)).toEqual({
      kind: "preset",
      value: "capy-avatar-8",
      background: "#5AAB6B",
    });
  });
});

describe("CaptainAvatar", () => {
  it("renders a preset on its background with the name as label", () => {
    render(
      <CaptainAvatar
        name="Bosun"
        size="base"
        avatar={{
          kind: "preset",
          value: "capy-avatar-6",
          background: "#EF722A",
        }}
      />,
    );
    const avatar = screen.getByRole("img", { name: "Bosun" });
    expect(avatar.dataset.slot).toBe("captain-avatar");
    expect(avatar.className).toContain("size-8 rounded-(--radius-sm)");
    expect(avatar.style.background).toBeTruthy();
    expect(avatar.querySelector("img")?.getAttribute("src")).toContain(
      "capy-avatar-6",
    );
  });

  it("defaults to sm and renders emoji as text", () => {
    render(
      <CaptainAvatar
        name="Atlas"
        avatar={{ kind: "emoji", value: "🦫", background: "#AE69B1" }}
      />,
    );
    const avatar = screen.getByRole("img", { name: "Atlas" });
    expect(avatar.dataset.size).toBe("sm");
    expect(avatar.className).toContain("size-6");
    expect(avatar.textContent).toBe("🦫");
  });

  it("prefers an uploaded image", () => {
    render(
      <CaptainAvatar
        name="Upload"
        avatar={{
          kind: "preset",
          value: "capy-avatar-1",
          background: "#ffffff",
          image: "blob:x",
        }}
      />,
    );
    expect(
      screen
        .getByRole("img", { name: "Upload" })
        .querySelector("img")
        ?.getAttribute("src"),
    ).toBe("blob:x");
  });
});
