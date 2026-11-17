import { OrgId, ProjectId } from "../../api/schemas/ids.ts";
import { Organization } from "../../api/schemas/organization.ts";
import { minutesAgo } from "../fixtures/time.ts";

const organization = (
  id: string,
  name: string,
  accessLevel: Organization["accessLevel"],
  defaultProjectId: string | null,
) =>
  new Organization({
    id: OrgId.make(id),
    name,
    avatarUrl: null,
    accessLevel,
    defaultProjectId:
      defaultProjectId === null ? null : ProjectId.make(defaultProjectId),
    titlePrompt: null,
    orgTitlePrompt: null,
    titleTriggers: null,
    orgTitleTriggers: null,
    defaultModel: null,
    taskConcurrentLimit: null,
    taskNestedDepth: null,
    entitlements: [],
    planUnread: false,
    experiments: [],
    personalThreadsEnabled: true,
    pullGuidesEnabled: true,
    mfaRequired: false,
    mfaEnforceAt: null,
    mfaLevel: "any",
    viewerMfaProtected: true,
    viewerMfaExtendedUntil: null,
    defaultVisibility: "org",
    viewerDefaultVisibility: null,
    createdAt: minutesAgo(60 * 24 * 90),
    updatedAt: minutesAgo(60 * 24 * 2),
    purgesAt: undefined,
  });

export const sampleOrganizations = [
  organization("org_sample_acme", "Acme", "owner", "proj_sample_web"),
  organization("org_sample_lab", "Northwind Labs", "member", null),
];
