import { RegistryContext } from "@effect/atom-react";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AtomRegistry } from "effect/reactivity";
import { afterEach, describe, expect, it, vi } from "vitest";
import { threads } from "@/data/mocks/fixtures/world";
import { ToolRefs } from "./tool-refs";

afterEach(cleanup);

const renderRefs = async (args: unknown) => {
  const registry = AtomRegistry.make();
  const root = createRootRoute({
    component: () => (
      <span>
        <ToolRefs args={args} />
      </span>
    ),
  });
  const router = createRouter({
    routeTree: root,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  const { container } = render(
    <RegistryContext.Provider value={registry}>
      <RouterProvider router={router} />
    </RegistryContext.Provider>,
  );
  await router.load();
  return container;
};

describe("ToolRefs", () => {
  it("links a call's thread reference to that thread, titled", async () => {
    const container = await renderRefs({
      params: { jamId: threads.darkMode.id },
    });
    const chip = await screen.findByRole("link", {
      name: new RegExp(threads.darkMode.title),
    });
    expect(chip.getAttribute("href")).toBe(`/thread/${threads.darkMode.id}`);
    expect(chip.textContent).toBe(threads.darkMode.title);
    expect(chip.getAttribute("data-slot")).toBe("tool-thread-ref");
    expect(container.querySelector('[data-slot="tool-refs"]')).not.toBeNull();
  });

  it("keeps the chip's click out of the row it sits in", async () => {
    await renderRefs({ jamId: threads.darkMode.id });
    const chip = await screen.findByRole("link", {
      name: new RegExp(threads.darkMode.title),
    });
    const rowSaw = vi.fn();
    document.body.addEventListener("click", rowSaw);
    fireEvent.click(chip);
    document.body.removeEventListener("click", rowSaw);
    expect(rowSaw).not.toHaveBeenCalled();
  });

  it("names the id when the thread is not in the list", async () => {
    const container = await renderRefs({ threadId: "jam_sample_missing" });
    const chip = container.querySelector('[data-slot="tool-thread-ref"]');
    expect(chip?.getAttribute("href")).toBe("/thread/jam_sample_missing");
    expect(chip?.textContent).toBe("jam_sample_missing");
  });

  it("renders nothing at all for a call that names no reference", async () => {
    const container = await renderRefs({ command: "bun test" });
    expect(container.querySelector('[data-slot="tool-refs"]')).toBeNull();
    expect(container.querySelectorAll("a")).toHaveLength(0);
    expect(container.textContent).toBe("");
  });

  it("links a pull named by its github url", async () => {
    const container = await renderRefs({
      url: "https://github.com/acme/web/pull/128",
    });
    const chip = container.querySelector("a");
    expect(chip?.getAttribute("href")).toBe("/pull/acme/web/128");
    expect(chip?.textContent).toBe("#128");
  });

  it("links a pull named by a repo and a number", async () => {
    const container = await renderRefs({ repo: "acme/web", number: 128 });
    expect(container.querySelector("a")?.getAttribute("href")).toBe(
      "/pull/acme/web/128",
    );
  });

  it("draws the thread chip and the pull chip together", async () => {
    const container = await renderRefs({
      jamId: threads.darkMode.id,
      pull: { repoFullName: "acme/web", prNumber: 128 },
    });
    await screen.findByRole("link", {
      name: new RegExp(threads.darkMode.title),
    });
    expect(container.querySelectorAll("a")).toHaveLength(2);
  });
});
