import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { organizationsAtom } from "@/data/atoms/session";

export const useIsAdmin = () => {
  const result = useAtomValue(organizationsAtom);
  const organization = AsyncResult.isSuccess(result)
    ? result.value[0]
    : undefined;
  return (
    organization?.accessLevel === "admin" ||
    organization?.accessLevel === "owner"
  );
};
