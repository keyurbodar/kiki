import { describe, expect, it } from "vitest";
import type { ProjectId } from "@/data/api/schemas/ids";
import {
  GitHubWorkspaceConnection,
  GitHubWorkspaceInstallation,
  GitHubWorkspaceProject,
  GitHubWorkspaceRepo,
} from "@/data/api/schemas/integrations";
import {
  filterRepos,
  installationDescription,
  repoDescription,
  workspaceSummary,
} from "./github-page";

const install = (
  state: "active" | "suspended" | "unavailable",
  repositoryCount = 3,
) =>
  new GitHubWorkspaceInstallation({
    installationId: 1,
    accountLogin: "acme",
    accountType: "Organization",
    state,
    repositoryCount,
    manageUrl: null,
  });

const repo = (name: string, projects: string[] = []) =>
  new GitHubWorkspaceRepo({
    repoFullName: name,
    accountLogins: ["acme"],
    projects: projects.map(
      (project) =>
        new GitHubWorkspaceProject({ id: project as ProjectId, name: project }),
    ),
  });

describe("GitHub page copy", () => {
  it("summarises the workspace app", () => {
    const workspace = new GitHubWorkspaceConnection({
      installations: [install("active", 22)],
      repos: [],
    });
    expect(workspaceSummary(workspace)).toBe("1 account, 22 repositories");
  });

  it("describes installations by state", () => {
    expect(installationDescription(install("active", 1))).toBe(
      "Organization with 1 repository",
    );
    expect(installationDescription(install("suspended"))).toBe(
      "Organization, suspended on GitHub",
    );
    expect(installationDescription(install("unavailable"))).toBe(
      "Organization, could not read this installation",
    );
  });

  it("describes project usage and filters repos", () => {
    expect(repoDescription(repo("acme/web"))).toBe("Not added to a project");
    expect(repoDescription(repo("acme/api", ["API", "Docs"]))).toBe(
      "Used by API, Docs",
    );
    expect(
      filterRepos([repo("acme/web"), repo("acme/api")], " API ").map(
        (row) => row.repoFullName,
      ),
    ).toEqual(["acme/api"]);
  });
});
