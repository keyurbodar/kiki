import { useAtomValue } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { AsyncResult } from "effect/reactivity";
import { type ComponentProps, useState } from "react";
import { ProjectIcon } from "@/components/project-icon";
import type { OrgId } from "@/data/api/schemas/ids";
import type { Project } from "@/data/api/schemas/project";
import type { ThreadCardPage } from "@/data/api/schemas/thread";
import { idleAtom } from "@/data/atoms/idle";
import { projectsAtom } from "@/data/atoms/projects";
import { currentUserAtom } from "@/data/atoms/session";
import { threadsAtom } from "@/data/atoms/threads";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import {
  MenuContent,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
} from "@/primitives/menu";
import {
  ResponsiveMenu,
  ResponsiveMenuItem,
} from "@/primitives/responsive-menu";
import {
  orderProjects,
  projectActivity,
  projectDisplayName,
} from "./order-projects";
import {
  joinClasses,
  SelectorCheck,
  SelectorChevron,
  SelectorItemIcon,
  SelectorLayout,
  SelectorSearch,
  selectorEmpty,
  selectorIconSlot,
  selectorItemLabel,
  selectorItemTrailing,
  selectorTrigger,
  selectorTriggerIcon,
} from "./selector-parts";

export const homeProjectName = "Home";

export type ProjectSelectNoProject = {
  selected?: boolean;
  onSelect?: () => void;
};

export type ProjectSelectProps = Omit<ComponentProps<"div">, "children"> & {
  orgId?: OrgId;
  value?: Project;
  onValueChange?: (project: Project) => void;
  noProject?: ProjectSelectNoProject;
  chevron?: boolean;
  defaultOpen?: boolean;
  onManage?: () => void;
  onCreateProject?: (name?: string) => void;
  deviceName?: string;
};

const successValue = <A,>(result: AsyncResult.AsyncResult<A, unknown>) =>
  AsyncResult.isSuccess(result) ? result.value : undefined;

const idleProjects = idleAtom<readonly Project[]>();
const idleThreads = idleAtom<ThreadCardPage>();

function useProjectSources(orgId: OrgId | undefined) {
  const projects = successValue(
    useAtomValue(orgId === undefined ? idleProjects : projectsAtom(orgId)),
  );
  const threads = successValue(
    useAtomValue(orgId === undefined ? idleThreads : threadsAtom(orgId)),
  );
  const user = successValue(useAtomValue(currentUserAtom));
  if (orgId === undefined)
    return { projects: undefined, threads: [], userId: undefined };
  return {
    projects: projects as readonly Project[] | undefined,
    threads: threads?.items ?? [],
    userId: user?.id as string | undefined,
  };
}

function ProjectName({ project }: { project: Project }) {
  const { base, suffix } = projectDisplayName(project);
  return (
    <>
      {base}
      {suffix === undefined ? null : (
        <span className="text-muted-foreground-2">{suffix}</span>
      )}
    </>
  );
}

