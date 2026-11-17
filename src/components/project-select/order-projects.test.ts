import { describe, expect, it } from "vitest";
import type { Project } from "@/data/api/schemas/project";
import {
  orderProjects,
  projectActivity,
  projectDisplayName,
} from "./order-projects";

const project = (
  id: string,
  name: string,
  extra: Partial<Record<string, unknown>> = {},
) =>
  ({
    id,
    name,
    nameIsDerived: false,
    repos: [],
    viewerRole: "member",
    lastTouchedAt: null,
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...extra,
  }) as unknown as Project;

describe("orderProjects", () => {
  const web = project("p1", "Web app", {
    repos: [{ repoFullName: "acme/web", baseBranch: "main" }],
  });
  const api = project("p2", "API", {
    updatedAt: new Date("2026-02-01T00:00:00Z"),
  });
  const docs = project("p3", "Docs", { viewerRole: "none" });

  it("puts recently touched projects first, then newer updates", () => {
    const activity = new Map([["p1", 10]]);
    const { yours, others } = orderProjects([web, api, docs], "", activity);
    expect(yours.map((p) => p.id)).toEqual(["p1", "p2"]);
    expect(others.map((p) => p.id)).toEqual(["p3"]);
  });

  it("treats projects you touched as yours even without a role", () => {
    const { yours } = orderProjects([docs], "", new Map([["p3", 1]]));
    expect(yours).toEqual([docs]);
  });

  it("matches repo names and offers to create unmatched names", () => {
    expect(orderProjects([web, api], "acme/web", new Map()).matches).toEqual([
      web,
    ]);
    const none = orderProjects([web, api], "  Mobile ", new Map());
    expect(none.matches).toEqual([]);
    expect(none.createName).toBe("Mobile");
  });
});

describe("projectActivity", () => {
  it("takes the newest of lastTouchedAt and your own threads", () => {
    const p = project("p1", "Web", { lastTouchedAt: new Date(1000) });
    const map = projectActivity(
      [p],
      [
        { projectId: "p1", userId: "u1", updatedAt: new Date(5000) },
        { projectId: "p1", userId: "u2", updatedAt: new Date(9000) },
        { projectId: null, userId: "u1", updatedAt: new Date(9000) },
      ],
      "u1",
    );
    expect(map.get("p1")).toBe(5000);
  });
});

describe("projectDisplayName", () => {
  it("splits the derived +N suffix", () => {
    expect(projectDisplayName({ name: "web +2", nameIsDerived: true })).toEqual(
      {
        base: "web",
        suffix: " +2",
      },
    );
    expect(
      projectDisplayName({ name: "web +2", nameIsDerived: false }).suffix,
    ).toBe(undefined);
  });
});
