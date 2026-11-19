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
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  ProjectSetup,
  ProjectSnapshotConfig,
} from "@/data/api/schemas/project-settings";
import { routeTree } from "@/routeTree.gen";
import { projectEnvironmentState, showsWelcome } from "./home-page";

afterEach(cleanup);

async function renderHome(path = "/new") {
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

const composerSlot = () => document.querySelector("[data-slot=composer]");

/** The composer menu's Folder row, whose trailing value names the folder it picked. */
const folderRow = () =>
  [...document.querySelectorAll("[data-slot=menu-row]")].find((item) =>
    (item.textContent ?? "").startsWith("Folder"),
  );

describe("showsWelcome", () => {
  it("welcomes an org with nothing to start from", () => {
    expect(showsWelcome(undefined, [])).toBe(true);
  });

  it("stays out of the way of a draft or a project list", () => {
    expect(showsWelcome("Ship it", [])).toBe(false);
    expect(showsWelcome(undefined, [{ id: "proj_sample_web" }])).toBe(false);
  });
});

const setup = (activeVersionId: string | null) =>
  new ProjectSetup({
    machineSize: "large",
    hooks: null,
    repositories: [],
    activeVersionId,
    versionNumber: activeVersionId === null ? null : 3,
  });

const snapshot = (
  state: Partial<{
    configured: boolean;
    enabled: boolean;
    building: boolean;
    hasArtifact: boolean;
  }>,
) =>
  new ProjectSnapshotConfig({
    configured: false,
    enabled: false,
    building: false,
    buildSmallerTiers: false,
    repos: [],
    estimate: null,
    hasArtifact: false,
    tiers: [],
    freezeFailure: null,
    ...state,
  });

describe("projectEnvironmentState", () => {
  it("stays unknown until both the setup and the snapshot have arrived", () => {
    expect(projectEnvironmentState(undefined, undefined)).toBeUndefined();
    expect(projectEnvironmentState(setup(null), undefined)).toBeUndefined();
    expect(projectEnvironmentState(undefined, snapshot({}))).toBeUndefined();
  });

  it("carries the setup version and the snapshot's build state", () => {
    expect(projectEnvironmentState(setup(null), snapshot({}))).toEqual({
      activeVersionId: null,
      building: false,
      hasArtifact: false,
      configured: false,
      enabled: false,
    });
    expect(
      projectEnvironmentState(
        setup("setupver_1"),
        snapshot({ configured: true, enabled: true, hasArtifact: true }),
      ),
    ).toEqual({
      activeVersionId: "setupver_1",
      building: false,
      hasArtifact: true,
      configured: true,
      enabled: true,
    });
  });
});

describe("/new", () => {
  it("centers the composer without the welcome once the org has projects", async () => {
    await renderHome();
    await waitFor(() => expect(composerSlot()).not.toBeNull());
    expect(screen.queryByRole("button", { name: "Web app" })).toBeNull();
  });

  it("puts the project, run-on and repo-branch selects above the composer", async () => {
    await renderHome();
    await waitFor(() => expect(composerSlot()).not.toBeNull());
    const row = document.querySelector(
      "[data-slot=composer]",
    )?.previousElementSibling;
    expect(row?.querySelector("[data-slot=project-select]")).not.toBeNull();
    expect(row?.querySelector("[data-slot=run-on-select]")).not.toBeNull();
    expect(row?.querySelector("[data-slot=repo-branch-select]")).not.toBeNull();
  });

  it("gives the composer its model picker and the /new placeholder", async () => {
    await renderHome();
    await waitFor(() => expect(composerSlot()).not.toBeNull());
    expect(screen.getByRole("button", { name: "Model" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add to message" })).toBeTruthy();
    expect(screen.getByText(", / for commands, @ for context")).toBeTruthy();
  });

  it("opens the create-project dialog from the Project menu", async () => {
    await renderHome();
    await waitFor(() => expect(composerSlot()).not.toBeNull());
    const trigger = document
      .querySelector("[data-slot=project-select]")
      ?.querySelector("button");
    expect(trigger).not.toBeNull();
    fireEvent.click(trigger as HTMLButtonElement);
    fireEvent.click(await screen.findByText("New project"));
    await waitFor(() =>
      expect(document.querySelector("[role=dialog]")).not.toBeNull(),
    );
  });

  it("keeps the welcome out of a prompted visit", async () => {
    await renderHome("/new?prompt=Summarise%20the%20release");
    await waitFor(() => expect(composerSlot()).not.toBeNull());
    expect(screen.queryByRole("button", { name: "Add project" })).toBeNull();
  });

  it("starts the draft in the folder the sidebar's peek picked", async () => {
    await renderHome("/new?folder=fld_sample_release");
    await waitFor(() => expect(composerSlot()).not.toBeNull());
    fireEvent.click(
      await screen.findByRole("button", { name: "Thread configuration" }),
    );
    await waitFor(() => expect(folderRow()?.textContent).toBe("FolderRelease"));
  });

  it("leaves the folder empty on a visit that picked none", async () => {
    await renderHome();
    await waitFor(() => expect(composerSlot()).not.toBeNull());
    fireEvent.click(
      await screen.findByRole("button", { name: "Thread configuration" }),
    );
    await waitFor(() => expect(folderRow()?.textContent).toBe("Folder"));
  });

  it("mounts the fabric layer ahead of the wallpaper backdrop", async () => {
    await renderHome();
    await waitFor(() => expect(composerSlot()).not.toBeNull());
    const layer = document.querySelector(".pointer-events-none.fixed.inset-0");
    expect(layer).not.toBeNull();
    expect(layer?.querySelector(".bg-panel")).not.toBeNull();
  });
});
