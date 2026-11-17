import { describe, expect, it } from "vitest";
import {
  accessChanged,
  draftScopes,
  filePathValid,
  globValid,
  parseScopes,
  type ReviewRule,
  ruleDialogSubtitle,
  rulePatch,
  ruleSource,
  ruleTitle,
  scopeSummary,
  scopesValid,
  scopeTitle,
} from "./rules-model";

const rule = (patch: Partial<ReviewRule>): ReviewRule => ({
  id: "rrl_1",
  body: "First line\nSecond line",
  status: "active",
  scopes: [{ repo: null, paths: [] }],
  file: null,
  source: "manual",
  createdByName: "Sam Rivera",
  createdByUserId: "user_sam",
  firedCount: 2,
  lastFired: { repo: "acme/api", prNumber: 12 },
  ...patch,
});

describe("review rules model", () => {
  it("titles a rule by its first line or file", () => {
    expect(ruleTitle(rule({}))).toBe("First line");
    expect(
      ruleTitle(rule({ file: { repo: "acme/docs", path: "docs/guide.md" } })),
    ).toBe("docs/guide.md");
  });

  it("names the source", () => {
    expect(ruleSource(rule({}))).toBe("Sam Rivera");
    expect(ruleSource(rule({ createdByName: null, source: "comment" }))).toBe(
      "Pull request comment",
    );
    expect(ruleSource(rule({ createdByName: null, source: "tool" }))).toBe(
      "Capy",
    );
    expect(ruleSource(rule({ createdByName: null, source: "manual" }))).toBe(
      "—",
    );
  });

  it("summarises scopes", () => {
    expect(scopeSummary(rule({}))).toBe("All repositories");
    expect(
      scopeSummary(
        rule({
          scopes: [
            { repo: "acme/web", paths: [] },
            { repo: "acme/api", paths: [] },
          ],
        }),
      ),
    ).toBe("2 repositories");
    expect(
      scopeSummary(
        rule({ scopes: [{ repo: "acme/api", paths: ["src/**", "lib/**"] }] }),
      ),
    ).toBe("src/**,lib/** in acme/api");
    expect(
      scopeTitle(
        rule({
          scopes: [
            { repo: "acme/api", paths: ["src/**"] },
            { repo: null, paths: [] },
          ],
        }),
      ),
    ).toBe("src/** in acme/api or every repository");
  });

  it("flags lost repository access", () => {
    expect(accessChanged(rule({}))).toBe(false);
    expect(
      accessChanged(
        rule({ scopes: [{ repo: "acme/web", paths: [], covered: false }] }),
      ),
    ).toBe(true);
  });

  it("subtitles the dialog", () => {
    expect(ruleDialogSubtitle(undefined)).toBe(
      "Instructions for reviews paid by your organization",
    );
    expect(ruleDialogSubtitle(rule({}))).toBe(
      "Added by Sam Rivera · 2 findings · last on acme/api#12",
    );
    expect(
      ruleDialogSubtitle(
        rule({
          createdByName: null,
          createdByUserId: null,
          firedCount: 1,
          lastFired: null,
        }),
      ),
    ).toBe("Added by API key · 1 finding");
  });

  it("merges scopes per repository for the editor", () => {
    expect(draftScopes(undefined)).toEqual([{ repo: null, paths: "" }]);
    expect(
      draftScopes([
        { repo: "acme/Web", paths: ["a/**"] },
        { repo: "acme/web", paths: ["b/**"] },
        { repo: "acme/api", paths: ["x"] },
        { repo: "acme/api", paths: [] },
      ]),
    ).toEqual([
      { repo: "acme/Web", paths: "a/**,b/**" },
      { repo: "acme/api", paths: "" },
    ]);
    expect(parseScopes([{ repo: "acme/web", paths: " a/** , ,b " }])).toEqual([
      { repo: "acme/web", paths: ["a/**", "b"] },
    ]);
  });

  it("validates globs, scopes and file paths", () => {
    expect(globValid("src/**/*.ts")).toBe(true);
    expect(globValid("/abs")).toBe(false);
    expect(globValid("!neg")).toBe(false);
    expect(globValid("a/../b")).toBe(false);
    expect(scopesValid([])).toBe(false);
    expect(scopesValid([{ repo: null, paths: ["src/**"] }])).toBe(true);
    expect(filePathValid("acme/docs", "docs/guide.md")).toBe(true);
    expect(filePathValid("", "docs/guide.md")).toBe(false);
    expect(filePathValid("acme/docs", "docs/*.md")).toBe(false);
    expect(filePathValid("acme/docs", "docs//guide.md")).toBe(false);
  });

  it("sends only changed fields on edit", () => {
    const current = rule({});
    const draft = {
      body: current.body,
      file: null,
      scopes: [{ repo: null, paths: [] }],
      status: "inactive" as const,
    };
    expect(rulePatch(current, draft)).toEqual({ status: "inactive" });
    expect(rulePatch(undefined, draft)).toEqual(draft);
    expect(rulePatch(current, { ...draft, status: "active" })).toEqual({});
  });
});
