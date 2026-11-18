import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { billingAtom } from "@/data/atoms/billing";
import { useActiveOrgId } from "@/data/atoms/session";
import { type BillingView, toBillingView } from "@/lib/billing";

/** The org whose billing the settings pages show: the active one. */
export const useBillingOrgId = useActiveOrgId;

export function useBillingView(orgId: string | undefined) {
  const result = useAtomValue(billingAtom(orgId ?? ""));
  const value = AsyncResult.getOrElse(result, () => undefined);
  const billing: BillingView | undefined =
    orgId === undefined || value === undefined
      ? undefined
      : toBillingView(value);
  return { billing, failed: AsyncResult.isFailure(result) };
}

/**
 * Org admin gate for billing actions. Capy reads it from the org membership;
 * kiki has no membership role source yet, so every viewer is an admin.
 */
export function useBillingAdmin(): {
  isAdmin: boolean;
  adminReason: string | undefined;
} {
  return { isAdmin: true, adminReason: undefined };
}
