import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { AsyncResult, Atom } from "effect/reactivity";
import { useCallback } from "react";
import type { OrgId } from "../api/schemas/ids.ts";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive, reactivityKeys } from "./conventions.ts";

export const currentUserAtom = ApiClient.query("users", "getCurrent", {
  reactivityKeys: [reactivityKeys.currentUser],
  timeToLive: queryTimeToLive,
});

export const organizationsAtom = ApiClient.query("organizations", "list", {
  reactivityKeys: [reactivityKeys.organizations],
  timeToLive: queryTimeToLive,
});

const SELECTED_ORG_KEY = "capy-web:selected-org";

const readSelectedOrg = (): string | null => {
  try {
    const raw = window.localStorage.getItem(SELECTED_ORG_KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "string" ? parsed : null;
  } catch {
    return null;
  }
};

const writeSelectedOrg = (orgId: string | null) => {
  try {
    if (orgId === null) window.localStorage.removeItem(SELECTED_ORG_KEY);
    else window.localStorage.setItem(SELECTED_ORG_KEY, JSON.stringify(orgId));
  } catch {}
};

export const selectedOrgIdAtom = Atom.make<string | null>(
  readSelectedOrg(),
).pipe(Atom.keepAlive);

/**
 * The organization a surface is acting on: the one the viewer switched to, or
 * the first they belong to when they have not switched. Every reader goes
 * through here, so switching organizations moves the whole app together
 * instead of only the shell.
 */
export const resolveActiveOrgId = (
  organizations: ReadonlyArray<{ readonly id: string }>,
  selected: string | null,
) =>
  organizations.find((organization) => organization.id === selected)?.id ??
  organizations[0]?.id;

/**
 * The active organization's id, or `undefined` while the organizations read is
 * in flight or has failed. A surface that must tell those two apart reads
 * `organizationsAtom` and gates on it.
 */
export function useActiveOrgId(): OrgId | undefined {
  const organizations = useAtomValue(organizationsAtom);
  const selected = useAtomValue(selectedOrgIdAtom);
  if (!AsyncResult.isSuccess(organizations)) return undefined;
  return resolveActiveOrgId(organizations.value, selected) as OrgId | undefined;
}

/** Switches the active organization and remembers it across reloads. */
export function useSelectOrganization(): (orgId: string | null) => void {
  const select = useAtomSet(selectedOrgIdAtom);
  return useCallback(
    (orgId: string | null) => {
      writeSelectedOrg(orgId);
      select(orgId);
    },
    [select],
  );
}
