import { Atom } from "effect/reactivity";
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

export const selectedOrgIdAtom = Atom.make<string | null>(null).pipe(
  Atom.keepAlive,
);

export const resolveActiveOrgId = (
  organizations: ReadonlyArray<{ readonly id: string }>,
  selected: string | null,
) =>
  organizations.find((organization) => organization.id === selected)?.id ??
  organizations[0]?.id;
