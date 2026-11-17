import { useAtomValue } from "@effect/atom-react";
import { AsyncResult, Atom } from "effect/reactivity";
import { feedbackSettingsAtom } from "@/data/atoms/agent-settings";
import { currentUserAtom, organizationsAtom } from "@/data/atoms/session";
import {
  type FeedbackSettings,
  readAgentPreferences,
  readFeedbackSettings,
} from "./agent-settings";

/** The signed-in org (kiki has one org per session until the shell picks one), and whether its list is refetching. */
export function useActiveOrganization() {
  const result = useAtomValue(organizationsAtom);
  return {
    organization: AsyncResult.isSuccess(result) ? result.value[0] : undefined,
    waiting: result.waiting,
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

export function useAgentPreferences() {
  const result = useAtomValue(currentUserAtom);
  return AsyncResult.isSuccess(result)
    ? readAgentPreferences(result.value.preferences)
    : undefined;
}

const pending: Atom.Atom<AsyncResult.AsyncResult<unknown, unknown>> = Atom.make(
  AsyncResult.initial(true),
);

export function useFeedbackSettings(): FeedbackSettings | undefined {
  const { organization } = useActiveOrganization();
  const atom: Atom.Atom<AsyncResult.AsyncResult<unknown, unknown>> =
    organization === undefined
      ? pending
      : feedbackSettingsAtom(organization.id);
  const result = useAtomValue(atom);
  return organization !== undefined && AsyncResult.isSuccess(result)
    ? readFeedbackSettings(result.value)
    : undefined;
}
