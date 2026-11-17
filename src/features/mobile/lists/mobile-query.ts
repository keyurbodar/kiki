import { AsyncResult } from "effect/reactivity";

/** First-page wait state shared by the mobile list units. */
export function useMobileQuery<A, E>(
  result: AsyncResult.AsyncResult<A, E>,
  absent: boolean,
) {
  return { result, waiting: !absent && AsyncResult.isInitial(result) };
}
