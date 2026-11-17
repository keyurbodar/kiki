import { describe, expect, it } from "vitest";
import { tableColumns } from "./directory-table";
import { sharePreviewUrl, shareRoute } from "./shared-page";
import { usageSegments } from "./usage-footer";

describe("directory table columns", () => {
  it("gives fluid and auto columns their narrow-screen minimums", () => {
    expect(
      tableColumns("minmax(0,3fr) minmax(0,1.6fr) minmax(3.5rem,auto) auto"),
    ).toBe(
      "minmax(var(--table-lead-min),3fr) minmax(var(--table-fluid-min),1.6fr) minmax(var(--table-auto-min,3.5rem),auto) auto",
    );
  });
});

describe("shared page helpers", () => {
  it("opens a share in the drive that holds it", () => {
    const none = {
      projectId: null,
      userId: null,
      automationId: null,
      captainJamId: null,
    };
    expect(shareRoute({ ...none, captainJamId: "jam_1" })).toEqual({
      to: "/drive/captain/$jamId",
      params: { jamId: "jam_1" },
    });
    expect(shareRoute({ ...none, projectId: "p", userId: "u" }).params).toEqual(
      { projectId: "p", scope: "personal" },
    );
    expect(shareRoute(none).params).toEqual({ scope: "organization" });
    expect(sharePreviewUrl("/s/x")).toBe("/s/x?view=share");
  });
});

describe("usage segments", () => {
  it("takes each scope's bytes", () => {
    expect(
      usageSegments([
        {
          key: "organization",
          label: "Acme",
          scopeLabel: "",
          personal: false,
          target: { kind: "organization" },
          summary: {
            projectId: null,
            userId: null,
            automationId: null,
            captainJamId: null,
            fileCount: 1,
            totalBytes: 42,
            headUpdatedAt: null,
          },
        },
      ]),
    ).toEqual([{ key: "organization", bytes: 42 }]);
  });
});
