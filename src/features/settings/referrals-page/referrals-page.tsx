/** biome-ignore-all lint/a11y/useSemanticElements: Capy renders history as an ARIA grid of divs over CSS subgrid */
/** biome-ignore-all lint/a11y/noNoninteractiveTabindex: the grid rows and cells are static */
/** biome-ignore-all lint/a11y/useFocusableInteractive: rows and cells are not interactive */
import { type CSSProperties, useState } from "react";
import { toast } from "sonner";
import { ReferralInviteDialog } from "@/components/referral-invite-dialog";
import { SettingsPage, SettingsSection } from "@/components/settings-page";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { CopyField } from "@/primitives/copy-field";
import { Input } from "@/primitives/input";
import { SettingsRow } from "@/primitives/settings-row";
import {
  kickbackProgress,
  kickbackTarget,
  type ReferralSummary,
  referralLink,
  sampleReferrals,
  signedUsd,
  usd,
} from "./referrals-model";

const tableHeadCell =
  "flex min-w-0 items-center gap-0.5 pr-4 text-xs font-normal whitespace-nowrap text-muted-foreground-1 select-none";

const tableCell =
  "relative flex min-h-(--table-row-h) min-w-0 items-center pr-4";

export type ReferralsPageProps = { summary?: ReferralSummary };

