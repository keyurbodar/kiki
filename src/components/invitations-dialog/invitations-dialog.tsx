import {
  useAtom,
  useAtomRefresh,
  useAtomSet,
  useAtomValue,
} from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { AsyncResult, Atom } from "effect/reactivity";
import { useState } from "react";
import { toast } from "sonner";
import type {
  JoinableOrganization,
  MyInvitation,
} from "@/data/api/schemas/member";
import { acceptInvitationAtom, joinByDomainAtom } from "@/data/atoms/members";
import {
  joinableOrganizationsAtom,
  myInvitationsAtom,
} from "@/data/atoms/onboarding";
import { organizationsAtom } from "@/data/atoms/session";
import { Avatar } from "@/primitives/avatar";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { SkeletonPanel } from "@/primitives/skeleton-panel";
import { Table, TableCell, TableGroup, TableRow } from "@/primitives/table";

/** Whether the Invitations dialog is open; anything can open it. */
export const invitationsDialogOpenAtom = Atom.make(false).pipe(Atom.keepAlive);

export const invitationProjectCount = (count: number) =>
  count === 0
    ? "no projects yet"
    : `${count} ${count === 1 ? "project" : "projects"}`;

/** "invite:<id>" or "domain:<orgId>" while that row is joining. */
export type InvitationsAccepting = string | null;

export type InvitationsTableProps = {
  invitations: ReadonlyArray<MyInvitation> | undefined;
  invitationsFailed?: boolean;
  organizations: ReadonlyArray<JoinableOrganization> | undefined;
  organizationsFailed: boolean;
  onRetry: () => void;
  accepting: InvitationsAccepting;
  onAccept: (invitation: MyInvitation) => void;
  onJoin: (organization: JoinableOrganization) => void;
};

function JoinButton({
  id,
  accepting,
  label,
  onClick,
}: {
  id: string;
  accepting: InvitationsAccepting;
  label: string;
  onClick: () => void;
}) {
  const loading = accepting === id;
  return (
    <Button
      intent="neutral"
      disabled={loading || (accepting !== null && !loading)}
      aria-busy={loading || undefined}
      onClick={onClick}
    >
      {loading ? "Joining" : label}
    </Button>
  );
}

function OrgCell({
  name,
  avatarUrl,
  detail,
}: {
  name: string;
  avatarUrl: string | null;
  detail: string;
}) {
  return (
    <TableCell className="gap-2.5">
      <Avatar src={avatarUrl} name={name} size="xs" />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-sm font-medium text-foreground">
          {name}
        </span>
        <span className="truncate text-muted-foreground-2">{detail}</span>
      </span>
    </TableCell>
  );
}

function MessageRow({
  children,
  onRetry,
}: {
  children: string;
  onRetry: () => void;
}) {
  return (
    <TableRow interactive={false}>
      <TableCell className="col-span-full justify-center gap-3">
        <span>{children}</span>
        <Button intent="neutral" onClick={onRetry}>
          Try again
        </Button>
      </TableCell>
    </TableRow>
  );
}

