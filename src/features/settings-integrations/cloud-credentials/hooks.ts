import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { useState } from "react";
import { toast } from "sonner";
import type { CloudAccessTarget } from "@/data/api/schemas/cloud-access";
import type { OrgId } from "@/data/api/schemas/ids";
import {
  checkCloudAccessTargetAtom,
  cloudAccessAtom,
  cloudAccessKeys,
} from "@/data/atoms/cloud-credentials";
import { projectsAtom } from "@/data/atoms/projects";
import { organizationsAtom } from "@/data/atoms/session";

export function useCloudAccess(orgId: OrgId) {
  const atom = cloudAccessAtom(orgId);
  const result = useAtomValue(atom);
  const refresh = useAtomRefresh(atom);
  return {
    result,
    access: AsyncResult.getOrElse(result, () => undefined),
    failed: AsyncResult.isFailure(result),
    refresh,
  };
}

export function useProjects(orgId: OrgId) {
  const result = useAtomValue(projectsAtom(orgId));
  return AsyncResult.getOrElse(result, () => []);
}

export function useIsOrgAdmin(orgId: OrgId) {
  const organizations = useAtomValue(organizationsAtom);
  const accessLevel = AsyncResult.isSuccess(organizations)
    ? organizations.value.find((org) => org.id === orgId)?.accessLevel
    : undefined;
  return accessLevel === "admin" || accessLevel === "owner";
}

export const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message.length > 0 ? error.message : fallback;

export const toastCheckResult = (target: CloudAccessTarget) =>
  target.lastCheck?.outcome === "ok"
    ? toast.success("Check passed")
    : toast.error("Check failed", {
        description: target.lastCheck?.error ?? undefined,
      });

export function useCheckTarget(orgId: OrgId) {
  const check = useAtomSet(checkCloudAccessTargetAtom, { mode: "promise" });
  const [checking, setChecking] = useState<string | null>(null);
  const run = (target: CloudAccessTarget) => {
    setChecking(target.id);
    return check({
      params: { orgId, targetId: target.id },
      reactivityKeys: cloudAccessKeys.cloudAccess(orgId),
    })
      .then(toastCheckResult)
      .catch((error: unknown) => {
        toast.error(errorMessage(error, "Could not run the check"));
      })
      .finally(() => setChecking(null));
  };
  return { checking, run };
}
