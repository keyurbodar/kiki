import { DateTime } from "effect";
import type { ProjectId, UserId } from "../../api/schemas/ids.ts";
import {
  GitHubInstallationConnection,
  GitHubUserConnection,
  GitHubWorkspaceConnection,
  GitHubWorkspaceInstallation,
  GitHubWorkspaceProject,
  GitHubWorkspaceRepo,
  LinearConnection,
  LinearTeamMapping,
  PaperConnection,
  PaperStatus,
  SlackConnection,
  TailscaleConnection,
} from "../../api/schemas/integrations.ts";
import { isoMinutesAgo, people, projects, repos } from "../fixtures/world.ts";

type Row = { readonly connected: boolean; readonly [key: string]: unknown };

const text = (row: Row, key: string, fallback: string) =>
  typeof row[key] === "string" ? (row[key] as string) : fallback;

const time = (row: Row, key: string) =>
  DateTime.makeUnsafe(text(row, key, isoMinutesAgo(0)));

const connectedBy = people.alex.id as UserId;
const defaultProject = projects.web.id as ProjectId;

export const toGitHubUser = (row: Row) =>
  row.connected
    ? new GitHubUserConnection({
        state: "connected",
        accountLogin: text(row, "login", people.alex.githubLogin),
      })
    : null;

export const toGitHubInstallation = (row: Row) =>
  row.connected
    ? new GitHubInstallationConnection({
        installationId: 1001,
        state: row.suspended === true ? "suspended" : "active",
      })
    : null;

export const toSlack = (row: Row) =>
  row.connected
    ? new SlackConnection({
        id: text(row, "id", "slack_conn_sample_acme"),
        state: "active",
        slackTeamId: text(row, "teamId", "T_SAMPLE_ACME"),
        slackTeamName: text(row, "teamName", "Acme sample"),
        slackTeamDomain: "acme-sample",
        slackTeamIconUrl: null,
        botUserId: text(row, "botUserId", "U_SAMPLE_BOT"),
        grantedScopes: ["app_mentions:read", "chat:write"],
        missingScopes: [],
        enabledCapabilities: [],
        defaultProjectId: defaultProject,
        defaultBranches: {},
        channelProjects: {},
        asidePrefix: null,
        defaultMuted: false,
        defaultProjectPromptMuted: false,
        postConfirmations: true,
        threadLinks: true,
        connectedByUserId: connectedBy,
        createdAt: time(row, "connectedAt"),
        updatedAt: time(row, "connectedAt"),
      })
    : null;

export const toLinear = (row: Row) =>
  row.connected
    ? new LinearConnection({
        id: text(row, "id", "linear_conn_sample_acme"),
        state: "active",
        linearOrganizationId: "linear_org_sample_acme",
        linearOrganizationName: text(row, "organizationName", "Acme sample"),
        linearLogoUrl: null,
        appUserId: null,
        grantedScopes: ["read", "write"],
        missingScopes: [],
        defaultProjectId: defaultProject,
        defaultBranches: {},
        teamMappings: [
          new LinearTeamMapping({
            linearTeamId: text(row, "teamId", "team_sample_web"),
            linearTeamName: text(row, "teamName", "Web app"),
            projectId: defaultProject,
          }),
        ],
        connectedByUserId: connectedBy,
        createdAt: time(row, "connectedAt"),
        updatedAt: time(row, "connectedAt"),
      })
    : null;

export const toPaper = (row: Row) =>
  new PaperStatus({
    configured: true,
    connection: row.connected
      ? new PaperConnection({
          state: "active",
          paperUserId: "paper_user_sample_alex",
          paperEmail: text(row, "email", people.alex.email),
          paperName: text(row, "displayName", "Alex Morgan"),
          grantedScopes: ["files:read", "files:write"],
          connectedAt: time(row, "connectedAt"),
          updatedAt: time(row, "connectedAt"),
        })
      : null,
  });

export const toTailscale = (row: Row) =>
  row.connected
    ? new TailscaleConnection({
        id: text(row, "id", "tailscale_sample_acme"),
        state: "active",
        clientId: "tskey-client-sample",
        tag: Array.isArray(row.tags) ? String(row.tags[0]) : "tag:acme-agents",
        connectedByUserId: connectedBy,
        createdAt: time(row, "connectedAt"),
        updatedAt: time(row, "connectedAt"),
      })
    : null;

export const toGitHubWorkspace = (row: Row) =>
  row.connected
    ? new GitHubWorkspaceConnection({
        installations: [
          new GitHubWorkspaceInstallation({
            installationId: 1001,
            accountLogin: "acme",
            accountType: "Organization",
            state: row.suspended === true ? "suspended" : "active",
            repositoryCount: repos.length,
            manageUrl:
              "https://github.com/organizations/acme/settings/installations",
          }),
        ],
        repos: repos.map(
          (repo) =>
            new GitHubWorkspaceRepo({
              repoFullName: repo.fullName,
              accountLogins: ["acme"],
              projects: Object.values(projects)
                .filter((project) =>
                  (project.repos as ReadonlyArray<string>).includes(
                    repo.fullName,
                  ),
                )
                .map(
                  (project) =>
                    new GitHubWorkspaceProject({
                      id: project.id as ProjectId,
                      name: project.name,
                    }),
                ),
            }),
        ),
      })
    : null;
