import { RegistryProvider } from "@effect/atom-react";
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Toaster } from "@/primitives/toaster";
import { routeTree } from "@/routeTree.gen";

afterEach(cleanup);

async function renderProjects() {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/settings/projects"] }),
  });
  await router.load();
  render(
    <RegistryProvider>
      <RouterProvider router={router} />
      <Toaster />
    </RegistryProvider>,
  );
}

async function openDialog() {
  fireEvent.click(await screen.findByRole("button", { name: "New project" }));
  return screen.findByRole("dialog");
}

/** Every label a row's button ever held, so a transient "Creating" is visible. */
function watchButtonLabels(dialog: HTMLElement) {
  const labels: string[] = [];
  const record = () => {
    for (const button of dialog.querySelectorAll("button")) {
      const label = button.textContent?.trim() ?? "";
      if (label !== "" && !labels.includes(label)) labels.push(label);
    }
  };
  record();
  const observer = new MutationObserver(record);
  observer.observe(dialog, {
    childList: true,
    characterData: true,
    subtree: true,
  });
  return { labels, stop: () => observer.disconnect() };
}

describe("create project dialog", () => {
  it("opens from New project and lists only repositories without a project", async () => {
    await renderProjects();
    const dialog = await openDialog();
    const rows = within(dialog);

    expect(await rows.findByText("keyurbodar/xin")).toBeTruthy();
    expect(rows.getByText("acme/legacy-site")).toBeTruthy();
    for (const pushed of rows.getAllByText(/^pushed /)) {
      expect(pushed.textContent).toMatch(/^pushed \d+\w+ ago$/);
    }
    expect(rows.queryByText("acme/web")).toBeNull();
    expect(rows.queryByText("acme/shared")).toBeNull();
    expect(
      rows.getAllByRole("button", { name: "Create project" }),
    ).toHaveLength(2);
  });

  it("creates one project from a repository row and the list picks it up", async () => {
    await renderProjects();
    const dialog = await openDialog();
    const rows = within(dialog);
    const row = (await rows.findByText("keyurbodar/xin")).closest("li");
    expect(row).not.toBeNull();
    const watched = watchButtonLabels(dialog);

    fireEvent.click(
      within(row as HTMLElement).getByRole("button", {
        name: "Create project",
      }),
    );

    expect(await screen.findByText("Project created")).toBeTruthy();
    watched.stop();
    expect(watched.labels).toContain("Creating");
    await waitFor(() =>
      expect(within(dialog).queryByText("keyurbodar/xin")).toBeNull(),
    );
    expect(within(dialog).queryByText("acme/legacy-site")).toBeTruthy();

    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(await screen.findByRole("link", { name: "xin" })).toBeTruthy();
  });
});
