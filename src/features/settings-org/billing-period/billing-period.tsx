import type { ReactNode } from "react";
import {
  formatMachine,
  type MachineSize,
  machineHourRates,
  reviewEfforts,
} from "@/components/plan-picker";
import {
  type BillingBalance,
  formatCount,
  formatCredits,
  formatShortDate,
  type IncludedUsage,
} from "@/lib/billing";
import { Button } from "@/primitives/button";

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

export type MeterTone =
  | "primary"
  | "neutral"
  | "warning"
  | "danger"
  | "success"
  | "info"
  | "purple"
  | "orange"
  | "pink";

const toneClass: Record<MeterTone, string> = {
  primary: "bg-primary",
  neutral: "bg-muted-foreground-2",
  warning: "bg-warning",
  danger: "bg-destructive",
  success: "bg-success",
  info: "bg-info",
  purple: "bg-purple",
  orange: "bg-orange",
  pink: "bg-pink",
};

export type MeterSegment = { fraction: number; tone: MeterTone };

/** Clamps segments so together they never pass a full bar. */
export function meterWidths(segments: readonly MeterSegment[]) {
  let left = 1;
  return segments.map((segment) => {
    const width = Math.max(0, Math.min(left, segment.fraction));
    left -= width;
    return { width, tone: segment.tone };
  });
}

export function Meter({
  segments,
  track = "neutral",
  className,
}: {
  segments: readonly MeterSegment[];
  track?: "neutral" | "warning";
  className?: string;
}) {
  return (
    <div
      data-slot="meter"
      className={cx(
        "flex h-1.5 w-full overflow-hidden rounded-full",
        track === "warning" ? "bg-warning/30" : "bg-secondary",
        className,
      )}
    >
      {meterWidths(segments).map((segment, index) =>
        segment.width === 0 ? null : (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: segments are positional
            key={index}
            className={cx("h-full", toneClass[segment.tone])}
            style={{ width: `${segment.width * 100}%` }}
          />
        ),
      )}
    </div>
  );
}

export type MeterRowProps = {
  id?: string;
  label: ReactNode;
  value: ReactNode;
  segments?: readonly MeterSegment[];
  track?: "neutral" | "warning";
  line: ReactNode;
  strongLine?: boolean;
  action?: ReactNode;
};

export function MeterRow({
  id,
  label,
  value,
  segments,
  track,
  line,
  strongLine = false,
  action,
}: MeterRowProps) {
  const lineNode = (
    <span
      className={cx(
        "text-xs font-normal tabular-nums",
        strongLine ? "text-foreground" : "text-muted-foreground-2",
      )}
    >
      {line}
    </span>
  );
  return (
    <div id={id} className="flex flex-col gap-2 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm font-medium text-foreground tabular-nums">
          {value}
        </span>
      </div>
      {segments !== undefined && <Meter segments={segments} track={track} />}
      {action === undefined ? (
        lineNode
      ) : (
        <div className="flex min-h-(--h-control-sm) items-center justify-between gap-3">
          {lineNode}
          {action}
        </div>
      )}
    </div>
  );
}

const featureLabels = {
  machine_hours: "Machine hours",
  review_credits: "Review credits",
} as const;

const mediumReviewCredits =
  reviewEfforts.find((effort) => effort.key === "medium")?.credits ?? 1;

/** The line under an included-usage meter. */
export function includedLine(entry: IncludedUsage, size: MachineSize) {
  const remaining = Math.max(0, entry.remaining);
  if (remaining <= 0)
    return `Now using your balance${entry.resetsAt === null ? "" : ` until ${formatShortDate(entry.resetsAt)}`}`;
  return entry.feature === "machine_hours"
    ? `About ${formatCount(remaining / machineHourRates[size])} h on ${formatMachine(size)}`
    : `About ${formatCount(remaining / mediumReviewCredits)} Medium reviews`;
}

function IncludedRow({
  entry,
  size,
}: {
  entry: IncludedUsage;
  size: MachineSize;
}) {
  const remaining = Math.max(0, entry.remaining);
  const exhausted = remaining <= 0;
  return (
    <MeterRow
      label={featureLabels[entry.feature]}
      value={`${formatCount(remaining)} left of ${formatCount(entry.granted)}`}
      segments={
        exhausted
          ? []
          : [
              {
                fraction: Math.min(1, remaining / entry.granted),
                tone: "primary",
              },
            ]
      }
      track={exhausted ? "warning" : "neutral"}
      strongLine={exhausted}
      line={includedLine(entry, size)}
    />
  );
}

/** Splits the remaining balance into its plan part and its purchased part. */
export function balanceSegments(balance: BillingBalance): MeterSegment[] {
  const fraction =
    balance.grantedCredits === 0
      ? 0
      : Math.min(
          1,
          Math.max(0, balance.remainingCredits / balance.grantedCredits),
        );
  const planShare =
    balance.planRemainingCredits != null && balance.remainingCredits > 0
      ? balance.planRemainingCredits / balance.remainingCredits
      : 1;
  return [
    { fraction: fraction * planShare, tone: "primary" },
    { fraction: fraction * (1 - planShare), tone: "neutral" },
  ];
}

export type PeriodMetersProps = {
  included: readonly IncludedUsage[];
  balance: BillingBalance | null;
  balanceId: string;
  defaultSize: MachineSize;
  isAdmin: boolean;
  adminReason?: string;
  onAddBalance: () => void;
};

export function PeriodMeters({
  included,
  balance,
  balanceId,
  defaultSize,
  isAdmin,
  adminReason,
  onAddBalance,
}: PeriodMetersProps) {
  const addBalance = (
    <Button
      variant="ghost"
      size="sm"
      disabled={!isAdmin}
      title={adminReason}
      onClick={onAddBalance}
    >
      Add balance
    </Button>
  );
  return (
    <>
      {included.map((entry) => (
        <IncludedRow key={entry.feature} entry={entry} size={defaultSize} />
      ))}
      {balance?.unlimited === true ? (
        <MeterRow
          id={balanceId}
          label="Usage balance"
          value="Unlimited"
          line="Unlimited credit grant"
        />
      ) : balance === null ? (
        <MeterRow
          id={balanceId}
          label="Usage balance"
          value={formatCredits(0)}
          line="Purchased credits never expire"
          action={addBalance}
        />
      ) : (
        <MeterRow
          id={balanceId}
          label="Usage balance"
          value={
            balance.remainingCredits < 0 ? (
              <span className="text-destructive">
                {formatCredits(balance.remainingCredits)}
              </span>
            ) : (
              formatCredits(balance.remainingCredits)
            )
          }
          segments={balanceSegments(balance)}
          line={`Used ${formatCredits(balance.usedCredits)} of ${formatCredits(balance.grantedCredits)}`}
          action={addBalance}
        />
      )}
    </>
  );
}
