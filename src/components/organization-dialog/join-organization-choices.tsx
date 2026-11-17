import { ChoiceRow, ChoiceRowGroup } from "@/components/choice-row";
import { Button } from "@/primitives/button";
import { SkeletonPanel } from "@/primitives/skeleton-panel";
import { OrganizationAvatar } from "./organization-avatar";
import {
  checkedJoinSelection,
  invitationKey,
  type JoinableOrganization,
  joinableKey,
  type OrganizationInvitation,
  projectCountLabel,
} from "./state";

export type JoinOrganizationChoicesProps = {
  invitations: ReadonlyArray<OrganizationInvitation> | undefined;
  organizations: ReadonlyArray<JoinableOrganization> | undefined;
  invitationsFailed: boolean;
  organizationsFailed: boolean;
  selection: string | undefined;
  onSelect: (selection: string) => void;
  onRetryInvitations: () => void;
  onRetryOrganizations: () => void;
};

export function JoinOrganizationChoices({
  invitations,
  organizations,
  invitationsFailed,
  organizationsFailed,
  selection,
  onSelect,
  onRetryInvitations,
  onRetryOrganizations,
}: JoinOrganizationChoicesProps) {
  const checked = checkedJoinSelection(selection, invitations, organizations);
  const hasChoices =
    (invitations?.length ?? 0) > 0 || (organizations?.length ?? 0) > 0;
  const empty =
    invitations !== undefined &&
    organizations !== undefined &&
    invitations.length === 0 &&
    organizations.length === 0;
  return (
    <div className="flex flex-col gap-2">
      {invitationsFailed ? (
        <JoinReadFailure
          label="Could not load invitations"
          onRetry={onRetryInvitations}
        />
      ) : invitations === undefined ? (
        <SkeletonPanel className="h-16 w-full" />
      ) : null}
      {organizationsFailed ? (
        <JoinReadFailure
          label="Could not load organizations available through your email"
          onRetry={onRetryOrganizations}
        />
      ) : organizations === undefined ? (
        <SkeletonPanel className="h-16 w-full" />
      ) : null}
      {hasChoices ? (
        <ChoiceRowGroup label="Organizations to join">
          {invitations?.map((invitation) => (
            <ChoiceRow
              key={invitation.id}
              checked={checked === invitationKey(invitation)}
              onSelect={() => onSelect(invitationKey(invitation))}
              icon={
                <OrganizationAvatar
                  src={invitation.orgAvatarUrl}
                  name={invitation.orgName}
                />
              }
              label={invitation.orgName}
              description={`${invitation.inviterName} invited you · ${projectCountLabel(invitation.projectCount)}`}
            />
          ))}
          {organizations?.map((organization) => (
            <ChoiceRow
              key={organization.orgId}
              checked={checked === joinableKey(organization)}
              onSelect={() => onSelect(joinableKey(organization))}
              icon={
                <OrganizationAvatar
                  src={organization.orgAvatarUrl}
                  name={organization.orgName}
                />
              }
              label={organization.orgName}
              description={`Available through your email domain · ${projectCountLabel(organization.projectCount)}`}
            />
          ))}
        </ChoiceRowGroup>
      ) : null}
      {empty ? (
        <div className="flex flex-col items-center gap-1 rounded-(--radius-card) border-hairline border-border-2 px-4 py-8 text-center">
          <p className="text-sm font-medium text-foreground">
            No organizations available
          </p>
          <p className="text-xs font-normal text-muted-foreground-2">
            Ask an admin to invite you or allow your work email domain
          </p>
        </div>
      ) : null}
    </div>
  );
}

function JoinReadFailure({
  label,
  onRetry,
}: {
  label: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-(--radius-card) border-hairline border-border-2 p-3">
      <p className="text-sm text-muted-foreground-2">{label}</p>
      <Button intent="neutral" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
