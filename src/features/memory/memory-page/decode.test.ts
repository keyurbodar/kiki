import { describe, expect, it } from "vitest";
import { memoryPageRow, memoryTopic } from "./decode.ts";

const row = {
  id: "mem_checkout",
  title: "Checkout retries",
  body: "Retry gateway timeouts twice before failing the checkout test. Do not retry 4xx.",
  kind: "project",
  scope: "project-web",
  sourceThreadId: "jam_1",
  projectId: "project_1",
  authorId: "user_1",
  createdAt: "2026-11-17T10:00:00.000Z",
  updatedAt: "2026-11-17T12:00:00.000Z",
  status: "active",
};

describe("memoryTopic", () => {
  it("maps a memory row onto the page's topic", () => {
    expect(memoryTopic(row)).toEqual({
      volumeId: "mem_checkout",
      path: "mem_checkout",
      title: "Checkout retries",
      description:
        "Retry gateway timeouts twice before failing the checkout test.",
      body: row.body,
      scope: "project",
      source: "jam_1",
      statedBy: "user_1",
      lastConfirmed: "2026-11-17T12:00:00.000Z",
      projectId: "project_1",
      repositories: [],
      digest: "",
      canWrite: true,
    });
  });

  it("keeps a volume-style topic as the API sends it", () => {
    const topic = memoryTopic({
      volumeId: "vol_1",
      path: "notes/checkout.md",
      title: "Checkout",
      description: "Retries",
      body: "Twice",
      scope: "everywhere",
      repositories: ["keyurbodar/kiki"],
      digest: "abc",
      canWrite: false,
    });
    expect(topic.volumeId).toBe("vol_1");
    expect(topic.path).toBe("notes/checkout.md");
    expect(topic.description).toBe("Retries");
    expect(topic.scope).toBe("everywhere");
    expect(topic.repositories).toEqual(["keyurbodar/kiki"]);
    expect(topic.canWrite).toBe(false);
  });

  it("reads personal and shared rows as their own scopes", () => {
    expect(
      memoryTopic({ ...row, kind: "preference", scope: "user_prefs" }).scope,
    ).toBe("personal");
    expect(
      memoryTopic({ ...row, kind: "person", scope: "organization" }).scope,
    ).toBe("everywhere");
  });
});

describe("memoryPageRow", () => {
  it("treats a bare array as one full page", () => {
    const page = memoryPageRow([row, { ...row, id: "mem_2" }]);
    expect(page.items).toHaveLength(2);
    expect(page.nextCursor).toBeNull();
    expect(page.skipped).toBe(0);
    expect(page.scanned).toBe(2);
  });

  it("keeps an envelope's paging fields", () => {
    const page = memoryPageRow({
      items: [row],
      nextCursor: "cursor_2",
      skipped: 3,
      scanned: 40,
    });
    expect(page.items[0]?.title).toBe("Checkout retries");
    expect(page.nextCursor).toBe("cursor_2");
    expect(page.skipped).toBe(3);
    expect(page.scanned).toBe(40);
  });

  it("returns an empty page for a body it cannot read", () => {
    expect(memoryPageRow(null)).toEqual({
      items: [],
      nextCursor: null,
      skipped: 0,
      scanned: 0,
    });
  });
});
