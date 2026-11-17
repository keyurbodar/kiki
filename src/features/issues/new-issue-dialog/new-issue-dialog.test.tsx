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
import { afterEach, describe, expect, it, vi } from "vitest";
import type { IssueDetail } from "@/data/api/schemas/issue";
import { NewIssueDialog } from "./new-issue-dialog";

afterEach(cleanup);

async function renderDialog() {
  const onOpenChange = vi.fn();
  const onCreated = vi.fn<(detail: IssueDetail) => void>();
  const rootRoute = createRootRoute({
    component: () => (
      <NewIssueDialog open onOpenChange={onOpenChange} onCreated={onCreated} />
    ),
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  await router.load();
  render(
    <RegistryProvider>
      <RouterProvider router={router} />
    </RegistryProvider>,
  );
  return { onOpenChange, onCreated };
}

describe("NewIssueDialog", () => {
  it("renders Capy's layout with create disabled until there is a title", async () => {
    await renderDialog();
    expect(await screen.findByText("New issue")).toBeTruthy();
    for (const name of [
      "Status",
      "Priority",
      "Assignees",
      "Due date",
      "Labels",
      /^Access: Everyone/,
    ]) {
      expect(screen.getByRole("button", { name })).toBeTruthy();
    }
    const create = screen.getByRole("button", { name: "Create issue" });
    expect((create as HTMLButtonElement).disabled).toBe(true);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Project" }).textContent,
      ).not.toBe("No project"),
    );
    fireEvent.change(screen.getByLabelText("Issue title"), {
      target: { value: "Fix the flaky login test" },
    });
    expect((create as HTMLButtonElement).disabled).toBe(false);
  });

  it("creates the issue through the mock API, then closes", async () => {
    const { onOpenChange, onCreated } = await renderDialog();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Project" }).textContent,
      ).not.toBe("No project"),
    );
    fireEvent.change(screen.getByLabelText("Issue title"), {
      target: { value: "  Fix the flaky login test " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create issue" }));
    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onCreated.mock.calls[0]?.[0].issue.title).toBe(
      "Fix the flaky login test",
    );
  });
});
