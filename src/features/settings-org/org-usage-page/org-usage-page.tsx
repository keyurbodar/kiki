import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { useMemo, useState } from "react";
import { SettingsPage, SettingsSection } from "@/components/settings-page";
import { organizationsAtom } from "@/data/atoms/session.ts";
import { ApiClient } from "@/data/client/ApiClient.ts";
import { Button } from "@/primitives/button";
import { BreakdownSection } from "./breakdown-section";
import { CycleHeader } from "./cycle-header";
import { DateControls } from "./date-controls";
import { HistorySection } from "./history-section";
import { LeaderboardSection } from "./leaderboard-section";
import {
  buildPrincipals,
  loadResult,
  resolveRange,
  type UsageQuery,
} from "./model";
import type {
  UsageBreakdownRoute,
  UsageMemberRow,
  UsageSeries,
  UsageSummary,
} from "./types";
import { UsageChartSection } from "./usage-chart-section";

function useUsageRead<A>(
  endpoint: "usage" | "usageSeries" | "usageBreakdown" | "usageMemberEntries",
  orgId: string,
  query: Record<string, string>,
  timeToLive: "1 minute" | "5 minutes",
) {
  const _serialized = JSON.stringify(query);
  return useAtomValue(
    useMemo(
      () =>
        ApiClient.query("billing", endpoint, {
          params: { orgId },
          query,
          reactivityKeys: [`billing:${orgId}`],
          timeToLive,
        } as never),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [endpoint, orgId, query, timeToLive],
    ) as never,
  ) as AsyncResult<A, unknown>;
}

export function SettingsOrgUsagePage() {
  const organizations = useAtomValue(organizationsAtom);
  const orgId = AsyncResult.isSuccess(organizations)
    ? organizations.value[0]?.id ?? "org_sample_acme"
    : "org_sample_acme";
  const [search, setSearch] = useState<UsageQuery>({ preset: "period" });
  const now = useMemo(() => new Date(), []);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const range = useMemo(
    () => resolveRange(search, now, timeZone),
    [search.preset, search.from, search.to, now, timeZone, search],
  );
  const set = (patch: Partial<UsageQuery>) =>
    setSearch((current) => ({ ...current, ...patch }));

  const scope: Record<string, string> = {
    timeZone,
    from: range.from.toISOString(),
    to: range.to.toISOString(),
  };
  if (search.route !== undefined) scope.route = search.route;
  if (search.scope === "you") scope.principal = "user_sample_alex";
  const summaryResult = useUsageRead<UsageSummary>(
    "usage",
    orgId,
    scope,
    "1 minute",
  );
  const seriesResult = useUsageRead<UsageSeries>(
    "usageSeries",
    orgId,
    {
      ...scope,
      dimension: search.dim ?? "routes",
    },
    "1 minute",
  );
  const breakdownResult = useUsageRead<ReadonlyArray<UsageBreakdownRoute>>(
    "usageBreakdown",
    orgId,
    scope,
    "1 minute",
  );
  const leaderboardResult = useUsageRead<ReadonlyArray<UsageMemberRow>>(
    "usageMemberEntries",
    orgId,
    scope,
    "1 minute",
  );
  const principals = useMemo(() => buildPrincipals(), []);
  const included = loadResult(summaryResult)?.included ?? [];

  return (
    <SettingsPage
      title="Usage"
      description="Spend across models, images, members, and machines"
      width="wide"
    >
      <CycleHeader
        now={now}
        summary={loadResult(summaryResult)}
        orgId={orgId}
      />
      <DateControls
        search={search}
        range={range}
        set={set}
        routes={[
          "paid",
          "byok",
          "subscription",
          "allowance",
          "internal",
          "no_charge",
        ]}
      />
      <UsageChartSection
        series={loadResult(seriesResult)}
        range={range}
        dimension={search.dim ?? "routes"}
        onDimension={(dim) => set({ dim })}
      />
      <SettingsSection title="Breakdown">
        <BreakdownSection
          value={loadResult(breakdownResult)}
          route={search.route}
        />
      </SettingsSection>
      {included.length > 0 && (
        <SettingsSection
          title="Included this period"
          description={
            included[0]?.resetsAt == null
              ? undefined
              : `Resets ${new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                }).format(new Date(included[0].resetsAt))}`
          }
        >
          <div className="flex flex-col gap-2 p-4">
            {included.map((item) => (
              <div
                key={item.feature}
                className="flex items-center justify-between gap-4 text-sm text-foreground"
              >
                <span>{item.feature.replaceAll("_", " ")}</span>
                <span className="tabular-nums">
                  {item.used} of {item.granted}
                </span>
              </div>
            ))}
          </div>
        </SettingsSection>
      )}
      <SettingsSection
        title="By member"
        description={
          search.board === "tokens"
            ? "Model tokens on every route: Capy credits, subscriptions, and BYOK keys"
            : "Total billed is what the org actually pays: model, image, and machine spend on Capy credits, plus Capy token fees on subscription and BYOK usage"
        }
        action={
          <div className="flex items-center gap-1.5">
            {[undefined, "tokens"].map((board) => (
              <Button
                key={String(board)}
                data-track-owner="features/settings/org-usage-page.tsx#SettingsOrgUsagePage:Button.3"
                size="sm"
                variant="ghost"
                data-selected={search.board === board ? "" : undefined}
                onClick={() => set({ board: board as UsageQuery["board"] })}
              >
                {board === "tokens" ? "Tokens" : "Cost"}
              </Button>
            ))}
          </div>
        }
      >
        <LeaderboardSection
          value={loadResult(leaderboardResult)}
          principals={principals}
          metric={search.board ?? "cost"}
        />
      </SettingsSection>
      <SettingsSection
        title="History"
        action={
          <div className="flex items-center gap-1.5">
            {(["cost", "activity", "created"] as const).map((order) => (
              <Button
                key={order}
                data-track-owner="features/settings/org-usage-page.tsx#SettingsOrgUsagePage:Button.4"
                size="xs"
                variant="ghost"
                data-selected={
                  (search.order ?? "cost") === order ? "" : undefined
                }
                onClick={() =>
                  set({ order: order === "cost" ? undefined : order })
                }
              >
                {
                  {
                    cost: "Cost",
                    activity: "Last activity",
                    created: "Created",
                  }[order]
                }
              </Button>
            ))}
          </div>
        }
      >
        <HistorySection
          orgId={orgId}
          scope={scope}
          order={search.order ?? "cost"}
          principals={principals}
        />
      </SettingsSection>
    </SettingsPage>
  );
}
