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
import { organizationsAtom } from "@/data/atoms/session";
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
import {
  acceptInvitationAtom,
  decodeJoinableOrganizations,
  decodeMyInvitations,
  type JoinableOrganizationView,
  joinableOrganizationsAtom,
  joinByDomainAtom,
  joinedName,
  type MyInvitationView,
  myInvitationsAtom,
} from "./data";

/** Whether the Invitations dialog is open; anything can open it. */
export const invitationsDialogOpenAtom = Atom.make(false).pipe(Atom.keepAlive);

export const invitationProjectCount = (value: number) =>
  value === 0
    ? "no projects yet"
    : `${value} ${value === 1 ? "project" : "projects"}`;

/** "invite:<id>" or "domain:<orgId>" while that row is joining. */
export type InvitationsAccepting = string | null;

export type InvitationsTableProps = {
  invitations: ReadonlyArray<MyInvitationView> | undefined;
  invitationsFailed?: boolean;
  organizations: ReadonlyArray<JoinableOrganizationView> | undefined;
  organizationsFailed: boolean;
  onRetry: () => void;
  accepting: InvitationsAccepting;
  onAccept: (invitation: MyInvitationView) => void;
  onJoin: (organization: JoinableOrganizationView) => void;
};

const initials = (name: string) => {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
};

/** Capy's Avatar at `xs`, local until `src/primitives/avatar` lands. */
function OrgAvatar({ src, name }: { src: string | null; name: string }) {
  if (src !== null && src !== "")
    return (
      <span className="relative flex size-4 shrink-0 items-center justify-center overflow-hidden rounded bg-secondary">
        <img
          src={src}
          alt={name}
          className="absolute inset-0 size-full object-cover"
        />
      </span>
    );
  return (
    <span
      role="img"
      aria-label={name}
      className="flex size-4 shrink-0 items-center justify-center rounded bg-muted text-2xs font-medium text-foreground"
    >
      {initials(name)}
    </span>
  );
}

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
      <OrgAvatar src={avatarUrl} name={name} />
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

function SkeletonRow({ className }: { className: string }) {
  return (
    <TableRow interactive={false}>
      <TableCell className="col-span-full">
        <SkeletonPanel className={className} />
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
        <SkeletonRow className="h-3 w-2/3" />
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
            <SkeletonRow className="h-3 w-1/2" />
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
export function InvitationsDialog({
  open: controlledOpen,
  onOpenChange: onControlledOpenChange,
}: InvitationsDialogProps) {
  const navigate = useNavigate();
  const [atomOpen, setAtomOpen] = useAtom(invitationsDialogOpenAtom);
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlledOpen ?? (atomOpen || localOpen);
  const setOpen = (next: boolean) => {
    setAtomOpen(next);
    setLocalOpen(next);
    onControlledOpenChange?.(next);
  };

  const invitationsResult = useAtomValue(myInvitationsAtom);
  const organizationsResult = useAtomValue(joinableOrganizationsAtom);
  const invitations = decodeMyInvitations(
    AsyncResult.isSuccess(invitationsResult)
      ? invitationsResult.value
      : undefined,
  );
  const organizations = decodeJoinableOrganizations(
    AsyncResult.isSuccess(organizationsResult)
      ? organizationsResult.value
      : undefined,
  );
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
    setOpen(false);
    void navigate({ to: "/new" });
  };

  const onAccept = (invitation: MyInvitationView) => {
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

  const onJoin = (organization: JoinableOrganizationView) => {
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
    <Dialog open={open} onOpenChange={setOpen}>
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
