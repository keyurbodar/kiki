import { describe, expect, it } from "vitest";
import type { AnnouncementDefinition } from "@/components/release";
import { announcementRows, announcementsFor } from "./announcements";

const definition = (title: string): AnnouncementDefinition => ({
  title,
  meta: title,
  summary: title,
  dialog: () => null,
});

const definitions = {
  "release-0.9.0": definition("Capy 0.9.0"),
  "desktop-app-2026-09": definition("Capy Desktop"),
};

describe("announcementRows", () => {
  it("reads a list response and a bare array alike", () => {
    const row = {
      key: "release-0.9.0",
      publishedAt: "2026-11-15T00:00:00.000Z",
      state: { seenAt: null },
    };
    expect(announcementRows({ announcements: [row] })).toEqual([
      {
        key: "release-0.9.0",
        publishedAt: "2026-11-15T00:00:00.000Z",
        seen: false,
        platforms: [],
      },
    ]);
    expect(announcementRows([row])).toHaveLength(1);
  });

  it("treats a seenAt on the row as seen", () => {
    expect(
      announcementRows([
        {
          key: "release-0.9.0",
          createdAt: "2026-11-15T00:00:00.000Z",
          seenAt: "2026-11-16T00:00:00.000Z",
        },
      ])[0],
    ).toEqual({
      key: "release-0.9.0",
      publishedAt: "2026-11-15T00:00:00.000Z",
      seen: true,
      platforms: [],
    });
  });

  it("ignores rows without a key and other shapes entirely", () => {
    expect(announcementRows(null)).toEqual([]);
    expect(announcementRows({})).toEqual([]);
    expect(announcementRows([{ title: "no key" }, "nope", 3])).toEqual([]);
  });
});

describe("announcementsFor", () => {
  const rows = {
    announcements: [
      { key: "release-0.9.0", publishedAt: "2026-11-15T00:00:00.000Z" },
      {
        key: "desktop-app-2026-09",
        publishedAt: "2026-09-01T00:00:00.000Z",
        platforms: ["web"],
      },
      { key: "release-unknown", publishedAt: "2026-11-01T00:00:00.000Z" },
      {
        key: "release-0.8.0",
        publishedAt: "2026-11-10T00:00:00.000Z",
        state: { seenAt: "2026-11-11T00:00:00.000Z" },
      },
    ],
  };

  it("keeps unseen announcements this build has a definition for", () => {
    expect(
      announcementsFor(rows, definitions, new Set(), ["web"]).map((a) => a.key),
    ).toEqual(["release-0.9.0", "desktop-app-2026-09"]);
  });

  it("drops dismissed keys and platform mismatches", () => {
    expect(
      announcementsFor(rows, definitions, new Set(["release-0.9.0"]), [
        "web",
      ]).map((a) => a.key),
    ).toEqual(["desktop-app-2026-09"]);
    expect(announcementsFor(rows, definitions, new Set(), ["mobile"])).toEqual([
      expect.objectContaining({ key: "release-0.9.0" }),
    ]);
  });

  it("carries the definition into the item", () => {
    const [item] = announcementsFor(rows, definitions, new Set(), ["web"]);
    expect(item?.title).toBe("Capy 0.9.0");
    expect(item?.summary).toBe("Capy 0.9.0");
  });
});
