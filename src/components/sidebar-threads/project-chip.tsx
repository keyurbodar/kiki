import { cx } from "class-variance-authority";
import type { SidebarProject } from "./types";

const chipColors = [
  "bg-chart-1/15 text-chart-1",
  "bg-chart-2/15 text-chart-2",
  "bg-chart-3/15 text-chart-3",
  "bg-chart-4/15 text-chart-4",
  "bg-chart-5/15 text-chart-5",
  "bg-chart-6/15 text-chart-6",
  "bg-chart-7/15 text-chart-7",
  "bg-chart-8/15 text-chart-8",
];

export const projectInitials = (name: string) => {
  const words = name.split(/[^\p{L}\p{N}]+/u).filter((word) => word !== "");
  return (
    words.length > 1
      ? `${words[0]?.charAt(0) ?? ""}${words.at(-1)?.charAt(0) ?? ""}`
      : (words[0] ?? "").slice(0, 2)
  ).toUpperCase();
};

export const projectChipColor = (id: string) =>
  chipColors[
    Array.from(id, (char) => char.charCodeAt(0)).reduce(
      (hash, code) => (hash * 31 + code) >>> 0,
      7,
    ) % chipColors.length
  ];

export type ProjectChipProps = {
  project: SidebarProject;
  className?: string;
};

export function ProjectChip({ project, className }: ProjectChipProps) {
  if (project.logoUrl !== null) {
    return (
      <img
        src={project.logoUrl}
        alt=""
        draggable={false}
        className={cx("size-3.5 shrink-0 rounded-(--radius-sm)", className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      data-slot="project-chip"
      className={cx(
        "flex size-3.5 shrink-0 items-center justify-center rounded-(--radius-sm) font-mono text-plan-chip leading-none font-semibold tracking-tighter select-none",
        projectChipColor(project.id),
        className,
      )}
    >
      {projectInitials(project.name)}
    </span>
  );
}
