import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { AsyncResult } from "effect/reactivity";
import { useEffect } from "react";
import { organizationsAtom } from "@/data/atoms/session";
import { InvitationsDialog } from "./invitations-dialog";
import { InvitesEmpty } from "./invites-empty";
import {
  invitationsDialogOpenAtom,
  shouldOpenInvitations,
} from "./invites-state";

export function InvitesPage() {
  const result = useAtomValue(organizationsAtom);
  const setOpen = useAtomSet(invitationsDialogOpenAtom);
  const navigate = useNavigate();
  const open = shouldOpenInvitations({
    organizations: AsyncResult.isSuccess(result) ? result.value : undefined,
    failed: AsyncResult.isFailure(result),
    waiting: result.waiting,
  });

  useEffect(() => {
    if (open) setOpen(true);
  }, [open, setOpen]);

  // Still resolving: neither an invitation to show nor an empty list to claim.
  if (!open && result.waiting && !AsyncResult.isFailure(result)) return null;
  if (!open) return <InvitesEmpty />;
  return (
    <InvitationsDialog
      onClosed={() => void navigate({ to: "/new", replace: true })}
    />
  );
}
