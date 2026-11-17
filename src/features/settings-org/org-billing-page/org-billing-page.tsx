import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { useLocation } from "@tanstack/react-router";
import { AsyncResult } from "effect/reactivity";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import type { MachineSize } from "@/components/plan-picker";
import { SettingsPage, SettingsSection } from "@/components/settings-page";
import {
  billingAtom,
  billingInvoicesAtom,
  billingReactivityKeys,
  cancelPlanAtom,
  cancelSsoAddOnAtom,
  keepPlanAtom,
  keepSsoAddOnAtom,
  openAutoReloadPaymentAtom,
  openBillingPortalAtom,
  orgMembersAtom,
  retryAutoReloadAtom,
  updateReceiptsAtom,
  updateSponsoredPaidFallthroughAtom,
} from "@/data/atoms/billing";
import {
  AddBalanceDialog,
  AutoReloadDialog,
  BillingConfirmDialog,
  CancelPlanDialog,
  PlanDialog,
  ReceiptEmailDialog,
  useBillingAdmin,
  useBillingOrgId,
  useBillingView,
} from "@/features/settings-org/billing-dialogs";
import { MeterRow, PeriodMeters } from "@/features/settings-org/billing-period";
import {
  allowancePoolsLine,
  SponsoredAllowanceCard,
} from "@/features/settings-org/sponsored-allowance-card";
import {
  autoReloadLine,
  type BillingInvoice,
  type BillingPlan,
  type BillingView,
  type CreditSource,
  capitalize,
  creditSourceLine,
  currentPlan,
  errorMessage,
  formatBillingDate,
  formatCents,
  formatCredits,
  invoiceTitle,
  machineMemoryLine,
  planCancelDate,
  planDescription,
  planDisplayName,
  receiptsLine,
  type SsoAddOn,
  scheduledPlan,
  toBillingInvoices,
} from "@/lib/billing";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/primitives/collapsible";
import { SettingsRow, SettingsRowLink } from "@/primitives/settings-row";
import { SkeletonPanel } from "@/primitives/skeleton-panel";
import { Switch } from "@/primitives/switch";
import { Table } from "@/primitives/table";

const DEFAULT_MACHINE_SIZE: MachineSize = "large";
const DAY_MS = 24 * 60 * 60 * 1000;
const DETAIL_ANCHORS = new Set([
  "org-billing-credit-sources",
  "org-billing-sponsored-allowance",
]);

const compProgramLabel = (program: string | null) =>
  program === "oss"
    ? "Open source program"
    : program === "ambassador"
      ? "Ambassador program"
      : program === "partner"
        ? "Partner program"
        : "Comped by Capy";

function BillingUnavailableCard({
  label,
  description,
  onRetry,
}: {
  label: string;
  description: string;
  onRetry: () => void;
}) {
  return (
    <Card>
      <SettingsRow
        label={label}
        description={description}
        descriptionTone="strong"
      >
        <Button variant="ghost" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </SettingsRow>
    </Card>
  );
}

function SsoAddOnRow({
  addOn,
  isAdmin,
  adminReason,
  onCancel,
  onKeep,
}: {
  addOn: SsoAddOn;
  isAdmin: boolean;
  adminReason?: string;
  onCancel: () => void;
  onKeep: () => void;
}) {
  const cancelling = addOn.status === "cancelling";
  return (
    <SettingsRow
      label={
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="truncate">Single sign-on</span>
          {cancelling && addOn.currentPeriodEnd !== null && (
            <Badge color="warning">
              Cancels {formatBillingDate(addOn.currentPeriodEnd)}
            </Badge>
          )}
        </span>
      }
      description={
        addOn.status === "included"
          ? "Included in your plan"
          : cancelling
            ? "Single sign-on turns off when the add-on ends"
            : addOn.currentPeriodEnd === null
              ? `${formatCents(addOn.priceCents)} a month`
              : `${formatCents(addOn.priceCents)} a month, renews ${formatBillingDate(addOn.currentPeriodEnd)}`
      }
    >
      {addOn.status !== "included" && (
        <Button
          variant="ghost"
          size="sm"
          disabled={!isAdmin}
          title={adminReason}
          onClick={cancelling ? onKeep : onCancel}
        >
          {cancelling ? "Keep" : "Cancel"}
        </Button>
      )}
    </SettingsRow>
  );
}

