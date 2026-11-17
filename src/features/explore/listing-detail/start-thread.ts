import { useAtomSet } from "@effect/atom-react";
import { ApiClient } from "@/data/client/ApiClient";
import { useOrgId } from "./explore-session";

const createThreadAtom = ApiClient.mutation("jams", "create");

export const createdThreadId = (value: unknown) => {
  if (typeof value !== "object" || value === null)
    throw new Error("Could not start the thread");
  const id = (value as { id?: unknown }).id;
  if (typeof id !== "string") throw new Error("Could not start the thread");
  return id;
};

export function useStartThread() {
  const orgId = useOrgId();
  const create = useAtomSet(createThreadAtom, { mode: "promise" });
  return (projectId: string, text: string) =>
    orgId === undefined
      ? Promise.reject(new Error("Could not start the thread"))
      : create({
          params: { orgId, projectId },
          payload: { text, mentions: [], files: [] },
        }).then(createdThreadId);
}
