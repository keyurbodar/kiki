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
  it("renders the mode toggle, header actions and the footer page bar", async () => {
    const { container } = await renderSidebar();
    expect(
      container.querySelector('[data-slot="sidebar-mode"]'),
    ).not.toBeNull();
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
    expect(account?.textContent).toMatch(/^[A-Z]{1,2}$/);
  });

  it("puts hidden pages behind More", async () => {
    await renderSidebar({
      nav: { defaultValue: [{ item: "explore", hidden: true }] },
    });
    expect(screen.queryByRole("link", { name: "Explore" })).toBeNull();
    expect(screen.getByRole("button", { name: "More" })).toBeTruthy();
  });
});
