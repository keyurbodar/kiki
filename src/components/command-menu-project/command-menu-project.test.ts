import { describe, expect, it } from "vitest";
import {
  deriveProjectName,
  parseGithubUrl,
  projectEmptyText,
} from "./command-menu-project";

describe("project flow helpers", () => {
  it("reads owner and repo from a GitHub URL", () => {
    expect(parseGithubUrl("https://github.com/owner/repo.git")).toBe(
      "owner/repo",
    );
    expect(parseGithubUrl("github.com/owner/repo/")).toBe("owner/repo");
    expect(parseGithubUrl("https://gitlab.com/owner/repo")).toBeUndefined();
  });

  it("derives a project name from the source", () => {
    expect(deriveProjectName({ kind: "github", repos: ["owner/app"] })).toBe(
      "app",
    );
    expect(
      deriveProjectName({ kind: "url", url: "https://github.com/owner/site" }),
    ).toBe("site");
    expect(deriveProjectName({ kind: "empty" })).toBe("");
  });

  it("uses Capy's empty copy per step", () => {
    expect(projectEmptyText("url")).toBe("Paste a GitHub URL and press Enter");
    expect(projectEmptyText("details")).toBe("Type a project name");
    expect(projectEmptyText("sources")).toBe("No results");
  });
});
