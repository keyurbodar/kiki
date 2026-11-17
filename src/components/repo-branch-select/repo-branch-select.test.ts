import { describe, expect, it } from "vitest";
import {
  branchList,
  multiRepoLabel,
  selectedBranch,
} from "./repo-branch-select";

const repos = [
  { repoFullName: "acme/api", baseBranch: "main" },
  { repoFullName: "acme/shared", baseBranch: "trunk" },
];

describe("repo-branch-select helpers", () => {
  it("falls back to the base branch", () => {
    expect(selectedBranch({}, repos[0] as (typeof repos)[0])).toBe("main");
    expect(
      selectedBranch({ "acme/api": "dev" }, repos[0] as (typeof repos)[0]),
    ).toBe("dev");
  });

  it("labels the multi-repo trigger", () => {
    expect(multiRepoLabel(repos, {})).toBe("2 repos");
    expect(multiRepoLabel(repos, { "acme/shared": "fix" })).toBe(
      "shared · fix",
    );
    expect(
      multiRepoLabel(repos, {}, (r) => r.repoFullName === "acme/api"),
    ).toBe("1 of 2 repos");
  });

  it("puts the base branch first without duplicates", () => {
    expect(branchList("main", ["dev", "main", "fix"])).toEqual([
      "main",
      "dev",
      "fix",
    ]);
    expect(branchList("main", undefined)).toEqual(["main"]);
  });
});
