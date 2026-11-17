import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ProjectEnvironmentHint,
  type ProjectEnvironmentHintProps,
  type ProjectEnvironmentState,
} from "./project-environment-hint";

afterEach(cleanup);

const project = {
  id: "proj_sample_web",
  repos: [{ repoFullName: "acme/web" }],
};

const resolved = (
  state: Partial<ProjectEnvironmentState>,
): ProjectEnvironmentState => ({
  activeVersionId: null,
  building: false,
  hasArtifact: false,
  configured: false,
  enabled: false,
  ...state,
});

async function renderHint(props: ProjectEnvironmentHintProps) {
  const root = createRootRoute({
    component: () => <ProjectEnvironmentHint {...props} />,
  });
  const devEnvironment = createRoute({
    getParentRoute: () => root,
    path: "/settings/projects/$projectId/dev-environment",
  });
  const router = createRouter({
    routeTree: root.addChildren([devEnvironment]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  await router.load();
  return render(<RouterProvider router={router} />);
}

describe("ProjectEnvironmentHint", () => {
  it("stays out of the row without a project or a repository", async () => {
    const { container } = await renderHint({
      state: resolved({ activeVersionId: null }),
    });
    expect(container.querySelector("button")).toBeNull();
    cleanup();
    const withoutRepos = await renderHint({
      project: { id: "proj_sample_api", repos: [] },
      state: resolved({ activeVersionId: null }),
    });
    expect(withoutRepos.container.querySelector("button")).toBeNull();
  });

  it.each([
    ["unknown", undefined],
    ["building", resolved({ building: true })],
    ["built as an artifact", resolved({ hasArtifact: true })],
    ["configured but disabled", resolved({ configured: true, enabled: false })],
  ])("hides while the environment is %s", async (_label, state) => {
    const { container } = await renderHint({ project, state });
    expect(container.querySelector("button")).toBeNull();
  });

  it("asks Capy to set up an environment with no version yet", async () => {
    const onSetUp = vi.fn();
    await renderHint({ project, state: resolved({}), onSetUp });
    fireEvent.click(screen.getByRole("button", { name: "Ask Capy to set up" }));
    expect(onSetUp).toHaveBeenCalledWith(project);
  });

  it("links to the snapshot once the environment has a version", async () => {
    await renderHint({
      project,
      state: resolved({ activeVersionId: "env_1" }),
    });
    expect(
      screen.getByRole("link", { name: "Build snapshot" }).getAttribute("href"),
    ).toBe("/settings/projects/proj_sample_web/dev-environment");
  });
});
