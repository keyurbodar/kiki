import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { pullRepoName, pullRouteParams } from "./issue-pulls";
import {
  groupPullStates,
  IssuePullStateCounts,
  pullDisplayState,
} from "./pull-state";

afterEach(cleanup);

describe("issue pulls", () => {
  it("splits repo names into route params", () => {
    expect(pullRouteParams("acme/web", 128)).toEqual({
      owner: "acme",
      repo: "web",
      prNumber: "128",
    });
    expect(pullRepoName("acme/web")).toBe("web");
    expect(pullRepoName("web")).toBe("web");
  });

  it("shows open PRs by their checks, pending until known", () => {
    expect(pullDisplayState({ state: "open" }, undefined)).toBe("pending");
    expect(pullDisplayState({ state: "open" }, "failed")).toBe("failed");
    expect(pullDisplayState({ state: "merged" }, undefined)).toBe("merged");
  });

  it("groups states and lists failing before merged", () => {
    const groups = groupPullStates([
      { state: "merged" },
      { state: "failed" },
      { state: "merged" },
    ]);
    expect(groups).toEqual([
      { state: "merged", count: 2 },
      { state: "failed", count: 1 },
    ]);
    const { container } = render(<IssuePullStateCounts groups={groups} />);
    const titles = [...container.querySelectorAll("[title]")].map((node) =>
      node.getAttribute("title"),
    );
    expect(titles).toEqual(["1 failing", "2 merged"]);
  });
});