function WorkspaceRows({ memberCount }: { memberCount: number | undefined }) {
  return (
    <>
      <SettingsRow
        id="org-billing-workspace-type"
        label="Workspace type"
        description={
          memberCount === undefined
            ? "Based on active members"
            : memberCount > 1
              ? "Shared organization workspace"
              : "Individual workspace"
        }
      >
        {memberCount === undefined ? (
          <SkeletonPanel className="h-5 w-16" />
        ) : (
          <span className="text-sm font-medium text-foreground">
            {memberCount > 1 ? "Team" : "Personal"}
          </span>
        )}
      </SettingsRow>
      <SettingsRowLink
        to="/settings/org/members"
        label="Members"
        description={
          memberCount === undefined ? (
            <SkeletonPanel className="h-4 w-24" />
          ) : (
            `${memberCount} active ${memberCount === 1 ? "member" : "members"}`
          )
        }
      />
    </>
  );
}

function CreditSourceRow({ source }: { source: CreditSource }) {
  return (
    <tr>
      <td>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-foreground">
            {source.name}
          </span>
          <span className="text-xs font-normal text-muted-foreground-2">
            {creditSourceLine(source)}
          </span>
        </span>
      </td>
      <td className="text-right tabular-nums">
        {formatCredits(source.grantedCredits)}
      </td>
      <td className="text-right text-sm font-medium text-foreground tabular-nums">
        {formatCredits(source.remainingCredits)}
      </td>
    </tr>
  );
}

function InvoiceRow({ invoice }: { invoice: BillingInvoice }) {
  return (
    <tr>
      <td>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-foreground">
            {invoiceTitleFor(invoice)}
          </span>
          {invoice.createdAt !== null && (
            <span className="text-xs font-normal text-muted-foreground-2">
              {formatBillingDate(invoice.createdAt)}
            </span>
          )}
        </span>
      </td>
      <td>
        {invoice.status === "paid" ? (
          <span className="text-xs font-normal text-muted-foreground-2">
            Paid
          </span>
        ) : invoice.status === "open" ? (
          <span className="text-xs font-normal text-warning-fg">Unpaid</span>
        ) : (
          <Badge size="sm" color="neutral">
            {capitalize(invoice.status)}
          </Badge>
        )}
      </td>
      <td className="text-right text-sm font-medium text-foreground tabular-nums">
        {formatCents(invoice.totalCents)}
      </td>
      <td className="pr-0 text-right">
        <Button
          variant="ghost"
          size="sm"
          disabled={invoice.hostedInvoiceUrl === null}
          onClick={() => {
            if (invoice.hostedInvoiceUrl !== null)
              window.open(invoice.hostedInvoiceUrl, "_blank");
          }}
        >
          View
        </Button>
      </td>
    </tr>
  );
}

const invoiceTitleFor = (invoice: BillingInvoice) =>
  invoiceTitle(invoice.planIds);

function FullRow({ children }: { children: ReactNode }) {
  return (
    <tr>
      <td colSpan={4}>{children}</td>
    </tr>
  );
}

