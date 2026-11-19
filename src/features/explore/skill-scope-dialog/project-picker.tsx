import { useAtomValue } from "@effect/atom-react";
import { AsyncResult, Atom } from "effect/reactivity";
import type { OrgId } from "@/data/api/schemas/ids";
import type { Project } from "@/data/api/schemas/project";
import { projectsAtom } from "@/data/atoms/projects";
import { Icon } from "@/primitives/icon";
import {
  MenuSelect,
  MenuSelectContent,
  MenuSelectItem,
  MenuSelectTrigger,
  MenuSelectValue,
} from "@/primitives/menu-select";

export type PickedProject = { id: string; name: string };

/** The org's projects while the org is still resolving. */
const idleProjects = Atom.make(AsyncResult.initial(false)) as ReturnType<
  typeof projectsAtom
>;

export function useProjects(
  orgId: string | undefined,
): ReadonlyArray<PickedProject> {
  const result = useAtomValue(
    orgId === undefined ? idleProjects : projectsAtom(orgId as OrgId),
  );
  if (orgId === undefined || !AsyncResult.isSuccess(result)) return [];
  return result.value.map((project) => ({
    id: project.id,
    name: project.name,
  }));
}

/** The org's projects as the schema carries them, for the shared project select. */
export function useOrgProjects(
  orgId: string | undefined,
): ReadonlyArray<Project> {
  const result = useAtomValue(
    orgId === undefined ? idleProjects : projectsAtom(orgId as OrgId),
  );
  if (orgId === undefined || !AsyncResult.isSuccess(result)) return [];
  return result.value;
}

export type ProjectPickerProps = {
  projects: ReadonlyArray<PickedProject>;
  value: PickedProject | undefined;
  onValueChange: (project: PickedProject) => void;
  disabled?: boolean;
};

export function ProjectPicker({
  projects,
  value,
  onValueChange,
  disabled,
}: ProjectPickerProps) {
  return (
    <MenuSelect
      value={value?.id ?? null}
      disabled={disabled}
      items={Object.fromEntries(
        projects.map((project) => [project.id, project.name]),
      )}
      onValueChange={(id) => {
        const project = projects.find((candidate) => candidate.id === id);
        if (project !== undefined) onValueChange(project);
      }}
    >
      <MenuSelectTrigger
        aria-label="Project"
        className="flex h-(--h-control-sm) items-center gap-1.5 rounded px-2 text-sm font-medium text-foreground outline-none hover:bg-secondary focus-visible:outline-ring-inset"
      >
        <Icon name="folder-1" size="sm" className="text-muted-foreground-1" />
        <MenuSelectValue />
      </MenuSelectTrigger>
      <MenuSelectContent align="end" sideOffset={4}>
        {projects.map((project) => (
          <MenuSelectItem key={project.id} value={project.id}>
            {project.name}
          </MenuSelectItem>
        ))}
      </MenuSelectContent>
    </MenuSelect>
  );
}
