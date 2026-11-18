import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { subscribeCommandPaletteOpen } from "@/lib/command-palette-events";
import { AppSidebar, type AppSidebarProps } from "./app-sidebar";

afterEach(cleanup);

async function renderSidebar(props: AppSidebarProps = {}, path = "/new") {
  const rootRoute = createRootRoute({
    component: () => <AppSidebar {...props} />,
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  await router.load();
  return render(<RouterProvider router={router} />);
}

describe("AppSidebar", () => {
  afterEach(() => window.localStorage.clear());

  it("renders header actions and the footer page bar", async () => {
    await renderSidebar();
    expect(screen.getByRole("button", { name: "Search" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Close sidebar" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "New thread" }).getAttribute("href"),
    ).toBe("/new");
    const bar = screen.getByRole("navigation", { name: "Main" });
    expect(
      [...bar.querySelectorAll("[data-bar-page]")].map((page) =>
        page.getAttribute("data-bar-page"),
      ),
    ).toEqual([
      "threads",
      "issues",
      "pullRequests",
      "automations",
      "explore",
      "volumes",
    ]);
  });

  it("offers the mode toggle only in the split layout", async () => {
    const hybrid = await renderSidebar();
    expect(
      hybrid.container.querySelector('[data-slot="sidebar-mode"]'),
    ).toBeNull();
    cleanup();
    window.localStorage.setItem("capy-web:sidebar-layout", '"split"');
    const split = await renderSidebar();
    expect(
      split.container.querySelector('[data-slot="sidebar-mode"]'),
    ).not.toBeNull();
  });

  it("moves the page bar above the lists when Pages at top is on", async () => {
    const slot = <div data-testid="threads" />;
    const bottom = await renderSidebar({ threadsSlot: slot });
    expect(bottom.container.querySelector("footer nav")).not.toBeNull();
    cleanup();
    window.localStorage.setItem("capy-web:pages-at-top", "true");
    const top = await renderSidebar({ threadsSlot: slot });
    expect(top.container.querySelector("footer nav")).toBeNull();
    const bar = screen.getByRole("navigation", { name: "Main" });
    const threads = screen.getByTestId("threads");
    expect(
      bar.compareDocumentPosition(threads) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0);
  });

  it("shows the Capy mark as Home without the mode toggle", async () => {
    const { container } = await renderSidebar({ showModeToggle: false });
    expect(container.querySelector('[data-slot="sidebar-mode"]')).toBeNull();
    expect(
      screen.getByRole("link", { name: "Home" }).getAttribute("href"),
    ).toBe("/new");
  });

  it("opens the command palette from Search", async () => {
    const handler = vi.fn();
    const unsubscribe = subscribeCommandPaletteOpen(handler);
    await renderSidebar();
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    unsubscribe();
    expect(handler).toHaveBeenCalledWith({ intent: null });
  });

  it("marks the bar link for the current route", async () => {
    await renderSidebar({}, "/issues/ACME-1");
    expect(
      screen
        .getByRole("link", { name: "Issues" })
        .hasAttribute("data-selected"),
    ).toBe(true);
    expect(
      screen
        .getByRole("link", { name: "Threads" })
        .hasAttribute("data-selected"),
    ).toBe(false);
  });

  it("pins the header icon buttons to the control square", async () => {
    await renderSidebar();
    for (const name of ["Search", "Close sidebar"]) {
      const className = screen.getByRole("button", { name }).className;
      expect(className).toContain("size-(--h-control-sm)");
      expect(className).not.toContain("w-fit");
      expect(className).not.toContain("w-(--h-control-sm)!");
    }
    const newThread = screen.getByRole("link", { name: "New thread" });
    expect(newThread.className).toContain("size-(--h-control-sm)");
    expect(newThread.className).not.toContain("w-fit");
  });

  it("keeps the footer account trigger on one line", async () => {
    const { container } = await renderSidebar();
    const account = container.querySelector("footer > div > button");
    expect(account?.querySelectorAll("img, [role='img']")).toHaveLength(1);
  });

  it("puts hidden pages behind More", async () => {
    await renderSidebar({
      nav: { defaultValue: [{ item: "explore", hidden: true }] },
    });
    expect(screen.queryByRole("link", { name: "Explore" })).toBeNull();
    expect(screen.getByRole("button", { name: "More" })).toBeTruthy();
  });
});
