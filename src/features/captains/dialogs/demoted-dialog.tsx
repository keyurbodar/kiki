import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { toast } from "sonner";
import type { CaptainCard } from "@/data/api/schemas/captain";
import type { JamId, OrgId } from "@/data/api/schemas/ids";
import {
  captainReactivityKeys,
  captainsAtom,
  joinCaptainCrewAtom,
} from "@/data/atoms/captains";
import { reactivityKeys } from "@/data/atoms/conventions";
import { Button } from "@/primitives/button";
import { Dialog, DialogContent } from "@/primitives/dialog";
import type { DialogPageSpec } from "@/primitives/dialog-pages";
import { DialogPages } from "@/primitives/dialog-pages";
import { Icon } from "@/primitives/icon";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuTrigger,
} from "@/primitives/responsive-menu";
import { demotedReleased, demotedTitle } from "./captain-dialog-model";
import { useOrgId } from "./session";

export type DemotedRequest = {
  readonly jamId: JamId;
  readonly name: string;
  readonly projectId: string | null;
  readonly released: number;
};

export type DemotedDialogProps = {
  request: DemotedRequest;
  onClose: () => void;
};

/** Capy's DemotedDialog: the thread a Captain became, and a way into another crew. */
export function DemotedDialog(props: DemotedDialogProps) {
  const orgId = useOrgId();
  return orgId === undefined ? null : (
    <DemotedDialogView orgId={orgId} {...props} />
  );
}

function DemotedDialogView({
  orgId,
  request,
  onClose,
}: DemotedDialogProps & { orgId: OrgId }) {
  const result = useAtomValue(captainsAtom(orgId));
  const join = useAtomSet(joinCaptainCrewAtom, { mode: "promise" });
  const captains: ReadonlyArray<CaptainCard> = AsyncResult.isSuccess(result)
    ? result.value.filter(
        (row) =>
          row.id !== request.jamId &&
          (request.projectId === null || row.projectId === request.projectId),
      )
    : [];

  const joinCrew = (captain: CaptainCard) => {
    onClose();
    join({
      params: { orgId, jamId: captain.id },
      payload: { threadId: request.jamId },
      reactivityKeys: [
        reactivityKeys.captains(orgId),
        reactivityKeys.threads(orgId),
        captainReactivityKeys.captain(captain.id),
        captainReactivityKeys.jam(request.jamId),
      ],
    }).catch(() => toast.error("Could not add to crew"));
  };

  const pages: Record<"done", DialogPageSpec> = {
    done: {
      title: demotedTitle(request.name),
      body: (
        <div className="flex flex-col gap-1 text-sm text-muted-foreground-2">
          <span>{demotedReleased(request.released)}</span>
          <span>
            Add it to a Captain's crew to have another Captain own the work
          </span>
        </div>
      ),
      footer: (
        <>
          <ResponsiveMenu>
            <ResponsiveMenuTrigger
              render={
                <Button variant="outline" type="button">
                  <Icon name="user-add" />
                  Add to a Captain's crew
                </Button>
              }
            />
            <ResponsiveMenuContent align="end" className="w-52">
              {captains.map((captain) => (
                <ResponsiveMenuItem
                  key={captain.id}
                  onClick={() => joinCrew(captain)}
                >
                  {captain.face.name}
                </ResponsiveMenuItem>
              ))}
            </ResponsiveMenuContent>
          </ResponsiveMenu>
          <Button intent="accent" type="button" onClick={onClose}>
            Done
          </Button>
        </>
      ),
    },
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogPages page="done" root="done" pages={pages} onBack={onClose} />
      </DialogContent>
    </Dialog>
  );
}
