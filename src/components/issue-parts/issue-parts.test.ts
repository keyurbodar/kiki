import { describe, expect, it } from "vitest";
import { IssueActor } from "@/data/api/schemas/issue";
import {
  issueActorLead,
  issueActorName,
  localToday,
  relativeTime,
} from "./issue-parts";

const now = Date.UTC(2026, 10, 17, 12);
const actor = (fields: Partial<IssueActor>) =>
  new IssueActor({
    kind: "user",
    id: "user_sample_alex",
    name: "Alex Morgan",
    code: null,
    avatarUrl: null,
    captain: false,
    ...fields,
  });

describe("relativeTime", () => {
  it("rounds down to the largest unit", () => {
    expect(relativeTime(now - 2000, { now })).toBe("just now");
    expect(relativeTime(now - 90 * 1000, { now })).toBe("1m ago");
    expect(relativeTime(now - 19 * 3600 * 1000, { now })).toBe("19h ago");
    expect(relativeTime(now - 3 * 86400 * 1000, { now })).toBe("3d ago");
    expect(relativeTime(now - 21 * 86400 * 1000, { now })).toBe("3w ago");
    expect(relativeTime(now + 2 * 86400 * 1000, { now })).toBe("in 2d");
    expect(relativeTime(now - 3600 * 1000, { now, minified: true })).toBe("1h");
  });
});

describe("actor names", () => {
  it("prefixes a thread's code and leads activity with it", () => {
    const thread = actor({ kind: "jam", code: "WEB-41", name: "Fix checkout" });
    expect(issueActorName(thread)).toBe("WEB-41 Fix checkout");
    expect(issueActorLead(thread)).toBe("WEB-41");
  });

  it("names people and captains plainly, and Capy when nobody acted", () => {
    expect(issueActorName(actor({}))).toBe("Alex Morgan");
    const captain = actor({ kind: "jam", captain: true, name: "Atlas" });
    expect(issueActorLead(captain)).toBe("Atlas");
    expect(issueActorLead(null)).toBe("Capy");
  });
});

describe("localToday", () => {
  it("formats the local calendar day", () => {
    expect(localToday(new Date(2026, 10, 7, 23, 30).getTime())).toBe(
      "2026-11-07",
    );
  });
});
