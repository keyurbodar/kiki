import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { Button } from "@/primitives/button";
import { ICON_IDS, Icon } from "@/primitives/icon";

export type MemorySignal = {
  id: string;
  title?: string;
  scope?: string;
  volume?: string;
  file?: string;
};

export type MemoryRecallProps = ComponentProps<"div"> & {
  memory: MemorySignal | undefined;
  phase: string;
  memoryPaused?: boolean;
};

const scopeIds = new Set<string>(ICON_IDS);
const iconName = (value: string) =>
  (scopeIds.has(value) ? value : "brain") as (typeof ICON_IDS)[number];

export function scopeCopy(scope: string | undefined) {
  switch (scope) {
    case "project":
      return "Shared · Project";
    case "project-user":
      return "Personal · This project";
    default:
      return "Personal · Across projects";
  }
}

export function MemoryRecall({
  memory,
  phase,
  memoryPaused,
  ...props
}: MemoryRecallProps) {
  return (
    <div
      data-slot="memory-recall"
      className="flex items-center gap-3 border-b border-border-1 py-2"
      {...props}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {memory === undefined || memoryPaused ? (
          <span className="truncate text-sm text-foreground">
            {memory?.title ?? "Memory topic"}
          </span>
        ) : (
          <Button
            data-track-owner="features/thread/memory-signals.tsx#MemoryRecall:Link.1"
            variant="link"
            className="w-fit max-w-full truncate text-sm text-foreground hover:underline focus-visible:outline-ring-inset"
            render={
              <Link
                to="/memory"
                search={{
                  volume: memory.volume ?? "",
                  file: memory.file ?? "",
                }}
                aria-label={`Open current memory: ${memory.title ?? "Memory topic"}`}
              />
            }
          >
            {memory.title ?? "Memory topic"} ↗
          </Button>
        )}
        <span className="text-xs text-muted-foreground-2">
          {scopeCopy(memory?.scope)}
        </span>
      </div>
      <span className="text-xs text-muted-foreground-2">
        {phase === "running" ? "Reading…" : "Read"}
      </span>
      {memory !== undefined && (
        <Icon name={iconName(memory.scope ?? "brain")} size="sm" />
      )}
    </div>
  );
}
