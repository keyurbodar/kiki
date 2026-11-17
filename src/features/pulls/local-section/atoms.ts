import { Atom } from "effect/reactivity";
import { queryTimeToLive } from "@/data/atoms/conventions";
import { ApiClient } from "@/data/client/ApiClient";

export const localPullsAtom = Atom.family((key: string) => {
  const [orgId = "", threadId = ""] = key.split("|");
  return ApiClient.query("pulls", "localPullsForThread", {
    params: { orgId, jamId: threadId },
    reactivityKeys: [`pulls:${orgId}`],
    timeToLive: queryTimeToLive,
  });
});

export const removeLocalPullAtom = ApiClient.mutation(
  "pulls",
  "removeLocalPull",
);
