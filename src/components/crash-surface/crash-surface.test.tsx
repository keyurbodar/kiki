import { RegistryProvider } from "@effect/atom-react";
import {
  type AnyRouter,
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
import { afterEach, describe, expect, it, vi } from "vitest";
import { routeTree } from "@/routeTree.gen";
import { CrashSurface } from "./crash-surface";

afterEach(cleanup);

async function renderRouter(router: AnyRouter) {
  await router.load();
  render(
    <RegistryProvider>
      <RouterProvider router={router} />
    </RegistryProvider>,
  );
}

describe("unknown routes", () => {
  it("render the 404 card with a way back", async () => {
    await renderRouter(
      createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: ["/no/such/page"] }),
      }),
    );
    expect(
      await screen.findByRole("heading", { name: "404 Page not found" }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "This page doesn't exist, or you don't have access to it. If someone sent you this link, ask them to share it with you.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Back to Capy" }).getAttribute("href"),
    ).toBe("/new");
  });
});

describe("CrashSurface", () => {
  function crashingRouter(onRender: () => void) {
    const rootRoute = createRootRoute();
    const page = createRoute({
      getParentRoute: () => rootRoute,
      path: "/",
      component: () => {
        onRender();
        return <p>Recovered</p>;
      },
    });
    return createRouter({
      routeTree: rootRoute.addChildren([page]),
      history: createMemoryHistory({ initialEntries: ["/?token=secret"] }),
      defaultErrorComponent: CrashSurface,
    });
  }

  it("shows the crash card, copies the report and retries once in place", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    window.history.replaceState(null, "", "/?token=secret");
    let crash = true;
    await renderRouter(
      crashingRouter(() => {
        if (crash) throw new Error("render exploded");
      }),
    );
    expect(
      await screen.findByRole("heading", { name: "Something went wrong" }),
    ).toBeTruthy();
    expect(
      screen.getByText(/This page stopped rendering\. Reload to continue/),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "support@capy.ai" })
        .getAttribute("href"),
    ).toBe("mailto:support@capy.ai");
    expect(screen.queryByRole("button", { name: "Export logs" })).toBeNull();
    const report = document.querySelector("pre")?.textContent ?? "";
    expect(report).toContain("Route: /?token=[redacted]");
    expect(report).toContain("render exploded");

    fireEvent.click(screen.getByRole("button", { name: "Copy report" }));
    expect(await screen.findByRole("button", { name: "Copied" })).toBeTruthy();
    expect(writeText).toHaveBeenCalledWith(report);

    crash = false;
    fireEvent.click(screen.getByRole("button", { name: "Reload Capy" }));
    await waitFor(() => expect(screen.getByText("Recovered")).toBeTruthy());
  });
});
