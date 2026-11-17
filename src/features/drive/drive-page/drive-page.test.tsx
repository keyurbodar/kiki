import { describe, expect, it } from "vitest";
import { VolumeScopeDirectory } from "@/data/api/schemas/drive";
import type { VolumeId } from "@/data/api/schemas/ids";
import { mountScope } from "../lib/mount";
import { mergeScopePages } from "./directory";
import { tableColumns } from "./directory-table";
import { sharePreviewUrl, shareRoute } from "./shared-page";
import { usageSegments } from "./usage-footer";

const scopeSummary = (fileCount: number) => ({
  projectId: null,
  userId: null,
  automationId: null,
  captainJamId: null,
  fileCount,
  totalBytes: fileCount * 10,
  headUpdatedAt: null,
});

const page = (pageNumber: number, pageCount: number, files: number) =>
  VolumeScopeDirectory.make({
    storage: { usedBytes: pageNumber * 100, limitBytes: 1_000, tier: null },
    items: [scopeSummary(files)],
    page: pageNumber,
    pageCount,
    totalScopes: pageCount,
  });

describe("scope directory pages", () => {
  it("merges every server page in page order", () => {
    const merged = mergeScopePages(
      new Map([
        [2, page(2, 2, 2)],
        [1, page(1, 2, 1)],
      ]),
    );
    expect(merged.items.map((item) => item.fileCount)).toEqual([1, 2]);
    expect(merged.pageCount).toBe(2);
    expect(merged.totalScopes).toBe(2);
  });

  it("takes the storage meter and totals from the first page", () => {
    const merged = mergeScopePages(new Map([[1, page(1, 3, 4)]]));
    expect(merged.storage?.usedBytes).toBe(100);
    expect(merged.pageCount).toBe(3);
  });

  it("reads nothing before the first page arrives", () => {
    const merged = mergeScopePages(new Map());
    expect(merged.items).toEqual([]);
    expect(merged.storage).toBeNull();
  });
});

describe("scope mounts", () => {
  it("reads only the captain's drive", () => {
    expect(mountScope({ kind: "captain", jamId: "jam_1" }, "u_1")).toEqual({
      projectId: null,
      userId: null,
      automationId: null,
      captainJamId: "jam_1",
    });
  });
});

describe("directory table columns", () => {
  it("gives fluid and auto columns their narrow-screen minimums", () => {
    expect(
      tableColumns(
        "minmax(0,3fr) minmax(0,1.6fr) minmax(min-content,auto) auto",
      ),
    ).toBe(
      "minmax(var(--table-lead-min),3fr) minmax(var(--table-fluid-min),1.6fr) minmax(var(--table-auto-min,min-content),auto) auto",
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
