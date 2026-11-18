import { Button } from "@/primitives/button";

export type FailedReadProps = {
  /** What could not be loaded, in the surface's own words. */
  line: string;
  /** What that means for the reader, when the surface can say. */
  sub?: string;
  /** Re-runs the read. Omitted leaves the line without an action. */
  onRetry?: () => void;
  /** The surface's slot, so its own test can find this state. */
  slot?: string;
};

/**
 * A read that failed, as its own state: the same shape Capy's transcript uses
 * ("Couldn't load this conversation" and a Retry button). A surface shows this
 * instead of its empty state — an empty list and a list that could not load are
 * different facts, and rendering the first for the second is how a broken read
 * passes for a quiet one.
 */
export function FailedRead({
  line,
  sub,
  onRetry,
  slot = "failed-read",
}: FailedReadProps) {
  return (
    <div
      data-slot={slot}
      className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-6 text-center"
    >
      <span className="max-w-xs text-sm text-balance text-muted-foreground-1">
        {line}
      </span>
      {sub !== undefined && (
        <span className="max-w-xs text-xs text-balance text-muted-foreground-3">
          {sub}
        </span>
      )}
      {onRetry !== undefined && (
        <span className="mt-1">
          <Button variant="ghost" size="xs" onClick={onRetry}>
            Retry
          </Button>
        </span>
      )}
    </div>
  );
}
