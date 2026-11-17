import { Atom } from "effect/reactivity";
import { queryTimeToLive } from "@/data/atoms/conventions";
import { ApiClient } from "@/data/client/ApiClient";

const split = (key: string) => key.split("/") as [string, string];

/** One thread, by "orgId/jamId". */
export const mobileThreadAtom = Atom.family((key: string) => {
  const [orgId, jamId] = split(key);
  return ApiClient.query("jams", "get", {
    params: { orgId, jamId },
    timeToLive: queryTimeToLive,
  });
});

/** The thread's machines, by "orgId/jamId". */
export const mobileThreadMachinesAtom = Atom.family((key: string) => {
  const [orgId, jamId] = split(key);
  return ApiClient.query("machines", "list", {
    params: { orgId, jamId },
    timeToLive: queryTimeToLive,
  });
});

export const mobileModelsAtom = ApiClient.query("models", "list", {
  query: {},
  timeToLive: queryTimeToLive,
});
