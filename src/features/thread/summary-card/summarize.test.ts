import { describe, expect, it } from "vitest";
import {
  pullRequestLabel,
  repoNameFromPullUrl,
  type SummaryTurn,
  summarizeTurn,
} from "./summarize";

const pullUrl = "https://github.com/acme/web/pull/12";

const turn = (overrides: Partial<SummaryTurn> = {}): SummaryTurn => ({
  prs: [],
  ports: [],
  automations: [],
  environmentRequests: [],
  setup: [],
  ...overrides,
});

describe("repoNameFromPullUrl", () => {
  it("extracts the repository name from a pull request URL", () => {
    expect(repoNameFromPullUrl(pullUrl)).toBe("web");
    expect(
      repoNameFromPullUrl("https://github.com/acme/api/pull/7/files"),
    ).toBe("api");
  });

  it("returns undefined for a URL that is not a pull request", () => {
    expect(repoNameFromPullUrl("https://github.com/acme/web")).toBeUndefined();
  });
});

describe("pullRequestLabel", () => {
  const reference = { kind: "pr" as const, number: 12, url: pullUrl };

  it("uses the URL without live data", () => {
    expect(pullRequestLabel(reference, undefined)).toBe("web#12");
  });

  it("uses the live repository with live data", () => {
    expect(
      pullRequestLabel(reference, {
        number: 12,
        repo: "acme/web",
        title: "Thread A",
        state: "merged",
        additions: 5,
        deletions: 2,
      }),
    ).toBe("web#12");
  });

  it("falls back to the number when no repository is available", () => {
    expect(pullRequestLabel(reference, undefined)).toBe("web#12");
    expect(
      pullRequestLabel(
        { kind: "pr", number: 12, url: "https://example.com/not-a-pr" },
        undefined,
      ),
    ).toBe("#12");
  });
});

describe("summarizeTurn", () => {
  const pr = { kind: "pr" as const, number: 12, url: pullUrl };
  const live = {
    number: 12,
    repo: "acme/web",
    title: "Thread A",
    state: "merged" as const,
    additions: 5,
    deletions: 2,
  };

  it("summarizes a single pull request without live data", () => {
    expect(summarizeTurn(turn({ prs: [pr] }))).toBe("Opened web#12");
  });

  it("summarizes a single merged pull request with live data", () => {
    expect(summarizeTurn(turn({ prs: [pr] }), [live])).toBe("Merged web#12");
  });

  it("groups multiple pull requests by outcome", () => {
    const opened = {
      kind: "pr" as const,
      number: 14,
      url: "https://github.com/acme/web/pull/14",
    };
    const opened2 = {
      kind: "pr" as const,
      number: 15,
      url: "https://github.com/acme/web/pull/15",
    };
    expect(summarizeTurn(turn({ prs: [pr, opened, opened2] }), [live])).toBe(
      "Merged a pull request and opened 2 pull requests",
    );
  });

  it("matches live pull requests regardless of repository casing", () => {
    const mixedCase = {
      kind: "pr" as const,
      number: 12,
      url: "https://github.com/Acme/Web/pull/12",
    };
    expect(summarizeTurn(turn({ prs: [mixedCase] }), [live])).toBe(
      "Merged web#12",
    );
  });

  it("keys live pull requests by repository as well as number", () => {
    const api = {
      kind: "pr" as const,
      number: 12,
      url: "https://github.com/acme/api/pull/12",
    };
    expect(
      summarizeTurn(turn({ prs: [pr, api] }), [
        live,
        { ...live, repo: "acme/api", title: "Thread B", state: "ready" },
      ]),
    ).toBe("Merged a pull request and opened a pull request");
    expect(
      summarizeTurn(turn({ prs: [api] }), [
        live,
        { ...live, repo: "acme/api", title: "Thread B", state: "merged" },
      ]),
    ).toBe("Merged api#12");
  });

  it("summarizes ports, automations, environment requests and setup references", () => {
    expect(
      summarizeTurn(
        turn({
          ports: [
            {
              kind: "port",
              title: "Preview",
              machineId: "machine_a",
              port: 3000,
            },
          ],
          automations: [{ bound: true }],
          environmentRequests: [{ variables: ["API_KEY"] }],
        }),
      ),
    ).toBe(
      "Exposed a preview, set up an automation that runs in this thread, and requested API_KEY",
    );
  });

  it("names setup versions, builds and snapshots", () => {
    expect(
      summarizeTurn(
        turn({
          setup: [
            { kind: "version", versionId: "v1", toolCallId: "t1" },
            {
              kind: "build",
              buildId: "b1",
              test: true,
              toolCallId: "t2",
            },
            { kind: "snapshots", enabled: true, toolCallId: "t3" },
          ],
        }),
        [],
        [{ id: "v1", versionNumber: 2 }],
      ),
    ).toBe(
      "Saved the Setup, version 2, started a test build, and enabled snapshots",
    );
  });

  it("joins three or more parts with a serial comma", () => {
    expect(
      summarizeTurn(
        turn({
          ports: [
            {
              kind: "port",
              title: "Preview",
              machineId: "machine_a",
              port: 3000,
            },
          ],
          automations: [{ bound: false }],
          environmentRequests: [{ variables: ["A", "B"] }],
        }),
      ),
    ).toBe(
      "Exposed a preview, set up an automation, and requested 2 environment variables",
    );
  });

  it("returns an empty string for an empty turn", () => {
    expect(summarizeTurn(turn())).toBe("");
  });
});
