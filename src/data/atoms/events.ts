import { Atom } from "effect/reactivity";
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

/** `POST messages/:eventId/send-now`: promotes a queued message. */
export const sendNowMessageAtom = ApiClient.mutation(
  "events",
  "sendNowMessage",
);

/** `POST messages/:eventId/cancel`: discards a queued message. */
export const cancelMessageAtom = ApiClient.mutation("events", "cancelMessage");
