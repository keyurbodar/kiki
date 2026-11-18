import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuTrigger,
} from "@/primitives/responsive-menu";
import { ProjectGlyph, type ScopeProject } from "./project-glyph";

/** Capy's menu-item icon slot and label classes. */
export const menuItemIconClass =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";
export const menuItemLabelClass =
  "mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap";

/** Capy's ProjectMenu: picks which project's scopes the page shows. */
export function ProjectMenu({
  projects,
  value,
  onChange,
}: {
  projects: ReadonlyArray<ScopeProject>;
  value: ScopeProject;
  onChange: (projectId: string) => void;
}) {
  return (
    <ResponsiveMenu>
      <ResponsiveMenuTrigger
        render={
          <Button variant="ghost" size="sm" aria-label="Project">
            <ProjectGlyph project={value} className="size-(--icon-sm)" />
            {value.name}
            <Icon name="chevron-down-small" />
          </Button>
        }
      />
      <ResponsiveMenuContent align="end" className="w-64 max-w-full">
        {projects.map((project) => (
          <ResponsiveMenuItem
            key={project.id}
            onClick={() => onChange(project.id)}
          >
            <span className={menuItemIconClass}>
              <ProjectGlyph project={project} />
            </span>
            <span className={menuItemLabelClass}>{project.name}</span>
            {project.id === value.id && (
              <Icon
                name="checkmark-1"
                className="ml-auto size-(--icon-sm) shrink-0 text-foreground"
              />
            )}
          </ResponsiveMenuItem>
        ))}
      </ResponsiveMenuContent>
    </ResponsiveMenu>
  );
}
