import { Atom } from "effect/reactivity";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive } from "./conventions.ts";

const keyed = (value: unknown) => JSON.stringify(value);
const parse = <A>(key: string) => JSON.parse(key) as A;

const paperFilesFamily = Atom.family((key: string) => {
  const { orgId, jamId } = parse<{ orgId: string; jamId: string }>(key);
  return ApiClient.query("paper", "listPaperFiles", {
    params: { orgId: orgId as never, jamId: jamId as never },
    reactivityKeys: [`paper:${orgId}:${jamId}`],
    timeToLive: queryTimeToLive,
  });
});

/**
 * The Paper files a thread's Paper session holds, which is what decides whether
 * a `paper` tab has a canvas to show or only a file id that Paper never saw.
 */
export const paperFilesAtom = (orgId: string, jamId: string) =>
  paperFilesFamily(keyed({ orgId, jamId }));
