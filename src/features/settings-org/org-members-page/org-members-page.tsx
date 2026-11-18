import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { DateTime } from "effect";
import { AsyncResult } from "effect/reactivity";
import { type FormEvent, memo, useState } from "react";
import { FailedRead } from "@/components/failed-read";
import { SettingsPage } from "@/components/settings-page";
import type { Organization } from "@/data/api/schemas/organization";
import {
  currentUserAtom,
  organizationsAtom,
  useActiveOrgId,
} from "@/data/atoms/session";
import { Badge } from "@/primitives/badge";
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
import { Icon } from "@/primitives/icon";
import { Input, InputGroup } from "@/primitives/input";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuSub,
  MenuSubTrigger,
  MenuTrigger,
} from "@/primitives/menu";
import {
  MenuSelect,
  MenuSelectContent,
  MenuSelectItem,
  MenuSelectTrigger,
  MenuSelectValue,
} from "@/primitives/menu-select";
import {
  SortableTableHeaderCell,
  Table,
  TableCell,
  TableGroup,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "@/primitives/table";
import { Textarea } from "@/primitives/textarea";
import { toast } from "@/primitives/toaster";
import { MemberAvatar } from "./avatar";
import {
  type AccessLevel,
  clearMemberMfaExtensionAtom,
  decodeInvitations,
  decodeInviteOutcomes,
  decodeMembers,
  grantOwnerAtom,
  type InvitationView,
  inviteToOrgAtom,
  type MemberView,
  memberReactivityKeys,
  orgInvitationsAtom,
  orgMembersAtom,
  removeMemberAtom,
  restoreMemberAtom,
  revokeInvitationAtom,
  revokeOwnerAtom,
  setMemberMfaExtensionAtom,
  setMemberRoleAtom,
} from "./data";
import {
  assignableRoles,
  defaultSort,
  type ExtendDays,
  errorMessage,
  extendedDeadline,
  extendOptions,
  extensionAfter,
  formatJoined,
  formatShortDate,
  invitationSortValue,
  type MfaLevel,
  matchesInactive,
  matchesInvitation,
  matchesMember,
  meetsMfa,
  memberName,
  memberSortValue,
  nextSort,
  parseEmails,
  type RoleFilter,
  roleArticle,
  roleFilterLabels,
  roleItemDisabled,
  roleLabels,
  type SortKey,
  type SortState,
  sortRows,
  summarizeInvites,
} from "./model";

const columns =
  "minmax(0,3fr) minmax(0,2fr) minmax(6rem,auto) minmax(5.5rem,auto) auto";

const adminReasonFor = (accessLevel: AccessLevel | undefined) =>
  accessLevel === "admin" || accessLevel === "owner"
    ? undefined
    : "Only organization admins can change this";

const valueOr = <A,>(
  result: AsyncResult.AsyncResult<A, unknown>,
  fallback: A,
) => (AsyncResult.isSuccess(result) ? result.value : fallback);

const noMembers: ReadonlyArray<MemberView> = [];
const noInvitations: ReadonlyArray<InvitationView> = [];

function RowActionsIcon() {
  return <Icon name="dot-grid-1x3-horizontal" />;
}

type MemberRowProps = {
  member: MemberView;
  owners: number;
  isAdmin: boolean;
  accessLevel: AccessLevel | undefined;
  adminReason: string | undefined;
  viewerId: string | undefined;
  busy: boolean;
  mfaRequired: boolean;
  mfaLevel: MfaLevel;
  mfaEnforceAt: Date | null;
  onChangeRole: (member: MemberView, role: AccessLevel) => void;
  onRemove: (member: MemberView) => void;
  onExtend: (member: MemberView) => void;
  onClearExtension: (member: MemberView) => void;
};

const MemberRow = memo(function MemberRow({
  member,
  owners,
  isAdmin,
  accessLevel,
  adminReason,
  viewerId,
  busy,
  mfaRequired,
  mfaLevel,
  mfaEnforceAt,
  onChangeRole,
  onRemove,
  onExtend,
  onClearExtension,
}: MemberRowProps) {
  const needsMfa = mfaRequired && !meetsMfa(member, mfaLevel);
  const deadline = needsMfa
    ? extensionAfter(member, Math.max(Date.now(), mfaEnforceAt?.getTime() ?? 0))
    : undefined;
  const viewerIsOwner = accessLevel === "owner";
  const lastOwner = member.accessLevel === "owner" && owners <= 1;
  const canManage =
    isAdmin && (member.accessLevel !== "owner" || accessLevel === "owner");
  const reason =
    adminReason ??
    (member.accessLevel === "owner" && !viewerIsOwner
      ? "Only organization owners can change owners"
      : undefined);
  const name = memberName(member);
  const actionable = canManage || (isAdmin && needsMfa);
  const removeDisabled =
    !canManage ||
    lastOwner ||
    viewerId === undefined ||
    member.userId === viewerId;

  return (
    <TableRow>
      <TableCell className="gap-2.5">
        <MemberAvatar size="sm" src={member.imageUrl} name={name} />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-foreground">
            {name}
          </span>
        </span>
      </TableCell>
      <TableCell>
        <span className="truncate">{member.email}</span>
      </TableCell>
      <TableCell className="gap-1.5">
        <Badge color={member.accessLevel === "owner" ? "accent" : "neutral"}>
          {roleLabels[member.accessLevel]}
        </Badge>
        {deadline === undefined ? (
          member.passkeyTrusted ? (
            <Badge variant="ghost">Passkey</Badge>
          ) : member.mfaEnabled ? (
            <Badge variant="ghost">Two-step</Badge>
          ) : member.enterpriseSso ? (
            <Badge variant="ghost">SSO</Badge>
          ) : null
        ) : (
          <Badge
            variant="ghost"
            title={
              mfaLevel === "passkey"
                ? "Passkey deadline for this member"
                : "Two-step verification deadline for this member"
            }
          >
            {mfaLevel === "passkey" ? "Passkey" : "Two-step"} by{" "}
            {formatShortDate(deadline)}
          </Badge>
        )}
      </TableCell>
      <TableCell>{formatJoined(member.createdAt)}</TableCell>
      <TableCell className="justify-end">
        <Menu>
          <MenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={!actionable || busy}
                title={actionable ? undefined : reason}
                aria-label={`Actions for ${name}`}
              >
                <RowActionsIcon />
              </Button>
            }
          />
          <MenuContent align="end" className="w-48">
            <MenuSub>
              <MenuSubTrigger>Set role</MenuSubTrigger>
              <MenuContent className="w-[8.375rem]">
                {assignableRoles.map((role) => (
                  <MenuItem
                    key={role}
                    disabled={roleItemDisabled(
                      role,
                      member,
                      viewerIsOwner,
                      lastOwner,
                    )}
                    onClick={() => onChangeRole(member, role)}
                  >
                    {roleLabels[role]}
                    {member.accessLevel === role && (
                      <Icon
                        name="checkmark-1"
                        className="ml-auto size-(--icon-sm) shrink-0 text-foreground"
                      />
                    )}
                  </MenuItem>
                ))}
              </MenuContent>
            </MenuSub>
            {needsMfa && (
              <>
                <MenuItem onClick={() => onExtend(member)}>
                  Extend two-step deadline
                </MenuItem>
                {deadline !== undefined && (
                  <MenuItem onClick={() => onClearExtension(member)}>
                    Remove extension
                  </MenuItem>
                )}
              </>
            )}
            <MenuSeparator />
            <MenuItem
              intent="danger"
              disabled={removeDisabled}
              onClick={() => onRemove(member)}
            >
              Remove from organization
            </MenuItem>
          </MenuContent>
        </Menu>
      </TableCell>
    </TableRow>
  );
});

