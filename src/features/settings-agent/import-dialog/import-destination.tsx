import { useState } from "react";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import {
  MenuContent,
  MenuGroup,
  MenuLabel,
  MenuSearchRow,
  MenuSeparator,
  MenuTrigger,
} from "@/primitives/menu";
import {
  ResponsiveMenu,
  ResponsiveMenuItem,
} from "@/primitives/responsive-menu";
import {
  destinationLabel,
  destinationProjects,
  type ImportProject,
  type ImportSession,
} from "./import-model";
import { ChevronDown } from "./session-rows";

export type ImportDestinationProps = {
  sessions: readonly ImportSession[];
  projects: readonly ImportProject[];
  projectId: string | null;
  name: string;
  unresolved?: boolean;
  disabled?: boolean;
  onChoose: (projectId: string) => void;
  onCreate: () => void;
};

export function ImportDestination({
  sessions,
  projects,
  projectId,
  name,
  unresolved = false,
  disabled,
  onChoose,
  onCreate,
}: ImportDestinationProps) {
  const [query, setQuery] = useState("");
  const linked = destinationProjects(projects, sessions, query);
  return (
    <ResponsiveMenu
      onOpenChange={(open) => {
        if (!open) setQuery("");
      }}
    >
      <MenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="w-full min-w-0 justify-between"
            aria-label={`Import destination for ${name}`}
          />
        }
      >
        <span className="truncate">
          {destinationLabel(name, projectId, unresolved)}
        </span>
        <ChevronDown />
      </MenuTrigger>
      <MenuContent>
        <MenuSearchRow>
          <input
            aria-label="Search projects"
            placeholder="Search projects"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key !== "Escape" &&
                event.key !== "ArrowDown" &&
                event.key !== "ArrowUp"
              )
                event.stopPropagation();
            }}
          />
        </MenuSearchRow>
        {linked.length > 0 ? (
          <MenuGroup>
            <MenuLabel>Linked to this repository</MenuLabel>
            {linked.map((project) => (
              <ResponsiveMenuItem
                key={project.id}
                onClick={() => onChoose(project.id)}
              >
                <span>
                  <Icon name="folder-1" />
                </span>
                <span className="min-w-0 truncate">{project.name}</span>
                {project.id === projectId && !unresolved ? (
                  <Icon name="checkmark-1" className="ml-auto" />
                ) : null}
              </ResponsiveMenuItem>
            ))}
          </MenuGroup>
        ) : null}
        <MenuSeparator />
        <ResponsiveMenuItem onClick={onCreate}>
          <Icon name="square-plus" />
          Create new project
        </ResponsiveMenuItem>
      </MenuContent>
    </ResponsiveMenu>
  );
}
