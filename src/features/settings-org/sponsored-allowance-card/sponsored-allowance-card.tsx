import { Meter } from "@/features/settings-org/billing-period";
import { formatCredits, type SponsoredAllowance } from "@/lib/billing";
import { Card } from "@/primitives/card";
import { SettingsRow } from "@/primitives/settings-row";
import { Switch } from "@/primitives/switch";

const productsLabel = (products: readonly string[]) =>
  products.includes("agent") && products.includes("review")
    ? "Capy Agent and reviews"
    : products.includes("agent")
      ? "Capy Agent"
      : "reviews";

export const allowanceTitle = (allowance: SponsoredAllowance) =>
  `${formatCredits(allowance.amountCredits)} per ${allowance.period} for ${productsLabel(allowance.products)}`;

/** How the sponsored pools are charged, under the section heading. */
export function allowancePoolsLine(allowances: readonly SponsoredAllowance[]) {
  const products = allowances.flatMap((allowance) => allowance.products);
  if (!products.includes("review"))
    return "Reviews are charged to paid credits";
  if (!products.includes("agent"))
    return "Capy Agent is charged to paid credits";
  return allowances.length === 1
    ? "Capy Agent and reviews share one pool"
    : "Capy Agent and reviews draw from separate pools";
}

export const allowanceResetLabel = (value: Date, timeZone?: string) =>
  value.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "shortOffset",
    timeZone,
  });

export const paidFallthroughLine = (enabled: boolean, customer: boolean) =>
  enabled
    ? customer
      ? "Covered work keeps running on the organization balance after its allowance is spent"
      : "Requires a plan or balance before covered work can continue"
    : "Covered work stops when its allowance is spent, until the next reset";

export type SponsoredAllowanceCardProps = {
  allowances: readonly SponsoredAllowance[];
  customer: boolean;
  isAdmin: boolean;
  adminReason?: string;
  updating: boolean;
  onPaidFallthroughChange: (enabled: boolean) => void;
};

export function SponsoredAllowanceCard({
  allowances,
  customer,
  isAdmin,
  adminReason,
  updating,
  onPaidFallthroughChange,
}: SponsoredAllowanceCardProps) {
  const fallthrough = allowances.some((allowance) => allowance.paidFallthrough);
  return (
    <Card rows>
      {allowances.map((allowance) => (
        <div key={allowance.id} className="flex flex-col gap-2 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <span className="text-sm font-medium text-foreground">
              {allowanceTitle(allowance)}
            </span>
            <span className="shrink-0 text-sm font-medium text-foreground tabular-nums">
              {formatCredits(allowance.remainingCredits)} remaining
            </span>
          </div>
          <Meter
            segments={[
              {
                fraction:
                  allowance.amountCredits === 0
                    ? 0
                    : Math.min(
                        1,
                        allowance.remainingCredits / allowance.amountCredits,
                      ),
                tone: "primary",
              },
            ]}
          />
          <span className="text-xs font-normal text-muted-foreground-2 tabular-nums">
            {`Used ${formatCredits(allowance.usedCredits)} of ${formatCredits(allowance.amountCredits)}, resets ${allowance.resetAt === null ? "" : allowanceResetLabel(allowance.resetAt)}`}
          </span>
        </div>
      ))}
      <SettingsRow
        label="Continue on paid credits"
        description={paidFallthroughLine(fallthrough, customer)}
      >
        <Switch
          checked={fallthrough}
          disabled={!isAdmin || updating}
          title={isAdmin ? undefined : adminReason}
          aria-label="Continue on paid credits after the sponsored allowance"
          onCheckedChange={onPaidFallthroughChange}
        />
      </SettingsRow>
    </Card>
  );
}
