import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildElapsedMs,
  buildStatusLabel,
  formatElapsed,
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
});
