import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ActivityFilterMenu,
  type ActivityFilterOption,
  filterOptions,
  filterSummary,
  toggleSelection,
} from "./activity-filter-menu";

afterEach(cleanup);

const options: ActivityFilterOption[] = [
  { value: "web", label: "Web app", icon: null },
  { value: "api", label: "API", icon: null },
  { value: "docs", label: "Docs", icon: null },
];

describe("activity filter logic", () => {
  it("filters options by a trimmed, case-insensitive query", () => {
    expect(filterOptions(options, "  ap ").map((o) => o.value)).toEqual([
      "web",
      "api",
    ]);
    expect(filterOptions(options, "")).toBe(options);
  });

  it("summarises the selection like Capy", () => {
    expect(filterSummary(options, [], "All projects", "projects").text).toBe(
      "All projects",
    );
    expect(
      filterSummary(options, ["api"], "All projects", "projects").text,
    ).toBe("API");
    expect(
      filterSummary(options, ["api", "docs"], "All projects", "projects").text,
    ).toBe("2 projects");
  });

  it("toggles one value", () => {
    expect(toggleSelection(["web"], "api", true)).toEqual(["web", "api"]);
    expect(toggleSelection(["web", "api"], "web", false)).toEqual(["api"]);
  });
});

describe("ActivityFilterMenu", () => {
  it("labels its trigger and shows the summary", () => {
    render(
      <ActivityFilterMenu
        label="Project"
        allLabel="All projects"
        noun="projects"
        heading="Projects"
        searchPlaceholder="Filter projects"
        options={options}
        selected={[]}
        onChange={vi.fn()}
      />,
    );
    const trigger = screen.getByRole("button", { name: "Project filter" });
    expect(trigger.textContent).toContain("All projects");
  });

  it("lists options and reports a pick", async () => {
    const onChange = vi.fn();
    render(
      <ActivityFilterMenu
        label="Project"
        allLabel="All projects"
        noun="projects"
        heading="Projects"
        searchPlaceholder="Filter projects"
        options={options}
        selected={[]}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Project filter" }));
    const item = await screen.findByRole("menuitemcheckbox", { name: "API" });
    fireEvent.click(item);
    expect(onChange).toHaveBeenCalledWith(["api"]);
  });
});
