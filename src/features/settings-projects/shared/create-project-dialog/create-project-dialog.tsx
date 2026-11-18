import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { type ReactNode, useCallback, useState } from "react";
import type { OrgId } from "@/data/api/schemas/ids";
import { githubInstallationReposAtom } from "@/data/atoms/project-settings";
import { projectsAtom } from "@/data/atoms/projects";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/primitives/dialog";
import { Drawer, DrawerContent, DrawerHandle } from "@/primitives/drawer";
import { Icon } from "@/primitives/icon";
import { usePhone } from "@/primitives/responsive-menu";
import { type InstallationRepo, readInstallation } from "../installation-repos";
import { formatRelative } from "../relative-time";
import { useCreateProject } from "../use-create-project";
import { useActiveOrgId, useActiveOrgRead } from "../use-org";
import {
  type CreateProjectDialogState,
  OpenCreateProjectDialogContext,
} from "./create-project-dialog-context";

export type CreateProjectDialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
};

/**
 * Capy's create-project surface: the org's repositories that are not projects
 * yet, each one create-able on its own. A dialog on a pointer-fine window and
 * the same body in a sheet on touch.
 */
export function CreateProjectDialog({
  open,
  onOpenChange,
}: CreateProjectDialogProps) {
  const phone = usePhone();
  const organizations = useActiveOrgRead();
  const orgId = useActiveOrgId();
  const body =
    orgId === undefined ? (
      <p className="kiki-list text-sm text-muted-foreground-2">
        {AsyncResult.isSuccess(organizations)
          ? "No organization to create a project in"
          : "Loading repositories"}
      </p>
    ) : (
      <CreateProjectRepos orgId={orgId} />
    );

  if (phone) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent aria-label="New project">
          <DrawerHandle />
          <div className="flex flex-col">
            <p className="kiki-list text-sm font-medium text-foreground">
              New project
            </p>
            {body}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
        </DialogHeader>
        <DialogBody>{body}</DialogBody>
      </DialogContent>
    </Dialog>
  );
}

function CreateProjectRepos({ orgId }: { readonly orgId: OrgId }) {
  const installationResult = useAtomValue(githubInstallationReposAtom(orgId));
  const projectsResult = useAtomValue(projectsAtom(orgId));
  const { creating, createProject } = useCreateProject(orgId);
  const installation = AsyncResult.isSuccess(installationResult)
    ? readInstallation(installationResult.value)
    : undefined;
  const taken = new Set(
    (AsyncResult.isSuccess(projectsResult) ? projectsResult.value : []).flatMap(
      (project) => project.repos.map((repo) => repo.repoFullName.toLowerCase()),
    ),
  );
  const now = Date.now();
  const repos: ReadonlyArray<InstallationRepo & { pushedAt: Date }> = (
    installation?.repos ?? []
  )
    .filter(
      (repo): repo is InstallationRepo & { pushedAt: Date } =>
        !repo.archived &&
        repo.pushedAt !== null &&
        !taken.has(repo.repoFullName.toLowerCase()),
    )
    .toSorted(
      (a, b) =>
        b.pushedAt.getTime() - a.pushedAt.getTime() ||
        a.repoFullName.localeCompare(b.repoFullName),
    );

  if (installation === undefined) {
    return (
      <p className="kiki-list text-sm text-muted-foreground-2">
        Loading repositories
      </p>
    );
  }
  if (repos.length === 0) {
    return (
      <p className="kiki-list text-sm text-muted-foreground-2">
        {installation.installed
          ? "Every repository already has a project"
          : "Install the Capy GitHub App to pick repositories"}
      </p>
    );
  }

  return (
    <ul className="kiki-list">
      {repos.map((repo) => (
        <li key={repo.repoFullName} className="kiki-row" data-density="roomy">
          <span
            className="kiki-icon rounded-md bg-secondary text-foreground"
            data-size="mark"
          >
            <Icon name="github" size="lg" />
          </span>
          <span className="kiki-cell" data-col="stack">
            <span className="truncate text-sm font-medium text-foreground">
              {repo.repoFullName}
            </span>
            <span className="truncate text-xs text-muted-foreground-2">
              pushed {formatRelative(repo.pushedAt, { now })}
            </span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            loading={creating === repo.repoFullName}
            loadingLabel="Creating"
            disabled={creating !== null}
            onClick={() => createProject(repo)}
          >
            Create project
          </Button>
        </li>
      ))}
    </ul>
  );
}

/**
 * Mounts the dialog once and hands every trigger the same opener, so the
 * projects page and the phone sheet cannot drift into two create flows.
 */
export function CreateProjectDialogProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [state, setState] = useState<CreateProjectDialogState | null>(null);
  const open = useCallback(
    (next: CreateProjectDialogState) => setState(next),
    [],
  );
  return (
    <OpenCreateProjectDialogContext.Provider value={open}>
      {children}
      {state === null ? null : (
        <CreateProjectDialog
          open={state.open}
          onOpenChange={(next) => {
            if (!next) setState(null);
          }}
        />
      )}
    </OpenCreateProjectDialogContext.Provider>
  );
}
