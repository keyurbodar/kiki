import { describe, expect, it } from "vitest";
import {
  deviceNoun,
  quitDescription,
  quitTitle,
  quitView,
  readQuitThreads,
  shortAge,
} from "./quit-view";

const thread = (id: string, at: string) => ({
  id,
  title: `Sample thread ${id}`,
  sortActivityAt: new Date(at),
  pullCount: 0,
});

describe("quitView", () => {
  it("lists every busy thread, newest first", () => {
    const view = quitView([
      { kind: "success", threads: [thread("a", "2026-01-01T00:00:00Z")] },
      { kind: "failure" },
      { kind: "success", threads: [thread("b", "2026-01-02T00:00:00Z")] },
    ]);
    expect(view).toEqual({
      tier: "busy",
      threads: [
        thread("b", "2026-01-02T00:00:00Z"),
        thread("a", "2026-01-01T00:00:00Z"),
      ],
    });
  });

  it("is unknown when a device failed and none is busy", () => {
    expect(
      quitView([{ kind: "success", threads: [] }, { kind: "failure" }]),
    ).toEqual({
      tier: "unknown",
    });
  });

  it("is idle once every device answered empty", () => {
    expect(quitView([{ kind: "success", threads: [] }])).toEqual({
      tier: "idle",
    });
    expect(quitView([])).toEqual({ tier: "idle" });
  });

  it("is checking while a device is loading", () => {
    expect(
      quitView([{ kind: "success", threads: [] }, { kind: "loading" }]),
    ).toEqual({
      tier: "checking",
    });
  });
});

describe("readQuitThreads", () => {
  it("reads arrays and wrapped lists, skipping bad rows", () => {
    expect(
      readQuitThreads({
        threads: [
          {
            id: "t1",
            title: "Draft",
            sortActivityAt: "2026-01-01T00:00:00Z",
            pullCount: 2,
          },
          { title: "no id" },
          { id: "t2" },
        ],
      }),
    ).toEqual([
      {
        id: "t1",
        title: "Draft",
        sortActivityAt: new Date("2026-01-01T00:00:00Z"),
        pullCount: 2,
      },
      { id: "t2", title: null, sortActivityAt: new Date(0), pullCount: 0 },
    ]);
    expect(readQuitThreads("nope")).toEqual([]);
  });
});

describe("copy", () => {
  it("names the device by platform", () => {
    expect(deviceNoun("darwin")).toBe("Mac");
    expect(deviceNoun("MacIntel")).toBe("Mac");
    expect(deviceNoun("win32")).toBe("PC");
    expect(deviceNoun("linux")).toBe("computer");
    expect(deviceNoun(undefined)).toBe("computer");
  });

  it("matches Capy's titles and descriptions", () => {
    const one = {
      tier: "busy" as const,
      threads: [thread("a", "2026-01-01T00:00:00Z")],
    };
    expect(quitTitle({ tier: "idle" }, "Mac")).toBe(
      "Quit Capy? This Mac goes offline",
    );
    expect(quitTitle(one, "PC")).toBe(
      "Quit Capy? 1 thread is working on this PC",
    );
    expect(
      quitTitle(
        { tier: "busy", threads: [...one.threads, ...one.threads] },
        "Mac",
      ),
    ).toBe("Quit Capy? 2 threads are working on this Mac");
    expect(quitTitle({ tier: "unknown" }, "Mac")).toBe("Quit Capy?");
    expect(quitDescription(one, "Mac")).toBe(
      "Quitting interrupts it mid-turn. Threads show this Mac as unavailable until you open Capy again.",
    );
    expect(quitDescription({ tier: "unknown" }, "computer")).toBe(
      "Couldn't check what's running on this computer. Quitting interrupts any thread working here mid-turn.",
    );
    expect(quitDescription({ tier: "checking" }, "Mac")).toBe(
      "Checking what's running on this Mac",
    );
    expect(quitDescription({ tier: "idle" }, "Mac")).toBe(
      "Threads can't use this Mac's folders until you open Capy again. Nothing is running here right now.",
    );
  });
});

it("formats short ages", () => {
  const now = new Date("2026-01-10T00:00:00Z");
  expect(shortAge(new Date("2026-01-10T00:00:00Z"), now)).toBe("now");
  expect(shortAge(new Date("2026-01-09T23:55:00Z"), now)).toBe("5m");
  expect(shortAge(new Date("2026-01-09T21:00:00Z"), now)).toBe("3h");
  expect(shortAge(new Date("2026-01-08T00:00:00Z"), now)).toBe("2d");
  expect(shortAge(new Date("2025-12-20T00:00:00Z"), now)).toBe("3w");
});