/** Capy's InvitationsTable: pending invitations, then orgs open to your email domain. */
export function InvitationsTable({
  invitations,
  invitationsFailed = false,
  organizations,
  organizationsFailed,
  onRetry,
  accepting,
  onAccept,
  onJoin,
}: InvitationsTableProps) {
  return (
    <Table columns="minmax(0,1fr) auto">
      <TableGroup label="Pending" count={invitations?.length} />
      {invitationsFailed ? (
        <MessageRow onRetry={onRetry}>
          Could not load your invitations
        </MessageRow>
      ) : invitations === undefined ? (
        <TableRow interactive={false}>
          <TableCell className="col-span-full">
            <SkeletonPanel className="h-3 w-2/3" />
          </TableCell>
        </TableRow>
      ) : invitations.length === 0 ? (
        <TableRow interactive={false}>
          <TableCell className="col-span-full justify-center">
            No pending invitations
          </TableCell>
        </TableRow>
      ) : (
        invitations.map((invitation) => (
          <TableRow key={invitation.id}>
            <OrgCell
              name={invitation.orgName}
              avatarUrl={invitation.orgAvatarUrl}
              detail={`${invitation.inviterName} invited you · ${invitationProjectCount(invitation.projectCount)}`}
            />
            <TableCell className="justify-end pr-0">
              <JoinButton
                id={`invite:${invitation.id}`}
                accepting={accepting}
                label="Accept"
                onClick={() => onAccept(invitation)}
              />
            </TableCell>
          </TableRow>
        ))
      )}
      {(organizationsFailed ||
        organizations === undefined ||
        organizations.length > 0) && (
        <>
          <TableGroup
            label="Available through your email domain"
            count={organizations?.length}
          />
          {organizationsFailed ? (
            <MessageRow onRetry={onRetry}>
              Could not load organizations to join
            </MessageRow>
          ) : organizations === undefined ? (
            <TableRow interactive={false}>
              <TableCell className="col-span-full">
                <SkeletonPanel className="h-3 w-1/2" />
              </TableCell>
            </TableRow>
          ) : (
            organizations.map((organization) => (
              <TableRow key={organization.orgId}>
                <OrgCell
                  name={organization.orgName}
                  avatarUrl={organization.orgAvatarUrl}
                  detail={invitationProjectCount(organization.projectCount)}
                />
                <TableCell className="justify-end pr-0">
                  <JoinButton
                    id={`domain:${organization.orgId}`}
                    accepting={accepting}
                    label="Join"
                    onClick={() => onJoin(organization)}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </>
      )}
    </Table>
  );
}

const resultList = <A,>(
  result: AsyncResult.AsyncResult<unknown, unknown>,
): ReadonlyArray<A> | undefined => {
  if (!AsyncResult.isSuccess(result)) return undefined;
  const value = result.value;
  if (Array.isArray(value)) return value as ReadonlyArray<A>;
  if (value !== null && typeof value === "object" && "invitations" in value) {
    const list = (value as { invitations: unknown }).invitations;
    if (Array.isArray(list)) return list as ReadonlyArray<A>;
  }
  return undefined;
};

const joinedName = (value: unknown, fallback: string) =>
  typeof value === "object" &&
  value !== null &&
  "name" in value &&
  typeof value.name === "string"
    ? value.name
    : fallback;

const failureText = (error: unknown, fallback: string) =>
  typeof error === "object" &&
  error !== null &&
  "_tag" in error &&
  typeof error._tag === "string" &&
  error._tag.startsWith("capy/") &&
  "message" in error &&
  typeof error.message === "string" &&
  error.message.length > 0
    ? error.message
    : fallback;

export type InvitationsDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/** Capy's Invitations dialog: accept an invitation or join an org through your email domain. */
export function InvitationsDialog(props: InvitationsDialogProps) {
  const [fallbackOpen, setFallbackOpen] = useState(false);
  return (
    <StandaloneInvitationsDialog
      controlledOpen={props.open ?? fallbackOpen}
      onControlledOpenChange={props.onOpenChange ?? setFallbackOpen}
    />
  );
}

function StandaloneInvitationsDialog({
  controlledOpen,
  onControlledOpenChange,
}: {
  controlledOpen: boolean;
  onControlledOpenChange: (open: boolean) => void;
}) {
  const [open, setOpen] = useAtom(invitationsDialogOpenAtom);
  const activeOpen = controlledOpen || open;
  const setActiveOpen = (next: boolean) => {
    onControlledOpenChange(next);
    setOpen(next);
  };
  const navigate = useNavigate();
  const invitationsResult = useAtomValue(myInvitationsAtom);
  const organizationsResult = useAtomValue(joinableOrganizationsAtom);
  const invitations = resultList<MyInvitation>(invitationsResult);
  const organizations = resultList<JoinableOrganization>(organizationsResult);
  const refreshInvitations = useAtomRefresh(myInvitationsAtom);
  const refreshJoinable = useAtomRefresh(joinableOrganizationsAtom);
  const refreshOrganizations = useAtomRefresh(organizationsAtom);
  const accept = useAtomSet(acceptInvitationAtom, { mode: "promise" });
  const join = useAtomSet(joinByDomainAtom, { mode: "promise" });
  const [accepting, setAccepting] = useState<InvitationsAccepting>(null);

  const refreshAll = () => {
    refreshInvitations();
    refreshJoinable();
    refreshOrganizations();
  };

  const joined = (organization: unknown, fallbackName: string) => {
    refreshAll();
    toast.success(`Joined ${joinedName(organization, fallbackName)}`);
    setActiveOpen(false);
    void navigate({ to: "/new" });
  };

  const onAccept = (invitation: MyInvitation) => {
    setAccepting(`invite:${invitation.id}`);
    accept({ params: { invitationId: invitation.id } })
      .then((organization) => joined(organization, invitation.orgName))
      .catch((error: unknown) => {
        toast.error(
          failureText(error, "This invitation is no longer available"),
        );
        refreshAll();
      })
      .finally(() => setAccepting(null));
  };

  const onJoin = (organization: JoinableOrganization) => {
    setAccepting(`domain:${organization.orgId}`);
    join({ params: { orgId: organization.orgId } })
      .then((result) => joined(result, organization.orgName))
      .catch((error: unknown) => {
        toast.error(
          failureText(
            error,
            "This organization is no longer available to join",
          ),
        );
        refreshAll();
      })
      .finally(() => setAccepting(null));
  };

  return (
    <Dialog open={activeOpen} onOpenChange={setActiveOpen}>
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
