import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { type ComponentProps, useCallback, useRef, useState } from "react";
import { Composer } from "@/components/composer";
import { ProjectSelect } from "@/components/project-select";
import { RepoBranchSelect } from "@/components/repo-branch-select";
import type { OrgId } from "@/data/api/schemas/ids";
import type { Project } from "@/data/api/schemas/project";
import { projectsAtom } from "@/data/atoms/projects";
import { organizationsAtom } from "@/data/atoms/session";
import { useSidebarState } from "@/features/shell/sidebar-container";
import { cn } from "@/lib/cn";
import { motion } from "@/lib/motion";
import { SidebarTrigger } from "@/primitives/sidebar";
import { HomeWelcome, type HomeWelcomeProject } from "../home-welcome";
import { ProjectEnvironmentHint } from "../project-environment-hint";

export type HomePageProps = ComponentProps<"div"> & {
  /** `?prompt=` on /new: a draft Capy seeds the composer with instead of the welcome. */
  prompt?: string;
};

/** Capy shows the welcome for an org that has nothing to start from yet, and never over a draft. */
export const showsWelcome = (
  prompt: string | undefined,
  projects: ReadonlyArray<unknown>,
) => prompt === undefined && projects.length === 0;

/** /new: Capy's home page, a centered composer over the panel's air gradient. */
export function HomePage({ prompt, className, ...props }: HomePageProps) {
  const organizations = AsyncResult.getOrElse(
    useAtomValue(organizationsAtom),
    () => [],
  );
  const organization = organizations[0];
  if (organization === undefined)
    return <HomePageBody prompt={prompt} className={className} {...props} />;
  return (
    <HomePageProjects
      orgId={organization.id}
      projectless={organization.personalThreadsEnabled}
      prompt={prompt}
      className={className}
      {...props}
    />
  );
}

type HomePageProjectsProps = HomePageProps & {
  orgId: OrgId;
  projectless?: boolean;
};

function HomePageProjects({ orgId, ...props }: HomePageProjectsProps) {
  const projects = AsyncResult.getOrElse(
    useAtomValue(projectsAtom(orgId)),
    () => [],
  );
  return <HomePageBody projects={projects} {...props} />;
}

type HomePageBodyProps = HomePageProjectsProps & {
  projects?: ReadonlyArray<Project>;
};

function HomePageBody({
  projects = [],
  projectless = false,
  prompt,
  className,
  ...props
}: Omit<HomePageBodyProps, "orgId">) {
  const { open, isNarrow } = useSidebarState();
  const [pickedProjectId, setPickedProjectId] = useState<string>();
  const composerRef = useRef<HTMLDivElement>(null);
  const project =
    projects.find(({ id }) => id === pickedProjectId) ?? projects[0];

  const focusComposer = useCallback(() => {
    composerRef.current
      ?.querySelector<HTMLElement>(
        "textarea, input, [contenteditable=true], button",
      )
      ?.focus();
  }, []);

  const pickProject = useCallback(
    (picked: HomeWelcomeProject) => {
      setPickedProjectId(picked.id);
      focusComposer();
    },
    [focusComposer],
  );

  return (
    <div
      className={cn(
        "relative flex min-h-0 flex-1 flex-col overflow-clip",
        className,
      )}
      {...props}
    >
      {isNarrow || !open ? (
        <div
          data-track-owner="features/home/home-page.tsx#HomePage:SidebarTrigger.1"
          className="absolute top-1.5 left-2 z-(--z-top-bar) [[data-tab-strip]_&]:hidden"
        >
          <SidebarTrigger className="transition-opacity delay-150 duration-100 starting:opacity-0" />
        </div>
      ) : null}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:var(--gradient-panel-air)]"
      />
      <div className="relative flex flex-1 items-center justify-center px-6">
        <div
          className={cn(
            "flex w-full max-w-178 flex-col pb-[10dvh]",
            motion.enterRise,
          )}
        >
          <div className="flex min-h-8 min-w-0 items-center gap-3 pr-4 pb-1.5 pl-4">
            <ProjectSelect
              data-track-owner="features/home/home-page.tsx#HomePage:ProjectSelect.1"
              className="min-w-0 shrink"
            />
            <ProjectEnvironmentHint project={project} />
            <span className="ml-auto flex min-w-0 shrink items-center gap-2">
              <RepoBranchSelect
                data-track-owner="features/home/home-page.tsx#HomePage:RepoBranchSelect.1"
                className="min-w-0 shrink"
              />
            </span>
          </div>
          <div ref={composerRef} className="relative rounded-(--radius-card)">
            <Composer className="relative" />
          </div>
          {showsWelcome(prompt, projects) ? (
            <HomeWelcome
              projects={projects}
              projectless={projectless}
              onPick={pickProject}
              onStart={focusComposer}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
