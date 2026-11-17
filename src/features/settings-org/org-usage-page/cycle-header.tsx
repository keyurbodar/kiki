import { Link } from "@tanstack/react-router";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { SkeletonPanel } from "@/primitives/skeleton-panel";
import { daysUntil, formatCredits, formatRangeLabel } from "./model";
import type { UsageSummary } from "./types";

export function CycleHeader({
  now,
  summary,
}: {
  now: Date;
  summary: UsageSummary | undefined;
}) {
  if (summary === undefined) {
    return (
      <Card className="flex-row items-center justify-between gap-3 p-4">
        <SkeletonPanel className="h-4 w-40" />
      </Card>
    );
  }
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
