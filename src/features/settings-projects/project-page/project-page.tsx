import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { useParams } from "@tanstack/react-router";
import { AsyncResult } from "effect/reactivity";
import { useState } from "react";
import { MachineUsageNote, useMachineUsage } from "@/components/machine-usage";
import { formatMachine } from "@/components/plan-picker/plan-catalog";
import { ReadGate } from "@/components/read-gate";
import { SettingsPage, SettingsSection } from "@/components/settings-page";
import type { OrgId } from "@/data/api/schemas/ids";
import type { Project, ProjectRepo } from "@/data/api/schemas/project";
import type { ProjectSetupRepo } from "@/data/api/schemas/project-settings";
import {
  personalVariablesAtom,
  projectAtom,
  projectKey,
  projectMutations,
  projectSettingsKeys,
  projectSetupAtom,
  sharedVariablesAtom,
  snapshotBuildsAtom,
} from "@/data/atoms/project-settings";
import { organizationsAtom } from "@/data/atoms/session";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/primitives/menu";
import {
  MenuSelect,
  MenuSelectContent,
  MenuSelectItem,
  MenuSelectTrigger,
  MenuSelectValue,
} from "@/primitives/menu-select";
import { SettingsRow, SettingsRowLink } from "@/primitives/settings-row";
import { toast } from "@/primitives/toaster";
import {
  DeleteProjectDialog,
  RenameProjectDialog,
} from "../projects-list/project-dialogs";
import { CardList, CardListTitle } from "../shared/card-list";
import { Glyph } from "../shared/glyphs";
import { ProjectGlyph } from "../shared/project-glyph";
import { formatRelative } from "../shared/relative-time";
import { useActiveOrgId, useActiveOrgRead } from "../shared/use-org";

const machineSizeKeys = ["small", "medium", "large", "ultra", "hyper"] as const;

type MachineSize = (typeof machineSizeKeys)[number];

const machineSizeFor = (value: string): MachineSize =>
  (machineSizeKeys as ReadonlyArray<string>).includes(value)
    ? (value as MachineSize)
    : "large";

const snapshotLabels = {
  off: "off",
  building: "building",
  ready: "ready",
  not_built: "not built",
} as const;

export function ProjectPage() {
  const { projectId } = useParams({
    from: "/_app/settings/projects_/$projectId",
  });
  const orgId = useActiveOrgId();
  const orgRead = useActiveOrgRead();
  return (
    <SettingsPage title="Project">
      <ReadGate
        result={orgRead}
        atom={organizationsAtom}
        slot="project-failed"
        line="Couldn't load your organization"
        sub="Check your connection and try again"
      >
        {(orgs) => (
          <ProjectSettings
            orgId={orgs[0]?.id ?? (orgId as OrgId)}
            projectId={projectId}
          />
        )}
      </ReadGate>
    </SettingsPage>
  );
}