export function ReferralsPage({
  summary = sampleReferrals,
}: ReferralsPageProps) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const progress = kickbackProgress(summary);
  const link =
    summary.eligible && typeof window !== "undefined"
      ? referralLink(window.location.origin, summary.code)
      : "";
  return (
    <>
      <SettingsPage
        title="Referrals"
        description="You and each referee earn up to $500 in credits after their first full-price payment"
      >
        <SettingsSection>
          <Card rows className="@container">
            <SettingsRow
              id="referral-link"
              label="Referral link"
              description={
                summary.eligible
                  ? "Anyone who signs up through it becomes your referee"
                  : "Available after a full-price payment in any organization you belong to"
              }
              className={
                summary.eligible
                  ? "@max-md:flex-col @max-md:items-stretch @max-md:[&>:last-child]:min-w-0"
                  : undefined
              }
            >
              {summary.eligible ? (
                <CopyField className="relative flex min-w-0 w-72">
                  <Input
                    size="sm"
                    readOnly
                    aria-label="referral link"
                    value={link}
                  />
                  <span className="absolute inset-y-0 flex items-center right-0.5">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Copy referral link"
                      onClick={() =>
                        void navigator.clipboard
                          ?.writeText(link)
                          .then(() => toast.success("Copied"))
                      }
                    />
                  </span>
                </CopyField>
              ) : null}
            </SettingsRow>
            <SettingsRow
              id="referral-invite"
              label="Invite by email"
              description="Up to 10 invitations a day"
            >
              <Button
                variant="ghost"
                disabled={!summary.eligible}
                onClick={() => setInviteOpen(true)}
              >
                Invite
              </Button>
            </SettingsRow>
            <SettingsRow
              id="referral-balance"
              label="Balance"
              description="Earned credits you can apply to an organization"
              className="@max-md:flex-col @max-md:items-stretch @max-md:[&>:last-child]:justify-between"
            >
              <span className="text-sm font-medium text-foreground tabular-nums">
                {usd(summary.balance)}
              </span>
              <Button variant="ghost" disabled={summary.balance < 1}>
                Apply credits
              </Button>
            </SettingsRow>
          </Card>
        </SettingsSection>
        <SettingsSection
          title="Monthly referral kickback"
          description="10 qualified referrals permanently unlock 1% of referred customers' subscription and credit-purchase cash collected"
        >
          <Card rows>
            <div>
              <SettingsRow
                label="Kickback unlock"
                description={
                  progress.unlocked
                    ? `${summary.qualifiedReferrals.toLocaleString("en-US")} qualified referrals, your kickback stays unlocked`
                    : "A referee qualifies after their first full-price payment"
                }
              >
                <span className="text-sm font-medium text-foreground tabular-nums">
                  {progress.unlocked
                    ? "Unlocked"
                    : `${progress.qualified.toLocaleString("en-US")} / ${kickbackTarget}`}
                </span>
              </SettingsRow>
              <div className="flex flex-col gap-2 px-4 pb-4">
                <div
                  role="progressbar"
                  aria-label="Referral kickback qualification"
                  aria-valuemin={0}
                  aria-valuemax={kickbackTarget}
                  aria-valuenow={progress.qualified}
                  aria-valuetext={progress.caption}
                  className="h-1 overflow-hidden rounded-(--radius-inner) bg-muted"
                >
                  <div
                    className="h-full bg-foreground"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground-1">
                  {progress.caption}
                </span>
              </div>
            </div>
            <SettingsRow
              label="Kickback starts"
              description="Each referee's first six calendar months after referral, payments collected from your kickback start date"
            >
              <span className="shrink-0 text-sm text-muted-foreground-1">
                {summary.kickbackStartsAt === null
                  ? summary.kickbackTier !== "none"
                    ? "Tier active"
                    : "Not unlocked"
                  : new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                    }).format(summary.kickbackStartsAt)}
              </span>
            </SettingsRow>
            <SettingsRow
              label="Kickback earned"
              description="Paid monthly to your referral wallet"
            >
              <span className="shrink-0 text-sm font-medium text-foreground tabular-nums">
                {usd(summary.kickbackEarned)}
              </span>
            </SettingsRow>
          </Card>
        </SettingsSection>
        <SettingsSection
          id="referral-history"
          title="History"
          description="Credit rewards and transfers, newest first"
        >
          <Card className="py-2">
            <div
              role="table"
              className="isolate grid w-full overflow-x-auto overscroll-x-contain px-4 [--table-fluid-min:0] [--table-lead-min:0] [--table-row-h:calc(var(--spacing)*11)] [--table-lead-bg:var(--card)]"
              style={
                {
                  "--table-auto-min": "calc(var(--spacing) * 18)",
                  gridTemplateColumns:
                    "minmax(var(--table-lead-min),3fr) minmax(var(--table-auto-min),auto) minmax(var(--table-auto-min),auto)",
                } as CSSProperties
              }
            >
              <div
                role="row"
                className="relative mb-0.5 col-span-full grid h-8 grid-cols-subgrid items-center [--table-lead-bg:var(--section)] before:absolute before:inset-y-0 before:-inset-x-2 before:rounded-(--radius-card) before:bg-section [&>*]:relative"
              >
                <div role="columnheader" className={tableHeadCell}>
                  Entry
                </div>
                <div
                  role="columnheader"
                  className={`${tableHeadCell} justify-end`}
                >
                  Amount
                </div>
                <div
                  role="columnheader"
                  className={`${tableHeadCell} justify-end`}
                >
                  Balance
                </div>
              </div>
              {summary.history.length === 0 ? (
                <div
                  role="row"
                  className="relative col-span-full grid grid-cols-subgrid"
                >
                  <div
                    role="cell"
                    className={`${tableCell} col-span-full text-muted-foreground-2`}
                  >
                    No rewards or applied credits yet
                  </div>
                </div>
              ) : (
                summary.history.map((entry) => (
                  <div
                    role="row"
                    key={entry.id}
                    className="relative col-span-full grid grid-cols-subgrid before:absolute before:inset-y-0 before:-inset-x-2 before:rounded before:transition-colors before:duration-100 hover:before:bg-section"
                  >
                    <div role="cell" className={tableCell}>
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="min-w-0 text-sm font-medium text-foreground">
                          {entry.title}
                        </span>
                        {entry.detail && (
                          <span className="text-xs font-normal text-muted-foreground-2">
                            {entry.detail}
                          </span>
                        )}
                      </span>
                    </div>
                    <div
                      role="cell"
                      className={`${tableCell} justify-end tabular-nums`}
                    >
                      {signedUsd(entry.delta)}
                    </div>
                    <div
                      role="cell"
                      className={`${tableCell} justify-end tabular-nums`}
                    >
                      {usd(entry.balance)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </SettingsSection>
      </SettingsPage>
      <ReferralInviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </>
  );
}