type InvitationRowProps = {
  invitation: InvitationView;
  canRevoke: boolean;
  revoking: boolean;
  onRevoke: (invitation: InvitationView) => void;
};

function InvitationRow({
  invitation,
  canRevoke,
  revoking,
  onRevoke,
}: InvitationRowProps) {
  return (
    <TableRow>
      <TableCell className="gap-2.5">
        <MemberAvatar size="sm" src={null} name={invitation.email} />
        <span className="truncate text-sm font-medium text-foreground">
          {invitation.email}
        </span>
      </TableCell>
      <TableCell>
        <span className="truncate">{invitation.email}</span>
      </TableCell>
      <TableCell>
        <Badge color="neutral">Invited</Badge>
      </TableCell>
      <TableCell />
      <TableCell className="justify-end">
        <Menu>
          <MenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={!canRevoke || revoking}
                title={
                  canRevoke
                    ? undefined
                    : "Only the inviter or an organization admin can revoke this"
                }
                aria-label={`Actions for invitation to ${invitation.email}`}
              >
                <RowActionsIcon />
              </Button>
            }
          />
          <MenuContent align="end" className="w-44">
            <MenuItem intent="danger" onClick={() => onRevoke(invitation)}>
              Revoke invitation
            </MenuItem>
          </MenuContent>
        </Menu>
      </TableCell>
    </TableRow>
  );
}

