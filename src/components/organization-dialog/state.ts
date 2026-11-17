export type OrganizationDialogStep = "choose" | "create" | "join";

export type OrganizationDialogState = {
  step: OrganizationDialogStep;
  choice: "create" | "join";
  name: string;
  avatar: { file: File; previewUrl: string | null } | null;
  joinSelection: string | undefined;
  busy: "create" | "join" | null;
};

export const initialOrganizationDialogState = (
  step: OrganizationDialogStep,
): OrganizationDialogState => ({
  step,
  choice: "create",
  name: "",
  avatar: null,
  joinSelection: undefined,
  busy: null,
});

/** An invitation to an organization, from `/me/invitations`. */
export type OrganizationInvitation = {
  id: string;
  orgName: string;
  orgAvatarUrl: string | null;
  inviterName: string;
  projectCount: number;
};

/** An organization open to the viewer's email domain. */
export type JoinableOrganization = {
  orgId: string;
  orgName: string;
  orgAvatarUrl: string | null;
  projectCount: number;
};

export const invitationKey = (invitation: OrganizationInvitation) =>
  `invite:${invitation.id}`;

export const joinableKey = (organization: JoinableOrganization) =>
  `domain:${organization.orgId}`;

export const dialogCopy = (step: OrganizationDialogStep) =>
  step === "choose"
    ? {
        title: "Create or join organization",
        description: "Choose how to set up your next workspace",
      }
    : step === "create"
      ? {
          title: "Create organization",
          description: "Set up a shared workspace for your team",
        }
      : {
          title: "Join organization",
          description:
            "Choose an invitation or organization available through your email",
        };

/**
 * The join target: the selected invitation or organization, else the first
 * invitation, else the first organization.
 */
export const joinTarget = (
  selection: string | undefined,
  invitations: ReadonlyArray<OrganizationInvitation> | undefined,
  organizations: ReadonlyArray<JoinableOrganization> | undefined,
):
  | { kind: "invitation"; invitation: OrganizationInvitation }
  | { kind: "organization"; organization: JoinableOrganization }
  | undefined => {
  const invitation = invitations?.find(
    (candidate) => invitationKey(candidate) === selection,
  );
  if (invitation !== undefined) return { kind: "invitation", invitation };
  const organization = organizations?.find(
    (candidate) => joinableKey(candidate) === selection,
  );
  if (organization !== undefined) return { kind: "organization", organization };
  const firstInvitation = invitations?.[0];
  if (firstInvitation !== undefined)
    return { kind: "invitation", invitation: firstInvitation };
  const firstOrganization = organizations?.[0];
  return firstOrganization === undefined
    ? undefined
    : { kind: "organization", organization: firstOrganization };
};

export const joinTargetName = (target: ReturnType<typeof joinTarget>) =>
  target === undefined
    ? undefined
    : target.kind === "invitation"
      ? target.invitation.orgName
      : target.organization.orgName;

/** The checked choice: the selection while it still exists, else the first. */
export const checkedJoinSelection = (
  selection: string | undefined,
  invitations: ReadonlyArray<OrganizationInvitation> | undefined,
  organizations: ReadonlyArray<JoinableOrganization> | undefined,
) => {
  const exists =
    invitations?.some((candidate) => invitationKey(candidate) === selection) ===
      true ||
    organizations?.some((candidate) => joinableKey(candidate) === selection) ===
      true;
  if (exists) return selection;
  const firstInvitation = invitations?.[0];
  if (firstInvitation !== undefined) return invitationKey(firstInvitation);
  const firstOrganization = organizations?.[0];
  return firstOrganization === undefined
    ? undefined
    : joinableKey(firstOrganization);
};

export const projectCountLabel = (count: number) =>
  count === 0
    ? "no projects yet"
    : `${count} ${count === 1 ? "project" : "projects"}`;

export const initials = (name: string) => {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
};

const readString = (record: Record<string, unknown>, key: string) =>
  typeof record[key] === "string" ? (record[key] as string) : undefined;

const readCount = (record: Record<string, unknown>) =>
  typeof record.projectCount === "number" ? record.projectCount : 0;

const records = (value: unknown) =>
  Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          typeof item === "object" && item !== null,
      )
    : [];

/** Reads `/me/invitations`, which is still undecoded. */
export const readInvitations = (
  value: unknown,
): ReadonlyArray<OrganizationInvitation> =>
  records(value).flatMap((record) => {
    const id = readString(record, "id");
    const orgName = readString(record, "orgName");
    return id === undefined || orgName === undefined
      ? []
      : [
          {
            id,
            orgName,
            orgAvatarUrl: readString(record, "orgAvatarUrl") ?? null,
            inviterName: readString(record, "inviterName") ?? "",
            projectCount: readCount(record),
          },
        ];
  });

/** Reads `/me/joinable-organizations`, which is still undecoded. */
export const readJoinableOrganizations = (
  value: unknown,
): ReadonlyArray<JoinableOrganization> =>
  records(value).flatMap((record) => {
    const orgId = readString(record, "orgId");
    const orgName = readString(record, "orgName");
    return orgId === undefined || orgName === undefined
      ? []
      : [
          {
            orgId,
            orgName,
            orgAvatarUrl: readString(record, "orgAvatarUrl") ?? null,
            projectCount: readCount(record),
          },
        ];
  });
