import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import {
  type MachineSize,
  planTierOf,
  tierLimits,
} from "@/components/plan-picker/plan-catalog";
import type { OrgId } from "@/data/api/schemas/ids";
import { billingAtom } from "@/data/atoms/billing";
import { currentPlan, toBillingView } from "@/lib/billing";

/** What the org's plan lets it pick, as the machine menu gates it. */
export type MachineEntitlements = {
  /** The largest size the plan permits; null leaves every size open. */
  maxSize: MachineSize | null;
  /** Whether the plan reaches the Big Guy machine; no plan reaches it today. */
  bigGuyAvailable: boolean;
};

const unlimited: MachineEntitlements = {
  maxSize: null,
  bigGuyAvailable: false,
};

/** The sizes a billing plan id permits, from the plan catalog's own limits. */
export const planMachineEntitlements = (
  planId: string | undefined,
): MachineEntitlements => {
  const tier = planId === undefined ? undefined : planTierOf(planId);
  if (tier === undefined) return unlimited;
  const maxSize = tierLimits[tier].maxMachineSize;
  return { maxSize, bigGuyAvailable: maxSize === "bigguy" };
};

/** The org's plan, read once from billing; an unread plan leaves every size open. */
export function useMachineEntitlements(
  orgId: OrgId | undefined,
): MachineEntitlements {
  const result = useAtomValue(billingAtom(orgId ?? ""));
  if (orgId === undefined) return unlimited;
  const billing = AsyncResult.getOrElse(result, () => undefined);
  if (billing === undefined) return unlimited;
  return planMachineEntitlements(
    currentPlan(toBillingView(billing).plans)?.planId,
  );
}
