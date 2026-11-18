import {
  useAtom,
  useAtomRefresh,
  useAtomSet,
  useAtomValue,
} from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { AsyncResult } from "effect/reactivity";
import { useState } from "react";
import type {
  JoinableOrganization,
  MyInvitation,
} from "@/data/api/schemas/invitation";
import {
  acceptInvitationAtom,
  joinableOrganizationsAtom,
  joinByDomainAtom,
  myInvitationsAtom,
} from "@/data/atoms/invitations";
import { organizationsAtom } from "@/data/atoms/session";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { toast } from "@/primitives/toaster";
import { InvitationsTable } from "./invitations-table";
import { acceptingKey, invitationsDialogOpenAtom } from "./invites-state";

const successValue = <A, E>(result: AsyncResult.AsyncResult<A, E>) =>
  AsyncResult.isSuccess(result) ? result.value : undefined;

export type InvitationsDialogProps = {
  onClosed?: () => void;
};

export function InvitationsDialog({ onClosed }: InvitationsDialogProps) {
  const [open, setOpen] = useAtom(invitationsDialogOpenAtom);
  const navigate = useNavigate();
  const invitationsResult = useAtomValue(myInvitationsAtom);
  const organizationsResult = useAtomValue(joinableOrganizationsAtom);
  const refreshInvitations = useAtomRefresh(myInvitationsAtom);
  const refreshJoinable = useAtomRefresh(joinableOrganizationsAtom);
  const refreshOrganizations = useAtomRefresh(organizationsAtom);
  const accept = useAtomSet(acceptInvitationAtom, { mode: "promise" });
  const join = useAtomSet(joinByDomainAtom, { mode: "promise" });
  const [accepting, setAccepting] = useState<string | null>(null);

  const invitations = successValue(invitationsResult);
  const organizations = successValue(organizationsResult);

  const refreshAll = () => {
    refreshInvitations();
    refreshJoinable();
    refreshOrganizations();
  };

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) onClosed?.();
  };

  const joined = (name: string) => {
    refreshAll();
    toast.success(`Joined ${name}`);
    setOpen(false);
    void navigate({ to: "/new" });
  };

  const run = (
    key: string,
    request: Promise<unknown>,
    name: string,
    fallback: string,
  ) => {
    setAccepting(key);
    request
      .then(() => joined(name))
      .catch(() => {
        toast.error(fallback);
        refreshAll();
      })
      .finally(() => setAccepting(null));
  };

  const onAccept = (invitation: MyInvitation) =>
    run(
      acceptingKey.invite(invitation.id),
      accept({ params: { invitationId: invitation.id } }),
      invitation.orgName,
      "This invitation is no longer available",
    );

  const onJoin = (organization: JoinableOrganization) =>
    run(
      acceptingKey.domain(organization.orgId),
      join({ params: { orgId: organization.orgId } }),
      organization.orgName,
      "This organization is no longer available to join",
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invitations</DialogTitle>
          <DialogDescription>
            Organizations available through invitations or your verified email
            domain
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="-mx-4 max-h-80 overflow-y-auto md:scroll-fade-y">
            <InvitationsTable
              invitations={invitations}
              invitationsFailed={
                AsyncResult.isFailure(invitationsResult) &&
                invitations === undefined
              }
              organizations={organizations}
              organizationsFailed={
                AsyncResult.isFailure(organizationsResult) &&
                organizations === undefined
              }
              onRetry={() => {
                refreshInvitations();
                refreshJoinable();
              }}
              accepting={accepting}
              onAccept={onAccept}
              onJoin={onJoin}
            />
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
