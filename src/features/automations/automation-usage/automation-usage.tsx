import { useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult, Atom } from "effect/reactivity";
import { ApiClient } from "@/data/client/ApiClient";
import { Card } from "@/primitives/card";
import { SectionHeader } from "../automation-editor/parts";
import { automationReactivityKeys } from "../automations-list/automations-query";
import {
  type AutomationUsage,
  decodeAutomationUsage,
  formatSpend,
  usageCaption,
} from "./usage";
import { UsageChart } from "./usage-chart";

const timeToLive = "5 minutes";

const usageAtom = Atom.family((key: string) => {
  const [orgId = "", automationId = ""] = key.split("\n");
  return ApiClient.query("automations", "usage", {
    params: { orgId, automationId },
    query: {},
    reactivityKeys: automationReactivityKeys(orgId),
    timeToLive,
  });
});

const empty: AutomationUsage = { runs: 0, credits: 0, points: [] };

/** `Usage` on `/automation/:id`: spend, runs in the last 30 days, and the daily chart. */
export function AutomationUsageSection({
  orgId,
  automationId,
}: {
  orgId: string | undefined;
  automationId: string;
}) {
  const result = useAtomValue(
    orgId === undefined
      ? usageAtom("\n")
      : usageAtom(`${orgId}\n${automationId}`),
  );
  const usage =
    orgId === undefined
      ? empty
      : decodeAutomationUsage(Option.getOrUndefined(AsyncResult.value(result)));
  return (
    <section className="flex flex-col gap-3">
      <SectionHeader title="Usage" subtitle="Runs and spend per day" />
      <Card className="-mx-4">
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-medium text-foreground">
              {formatSpend(usage.credits)}
            </span>
            <span className="text-xs font-normal text-muted-foreground-2">
              {usageCaption(usage.runs)}
            </span>
          </div>
          <UsageChart points={usage.points} />
        </div>
      </Card>
    </section>
  );
}
