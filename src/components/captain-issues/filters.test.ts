import { describe, expect, it } from "vitest";
import {
  captainIssuesEmptyText,
  captainIssuesFiltersKey,
  captainIssueViews,
  defaultCaptainIssueFilters,
  filtersForView,
  viewForFilters,
} from "./filters";

describe("viewForFilters", () => {
  it("finds the preset each view's filters belong to", () => {
    for (const view of captainIssueViews) {
      expect(viewForFilters(captainIssueViews, filtersForView(view))).toBe(
        view,
      );
    }
  });

  it("is undefined for custom filters", () => {
    expect(
      viewForFilters(captainIssueViews, {
        ...defaultCaptainIssueFilters,
        stateIds: ["state_done"],
      }),
    ).toBeUndefined();
  });

  it("ignores stateNot without states", () => {
    expect(
      viewForFilters(captainIssueViews, {
        ...defaultCaptainIssueFilters,
        stateNot: true,
      }),
    ).toBe("all");
  });
});

describe("captainIssuesEmptyText", () => {
  it("uses the view's copy, the custom copy, or the search copy", () => {
    expect(captainIssuesEmptyText("", "all")).toBe(
      "No issues for this crew yet",
    );
    expect(captainIssuesEmptyText("", "assigned")).toBe(
      "Nothing in this crew is assigned to you",
    );
    expect(captainIssuesEmptyText("", "mentioned")).toBe(
      "No issues in this crew mention you",
    );
    expect(captainIssuesEmptyText("", undefined)).toBe(
      "No issues match these filters",
    );
    expect(captainIssuesEmptyText("deploy", "all")).toBe("No matching issues");
  });
});

describe("captainIssuesFiltersKey", () => {
  it("is empty for the default list and stable otherwise", () => {
    expect(captainIssuesFiltersKey(defaultCaptainIssueFilters, "  ")).toBe("");
    const a = captainIssuesFiltersKey(filtersForView("assigned"), " ci ");
    expect(a).not.toBe("");
    expect(captainIssuesFiltersKey(filtersForView("assigned"), "ci")).toBe(a);
    expect(captainIssuesFiltersKey(filtersForView("assigned"), "")).not.toBe(a);
  });
});
