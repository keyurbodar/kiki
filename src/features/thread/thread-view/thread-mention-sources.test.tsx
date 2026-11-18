import { describe, expect, it } from "vitest";
import type { ThreadCard } from "@/data/api/schemas/thread";
import {
  skillNames,
  skillsMentionSource,
  threadMentionSources,
} from "./thread-mention-sources";

/** The builder reads only these three fields, so the card carries no more. */
const thread = (id: string, title: string | null, archived = false) =>
  ({ id, title, archived }) as unknown as ThreadCard;

describe("thread mention sources", () => {
  it("feeds Capy's Threads category from the org's threads", () => {
    const source = threadMentionSources(
      [thread("jam_a", "Fix the sidebar"), thread("jam_b", null)],
      "jam_current",
    )[0]!;
    expect(source.label).toBe("Threads");
    expect(source.description).toBe("Reference another thread");
    expect(source.category).toBe("threads");
    expect(source.initial?.()).toEqual([
      { kind: "thread", id: "jam_a", label: "Fix the sidebar" },
      { kind: "thread", id: "jam_b", label: "Untitled thread" },
    ]);
  });

  it("leaves out the thread being read and the archived ones", () => {
    const source = threadMentionSources(
      [
        thread("jam_current", "This one"),
        thread("jam_archived", "Archived", true),
        thread("jam_other", "Another"),
      ],
      "jam_current",
    )[0]!;
    expect(source.initial?.()).toEqual([
      { kind: "thread", id: "jam_other", label: "Another" },
    ]);
  });

  it("narrows on the typed term", () => {
    const source = threadMentionSources(
      [thread("jam_a", "Fix the sidebar"), thread("jam_b", "Billing")],
      "jam_current",
    )[0]!;
    expect(source.search("side")).toEqual([
      { kind: "thread", id: "jam_a", label: "Fix the sidebar" },
    ]);
  });

  it("states no category when there is nothing to reference", () => {
    expect(
      threadMentionSources([thread("jam_current", "Only one")], "jam_current"),
    ).toEqual([]);
  });
});

describe("skill mention source", () => {
  it("reads a skill name only from its SKILL.md", () => {
    expect(
      skillNames([
        "skills/triage/SKILL.md",
        "skills/triage/notes.md",
        "skills/release-notes/SKILL.md",
        "README.md",
      ]),
    ).toEqual(["release-notes", "triage"]);
  });

  it("offers no skills category when the scope holds none", () => {
    expect(skillsMentionSource(["README.md"])).toBeUndefined();
  });

  it("offers the installed skills as a skill mention source", () => {
    const source = skillsMentionSource([
      "skills/triage/SKILL.md",
      "skills/release-notes/SKILL.md",
    ]);
    expect(source?.kind).toBe("skill");
    expect(source?.label).toBe("Skills");
    expect(source?.initial?.()).toEqual([
      { kind: "skill", id: "release-notes", label: "release-notes" },
      { kind: "skill", id: "triage", label: "triage" },
    ]);
    expect(source?.search("tri")).toEqual([
      { kind: "skill", id: "triage", label: "triage" },
    ]);
  });
});
