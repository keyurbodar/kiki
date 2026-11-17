import { describe, expect, it } from "vitest";
import { parseLocalPull, parsePull, parseTask, valueList } from "./parse";

describe("overview row parsing", () => {
  it("extracts a task, its machine and timestamps", () => {
    const row = parseTask({
      id: "jam_1",
      parentId: "jam_root",
      localIndex: 3,
      status: "working",
      title: "Sample task",
      primaryMachine: { kind: "cloud", size: "large" },
      createdAt: "2026-11-17T10:00:00Z",
    });
    expect(row.localIndex).toBe(3);
    expect(row.primaryMachine).toEqual({
      kind: "cloud",
      name: "",
      size: "large",
    });
    expect(row.createdAt.toISOString()).toBe("2026-11-17T10:00:00.000Z");
  });

  it("ignores pulls without a URL and defaults their state", () => {
    expect(parsePull({ number: 5 })).toBeUndefined();
    expect(
      parsePull({ url: "https://example.com/1", state: "unknown" }),
    ).toMatchObject({
      state: "ready",
      baseRef: "",
      headRef: "",
    });
  });

  it("reads local pulls and both response list shapes", () => {
    expect(
      parseLocalPull({ url: "https://example.com/2", jamId: "j", userId: "u" }),
    ).toMatchObject({
      jamId: "j",
      userId: "u",
    });
    expect(valueList([{ id: "a" }])).toHaveLength(1);
    expect(valueList({ entries: [{ id: "b" }] })).toHaveLength(1);
    expect(valueList(undefined)).toEqual([]);
  });
});
