import { describe, expect, it } from "vitest";
import type { AutomationRow } from "../automations-list/automation";
import {
  activeViewKey,
  automationSections,
  compareAutomations,
  decodePageState,
  defaultPageState,
  emptyFilters,
  emptyText,
  listQuery,
  matchesFilters,
  normalizeFilters,
  viewPresets,
} from "./filters";

const now = Date.parse("2026-03-10T12:00:00Z");
const day = 86_400_000;

const row = (
  id: string,
  overrides: Partial<AutomationRow> = {},
): AutomationRow => ({
  id,
  projectId: "proj_web",
  name: `Automation ${id}`,
  description: null,
  triggers: [{ type: "schedule", cron: "0 9 * * 1", timezone: "UTC" }],
  enabled: true,
  creatorUserId: "user_alex",
  creator: "Alex Morgan",
  singleJamId: null,
  lastTriggeredAt: null,
  createdAt: new Date(now - day),
  updatedAt: new Date(now - day),
  ...overrides,
});

describe("view presets", () => {
  it("recognises presets regardless of list order", () => {
    expect(activeViewKey(defaultPageState)).toBe("mine");
    expect(activeViewKey({ ...defaultPageState, filters: emptyFilters })).toBe(
      "all",
    );
    expect(
      activeViewKey({
        ...defaultPageState,
        filters: { ...emptyFilters, status: "active" },
      }),
    ).toBeUndefined();
  });

  it("matches a saved view", () => {
    const filters = { ...emptyFilters, sources: ["slack", "github"] as const };
    expect(
      activeViewKey({
        ...defaultPageState,
        filters: { ...emptyFilters, sources: ["github", "slack"] },
        savedViews: [{ id: "view_1", name: "Chat", icon: null, filters }],
      }),
    ).toBe("view_1");
  });

  it("drops negations on unset axes", () => {
    expect(
      normalizeFilters({
        ...emptyFilters,
        negativeAxes: ["sources", "created"],
      }).negativeAxes,
    ).toEqual([]);
  });
});

describe("matchesFilters", () => {
  it("applies My automations to the viewer", () => {
    const mine = viewPresets[0].filters;
    expect(matchesFilters(row("a"), mine, now, "user_alex")).toBe(true);
    expect(matchesFilters(row("a"), mine, now, "user_sam")).toBe(false);
    expect(matchesFilters(row("a"), mine, now, undefined)).toBe(false);
  });

  it("negates an axis", () => {
    const filters = {
      ...emptyFilters,
      sources: ["schedule" as const],
      negativeAxes: ["sources" as const],
    };
    expect(matchesFilters(row("a"), filters, now, undefined)).toBe(false);
    expect(
      matchesFilters(
        row("b", { triggers: [{ type: "github", event: "checks" }] }),
        filters,
        now,
        undefined,
      ),
    ).toBe(true);
  });

  it("filters by status, project and created", () => {
    expect(
      matchesFilters(
        row("a", { enabled: false }),
        { ...emptyFilters, status: "active" },
        now,
        undefined,
      ),
    ).toBe(false);
    expect(
      matchesFilters(
        row("a"),
        { ...emptyFilters, projects: ["proj_api"] },
        now,
        undefined,
      ),
    ).toBe(false);
    expect(
      matchesFilters(
        row("a"),
        { ...emptyFilters, created: "older" },
        now,
        undefined,
      ),
    ).toBe(false);
  });
});

describe("listQuery", () => {
  it("is empty for the default view", () => {
    expect(JSON.stringify(listQuery(viewPresets[0].filters, now))).toBe("{}");
  });

  it("sends projects, status and created bounds", () => {
    const query = listQuery(
      {
        ...emptyFilters,
        projects: ["proj_web"],
        status: "disabled",
        created: "week",
        negativeAxes: ["projects"],
      },
      now,
    );
    expect(query).toEqual({
      projectIds: ["proj_web"],
      projectIdsNot: "1",
      enabled: "0",
      createdFrom: "2026-03-03T00:00:00.000Z",
      createdTo: undefined,
    });
    expect(
      listQuery({ ...emptyFilters, created: "older" }, now).createdTo,
    ).toBe("2026-02-09T00:00:00.000Z");
  });
});

describe("sections and ordering", () => {
  const rows = [
    row("a", { name: "Bravo", lastTriggeredAt: new Date(now - 3600_000) }),
    row("b", { name: "Alpha", enabled: false }),
    row("c", { name: "Charlie", lastTriggeredAt: new Date(now - 60_000) }),
  ];

  it("groups Active and Disabled, ordered by last run", () => {
    const sections = automationSections(
      rows,
      { ...defaultPageState, filters: emptyFilters },
      "",
      now,
      undefined,
    );
    expect(sections.map((s) => [s.id, s.members.map((r) => r.id)])).toEqual([
      ["active", ["c", "a"]],
      ["disabled", ["b"]],
    ]);
  });

  it("returns one Results section while searching", () => {
    const sections = automationSections(
      rows,
      { ...defaultPageState, filters: emptyFilters },
      "alph",
      now,
      undefined,
    );
    expect(sections).toEqual([
      { id: "results", label: "Results", members: [rows[1]] },
    ]);
    expect(
      automationSections(
        rows,
        { ...defaultPageState, filters: emptyFilters },
        "zzz",
        now,
        undefined,
      ),
    ).toEqual([]);
  });

  it("orders by name and creation", () => {
    expect(rows.toSorted(compareAutomations("name")).map((r) => r.id)).toEqual([
      "b",
      "a",
      "c",
    ]);
  });
});

describe("emptyText", () => {
  it("uses Capy's copy", () => {
    expect(emptyText(" deploy ", 3, "{}")).toBe(
      'No automations match "deploy"',
    );
    expect(emptyText("", 0, "{}")).toBe("No automations yet");
    expect(emptyText("", 0, '{"enabled":"1"}')).toBe(
      "No automations match these filters",
    );
  });
});

describe("decodePageState", () => {
  it("falls back to the default on bad input", () => {
    expect(decodePageState(null)).toBe(defaultPageState);
    expect(decodePageState("not json")).toBe(defaultPageState);
    expect(decodePageState('{"filters":1}')).toBe(defaultPageState);
  });

  it("round-trips a saved state", () => {
    const state = {
      filters: {
        ...emptyFilters,
        created: {
          kind: "custom" as const,
          from: "2026-01-01",
          to: "2026-01-31",
        },
      },
      savedViews: [
        { id: "v", name: "Mine", icon: null, filters: viewPresets[0].filters },
      ],
      ordering: "name" as const,
    };
    expect(decodePageState(JSON.stringify(state))).toEqual(state);
  });
});
