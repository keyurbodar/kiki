import { useAtomValue } from "@effect/atom-react";
import type { Atom } from "effect/reactivity";
import { AsyncResult } from "effect/reactivity";

export function useResultValue<A, E>(
  atom: Atom.Atom<AsyncResult.AsyncResult<A, E>>,
): A | undefined {
  const result = useAtomValue(atom);
  return AsyncResult.isSuccess(result) ? result.value : undefined;
}
