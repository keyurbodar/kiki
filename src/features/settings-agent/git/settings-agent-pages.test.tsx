import { RegistryProvider } from "@effect/atom-react";
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { sampleFeedbackSettings } from "@/data/mocks/feedback-settings/fixtures";
import { routeTree } from "@/routeTree.gen";

afterEach(cleanup);

async function renderAt(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  await router.load();
  render(
    <RegistryProvider>
      <RouterProvider router={router} />
    </RegistryProvider>,
  );
  return router;
}

describe("/settings/threads", () => {
  it("renders the personal thread settings", async () => {
    await renderAt("/settings/threads");
    expect(
      await screen.findByRole("heading", { name: "Threads", level: 1 }),
    ).toBeTruthy();
    expect(await screen.findByText("Title instructions")).toBeTruthy();
    expect(screen.getByText("Regenerate the title when")).toBeTruthy();
    expect(screen.getByText("Archive idle threads")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Concurrent subagents" }).textContent,
    ).toContain("8");
    expect(
      screen.getByRole("button", { name: "Nested subagent depth" }).textContent,
    ).toContain("3");
  });

  it("switches to the organization scope", async () => {
    await renderAt("/settings/threads");
    fireEvent.click(await screen.findByRole("button", { name: "Org" }));
    expect(
      await screen.findByText(
        "How far any thread in the organization can fan out; personal overrides win",
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Org" }).getAttribute("aria-pressed"),
    ).toBe("true");
  });
});

describe("/settings/git", () => {
  it("renders Git and pull request settings from the mocks", async () => {
    await renderAt("/settings/git");
    expect(
      await screen.findByRole("heading", {
        name: "Git & pull requests",
        level: 1,
      }),
    ).toBeTruthy();
    expect(await screen.findByText("You, Capy co-author")).toBeTruthy();
    expect(
      (screen.getByLabelText("Branch prefix") as HTMLInputElement).value,
    ).toBe("capy");
    expect(await screen.findByText("Open pull requests as")).toBeTruthy();
    for (const login of sampleFeedbackSettings.botAllowlist)
      expect(screen.getByText(login)).toBeTruthy();
  });

  it("opens on the Org scope for the org default model link", async () => {
    await renderAt("/settings/git#org-default-model");
    expect(
      await screen.findByText(
        "Organization default for all members; personal overrides win",
      ),
    ).toBeTruthy();
  });
});
