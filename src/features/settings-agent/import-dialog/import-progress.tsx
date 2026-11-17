import {
  type ImportJob,
  importJobProgress,
} from "@/components/import-job-indicator";
import { ProgressEdge } from "@/primitives/progress-edge";

export function ImportProgress({ job }: { job: ImportJob }) {
  const failure = [...job.progress.values()].find(
    (progress) => progress.phase === "failed",
  );
  const { settled, fraction } = importJobProgress(job);
  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex items-baseline justify-between gap-3"
        role="status"
        aria-live="polite"
      >
        <span className="text-xs text-muted-foreground-1 tabular-nums">
          {job.done} of {job.total} {job.total === 1 ? "session" : "sessions"}{" "}
          imported
        </span>
        {job.failed > 0 ? (
          <span className="text-xs text-destructive">{job.failed} failed</span>
        ) : null}
      </div>
      <div
        role="progressbar"
        aria-label="Import progress"
        aria-valuemin={0}
        aria-valuemax={job.total}
        aria-valuenow={settled}
        aria-valuetext={`${job.done} imported, ${job.failed} failed`}
        className="relative h-1 overflow-hidden rounded-full bg-secondary"
      >
        <div
          className="h-full origin-left bg-primary transition-transform duration-base"
          style={{ transform: `scaleX(${fraction})` }}
        />
        {job.running ? (
          <ProgressEdge
            className="absolute inset-x-0 bottom-0"
            aria-label="Importing sessions"
          />
        ) : null}
      </div>
      {failure === undefined ? null : (
        <p role="alert" className="text-xs break-words text-destructive">
          {failure.detail ?? "Import did not finish"}
        </p>
      )}
    </div>
  );
}
