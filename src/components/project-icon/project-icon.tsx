import { joinClasses } from "@/components/project-select/selector-parts";
import type { Project } from "@/data/api/schemas/project";
import { Icon, type IconProps } from "@/primitives/icon";

const projectIcons: Record<string, IconProps["name"]> = {
  home: "home",
  compass: "compass-round",
  globe: "globe",
  task: "tasks",
  console: "console",
  files: "files",
  folder: "folder-1",
  code: "code",
  puzzle: "puzzle",
  star: "star",
  key: "key-1",
  bell: "bell",
  people: "people",
  shield: "shield",
  chart: "chart-1",
  clock: "clock",
  pin: "pin",
  search: "magnifying-glass",
};

const emojiCode = (emoji: string) =>
  [...(emoji.includes("\u200d") ? emoji : emoji.replaceAll("\ufe0f", ""))]
    .map((char) => char.codePointAt(0)?.toString(16))
    .join("-");

export type ProjectIconProps = {
  project: Pick<Project, "icon" | "repos"> & { logoUrl?: string | null };
  size?: "compact";
  className?: string;
};

export function ProjectIcon({ project, size, className }: ProjectIconProps) {
  const compact = size === "compact";
  if (project.logoUrl != null)
    return (
      <img
        draggable={false}
        alt=""
        src={project.logoUrl}
        className={joinClasses(
          "inline-block shrink-0 rounded-(--radius-sm) object-cover select-none",
          compact ? "size-(--icon-xs)" : "size-(--icon-sm)",
          className,
        )}
      />
    );
  if (project.icon !== "folder") {
    const name = projectIcons[project.icon];
    if (name === undefined)
      return (
        <img
          draggable={false}
          alt={project.icon}
          src={`https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/${emojiCode(project.icon)}.svg`}
          className={joinClasses(
            "inline-block shrink-0 select-none",
            compact ? "size-(--icon-xs) p-px" : "size-(--icon-sm)",
            className,
          )}
        />
      );
    return (
      <Icon
        name={name}
        size={compact ? "xs" : "sm"}
        className={joinClasses(compact && "p-px", className)}
      />
    );
  }
  return (
    <Icon
      name={project.repos.length > 1 ? "square-behind-square-2" : "box-2"}
      size={compact ? "xs" : "sm"}
      className={joinClasses(compact && "p-px", className)}
    />
  );
}