function ProjectSettings({
  orgId,
  projectId,
}: {
  readonly orgId: OrgId;
  readonly projectId: string;
}) {
  const machineUsage = useMachineUsage(orgId);
  const key = projectKey(orgId, projectId);
  const projectResult = useAtomValue(projectAtom(key));
  const setupResult = useAtomValue(projectSetupAtom(key));
  const buildsResult = useAtomValue(snapshotBuildsAtom(key));
  const sharedResult = useAtomValue(sharedVariablesAtom(key));
  const personalResult = useAtomValue(personalVariablesAtom(key));
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const update = useAtomSet(projectMutations.update, { mode: "promise" });
  const setRepoMode = useAtomSet(projectMutations.setRepoMode, {
    mode: "promise",
  });
  const replaceRepos = useAtomSet(projectMutations.replaceRepos, {
    mode: "promise",
  });
  const replaceSetup = useAtomSet(projectMutations.replaceSetup, {
    mode: "promise",
  });

  const project = AsyncResult.isSuccess(projectResult)
    ? projectResult.value
    : undefined;
  const setup = AsyncResult.isSuccess(setupResult)
    ? setupResult.value
    : undefined;
  const builds = AsyncResult.isSuccess(buildsResult)
    ? buildsResult.value
    : undefined;
  const sharedCount = AsyncResult.isSuccess(sharedResult)
    ? sharedResult.value.length
    : undefined;
  const personalCount = AsyncResult.isSuccess(personalResult)
    ? personalResult.value.length
    : undefined;

  if (project === undefined)
    return (
      <p className="px-6 text-sm text-muted-foreground-1">
        {AsyncResult.isFailure(projectResult)
          ? "Organization is unavailable"
          : "Loading project"}
      </p>
    );

  const keys = [projectSettingsKeys.project(orgId, projectId)];
  const setupDescription = (() => {
    const version =
      setup?.versionNumber != null ? `, v${setup.versionNumber} active` : "";
    const snapshot = setup
      ? `, snapshot ${snapshotLabels[projectSnapshotState(builds)]}`
      : "";
    const failed = builds?.some((build) => build.status === "failed")
      ? " · latest build failed"
      : "";
    return `Install, update, and startup scripts per repository${version}${snapshot}${failed}`;
  })();

  const rename = (name: string | null) =>
    update({
      params: { orgId, projectId },
      payload: { name },
      reactivityKeys: keys,
    })
      .then(() => toast.success("Name saved"))
      .catch(() => toast.error("Could not rename the project"));

  const setBranch = (repo: ProjectRepo, baseBranch: string) =>
    replaceRepos({
      params: { orgId, projectId },
      payload: {
        repos: project.repos.map((current) => ({
          repoFullName: current.repoFullName,
          baseBranch:
            current.repoFullName === repo.repoFullName
              ? baseBranch
              : current.baseBranch,
          mode: current.mode,
        })),
      },
      reactivityKeys: keys,
    })
      .then(() => toast.success("Base branch saved"))
      .catch(() => toast.error("Could not update the repositories"));

  const setMachineSize = (machineSize: MachineSize) => {
    if (setup === undefined) return;
    const repositories = setup.repositories.map((repo) => ({
      repository: repo.repository,
      branch: repo.branch,
      scripts: repo.scripts,
      timeouts: repo.timeouts,
      startup: repo.startup,
      commands: repo.commands,
    }));
    replaceSetup({
      params: { orgId, projectId },
      payload: { machineSize, repositories },
      reactivityKeys: keys,
    })
      .then(() => toast.success("Machine size saved"))
      .catch(() => toast.error("Could not save the machine size"));
  };

  return (
    <>
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Change project icon"
            className="grid size-10 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-md bg-secondary transition-colors duration-100 select-none hover:bg-secondary-hover outline-none focus-visible:outline-ring-inset"
          >
            <ProjectGlyph
              icon={project.icon}
              logoUrl={project.logoUrl}
              className={project.logoUrl === null ? "size-6" : "size-full"}
            />
          </button>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h1 className="sr-only">{project.name}</h1>
            <div className="flex min-w-0 items-center gap-3">
              <NameInput
                name={project.name}
                derived={project.nameIsDerived}
                repos={project.repos.map((repo) => repo.repoFullName)}
                onSave={rename}
                onRename={() => setRenaming(true)}
              />
              <Badge>{project.code}</Badge>
              <Menu>
                <MenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Project actions"
                      className="ml-auto shrink-0"
                    />
                  }
                >
                  <Glyph name="dots" className="size-(--icon-sm)" />
                </MenuTrigger>
                <MenuContent align="end" className="w-44">
                  <MenuItem onClick={() => window.open("/threads", "_self")}>
                    <Glyph name="share" className="size-(--icon-sm)" />
                    View threads
                  </MenuItem>
                  <MenuItem
                    onClick={() =>
                      toast("Sharing arrives with the members editor")
                    }
                  >
                    <Glyph name="share" className="size-(--icon-sm)" />
                    Share
                  </MenuItem>
                  <MenuItem intent="danger" onClick={() => setDeleting(true)}>
                    <Glyph name="trash" className="size-(--icon-sm)" />
                    Delete project
                  </MenuItem>
                </MenuContent>
              </Menu>
            </div>
          </div>
        </div>
      </header>
      <SettingsSection
        title="Repositories"
        description="Cloned onto every machine in this project, on the branch shown"
      >
        <CardList>
          <CardListTitle
            title={
              project.repos.length === 0
                ? "No repositories"
                : project.repos.length === 1
                  ? "1 repository"
                  : `${project.repos.length} repositories`
            }
          >
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Add repositories"
              title="Add repositories"
              onClick={() =>
                window.open("/settings/integrations/github", "_self")
              }
            >
              <Glyph name="plus" className="size-(--icon-sm)" />
            </Button>
          </CardListTitle>
          {project.repos.map((repo) => (
            <RepoRow
              key={repo.repoFullName}
              repo={repo}
              setup={setup?.repositories.find(
                (entry) => entry.repository === repo.repoFullName,
              )}
              touchedAt={formatRelative(
                project.lastTouchedAt ?? project.updatedAt,
              )}
              onMode={(mode) =>
                setRepoMode({
                  params: {
                    orgId,
                    projectId,
                    owner: repo.repoFullName.slice(
                      0,
                      repo.repoFullName.indexOf("/"),
                    ),
                    repo: repo.repoFullName.slice(
                      repo.repoFullName.indexOf("/") + 1,
                    ),
                  },
                  payload: { mode },
                  reactivityKeys: keys,
                })
                  .then(() => toast.success("Repositories saved"))
                  .catch(() => toast.error("Could not update the repositories"))
              }
              onBranch={(branch) => setBranch(repo, branch)}
              onRemove={() =>
                replaceRepos({
                  params: { orgId, projectId },
                  payload: {
                    repos: project.repos
                      .filter(
                        (current) => current.repoFullName !== repo.repoFullName,
                      )
                      .map((current) => ({
                        repoFullName: current.repoFullName,
                        baseBranch: current.baseBranch,
                        mode: current.mode,
                      })),
                  },
                  reactivityKeys: keys,
                })
                  .then(() => toast.success(`${repo.repoFullName} removed`))
                  .catch(() => toast.error("Could not update the repositories"))
              }
            />
          ))}
        </CardList>
      </SettingsSection>
      <SettingsSection
        title="Machine"
        description="How a machine for this project boots"
      >
        <CardList>
          <SettingsRow
            icon={<Glyph name="chip" className="size-4" />}
            label="Machine size"
            description={
              <>
                Every new machine in this project, snapshot bakes included
                {machineUsage === undefined ? null : (
                  <MachineUsageNote
                    meter={machineUsage}
                    size={machineSizeFor(setup?.machineSize ?? "large")}
                  />
                )}
              </>
            }
          >
            <MenuSelect
              value={machineSizeFor(setup?.machineSize ?? "large")}
              onValueChange={(value) =>
                setMachineSize(machineSizeFor(String(value)))
              }
            >
              <MenuSelectTrigger
                aria-label="Machine size"
                size="base"
                className="w-40 shrink-0"
                disabled={setup === undefined}
              >
                <MenuSelectValue>
                  {formatMachine(machineSizeFor(setup?.machineSize ?? "large"))}
                </MenuSelectValue>
              </MenuSelectTrigger>
              <MenuSelectContent align="end" className="w-72">
                {machineSizeKeys.map((size) => (
                  <MenuSelectItem key={size} value={size}>
                    {formatMachine(size)}
                  </MenuSelectItem>
                ))}
              </MenuSelectContent>
            </MenuSelect>
          </SettingsRow>
          <SettingsRowLink
            to="/settings/projects/$projectId/dev-environment"
            params={{ projectId }}
            icon={<Glyph name="folder-machine" className="size-4" />}
            label="Setup & snapshot"
            description={setupDescription}
          />
        </CardList>
      </SettingsSection>
      <SettingsSection title="Threads">
        <CardList>
          <SettingsRow
            label="Thread code"
            description={`Prefixes thread numbers, like ${project.code}-12`}
          >
            <CodeInput
              code={project.code}
              onSave={(code) =>
                update({
                  params: { orgId, projectId },
                  payload: { code },
                  reactivityKeys: keys,
                })
                  .then(() => toast.success("Thread code saved"))
                  .catch(() => toast.error("Could not update the code"))
              }
            />
          </SettingsRow>
        </CardList>
      </SettingsSection>
      <SettingsSection title="Context">
        <CardList>
          <SettingsRowLink
            to="/settings/projects/$projectId/environment-variables"
            params={{ projectId }}
            icon={<Glyph name="key" className="size-4" />}
            label="Environment variables"
            description={
              sharedCount === undefined
                ? "Loading variables"
                : sharedCount + (personalCount ?? 0) === 0
                  ? "Not configured"
                  : `${sharedCount} shared and ${personalCount ?? 0} personal`
            }
          />
          <SettingsRowLink
            to="/settings/mcp"
            icon={<Glyph name="console" className="size-4" />}
            label="MCP servers"
            description="Servers every thread in this project can call"
          />
          <SettingsRowLink
            to="/settings/mcp"
            icon={<Glyph name="files" className="size-4" />}
            label="Capy Drive"
            description="Skills and instructions every thread in this project sees"
          />
        </CardList>
      </SettingsSection>
      <RenameProjectDialog
        orgId={orgId}
        project={renaming ? projectEntry(project) : null}
        onClose={() => setRenaming(false)}
      />
      <DeleteProjectDialog
        orgId={orgId}
        project={deleting ? projectEntry(project) : null}
        onClose={() => setDeleting(false)}
      />
    </>
  );
}

