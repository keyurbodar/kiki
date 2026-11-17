import { type ReactElement, useState } from "react";
import {
  MobileSheet,
  MobileSheetRow,
  MobileSheetSearch,
  MobileSheetSeparator,
  matchesQuery,
} from "./mobile-sheet";

export type MobileProjectOption = { id: string; name: string };

export type MobileProjectSheetProps = {
  projects: ReadonlyArray<MobileProjectOption>;
  selectedId?: string;
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect: (id: string) => void;
  onNewProject: () => void;
  onManageProjects: () => void;
};

export function MobileProjectSheet({
  projects,
  selectedId,
  trigger,
  open,
  onOpenChange,
  onSelect,
  onNewProject,
  onManageProjects,
}: MobileProjectSheetProps) {
  const [query, setQuery] = useState("");
  return (
    <MobileSheet
      label="Projects"
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className="sticky top-0 bg-popover">
        <MobileSheetSearch
          placeholder="Search projects"
          value={query}
          onValueChange={setQuery}
        />
        <MobileSheetSeparator />
      </div>
      <div data-slot="selector-menu-list" data-menu-list="true">
        {projects
          .filter((project) => matchesQuery(project.name, query))
          .map((project) => (
            <MobileSheetRow
              key={project.id}
              label={project.name}
              aria-checked={project.id === selectedId}
              trailing={
                project.id === selectedId && (
                  <span className="ml-auto text-foreground">✓</span>
                )
              }
              onClick={() => onSelect(project.id)}
            />
          ))}
      </div>
      <div className="sticky bottom-0 bg-popover">
        <MobileSheetSeparator />
        <MobileSheetRow label="New project" onClick={onNewProject} />
        <MobileSheetRow label="Manage projects" onClick={onManageProjects} />
      </div>
    </MobileSheet>
  );
}
