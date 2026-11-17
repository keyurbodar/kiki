import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";

/** The project shape the hint needs: its id and whether it has any repository to build. */
export type ProjectEnvironmentHintProject = {
  readonly id: string;
  readonly repos: ReadonlyArray<unknown>;
};

/** Capy's resolved project environment: the mirrored version plus its build state. */
export type ProjectEnvironmentState = {
  readonly activeVersionId: string | null;
  readonly building: boolean;
  readonly hasArtifact: boolean;
  readonly configured: boolean;
  readonly enabled: boolean;
};

export type ProjectEnvironmentHintProps = ComponentProps<"div"> & {
  project?: ProjectEnvironmentHintProject;
  /** Undefined until the project's environment is known, as in Capy. */
  state?: ProjectEnvironmentState;
  onSetUp?: (project: ProjectEnvironmentHintProject) => void;
};

/** The project's dev environment, as one line under its name: unbuilt, or a link to its snapshot. */
export function ProjectEnvironmentHint({
  project,
  state,
  onSetUp,
}: ProjectEnvironmentHintProps) {
  if (project === undefined || project.repos.length === 0) return null;
  return (
    <ResolvedProjectEnvironmentHint
      project={project}
      state={state}
      onSetUp={onSetUp}
    />
  );
}

export type ResolvedProjectEnvironmentHintProps = Omit<
  ProjectEnvironmentHintProps,
  "project"
> & { project: ProjectEnvironmentHintProject };

function ResolvedProjectEnvironmentHint({
  project,
  state,
  onSetUp,
}: ResolvedProjectEnvironmentHintProps) {
  if (
    state === undefined ||
    state.building ||
    state.hasArtifact ||
    (state.configured && !state.enabled)
  )
    return null;

  if (state.activeVersionId === null) {
    return (
      <Button
        data-track-owner="features/home/project-environment-hint.tsx#ResolvedProjectEnvironmentHint:Button[Ask Capy to set up]"
        variant="bare"
        size="auto-sm"
        aria-label="Ask Capy to set up"
        className="-m-1 p-1"
        onClick={() => onSetUp?.(project)}
      >
        <Icon name="sparkle-2" className="size-(--icon-sm)" />
        <span className="hidden min-w-0 truncate sm:inline">
          Ask Capy to set up
        </span>
        <span className="min-w-0 truncate sm:hidden">Setup</span>
      </Button>
    );
  }

  return (
    <Button
      data-track-owner="features/home/project-environment-hint.tsx#ResolvedProjectEnvironmentHint:Button[Build snapshot]"
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
      <Icon name="sparkle-2" className="size-(--icon-sm)" />
      <span className="hidden min-w-0 truncate sm:inline">Build snapshot</span>
      <span className="min-w-0 truncate sm:hidden">Snapshot</span>
      <Icon name="arrow-up-right" className="size-(--icon-sm)" />
    </Button>
  );
}
