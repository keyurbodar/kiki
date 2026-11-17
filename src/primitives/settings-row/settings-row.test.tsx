import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SettingsRow, SettingsRowLink } from "./settings-row";

afterEach(cleanup);

it("renders label, description and control in Capy's slots", () => {
  render(
    <SettingsRow label="Sidebar" description="Choose pages" icon={<svg />}>
      <button type="button">Pages</button>
    </SettingsRow>,
  );
  const row = screen.getByText("Sidebar").closest("[data-slot=settings-row]");
  expect(row?.className).toContain("min-h-15");
  expect(screen.getByText("Choose pages").className).toContain("text-xs");
  expect(screen.getByText("Choose pages").className).toContain(
    "text-muted-foreground-2",
  );
});

it("makes the whole row clickable through the label button", () => {
  const onClick = vi.fn();
  render(
    <SettingsRow label="Open" onClick={onClick} descriptionTone="strong" />,
  );
  screen.getByRole("button", { name: "Open" }).click();
  expect(onClick).toHaveBeenCalledOnce();
});

it("renders SettingsRowLink as a router link with the sprite chevron", async () => {
  const rootRoute = createRootRoute({
    component: () => (
      <SettingsRowLink
        to="/"
        label="Billing"
        description="Plans"
        chevron="wide"
      />
    ),
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  const link = await screen.findByRole("link");
  expect(link.dataset.slot).toBe("settings-row-link");
  expect(link.getAttribute("href")).toBe("/");
  expect(
    link
      .querySelector('[data-icon="chevron-right-small"]')
      ?.getAttribute("class"),
  ).toContain("max-sm:hidden");
});
