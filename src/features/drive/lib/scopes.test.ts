import { describe, expect, it } from "vitest";
import { mountScope, mountTrail, targetRoute } from "./mount";
import {
  compareRows,
  type DriveScopeSummary,
  directoryRows,
  scopeRows,
} from "./scopes";

const summary = (fields: Partial<DriveScopeSummary>): DriveScopeSummary => ({
  projectId: null,
  userId: null,
  automationId: null,
  captainJamId: null,
  fileCount: 0,
  totalBytes: 0,
  headUpdatedAt: null,
  ...fields,
});

const names = {
  organizationName: "Acme",
  userId: "user_a",
  projects: [{ id: "proj_web", name: "Web app" }],
  automations: [{ id: "auto_1", name: "Nightly check" }],
  captains: [{ id: "jam_cap", name: "Release captain" }],
};

describe("drive scope rows", () => {
  it("labels every kind of scope like Capy", () => {
    const rows = scopeRows(
      [
        summary({}),
        summary({ userId: "user_a" }),
        summary({ captainJamId: "jam_cap" }),
        summary({ automationId: "auto_1" }),
        summary({ projectId: "proj_web" }),
        summary({ projectId: "proj_web", userId: "user_a" }),
        summary({ projectId: "proj_unknown" }),
        summary({ userId: "user_other" }),
      ],
      names,
    );
    expect(rows.map((row) => [row.key, row.label, row.scopeLabel])).toEqual([
      ["organization", "Acme", "Every thread in the organization"],
      ["personal", "Your drive", "Only your threads"],
      ["captain:jam_cap", "Release captain", "This Captain and its crew"],
      ["automation:auto_1", "Nightly check", "This automation's runs"],
      ["project:proj_web:shared", "Web app", "Every thread in Web app"],
      [
        "project:proj_web:personal",
        "Your drive in Web app",
        "Your threads in Web app",
      ],
    ]);
  });

  it("always lists the organization and personal drives first", () => {
    const rows = directoryRows([summary({ captainJamId: "jam_cap" })], names);
    expect(rows.map((row) => row.key)).toEqual([
      "organization",
      "personal",
      "captain:jam_cap",
    ]);
    expect(rows[0]?.summary.fileCount).toBe(0);
  });

  it("orders by update time, then name", () => {
    const rows = directoryRows(
      [
        summary({ captainJamId: "jam_cap", headUpdatedAt: new Date(2) }),
        summary({ projectId: "proj_web", fileCount: 9, totalBytes: 5 }),
      ],
      names,
    );
    expect(rows.toSorted(compareRows("updated")).map((r) => r.key)[0]).toBe(
      "captain:jam_cap",
    );
    expect(rows.toSorted(compareRows("files")).map((r) => r.key)[0]).toBe(
      "project:proj_web:shared",
    );
    expect(rows.toSorted(compareRows("name")).map((r) => r.label)).toEqual([
      "Acme",
      "Release captain",
      "Web app",
      "Your drive",
    ]);
  });
});

describe("drive mounts", () => {
  it("resolves the exact scope of a mount", () => {
    expect(mountScope({ kind: "directory", scope: "personal" }, "u")).toEqual({
      projectId: null,
      userId: "u",
      automationId: null,
      captainJamId: null,
    });
    expect(
      mountScope({ kind: "project", projectId: "p", scope: "shared" }, "u"),
    ).toMatchObject({ projectId: "p", userId: null });
  });

  it("routes and titles scopes", () => {
    expect(
      targetRoute({ kind: "project", projectId: "p", personal: true }),
    ).toEqual({
      to: "/project/$projectId/drive/$scope",
      params: { projectId: "p", scope: "personal" },
    });
    const trail = mountTrail(
      { kind: "project", projectId: "p", scope: "personal" },
      { project: "Web app" },
      true,
    );
    expect(trail.title).toBe("Your drive");
    expect(trail.crumbs.map((c) => c.label)).toEqual(["Drive", "Web app"]);
  });
});
