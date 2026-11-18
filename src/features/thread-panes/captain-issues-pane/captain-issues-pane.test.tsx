import { RegistryProvider } from "@effect/atom-react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
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
import { CaptainIssuesPane } from "./captain-issues-pane";

afterEach(cleanup);

const section = (label: string) =>
  screen.getByText(label).closest("[data-slot=collapsible-trigger]");

async function mount() {
  const rootRoute = createRootRoute({
    component: () => (
      <RegistryProvider>
        <CaptainIssuesPane threadId="jam_sample_cap1" />
      </RegistryProvider>
    ),
  });
  const issueRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/issues/$code",
    component: () => null,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([issueRoute]),
    history: createMemoryHistory({
      initialEntries: ["/thread/jam_sample_cap1"],
    }),
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
  return router;
}

describe("the crew issues pane", () => {
  it("renders the crew's issues, not an empty state", async () => {
    await mount();
    expect(section("In review")?.textContent).toBe("In review1");
    expect(section("In progress")?.textContent).toBe("In progress1");
    expect(section("Done")?.textContent).toBe("Done1");
    expect(section("Canceled")?.textContent).toBe("Canceled0");
    expect(screen.queryByText("No issues for this crew yet")).toBeNull();
  });

  it("opens an issue when its row is picked", async () => {
    const router = await mount();
    fireEvent.click(
      document.querySelector("[data-issue-code=ACME-3]") as HTMLElement,
    );
    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/issues/ACME-3"),
    );
  });

  it("offers the filter and display menus beside search", async () => {
    await mount();
    expect(screen.getByRole("button", { name: "Search" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Filter issues" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Display options" }),
    ).toBeTruthy();
  });

  it("changes the list from the filter menu", async () => {
    await mount();
    fireEvent.click(screen.getByRole("button", { name: "Filter issues" }));
    const status = await screen.findByText("Status");
    expect(screen.queryByText("Priority")).toBeNull();
    fireEvent.click(status);
    const done = (await screen.findAllByText("Done")).find(
      (element) => element.closest("[data-slot=menu-item]") !== null,
    );
    fireEvent.click(done as HTMLElement);
    const labels = () =>
      [...document.querySelectorAll("[data-slot=collapsible-trigger]")].map(
        (element) => element.textContent,
      );
    await waitFor(() => expect(labels()).toEqual(["Done1"]));
  });
});
