import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ArrowLeftGlyph, ChevronRightSmallGlyph } from "./glyphs";
import {
  buildLabel,
  buildStatusBuckets,
  countCommands,
  countScripts,
  countStartup,
  describeChange,
  failureLabel,
  formatAgo,
  formatDuration,
  hasHiddenBuilds,
  machineSectionCount,
  setupStatus,
  stepMeta,
  threadChanges,
  visibleBuilds,
} from "./logic";
import {
  emptySetup,
  parseSetup,
  parseSnapshotBuilds,
  parseSnapshotConfig,
} from "./parse";
import { BuildsSection, NoProjectSetup, SetupBody } from "./setup-body";

afterEach(cleanup);

const baseSetup = {
  activeVersionId: "ver_1",
  machineSize: "large",
  repositories: [],
};

const emptyProps = {
  projectId: "proj_1",
  setup: baseSetup,
  status: { bucket: "idle" as const, label: "No Setup yet" },
  builds: [],
  changes: [],
  now: Date.parse("2026-01-02T12:00:00Z"),
  onFocusScript: vi.fn(),
  onOpenBuild: vi.fn(),
};

describe("setup status and labels", () => {
  it("prefers machine build state over the snapshot setting", () => {
    expect(setupStatus(null, true, undefined, undefined)).toEqual({
      bucket: "idle",
      label: "No Setup yet",
    });
    expect(
      setupStatus(
        "ver_1",
        true,
        { enabled: true, hasArtifact: false },
        {
          id: "build_1",
          status: "building",
          trigger: null,
          failureReason: null,
          createdAt: new Date(),
          startedAt: new Date(),
          completedAt: null,
        },
      ),
    ).toEqual({ bucket: "active", label: "Snapshot building" });
    const failed = {
      id: "build_2",
      status: "failed" as const,
      trigger: null,
      failureReason: "Setup initialize failed for acme/web: boom",
      createdAt: new Date(),
      startedAt: new Date(),
      completedAt: new Date(),
    };
    expect(setupStatus("ver_1", false, undefined, failed)).toEqual({
      bucket: "attention",
      label: "Last build failed",
    });
    expect(setupStatus("ver_1", false, undefined)).toEqual({
      bucket: "idle",
      label: "Snapshots off",
    });
    expect(
      setupStatus(
        "ver_1",
        true,
        { enabled: true, hasArtifact: false },
        undefined,
      ),
    ).toEqual({ bucket: "idle", label: "Not built yet" });
    expect(
      setupStatus(
        "ver_1",
        true,
        { enabled: true, hasArtifact: true },
        undefined,
      ),
    ).toEqual({ bucket: "review", label: "Snapshot ready" });
  });

  it("uses Capy's build title and failure parsing", () => {
    expect(buildLabel({ status: "building", failureReason: null })).toBe(
      "Running",
    );
    expect(buildLabel({ status: "succeeded", failureReason: null })).toBe(
      "Succeeded",
    );
    expect(failureLabel("Setup initialize failed for acme/web: boom")).toBe(
      "Initialize, acme/web",
    );
    expect(failureLabel("unrelated failure")).toBe("Build failed");
    expect(buildStatusBuckets.cancelled).toBe("idle");
  });

  it("formats durations and relative times with token-free units", () => {
    expect(formatDuration(1_500)).toBe("2s");
    expect(formatDuration(90_000)).toBe("1m 30s");
    expect(
      formatAgo(
        new Date(Date.parse("2026-01-02T11:59:30Z")),
        Date.parse("2026-01-02T12:00:00Z"),
      ),
    ).toBe("30s ago");
    expect(
      stepMeta(
        {
          durationMs: 1_000,
          status: "not_ready",
          startedAt: new Date(Date.parse("2026-01-02T11:59:00Z")),
        },
        Date.parse("2026-01-02T12:00:00Z"),
      ),
    ).toContain("not ready");
  });
});