type InactiveMemberRowsProps = {
  orgId: string;
  members: ReadonlyArray<MemberView>;
  query: string;
  role: RoleFilter;
  isOwner: boolean;
  sort: SortState;
};

function InactiveMemberRows({
  orgId,
  members,
  query,
  role,
  isOwner,
  sort,
}: InactiveMemberRowsProps) {
  const restore = useAtomSet(restoreMemberAtom, { mode: "promise" });
  const [restoring, setRestoring] = useState<string | null>(null);
  const rows = sortRows(
    members.filter((member) => matchesInactive(member, query, role)),
    (member) =>
      sort.key === "status" ? "Inactive" : memberSortValue(member, sort.key),
    sort.direction,
    memberName,
  );
  if (rows.length === 0) return null;

  const restoreAs = (member: MemberView, accessLevel: AccessLevel) => {
    setRestoring(member.userId);
    restore({
      params: { orgId, userId: member.userId },
      payload: { accessLevel, role: accessLevel },
      reactivityKeys: memberReactivityKeys.members(orgId),
    })
      .then(() =>
        toast.success(
          `${memberName(member)} restored as ${roleArticle(accessLevel)}`,
        ),
      )
      .catch((error: unknown) =>
        toast.error(
          errorMessage(error, `Could not restore ${memberName(member)}`),
        ),
      )
      .finally(() => setRestoring(null));
  };

  return (
    <>
      <TableGroup label="Inactive" count={rows.length} />
      {rows.map((member) => {
        const name = memberName(member);
        return (
          <TableRow key={member.userId}>
            <TableCell className="gap-2.5">
              <MemberAvatar size="sm" src={member.imageUrl} name={name} />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-foreground">
                  {name}
                </span>
              </span>
            </TableCell>
            <TableCell>
              <span className="truncate">{member.email}</span>
            </TableCell>
            <TableCell>
              <Badge color="neutral">Inactive</Badge>
            </TableCell>
            <TableCell>{formatJoined(member.createdAt)}</TableCell>
            <TableCell className="justify-end">
              <Menu>
                <MenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={restoring === member.userId}
                      aria-label={`Actions for inactive member ${name}`}
                    >
                      <RowActionsIcon />
                    </Button>
                  }
                />
                <MenuContent align="end" className="w-44">
                  <MenuSub>
                    <MenuSubTrigger>Restore as</MenuSubTrigger>
                    <MenuContent className="w-[8.375rem]">
                      {assignableRoles.map((accessLevel) => (
                        <MenuItem
                          key={accessLevel}
                          disabled={accessLevel === "owner" && !isOwner}
                          onClick={() => restoreAs(member, accessLevel)}
                        >
                          {roleLabels[accessLevel]}
                        </MenuItem>
                      ))}
                    </MenuContent>
                  </MenuSub>
                </MenuContent>
              </Menu>
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
}

type ExtendTwoStepDialogProps = {
  target: MemberView | null;
  enforceAt: Date | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: (member: MemberView, until: Date) => void;
};

function ExtendTwoStepDialog({
  target,
  enforceAt,
  pending,
  onClose,
  onConfirm,
}: ExtendTwoStepDialogProps) {
  const [days, setDays] = useState<ExtendDays>("14");
  const now = Date.now();
  const deadline =
    enforceAt !== null && enforceAt.getTime() > now ? enforceAt : undefined;
  const until = extendedDeadline(days, enforceAt, now);
  const name = target === null ? "this member" : memberName(target);
  return (
    <Dialog
      open={target !== null}
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Extend {name}'s deadline?</DialogTitle>
          <DialogDescription>
            {name} has until {formatShortDate(until)} to set up two-step
            verification. Their API keys, Slack, Linear and paired devices keep
            working until then
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-normal text-foreground">
              {deadline === undefined
                ? "From today"
                : `After the ${formatShortDate(deadline)} deadline`}
            </span>
            <MenuSelect
              items={extendOptions}
              value={days}
              disabled={pending}
              onValueChange={(value) => {
                if (value !== null) setDays(value as ExtendDays);
              }}
            >
              <MenuSelectTrigger className="w-40">
                <MenuSelectValue />
              </MenuSelectTrigger>
              <MenuSelectContent>
                {(Object.keys(extendOptions) as Array<ExtendDays>).map(
                  (value) => (
                    <MenuSelectItem key={value} value={value}>
                      {extendOptions[value]}
                    </MenuSelectItem>
                  ),
                )}
              </MenuSelectContent>
            </MenuSelect>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" disabled={pending} onClick={onClose}>
            Cancel
          </Button>
          <Button
            intent="accent"
            disabled={pending}
            aria-busy={pending || undefined}
            onClick={() => {
              if (target !== null) onConfirm(target, until);
            }}
          >
            {pending ? "Saving" : "Extend deadline"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type RemoveMemberDialogProps = {
  target: MemberView | null;
  orgName: string | undefined;
  onClose: () => void;
  onConfirm: (member: MemberView) => void;
};

function RemoveMemberDialog({
  target,
  orgName,
  onClose,
  onConfirm,
}: RemoveMemberDialogProps) {
  return (
    <Dialog
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Remove {target === null ? "member" : memberName(target)}?
          </DialogTitle>
          <DialogDescription>
            They lose access to {orgName ?? "this organization"} immediately
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            intent="danger"
            onClick={() => {
              if (target !== null) onConfirm(target);
              onClose();
            }}
          >
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type InviteMembersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
};

function InviteMembersDialog({
  open,
  onOpenChange,
  orgId,
}: InviteMembersDialogProps) {
  const invite = useAtomSet(inviteToOrgAtom, { mode: "promise" });
  const [emails, setEmails] = useState("");
  const [inviting, setInviting] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const list = parseEmails(emails);
    if (list.length === 0) return;
    setInviting(true);
    invite({
      params: { orgId },
      payload: { emails: list },
      reactivityKeys: memberReactivityKeys.invitations(orgId),
    })
      .then((result) => {
        const { sent, skipped } = summarizeInvites(
          decodeInviteOutcomes(result),
        );
        if (sent > 0) {
          toast.success(
            sent === 1 ? "Invitation sent" : `${sent} invitations sent`,
            {
              description:
                skipped.length > 0
                  ? `Skipped ${skipped.join(", ")}`
                  : undefined,
            },
          );
          onOpenChange(false);
          setEmails("");
        } else {
          toast.error("No invitations sent", {
            description: skipped.join(", "),
          });
        }
      })
      .catch((error: unknown) =>
        toast.error(errorMessage(error, "Could not create invitations")),
      )
      .finally(() => setInviting(false));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Invite members</DialogTitle>
            <DialogDescription>
              Each address gets an invitation email, paste a list separated by
              commas or new lines
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            {/* biome-ignore lint/a11y/noLabelWithoutControl: the label wraps Textarea, which renders the textarea */}
            <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
              Emails
              <Textarea
                placeholder={"teammate@example.com\nanother@example.com"}
                value={emails}
                onChange={(event) => setEmails(event.target.value)}
                rows={4}
                autoFocus
                required
              />
            </label>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="ghost"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              intent="accent"
              type="submit"
              disabled={inviting}
              aria-busy={inviting || undefined}
            >
              {inviting ? "Inviting" : "Invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Settings → Organization → Members (Capy's SettingsOrgMembersPage). */
export function OrgMembersPage() {
  const organizationsResult = useAtomValue(organizationsAtom);
  const organizations = valueOr(organizationsResult, []);
  const activeOrgId = useActiveOrgId();
  const organization: Organization | undefined = organizations.find(
    (candidate) => candidate.id === activeOrgId,
  );
  const viewer = useAtomValue(currentUserAtom);
  const viewerId = AsyncResult.isSuccess(viewer) ? viewer.value.id : undefined;
  const refreshOrganizations = useAtomRefresh(organizationsAtom);
  // A failed organizations read is not "you have no organization": the page
  // used to render its title and nothing else, which reads as an empty org.
  if (AsyncResult.isFailure(organizationsResult)) {
    return (
      <SettingsPage title="Members" width="wide">
        <FailedRead
          slot="members-org-failed"
          line="Couldn't load your organization"
          sub="Check your connection and try again"
          onRetry={refreshOrganizations}
        />
      </SettingsPage>
    );
  }
  return organization === undefined ? (
    <SettingsPage title="Members" width="wide" />
  ) : (
    <OrgMembersContent
      key={organization.id}
      organization={organization}
      viewerId={viewerId}
      onViewerRoleChanged={refreshOrganizations}
    />
  );
}

type OrgMembersContentProps = {
  organization: Organization;
  viewerId: string | undefined;
  onViewerRoleChanged: () => void;
};

function OrgMembersContent({
  organization,
  viewerId,
  onViewerRoleChanged,
}: OrgMembersContentProps) {
  const orgId = organization.id;
  const memberResult = useAtomValue(orgMembersAtom(orgId));
  const invitationResult = useAtomValue(orgInvitationsAtom(orgId));
  const members: ReadonlyArray<MemberView> = AsyncResult.isSuccess(memberResult)
    ? decodeMembers(memberResult.value)
    : noMembers;
  const invitations: ReadonlyArray<InvitationView> = AsyncResult.isSuccess(
    invitationResult,
  )
    ? decodeInvitations(invitationResult.value)
    : noInvitations;
  const setRole = useAtomSet(setMemberRoleAtom, { mode: "promise" });
  const removeMember = useAtomSet(removeMemberAtom, { mode: "promise" });
  const grantOwner = useAtomSet(grantOwnerAtom, { mode: "promise" });
  const revokeOwner = useAtomSet(revokeOwnerAtom, { mode: "promise" });
  const revokeInvitation = useAtomSet(revokeInvitationAtom, {
    mode: "promise",
  });
  const setExtension = useAtomSet(setMemberMfaExtensionAtom, {
    mode: "promise",
  });
  const clearExtension = useAtomSet(clearMemberMfaExtensionAtom, {
    mode: "promise",
  });

  const [extendTarget, setExtendTarget] = useState<MemberView | null>(null);
  const [extending, setExtending] = useState(false);
  const [query, setQuery] = useState("");
  const [role, setRoleFilter] = useState<RoleFilter>("all");
  const [sort, setSort] = useState<SortState>(defaultSort);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<MemberView | null>(null);

  const accessLevel = organization.accessLevel;
  const isAdmin = accessLevel === "admin" || accessLevel === "owner";
  const adminReason = adminReasonFor(accessLevel);
  const isOwner = accessLevel === "owner";
  const mfaLevel: MfaLevel = organization.mfaLevel;
  const mfaEnforceAt =
    organization.mfaEnforceAt === null
      ? null
      : new Date(DateTime.toEpochMillis(organization.mfaEnforceAt));

  const membersFailed = AsyncResult.isFailure(memberResult);
  const refreshMembers = useAtomRefresh(orgMembersAtom(orgId));

  const active = members.filter((member) => !member.disabled);
  const owners = active.filter(
    (member) => member.accessLevel === "owner",
  ).length;
  const activeRows = sortRows(
    active.filter((member) => matchesMember(member, query, role, mfaLevel)),
    (member) => memberSortValue(member, sort.key),
    sort.direction,
    memberName,
  );
  const invitedRows = sortRows(
    invitations.filter((invitation) =>
      matchesInvitation(invitation, query, role),
    ),
    (invitation) => invitationSortValue(invitation, sort.key),
    sort.direction,
    (invitation) => invitation.email,
  );
  const sortBy = (key: SortKey) => setSort((current) => nextSort(current, key));
  const directionOf = (key: SortKey) =>
    sort.key === key ? sort.direction : undefined;

  const changeRole = (member: MemberView, next: AccessLevel) => {
    if (member.accessLevel === next) return;
    setBusyUserId(member.userId);
    const params = { orgId, userId: member.userId };
    const reactivityKeys = memberReactivityKeys.members(orgId);
    const request =
      next === "owner"
        ? grantOwner({ params, reactivityKeys })
        : member.accessLevel === "owner"
          ? revokeOwner({
              params,
              payload: { accessLevel: next, role: next },
              reactivityKeys,
            })
          : setRole({
              params,
              payload: { accessLevel: next, role: next },
              reactivityKeys,
            });
    request
      .then(() => {
        toast.success(`${memberName(member)} is now ${roleArticle(next)}`);
        if (member.userId === viewerId) onViewerRoleChanged();
      })
      .catch((error: unknown) =>
        toast.error(
          errorMessage(error, `Could not change ${memberName(member)}'s role`),
        ),
      )
      .finally(() => setBusyUserId(null));
  };

  const extend = (member: MemberView, until: Date) => {
    setExtending(true);
    setExtension({
      params: { orgId, userId: member.userId },
      payload: { until: until.toISOString() },
      reactivityKeys: memberReactivityKeys.mfa(orgId),
    })
      .then(() => {
        setExtendTarget(null);
        toast.success(
          `${memberName(member)} has until ${formatShortDate(until)}`,
        );
      })
      .catch((error: unknown) =>
        toast.error(
          errorMessage(
            error,
            `Could not extend ${memberName(member)}'s deadline`,
          ),
        ),
      )
      .finally(() => setExtending(false));
  };

  const removeExtension = (member: MemberView) => {
    setBusyUserId(member.userId);
    clearExtension({
      params: { orgId, userId: member.userId },
      reactivityKeys: memberReactivityKeys.mfa(orgId),
    })
      .then(() => toast.success(`Removed ${memberName(member)}'s extension`))
      .catch((error: unknown) =>
        toast.error(
          errorMessage(
            error,
            `Could not remove ${memberName(member)}'s extension`,
          ),
        ),
      )
      .finally(() => setBusyUserId(null));
  };

  const remove = (member: MemberView) => {
    removeMember({
      params: { orgId, userId: member.userId },
      reactivityKeys: memberReactivityKeys.members(orgId),
    })
      .then(() => toast.success(`${memberName(member)} removed`))
      .catch((error: unknown) =>
        toast.error(
          errorMessage(error, `Could not remove ${memberName(member)}`),
        ),
      );
  };

  const revoke = (invitation: InvitationView) => {
    setRevokingId(invitation.id);
    revokeInvitation({
      params: { orgId, invitationId: invitation.id },
      reactivityKeys: memberReactivityKeys.invitations(orgId),
    })
      .then(() => toast.success(`Invitation to ${invitation.email} revoked`))
      .catch((error: unknown) =>
        toast.error(errorMessage(error, "Could not revoke invitation")),
      )
      .finally(() => setRevokingId(null));
  };

  return (
    <SettingsPage title="Members" width="wide">
      <section className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-6">
          <div className="flex min-w-0 grow items-center gap-1.5">
            <div className="w-full max-w-75">
              <InputGroup className="relative inline-flex w-full">
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-icon-muted [&_svg]:size-(--icon-sm)"
                >
                  <Icon name="magnifying-glass" />
                </span>
                <Input
                  className="pl-8"
                  placeholder="Search by name or email"
                  aria-label="Search members"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </InputGroup>
            </div>
            <MenuSelect
              items={roleFilterLabels}
              value={role}
              onValueChange={(value) => setRoleFilter(value as RoleFilter)}
            >
              <MenuSelectTrigger size="base" className="w-28 shrink-0">
                <MenuSelectValue />
              </MenuSelectTrigger>
              <MenuSelectContent>
                <MenuSelectItem value="all">All roles</MenuSelectItem>
                <MenuSelectItem value="owner">Owner</MenuSelectItem>
                <MenuSelectItem value="admin">Admin</MenuSelectItem>
                <MenuSelectItem value="member">Member</MenuSelectItem>
                <MenuSelectItem value="neither">
                  Neither two-step nor SSO
                </MenuSelectItem>
              </MenuSelectContent>
            </MenuSelect>
          </div>
          <Button
            variant="solid"
            size="base"
            intent="neutral"
            onClick={() => setInviteOpen(true)}
          >
            Invite
          </Button>
        </div>
        {membersFailed ? (
          <div className="-mx-4">
            <FailedRead
              slot="members-failed"
              line="Couldn't load your members"
              sub="Check your connection and try again"
              onRetry={refreshMembers}
            />
          </div>
        ) : (
          <div className="-mx-4">
            <Table columns={columns}>
              <TableHeader>
                <SortableTableHeaderCell
                  direction={directionOf("name")}
                  onSort={() => sortBy("name")}
                >
                  Name
                </SortableTableHeaderCell>
                <SortableTableHeaderCell
                  direction={directionOf("email")}
                  onSort={() => sortBy("email")}
                >
                  Email
                </SortableTableHeaderCell>
                <SortableTableHeaderCell
                  direction={directionOf("status")}
                  onSort={() => sortBy("status")}
                >
                  Status
                </SortableTableHeaderCell>
                <SortableTableHeaderCell
                  direction={directionOf("joined")}
                  onSort={() => sortBy("joined")}
                >
                  Joined
                </SortableTableHeaderCell>
                <TableHeaderCell aria-hidden />
              </TableHeader>
              <TableGroup label="Active" count={activeRows.length} />
              {activeRows.map((member) => (
                <MemberRow
                  key={member.userId}
                  member={member}
                  owners={owners}
                  isAdmin={isAdmin}
                  accessLevel={accessLevel}
                  adminReason={adminReason}
                  viewerId={viewerId}
                  busy={busyUserId === member.userId}
                  mfaRequired={organization.mfaRequired}
                  mfaLevel={mfaLevel}
                  mfaEnforceAt={mfaEnforceAt}
                  onChangeRole={changeRole}
                  onRemove={setRemoveTarget}
                  onExtend={setExtendTarget}
                  onClearExtension={removeExtension}
                />
              ))}
              {invitedRows.length > 0 && (
                <TableGroup label="Invited" count={invitedRows.length} />
              )}
              {invitedRows.map((invitation) => (
                <InvitationRow
                  key={invitation.id}
                  invitation={invitation}
                  canRevoke={isAdmin || invitation.invitedByUserId === viewerId}
                  revoking={revokingId === invitation.id}
                  onRevoke={revoke}
                />
              ))}
              {isAdmin && (
                <InactiveMemberRows
                  orgId={orgId}
                  members={members}
                  query={query}
                  role={role}
                  isOwner={isOwner}
                  sort={sort}
                />
              )}
            </Table>
          </div>
        )}
      </section>
      <InviteMembersDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        orgId={orgId}
      />
      <ExtendTwoStepDialog
        target={extendTarget}
        enforceAt={mfaEnforceAt}
        pending={extending}
        onClose={() => setExtendTarget(null)}
        onConfirm={extend}
      />
      <RemoveMemberDialog
        target={removeTarget}
        orgName={organization.name}
        onClose={() => setRemoveTarget(null)}
        onConfirm={remove}
      />
    </SettingsPage>
  );
}
