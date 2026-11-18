import { RegistryProvider } from "@effect/atom-react";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { CaptainIssuesListProps } from "./captain-issues";
import { CaptainIssuesList } from "./captain-issues-list";

afterEach(cleanup);

const codes = () =>
  [...document.querySelectorAll("[data-issue-code]")].map((row) =>
    row.getAttribute("data-issue-code"),
  );

const section = (label: string) =>
  screen.getByText(label).closest("[data-slot=collapsible-trigger]");

async function mount(props: Partial<CaptainIssuesListProps> = {}) {
  const rootRoute = createRootRoute({
    component: () => (
      <RegistryProvider>
        <CaptainIssuesList
          scope="jam_sample_cap1"
          density="pane"
          filtersKey=""
          stateIds={[]}
          stateNot={false}
          hideClosedSubIssues={false}
          now={Date.now()}
          emptyText="No issues for this crew yet"
          {...props}
        />
      </RegistryProvider>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/issues"] }),
  });
  await router.load();
  render(<RouterProvider router={router} />);
  await waitFor(
    () =>
      expect(
        document.querySelector("[data-slot=collapsible-trigger]"),
      ).not.toBeNull(),
    { timeout: 4000 },
  );
}

describe("the crew issues list", () => {
  it("draws the crew's issues as state sections with counts", async () => {
    await mount();
    for (const [label, count] of [
      ["In review", "1"],
      ["In progress", "1"],
      ["Todo", "1"],
      ["Done", "1"],
      ["Canceled", "0"],
    ] as const) {
      const trigger = section(label);
      expect(trigger).not.toBeNull();
      expect(trigger?.textContent).toBe(`${label}${count}`);
    }
    expect(codes()).toEqual(["ACME-3", "ACME-2", "ACME-14"]);
  });

  it("opens a closed section to its rows", async () => {
    await mount();
    fireEvent.click(section("Done") as HTMLElement);
    expect(await screen.findByText("Bundler upgrade")).toBeTruthy();
    expect(codes()).toContain("ACME-8");
  });

  it("says a closed state with no issues is empty, not missing", async () => {
    await mount();
    fireEvent.click(section("Canceled") as HTMLElement);
    expect(await screen.findByText("No issues in Canceled")).toBeTruthy();
  });

  it("narrows to the issues assigned to the viewer", async () => {
    await mount({ assigneeMe: true });
    expect(codes()).toEqual(["ACME-2"]);
  });

  it("narrows to the search text", async () => {
    await mount({ search: "dark" });
    expect(codes()).toEqual(["ACME-3"]);
  });

  it("narrows the sections to the state filter", async () => {
    await mount({ stateIds: ["ist_sample_in_progress"] });
    expect(screen.queryByText("In review")).toBeNull();
    expect(codes()).toEqual(["ACME-2"]);
  });

  it("keeps only the issues that mention the viewer", async () => {
    await mount({ mentioned: true });
    expect(codes()).toEqual(["ACME-2"]);
  });

  it("shows the pane's empty copy when nothing matches", async () => {
    await mount({ search: "no-such-issue" });
    expect(codes()).toEqual([]);
    expect(await screen.findByText("No issues for this crew yet")).toBeTruthy();
  });
});
