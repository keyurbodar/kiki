import { describe, expect, it } from "vitest";
import {
  isModifiedClick,
  parsePullHref,
  pullRefKey,
  pullRouteParams,
} from "./pull-ref";

describe("parsePullHref", () => {
  it("reads the repository and number from a GitHub pull URL", () => {
    expect(parsePullHref("https://github.com/acme/web/pull/128")).toEqual({
      repositoryFullName: "acme/web",
      number: 128,
    });
    expect(parsePullHref("https://GitHub.com/acme/web/pull/7/")).toEqual({
      repositoryFullName: "acme/web",
      number: 7,
    });
  });

  it("ignores anything that is not a pull URL", () => {
    expect(parsePullHref("https://github.com/acme/web/pull/0")).toBeUndefined();
    expect(
      parsePullHref("https://github.com/acme/web/pull/128/files"),
    ).toBeUndefined();
    expect(
      parsePullHref("https://github.com/acme/web/issues/3"),
    ).toBeUndefined();
    expect(
      parsePullHref("https://example.com/acme/web/pull/3"),
    ).toBeUndefined();
  });
});

describe("pullRefKey", () => {
  it("keys pulls case-insensitively by repository", () => {
    expect(pullRefKey("Acme/Web", 128)).toBe("acme/web#128");
  });
});

describe("pullRouteParams", () => {
  it("splits the repository into route params", () => {
    expect(pullRouteParams("acme/web", 128)).toEqual({
      owner: "acme",
      repo: "web",
      prNumber: "128",
    });
  });

  it("keeps a bare repository name as the repo param", () => {
    expect(pullRouteParams("web", 3)).toEqual({
      owner: "web",
      repo: "web",
      prNumber: "3",
    });
  });
});

describe("isModifiedClick", () => {
  const click = {
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
  };

  it("treats any modifier as a request to open elsewhere", () => {
    expect(isModifiedClick(click)).toBe(false);
    expect(isModifiedClick({ ...click, metaKey: true })).toBe(true);
    expect(isModifiedClick({ ...click, ctrlKey: true })).toBe(true);
    expect(isModifiedClick({ ...click, shiftKey: true })).toBe(true);
    expect(isModifiedClick({ ...click, altKey: true })).toBe(true);
  });
});
