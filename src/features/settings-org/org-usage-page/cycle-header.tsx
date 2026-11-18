import { Link } from "@tanstack/react-router";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { Skeleton } from "@/primitives/skeleton";
import { daysUntil, formatCredits, formatRangeLabel } from "./model";
import type { UsageSummary } from "./types";

/** The cycle the skeleton is drawn from: a real month, a real balance. */
const sampleSummary: UsageSummary = {
  period: { start: "2026-11-01T00:00:00Z", end: "2026-12-01T00:00:00Z" },
  balance: { unlimited: false, remainingCredits: 12_500 },
  included: [],
  machineHourAllowance: null,
  machineHoursConsumed: null,
};

export function CycleHeader({
  now,
  summary,
}: {
  now: Date;
  summary: UsageSummary | undefined;
}) {
  return (
    <Skeleton
      data={summary}
      sample={sampleSummary}
      id="usage-cycle-header"
      label="Loading usage"
    >
      {(value) => <CycleHeaderBody now={now} summary={value} />}
    </Skeleton>
  );
}

function CycleHeaderBody({
  now,
  summary,
}: {
  now: Date;
  summary: UsageSummary;
}) {
  const period =
    summary.period === null
      ? null
      : {
          start: new Date(summary.period.start),
          end: new Date(summary.period.end),
        };
  const days = period === null ? null : daysUntil(period.end, now);
  const label =
    period === null
      ? "Current month"
      : formatRangeLabel(period.start, period.end, "UTC");
  const balance = summary.balance;
  const negative =
    balance !== null && !balance.unlimited && balance.remainingCredits < 0;

  return (
    <Card className="flex-row items-center justify-between gap-3 p-4">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {days !== null && (
          <span className="text-xs font-normal text-muted-foreground-2">
            {days} days left in cycle
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {balance !== null && (
          <span className="text-xs font-normal text-muted-foreground-2">
            <span
              className={`text-sm font-medium tabular-nums ${negative ? "text-destructive" : "text-foreground"}`}
            >
              {balance.unlimited
                ? "Unlimited"
                : formatCredits(balance.remainingCredits)}
            </span>{" "}
            balance
          </span>
        )}
        <Button
          data-track-owner="features/settings/org-usage-page.tsx#CycleHeader:Button[Manage billing]"
          size="sm"
          variant="ghost"
          render={
            <Link
              data-track-owner="features/settings/org-usage-page.tsx#CycleHeader:Link.1"
              to="/settings/org/billing"
            />
          }
        >
          Manage billing
        </Button>
      </div>
    </Card>
  );
}
