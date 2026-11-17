import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { UserMenu } from "./user-menu";

afterEach(cleanup);

const renderMenu = (compact: boolean) => {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <UserMenu compact={compact} />,
    }),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return render(<RouterProvider router={router} />);
};

it("lists Capy's user menu items in order", async () => {
  renderMenu(false);
  fireEvent.click(await screen.findByRole("button"));
  expect(await screen.findByText("Settings")).toBeTruthy();
  const items = screen
    .getAllByRole("menuitem")
    .map((item) => item.textContent?.replace(/Ctrl\+,|\u2318,/, "").trim());
  expect(items).toEqual([
    "Settings",
    "Usage",
    "Refer a friend",
    "Appearance",
    "Support",
    "Switch organization",
    "Log out",
  ]);
});

it("names the compact trigger after the user", async () => {
  renderMenu(true);
  const trigger = await screen.findByRole("button", { name: /\S/ });
  expect(trigger.textContent).toMatch(/^[A-Z]{1,2}$/);
});
