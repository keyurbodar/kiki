import { describe, expect, it } from "vitest";
import { defaultThreadFilters, filterThreads } from "./model";
import { captainItems } from "./threads-page";

const row = (id: string, userId: string) => ({
  id,
  title: id,
  projectId: null,
  userId,
  createdAt: "2026-11-01T00:00:00.000Z",
  face: {
    name: id,
    avatar: { kind: "preset" as const, value: "capy-avatar-1" },
  },
});

describe("captainItems", () => {
  const rows = [
    row("owned", "user_me"),
    row("member", "user_priya"),
    row("unrelated", "user_priya"),
  ];

  it("marks the captains the viewer owns as participated", () => {
    expect(
      captainItems(rows, "user_me").map((item) => [item.id, item.participated]),
    ).toEqual([
      ["owned", true],
      ["member", false],
      ["unrelated", false],
    ]);
    expect(
      captainItems(rows, undefined).some((item) => item.participated),
    ).toBe(false);
  });

  it("keeps every captain under the default Participants filter", () => {
    // Live Capy draws its Captains section at Participants = Me, so the axis
    // does not drop captains the viewer neither owns nor belongs to.
    const mine = filterThreads(
      captainItems(rows, "user_me"),
      defaultThreadFilters,
      "user_me",
      Date.now(),
    );
    expect(mine.map((item) => item.id)).toEqual([
      "owned",
      "member",
      "unrelated",
    ]);
  });
});
