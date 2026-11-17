import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { useParams } from "@tanstack/react-router";
import { DateTime } from "effect";
import { AsyncResult } from "effect/reactivity";
import { useState } from "react";
import { toast } from "sonner";
import {
  EnvironmentVariables,
  scopeCopy,
  VariableRow,
  type VariableScope,
} from "@/components/environment-variables";
import {
  SettingsLoadingCard,
  SettingsPage,
  SettingsSection,
} from "@/components/settings-page";
import type { OrgId } from "@/data/api/schemas/ids";
import type {
  ProjectDependencyRepo,
  ProjectEnvironmentVariable,
} from "@/data/api/schemas/project-settings";
import {
  dependencyReposAtom,
  personalVariablesAtom,
  projectKey,
  projectMutations,
  projectSettingsKeys,
  sharedVariablesAtom,
} from "@/data/atoms/project-settings";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/primitives/dialog";
import { Icon } from "@/primitives/icon";
import { Input, InputGroup } from "@/primitives/input";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/primitives/menu";
import { Textarea } from "@/primitives/textarea";
import { CardList, CardListTitle, StatusDot } from "../shared/card-list";
import { cx } from "../shared/cx";
import { Glyph } from "../shared/glyphs";
import { useActiveOrgId } from "../shared/use-org";

const reachabilityColor = {
  reachable: "success",
  unreachable: "danger",
  indeterminate: "neutral",
} as const;

const secretPlaceholder = "••••••••••";

const sortLabel = { updated: "Last updated", name: "Name" } as const;

export function ProjectEnvironmentPage() {
  const { projectId } = useParams({
    from: "/_app/settings/projects_/$projectId_/environment-variables",
  });
  const orgId = useActiveOrgId();
  return (
    <SettingsPage
      title="Environment variables"
      description="Values reach a machine when it starts; running threads pick up changes through refresh"
    >
      {orgId === undefined ? (
        <SettingsLoadingCard />
      ) : (
        <EnvironmentVariablesSettings orgId={orgId} projectId={projectId} />
      )}
    </SettingsPage>
  );
}

