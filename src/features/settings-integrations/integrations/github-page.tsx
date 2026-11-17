import { useState } from "react";
import { SettingsPage, SettingsSection } from "@/components/settings-page";
import type {
  GitHubWorkspaceConnection,
  GitHubWorkspaceInstallation,
  GitHubWorkspaceRepo,
} from "@/data/api/schemas/integrations";
import {
  githubInstallationAtom,
  githubUserAtom,
  githubWorkspaceAtom,
} from "@/data/atoms/integrations";
import { Badge } from "@/primitives/badge";
import { Button, ButtonIcon } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { Input, InputGroup } from "@/primitives/input";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/primitives/menu";
import { SettingsRow } from "@/primitives/settings-row";
import { useActiveOrgId, useResultValue } from "../shared";
import { GitHubIcon } from "./brand-icons";
import { IntegrationConnectedStrip } from "./connect-state";
import { DotsIcon, SearchIcon } from "./github-icons";

const pageSize = 25;

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

export const workspaceSummary = (workspace: GitHubWorkspaceConnection) =>
  `${plural(workspace.installations.length, "account", "accounts")}, ${plural(
    workspace.installations.reduce((sum, row) => sum + row.repositoryCount, 0),
    "repository",
    "repositories",
  )}`;

export const installationDescription = (row: GitHubWorkspaceInstallation) => {
  const kind = row.accountType ?? "GitHub account";
  if (row.state === "active") {
    return `${kind} with ${plural(row.repositoryCount, "repository", "repositories")}`;
  }
  return row.state === "suspended"
    ? `${kind}, suspended on GitHub`
    : `${kind}, could not read this installation`;
};

export const repoDescription = (repo: GitHubWorkspaceRepo) =>
  repo.projects.length === 0
    ? "Not added to a project"
    : `Used by ${repo.projects.map((project) => project.name).join(", ")}`;

export const filterRepos = (
  repos: ReadonlyArray<GitHubWorkspaceRepo>,
  query: string,
) =>
  repos
    .filter((repo) =>
      repo.repoFullName.toLowerCase().includes(query.trim().toLowerCase()),
    )
    .sort((a, b) => a.repoFullName.localeCompare(b.repoFullName));

function AccountAvatar({ src, name }: { src: string; name: string }) {
  return (
    <span className="relative flex shrink-0 items-center justify-center overflow-hidden rounded bg-secondary size-8 text-xs">
      <img
        alt={name}
        className="absolute inset-0 size-full object-cover"
        src={src}
      />
    </span>
  );
}

