import { describe, expect, it } from "vitest";
import { defaultThreadFilters, filterThreads } from "./model";
import { captainItems } from "./threads-page";

const row = (id: string, ownerId: string, memberIds: string[]) => ({
  id,
  name: id,
  projectId: null,
  ownerId,
  createdAt: "2026-11-01T00:00:00.000Z",
  imageUrl: null,
  memberIds,
});

describe("captainItems", () => {
  const rows = [
    row("owned", "user_me", []),
    row("member", "user_priya", ["user_me"]),
    row("unrelated", "user_priya", ["user_sam"]),
  ];

  it("marks only captains the viewer owns or belongs to as participated", () => {
    expect(
      captainItems(rows, "user_me").map((item) => [item.id, item.participated]),
    ).toEqual([
      ["owned", true],
      ["member", true],
      ["unrelated", false],
    ]);
    expect(
      captainItems(rows, undefined).some((item) => item.participated),
    ).toBe(false);
  });

  it("keeps unrelated captains out of My threads", () => {
    const mine = filterThreads(
      captainItems(rows, "user_me"),
      defaultThreadFilters,
      "user_me",
      Date.now(),
    );
    expect(mine.map((item) => item.id)).toEqual(["owned", "member"]);
  });
});
