import { useAtomValue } from "@effect/atom-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Atom, AsyncResult } from "effect/reactivity";
import type { Project } from "@/data/api/schemas/project";
import { ApiClient } from "@/data/client/ApiClient";
import { queryTimeToLive } from "@/data/atoms/conventions";
import { Button } from "@/primitives/button";
import { Icon, type IconId } from "@/primitives/icon";
import { environmentHint, primaryRepos, setupPrompt } from "./environment-hint";

const projectKey = (orgId: string, projectId: string) =>
  `${orgId}/${projectId}`;

const splitKey = (key: string) => {
  const [orgId = "", projectId = ""] = key.split("/");
  return { orgId, projectId };
};

const projectSetupAtom = Atom.family((key: string) =>
  ApiClient.query("projects", "getSetup", {
    params: splitKey(key),
    timeToLive: queryTimeToLive,
  }),
);

const snapshotConfigAtom = Atom.family((key: string) =>
  ApiClient.query("projects", "getSnapshotConfig", {
    params: splitKey(key),
    timeToLive: queryTimeToLive,
  }),
);

const arrowUpRight = "arrow-up-right" as IconId;

export type ProjectEnvironmentHintProps = {
  orgId?: string;
  project?: Project;
};

export function ProjectEnvironmentHint({
  orgId,
  project,
}: ProjectEnvironmentHintProps) {
  if (
    orgId === undefined ||
    project === undefined ||
    primaryRepos(project).length === 0
  )
    return null;
  return (
<ResolvedProjectEnvironmentHint orgId={orgId} project={project} />
  );
}

function ResolvedProjectEnvironmentHint({
  orgId,
  project,
}: {
  orgId: string;
  project: Project;
}) {
  const navigate = useNavigate();
  const key = projectKey(orgId, project.id);
  const setup = AsyncResult.getOrElse(
    useAtomValue(projectSetupAtom(key)),
    () => undefined,
  );
  const snapshot = AsyncResult.getOrElse(
    useAtomValue(snapshotConfigAtom(key)),
    () => undefined,
  );
  const hint = environmentHint(project, setup, snapshot);
  if (hint === null) return null;
  if (hint.kind === "setup")
    return (
      <Button
        variant="bare"
        size="auto-sm"
        aria-label="Ask Capy to set up"
        className="-m-1 p-1"
        onClick={() =>
          navigate({ to: "/new", search: { prompt: setupPrompt(hint.repos) } })
        }
      >
        <Icon name="server-2" size="sm" />
        <span className="hidden min-w-0 truncate sm:inline">
          Ask Capy to set up
        </span>
        <span className="min-w-0 truncate sm:hidden">Setup</span>
      </Button>
    );
  return (
    <Button
      variant="bare"
      size="auto-sm"
      aria-label="Build snapshot"
      className="-m-1 p-1"
      render={
        <Link
          to="/settings/projects/$projectId/dev-environment"
          params={{ projectId: project.id }}
        />
      }
    >
      <Icon name="server-2" size="sm" />
      <span className="hidden min-w-0 truncate sm:inline">Build snapshot</span>
      <span className="min-w-0 truncate sm:hidden">Snapshot</span>
      <Icon name={arrowUpRight} size="sm" />
    </Button>
  );
}
