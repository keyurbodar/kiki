import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { OverviewData, OverviewSurfaces } from "./model";
import { OverviewBody } from "./overview-pane";

const noop = () => undefined;
const surfaces: OverviewSurfaces = {
  repos: [],
  turns: [],
  machine: null,
  sessions: undefined,
};
const empty: OverviewData = {
  jamId: "t1",
  tasks: [],
  todos: null,
  pulls: [],
  localPulls: [],
  ports: [],
  models: [],
};

describe("OverviewBody", () => {
  it("renders the sail illustration and surface rows when empty", () => {
    render(
      <OverviewBody
        data={empty}
        surfaces={surfaces}
        onOpenTab={noop}
        onOpenTask={noop}
        onOpenSideThread={noop}
        onOpenPr={noop}
        onOpenNewTab={noop}
        onCopyUrl={noop}
        onRemoveLocalPull={noop}
        sort="updated"
        onSort={noop}
      />,
    );
    expect(screen.getByAltText("Overview is empty")).toBeTruthy();
    expect(screen.getByText("Diffs")).toBeTruthy();
    expect(screen.getByText("Files")).toBeTruthy();
    expect(screen.getByText("No changes yet")).toBeTruthy();
  });

  it("renders task and pull sections with sample data", () => {
    render(
      <OverviewBody
        data={{
          ...empty,
          tasks: [
            {
              id: "jam_1",
              parentJamId: "t1",
              relationType: "task",
              localIndex: 1,
              title: "Sample subagent",
              status: "idle",
              modelId: null,
              machine: null,
              createdAt: new Date("2026-11-17T10:00:00Z"),
              lastActivityAt: null,
            },
          ],
          pulls: [
            {
              id: "p1",
              jamId: null,
              threadId: "t1",
              number: 7,
              url: "https://example.com/acme/web/pull/7",
              repo: "acme/web",
              title: "Sample pull",
              state: "ready",
              baseRef: "main",
              headRef: "feature",
              additions: 3,
              deletions: 1,
              createdAt: new Date("2026-11-17T10:00:00Z"),
            },
          ],
        }}
        surfaces={surfaces}
        onOpenTab={noop}
        onOpenTask={noop}
        onOpenSideThread={noop}
        onOpenPr={noop}
        onOpenNewTab={noop}
        onCopyUrl={noop}
        onRemoveLocalPull={noop}
        sort="updated"
        onSort={noop}
      />,
    );
    expect(screen.getByText("Sample subagent")).toBeTruthy();
    expect(screen.getByText("Sample pull")).toBeTruthy();
    expect(screen.getByText("Subagents")).toBeTruthy();
    expect(screen.getByText("Pull requests")).toBeTruthy();
  });
});
