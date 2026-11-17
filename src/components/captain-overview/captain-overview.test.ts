import { DateTime } from "effect";
import { describe, expect, it } from "vitest";
import type { IssueSummary } from "@/data/api/schemas/issue";
import { partitionCaptainIssues } from "./captain-overview";
import { hiddenRowCount } from "./overview-section";
import { formatAgoMinified } from "./relative-time";

const now = new Date("2026-03-10T12:00:00Z");
const ago = (ms: number) => new Date(now.getTime() - ms);

describe("formatAgoMinified", () => {
  it("rounds down to the largest whole unit", () => {
    expect(formatAgoMinified(ago(20_000), now)).toBe("now");
    expect(formatAgoMinified(ago(5 * 60_000), now)).toBe("5m");
    expect(formatAgoMinified(ago(11 * 3_600_000 + 59 * 60_000), now)).toBe(
      "11h",
    );
    expect(formatAgoMinified(ago(3 * 86_400_000), now)).toBe("3d");
    expect(formatAgoMinified(ago(15 * 86_400_000), now)).toBe("2w");
    expect(formatAgoMinified(ago(400 * 86_400_000), now)).toBe("1y");
  });

  it("treats future dates as now", () => {
    expect(formatAgoMinified(ago(-60_000), now)).toBe("now");
  });
});

describe("hiddenRowCount", () => {
  it("hides rows past ten until expanded", () => {
    expect(hiddenRowCount(4, false)).toBe(0);
    expect(hiddenRowCount(17, false)).toBe(7);
    expect(hiddenRowCount(17, true)).toBe(0);
  });
});

const issue = (
  id: string,
  stateId: string,
  assignee: "user" | "jam" | null,
  minutesAgo: number,
) =>
  ({
    id,
    code: `ACME-${id}`,
    stateId,
    assignee:
      assignee === null
        ? null
        : { kind: assignee, id: `a-${id}`, name: "Alex Morgan" },
    updatedAt: DateTime.makeUnsafe(now.getTime() - minutesAgo * 60_000),
  }) as unknown as IssueSummary;

describe("partitionCaptainIssues", () => {
  it("splits open issues by assignee kind, newest first", () => {
    const { needsYou, inProgress } = partitionCaptainIssues(
      [
        issue("1", "todo", "user", 30),
        issue("2", "todo", "jam", 10),
        issue("3", "doing", "user", 5),
        issue("4", "done", "user", 1),
        issue("5", "todo", null, 1),
        issue("6", "doing", "jam", 50),
      ],
      ["todo", "doing"],
    );
    expect(needsYou.map((i) => i.id)).toEqual(["3", "1"]);
    expect(inProgress.map((i) => i.id)).toEqual(["2", "6"]);
  });
});
