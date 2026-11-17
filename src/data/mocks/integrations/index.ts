import { DateTime, Effect } from "effect";
import {
  GitHubInstallationRepo,
  GitHubInstallationRepoList,
} from "../../api/schemas/pull.ts";
import { isoMinutesAgo } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import { installationRepos } from "../pulls/fixtures.ts";

export const IntegrationsMock = mockGroup("integrations", (handlers) =>
  Effect.succeed(
    handlers.handle("listGitHubInstallationRepos", () =>
      Effect.succeed(
        new GitHubInstallationRepoList({
          state: "ok",
          repos: installationRepos.map(
            (repo) =>
              new GitHubInstallationRepo({
                githubRepoId: repo.githubRepoId,
                repoFullName: repo.repoFullName,
                defaultBranch: repo.defaultBranch,
                pushedAt: DateTime.makeUnsafe(isoMinutesAgo(repo.pushedMinutesAgo)),
                archived: repo.archived,
              }),
          ),
        }),
      ),
    ),
  ),
);
