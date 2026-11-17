import { useAtomSet } from "@effect/atom-react";
import { Exit } from "effect";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { failureMessage } from "../model-routing/actions.ts";
import {
  removeCredentialAtom,
  routingKeys,
  useOrgId,
} from "../model-routing/atoms.ts";
import { modelIdOf } from "../model-routing/routing.ts";
import type { CatalogEntry, Credential } from "../model-routing/types.ts";
import { type RemovalRoute, removalSummary } from "./helpers.ts";
import { LoadingButton } from "./ui.tsx";

export type RemoveCredentialDialogProps = {
  credential: Credential;
  routes: ReadonlyArray<RemovalRoute>;
  lockedModels: ReadonlyArray<string>;
  catalog: ReadonlyArray<CatalogEntry>;
  onClose: () => void;
};

export function RemoveCredentialDialog({
  credential,
  routes,
  lockedModels,
  catalog,
  onClose,
}: RemoveCredentialDialogProps) {
  const orgId = useOrgId();
  const removeCredential = useAtomSet(removeCredentialAtom, {
    mode: "promiseExit",
  });
  const [removing, setRemoving] = useState(false);
  const nameOf = (model: string) =>
    catalog.find((entry) => modelIdOf(entry.id) === model)?.name ?? model;
  const { blocked, lines } = removalSummary(
    credential,
    routes,
    lockedModels,
    nameOf,
  );
  const remove = () => {
    if (orgId === undefined || blocked.length > 0) return;
    setRemoving(true);
    void removeCredential({
      params: { orgId, credentialId: credential.id },
      reactivityKeys: routingKeys(orgId),
    })
      .then((exit) => {
        if (Exit.isFailure(exit)) {
          toast.error(failureMessage(exit.cause, "Could not remove the key"));
          return;
        }
        toast.success(`${credential.name} removed`);
        onClose();
      })
      .finally(() => setRemoving(false));
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{`Remove ${credential.name}`}</DialogTitle>
          <DialogDescription>
            {blocked.length > 0
              ? `${blocked.join(", ")} run only on this key, turn off Only ${credential.name} or connect another key for them first`
              : lines.length === 0
                ? "The models it serves move to the next connection in the list"
                : "What serves its models next"}
          </DialogDescription>
        </DialogHeader>
        {lines.length === 0 || blocked.length > 0 ? null : (
          <DialogBody>
            {lines.map((line) => (
              <p
                key={line}
                className="text-sm font-normal text-muted-foreground-1"
              >
                {line}
              </p>
            ))}
          </DialogBody>
        )}
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <LoadingButton
            intent="danger"
            size="sm"
            loading={removing}
            disabled={blocked.length > 0}
            onClick={remove}
          >
            Remove
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
