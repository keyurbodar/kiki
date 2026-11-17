import { useNavigate } from "@tanstack/react-router";
import { cx } from "class-variance-authority";
import { useState } from "react";
import { IssuePickerCheck, PlusLargeGlyph } from "@/components/issue-pickers";
import type { Project } from "@/data/api/schemas/project";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@/primitives/menu";
import { matchIssueOptions } from "../issue-pickers";
import {
  bareButton,
  menuIconSlot,
  menuPopup,
  menuSearchInput,
} from "./classes";
import { FolderGlyph, GearGlyph, HomeGlyph } from "./icons";

function ProjectGlyph({
  project,
  className,
}: {
  project: Project | undefined;
  className?: string;
}) {
  const Glyph = project?.icon === "home" ? HomeGlyph : FolderGlyph;
  return <Glyph className={cx("size-(--icon-sm) shrink-0", className)} />;
}

/**
 * The dialog's project breadcrumb (Capy's ProjectSelect with chevron off).
 * Built here because the shared ProjectSelect is still a contract stub.
 */
export function ProjectPicker({
  projects,
  value,
  onValueChange,
}: {
  projects: ReadonlyArray<Project>;
  value: Project | undefined;
  onValueChange: (project: Project) => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const shown = matchIssueOptions(
    projects,
    (project) => [
      project.name,
      ...project.repos.map((repo) => repo.repoFullName),
    ],
    query,
  ).toSorted((a, b) => a.name.localeCompare(b.name));
  const manage = () => void navigate({ to: "/settings/projects" });
  return (
    <Menu onOpenChange={(open) => open || setQuery("")}>
      <MenuTrigger
        render={
          <button
            type="button"
            aria-label="Project"
            className={cx(bareButton, "-m-1 gap-1.5 p-1 text-foreground")}
          >
            <ProjectGlyph project={value} className="translate-y-hairline" />
            <span className="min-w-0 truncate">
              {value?.name ?? "No project"}
            </span>
          </button>
        }
      />
      <MenuContent
        align="start"
        sideOffset={4}
        className={cx(menuPopup, "w-64")}
      >
        <div className="flex shrink-0 items-center">
          <input
            className={menuSearchInput}
            placeholder="Search projects"
            aria-label="Search projects"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Escape") event.stopPropagation();
            }}
          />
        </div>
        <MenuSeparator />
        <div className="min-h-0 overflow-x-hidden overflow-y-auto">
          {shown.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm font-normal text-muted-foreground-2">
              No projects found
            </div>
          ) : (
            shown.map((project) => (
              <MenuItem key={project.id} onClick={() => onValueChange(project)}>
                <span className={menuIconSlot}>
                  <ProjectGlyph project={project} />
                </span>
                <span className="mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap">
                  {project.name}
                </span>
                <IssuePickerCheck checked={project.id === value?.id} />
              </MenuItem>
            ))
          )}
        </div>
        <MenuSeparator />
        <MenuItem onClick={manage}>
          <span className={menuIconSlot}>
            <PlusLargeGlyph />
          </span>
          <span className="min-w-0 truncate">New project</span>
        </MenuItem>
        <MenuItem onClick={manage}>
          <span className={menuIconSlot}>
            <GearGlyph />
          </span>
          Manage projects
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
