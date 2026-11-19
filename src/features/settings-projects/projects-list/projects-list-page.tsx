import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Link } from "@tanstack/react-router";
import { DateTime } from "effect";
import { AsyncResult } from "effect/reactivity";
import { useDeferredValue, useState } from "react";
import { SettingsPage } from "@/components/settings-page";
import type { OrgId } from "@/data/api/schemas/ids";
import type { ProjectSettingsDirectoryEntry } from "@/data/api/schemas/project-settings";
import {
  deletedProjectsAtom,
  githubInstallationReposAtom,
  projectMutations,
  projectSettingsDirectoryAtom,
  projectSettingsDirectoryKey,
  projectWriteKeys,
} from "@/data/atoms/project-settings";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Input, InputGroup } from "@/primitives/input";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/primitives/menu";
import { toast } from "@/primitives/toaster";
import { StatusDot, type StatusDotColor } from "../shared/card-list";
import { useOpenCreateProjectDialog } from "../shared/create-project-dialog";
import { Glyph } from "../shared/glyphs";
import { readInstallation } from "../shared/installation-repos";
import { ProjectGlyph } from "../shared/project-glyph";
import { formatRelative } from "../shared/relative-time";
import { useCreateProject } from "../shared/use-create-project";
import { useActiveOrgId } from "../shared/use-org";
import {
  DirectoryActionRow,
  DirectoryCell,
  DirectoryColumnHeader,
  DirectoryGroupRow,
  DirectoryHeaderRow,
  DirectoryRow,
  DirectoryTable,
} from "./directory-table";
import {
  DeleteProjectDialog,
  RenameProjectDialog,
  SetOwnerDialog,
} from "./project-dialogs";
import { repositoriesLabel, suggestedRepos } from "./suggestions";

const snapshotLabels: Record<
  ProjectSettingsDirectoryEntry["snapshotState"],
  { readonly label: string; readonly color: StatusDotColor }
> = {
  off: { label: "Off", color: "neutral" },
  building: { label: "Building", color: "info" },
  ready: { label: "Ready", color: "success" },
  not_built: { label: "Not built", color: "neutral" },
};

const columns =
  "minmax(var(--table-lead-min,0),2.4fr) minmax(var(--table-fluid-min,0),2.6fr) minmax(var(--table-fluid-min,0),1.3fr) minmax(var(--table-fluid-min,0),1.2fr) minmax(var(--table-auto-min,5.5rem),auto) auto";

const pageSize = 50;

export function ProjectsListPage() {
  const orgId = useActiveOrgId();
  return (
    <SettingsPage
      title="Projects & setup"
      description="Manage projects, setup, snapshots, and environment variables, or create new projects from repositories"
      width="wide"
    >
      {orgId === undefined ? null : <ProjectsDirectory orgId={orgId} />}
    </SettingsPage>
  );
}

