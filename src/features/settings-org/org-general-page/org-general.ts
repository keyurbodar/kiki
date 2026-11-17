import type {
  AccessLevel,
  Organization,
  Visibility,
} from "@/data/api/schemas/organization";
import { settingsNav } from "@/features/settings/nav/registry";

export const adminReason = "Only organization admins can change this";

/** Capy's organization access check: admins and owners can change settings. */
export const organizationAccess = (accessLevel: AccessLevel | undefined) => {
  const isAdmin = accessLevel === "admin" || accessLevel === "owner";
  return {
    accessLevel,
    isAdmin,
    adminReason: isAdmin ? undefined : adminReason,
  };
};

/** A settings catalog row by id, for the row's anchor id and label. */
export const catalogRow = (id: string) => {
  for (const entry of settingsNav)
    for (const row of entry.rows ?? [])
      if (row.id === id) return { id: row.id, title: row.title };
  throw new TypeError(`Unknown settings catalog id: ${id}`);
};

export type MyDefaultVisibility = Visibility | "default";

export const visibilityLabels = (organizationName: string) => ({
  org: `Everyone at ${organizationName}`,
  private: "Only specific people",
});

export const myDefaultLabels = (organizationName: string) => ({
  default: "Organization default",
  ...visibilityLabels(organizationName),
});

/** The viewer's own default, falling back when private work is off. */
export const myDefaultVisibility = (
  organization: Pick<
    Organization,
    "viewerDefaultVisibility" | "personalThreadsEnabled"
  >,
): MyDefaultVisibility =>
  organization.viewerDefaultVisibility === null ||
  (organization.viewerDefaultVisibility === "private" &&
    !organization.personalThreadsEnabled)
    ? "default"
    : organization.viewerDefaultVisibility;

/** The sharing payload: private defaults only stand while private work is on. */
export const sharingPayload = (
  defaultVisibility: Visibility,
  privateWork: boolean,
) => ({
  defaultVisibility: privateWork ? defaultVisibility : ("org" as const),
  privateWork,
});

/** Issue prefixes are up to eight capital letters. */
export const normalizeIssuePrefix = (value: string) =>
  value.toUpperCase().replace(/[^A-Z]/g, "");

export type IssuePrefix = { prefix: string | null; effective?: string };

export const readIssuePrefix = (value: unknown): IssuePrefix | undefined => {
  if (typeof value !== "object" || value === null) return undefined;
  const { prefix, effective } = value as Record<string, unknown>;
  return {
    prefix: typeof prefix === "string" ? prefix : null,
    effective: typeof effective === "string" ? effective : undefined,
  };
};

/** The prefix to save from a draft, or undefined when nothing changed. */
export const issuePrefixChange = (
  draft: string | null,
  current: string | null,
): { prefix: string | null } | undefined => {
  if (draft === null) return undefined;
  const prefix = draft === "" ? null : draft;
  return prefix === current ? undefined : { prefix };
};

/** The name to save from a draft, or undefined when nothing changed. */
export const organizationNameChange = (draft: string, current: string) => {
  const name = draft.trim();
  return name === "" || name === current ? undefined : name;
};
