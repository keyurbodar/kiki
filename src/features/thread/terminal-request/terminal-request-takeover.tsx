import { useAtomSet } from "@effect/atom-react";
import { useState } from "react";
import type { TerminalRequestRow } from "@/data/events";
import {
  isAdmitted,
  jamEventKey,
  terminalRequestDoneMutation,
} from "@/features/thread/request-takeover";
import { toast } from "@/primitives/toaster";
import {
  TerminalRequestTakeoverView,
  type TerminalRequestTakeoverViewProps,
} from "./terminal-request-takeover-view";

export const terminalRequestClientId = (toolCallId: string) =>
  `terminal-request:${toolCallId}`;

export type TerminalRequestTakeoverProps = Pick<
  TerminalRequestTakeoverViewProps,
  "gone" | "terminal" | "onRetry" | "onLater" | "onDismiss"
> & {
  orgId: string | undefined;
  rootJamId: string;
  row: typeof TerminalRequestRow.Type;
  onOpenShell: (machineId: string, operationId: string | undefined) => void;
};

export function TerminalRequestTakeover({
  orgId,
  rootJamId,
  row,
  onOpenShell,
  ...view
}: TerminalRequestTakeoverProps) {
  const [busy, setBusy] = useState(false);
  const done = useAtomSet(terminalRequestDoneMutation, { mode: "promise" });
  const finish = () => {
    if (orgId === undefined) return;
    setBusy(true);
    done({
      params: { orgId, jamId: rootJamId, toolCallId: row.toolCallId },
      reactivityKeys: [jamEventKey(rootJamId)],
    }).then(
      (result) => {
        if (!isAdmitted(result)) setBusy(false);
      },
      () => {
        toast.error("Could not send Done");
        setBusy(false);
      },
    );
  };

  return (
    <TerminalRequestTakeoverView
      {...view}
      command={row.command}
      reason={row.reason}
      busy={busy}
      onDone={orgId === undefined ? undefined : finish}
      onOpenInTab={() => onOpenShell(row.machine.machineId, row.operationId)}
    />
  );
}
