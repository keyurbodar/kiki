import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { toast } from "sonner";
import type { OrgId } from "@/data/api/schemas/ids";
import {
  captainReactivityKeys,
  captainsAtom,
  joinCaptainCrewAtom,
} from "@/data/atoms/captains";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { DialogPage, DialogPages } from "@/primitives/dialog-pages";
import { Icon } from "@/primitives/icon";
import { MenuContent, MenuTrigger } from "@/primitives/menu";
import {
  ResponsiveMenu,
  ResponsiveMenuItem,
} from "@/primitives/responsive-menu";
import { demotedReleased, demotedTitle } from "./captain-dialog-model";
import { useOrgId } from "./session";

export type DemotedRequest = {
  readonly jamId: string;
  readonly name: string;
  readonly projectId: string | null;
  readonly released: number;
};

type CaptainRow = {
  readonly id: string;
  readonly name: string;
  readonly projectId?: string;
};

const captainRows = (value: unknown): CaptainRow[] =>
  Array.isArray(value)
    ? value.flatMap((row: unknown) => {
        const record =
          typeof row === "object" && row !== null
            ? (row as Record<string, unknown>)
            : {};
        return typeof record.id === "string" && typeof record.name === "string"
          ? [
              {
                id: record.id,
                name: record.name,
                projectId:
                  typeof record.projectId === "string"
                    ? record.projectId
                    : undefined,
              },
            ]
          : [];
      })
    : [];

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
  const captains = AsyncResult.isSuccess(result)
    ? captainRows(result.value).filter(
        (row) =>
          row.id !== request.jamId &&
          (request.projectId === null || row.projectId === request.projectId),
      )
    : [];
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogPages>
          <DialogPage data-page="done">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-1">
                <span className="min-w-0 truncate">
                  {demotedTitle(request.name)}
                </span>
              </DialogTitle>
            </DialogHeader>
            <DialogBody className="flex flex-col gap-3 px-5 py-4">
              <div className="flex flex-col gap-1 text-sm text-muted-foreground-2">
                <span>{demotedReleased(request.released)}</span>
                <span>
                  Add it to a Captain's crew to have another Captain own the
                  work
                </span>
              </div>
            </DialogBody>
            <DialogFooter className="flex flex-row justify-end gap-2 px-5 pb-4 border-t-hairline border-border-1 pt-4">
              <ResponsiveMenu>
                <MenuTrigger
                  render={
                    <Button variant="outline" type="button">
                      <Icon name="user-add" />
                      Add to a Captain's crew
                    </Button>
                  }
                />
                <MenuContent align="end" className="w-52">
                  {captains.map((captain) => (
                    <ResponsiveMenuItem
                      key={captain.id}
                      onClick={() => {
                        onClose();
                        join({
                          params: { orgId, jamId: captain.id },
                          payload: { threadId: request.jamId },
                          reactivityKeys: [
                            captainReactivityKeys.captain(captain.id),
                            captainReactivityKeys.jam(request.jamId),
                          ],
                        }).catch(() => toast.error("Could not add to crew"));
                      }}
                    >
                      {captain.name}
                    </ResponsiveMenuItem>
                  ))}
                </MenuContent>
              </ResponsiveMenu>
              <Button intent="accent" type="button" onClick={onClose}>
                Done
              </Button>
            </DialogFooter>
          </DialogPage>
        </DialogPages>
      </DialogContent>
    </Dialog>
  );
}
