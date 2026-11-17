import { describe, expect, it } from "vitest";
import {
  canOpenDesktopApp,
  desktopAppUrl,
  desktopScheme,
  handoffTarget,
  isRoutablePath,
} from "./handoff";

const mac = {
  scheme: "capy",
  inDesktopApp: false,
  platform: "MacIntel",
  maxTouchPoints: 0,
};

describe("handoffTarget", () => {
  it.each([
    [undefined, "/new"],
    [42, "/new"],
    ["/", "/new"],
    ["/desktop", "/new"],
    ["https://example.com/thread/t1", "/new"],
    ["//example.com/x", "/new"],
    ["/thread/t1?pane=files#row", "/thread/t1?pane=files#row"],
    ["settings/general", "/settings/general"],
  ])("maps %s to %s", (input, output) => {
    expect(handoffTarget(input)).toBe(output);
  });
});

describe("desktopScheme", () => {
  it("accepts only Capy's desktop schemes", () => {
    expect(desktopScheme("capy")).toBe("capy");
    expect(desktopScheme("capy-nightly")).toBe("capy-nightly");
    expect(desktopScheme("javascript")).toBeUndefined();
    expect(desktopScheme(undefined)).toBeUndefined();
  });
});

describe("isRoutablePath", () => {
  const match =
    (found: string | undefined, params = {}) =>
    () => ({
      routeParams: params,
      foundRoutePath: found,
    });

  it("rejects protocol-relative and relative paths", () => {
    expect(isRoutablePath("//evil", match("/"))).toBe(false);
    expect(isRoutablePath("new", match("/"))).toBe(false);
  });

  it("rejects unmatched and catch-all routes", () => {
    expect(isRoutablePath("/nope", match(undefined))).toBe(false);
    expect(isRoutablePath("/nope", match("$"))).toBe(false);
    expect(isRoutablePath("/a/b", match("$x", { "**": "a/b" }))).toBe(false);
  });

  it("accepts matched routes", () => {
    expect(isRoutablePath("/new", match("new"))).toBe(true);
    expect(isRoutablePath("/", match("/", { "**": "x" }))).toBe(true);
  });
});

describe("canOpenDesktopApp", () => {
  it("opens on a Mac browser with a scheme", () => {
    expect(canOpenDesktopApp("/new", mac)).toBe(true);
  });

  it.each([
    ["no scheme", { ...mac, scheme: undefined }],
    ["inside the desktop app", { ...mac, inDesktopApp: true }],
    ["on Linux", { ...mac, platform: "Linux x86_64" }],
    ["on a touch Mac (iPad)", { ...mac, maxTouchPoints: 5 }],
  ])("stays in the browser %s", (_, env) => {
    expect(canOpenDesktopApp("/new", env)).toBe(false);
  });

  it("never hands admin pages to the app", () => {
    expect(canOpenDesktopApp("/admin/x", mac)).toBe(false);
    expect(canOpenDesktopApp("/administrator", mac)).toBe(true);
  });
});

it("builds the desktop deep link", () => {
  expect(desktopAppUrl("capy", "/thread/t1?pane=files")).toBe(
    "capy://app/thread/t1?pane=files",
  );
});
