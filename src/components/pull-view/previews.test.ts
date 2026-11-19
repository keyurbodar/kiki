import { describe, expect, it } from "vitest";
import type { PullComment } from "@/components/activity/activity-model";
import {
  previewDeployment,
  previewHref,
  previewLinks,
  previewState,
} from "./previews";
import type { CheckRow } from "./pull-model";

const check = (
  name: string,
  conclusion: string | null,
  detailsUrl: string | null = null,
): CheckRow => ({
  kind: "check",
  name,
  state: conclusion === null ? "in_progress" : "completed",
  conclusion,
  detailsUrl,
});

const comment = (
  bodyMd: string,
  options: { readonly bot?: boolean } = {},
): PullComment => ({
  id: `cmt_${bodyMd.length}`,
  kind: "issue",
  author: options.bot === true ? "vercel[bot]" : "priya",
  authorAvatarUrl: null,
  authorIsBot: options.bot === true,
  authoredAt: new Date("2026-11-19T09:00:00Z"),
  bodyMd,
  edited: false,
  resolved: false,
  outdated: false,
  file: null,
  line: null,
  githubReviewId: null,
});

describe("previewState", () => {
  it("answers null when no check reports a deployment", () => {
    expect(previewState([check("CI / unit tests", "success")])).toBeNull();
    expect(previewState([])).toBeNull();
  });

  it("reads the deployment checks and ignores the rest", () => {
    expect(
      previewState([
        check("CI / unit tests", "failure"),
        check("Vercel – web", "success", "https://kiki.vercel.app"),
      ]),
    ).toBe("ready");
    expect(
      previewState([check("Vercel – web", null, "https://kiki.vercel.app")]),
    ).toBe("building");
    expect(
      previewState([
        check("Vercel – web", "failure", "https://kiki.vercel.app"),
      ]),
    ).toBe("failed");
  });

  it("lets a failure outrank a deployment still building", () => {
    expect(
      previewState([
        check("Vercel – docs", null, "https://docs.vercel.app"),
        check("Vercel – web", "failure", "https://web.vercel.app"),
      ]),
    ).toBe("failed");
  });

  it("recognises Cloudflare Pages and Workers builds by name or URL", () => {
    expect(previewState([check("Cloudflare Pages", "success")])).toBe("ready");
    expect(previewState([check("Workers builds: docs", "success")])).toBe(
      "ready",
    );
    expect(
      previewState([
        check("deploy", "success", "https://dash.cloudflare.com/abc"),
      ]),
    ).toBe("ready");
  });
});

describe("previewHref", () => {
  it("opens the deployment itself, never the provider console", () => {
    expect(
      previewHref([
        check("Vercel – web", "success", "https://vercel.com/acme/web"),
        check("Vercel – docs", "success", "https://kiki-docs.vercel.app"),
      ]),
    ).toBe("https://kiki-docs.vercel.app");
  });

  it("answers null when every deployment check points at a console", () => {
    expect(
      previewHref([
        check("Vercel – web", "success", "https://vercel.com/acme/web"),
      ]),
    ).toBeNull();
  });
});

describe("previewLinks", () => {
  it("takes preview URLs out of comment bodies and drops everything else", () => {
    const links = previewLinks([
      comment(
        "Preview deployments:\n\n- web: https://kiki-git-feat.vercel.app\n- run: https://github.com/acme/web/actions/runs/12\n- console: https://vercel.com/acme/web",
        { bot: true },
      ),
    ]);
    expect(links.map((link) => link.url)).toEqual([
      "https://kiki-git-feat.vercel.app",
    ]);
  });

  it("dedupes one deployment linked twice and keeps the labelled link", () => {
    const links = previewLinks([
      comment(
        "[Branch preview](https://kiki-git-feat.vercel.app)\n\nhttps://kiki-git-feat.vercel.app/",
      ),
    ]);
    expect(links.map((link) => link.url)).toEqual([
      "https://kiki-git-feat.vercel.app",
    ]);
  });

  it("counts a bot's labelled preview on a host it does not recognise", () => {
    const links = previewLinks([
      comment("[Preview](https://kiki-preview.acme.dev/app)", { bot: true }),
    ]);
    expect(links.map((link) => link.url)).toEqual([
      "https://kiki-preview.acme.dev/app",
    ]);
  });

  it("drops a person's link to a host it cannot vouch for", () => {
    expect(
      previewLinks([comment("[Preview](https://kiki-preview.acme.dev/app)")]),
    ).toEqual([]);
  });

  it("ignores review comments, which never carry a bot's deploy link", () => {
    const links = previewLinks([
      {
        ...comment("https://kiki-git-feat.vercel.app", { bot: true }),
        kind: "review",
      },
    ]);
    expect(links).toEqual([]);
  });
});

describe("previewDeployment", () => {
  const checks = [
    check("Vercel – web", "success", "https://kiki-git-feat.vercel.app"),
    check("Vercel – docs", null, "https://kiki-docs-git-feat.vercel.app"),
  ];

  it("names a preview after the check that built its host", () => {
    expect(
      previewDeployment(checks, "https://kiki-git-feat.vercel.app"),
    ).toEqual({ name: "web", state: "ready" });
  });

  it("gives each preview its own state", () => {
    expect(
      previewDeployment(checks, "https://kiki-docs-git-feat.vercel.app"),
    ).toEqual({ name: "docs", state: "building" });
  });

  it("answers undefined when no check deployed that host", () => {
    expect(
      previewDeployment(checks, "https://someone-else.vercel.app"),
    ).toBeUndefined();
  });
});
