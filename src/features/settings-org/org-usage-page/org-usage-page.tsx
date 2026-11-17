import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { useMemo, useState } from "react";
import { SettingsPage, SettingsSection } from "@/components/settings-page";
import { organizationsAtom } from "@/data/atoms/session.ts";
import { Button } from "@/primitives/button";
import { BreakdownSection } from "./breakdown-section";
import { CycleHeader } from "./cycle-header";
import {
  decodeUsageBreakdown,
  decodeUsageMembers,
  decodeUsageSeries,
  decodeUsageSummary,
  principalsOf,
  usageBreakdownAtom,
  usageMembersAtom,
  usageQueryKey,
  usageSeriesAtom,
  usageSummaryAtom,
} from "./data";
import { DateControls } from "./date-controls";
import { HistorySection } from "./history-section";
import { LeaderboardSection } from "./leaderboard-section";
import {
  dimensionWire,
  loadResult,
  resolveRange,
  type UsageQuery,
} from "./model";
import { UsageChartSection } from "./usage-chart-section";

const FALLBACK_ORG = "org_acme";

export function SettingsOrgUsagePage() {
  const organizations = useAtomValue(organizationsAtom);
  const orgId = AsyncResult.isSuccess(organizations)
    ? (organizations.value[0]?.id ?? FALLBACK_ORG)
    : FALLBACK_ORG;
  const [search, setSearch] = useState<UsageQuery>({ preset: "period" });
  const now = useMemo(() => new Date(), []);
  const timeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );

  const summary = loadResult(
    useAtomValue(usageSummaryAtom(usageQueryKey(orgId, {}))),
  );
  const decodedSummary =
    summary === undefined ? undefined : decodeUsageSummary(summary);
  const range = useMemo(
    () => resolveRange(search, now, timeZone, decodedSummary?.period?.start),
    [search, now, timeZone, decodedSummary?.period?.start],
  );
  const set = (patch: Partial<UsageQuery>) =>
    setSearch((current) => ({ ...current, ...patch }));

  const scope = useMemo(
    () => ({
      timeZone,
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      ...(search.scope === "you" ? { principal: "me" } : {}),
    }),
    [timeZone, range.from, range.to, search.scope],
  );
  const chartScope = useMemo(
    () => ({
      ...scope,
      dimension: dimensionWire(search.dim),
      ...(search.route === undefined ? {} : { route: search.route }),
    }),
    [scope, search.dim, search.route],
  );
  const dimension = search.dim ?? "routes";

  const series = loadResult(
    useAtomValue(usageSeriesAtom(usageQueryKey(orgId, chartScope))),
  );
  const decodedSeries =
    series === undefined ? undefined : decodeUsageSeries(series);
  const breakdownRaw = loadResult(
    useAtomValue(usageBreakdownAtom(usageQueryKey(orgId, scope))),
  );
  const decodedBreakdown =
    breakdownRaw === undefined ? undefined : decodeUsageBreakdown(breakdownRaw);
  const membersRaw = loadResult(
    useAtomValue(usageMembersAtom(usageQueryKey(orgId, scope))),
  );
  const decodedMembers =
    membersRaw === undefined ? undefined : decodeUsageMembers(membersRaw);
  const principals = useMemo(
    () => principalsOf(decodedMembers ?? []),
    [decodedMembers],
  );
  const routes = useMemo(
    () => [...new Set(decodedSeries?.keys.map((entry) => entry.key) ?? [])],
    [decodedSeries],
  );
  const included = decodedSummary?.included ?? [];

  return (
    <SettingsPage
      title="Usage"
      description="Spend across models, images, members, and machines"
      width="wide"
    >
      <SettingsSection>
        <CycleHeader now={now} summary={decodedSummary} />
      </SettingsSection>
      <SettingsSection>
        <DateControls
          search={search}
          range={range}
          set={set}
          routes={routes}
          showScope={(decodedMembers?.length ?? 0) > 1}
        />
      </SettingsSection>
      <SettingsSection>
        <UsageChartSection
          series={decodedSeries}
          range={range}
          dimension={dimension}
          onDimension={(dim) => set({ dim })}
        />
      </SettingsSection>
      <SettingsSection title="Breakdown">
        <BreakdownSection value={decodedBreakdown} route={search.route} />
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
          <div className="flex flex-col gap-2 px-4">
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
          value={decodedMembers}
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
          scopeKey={usageQueryKey(orgId, scope)}
          order={search.order ?? "cost"}
          principals={principals}
        />
      </SettingsSection>
    </SettingsPage>
  );
}
