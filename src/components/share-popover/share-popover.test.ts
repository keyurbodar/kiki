import { describe, expect, it } from "vitest";
import { decodeShareList, decodeSharePage, decodeShareRow } from "./share-data";
import { displayShareUrl, shareDescription } from "./share-panel";
import { isPending, prunePending, visibilityOf } from "./share-pending";
import { shareErrorMessage, shareViewUrl } from "./share-visibility";

const share = { id: "shr_1", visibility: "org" as const };

describe("share pending state", () => {
  it("shows the requested visibility while a change is in flight", () => {
    const pending = new Map([
      [
        "shr_1",
        { from: "org" as const, to: "public" as const, settled: false },
      ],
    ]);
    expect(visibilityOf(pending, share)).toBe("public");
    expect(isPending(pending, share)).toBe(true);
  });

  it("keeps a settled change until the server reflects it", () => {
    const pending = new Map([
      ["shr_1", { from: "org" as const, to: "public" as const, settled: true }],
    ]);
    expect(visibilityOf(pending, share)).toBe("public");
    expect(isPending(pending, share)).toBe(false);
    expect(prunePending(pending, [share])).toBe(pending);
    const refreshed = prunePending(pending, [
      { ...share, visibility: "public" },
    ]);
    expect(refreshed.size).toBe(0);
    expect(visibilityOf(refreshed, { ...share, visibility: "public" })).toBe(
      "public",
    );
  });
});

describe("share data", () => {
  it("decodes rows with safe defaults", () => {
    expect(decodeShareRow({ id: "a", visibility: "weird" })).toMatchObject({
      id: "a",
      visibility: "private",
      manageable: true,
      changedAt: null,
    });
  });

  it("reads arrays and pages alike", () => {
    expect(decodeShareList([{ id: "a" }]).map((row) => row.id)).toEqual(["a"]);
    expect(
      decodeShareList({ items: [{ id: "b" }] }).map((row) => row.id),
    ).toEqual(["b"]);
    expect(decodeSharePage([{ id: "a" }])).toMatchObject({
      total: 1,
      page: 1,
      pageCount: 1,
    });
    expect(
      decodeSharePage({ items: [], total: 0, page: 2, pageCount: 3 }),
    ).toMatchObject({ total: 0, page: 2, pageCount: 3 });
  });
});

describe("share copy", () => {
  it("maps API errors to Capy's messages", () => {
    expect(
      shareErrorMessage({ _tag: "capy/DriveSharePathNotFound" }, "x"),
    ).toBe("Save the file before sharing it");
    expect(shareErrorMessage({ _tag: "capy/Forbidden" }, "x")).toBe(
      "You cannot share from this drive",
    );
    expect(shareErrorMessage(new Error("boom"), "fallback")).toBe("fallback");
  });

  it("describes who controls the link", () => {
    expect(shareDescription(undefined, "public")).toBe(
      "Anyone with the link can open it, no account needed",
    );
    expect(
      shareDescription(
        {
          id: "a",
          url: "u",
          visibility: "org",
          createdBy: null,
          manageable: false,
        },
        "org",
      ),
    ).toBe("Another member controls who can open it");
  });

  it("formats urls", () => {
    expect(displayShareUrl("https://capy.example/s/a")).toBe(
      "capy.example/s/a",
    );
    expect(shareViewUrl("https://capy.example/s/a")).toBe(
      "https://capy.example/s/a?view=share",
    );
  });
});