function EnvironmentVariablesSettings({
  orgId,
  projectId,
}: {
  readonly orgId: OrgId;
  readonly projectId: string;
}) {
  const [scope, setScope] = useState<VariableScope>("shared");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"updated" | "name">("updated");
  const [editing, setEditing] = useState<ProjectEnvironmentVariable | null>(
    null,
  );
  const [adding, setAdding] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, string | null>>({});
  const [revealing, setRevealing] = useState<string | null>(null);

  const sharedResult = useAtomValue(
    sharedVariablesAtom(projectKey(orgId, projectId)),
  );
  const personalResult = useAtomValue(
    personalVariablesAtom(projectKey(orgId, projectId)),
  );
  const reposResult = useAtomValue(
    dependencyReposAtom(projectKey(orgId, projectId)),
  );
  const result = scope === "shared" ? sharedResult : personalResult;
  const variables = AsyncResult.isSuccess(result) ? result.value : undefined;
  const dependencyRepos = AsyncResult.isSuccess(reposResult)
    ? reposResult.value
    : undefined;
  const query = search.trim().toLowerCase();
  const visible = (variables ?? [])
    .filter((variable) => variable.name.toLowerCase().includes(query))
    .toSorted((left, right) =>
      sort === "name"
        ? left.name.localeCompare(right.name)
        : DateTime.toEpochMillis(right.updatedAt) -
          DateTime.toEpochMillis(left.updatedAt),
    );

  const readValue = useAtomSet(
    scope === "shared"
      ? projectMutations.getEnvironmentVariableValue
      : projectMutations.getPersonalEnvironmentVariableValue,
    { mode: "promise" },
  );
  const removeVariable = useAtomSet(
    scope === "shared"
      ? projectMutations.deleteEnvironmentVariable
      : projectMutations.deletePersonalEnvironmentVariable,
    { mode: "promise" },
  );

  const copy = (name: string, value: string) => {
    navigator.clipboard
      .writeText(value)
      .then(() => toast.success(`Copied ${name}`))
      .catch(() => toast.error(`Could not copy ${name}`));
  };

  const toggleReveal = (variable: ProjectEnvironmentVariable) => {
    if (revealed[variable.name] !== undefined) {
      setRevealed((all) => {
        const next = { ...all };
        delete next[variable.name];
        return next;
      });
      return;
    }
    setRevealing(variable.name);
    readValue({
      params: { orgId, projectId, name: variable.name },
      reactivityKeys: [projectSettingsKeys.variables(orgId, projectId)],
    })
      .then((value) =>
        setRevealed((all) => ({ ...all, [variable.name]: value.value })),
      )
      .catch(() => toast.error(`Could not read ${variable.name}`))
      .finally(() => setRevealing(null));
  };

  return (
    <>
      <EnvironmentVariables className="flex flex-col gap-10">
        {/* biome-ignore lint/a11y/useSemanticElements: two toggle buttons, not a form fieldset */}
        <div
          role="group"
          aria-label="Scope"
          className="flex items-center gap-1"
        >
          {(["shared", "personal"] as const).map((option) => (
            <Button
              key={option}
              variant="ghost"
              size="sm"
              aria-pressed={scope === option}
              className={cx(
                "capitalize",
                scope === option
                  ? "bg-secondary text-foreground hover:bg-secondary"
                  : "text-muted-foreground-1",
              )}
              onClick={() => setScope(option)}
            >
              {option}
            </Button>
          ))}
        </div>
        <SettingsSection
          title={scopeCopy[scope].label}
          description={scopeCopy[scope].description}
        >
          <CardList>
            <CardListTitle
              title={
                variables === undefined
                  ? "Loading variables"
                  : visible.length === 0
                    ? query === ""
                      ? `No ${scope} variables`
                      : `No ${scope} variables match “${search.trim()}”`
                    : visible.length === 1
                      ? "1 variable"
                      : `${visible.length} variables`
              }
            >
              {(variables?.length ?? 0) >= 2 && (
                <div className="flex items-center gap-0.5">
                  <InputGroup className="relative inline-flex w-44">
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-icon-muted"
                    >
                      <Glyph name="search" className="size-(--icon-sm)" />
                    </span>
                    <Input
                      size="sm"
                      className="pl-8"
                      placeholder="Search variables"
                      aria-label="Search variables"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </InputGroup>
                  <Menu>
                    <MenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Sort variables"
                        >
                          {sortLabel[sort]}
                          <Glyph
                            name="chevron-down"
                            className="size-(--icon-sm)"
                          />
                        </Button>
                      }
                    >
                      Sort variables
                    </MenuTrigger>
                    <MenuContent align="end" className="w-44">
                      <MenuItem onClick={() => setSort("updated")}>
                        Last updated
                      </MenuItem>
                      <MenuItem onClick={() => setSort("name")}>Name</MenuItem>
                    </MenuContent>
                  </Menu>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Add variable"
                title="Add variable"
                onClick={() => setAdding(true)}
              >
                <Glyph name="plus" className="size-(--icon-sm)" />
              </Button>
            </CardListTitle>
            {visible.map((variable) => (
              <VariableRow
                key={variable.name}
                variable={variable}
                value={{
                  readable: true,
                  revealed: revealed[variable.name] ?? null,
                  toggleReveal: () => toggleReveal(variable),
                  copyValue: () => {
                    const value =
                      revealed[variable.name] ??
                      (revealing === variable.name ? "" : null);
                    if (value === null || value === "") {
                      readValue({
                        params: { orgId, projectId, name: variable.name },
                        reactivityKeys: [
                          projectSettingsKeys.variables(orgId, projectId),
                        ],
                      })
                        .then((read) => copy(variable.name, read.value))
                        .catch(() =>
                          toast.error(`Could not read ${variable.name}`),
                        );
                      return;
                    }
                    copy(variable.name, value);
                  },
                }}
                onRename={() => setEditing(variable)}
                onDelete={() =>
                  removeVariable({
                    params: { orgId, projectId, name: variable.name },
                    reactivityKeys: [
                      projectSettingsKeys.variables(orgId, projectId),
                    ],
                  })
                    .then(() => toast.success(`${variable.name} removed`))
                    .catch(() =>
                      toast.error(`Could not remove ${variable.name}`),
                    )
                }
              />
            ))}
          </CardList>
        </SettingsSection>
        <SettingsSection
          title="Dependency repositories"
          description="Private repositories setup fetches read-only through the dependency reader app"
        >
          <CardList>
            <CardListTitle
              title={
                dependencyRepos === undefined
                  ? "Loading repositories"
                  : dependencyRepos.length === 0
                    ? "No dependency repositories"
                    : dependencyRepos.length === 1
                      ? "1 repository"
                      : `${dependencyRepos.length} repositories`
              }
            >
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Add repository"
                title="Add repository"
                onClick={() =>
                  window.open("/settings/integrations/github", "_self")
                }
              >
                <Glyph name="plus" className="size-(--icon-sm)" />
              </Button>
            </CardListTitle>
            {dependencyRepos?.map((repo) => (
              <DependencyRepoRow key={repo.repoFullName} repo={repo} />
            ))}
          </CardList>
        </SettingsSection>
      </EnvironmentVariables>
      <VariableDialog
        orgId={orgId}
        projectId={projectId}
        scope={scope}
        open={adding || editing !== null}
        variable={editing}
        onClose={() => {
          setAdding(false);
          setEditing(null);
        }}
      />
    </>
  );
}

function DependencyRepoRow({ repo }: { readonly repo: ProjectDependencyRepo }) {
  return (
    <div className="flex min-h-15 items-center justify-between gap-6 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-secondary text-foreground">
          <Icon name="folder-shared" className="size-4" />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-foreground">
            {repo.repoFullName}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground-2">
            <StatusDot color={reachabilityColor[repo.reachability]} />
            {repo.reachability === "reachable"
              ? "Readable through the dependency reader app"
              : repo.reachability === "unreachable"
                ? "The dependency reader app cannot read it"
                : "Reachability unknown"}
          </span>
        </div>
      </div>
    </div>
  );
}

function VariableDialog({
  orgId,
  projectId,
  scope,
  open,
  variable,
  onClose,
}: {
  readonly orgId: OrgId;
  readonly projectId: string;
  readonly scope: VariableScope;
  readonly open: boolean;
  readonly variable: ProjectEnvironmentVariable | null;
  readonly onClose: () => void;
}) {
  const write = useAtomSet(
    scope === "shared"
      ? projectMutations.setEnvironmentVariable
      : projectMutations.setPersonalEnvironmentVariable,
    { mode: "promise" },
  );
  const removeVariable = useAtomSet(
    scope === "shared"
      ? projectMutations.deleteEnvironmentVariable
      : projectMutations.deletePersonalEnvironmentVariable,
    { mode: "promise" },
  );
  const [saving, setSaving] = useState(false);
  const renaming = variable !== null;

  const submit = (form: HTMLFormElement) => {
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const value = String(data.get("value") ?? "");
    const description = String(data.get("description") ?? "").trim();
    if (name === "" || value === "") return;
    setSaving(true);
    const payload = {
      value,
      description: description === "" ? null : description,
    };
    const keys = [projectSettingsKeys.variables(orgId, projectId)];
    const writeName = (target: string) =>
      write({
        params: { orgId, projectId, name: target },
        payload,
        reactivityKeys: keys,
      });
    writeName(name)
      .then(async () => {
        if (renaming && variable.name !== name) {
          await removeVariable({
            params: { orgId, projectId, name: variable.name },
            reactivityKeys: keys,
          }).catch(() => {
            toast.warning(
              `Saved as ${name}; could not remove ${variable.name}`,
            );
          });
          toast.success(`${variable.name} renamed to ${name}`);
          return;
        }
        toast.success(renaming ? `Saved as ${name}` : `${name} added`);
      })
      .catch(() => toast.error(`Could not save ${name}`))
      .finally(() => {
        setSaving(false);
        onClose();
      });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogOverlay />
      <DialogContent className="max-w-md">
        {open && (
          <form
            key={variable?.name ?? "new"}
            onSubmit={(event) => {
              event.preventDefault();
              submit(event.currentTarget);
            }}
          >
            <DialogHeader>
              <DialogTitle>
                {renaming
                  ? `Edit ${variable.name}`
                  : "Add environment variables"}
              </DialogTitle>
              <DialogDescription>
                {scope === "shared"
                  ? scopeCopy.shared.description
                  : scopeCopy.personal.description}
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">
                  Name
                </span>
                <Input
                  name="name"
                  aria-label="Variable name"
                  defaultValue={variable?.name ?? ""}
                  placeholder="DATABASE_URL"
                  maxLength={255}
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">
                  Value
                </span>
                <Textarea
                  name="value"
                  aria-label="Variable value"
                  placeholder={secretPlaceholder}
                  rows={3}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">
                  Description
                </span>
                <Input
                  name="description"
                  aria-label="Variable description"
                  defaultValue={variable?.description ?? ""}
                  placeholder="What this value is for"
                  maxLength={255}
                />
              </div>
            </DialogBody>
            <DialogFooter>
              {renaming && (
                <Button
                  variant="ghost"
                  intent="danger"
                  type="button"
                  className="mr-auto"
                  onClick={() => {
                    removeVariable({
                      params: { orgId, projectId, name: variable.name },
                      reactivityKeys: [
                        projectSettingsKeys.variables(orgId, projectId),
                      ],
                    })
                      .then(() => toast.success(`${variable.name} removed`))
                      .catch(() =>
                        toast.error(`Could not remove ${variable.name}`),
                      );
                    onClose();
                  }}
                >
                  Delete
                </Button>
              )}
              <Button variant="ghost" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button intent="accent" type="submit" loading={saving}>
                Save
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Capy's empty state copy for a scope with no variables, kept exported for tests. */
export const emptyVariablesLabel = (scope: VariableScope) =>
  `No ${scope} variables`;
