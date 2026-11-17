import type { ReactNode } from "react";
import { FileEmpty, fileEmptyArt } from "@/components/file-view/file-empty";
import { Button } from "@/primitives/button";
import { FilesSkeleton, RetryButton } from "./parts";

export type FilesMachine =
  | { state: "loading" }
  | {
      state: "unavailable";
      reason: "unreadable" | "slow";
      onRetry: () => void;
    }
  | { state: "none" }
  | { state: "asleep"; waking?: boolean; onWake: () => void }
  | { state: "stopped" }
  | {
      state: "awake";
      paths?: readonly string[];
      truncated?: boolean;
      failed?: boolean;
      onRetry?: () => void;
    };

export type MachineGateProps = {
  machine: FilesMachine;
  onOpenDiffs?: () => void;
  children: (machine: Extract<FilesMachine, { state: "awake" }>) => ReactNode;
};

export function MachineGate({
  machine,
  onOpenDiffs,
  children,
}: MachineGateProps) {
  switch (machine.state) {
    case "loading":
      return <FilesSkeleton />;
    case "unavailable":
      return (
        <FileEmpty
          line="Machine unavailable"
          sub={
            machine.reason === "unreadable"
              ? "The machine list could not be read"
              : "The machine list is taking too long"
          }
          action={<RetryButton onRetry={machine.onRetry} />}
        />
      );
    case "none":
      return <FileEmpty line="No machine yet" />;
    case "asleep":
      return (
        <FileEmpty
          art={fileEmptyArt.sleep}
          line="Machine is asleep"
          sub="Wake to browse files, 5 minutes prepaid"
          action={
            <Button
              data-track-owner="features/thread/pane/files-view.tsx#MachineGate:Button[Wake machine]"
              variant="ghost"
              size="xs"
              disabled={machine.waking}
              onClick={machine.onWake}
            >
              Wake machine
            </Button>
          }
        />
      );
    case "stopped":
      return (
        <FileEmpty
          art={fileEmptyArt.hanging}
          line="Machine stopped"
          action={
            onOpenDiffs === undefined ? undefined : (
              <Button
                data-track-owner="features/thread/pane/files-view.tsx#MachineGate:Button[Open diffs]"
                variant="ghost"
                size="xs"
                onClick={onOpenDiffs}
              >
                Open diffs
              </Button>
            )
          }
        />
      );
    case "awake":
      return children(machine);
  }
}
