import { useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { organizationsAtom } from "@/data/atoms/session";

export const resultValue = <A, E>(result: AsyncResult.AsyncResult<A, E>) =>
  Option.getOrUndefined(AsyncResult.value(result));

export function useOrgId(): string | undefined {
  return resultValue(useAtomValue(organizationsAtom))?.[0]?.id;
}
