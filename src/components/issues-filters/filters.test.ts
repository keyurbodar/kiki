import { describe, expect, it } from "vitest";
import {
  emptyActorFilter,
  emptyIssueFilters,
  filtersForView,
  issueEmptyText,
  issueFilterLimit,
  issueListQuery,
  issueViews,
  stateVisible,
  toggleActor,
  toggleValue,
  viewOfFilters,
} from "./filters";

describe("issue filter views", () => {
  it("round-trips every preset view", () => {
    for (const view of issueViews)
      expect(viewOfFilters(filtersForView(view))).toBe(view);
  });

  it("drops to a custom view once a filter changes", () => {
    expect(
      viewOfFilters({ ...filtersForView("all"), priorities: ["high"] }),
    ).toBeUndefined();
  });

  it("uses Capy's empty copy", () => {
    expect(issueEmptyText("assigned", "")).toBe("Nothing assigned to you");
    expect(issueEmptyText("created", "")).toBe(
      "You haven't created an issue yet",
    );
    expect(issueEmptyText(undefined, "")).toBe("No issues match these filters");
    expect(issueEmptyText("all", "retry")).toBe("No matching issues");
  });
});

describe("issue filter values", () => {
  it("toggles values and stops at the limit", () => {
    expect(toggleValue(["a"], "a")).toEqual([]);
    expect(toggleValue(["a"], "b")).toEqual(["a", "b"]);
    const full = Array.from({ length: issueFilterLimit }, (_, i) => String(i));
    expect(toggleValue(full, "x")).toBe(full);
  });

  it("toggles actor shortcuts", () => {
    const withMe = toggleActor(emptyActorFilter, { kind: "me" });
    expect(withMe.me).toBe(true);
    const crew = toggleActor(withMe, { kind: "captains", scope: "member" });
    expect(crew.captains).toBe("member");
    expect(
      toggleActor(crew, { kind: "captains", scope: "member" }).captains,
    ).toBeNull();
    expect(toggleActor(crew, { kind: "user", id: "usr_1" }).userIds).toEqual([
      "usr_1",
    ]);
  });

  it("filters states by inclusion or exclusion", () => {
    expect(stateVisible(emptyIssueFilters, "ist_a")).toBe(true);
    expect(
      stateVisible({ stateIds: ["ist_a"], stateNot: false }, "ist_b"),
    ).toBe(false);
    expect(stateVisible({ stateIds: ["ist_a"], stateNot: true }, "ist_b")).toBe(
      true,
    );
  });
});

describe("issueListQuery", () => {
  it("sends nothing for the All view", () => {
    expect(issueListQuery(filtersForView("all"), "", "2026-01-02")).toEqual({});
  });

  it("encodes the For you view as Capy's any-match query", () => {
    expect(issueListQuery(filtersForView("for_you"), "", "2026-01-02")).toEqual(
      {
        match: "any",
        assigneeMe: "1",
        assigneeCaptains: "member",
        creatorMe: "1",
        creatorCaptains: "member",
      },
    );
  });

  it("only sends negations, label match and today when they apply", () => {
    const query = issueListQuery(
      {
        ...emptyIssueFilters,
        priorities: ["high"],
        prioritiesNot: true,
        labelIds: ["lbl_1", "lbl_2"],
        labelMatch: "all",
        due: ["overdue"],
        stateIds: ["ist_a"],
        assigneeNot: true,
      },
      "  checkout ",
      "2026-01-02",
    );
    expect(query).toEqual({
      priorities: ["high"],
      prioritiesNot: "1",
      labelIds: ["lbl_1", "lbl_2"],
      labelMatch: "all",
      due: ["overdue"],
      today: "2026-01-02",
      search: "checkout",
    });
  });
});
