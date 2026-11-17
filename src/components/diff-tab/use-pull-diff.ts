import { useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { pullDiffAtom } from "./atoms";
import { normalizePullDiff, type PullDiff, type PullRef } from "./model";

export type PullDiffState =
  | { status: "loading" }
  | { status: "failed" }
  | { status: "ready"; diff: PullDiff | null };

export function usePullDiff(
  pull: Pick<PullRef, "id" | "orgId">,
): PullDiffState {
  const result = useAtomValue(pullDiffAtom(pull.orgId, pull.id));
  const value = AsyncResult.value(result);
  if (Option.isSome(value))
    return { status: "ready", diff: normalizePullDiff(value.value) };
  if (AsyncResult.isFailure(result)) return { status: "failed" };
  return { status: "loading" };
}

export const readyDiff = (state: PullDiffState) =>
  state.status === "ready" ? state.diff : null;
