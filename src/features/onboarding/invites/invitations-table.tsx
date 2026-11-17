import type { ReactNode } from "react";
import type {
  JoinableOrganization,
  MyInvitation,
} from "@/data/api/schemas/invitation";
import { Button } from "@/primitives/button";
import { acceptingKey, projectCountLabel } from "./invites-state";
import { OrgAvatar } from "./org-avatar";

export type InvitationsTableProps = {
  invitations: ReadonlyArray<MyInvitation> | undefined;
  invitationsFailed?: boolean;
  organizations: ReadonlyArray<JoinableOrganization> | undefined;
  organizationsFailed?: boolean;
  onRetry: () => void;
  accepting: string | null;
  onAccept: (invitation: MyInvitation) => void;
  onJoin: (organization: JoinableOrganization) => void;
};

const cellClass =
  "relative flex min-h-(--table-row-h) min-w-0 items-center pr-4 text-xs font-normal text-muted-foreground-1";

function Row({
  interactive = true,
  children,
}: {
  interactive?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      data-slot="table-row"
      className={`relative col-span-full grid grid-cols-subgrid ${
        interactive
          ? "before:absolute before:inset-y-0 before:-inset-x-2 before:rounded before:transition-colors before:duration-fast hover:before:bg-section"
          : ""
      }`}
    >
      {children}
    </div>
  );
}

function Cell({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div data-slot="table-cell" className={`${cellClass} ${className}`}>
      {children}
    </div>
  );
}

function Section({ label, count }: { label: string; count?: number }) {
  return (
    <div
      data-slot="table-row"
      className="relative col-span-full mb-0.5 grid h-8 grid-cols-subgrid items-center"
    >
      <div className="absolute inset-y-0 -inset-x-2 rounded-(--radius-card) bg-section" />
      <div
        data-slot="table-section-label"
        className="relative col-span-full flex items-center gap-1.5 text-xs font-medium text-muted-foreground-1"
      >
        {label}
        {count !== undefined && (
          <span className="tabular-nums text-muted-foreground-2">{count}</span>
        )}
      </div>
    </div>
  );
}

function Message({ children }: { children: ReactNode }) {
  return (
    <Row interactive={false}>
      <Cell className="col-span-full justify-center gap-3">{children}</Cell>
    </Row>
  );
}

function Loading({ width }: { width: string }) {
  return (
    <Row interactive={false}>
      <Cell className="col-span-full">
        <div
          data-slot="skeleton"
          className={`shimmer-surface shimmer-surface-motion-safe h-3 rounded ${width}`}
        />
      </Cell>
    </Row>
  );
}

function OrgCell({
  name,
  url,
  detail,
}: {
  name: string;
  url: string | null;
  detail: string;
}) {
  return (
    <Cell className="gap-2.5">
      <OrgAvatar src={url} name={name} />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-sm font-medium text-foreground">
          {name}
        </span>
        <span className="truncate text-muted-foreground-2">{detail}</span>
      </span>
    </Cell>
  );
}

export function InvitationsTable({
  invitations,
  invitationsFailed = false,
  organizations,
  organizationsFailed = false,
  onRetry,
  accepting,
  onAccept,
  onJoin,
}: InvitationsTableProps) {
  const showDomainSection =
    organizationsFailed ||
    organizations === undefined ||
    organizations.length > 0;

  return (
    <div
      data-slot="table"
      className="isolate grid w-full grid-cols-[minmax(0,1fr)_auto] px-4"
    >
      <Section label="Pending" count={invitations?.length} />
      {invitationsFailed ? (
        <Message>
          <span>Could not load your invitations</span>
          <Button
            data-track-owner="shared/invitations-dialog.tsx#InvitationsTable:Button[Try again]"
            intent="neutral"
            onClick={onRetry}
          >
            Try again
          </Button>
        </Message>
      ) : invitations === undefined ? (
        <Loading width="w-2/3" />
      ) : invitations.length === 0 ? (
        <Message>No pending invitations</Message>
      ) : (
        invitations.map((invitation) => {
          const key = acceptingKey.invite(invitation.id);
          return (
            <Row key={invitation.id}>
              <OrgCell
                name={invitation.orgName}
                url={invitation.orgAvatarUrl}
                detail={`${invitation.inviterName} invited you · ${projectCountLabel(invitation.projectCount)}`}
              />
              <Cell className="justify-end pr-0">
                <Button
                  data-track-owner="shared/invitations-dialog.tsx#InvitationsTable:Button[Accept]"
                  intent="neutral"
                  loading={accepting === key}
                  disabled={accepting !== null}
                  onClick={() => onAccept(invitation)}
                  loadingLabel="Joining"
                >
                  Accept
                </Button>
              </Cell>
            </Row>
          );
        })
      )}
      {showDomainSection && (
        <>
          <Section
            label="Available through your email domain"
            count={organizations?.length}
          />
          {organizationsFailed ? (
            <Message>
              <span>Could not load organizations to join</span>
              <Button
                data-track-owner="shared/invitations-dialog.tsx#InvitationsTable:Button[Try again].2"
                intent="neutral"
                onClick={onRetry}
              >
                Try again
              </Button>
            </Message>
          ) : organizations === undefined ? (
            <Loading width="w-1/2" />
          ) : (
            organizations.map((organization) => {
              const key = acceptingKey.domain(organization.orgId);
              return (
                <Row key={organization.orgId}>
                  <OrgCell
                    name={organization.orgName}
                    url={organization.orgAvatarUrl}
                    detail={projectCountLabel(organization.projectCount)}
                  />
                  <Cell className="justify-end pr-0">
                    <Button
                      data-track-owner="shared/invitations-dialog.tsx#InvitationsTable:Button[Join]"
                      intent="neutral"
                      loading={accepting === key}
                      disabled={accepting !== null}
                      onClick={() => onJoin(organization)}
                      loadingLabel="Joining"
                    >
                      Join
                    </Button>
                  </Cell>
                </Row>
              );
            })
          )}
        </>
      )}
    </div>
  );
}
