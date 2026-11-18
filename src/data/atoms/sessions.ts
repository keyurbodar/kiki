import { Atom } from "effect/reactivity";
import type { JamId, OrgId } from "../api/schemas/ids.ts";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive } from "./conventions.ts";
import { threadKey } from "./jams.ts";

const threadSessionsQuery = Atom.family((key: string) => {
  const [orgId, jamId] = key.split("/") as [OrgId, JamId];
  return ApiClient.query("threadSessions", "list", {
    params: { orgId, jamId },
    timeToLive: queryTimeToLive,
  });
});

/** The browser and terminal sessions one thread has open. */
export const threadSessionsAtom = (orgId: OrgId, jamId: JamId) =>
  threadSessionsQuery(threadKey(orgId, jamId));
