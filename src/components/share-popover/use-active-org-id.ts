import { useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { organizationsAtom } from "@/data/atoms/session";

export function useActiveOrgId(): string | undefined {
  const result = useAtomValue(organizationsAtom);
  return Option.getOrUndefined(AsyncResult.value(result))?.[0]?.id;
}