const projectEntry = (project: Project) => ({
  id: project.id,
  name: project.name,
  nameIsDerived: project.nameIsDerived,
});

const projectSnapshotState = (
  builds: ReadonlyArray<{ readonly status: string }> | undefined,
) => {
  const latest = builds?.[0];
  if (latest === undefined) return "not_built" as const;
  return latest.status === "building"
    ? ("building" as const)
    : ("ready" as const);
};

function NameInput({
  name,
  derived,
  repos,
  onSave,
  onRename,
}: {
  readonly name: string;
  readonly derived: boolean;
  readonly repos: ReadonlyArray<string>;
  readonly onSave: (name: string | null) => void;
  readonly onRename: () => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  if (draft === null)
    return (
      <>
        <button
          type="button"
          className="min-w-0 truncate text-left text-xl font-medium text-foreground outline-none focus-visible:outline-ring-inset"
          onClick={() => setDraft(name)}
        >
          {name}
        </button>
        <p className="flex min-w-0 items-center gap-1 text-sm font-normal text-muted-foreground-1">
          <span className="truncate">
            {repos.length === 0
              ? "No repositories yet"
              : derived
                ? `${repos.join(", ")}, name and icon follow the repositories,`
                : repos.join(", ")}
          </span>
          {derived && (
            <Button
              variant="ghost"
              size="xs"
              className="shrink-0"
              onClick={onRename}
            >
              Rename
            </Button>
          )}
        </p>
      </>
    );
  return (
    <span className="flex min-w-0 shrink items-center [&_input]:w-auto [&_input]:max-w-full [&_input]:field-sizing-content">
      <Input
        aria-label="Project name"
        maxLength={255}
        autoFocus
        value={draft}
        className="border-0 bg-transparent px-0 text-xl font-medium"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          const trimmed = draft.trim();
          setDraft(null);
          if (trimmed === name || trimmed === "") return;
          onSave(trimmed);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") setDraft(null);
        }}
      />
    </span>
  );
}

