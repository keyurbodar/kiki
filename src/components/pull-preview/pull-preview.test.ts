import { describe, expect, it } from "vitest";
import { avatarInitials, pullLabel, pullRouteParams } from "./pull-preview";

describe("pull helpers", () => {
  it("splits the repo into route params", () => {
    expect(pullRouteParams("acme/web", 12)).toEqual({
      owner: "acme",
      repo: "web",
      prNumber: "12",
    });
    expect(pullRouteParams("web", 3)).toEqual({
      owner: "web",
      repo: "web",
      prNumber: "3",
    });
  });
  it("labels pulls with or without the repo", () => {
    expect(pullLabel({ repo: "acme/web", number: 4 }, true)).toBe("web#4");
    expect(pullLabel({ repo: "acme/web", number: 4 }, false)).toBe("#4");
  });
  it("takes first and last initials", () => {
    expect(avatarInitials("Alex Morgan")).toBe("AM");
    expect(avatarInitials(" sam ")).toBe("S");
    expect(avatarInitials("Jo Ann Lee")).toBe("JL");
  });
});
