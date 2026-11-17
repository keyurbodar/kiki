import { describe, expect, it } from "vitest";
import {
  formatCrashReport,
  formatErrorChain,
  isChunkLoadError,
  RELOAD_RETRY_WINDOW,
  redactRoute,
  shouldHardReload,
  withLogTail,
} from "./crash-report";

const base = {
  error: "boom",
  route: "/new",
  time: "2026-01-01T00:00:00.000Z",
  deployment: "production",
  commit: "abc123",
  userAgent: "TestAgent/1.0",
  viewport: { width: 1440, height: 900 },
  pathname: "/new",
};

describe("redactRoute", () => {
  it("redacts secrets in query and hash params", () => {
    expect(redactRoute("/cb?code=xyz&state=1#access_token=t&x=2")).toBe(
      "/cb?code=[redacted]&state=1#access_token=[redacted]&x=2",
    );
    expect(redactRoute("/a?API_KEY=k")).toBe("/a?API_KEY=[redacted]");
    expect(redactRoute("/a?keyword=k")).toBe("/a?keyword=k");
  });
});

describe("formatErrorChain", () => {
  it("stringifies non-errors", () => {
    expect(formatErrorChain(undefined)).toBe("undefined");
    expect(formatErrorChain("nope")).toBe("nope");
  });

  it("follows causes up to four levels deep", () => {
    let error = new Error("e5");
    for (const n of [4, 3, 2, 1, 0]) {
      error = new Error(`e${n}`, { cause: error });
      error.stack = `Error: e${n}`;
    }
    const chain = formatErrorChain(error);
    expect(chain.split("Caused by:")).toHaveLength(5);
    expect(chain).toContain("Error: e4");
    expect(chain).not.toContain("e5");
  });

  it("falls back to name and message without a stack", () => {
    const error = new TypeError("bad");
    error.stack = undefined;
    expect(formatErrorChain(error)).toBe("TypeError: bad");
  });
});

describe("formatCrashReport", () => {
  it("writes the web header and environment lines", () => {
    expect(
      formatCrashReport({
        ...base,
        route: "/new?token=s",
        componentStack: "\n  at X",
      }),
    ).toBe(
      [
        "Capy web production",
        "Deployment: production",
        "Commit: abc123",
        "Route: /new?token=[redacted]",
        "Time: 2026-01-01T00:00:00.000Z",
        "User agent: TestAgent/1.0",
        "Viewport: 1440 x 900",
        "Org: unknown",
        "",
        "boom",
        "",
        "Component stack:",
        "  at X",
      ].join("\n"),
    );
  });

  it("adds desktop, id, thread and pane context", () => {
    const report = formatCrashReport({
      ...base,
      pathname: "/thread/t1",
      desktopVersion: "1.2.3",
      id: "err-1",
      context: {
        orgId: "org-1",
        paneOpen: true,
        panes: ["files"],
        activePane: "files",
        mainPanes: ["chat"],
        activeMainPane: "chat",
      },
    });
    expect(report).toContain("Capy 1.2.3 (desktop)\n");
    expect(report).toContain("Id: err-1");
    expect(report).toContain("Org: org-1");
    expect(report).toContain("Thread: t1");
    expect(report).toContain("Machine: unknown");
    expect(report).toContain('Panes: ["files"]');
    expect(report).toContain("Active main pane: chat");
  });
});

describe("withLogTail", () => {
  it("appends desktop log lines when present", () => {
    expect(withLogTail("r", undefined)).toBe("r");
    expect(withLogTail("r", ["a", "b"])).toBe(
      "r\n\n--- desktop.log, last 2 lines ---\na\nb",
    );
  });
});

describe("shouldHardReload", () => {
  it("hard reloads stale chunks", () => {
    const stale = new TypeError(
      "Failed to fetch dynamically imported module: /a.js",
    );
    expect(isChunkLoadError(stale)).toBe(true);
    expect(shouldHardReload(stale, undefined, 0)).toBe(true);
  });

  it("hard reloads a second attempt inside the retry window", () => {
    const error = new Error("render");
    expect(shouldHardReload(error, undefined, 1000)).toBe(false);
    expect(shouldHardReload(error, 1000, 1000 + RELOAD_RETRY_WINDOW - 1)).toBe(
      true,
    );
    expect(shouldHardReload(error, 1000, 1000 + RELOAD_RETRY_WINDOW)).toBe(
      false,
    );
  });
});
