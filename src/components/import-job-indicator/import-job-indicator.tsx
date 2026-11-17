import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { type ImportJob, importJobProgress, useImportJob } from "./import-job";

const RING_RADIUS = 6;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export type ImportJobIndicatorProps = {
  className?: string;
  job?: ImportJob;
};

export function ImportJobIndicator({
  className,
  job,
}: ImportJobIndicatorProps) {
  const current = useImportJob();
  const active = job ?? current;
  if (active === undefined || !active.running) return null;
  const { settled, fraction } = importJobProgress(active);
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          // biome-ignore lint/a11y/useAriaPropsSupportedByRole: the trigger carries Capy's spoken progress label
          <span
            className={[
              "flex h-(--h-control-sm) items-center gap-1.5 px-2 text-xs text-muted-foreground-1 tabular-nums",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label={`Importing threads, ${settled} of ${active.total} done`}
          >
            <svg
              viewBox="0 0 16 16"
              className="size-(--icon-base) -rotate-90"
              aria-hidden
            >
              <circle
                cx="8"
                cy="8"
                r={RING_RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-border-2"
              />
              <circle
                cx="8"
                cy="8"
                r={RING_RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={RING_CIRCUMFERENCE * (1 - fraction)}
                className="text-muted-foreground-2 transition-[stroke-dashoffset] duration-base"
              />
            </svg>
            <span className="max-md:hidden group-data-[crowded]/band:hidden">
              Importing threads
            </span>
          </span>
        }
      />
      <TooltipContent side="bottom">
        {settled} of {active.total} imported
        {active.failed > 0 ? `, ${active.failed} failed` : ""}
      </TooltipContent>
    </Tooltip>
  );
}
