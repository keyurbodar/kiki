import { useAtomValue } from "@effect/atom-react";
import { AsyncResult, Atom } from "effect/reactivity";
import { feedbackSettingsAtom } from "@/data/atoms/agent-settings";
import { currentUserAtom, organizationsAtom } from "@/data/atoms/session";
import {
  type FeedbackSettings,
  readAgentPreferences,
  readFeedbackSettings,
  type SettingsQuery,
  settingsQuery,
} from "./agent-settings";

/** The signed-in org (kiki has one org per session until the shell picks one), and whether its list is refetching. */
export function useActiveOrganization() {
  const result = useAtomValue(organizationsAtom);
  const query = settingsQuery(result, (items) => items[0]);
  return {
    organization: query.value,
    waiting: query.loading,
    failed: query.failed,
  };
}

export function useIsAdmin() {
  const { organization } = useActiveOrganization();
  const isAdmin =
    organization?.accessLevel === "admin" ||
    organization?.accessLevel === "owner";
  return {
    isAdmin,
    adminReason: isAdmin
      ? undefined
      : "Only organization admins can change this",
  };
}

export function useAgentPreferences(): SettingsQuery<
  ReturnType<typeof readAgentPreferences>
> {
  return settingsQuery(useAtomValue(currentUserAtom), (user) =>
    readAgentPreferences(user.preferences),
  );
}

const pending: Atom.Atom<AsyncResult.AsyncResult<unknown, unknown>> = Atom.make(
  AsyncResult.initial(true),
);

export function useFeedbackSettings(): SettingsQuery<FeedbackSettings> {
  const { organization, failed: orgFailed } = useActiveOrganization();
  const atom: Atom.Atom<AsyncResult.AsyncResult<unknown, unknown>> =
    organization === undefined
      ? pending
      : feedbackSettingsAtom(organization.id);
  const query = settingsQuery(useAtomValue(atom), readFeedbackSettings);
  return organization === undefined
    ? { value: undefined, loading: false, failed: orgFailed }
    : query;
}
