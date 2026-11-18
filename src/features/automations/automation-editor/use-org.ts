import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { useActiveOrgId } from "@/data/atoms/session";

export const resultValue = <A, E>(result: AsyncResult.AsyncResult<A, E>) =>
  Option.getOrUndefined(AsyncResult.value(result));

export function useOrgId(): string | undefined {
  return useActiveOrgId();
}
