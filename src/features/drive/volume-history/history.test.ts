import { DateTime } from "effect";
import { describe, expect, it } from "vitest";
import {
  groupHolds,
  holdSeqLabel,
  isPurgeRefusal,
  versionMeta,
  versionTitle,
} from "./history";

const now = Date.UTC(2026, 0, 10, 12);
const row = {
  createdAt: DateTime.makeUnsafe(now - 3 * 60 * 60 * 1000),
  fileCount: 1,
  totalBytes: 2048,
  kind: "checkpoint" as const,
  threadId: null,
  threadTitle: null,
  authorName: null,
};

describe("versionTitle", () => {
  it("prefers the thread title, then the author", () => {
    expect(versionTitle({ ...row, threadTitle: "Plan the launch" })).toBe(
      "Plan the launch",
    );
    expect(versionTitle({ ...row, authorName: "Alex Morgan" })).toBe(
      "Alex Morgan",
    );
  });

  it("names browser edits and untitled threads", () => {
    expect(versionTitle(row)).toBe("Edited in the browser");
    expect(versionTitle({ ...row, threadId: "jam_1" as never })).toBe(
      "Untitled thread",
    );
  });
});

describe("versionMeta", () => {
  it("joins time, count, size and flags", () => {
    expect(versionMeta(row, { now, current: false })).toBe(
      "3h ago · 1 file · 2.0 KB",
    );
    expect(
      versionMeta(
        { ...row, fileCount: 4, kind: "autosave" },
        { now, current: true },
      ),
    ).toBe("3h ago · 4 files · 2.0 KB · autosave · current");
  });
});

describe("purge refusals", () => {
  it("recognises the refusal tag", () => {
    expect(
      isPurgeRefusal({
        _tag: "capy/DrivePurgeNameRefused",
        reason: "held",
        holds: [],
      }),
    ).toBe(true);
    expect(isPurgeRefusal(new Error("nope"))).toBe(false);
  });

  it("groups holds in Capy's order and labels seqs", () => {
    const groups = groupHolds([
      { kind: "retained", seq: 4 },
      { kind: "live", seq: null },
      { kind: "retained", seq: 7 },
    ]);
    expect(groups).toEqual([
      { kind: "live", seqs: [] },
      { kind: "retained", seqs: [4, 7] },
    ]);
    expect(holdSeqLabel([4])).toBe("seq 4");
    expect(holdSeqLabel([4, 7])).toBe("2 versions");
  });
});