describe("setup counts and builds", () => {
  it("counts scripts, startup entries and commands across repositories", () => {
    const repo = {
      repository: "acme/web",
      source: null,
      branch: null,
      scripts: { initialize: "echo hi", refresh: null },
      timeouts: {},
      startup: [
        {
          name: "web",
          command: "bun dev",
          icon: null,
          port: 3000,
          timeout: null,
        },
      ],
      commands: [],
    };
    expect(countScripts([repo])).toBe(1);
    expect(countStartup([repo])).toBe(1);
    expect(countCommands([repo])).toBe(0);
  });

  it("slices the first three builds and offers show all", () => {
    const builds = ["a", "b", "c", "d"].map((id) => ({
      id,
      status: "succeeded" as const,
      trigger: null,
      failureReason: null,
      createdAt: new Date(),
      startedAt: new Date(),
      completedAt: new Date(),
    }));
    expect(visibleBuilds(builds, false).map((build) => build.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect(visibleBuilds(builds, true)).toHaveLength(4);
    expect(hasHiddenBuilds(builds, false)).toBe(true);
    expect(hasHiddenBuilds(builds, true)).toBe(false);
  });

  it("filters thread changes to this thread and labels them", () => {
    const changes = threadChanges(
      [
        {
          id: "v1",
          sourceJamId: "jam_1",
          changes: [
            {
              type: "set_script",
              repository: "acme/web",
              phase: "initialize",
              name: null,
            },
          ],
        },
        {
          id: "v2",
          sourceJamId: "jam_2",
          changes: [
            {
              type: "set_command",
              repository: null,
              phase: null,
              name: "lint",
            },
          ],
        },
      ],
      "jam_1",
    );
    expect(changes).toHaveLength(1);
    expect(
      describeChange(
        changes[0]?.change ?? {
          type: "",
          repository: null,
          phase: null,
          name: null,
        },
      ),
    ).toBe("Changed initialize script");
  });

  it("counts machine steps with failed emphasis", () => {
    const step = (status: "success" | "error") => ({
      repoFullName: "acme/web",
      phase: "initialize" as const,
      entry: null,
      status,
      durationMs: null,
      startedAt: null,
      tail: undefined,
    });
    expect(machineSectionCount([step("success")])).toBe("1");
    expect(machineSectionCount([step("error"), step("success")])).toBe(
      "1 failed",
    );
  });
});

describe("defensive parsing", () => {
  it("reads a setup with no repositories as empty", () => {
    expect(parseSetup({})).toEqual(emptySetup);
  });

  it("decodes snapshot builds with a compatible date field", () => {
    const builds = parseSnapshotBuilds({
      builds: [
        {
          id: "build_1",
          status: "succeeded",
          createdAt: "2026-01-02T10:00:00Z",
          finishedAt: "2026-01-02T10:05:00Z",
        },
      ],
    });
    expect(builds[0]?.status).toBe("succeeded");
    expect(builds[0]?.completedAt?.toISOString()).toBe(
      "2026-01-02T10:05:00.000Z",
    );
  });

  it("treats missing booleans as false", () => {
    expect(parseSnapshotConfig({})).toEqual({
      enabled: false,
      hasArtifact: false,
    });
    expect(parseSnapshotConfig({ enabled: true, hasArtifact: true })).toEqual({
      enabled: true,
      hasArtifact: true,
    });
  });
});

describe("SetupBody", () => {
  it("renders the exact empty copy for a project with no Setup", async () => {
    const router = createRouter({
      routeTree: createRootRoute({ component: () => <NoProjectSetup /> }),
      history: createMemoryHistory({ initialEntries: ["/"] }),
    });
    await router.load();
    render(<RouterProvider router={router} />);
    expect(
      screen.getByText(
        "This thread has no project, so there is no Setup to show",
      ),
    ).toBeTruthy();
  });

  it("renders the exact empty copy, loading state and show all control", () => {
    const setupRouter = createRouter({
      routeTree: createRootRoute({ component: () => <SetupBody {...emptyProps} /> }),
      history: createMemoryHistory({ initialEntries: ["/"] }),
    });
    render(<RouterProvider router={setupRouter} />);
    expect(
      screen.getByText(
        "No scripts yet. Add them in project settings or ask Capy.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "No startup entries yet. Add them in project settings or ask Capy.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "No commands yet. Add them in project settings or ask Capy.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("No Setup yet")).toBeTruthy();
    cleanup();
    render(
      <BuildsSection
        builds={undefined}
        now={Date.now()}
        onOpenBuild={vi.fn()}
      />,
    );
    expect(screen.getByText("Loading builds")).toBeTruthy();
    cleanup();
    const builds = [1, 2, 3, 4].map((n) => ({
      id: `b${n}`,
      status: n === 4 ? ("failed" as const) : ("succeeded" as const),
      trigger: null,
      failureReason: null,
      createdAt: new Date(Date.parse("2026-01-02T11:00:00Z")),
      startedAt: new Date(Date.parse("2026-01-02T11:00:00Z")),
      completedAt: new Date(Date.parse("2026-01-02T11:00:05Z")),
    }));
    render(
      <BuildsSection builds={builds} now={Date.now()} onOpenBuild={vi.fn()} />,
    );
    expect(screen.getByText("Builds")).toBeTruthy();
    expect(screen.getByText("4")).toBeTruthy();
  });
});

describe("glyphs", () => {
  it("renders local glyphs with Capy icon names", () => {
    expect(
      render(<ChevronRightSmallGlyph />).container.querySelector(
        '[data-icon="chevron-right-small"]',
      ),
    ).not.toBeNull();
    expect(
      render(<ArrowLeftGlyph />).container.querySelector(
        '[data-icon="arrow-left"]',
      ),
    ).not.toBeNull();
  });
});
