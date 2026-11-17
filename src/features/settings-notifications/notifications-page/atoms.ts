import { Option } from "effect";
import { AsyncResult, Atom } from "effect/reactivity";
import { reactivityKeys } from "@/data/atoms/conventions";
import { organizationsAtom } from "@/data/atoms/session";
import { ApiClient } from "@/data/client/ApiClient";

export const currentUserKeys = [reactivityKeys.currentUser];

export const updatePreferencesAtom = ApiClient.mutation(
  "users",
  "updatePreferences",
);

export const activeOrganizationAtom = Atom.make((get) => {
  const organizations = Option.getOrUndefined(
    AsyncResult.value(get(organizationsAtom)),
  );
  return organizations?.[0];
});

export const slackLinksAtom = Atom.family((orgId: string) =>
  ApiClient.query("integrations", "listSlackLinks", {
    params: { orgId },
    reactivityKeys: [`slack_link:${orgId}`],
  }),
);

export const activeSlackLinksAtom = Atom.make((get): ReadonlyArray<unknown> => {
  const organization = get(activeOrganizationAtom);
  if (organization === undefined) return [];
  const links = Option.getOrUndefined(
    AsyncResult.value(get(slackLinksAtom(organization.id))),
  );
  return Array.isArray(links) ? links : [];
});