function CodeInput({
  code,
  onSave,
}: {
  readonly code: string;
  readonly onSave: (code: string) => void;
}) {
  const [value, setValue] = useState(code);
  if (
    code !== value &&
    document.activeElement?.getAttribute("data-code") !== "1"
  )
    setValue(code);
  return (
    <Input
      data-code="1"
      aria-label="Thread code"
      maxLength={4}
      size="sm"
      value={value}
      className="w-24 uppercase"
      onChange={(event) => setValue(event.target.value.toUpperCase())}
      onBlur={() => {
        const trimmed = value.trim();
        if (trimmed === code) return;
        if (trimmed === "") {
          setValue(code);
          return;
        }
        onSave(trimmed);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") setValue(code);
      }}
    />
  );
}

function RepoRow({
  repo,
  setup,
  touchedAt,
  onMode,
  onBranch,
  onRemove,
}: {
  readonly repo: ProjectRepo;
  readonly setup: ProjectSetupRepo | undefined;
  readonly touchedAt: string;
  readonly onMode: (mode: "primary" | "lazy") => void;
  readonly onBranch: (branch: string) => void;
  readonly onRemove: () => void;
}) {
  const branches = [...new Set([repo.baseBranch, "main", "master", "develop"])];
  const attribution =
    setup === undefined
      ? "Default setup with no install scripts yet"
      : `Setup configured${
          setup.source === "repo" && setup.sourceCommit !== null
            ? ` at ${setup.sourceCommit.slice(0, 7)}`
            : ""
        } by ${sourceLabel[setup.source]}, ${touchedAt}`;
  return (
    <SettingsRow
      icon={<Icon name="github" className="size-4" />}
      label={<span className="block truncate">{repo.repoFullName}</span>}
      description={
        setup?.sourceError === null || setup === undefined
          ? attribution
          : `${attribution}, the file at the branch head could not be applied`
      }
      actions={
        <Menu>
          <MenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`${repo.repoFullName} actions`}
              />
            }
          >
            <Glyph name="dots" className="size-(--icon-sm)" />
          </MenuTrigger>
          <MenuContent align="end" className="w-44">
            <MenuItem
              onClick={() =>
                onMode(repo.mode === "primary" ? "lazy" : "primary")
              }
            >
              {repo.mode === "primary" ? "Move to lazy" : "Move to primary"}
            </MenuItem>
            <MenuItem intent="danger" onClick={onRemove}>
              Remove
            </MenuItem>
          </MenuContent>
        </Menu>
      }
    >
      <Menu>
        <MenuTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              aria-label={`${repo.repoFullName} base branch`}
            >
              <Glyph name="branch" className="size-(--icon-sm)" />
              {repo.baseBranch}
              <Glyph name="chevron-down" className="size-(--icon-sm)" />
            </Button>
          }
        >
          {repo.repoFullName} base branch
        </MenuTrigger>
        <MenuContent align="end" className="w-44">
          {branches.map((branch) => (
            <MenuItem key={branch} onClick={() => onBranch(branch)}>
              {branch}
            </MenuItem>
          ))}
        </MenuContent>
      </Menu>
    </SettingsRow>
  );
}

const sourceLabel = {
  capy: "Capy",
  user: "you",
  repo: "the repository",
} as const;