function RowMenu({ label, items }: { label: string; items: string[] }) {
  return (
    <Menu>
      <MenuTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={label} />}
      >
        <ButtonIcon className="inline-flex shrink-0 items-center justify-center -mx-0.5">
          <DotsIcon />
        </ButtonIcon>
      </MenuTrigger>
      <MenuContent>
        {items.map((item) => (
          <MenuItem key={item}>{item}</MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
}

export function GitHubIntegrationPage() {
  const orgId = useActiveOrgId();
  return (
    <SettingsPage
      title="GitHub"
      description="Repositories, pull requests, and your account"
      icon={<GitHubIcon />}
      iconTile="brand"
    >
      <IntegrationConnectedStrip provider="github" />
      <AccountSection />
      {orgId !== undefined && <OrgSections orgId={orgId} />}
    </SettingsPage>
  );
}

function AccountSection() {
  const user = useResultValue(githubUserAtom);
  if (user === undefined) return null;
  return (
    <SettingsSection>
      <Card rows>
        <SettingsRow
          label="Your account"
          description={
            user === null
              ? "Connect your GitHub account to clone, push, and open pull requests as you"
              : `Connected as ${user.accountLogin} to clone, push, and open pull requests as you`
          }
        >
          {user === null ? (
            <Button variant="ghost" size="sm">
              Connect
            </Button>
          ) : (
            <>
              <Badge color={user.state === "connected" ? "success" : "warning"}>
                {user.state === "connected" ? "Connected" : "Reconnect needed"}
              </Badge>
              <RowMenu label="Account actions" items={["Disconnect account"]} />
            </>
          )}
        </SettingsRow>
      </Card>
    </SettingsSection>
  );
}

function OrgSections({
  orgId,
}: {
  orgId: Parameters<typeof githubWorkspaceAtom>[0];
}) {
  const workspace = useResultValue(githubWorkspaceAtom(orgId));
  const installation = useResultValue(githubInstallationAtom(orgId));
  return (
    <>
      <SettingsSection
        title="Connections"
        description="Clone, push, pull requests, and GitHub activity for this organization"
      >
        <Card rows>
          <SettingsRow
            icon={<GitHubIcon />}
            label="Capy GitHub app"
            description={
              workspace == null
                ? "Install Capy on the GitHub accounts holding your repositories"
                : workspaceSummary(workspace)
            }
          >
            {installation == null ? (
              <Button variant="ghost" size="sm">
                Install
              </Button>
            ) : (
              <>
                <Badge
                  color={
                    installation.state === "active" ? "success" : "warning"
                  }
                >
                  {installation.state === "active"
                    ? "Active"
                    : "Needs attention"}
                </Badge>
                <RowMenu
                  label="Workspace app actions"
                  items={[
                    "Install on another account",
                    "Disconnect workspace app",
                  ]}
                />
              </>
            )}
          </SettingsRow>
          {workspace?.installations.map((row) => (
            <SettingsRow
              key={row.installationId}
              icon={
                <AccountAvatar
                  src={`https://avatars.githubusercontent.com/${row.accountLogin ?? ""}`}
                  name={row.accountLogin ?? "GitHub installation"}
                />
              }
              label={row.accountLogin ?? "Installation unavailable"}
              description={installationDescription(row)}
            >
              <Badge color={row.state === "active" ? "success" : "warning"}>
                {row.state === "active"
                  ? "Active"
                  : row.state === "suspended"
                    ? "Suspended"
                    : "Unavailable"}
              </Badge>
              <RowMenu
                label={`${row.accountLogin ?? "Installation"} actions`}
                items={["Manage access on GitHub", "Unlink installation"]}
              />
            </SettingsRow>
          ))}
        </Card>
      </SettingsSection>
      <SettingsSection
        title="Dependency reader"
        description="A separate read-only app, fetch-only coverage for private dependency repositories during project setup"
      >
        <Card rows>
          <SettingsRow
            icon={<GitHubIcon />}
            label="Dependency reader app"
            description="Install it on the accounts holding your private dependencies"
          >
            <Button variant="ghost" size="sm">
              Install
            </Button>
          </SettingsRow>
        </Card>
      </SettingsSection>
      <SettingsSection
        title="Secondary app"
        description="A read-only app with its own API budget, serving repository reads when the workspace app is rate limited"
      >
        <Card rows>
          <SettingsRow
            icon={<GitHubIcon />}
            label="Secondary app"
            description="Install it on the accounts your workspace app already covers"
          >
            <Button variant="ghost" size="sm">
              Install
            </Button>
          </SettingsRow>
        </Card>
      </SettingsSection>
      <RepositoriesSection workspace={workspace} />
    </>
  );
}

function RepositoriesSection({
  workspace,
}: {
  workspace: GitHubWorkspaceConnection | null | undefined;
}) {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(pageSize);
  const all = workspace?.repos ?? [];
  const repos = filterRepos(all, query);
  return (
    <SettingsSection
      title="Repositories"
      description="Organization-wide GitHub access, project membership is shown separately"
    >
      {all.length > 0 && (
        <div className="mx-4">
          <InputGroup className="relative inline-flex w-full">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-icon-muted [&_svg]:size-(--icon-sm) left-2"
            >
              <SearchIcon />
            </span>
            <Input
              size="sm"
              className="pl-7"
              placeholder="Search repositories"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setLimit(pageSize);
              }}
            />
          </InputGroup>
        </div>
      )}
      <Card rows>
        {repos.length === 0 ? (
          <SettingsRow
            label={
              workspace === undefined
                ? "Checking repository access"
                : query.length > 0
                  ? "No repositories match"
                  : "No repositories connected"
            }
            description={
              workspace === undefined
                ? "Reading workspace and dependency access"
                : undefined
            }
          />
        ) : (
          repos.slice(0, limit).map((repo) => (
            <SettingsRow
              key={repo.repoFullName}
              icon={
                <AccountAvatar
                  src={`https://github.com/${repo.repoFullName.split("/")[0]}.png?size=64`}
                  name={repo.repoFullName.split("/")[0] ?? repo.repoFullName}
                />
              }
              label={
                <span className="block truncate">{repo.repoFullName}</span>
              }
              description={repoDescription(repo)}
            >
              <div className="hidden items-center gap-2 md:flex">
                <Badge>Workspace</Badge>
              </div>
            </SettingsRow>
          ))
        )}
        {repos.length > limit && (
          <div className="flex justify-center p-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setLimit((value) => value + pageSize)}
            >
              Show more
            </Button>
          </div>
        )}
      </Card>
    </SettingsSection>
  );
}