function ProjectsDirectory({ orgId }: { readonly orgId: OrgId }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const query = useDeferredValue(search.trim());
  const now = Date.now();

  const directoryResult = useAtomValue(
    projectSettingsDirectoryAtom(
      projectSettingsDirectoryKey(orgId, query, page),
    ),
  );
  const directory = AsyncResult.isSuccess(directoryResult)
    ? directoryResult.value
    : undefined;
  const deletedResult = useAtomValue(deletedProjectsAtom(orgId));
  const deleted = (
    AsyncResult.isSuccess(deletedResult) ? deletedResult.value : []
  ).filter(
    (project) =>
      project.name.toLowerCase().includes(query.toLowerCase()) ||
      project.repos.some((repo) =>
        repo.repoFullName.toLowerCase().includes(query.toLowerCase()),
      ),
  );
  const reposResult = useAtomValue(githubInstallationReposAtom(orgId));
  const installation = AsyncResult.isSuccess(reposResult)
    ? readInstallation(reposResult.value)
    : undefined;
  const installed = installation?.installed === true;
  const suggestions = suggestedRepos({
    repos: installation?.repos ?? [],
    taken: (directory?.items ?? []).flatMap((entry) => entry.repos),
    search: query,
    now,
  });

  const openCreateProject = useOpenCreateProjectDialog();
  const restore = useAtomSet(projectMutations.restore, { mode: "promise" });
  const { creating, createProject } = useCreateProject(orgId);
  const [renaming, setRenaming] =
    useState<ProjectSettingsDirectoryEntry | null>(null);
  const [deleting, setDeleting] =
    useState<ProjectSettingsDirectoryEntry | null>(null);
  const [owning, setOwning] = useState<ProjectSettingsDirectoryEntry | null>(
    null,
  );

  const offset = directory === undefined ? 0 : (directory.page - 1) * pageSize;

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-6">
        <div className="w-full max-w-75">
          <InputGroup className="relative inline-flex w-full">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-icon-muted"
            >
              <Glyph name="search" className="size-(--icon-sm)" />
            </span>
            <Input
              className="pl-8"
              placeholder="Search projects"
              aria-label="Search projects"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </InputGroup>
        </div>
        <Button
          variant="solid"
          size="base"
          intent="neutral"
          onClick={() =>
            openCreateProject?.({
              open: true,
              intent: "project",
              mode: { kind: "create" },
            })
          }
        >
          <Glyph name="plus" className="size-(--icon-base)" />
          New project
        </Button>
      </div>
      <div className="-mx-4 flex flex-col gap-3">
        <DirectoryTable columns={columns}>
          <DirectoryHeaderRow>
            <DirectoryColumnHeader>Project</DirectoryColumnHeader>
            <DirectoryColumnHeader>Repositories</DirectoryColumnHeader>
            <DirectoryColumnHeader>Setup</DirectoryColumnHeader>
            <DirectoryColumnHeader>Snapshot</DirectoryColumnHeader>
            <DirectoryColumnHeader sorted>Updated</DirectoryColumnHeader>
            <DirectoryColumnHeader aria-hidden />
          </DirectoryHeaderRow>
          <DirectoryGroupRow label="Active" count={directory?.totalProjects} />
          {directory === undefined ? (
            <DirectoryRow interactive={false}>
              <DirectoryCell className="col-span-full justify-center gap-2">
                {AsyncResult.isFailure(directoryResult)
                  ? "Could not load projects"
                  : "Loading projects"}
              </DirectoryCell>
            </DirectoryRow>
          ) : directory.items.length === 0 ? (
            <DirectoryRow interactive={false}>
              <DirectoryCell className="col-span-full justify-center">
                {query !== ""
                  ? `No projects match “${query}”`
                  : installed
                    ? "No projects yet"
                    : "No projects yet, install the Capy GitHub App to pick repositories"}
              </DirectoryCell>
            </DirectoryRow>
          ) : (
            directory.items.map((entry) => (
              <ProjectRow
                key={entry.id}
                entry={entry}
                updated={formatRelative(entry.updatedAt, {
                  now: Math.max(now, DateTime.toEpochMillis(entry.updatedAt)),
                })}
                onRename={() => setRenaming(entry)}
                onDelete={() => setDeleting(entry)}
                onSetOwner={() => setOwning(entry)}
              />
            ))
          )}
          {suggestions.length > 0 && (
            <DirectoryGroupRow
              label="Suggested from recent activity"
              count={suggestions.length}
            />
          )}
          {suggestions.map((repo) => (
            <DirectoryRow key={repo.githubRepoId}>
              <DirectoryCell className="gap-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-secondary text-foreground">
                  <Icon name="github" className="size-4" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {repo.repoFullName}
                  </span>
                </span>
              </DirectoryCell>
              <DirectoryCell className="col-span-4">
                pushed {formatRelative(repo.pushedAt, { now })}
              </DirectoryCell>
              <DirectoryCell className="justify-end pr-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="-mr-2"
                  disabled={creating !== null}
                  onClick={() => createProject(repo)}
                >
                  {creating === repo.repoFullName
                    ? "Creating"
                    : "Create project"}
                </Button>
              </DirectoryCell>
            </DirectoryRow>
          ))}
          {deleted.length > 0 && (
            <DirectoryGroupRow label="Deleted" count={deleted.length} />
          )}
          {deleted.map((project) => (
            <DirectoryRow key={project.id}>
              <DirectoryCell className="gap-2.5">
                <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-md bg-secondary text-muted-foreground-1">
                  <ProjectGlyph
                    icon={project.icon}
                    logoUrl={project.logoUrl}
                    className={
                      project.logoUrl === null ? "size-4" : "size-full"
                    }
                  />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-muted-foreground-1">
                    {project.name}
                  </span>
                </span>
              </DirectoryCell>
              <DirectoryCell className="col-span-4">
                Deleted {formatRelative(project.updatedAt, { now })}
              </DirectoryCell>
              <DirectoryCell className="justify-end pr-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="-mr-2"
                  onClick={() =>
                    restore({
                      params: { orgId, projectId: project.id },
                      reactivityKeys: projectWriteKeys(orgId, project.id),
                    })
                      .then(() => toast.success(`${project.name} restored`))
                      .catch(() => toast.error("Could not restore the project"))
                  }
                >
                  Restore
                </Button>
              </DirectoryCell>
            </DirectoryRow>
          ))}
        </DirectoryTable>
        <DirectoryActionRow
          icon={<Icon name="github" className="size-(--icon-base)" />}
          onClick={() => window.open("/settings/integrations/github", "_self")}
        >
          {installed
            ? "Don't see a repository? Manage the GitHub installation"
            : "Install the Capy GitHub App"}
        </DirectoryActionRow>
      </div>
      {directory !== undefined && directory.pageCount > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-normal text-muted-foreground-2 tabular-nums">
            Showing {offset + 1}–{offset + directory.items.length} of{" "}
            {directory.totalProjects}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              size="xs"
              variant="ghost"
              disabled={directory.page <= 1}
              onClick={() => setPage(directory.page - 1)}
            >
              Previous
            </Button>
            <span className="text-xs font-normal text-muted-foreground-2 tabular-nums">
              Page {directory.page} of {directory.pageCount}
            </span>
            <Button
              size="xs"
              variant="ghost"
              disabled={directory.page >= directory.pageCount}
              onClick={() => setPage(directory.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      <RenameProjectDialog
        orgId={orgId}
        project={renaming}
        onClose={() => setRenaming(null)}
      />
      <DeleteProjectDialog
        orgId={orgId}
        project={deleting}
        onClose={() => setDeleting(null)}
      />
      <SetOwnerDialog
        orgId={orgId}
        project={owning}
        onClose={() => setOwning(null)}
      />
    </section>
  );
}

function ProjectRow({
  entry,
  updated,
  onRename,
  onDelete,
  onSetOwner,
}: {
  readonly entry: ProjectSettingsDirectoryEntry;
  readonly updated: string;
  readonly onRename: () => void;
  readonly onDelete: () => void;
  readonly onSetOwner: () => void;
}) {
  const snapshot = snapshotLabels[entry.snapshotState];
  return (
    <DirectoryRow>
      <DirectoryCell className="gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-md bg-secondary text-foreground">
          <ProjectGlyph
            icon={entry.icon}
            logoUrl={entry.logoUrl}
            className={entry.logoUrl === null ? "size-4" : "size-full"}
          />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="flex min-w-0 items-center gap-1.5">
            <Link
              to="/settings/projects/$projectId"
              params={{ projectId: entry.id }}
              className="truncate text-sm font-medium text-foreground outline-none after:absolute after:inset-y-0 after:-inset-x-2 after:rounded focus-visible:after:outline-ring-inset"
            >
              {entry.name}
            </Link>
          </span>
        </span>
      </DirectoryCell>
      <DirectoryCell>{repositoriesLabel(entry.repos)}</DirectoryCell>
      <DirectoryCell>
        {entry.setupConfigured ? (
          <span className="truncate">
            Configured
            {entry.setupVersionNumber !== null && (
              <span className="text-muted-foreground-2">
                {" "}
                at v{entry.setupVersionNumber}
              </span>
            )}
          </span>
        ) : (
          "Default"
        )}
      </DirectoryCell>
      <DirectoryCell className="gap-2">
        <StatusDot color={snapshot.color} />
        {snapshot.label}
      </DirectoryCell>
      <DirectoryCell>{updated}</DirectoryCell>
      <DirectoryCell className="justify-end pr-0">
        <Menu>
          <MenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`${entry.name} actions`}
              />
            }
          >
            <Glyph name="dots" className="size-(--icon-sm)" />
          </MenuTrigger>
          <MenuContent align="end" className="w-44">
            <MenuItem onClick={onRename}>
              <Glyph name="rename" className="size-(--icon-sm)" />
              Rename
            </MenuItem>
            {entry.visibility === "private" && (
              <MenuItem onClick={onSetOwner}>
                <Icon name="user" size="sm" />
                Set owner
              </MenuItem>
            )}
            <MenuItem
              onClick={() => toast("Sharing arrives with the members editor")}
            >
              <Glyph name="share" className="size-(--icon-sm)" />
              Share
            </MenuItem>
            <MenuItem intent="danger" onClick={onDelete}>
              <Glyph name="trash" className="size-(--icon-sm)" />
              Delete
            </MenuItem>
          </MenuContent>
        </Menu>
      </DirectoryCell>
    </DirectoryRow>
  );
}
