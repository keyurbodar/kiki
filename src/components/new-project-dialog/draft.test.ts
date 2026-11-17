import { describe, expect, it } from "vitest";
import {
  createPayload,
  deriveProjectCode,
  draftProblems,
  emptyDraft,
  nameFromRepos,
  withCode,
  withName,
  withRepo,
} from "./draft";

const repos = [
  { repoFullName: "acme/web", defaultBranch: "main" },
  { repoFullName: "acme/shared", defaultBranch: "develop" },
];

describe("new project draft", () => {
  it("derives a four-letter code from the repository name", () => {
    expect(deriveProjectCode("web-app")).toBe("WEBA");
    expect(deriveProjectCode("site")).toBe("SITE");
    expect(deriveProjectCode("api")).toBe("API");
    expect(deriveProjectCode("ab")).toBe("CAPY");
  });

  it("names the project from the first repository and derives its code", () => {
    const draft = withRepo(emptyDraft(), "acme/web", true);
    expect(draft.name).toBe("web");
    expect(draft.code).toBe("WEB");
  });

  it("stops deriving the code once it is edited by hand", () => {
    const edited = withCode(withRepo(emptyDraft(), "acme/web", true), "abc");
    expect(edited.code).toBe("ABC");
    expect(withName(edited, "Design system").code).toBe("ABC");
  });

  it("renames from the repositories while the name still mirrors them", () => {
    const first = withRepo(emptyDraft(), "acme/web", true);
    const second = withRepo(first, "acme/shared", true);
    expect(second.repos).toEqual(["acme/web", "acme/shared"]);
    expect(second.name).toBe("web");
    expect(nameFromRepos([])).toBe("");
  });

  it("removes a repository from the selection", () => {
    const both = withRepo(
      withRepo(emptyDraft(), "acme/web", true),
      "acme/shared",
      true,
    );
    const one = withRepo(both, "acme/web", false);
    expect(one.repos).toEqual(["acme/shared"]);
  });

  it("reports missing fields", () => {
    expect(draftProblems(emptyDraft())).toEqual(["name", "code", "repos"]);
    expect(
      draftProblems({
        ...emptyDraft(),
        name: "Web",
        code: "WEB",
        repos: ["acme/web"],
      }),
    ).toEqual([]);
  });

  it("builds the create payload with each repository's default branch", () => {
    const draft = {
      ...emptyDraft(),
      name: "  Web  ",
      code: "WEB",
      repos: ["acme/web", "acme/shared"],
    };
    expect(createPayload(draft, repos)).toEqual({
      name: "Web",
      code: "WEB",
      visibility: "org",
      repos: [
        { repoFullName: "acme/web", baseBranch: "main" },
        { repoFullName: "acme/shared", baseBranch: "develop" },
      ],
    });
  });
});
