import { describe, expect, it } from "vitest";
import { findEmptyOrgAtomReads, isGuarded } from "./empty-org-atoms";

const matches = (source: string) =>
  findEmptyOrgAtomReads(source).map((hit) => hit.match);

describe("findEmptyOrgAtomReads", () => {
  it("flags a read keyed on an org id defaulted to empty", () => {
    expect(
      matches('const catalog = useAtomValue(billingCatalogAtom(orgId ?? ""));'),
    ).toEqual(['orgId ?? ""']);
  });

  it("flags an empty org id nested inside another call", () => {
    expect(
      matches('useAtomValue(pullIssuesQuery(keyFrom(orgId ?? "")));'),
    ).toEqual(['orgId ?? ""']);
  });

  it("flags a cast empty org id", () => {
    expect(matches('projectsAtom((orgId ?? "") as OrgId)')).toEqual([
      'orgId ?? ""',
    ]);
  });

  it("flags a named org id other than the bare one", () => {
    expect(matches('useAtomValue(modelsAtom(activeOrgId ?? ""))')).toEqual([
      'activeOrgId ?? ""',
    ]);
  });

  it("leaves the guarded ternary alone", () => {
    expect(
      matches("orgId === undefined ? idleBoardAtom : folderBoardAtom(orgId)"),
    ).toEqual([]);
  });

  it("leaves an empty org id that is rendered as text alone", () => {
    expect(matches('{orgId ?? ""}</span>')).toEqual([]);
  });

  it("leaves an empty org id sent with a submitted form alone", () => {
    expect(matches('const orgParams = { orgId: activeOrgId ?? "" };')).toEqual(
      [],
    );
    expect(matches('const cmd = "org==" + (input.orgId ?? "");')).toEqual([]);
  });

  it("reports the line and column of the hit", () => {
    const [hit] = findEmptyOrgAtomReads(
      'const a = 1;\nconst b = captainsAtom(orgId ?? "");',
    );
    expect(hit).toEqual({ line: 2, column: 24, match: 'orgId ?? ""' });
  });
});

describe("isGuarded", () => {
  it("reads the app's TypeScript", () => {
    expect(isGuarded("src/features/sidebar/panel.tsx")).toBe(true);
    expect(isGuarded("src/data/atoms/billing.ts")).toBe(true);
  });

  it("skips tests, the generated route tree, and non-script files", () => {
    expect(isGuarded("src/features/sidebar/panel.test.tsx")).toBe(false);
    expect(isGuarded("src/routeTree.gen.ts")).toBe(false);
    expect(isGuarded("src/tokens/components.css")).toBe(false);
  });
});
