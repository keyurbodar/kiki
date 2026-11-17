import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { routeTree } from "@/routeTree.gen";

afterEach(cleanup);
for (const path of [
  "/sign-in",
  "/sign-up",
  "/sign-in?continue=password&email=a%40b.c",
  "/sign-in?continue=reset-password",
  "/sign-in?continue=backup-code",
]) {
  it(path, async () => {
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: [path] }),
    });
    render(<RouterProvider router={router} />);
    expect(
      (await screen.findByRole("heading", { level: 1 })).textContent,
    ).not.toBe("");
  });
}
