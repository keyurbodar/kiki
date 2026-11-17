import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";

export type HomeWelcomeProject = {
  readonly id: string;
  readonly name: string;
};

export type HomeWelcomeProps = ComponentProps<"div"> & {
  /** Projects to offer as one-click picks; Capy shows the four most recent. */
  projects?: ReadonlyArray<HomeWelcomeProject>;
  /** Capy's `projectless`: the org lets a thread start with no project at all. */
  projectless?: boolean;
  onPick?: (project: HomeWelcomeProject) => void;
  onAddProject?: () => void;
  onStart?: () => void;
  onCreateCaptain?: () => void;
};

const projectLimit = 4;

/** Capy's quick-start row under the composer: recent projects, or how to start with none. */
export function HomeWelcome({
  projects = [],
  projectless = false,
  onPick,
  onAddProject,
  onStart,
  onCreateCaptain,
  className,
  ...props
}: HomeWelcomeProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-2 pt-4",
        className,
      )}
      {...props}
    >
      {projects.length > 0 ? (
        projects.slice(0, projectLimit).map((project) => (
          <Button
            key={project.id}
            data-track-owner="features/home/home-welcome.tsx#HomeWelcome:Button.1"
            variant="outline"
            size="sm"
            onClick={() => onPick?.(project)}
          >
            <Icon name="folder-1" />
            {project.name}
          </Button>
        ))
      ) : (
        <>
          <Button
            data-track-owner="features/home/home-welcome.tsx#HomeWelcome:Button[Add project]"
            variant="outline"
            size="sm"
            onClick={onAddProject}
          >
            <Icon name="folder-add-left" />
            Add project
          </Button>
          <Button
            data-track-owner="features/home/home-welcome.tsx#HomeWelcome:Button[onClick=start]"
            variant="outline"
            size="sm"
            onClick={onStart}
          >
            <Icon name="cloud-simple" />
            {projectless
              ? "Start without a project"
              : "Start without a repository"}
          </Button>
          {onCreateCaptain === undefined ? null : (
            <Button
              data-track-owner="features/home/home-welcome.tsx#HomeWelcome:Button[Create a Captain]"
              variant="outline"
              size="sm"
              onClick={onCreateCaptain}
            >
              <Icon name="crown" />
              Create a Captain
            </Button>
          )}
        </>
      )}
    </div>
  );
}
