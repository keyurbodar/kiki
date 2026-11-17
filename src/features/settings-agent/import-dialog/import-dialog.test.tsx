import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createImportJobStore,
  ImportJobContext,
} from "@/components/import-job-indicator";
import { ImportDialog } from "./import-dialog";
import type { ImportBridge, ImportManifest } from "./import-model";

afterEach(cleanup);

const manifest: ImportManifest = {
  versions: { claude: "2.1.0", codex: null },
  projects: [{ id: "project_web", name: "Acme Web", repos: ["acme/web"] }],
  sessions: [
    {
      source: "claude-code",
      sessionId: "s1",
      title: "Fix login form",
      endedAt: "2026-01-05T10:00:00.000Z",
      cwd: "/home/alex/acme/web",
      repos: ["acme/web"],
      projectId: "project_web",
      via: "linked",
      imported: false,
      updatable: false,
    },
    {
      source: "claude-code",
      sessionId: "s2",
      title: "Write release notes",
      endedAt: "2026-01-06T10:00:00.000Z",
      cwd: "/home/alex/acme/web",
      repos: ["acme/web"],
      projectId: "project_web",
      via: "linked",
      imported: false,
      updatable: false,
    },
  ],
};

const bridge = (result: ImportManifest): ImportBridge => ({
  manifest: vi.fn(async () => ({ ok: true as const, manifest: result })),
  run: vi.fn(async () => ({ ok: true as const })),
  subscribeProgress: () => () => {},
});

const renderDialog = (props: Partial<Parameters<typeof ImportDialog>[0]>) =>
  render(
    <ImportJobContext value={createImportJobStore()}>
      <ImportDialog
        open
        onOpenChange={() => {}}
        source="claude-code"
        orgId="org_acme"
        userId="user_alex"
        {...props}
      />
    </ImportJobContext>,
  );

describe("ImportDialog", () => {
  it("asks for the desktop app without a bridge", () => {
    renderDialog({});
    expect(
      screen.getByText("Importing runs in the Capy desktop app"),
    ).toBeTruthy();
  });

  it("says there is nothing to import when no sessions are found", async () => {
    renderDialog({
      bridge: bridge({ ...manifest, sessions: [] }),
    });
    await screen.findByText(/No Claude Code sessions on this/);
    expect(screen.getByText("Nothing to import")).toBeTruthy();
  });

  it("loads sessions, preselects them and clears with the group checkbox", async () => {
    const source = bridge(manifest);
    renderDialog({ bridge: source });
    expect(source.manifest).toHaveBeenCalledWith("org_acme");
    await screen.findByText("2 selected");
    expect(screen.getByText("Select Claude Code sessions")).toBeTruthy();
    expect(
      screen.getByText(/2 sessions from Claude Code 2.1.0 on this/),
    ).toBeTruthy();
    expect(screen.getByText("Repositories")).toBeTruthy();
    fireEvent.click(screen.getByRole("checkbox", { name: "Select acme/web" }));
    await screen.findByText("Nothing to import");
    expect(
      (screen.getByRole("button", { name: "Next" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("moves to project mapping and starts the import", async () => {
    const source = bridge(manifest);
    renderDialog({ bridge: source, deviceId: "device_1" });
    await screen.findByText("2 selected");
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("Map projects");
    expect(
      screen.getByRole("button", { name: "Import destination for Acme Web" })
        .textContent,
    ).toBe("Acme Web");
    fireEvent.click(screen.getByRole("button", { name: "Import" }));
    await waitFor(() => expect(source.run).toHaveBeenCalledTimes(1));
    expect(source.run).toHaveBeenCalledWith({
      orgId: "org_acme",
      userId: "user_alex",
      device: { deviceId: "device_1" },
      placements: [
        {
          source: "claude-code",
          sessionId: "s1",
          projectId: "project_web",
          movedToRepos: undefined,
        },
        {
          source: "claude-code",
          sessionId: "s2",
          projectId: "project_web",
          movedToRepos: undefined,
        },
      ],
    });
  });
});
