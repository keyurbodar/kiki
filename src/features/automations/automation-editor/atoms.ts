import { AsyncResult, Atom } from "effect/reactivity";
import { queryTimeToLive } from "@/data/atoms/conventions";
import { ApiClient } from "@/data/client/ApiClient";

export const automationKeys = {
  list: (orgId: string) => `automations:${orgId}`,
  one: (automationId: string) => `automation:${automationId}`,
  members: (orgId: string) => `members:${orgId}`,
  serviceUsers: (orgId: string) => `service-users:${orgId}`,
};

const splitKey = (key: string) => key.split("/") as [string, string];

export const automationKey = (orgId: string, automationId: string) =>
  `${orgId}/${automationId}`;

export const automationAtom = Atom.family((key: string) => {
  const [orgId, automationId] = splitKey(key);
  return ApiClient.query("automations", "get", {
    params: { orgId, automationId },
    reactivityKeys: [
      automationKeys.list(orgId),
      automationKeys.one(automationId),
    ],
    timeToLive: queryTimeToLive,
  });
});

export const membersAtom = Atom.family((orgId: string) =>
  ApiClient.query("members", "listMembers", {
    params: { orgId },
    query: {},
    reactivityKeys: [automationKeys.members(orgId)],
    timeToLive: queryTimeToLive,
  }),
);

export const serviceUsersAtom = Atom.family((orgId: string) =>
  ApiClient.query("serviceUsers", "list", {
    params: { orgId },
    reactivityKeys: [automationKeys.serviceUsers(orgId)],
    timeToLive: queryTimeToLive,
  }),
);

export const createAutomationAtom = ApiClient.mutation("automations", "create");
export const updateAutomationAtom = ApiClient.mutation("automations", "update");
export const enableAutomationAtom = ApiClient.mutation("automations", "enable");
export const disableAutomationAtom = ApiClient.mutation(
  "automations",
  "disable",
);
export const deleteAutomationAtom = ApiClient.mutation("automations", "delete");
export const restoreAutomationAtom = ApiClient.mutation(
  "automations",
  "restore",
);
export const triggerAutomationAtom = ApiClient.mutation(
  "automations",
  "trigger",
);

/** One automation while the org is still resolving. */
export const idleAutomationAtom: ReturnType<typeof automationAtom> = Atom.make(
  AsyncResult.initial(false),
) as ReturnType<typeof automationAtom>;
