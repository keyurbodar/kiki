import { type ReactNode, useState } from "react";
import {
  RequestTakeoverView,
  RequestViewport,
} from "@/features/thread/request-takeover";
import { Button } from "@/primitives/button";

export type TerminalSessionState =
  | { kind: "live" }
  | { kind: "failed"; reason: string; limit?: unknown }
  | { kind: "exited"; code: number };

export type TerminalSessionHandlers = {
  state: TerminalSessionState;
  onCreated: () => void;
  onFailed: (reason: string, limit?: unknown) => void;
  onRetry: () => void;
  onExited: (code: number) => void;
};

export type TerminalRequestTakeoverViewProps = {
  command: string;
  reason: string;
  gone?: boolean;
  busy?: boolean;
  terminal?: (session: TerminalSessionHandlers) => ReactNode;
  onRetry?: () => void;
  onDone?: () => void;
  onOpenInTab?: () => void;
  onLater: () => void;
  onDismiss?: () => void;
};

export function TerminalRequestTakeoverView({
  command,
  reason,
  gone = false,
  busy = false,
  terminal,
  onRetry,
  onDone,
  onOpenInTab,
  onLater,
  onDismiss,
}: TerminalRequestTakeoverViewProps) {
  const [state, setState] = useState<TerminalSessionState>({ kind: "live" });
  const exited = state.kind === "exited";
  const missing = gone && !exited;

  return (
    <RequestTakeoverView
      label="Terminal request"
      heading={`Finish ${command}`}
      reason={reason}
      status={exited || missing ? undefined : "Waiting for the command to exit"}
      onLater={onLater}
      onDismiss={onDismiss}
      actions={
        <>
          {onOpenInTab === undefined || missing || exited ? null : (
            <Button size="xs" variant="outline" onClick={onOpenInTab}>
              Open in tab
            </Button>
          )}
          <Button
            size="xs"
            intent="accent"
            disabled={onDone === undefined || busy}
            aria-busy={busy || undefined}
            onClick={onDone}
          >
            {busy ? "Waking Capy" : "Done"}
          </Button>
        </>
      }
    >
      <RequestViewport>
        {missing ? (
          <div className="flex flex-1 items-center justify-center p-4 text-sm text-muted-foreground-2">
            The command is no longer running on the machine
          </div>
        ) : (
          terminal?.({
            state,
            onCreated: () => setState({ kind: "live" }),
            onFailed: (failure, limit) =>
              setState({ kind: "failed", reason: failure, limit }),
            onRetry: () => {
              setState({ kind: "live" });
              onRetry?.();
            },
            onExited: (code) => setState({ kind: "exited", code }),
          })
        )}
      </RequestViewport>
    </RequestTakeoverView>
  );
}
