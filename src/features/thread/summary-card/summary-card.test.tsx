import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildElapsedMs,
  buildStatusLabel,
  formatElapsed,
  PortRow,
  type SummaryBuild,
  SummaryCard,
} from "./summary-card";

afterEach(cleanup);

const reference = {
  kind: "pr" as const,
  number: 12,
  url: "https://github.com/acme/web/pull/12",
};

const build = (overrides: Partial<SummaryBuild> = {}): SummaryBuild => ({
  id: "b1",
  status: "building",
  failureReason: null,
  completedAt: null,
  ...overrides,
});

const start = new Date("2026-01-01T00:00:00.000Z");

describe("buildStatusLabel", () => {
  it("labels starting, running and succeeded builds", () => {
    expect(buildStatusLabel(undefined)).toBe("Starting");
    expect(buildStatusLabel(build())).toBe("Running");
    expect(buildStatusLabel(build({ status: "succeeded" }))).toBe("Succeeded");
  });

  it("parses setup failures into a step and repository", () => {
    expect(
      buildStatusLabel(
        build({
          status: "failed",
          failureReason: "Setup initialize failed for acme/web: x",
        }),
      ),
    ).toBe("Initialize, acme/web");
  });

  it("falls back when the failure reason cannot be parsed", () => {
    expect(
      buildStatusLabel(build({ status: "failed", failureReason: "oops" })),
    ).toBe("Build failed");
  });
});

describe("formatElapsed", () => {
  it("formats seconds and minutes", () => {
    expect(formatElapsed(45_400)).toBe("45s");
    expect(formatElapsed(125_400)).toBe("2m 5s");
  });
});

describe("buildElapsedMs", () => {
  it("uses the current time for running builds and completion time for finished builds", () => {
    const completed = new Date(start.getTime() + 30_000);
    expect(
      buildElapsedMs(build({ startedAt: start }), start.getTime() + 15_000),
    ).toBe(15_000);
    expect(
      buildElapsedMs(
        build({
          startedAt: start,
          completedAt: completed,
          status: "succeeded",
        }),
        start.getTime() + 60_000,
      ),
    ).toBe(30_000);
  });

  it("returns undefined when there is no start time", () => {
    expect(buildElapsedMs(build(), 1000)).toBeUndefined();
  });
});

describe("SummaryCard", () => {
  it("renders a pull request row with live data", () => {
    render(
      <SummaryCard
        turn={{
          prs: [reference],
          ports: [],
          automations: [],
          environmentRequests: [],
          setup: [],
        }}
        pullRequests={[
          {
            number: 12,
            repo: "acme/web",
            title: "Thread A",
            state: "merged",
            additions: 5,
            deletions: 2,
          },
        ]}
      />,
    );
    expect(screen.getByText("Merged web#12")).toBeTruthy();
    expect(screen.getByText("+5")).toBeTruthy();
    expect(screen.getByText("-2")).toBeTruthy();
  });

  it("renders nothing without rows", () => {
    const { container } = render(
      <SummaryCard
        turn={{
          prs: [],
          ports: [],
          automations: [],
          environmentRequests: [],
          setup: [],
        }}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("opens the pane when the pull request row is clicked", () => {
    const onOpenPane = vi.fn();
    render(
      <SummaryCard
        turn={{
          prs: [reference],
          ports: [],
          automations: [],
          environmentRequests: [],
          setup: [],
        }}
        onOpenPane={onOpenPane}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /web#12/ }));
    expect(onOpenPane).toHaveBeenCalledWith(reference);
  });

  it("matches live pull requests by repository as well as number", () => {
    const apiReference = {
      kind: "pr" as const,
      number: 12,
      url: "https://github.com/acme/api/pull/12",
    };
    render(
      <SummaryCard
        turn={{
          prs: [reference, apiReference],
          ports: [],
          automations: [],
          environmentRequests: [],
          setup: [],
        }}
        pullRequests={[
          {
            number: 12,
            repo: "acme/web",
            title: "Thread A",
            state: "merged",
            additions: 5,
            deletions: 2,
          },
          {
            number: 12,
            repo: "acme/api",
            title: "Thread B",
            state: "ready",
            additions: 1,
            deletions: 0,
          },
        ]}
      />,
    );
    expect(screen.getByText("Thread A")).toBeTruthy();
    expect(screen.getByText("Thread B")).toBeTruthy();
    expect(screen.getByText("web#12")).toBeTruthy();
    expect(screen.getByText("api#12")).toBeTruthy();
  });

  it("gives automations a row", () => {
    render(
      <SummaryCard
        turn={{
          prs: [],
          ports: [],
          automations: [{ bound: true }],
          environmentRequests: [],
          setup: [],
        }}
      />,
    );
    expect(screen.getByText("Automation")).toBeTruthy();
    expect(screen.getByText("Runs in this thread")).toBeTruthy();
  });

  it("gives environment requests a row", () => {
    render(
      <SummaryCard
        turn={{
          prs: [],
          ports: [],
          automations: [],
          environmentRequests: [{ variables: ["API_KEY"] }],
          setup: [],
        }}
      />,
    );
    expect(screen.getByText("Environment")).toBeTruthy();
  });

  it("gives setup versions a row", () => {
    render(
      <SummaryCard
        turn={{
          prs: [],
          ports: [],
          automations: [],
          environmentRequests: [],
          setup: [{ kind: "version", versionId: "v1", toolCallId: "t1" }],
        }}
        setupVersions={[{ id: "v1", versionNumber: 2 }]}
      />,
    );
    expect(screen.getByText("Setup")).toBeTruthy();
    expect(screen.getByText("Saved")).toBeTruthy();
    expect(screen.getByText("Version 2")).toBeTruthy();
  });

  it("gives snapshot toggles a row", () => {
    render(
      <SummaryCard
        turn={{
          prs: [],
          ports: [],
          automations: [],
          environmentRequests: [],
          setup: [{ kind: "snapshots", enabled: true, toolCallId: "t3" }],
        }}
      />,
    );
    expect(screen.getByText("Snapshots")).toBeTruthy();
    expect(screen.getByText("Enabled")).toBeTruthy();
  });
});

describe("PortRow", () => {
  const port = {
    kind: "port" as const,
    title: "Preview",
    machineId: "machine_a",
    port: 3000,
  };

  it("opens the preview when only onOpen is supplied", () => {
    const onOpen = vi.fn();
    render(
      <PortRow port={port} machineLabel="Primary machine" onOpen={onOpen} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Preview/ }));
    expect(onOpen).toHaveBeenCalled();
  });

  it("opens a new tab when only onOpenNewTab is supplied", () => {
    const onOpenNewTab = vi.fn();
    render(
      <PortRow
        port={port}
        machineLabel="Primary machine"
        onOpenNewTab={onOpenNewTab}
      />,
    );
    const row = screen.getByRole("button", { name: /Preview/ });
    fireEvent.click(row, { metaKey: true });
    expect(onOpenNewTab).toHaveBeenCalledTimes(1);
    fireEvent.click(row);
    expect(onOpenNewTab).toHaveBeenCalledTimes(2);
  });
});
