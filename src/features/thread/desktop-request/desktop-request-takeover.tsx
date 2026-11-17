import { useAtomSet } from "@effect/atom-react";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import type { DesktopRequestRow } from "@/data/events";
import {
  desktopRequestDoneMutation,
  isAdmitted,
  jamEventKey,
  RequestTakeoverView,
  RequestViewport,
} from "@/features/thread/request-takeover";
import { Button } from "@/primitives/button";

export type DesktopRequestMachine = { label: string; reachable: boolean };
export type DesktopRequestPhone = { machineId: string; label: string };

export type DesktopRequestTakeoverProps = {
  orgId: string | undefined;
  rootJamId: string;
  row: typeof DesktopRequestRow.Type;
  machine: DesktopRequestMachine;
  phone?: DesktopRequestPhone;
  viewer?: ReactNode;
  onOpenDesktop: (jamId: string | undefined) => void;
  onOpenPhone: (phone: DesktopRequestPhone) => void;
  onLater: () => void;
  onDismiss?: () => void;
};

export const desktopRequestHeading = (
  machine: DesktopRequestMachine,
  phone: DesktopRequestPhone | undefined,
) =>
  phone === undefined
    ? `Capy needs you on the ${machine.label === "Primary machine" ? "desktop" : machine.label.toLowerCase()}`
    : "Capy needs you on the phone";

export function DesktopRequestTakeover({
  orgId,
  rootJamId,
  row,
  machine,
  phone,
  viewer,
  onOpenDesktop,
  onOpenPhone,
  onLater,
  onDismiss,
}: DesktopRequestTakeoverProps) {
  const [waking, setWaking] = useState(false);
  const done = useAtomSet(desktopRequestDoneMutation, { mode: "promise" });
  const finish = () => {
    if (orgId === undefined) return;
    setWaking(true);
    done({
      params: { orgId, jamId: rootJamId, toolCallId: row.toolCallId },
      reactivityKeys: [jamEventKey(rootJamId)],
    }).then(
      (result) => {
        if (!isAdmitted(result)) setWaking(false);
      },
      () => {
        toast.error("Could not send Done");
        setWaking(false);
      },
    );
  };
  const showViewer = phone !== undefined || machine.reachable;

  return (
    <RequestTakeoverView
      label={phone === undefined ? "Desktop request" : "Phone request"}
      heading={desktopRequestHeading(machine, phone)}
      reason={row.reason}
      onLater={onLater}
      onDismiss={onDismiss}
      actions={
        <>
          {showViewer && (
            <Button
              size="xs"
              variant="outline"
              onClick={() =>
                phone === undefined
                  ? onOpenDesktop(row.machine.jamId)
                  : onOpenPhone(phone)
              }
            >
              Open in tab
            </Button>
          )}
          <Button
            size="xs"
            intent="accent"
            disabled={orgId === undefined || waking}
            aria-busy={waking || undefined}
            onClick={finish}
          >
            {waking ? "Waking Capy" : "Done"}
          </Button>
        </>
      }
    >
      {showViewer ? <RequestViewport>{viewer}</RequestViewport> : null}
    </RequestTakeoverView>
  );
}
