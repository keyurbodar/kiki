import type { ReactNode } from "react";
import { Button } from "@/primitives/button";
import {
  type MachineFileMissProps,
  type MachinePathUnavailableProps,
  machineMissCopy,
} from "./logic";

export type EmptyStateProps = {
  line: string;
  sub?: string;
  action?: ReactNode;
};

export function EmptyState({ line, sub, action }: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-4 py-10 text-center"
    >
      <div className="text-sm font-medium text-foreground">{line}</div>
      {sub !== undefined && (
        <div className="text-xs text-muted-foreground-2">{sub}</div>
      )}
      {action}
    </div>
  );
}

export function MachineFileMiss({
  path,
  device,
  onOpenDiffs,
}: MachineFileMissProps) {
  const { line, sub } = machineMissCopy(path, device);
  return (
    <EmptyState
      line={line}
      sub={sub}
      action={
        onOpenDiffs === undefined ? undefined : (
          <Button size="xs" variant="ghost" onClick={onOpenDiffs}>
            Open diffs
          </Button>
        )
      }
    />
  );
}

export type RetryButtonProps = {
  onRetry: () => void;
  pending?: boolean;
};

export function RetryButton({ onRetry, pending = false }: RetryButtonProps) {
  return (
    <Button
      size="xs"
      variant="ghost"
      disabled={pending}
      aria-busy={pending || undefined}
      onClick={onRetry}
    >
      Retry
    </Button>
  );
}

export function MachinePathUnavailable({
  action,
  onRetry,
  pending,
}: MachinePathUnavailableProps) {
  return (
    <div
      data-slot="machine-path-unavailable"
      className="flex min-h-0 flex-1 flex-col"
    >
      {action ?? (
        <>
          <EmptyState
            line="Machine is unreachable"
            action={<RetryButton onRetry={onRetry} pending={pending} />}
          />
          <div className="flex flex-col items-center gap-2 px-4 pb-6 text-center text-xs text-muted-foreground-2">
            <span>Copy to Drive needs a complete read of this file</span>
            <span>Connect the machine or wake it to read the file first</span>
            <Button size="xs" variant="ghost" disabled>
              Copy to Drive
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
