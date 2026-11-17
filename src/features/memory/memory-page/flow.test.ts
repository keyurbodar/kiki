import { describe, expect, it } from "vitest";
import type { MemoryTopic } from "./types.ts";
import {
  emptyStateCopy,
  forgetDescription,
  forgetTitle,
  memoryErrorCopy,
  memoryListQuery,
  plainSource,
  scopeLabel,
  sortMemories,
  whereLabel,
  whoLabel,
} from "./flow.ts";

const topic = (overrides: Partial<MemoryTopic> = {}): MemoryTopic => ({
  volumeId: "v1",
  path: "note.md",
  title: "Title",
  description: "Description",
  body: "Body",
  scope: "personal",
  source: null,
  statedBy: null,
  lastConfirmed: null,
  projectId: null,
  repositories: [],
  digest: "d",
  canWrite: true,
  ...overrides,
});

describe("memory list query", () => {
  it("maps the who and where search params to endpoint filters", () => {
    expect(
      memoryListQuery({ who: "you", where: "everywhere" }, "  note  "),
    ).toEqual({ scope: "user", tab: "personal", projectId: undefined, q: "note" });
    expect(memoryListQuery({ who: "everyone", where: "pr1" }, "")).toEqual({
      scope: undefined,
      tab: "shared",
      projectId: "pr1",
      q: undefined,
    });
  });
});

describe("memory labels and sorting", () => {
  it("labels scopes, who and where", () => {
    expect(scopeLabel("project")).toBe("Everyone");
    expect(scopeLabel("project-user")).toBe("Only you");
    expect(whoLabel(undefined)).toBe("All");
    expect(whereLabel("pr1", [{ id: "pr1", name: "Sample" }])).toBe("Sample");
    expect(whereLabel("gone", [])).toBe("Project");
  });

  it("sorts by a column then title, honoring direction", () => {
    const rows = [topic({ title: "B" }), topic({ title: "A" })];
    expect(
      sortMemories(rows, { column: "title", direction: "ascending" }).map(
        (row) => row.title,
      ),
    ).toEqual(["A", "B"]);
    expect(
      sortMemories(rows, { column: "title", direction: "descending" }).map(
        (row) => row.title,
      ),
    ).toEqual(["B", "A"]);
  });
});

describe("memory empty and error copy", () => {
  it("uses exact empty state copy for each cause", () => {
    expect(emptyStateCopy("note", { nextCursor: null, skipped: 0 }, true).title).toBe(
      "No memories match “note”",
    );
    expect(
      emptyStateCopy("", { nextCursor: "next", skipped: 0 }, false).title,
    ).toBe("No readable memories on this page");
    expect(emptyStateCopy("", { nextCursor: null, skipped: 0 }, false).title).toBe(
      "No memories match these filters",
    );
  });

  it("keeps the draft on a head conflict and uses the fallback otherwise", () => {
    expect(memoryErrorCopy({ _tag: "capy/VolumeHeadMoved" }, "x")).toEqual({
      message: "Could not update memory",
      description:
        "Keep your draft, reload the latest memory before saving again",
    });
    expect(memoryErrorCopy(new Error("x"), "Could not update memory")).toEqual({
      message: "Could not update memory",
      description: undefined,
    });
  });
});

describe("memory detail copy", () => {
  it("strips markdown from sources", () => {
    expect(plainSource("See [the note](https://example.com) *now*")).toBe(
      "See the note now",
    );
  });

  it("distinguishes shared and personal forget copy", () => {
    expect(forgetTitle(topic({ scope: "project" }))).toBe(
      "Forget this shared memory?",
    );
    expect(
      forgetDescription(topic({ scope: "project" }), "Sample"),
    ).toBe("Removes it from Sample shared memory for everyone");
    expect(forgetDescription(topic(), "Sample")).toBe(
      "Removes it from your saved memories",
    );
  });
});
