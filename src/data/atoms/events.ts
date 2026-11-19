import { AsyncResult, Atom } from "effect/reactivity";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive } from "./conventions.ts";

export const jamEventKey = (jamId: string) => `jam_event:${jamId}`;

const contextUsageQuery = Atom.family((key: string) => {
  const [orgId = "", jamId = ""] = key.split("/");
  return ApiClient.query("events", "contextUsage", {
    params: { orgId, jamId },
    reactivityKeys: [jamEventKey(jamId)],
    timeToLive: queryTimeToLive,
  });
});

/** `GET events/context-usage` for one thread: the context meter's source. */
export const contextUsageAtom = (orgId: string, jamId: string) =>
  contextUsageQuery(`${orgId}/${jamId}`);

/** The context meter's read while the org is still resolving. */
export const idleContextUsageAtom: ReturnType<typeof contextUsageAtom> =
  Atom.make(AsyncResult.initial(false)) as ReturnType<typeof contextUsageAtom>;

const messageVersionsQuery = Atom.family((key: string) => {
  const [orgId = "", jamId = "", eventId = ""] = key.split("/");
  return ApiClient.query("events", "messageVersions", {
    params: { orgId, jamId, eventId },
    reactivityKeys: [jamEventKey(jamId)],
    timeToLive: queryTimeToLive,
  });
});

/**
 * `GET messages/:eventId/versions`: every version of one message and the
 * events each one branches to. The response is undecoded; the switcher decodes
 * it with `MessageVersionsWithBranches`.
 */
export const messageVersionsAtom = (
  orgId: string,
  jamId: string,
  eventId: string,
) => messageVersionsQuery(`${orgId}/${jamId}/${eventId}`);

/** `POST jams/:jamId/message`: sends a composer message to a thread. */
export const sendMessageAtom = ApiClient.mutation("events", "message");

/** `POST jams/:jamId/interrupt`: stops the turn a thread is running. */
export const stopRunAtom = ApiClient.mutation("events", "interrupt");

/** `POST messages/:eventId/send-now`: promotes a queued message. */
export const sendNowMessageAtom = ApiClient.mutation(
  "events",
  "sendNowMessage",
);

/** `POST messages/:eventId/cancel`: discards a queued message. */
export const cancelMessageAtom = ApiClient.mutation("events", "cancelMessage");