export type BillingPageViewProps = {
  billing: BillingView;
  freeLine?: string;
  invoiceItems: BillingInvoice[] | undefined;
  memberCount: number | undefined;
  isAdmin: boolean;
  adminReason?: string;
  sponsoredUpdating: boolean;
  receiptEmail: string | null;
  receiptsUpdating: boolean;
  billingStale: boolean;
  invoicesFailed: boolean;
  onChoosePlan: () => void;
  onKeepPlan: () => void;
  onCancelSsoAddOn: () => void;
  onKeepSsoAddOn: () => void;
  onAddBalance: () => void;
  onConfigureAutoReload: () => void;
  onOpenPortal: () => void;
  onCompleteCheckout: (attemptId: string) => void;
  onRetryReload: () => void;
  onPaidFallthroughChange: (enabled: boolean) => void;
  onReceiptsChange: (enabled: boolean) => void;
  onEditReceiptEmail: () => void;
  onRetryBilling: () => void;
  onRetryInvoices: () => void;
};

export function BillingPageView({
  billing,
  freeLine,
  invoiceItems,
  memberCount,
  isAdmin,
  adminReason,
  sponsoredUpdating,
  receiptEmail,
  receiptsUpdating,
  billingStale,
  invoicesFailed,
  onChoosePlan,
  onKeepPlan,
  onCancelSsoAddOn,
  onKeepSsoAddOn,
  onAddBalance,
  onConfigureAutoReload,
  onOpenPortal,
  onCompleteCheckout,
  onRetryReload,
  onPaidFallthroughChange,
  onReceiptsChange,
  onEditReceiptEmail,
  onRetryBilling,
  onRetryInvoices,
}: BillingPageViewProps) {
  const plan = currentPlan(billing.plans);
  const scheduled = scheduledPlan(billing.plans);
  const comp = billing.comp;
  const compDays =
    comp === null
      ? undefined
      : Math.ceil((comp.endsAt.getTime() - Date.now()) / DAY_MS);
  const cancelsOn = planCancelDate(plan);
  const sources =
    billing.balance === null || billing.balance.unlimited
      ? []
      : billing.balance.sources;
  const reload = billing.autoReload;
  const attempt = reload.latestAttempt;
  const memory = billing.machineMemory;
  const hash = useLocation({ select: (location) => location.hash });
  const [detailsOpen, setDetailsOpen] = useState(DETAIL_ANCHORS.has(hash));
  const [seenHash, setSeenHash] = useState(hash);
  if (hash !== seenHash) {
    setSeenHash(hash);
    if (DETAIL_ANCHORS.has(hash)) setDetailsOpen(true);
  }

  const planAction =
    comp !== null ? (
      <Badge>{compProgramLabel(comp.program)}</Badge>
    ) : scheduled === undefined ? (
      <Button
        variant="ghost"
        size="sm"
        disabled={!isAdmin}
        title={adminReason}
        onClick={onChoosePlan}
      >
        {plan === undefined ? "Choose a plan" : "Change plan"}
      </Button>
    ) : (
      <Button
        variant="ghost"
        size="sm"
        disabled={!isAdmin}
        title={adminReason}
        onClick={onKeepPlan}
      >
        Keep plan
      </Button>
    );

  return (
    <>
      {billingStale && (
        <SettingsSection>
          <BillingUnavailableCard
            label="Showing the last loaded billing details"
            description="The latest read did not come back, so these numbers may be out of date"
            onRetry={onRetryBilling}
          />
        </SettingsSection>
      )}
      <SettingsSection title="This period">
        <Card rows>
          <SettingsRow
            label={
              <span className="flex min-w-0 items-center gap-2.5">
                <span id="org-billing-plan" className="truncate">
                  {plan === undefined
                    ? "No plan"
                    : planDisplayName(plan.planId, plan.name)}
                </span>
                {compDays !== undefined && compDays > 0 && compDays <= 7 && (
                  <Badge color="warning">
                    Ends in {compDays} {compDays === 1 ? "day" : "days"}
                  </Badge>
                )}
                {comp === null && cancelsOn !== undefined && (
                  <Badge color="warning">
                    Cancels {formatBillingDate(cancelsOn)}
                  </Badge>
                )}
                {comp === null && scheduled !== undefined && (
                  <Badge color="warning">
                    {planDisplayName(scheduled.planId, scheduled.name).replace(
                      /^Capy /,
                      "",
                    )}
                    {plan?.currentPeriodEnd == null
                      ? " next cycle"
                      : ` from ${plan.currentPeriodEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                  </Badge>
                )}
              </span>
            }
            description={planDescription(billing, plan, scheduled, freeLine)}
          >
            {planAction}
          </SettingsRow>
          {billing.ssoAddOn !== null && billing.ssoAddOn.status !== "none" && (
            <SsoAddOnRow
              addOn={billing.ssoAddOn}
              isAdmin={isAdmin}
              adminReason={adminReason}
              onCancel={onCancelSsoAddOn}
              onKeep={onKeepSsoAddOn}
            />
          )}
          {billing.pendingInvoiceUrl !== null && (
            <SettingsRow
              label="Invoice awaiting payment"
              description="Paying it activates the plan's credits"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (billing.pendingInvoiceUrl !== null)
                    window.open(billing.pendingInvoiceUrl, "_blank");
                }}
              >
                View invoice
              </Button>
            </SettingsRow>
          )}
          <PeriodMeters
            included={billing.included}
            balance={billing.balance}
            balanceId="org-billing-balance"
            defaultSize={DEFAULT_MACHINE_SIZE}
            isAdmin={isAdmin}
            adminReason={adminReason}
            onAddBalance={onAddBalance}
          />
        </Card>
        {(sources.length > 0 || billing.sponsoredAllowances.length > 0) && (
          <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
            <div className="px-4">
              <CollapsibleTrigger>Balance details</CollapsibleTrigger>
            </div>
            <CollapsiblePanel>
              <div className="mt-3 flex flex-col gap-6">
                {sources.length > 0 && (
                  <div
                    id="org-billing-credit-sources"
                    className="flex flex-col gap-3"
                  >
                    <h3 className="px-4 text-sm font-medium text-foreground">
                      Credit sources
                    </h3>
                    <Card>
                      <Table density="pick">
                        <thead>
                          <tr>
                            <th>Source</th>
                            <th className="text-right">Amount</th>
                            <th className="text-right">Remaining</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sources.map((source) => (
                            <CreditSourceRow key={source.id} source={source} />
                          ))}
                        </tbody>
                      </Table>
                    </Card>
                  </div>
                )}
                {billing.sponsoredAllowances.length > 0 && (
                  <div
                    id="org-billing-sponsored-allowance"
                    className="flex flex-col gap-3"
                  >
                    <div className="flex flex-col gap-1 px-4">
                      <h3 className="text-sm font-medium text-foreground">
                        Sponsored allowance
                      </h3>
                      <p className="text-sm font-normal text-muted-foreground-2">
                        {allowancePoolsLine(billing.sponsoredAllowances)}
                      </p>
                    </div>
                    <SponsoredAllowanceCard
                      allowances={billing.sponsoredAllowances}
                      customer={billing.customer}
                      isAdmin={isAdmin}
                      adminReason={adminReason}
                      updating={sponsoredUpdating}
                      onPaidFallthroughChange={onPaidFallthroughChange}
                    />
                  </div>
                )}
              </div>
            </CollapsiblePanel>
          </Collapsible>
        )}
      </SettingsSection>
      <SettingsSection title="Workspace">
        <Card rows>
          <WorkspaceRows memberCount={memberCount} />
          {memory !== null && (
            <MeterRow
              id="org-billing-machine-memory"
              label="Machine memory"
              value={`${memory.runningGb} of ${memory.budgetGb} GB`}
              segments={[
                {
                  fraction:
                    memory.budgetGb === 0
                      ? 0
                      : memory.runningGb / memory.budgetGb,
                  tone:
                    memory.runningGb >= memory.budgetGb ? "warning" : "primary",
                },
              ]}
              line={machineMemoryLine(memory)}
            />
          )}
        </Card>
      </SettingsSection>
      <SettingsSection title="Payment">
        <Card rows>
          <SettingsRow
            id="org-billing-auto-reload"
            label="Auto-reload"
            description={autoReloadLine(reload)}
          >
            {attempt?.reconciliationRequired ? (
              <Badge color="warning" title={attempt.detail ?? undefined}>
                Payment review required
              </Badge>
            ) : (
              attempt?.state === "payment_required" && (
                <Badge color="warning" title={attempt.detail ?? undefined}>
                  {attempt.paymentActionAvailable
                    ? "Action needed"
                    : "Payment review required"}
                </Badge>
              )
            )}
            {reload.enablementDue && (
              <Badge color="warning">Payment method needed</Badge>
            )}
            {attempt?.state === "failed" && reload.enabled && (
              <Badge color="warning" title={attempt.detail ?? undefined}>
                Last reload failed
              </Badge>
            )}
            {attempt?.state === "payment_required" &&
              attempt.paymentActionAvailable && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!isAdmin}
                  title={adminReason}
                  onClick={() => onCompleteCheckout(attempt.id)}
                >
                  Complete checkout
                </Button>
              )}
            {attempt?.state === "failed" && reload.enabled && (
              <Button
                variant="ghost"
                size="sm"
                disabled={!isAdmin}
                title={adminReason}
                onClick={onRetryReload}
              >
                Retry
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              disabled={!isAdmin}
              title={adminReason}
              onClick={onConfigureAutoReload}
            >
              {reload.enabled ? "Manage" : "Enable"}
            </Button>
          </SettingsRow>
          <SettingsRow
            id="org-billing-payment"
            label="Payment method"
            description="Managed through the billing portal"
          >
            <Button
              variant="ghost"
              size="sm"
              disabled={!isAdmin || !billing.customer}
              title={
                isAdmin
                  ? billing.customer
                    ? undefined
                    : "Available after the first purchase"
                  : adminReason
              }
              onClick={onOpenPortal}
            >
              Manage
            </Button>
          </SettingsRow>
          <SettingsRow
            id="org-billing-receipts"
            label="Email receipts"
            description={receiptsLine(billing.receipts.enabled, receiptEmail)}
          >
            {billing.receipts.enabled && (
              <Button
                variant="ghost"
                size="sm"
                disabled={!isAdmin}
                title={adminReason}
                onClick={onEditReceiptEmail}
              >
                Edit
              </Button>
            )}
            <Switch
              checked={billing.receipts.enabled}
              disabled={!isAdmin || receiptsUpdating}
              title={adminReason}
              aria-label="Email payment receipts"
              onCheckedChange={onReceiptsChange}
            />
          </SettingsRow>
        </Card>
      </SettingsSection>
      <SettingsSection
        id="org-billing-activity"
        title="Billing activity"
        description="Invoices may take up to 24 hours to appear"
      >
        <Card>
          <Table density="pick">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Status</th>
                <th className="text-right">Amount</th>
                <th aria-hidden />
              </tr>
            </thead>
            <tbody>
              {invoicesFailed && (
                <FullRow>
                  <span className="flex justify-between gap-3">
                    <span className="text-sm font-normal text-muted-foreground-2">
                      {invoiceItems === undefined
                        ? "Invoices are unavailable right now"
                        : "Showing the last loaded invoices"}
                    </span>
                    <Button variant="ghost" size="sm" onClick={onRetryInvoices}>
                      Retry
                    </Button>
                  </span>
                </FullRow>
              )}
              {invoiceItems === undefined ? (
                !invoicesFailed && (
                  <FullRow>
                    <span className="flex w-full max-w-64 flex-col gap-2">
                      <SkeletonPanel className="h-4 w-full" />
                      <SkeletonPanel className="h-4 w-3/4" />
                    </span>
                  </FullRow>
                )
              ) : invoiceItems.length === 0 ? (
                <FullRow>
                  <span className="text-sm font-normal text-muted-foreground-2">
                    No invoices yet
                  </span>
                </FullRow>
              ) : (
                invoiceItems.map((invoice) => (
                  <InvoiceRow key={invoice.id} invoice={invoice} />
                ))
              )}
            </tbody>
          </Table>
        </Card>
      </SettingsSection>
    </>
  );
}

const TITLE = "Billing";
const DESCRIPTION = "Plan, balance, and invoices for this organization";

export function OrgBillingPage() {
  const orgId = useBillingOrgId();
  const key = orgId ?? "";
  const { billing, failed: billingFailed } = useBillingView(orgId);
  const invoicesResult = useAtomValue(billingInvoicesAtom(key));
  const membersResult = useAtomValue(orgMembersAtom(key));
  const refreshBilling = useAtomRefresh(billingAtom(key));
  const refreshInvoices = useAtomRefresh(billingInvoicesAtom(key));
  const { isAdmin, adminReason } = useBillingAdmin();
  const cancelPlan = useAtomSet(cancelPlanAtom, { mode: "promise" });
  const keepPlan = useAtomSet(keepPlanAtom, { mode: "promise" });
  const cancelSso = useAtomSet(cancelSsoAddOnAtom, { mode: "promise" });
  const keepSso = useAtomSet(keepSsoAddOnAtom, { mode: "promise" });
  const openPortal = useAtomSet(openBillingPortalAtom, { mode: "promise" });
  const openReloadPayment = useAtomSet(openAutoReloadPaymentAtom, {
    mode: "promise",
  });
  const retryReload = useAtomSet(retryAutoReloadAtom, { mode: "promise" });
  const updateFallthrough = useAtomSet(updateSponsoredPaidFallthroughAtom, {
    mode: "promise",
  });
  const updateReceipts = useAtomSet(updateReceiptsAtom, { mode: "promise" });
  const [planOpen, setPlanOpen] = useState(false);
  const [balanceOpen, setBalanceOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [keepOpen, setKeepOpen] = useState(false);
  const [cancelSsoOpen, setCancelSsoOpen] = useState(false);
  const [ssoUpdating, setSsoUpdating] = useState(false);
  const [reloadOpen, setReloadOpen] = useState(false);
  const [sponsoredUpdating, setSponsoredUpdating] = useState(false);
  const [receiptsUpdating, setReceiptsUpdating] = useState(false);
  const [receiptEmailOpen, setReceiptEmailOpen] = useState(false);

  if (billing === undefined)
    return (
      <SettingsPage title={TITLE} description={DESCRIPTION}>
        <SettingsSection>
          {billingFailed ? (
            <BillingUnavailableCard
              label="Billing details are unavailable right now"
              description="Try again in a moment"
              onRetry={refreshBilling}
            />
          ) : (
            <Card className="flex flex-col gap-3 p-4">
              <SkeletonPanel className="h-4 w-32" />
              <SkeletonPanel className="h-8 w-56" />
            </Card>
          )}
        </SettingsSection>
      </SettingsPage>
    );

  const invoiceValue = AsyncResult.getOrElse(invoicesResult, () => undefined);
  const invoiceItems =
    invoiceValue === undefined ? undefined : toBillingInvoices(invoiceValue);
  const membersValue = AsyncResult.getOrElse(membersResult, () => undefined);
  const memberCount = Array.isArray(membersValue)
    ? membersValue.length
    : undefined;
  const plans = billing.plans;
  const plan = currentPlan(plans);
  const scheduled = scheduledPlan(plans);
  const receiptEmail = billing.receipts.email;
  const keys = billingReactivityKeys(key);
  const planName = (entry: BillingPlan) =>
    planDisplayName(entry.planId, entry.name);
  const ssoEndsOn =
    billing.ssoAddOn?.status === "active"
      ? billing.ssoAddOn.currentPeriodEnd !== null &&
        plan?.currentPeriodEnd != null &&
        billing.ssoAddOn.currentPeriodEnd.getTime() + DAY_MS <
          plan.currentPeriodEnd.getTime()
        ? formatBillingDate(billing.ssoAddOn.currentPeriodEnd)
        : null
      : undefined;
  const ssoEnd = billing.ssoAddOn?.currentPeriodEnd;

  return (
    <SettingsPage title={TITLE} description={DESCRIPTION}>
      <BillingPageView
        billing={billing}
        invoiceItems={invoiceItems}
        memberCount={memberCount}
        isAdmin={isAdmin}
        adminReason={adminReason}
        sponsoredUpdating={sponsoredUpdating}
        receiptEmail={receiptEmail}
        receiptsUpdating={receiptsUpdating}
        billingStale={billingFailed}
        invoicesFailed={AsyncResult.isFailure(invoicesResult)}
        onRetryBilling={refreshBilling}
        onRetryInvoices={refreshInvoices}
        onChoosePlan={() => setPlanOpen(true)}
        onKeepPlan={() => setKeepOpen(true)}
        onCancelSsoAddOn={() => setCancelSsoOpen(true)}
        onKeepSsoAddOn={() => {
          if (orgId === undefined || ssoUpdating) return;
          setSsoUpdating(true);
          keepSso({ params: { orgId }, reactivityKeys: keys })
            .then(
              () => toast.success("Single sign-on renews as usual"),
              (failure) =>
                toast.error(
                  errorMessage(failure, "Could not keep single sign-on"),
                ),
            )
            .finally(() => setSsoUpdating(false));
        }}
        onAddBalance={() => setBalanceOpen(true)}
        onConfigureAutoReload={() => setReloadOpen(true)}
        onOpenPortal={() => {
          if (orgId === undefined) return;
          openPortal({
            params: { orgId },
            payload: { returnUrl: window.location.href },
          }).then(
            (result) => {
              const url = (result as { url?: unknown }).url;
              if (typeof url === "string") window.location.assign(url);
            },
            (failure) =>
              toast.error(
                errorMessage(failure, "Could not open the billing portal"),
              ),
          );
        }}
        onCompleteCheckout={(attemptId) => {
          if (orgId === undefined) return;
          openReloadPayment({
            params: { orgId },
            payload: { attemptId },
          }).then(
            (result) => {
              const url = (result as { url?: unknown }).url;
              if (typeof url === "string") window.location.assign(url);
            },
            (failure) =>
              toast.error(
                errorMessage(failure, "Could not open the hosted payment"),
              ),
          );
        }}
        onRetryReload={() => {
          if (orgId === undefined) return;
          retryReload({
            params: { orgId },
            payload: { requestId: crypto.randomUUID() },
            reactivityKeys: keys,
          }).then(
            () => toast.success("Reload attempt started"),
            (failure) =>
              toast.error(errorMessage(failure, "Could not retry the reload")),
          );
        }}
        onPaidFallthroughChange={(enabled) => {
          if (orgId === undefined || sponsoredUpdating) return;
          setSponsoredUpdating(true);
          updateFallthrough({
            params: { orgId },
            payload: { enabled },
            reactivityKeys: keys,
          })
            .then(
              () =>
                toast.success(
                  enabled
                    ? "Covered work continues on paid credits"
                    : "Covered work stops when the allowance is spent",
                ),
              (failure) =>
                toast.error(
                  errorMessage(
                    failure,
                    "Could not update the sponsored allowance",
                  ),
                ),
            )
            .finally(() => setSponsoredUpdating(false));
        }}
        onReceiptsChange={(enabled) => {
          if (orgId === undefined || receiptsUpdating) return;
          if (enabled && receiptEmail === null) {
            setReceiptEmailOpen(true);
            return;
          }
          setReceiptsUpdating(true);
          updateReceipts({
            params: { orgId },
            payload: { enabled, email: enabled ? receiptEmail : null },
            reactivityKeys: keys,
          })
            .then(
              () =>
                toast.success(
                  enabled
                    ? `Receipts go to ${receiptEmail}`
                    : "Receipt emails turned off",
                ),
              (failure) =>
                toast.error(
                  errorMessage(failure, "Could not update receipt emails"),
                ),
            )
            .finally(() => setReceiptsUpdating(false));
        }}
        onEditReceiptEmail={() => setReceiptEmailOpen(true)}
      />
      <ReceiptEmailDialog
        open={receiptEmailOpen}
        email={receiptEmail ?? ""}
        onOpenChange={setReceiptEmailOpen}
      />
      <PlanDialog
        open={planOpen}
        onOpenChange={setPlanOpen}
        onCancelPlan={() => setCancelOpen(true)}
        surface="billing"
      />
      <AddBalanceDialog
        surface="billing"
        open={balanceOpen}
        onOpenChange={setBalanceOpen}
      />
      <AutoReloadDialog
        open={reloadOpen}
        mode={billing.autoReload.enabled ? "configure" : "enable"}
        onOpenChange={setReloadOpen}
      />
      <BillingConfirmDialog
        open={keepOpen}
        onOpenChange={setKeepOpen}
        title={`Keep ${plan === undefined ? "your plan" : planName(plan)}?`}
        description={
          scheduled === undefined
            ? "The scheduled change is removed and your plan renews as usual"
            : `The switch to ${planName(scheduled)} is removed and your plan renews as usual`
        }
        confirmLabel="Keep plan"
        intent="accent"
        closeOnConfirm={false}
        onConfirm={() => {
          if (orgId === undefined) return;
          keepPlan({ params: { orgId }, reactivityKeys: keys }).then(
            () => {
              toast.success(
                plan === undefined
                  ? "You stay on your plan"
                  : `You stay on ${planName(plan)}`,
              );
              setKeepOpen(false);
            },
            (failure) =>
              toast.error(errorMessage(failure, "Could not keep the plan")),
          );
        }}
      />
      <BillingConfirmDialog
        open={cancelSsoOpen}
        onOpenChange={setCancelSsoOpen}
        title="Cancel single sign-on?"
        description={
          ssoEnd == null
            ? "Single sign-on keeps working until the cycle ends, then members go back to their usual sign-in"
            : `Single sign-on keeps working until ${formatBillingDate(ssoEnd)}, then members go back to their usual sign-in`
        }
        confirmLabel="Cancel single sign-on"
        intent="danger"
        loading={ssoUpdating}
        loadingLabel="Canceling"
        closeOnConfirm={false}
        onConfirm={() => {
          if (orgId === undefined) return;
          setSsoUpdating(true);
          cancelSso({ params: { orgId }, reactivityKeys: keys })
            .then(
              () => {
                toast.success(
                  "Single sign-on canceled, active until the cycle ends",
                );
                setCancelSsoOpen(false);
              },
              (failure) =>
                toast.error(
                  errorMessage(failure, "Could not cancel single sign-on"),
                ),
            )
            .finally(() => setSsoUpdating(false));
        }}
      />
      <CancelPlanDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        loading={cancelling}
        ssoAddOnEndsOn={ssoEndsOn}
        onConfirm={(reason) => {
          if (orgId === undefined || plan === undefined) return;
          setCancelling(true);
          cancelPlan({
            params: { orgId },
            payload: { planId: plan.planId, immediately: false, ...reason },
            reactivityKeys: keys,
          })
            .then(
              () => {
                toast.success("Plan canceled, active until the cycle ends");
                setCancelOpen(false);
              },
              (failure) =>
                toast.error(errorMessage(failure, "Cancellation failed")),
            )
            .finally(() => setCancelling(false));
        }}
      />
    </SettingsPage>
  );
}
