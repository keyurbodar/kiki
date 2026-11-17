import { Atom } from "effect/reactivity";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive } from "./conventions.ts";

export const auditReactivityKeys = {
  events: (orgId: string) => `audit:${orgId}`,
  members: (orgId: string) => `members:${orgId}`,
} as const;

/** The list query as plain JSON (ISO timestamps), so it can key an atom family. */
export type AuditQueryKey = {
  readonly cursor?: string;
  readonly order?: string;
  readonly actor?: string;
  readonly userId?: string;
  readonly family?: string;
  readonly from?: string;
  readonly to?: string;
  readonly q?: string;
};

const toQuery = (query: AuditQueryKey) => {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(query))
    if (value !== undefined) out[key] = value;
  return out;
};

const auditPageQuery = Atom.family((key: string) => {
  const { orgId, query } = JSON.parse(key) as {
    orgId: string;
    query: AuditQueryKey;
  };
  return ApiClient.query("audit", "list", {
    params: { orgId },
    query: toQuery(query),
    reactivityKeys: [auditReactivityKeys.events(orgId)],
    timeToLive: "1 minute",
  });
});

/** One page of audit events; `cursor` in the query picks the page. */
export const auditPageAtom = (orgId: string, query: AuditQueryKey) =>
  auditPageQuery(JSON.stringify({ orgId, query }));

const auditPagesQuery = Atom.family((key: string) => {
  const { orgId, query, cursors } = JSON.parse(key) as {
    orgId: string;
    query: AuditQueryKey;
    cursors: ReadonlyArray<string>;
  };
  return Atom.make((get) =>
    cursors.map((cursor) =>
      get(
        auditPageAtom(orgId, {
          ...query,
          cursor: cursor === "" ? undefined : cursor,
        }),
      ),
    ),
  );
});

/** Every loaded page of one filtered list, in cursor order (`""` is the first page). */
export const auditPagesAtom = (
  orgId: string,
  query: AuditQueryKey,
  cursors: ReadonlyArray<string>,
) => auditPagesQuery(JSON.stringify({ orgId, query, cursors }));

/** The org's members, offered as people in the audit log's actor filter. */
export const auditMembersAtom = Atom.family((orgId: string) =>
  ApiClient.query("members", "listMembers", {
    params: { orgId },
    query: {},
    reactivityKeys: [auditReactivityKeys.members(orgId)],
    timeToLive: queryTimeToLive,
  }),
);