export function ProjectSelect({
  orgId,
  value,
  onValueChange,
  noProject,
  chevron = true,
  defaultOpen,
  onManage,
  onCreateProject,
  deviceName = "computer",
  className,
  ...props
}: ProjectSelectProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(defaultOpen ?? false);
  const { projects, threads, userId } = useProjectSources(orgId);
  const triggerClass = joinClasses(selectorTrigger, className);
  const noProjects =
    value === undefined &&
    noProject?.selected !== true &&
    projects?.length === 0;

  if (value === undefined && noProject?.selected !== true && !noProjects) {
    if (projects === undefined) return null;
    return (
      <div data-slot="project-select" {...props}>
        <Button
          data-track-owner="shared/new-thread/project-select.tsx#ProjectSelect:Button.1"
          variant="bare"
          size="auto-sm"
          className={triggerClass}
          onClick={() => onCreateProject?.()}
        >
          <Icon name="plus-large" size="sm" className={selectorTriggerIcon} />
          <span className="min-w-0 truncate">New project</span>
        </Button>
      </div>
    );
  }

  const all = projects ?? [];
  const { matches, yours, others, createName } = orderProjects(
    all,
    query,
    projectActivity(all, threads, userId),
  );
  const split = yours.length > 0 && others.length > 0;
  const showNoProject =
    noProject !== undefined &&
    "no project".includes(query.trim().toLowerCase());

  const row = (project: Project) => (
    <ResponsiveMenuItem
      key={project.id}
      data-track-owner="shared/new-thread/project-select.tsx#projectRow:ResponsiveMenuItem.1"
      onClick={() => onValueChange?.(project)}
    >
      <span className={selectorIconSlot}>
        <ProjectIcon project={project} />
      </span>
      <span className={selectorItemLabel}>
        <ProjectName project={project} />
      </span>
      {project.id === value?.id ? <SelectorCheck className="ml-auto" /> : null}
    </ResponsiveMenuItem>
  );

  return (
    <div data-slot="project-select" {...props}>
      <ResponsiveMenu
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery("");
        }}
      >
        <MenuTrigger
          data-track-owner="shared/new-thread/project-select.tsx#ProjectSelect:ResponsiveMenuTrigger.1"
          render={
            <Button
              data-track-owner="shared/new-thread/project-select.tsx#ProjectSelect:Button[Project]"
              variant="bare"
              size="auto-sm"
              aria-label="Project"
              className={triggerClass}
            />
          }
        >
          {value === undefined && !noProjects ? (
            <Icon name="folder-1" size="sm" className={selectorTriggerIcon} />
          ) : (
            <ProjectIcon
              project={value ?? { icon: "folder", repos: [] }}
              className={selectorTriggerIcon}
            />
          )}
          <span className="min-w-0 truncate">
            {value === undefined ? (
              noProjects ? (
                homeProjectName
              ) : (
                "No project"
              )
            ) : (
              <ProjectName project={value} />
            )}
          </span>
          {chevron ? <SelectorChevron /> : null}
        </MenuTrigger>
        <MenuContent className="w-64">
          <SelectorLayout
            search={
              <SelectorSearch
                placeholder="Search projects"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            }
            footer={
              <>
                {showNoProject ? (
                  <>
                    <MenuSeparator />
                    <ResponsiveMenuItem
                      data-track-owner="shared/new-thread/project-select.tsx#ProjectSelect:ResponsiveMenuItem[onClick=onSelect]"
                      onClick={noProject?.onSelect}
                    >
                      <SelectorItemIcon name="folder-1" />
                      <span className={selectorItemLabel}>No project</span>
                      <span className={selectorItemTrailing}>
                        This {deviceName}
                        {noProject?.selected === true ? (
                          <SelectorCheck />
                        ) : null}
                      </span>
                    </ResponsiveMenuItem>
                  </>
                ) : null}
                <MenuSeparator />
                <ResponsiveMenuItem
                  data-track-owner="shared/new-thread/project-select.tsx#ProjectSelect:ResponsiveMenuItem.1"
                  onClick={() => onCreateProject?.(createName)}
                >
                  <SelectorItemIcon name="plus-large" />
                  <span className={selectorItemLabel}>
                    {createName === undefined
                      ? "New project"
                      : `New project “${createName}”`}
                  </span>
                </ResponsiveMenuItem>
                <ResponsiveMenuItem
                  data-track-owner="shared/new-thread/project-select.tsx#ProjectSelect:ResponsiveMenuItem[Manage projects]"
                  onClick={() => {
                    onManage?.();
                    void navigate({ to: "/settings/projects" });
                  }}
                >
                  <SelectorItemIcon name="settings-gear-1" />
                  Manage projects
                </ResponsiveMenuItem>
              </>
            }
          >
            {matches.length === 0 ? (
              <div className={selectorEmpty}>No projects found</div>
            ) : (
              <>
                {split ? <MenuLabel>Your projects</MenuLabel> : null}
                {yours.map(row)}
                {split ? <MenuLabel>Other projects</MenuLabel> : null}
                {others.map(row)}
              </>
            )}
          </SelectorLayout>
        </MenuContent>
      </ResponsiveMenu>
    </div>
  );
}
