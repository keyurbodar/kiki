import { useAtomValue } from "@effect/atom-react";
import {
  decodeUsageSummary,
  usageQueryKey,
  usageSummaryAtom,
} from "@/features/settings-org/org-usage-page/data";
import type { MachineHourMeter } from "./machine-usage";
import { resultValue } from "./use-org";

/**
 * The org's machine-hour allowance, from the billing usage payload. The two
 * fields are mock-only today, so a payload without them yields undefined and
 * the Limits row leaves its usage line out.
 */
export function useMachineUsage(orgId: string): MachineHourMeter | undefined {
  const summary = resultValue(
    useAtomValue(usageSummaryAtom(usageQueryKey(orgId, {}))),
  );
  if (summary === undefined) return undefined;
  const decoded = decodeUsageSummary(summary);
  return decoded.machineHourAllowance === null ||
    decoded.machineHoursConsumed === null
    ? undefined
    : {
        allowance: decoded.machineHourAllowance,
        consumed: decoded.machineHoursConsumed,
      };
}
