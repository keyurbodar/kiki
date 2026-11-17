import { describe, expect, it } from "vitest";
import {
  addsNote,
  pageCount,
  publicationStatus,
  publicationsFrom,
  reviewSteps,
  type ThemePublication,
} from "./publication";

const version = (
  overrides: Partial<ThemePublication["versions"][number]> = {},
) => ({
  id: "ver_1",
  version: 1,
  createdAt: "2026-03-04T10:00:00.000Z",
  reviewed: false,
  removed: false,
  ...overrides,
});

const publication = (
  overrides: Partial<ThemePublication> = {},
): ThemePublication => ({
  themeId: "theme_1",
  slug: "harbor",
  listed: false,
  withdrawn: false,
  removed: false,
  adds: 0,
  versions: [version()],
  ...overrides,
});

describe("publicationStatus", () => {
  it("covers every state with Capy's copy", () => {
    expect(publicationStatus(undefined)).toEqual({
      label: "Not published",
      color: "neutral",
      note: "Only you can see it",
    });
    expect(publicationStatus(publication({ removed: true })).label).toBe(
      "Removed",
    );
    expect(publicationStatus(publication({ withdrawn: true })).note).toBe(
      "Not in Explore, copies people added stay",
    );
    expect(
      publicationStatus(
        publication({ versions: [version({ removed: true })] }),
      ),
    ).toMatchObject({ label: "Not approved", color: "danger" });
    expect(
      publicationStatus(
        publication({ adds: 2, versions: [version({ reviewed: true })] }),
      ),
    ).toEqual({ label: "Approved", color: "success", note: "Added 2 times" });
    expect(publicationStatus(publication()).note).toBe(
      "In Explore once Capy approves it",
    );
    expect(publicationStatus(publication({ listed: true })).note).toBe(
      "The approved version stays in Explore until Capy approves this one",
    );
  });

  it("counts adds", () => {
    expect(addsNote(0)).toBe("Not added yet");
    expect(addsNote(1)).toBe("Added once");
  });
});

describe("reviewSteps", () => {
  it("lists the submission then the review", () => {
    expect(reviewSteps(publication())).toEqual([
      { label: "Submitted version 1", note: "Mar 4, 2026", state: "done" },
      {
        label: "Waiting for approval",
        note: "Capy approves each version before it goes in Explore",
        state: "current",
      },
    ]);
    expect(reviewSteps(publication({ removed: true }))[1]?.state).toBe(
      "failed",
    );
    expect(reviewSteps(publication({ versions: [] }))).toEqual([]);
  });
});

describe("publicationsFrom", () => {
  it("keys publications by theme and skips rows without versions", () => {
    const map = publicationsFrom({
      publications: [publication(), { themeId: "legacy" }],
    });
    expect([...map.keys()]).toEqual(["theme_1"]);
    expect(publicationsFrom([publication()]).size).toBe(1);
  });
});

it("pages twelve themes at a time", () => {
  expect(pageCount(0)).toBe(1);
  expect(pageCount(12)).toBe(1);
  expect(pageCount(13)).toBe(2);
});
