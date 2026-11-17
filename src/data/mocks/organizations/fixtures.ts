import { OrgId, ProjectId } from "../../api/schemas/ids.ts";
import { Organization } from "../../api/schemas/organization.ts";
import { minutesAgo } from "../fixtures/time.ts";
import {
  isoMinutesAgo,
  members,
  org,
  pendingInvitations,
  people,
  projects,
} from "../fixtures/world.ts";

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
  organization(org.id, org.name, "owner", projects.web.id),
  organization("org_sample_lab", "Northwind Labs", "member", null),
];

export const sampleInvitations = pendingInvitations.map((invitation) => ({
  ...invitation,
  organizationId: org.id,
  organizationName: org.name,
  invitedByEmail: people.sam.email,
}));

export const sampleJoinableOrganizations = [
  {
    id: "org_sample_lab",
    name: "Northwind Labs",
    slug: "northwind-labs",
    domain: "example.net",
    memberCount: 12,
  },
  {
    id: "org_sample_partners",
    name: "Partner Studio",
    slug: "partner-studio",
    domain: "partners.example.com",
    memberCount: 4,
  },
];

export const sampleDeletedOrganizations = [
  {
    id: "org_sample_old",
    name: "Old Sandbox",
    deletedAt: isoMinutesAgo(18 * 24 * 60),
    purgesAt: isoMinutesAgo(12 * 24 * 60),
  },
];

export const sampleAllowedDomains = [
  {
    id: "dom_sample_example",
    domain: org.domain,
    verified: true,
    verification: "dns",
    dnsRecord: null,
    ssoRequired: false,
    createdAt: org.createdAt,
    verifiedAt: isoMinutesAgo(40 * 24 * 60),
  },
  {
    id: "dom_sample_partners",
    domain: "partners.example.com",
    verified: false,
    verification: "dns",
    dnsRecord: {
      host: "_capy-challenge.partners.example.com",
      type: "TXT",
      value: "capy-verify=dom_sample_partners",
    },
    ssoRequired: false,
    createdAt: isoMinutesAgo(7 * 24 * 60),
    verifiedAt: null,
  },
];

export const sampleSurfaceModels = {
  web: { modelId: "anthropic/claude-sonnet", reasoningMode: "medium" },
  general: { modelId: "anthropic/claude-opus", reasoningMode: "high" },
};

export const sampleDepartedPrivateWork = {
  threads: [
    {
      id: "jam_sample_0007",
      title: "Upgrade the bundler",
      formerMemberId: people.casey.id,
      transferredToId: people.alex.id,
    },
  ],
  jams: [],
  projects: [],
};

export const sampleSsoConnection = {
  id: "sso_sample_google",
  provider: "google",
  domain: org.domain,
  connected: true,
  active: true,
  ssoRequired: false,
  connection: {
    domain: org.domain,
    clientId: "sample-client-id",
    callbackUrl: `https://example.com/auth/callback/${org.id}`,
  },
  certificates: [
    {
      id: "cert_sample_primary",
      name: "Primary signing certificate",
      expiresAt: isoMinutesAgo(-90 * 24 * 60),
    },
  ],
  updatedAt: isoMinutesAgo(6 * 24 * 60),
};

export const sampleSsoCertificate = {
  id: "cert_sample_added",
  name: "Secondary signing certificate",
  expiresAt: isoMinutesAgo(-180 * 24 * 60),
  addedAt: isoMinutesAgo(0),
};

export const sampleMemberId = members[0]!.id;
