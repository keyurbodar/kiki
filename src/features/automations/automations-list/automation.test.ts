import { describe, expect, it } from "vitest";
import {
  type AutomationRow,
  decodeAutomationPage,
  decodeMembers,
  emptyOptimistic,
  formatRelativeTime,
  mergeOptimistic,
  withOptimisticDeleted,
  withOptimisticRow,
} from "./automation";
import { toggleChecked } from "./automations-list";

const base = new Date("2026-01-01T00:00:00Z");

const row = (
  id: string,
  overrides: Partial<AutomationRow> = {},
): AutomationRow => ({
  id,
  projectId: "proj_1",
  name: `Automation ${id}`,
  description: null,
  triggers: [],
  enabled: true,
  creatorUserId: "user_1",
  creator: "Alex Morgan",
  singleJamId: null,
  lastTriggeredAt: null,
  createdAt: base,
  updatedAt: base,
  ...overrides,
});

describe("decodeAutomationPage", () => {
  it("reads Capy's AutomationListPage and resolves creator names", () => {
    const page = decodeAutomationPage(
      {
        items: [
          {
            id: "auto_1",
            projectId: "proj_1",
            name: "Nightly check",
            triggers: [
              { type: "schedule", cron: "0 2 * * *", timezone: "UTC" },
              { type: "unknown" },
            ],
            enabled: true,
            creatorUserId: "user_1",
            singleJamId: null,
            lastTriggeredAt: "2026-01-02T00:00:00Z",
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z",
          },
          { id: "broken" },
        ],
        cursor: "next",
      },
      (id) => (id === "user_1" ? "Alex Morgan" : undefined),
    );
    expect(page.cursor).toBe("next");
    expect(page.rows).toHaveLength(1);
    expect(page.rows[0]).toMatchObject({
      id: "auto_1",
      creator: "Alex Morgan",
      triggers: [{ type: "schedule", cron: "0 2 * * *" }],
    });
    expect(page.rows[0]?.lastTriggeredAt?.toISOString()).toBe(
      "2026-01-02T00:00:00.000Z",
    );
  });

  it("accepts a bare array and the sample world's ownerId", () => {
    const page = decodeAutomationPage(
      [
        {
          id: "a",
          name: "A",
          ownerId: "user_2",
          createdAt: base.toISOString(),
        },
      ],
      () => undefined,
    );
    expect(page.rows[0]).toMatchObject({
      creatorUserId: "user_2",
      creator: "user_2",
    });
  });
});

describe("decodeMembers", () => {
  it("joins names and falls back to email", () => {
    expect(
      decodeMembers([
        { userId: "u1", firstName: "Alex", lastName: "Morgan", imageUrl: null },
        { userId: "u2", email: "sam@example.com" },
      ]),
    ).toEqual([
      { userId: "u1", name: "Alex Morgan", imageUrl: null },
      { userId: "u2", name: "sam@example.com", imageUrl: null },
    ]);
  });
});

describe("optimistic overrides", () => {
  it("shows a local edit until the server row moves on", () => {
    const server = row("a");
    const state = withOptimisticRow(
      emptyOptimistic,
      { ...server, enabled: false, updatedAt: new Date(base.getTime() + 1) },
      server.updatedAt,
    );
    expect(mergeOptimistic(state, [server])[0]?.enabled).toBe(false);
    const fresh = { ...server, updatedAt: new Date(base.getTime() + 5) };
    expect(mergeOptimistic(state, [fresh])[0]?.enabled).toBe(true);
  });

  it("hides deleted rows and restores them on undo", () => {
    const deleted = withOptimisticDeleted(emptyOptimistic, "a", true);
    expect(
      mergeOptimistic(deleted, [row("a"), row("b")]).map((r) => r.id),
    ).toEqual(["b"]);
    const restored = withOptimisticDeleted(deleted, "a", false);
    expect(mergeOptimistic(restored, [row("a")])).toHaveLength(1);
  });
});

describe("toggleChecked", () => {
  const visible = ["a", "b", "c", "d"];
  it("toggles one row", () => {
    expect([...toggleChecked(new Set(), visible, null, "b", false)]).toEqual([
      "b",
    ]);
    expect([
      ...toggleChecked(new Set(["b"]), visible, "b", "b", false),
    ]).toEqual([]);
  });
  it("extends a range with shift", () => {
    expect(
      [...toggleChecked(new Set(["a"]), visible, "a", "c", true)].sort(),
    ).toEqual(["a", "b", "c"]);
  });
});

describe("formatRelativeTime", () => {
  const now = base.getTime();
  it("matches Capy's minified units", () => {
    expect(
      formatRelativeTime(new Date(now - 1000), { now, minified: true }),
    ).toBe("now");
    expect(
      formatRelativeTime(new Date(now - 5 * 3600_000), { now, minified: true }),
    ).toBe("5h");
    expect(
      formatRelativeTime(new Date(now - 23 * 3600_000), {
        now,
        minified: true,
      }),
    ).toBe("23h");
    expect(formatRelativeTime(new Date(now - 3 * 86400_000), { now })).toBe(
      "3d ago",
    );
    expect(formatRelativeTime(new Date(now + 60_000), { now })).toBe("in 1m");
  });
});
