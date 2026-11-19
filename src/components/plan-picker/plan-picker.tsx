import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { StripeCardForm } from "@/components/stripe-card-form";
import {
  billingCatalogAtom,
  billingReactivityKeys,
  confirmPlanAtom,
  createSetupIntentAtom,
  idleBillingCatalogAtom,
  previewPlanAtom,
} from "@/data/atoms/billing";
import { basePlanId } from "@/lib/billing";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import type { IconId } from "@/primitives/icon/icon-ids";
import { Popover, PopoverContent, PopoverTrigger } from "@/primitives/popover";
import { SkeletonPanel } from "@/primitives/skeleton-panel";
import { toast } from "@/primitives/toaster";
import {
  type CatalogTier,
  type CheckoutTerms,
  checkoutTerms,
  ctaLabel,
  defaultPlanCatalog,
  formatGb,
  formatMachine,
  formatWhole,
  type LeadTerms,
  leadTerms,
  machineHourRates,
  machineSizes,
  type PlanInterval,
  type PlanTier,
  reviewEfforts,
  tierLabels,
  tierLimits,
  tierSurfaces,
  toPlanCatalog,
} from "./plan-catalog";

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const stop = (event: { stopPropagation: () => void }) =>
  event.stopPropagation();

type Record_ = Record<string, unknown>;
const field = (value: unknown, key: string) =>
  typeof value === "object" && value !== null
    ? (value as Record_)[key]
    : undefined;

export type PlanPickerStage = "cards" | "card-form";

export type PlanPurchase = {
  schedule?: string;
  introApplied: boolean;
};

export type PlanPickerProps = {
  orgId: string | undefined;
  surface: string;
  currentPlanId?: string;
  recommended?: PlanTier;
  pricingReady?: boolean;
  onStageChange?: (stage: PlanPickerStage) => void;
  onSelect?: (tier: CatalogTier) => void;
  onPurchased: (purchase: PlanPurchase, tier: CatalogTier) => void;
};

type Preview = { dueTodayCents: number; introEligible: boolean };

type Submission = { tierId: string; introExpected: boolean };

type Checkout =
  | { kind: "saved"; submission: Submission }
  | {
      kind: "capture";
      setupIntentId: string;
      clientSecret: string;
      publishableKey: string;
      submission: Submission;
    }
  | { kind: "confirmed"; setupIntentId: string; submission: Submission };

const DEFAULT_MACHINE_SIZE = "large";

export function PlanPicker({
  orgId,
  surface,
  currentPlanId,
  recommended,
  pricingReady = true,
  onStageChange,
  onSelect,
  onPurchased,
}: PlanPickerProps) {
  const catalogResult = useAtomValue(
    orgId === undefined ? idleBillingCatalogAtom : billingCatalogAtom(orgId),
  );
  const preview = useAtomSet(previewPlanAtom, { mode: "promise" });
  const setupIntent = useAtomSet(createSetupIntentAtom, { mode: "promise" });
  const confirm = useAtomSet(confirmPlanAtom, { mode: "promise" });
  const loaded = orgId !== undefined && !AsyncResult.isInitial(catalogResult);
  const catalog = AsyncResult.isSuccess(catalogResult)
    ? toPlanCatalog(catalogResult.value)
    : defaultPlanCatalog;
  const current =
    currentPlanId === undefined
      ? undefined
      : catalog.tiers.find((entry) => entry.id === basePlanId(currentPlanId));
  const currentId = current?.id;
  const [interval, setInterval] = useState<PlanInterval>("month");
  const [selectedId, setSelectedId] = useState("capy_pro");
  const [previews, setPreviews] = useState<Record<string, Preview>>({});
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const requestId = useRef(crypto.randomUUID());
  const synced = useRef(false);

  useEffect(() => {
    if (synced.current || current === undefined) return;
    synced.current = true;
    setInterval(current.interval);
    setSelectedId(current.id);
  }, [current]);

  useEffect(() => {
    onStageChange?.(checkout === null ? "cards" : "card-form");
  }, [checkout, onStageChange]);

  const shown = catalog.tiers.filter((entry) => entry.interval === interval);
  const lite = shown.find((entry) => entry.tier === "lite");
  const pro = shown.find((entry) => entry.tier === "pro");
  const max = shown.find((entry) => entry.tier === "max");

  const loadPreview = async (tierId: string) => {
    if (orgId === undefined) return undefined;
    const response = await preview({
      params: { orgId },
      payload: { tierId },
    }).catch(() => undefined);
    if (response === undefined) return undefined;
    const entry: Preview = {
      dueTodayCents: Number(field(response, "dueTodayCents") ?? 0),
      introEligible: field(response, "introEligible") === true,
    };
    setPreviews((existing) => ({ ...existing, [tierId]: entry }));
    return entry;
  };

  const introFor = (entry: CatalogTier) =>
    entry.id === "capy_lite" && previews.capy_lite?.introEligible !== false;

  const purchase = async (
    setupIntentId: string | null,
    entry: CatalogTier,
    submission: Submission,
  ) => {
    if (orgId === undefined) return;
    const result = await confirm({
      params: { orgId },
      payload: {
        tierId: submission.tierId,
        setupIntentId,
        successUrl: window.location.href,
        requestId: requestId.current,
        introExpected: submission.introExpected,
        surface,
      },
      reactivityKeys: billingReactivityKeys(orgId),
    }).catch(() => null);
    if (result === null) {
      requestId.current = crypto.randomUUID();
      setCheckout(null);
      toast.error("Plan change failed");
      return;
    }
    const paymentUrl = field(result, "paymentUrl");
    if (typeof paymentUrl === "string") {
      window.location.assign(paymentUrl);
      return;
    }
    if (field(result, "introUnavailable") === true) {
      setPreviews((existing) => ({
        ...existing,
        [entry.id]: {
          dueTodayCents: existing[entry.id]?.dueTodayCents ?? 0,
          introEligible: false,
        },
      }));
      setCheckout(null);
      toast.info(
        "The $1 intro isn't available here - subscribing charges the regular price",
      );
      return;
    }
    const schedule = field(result, "schedule");
    const introApplied = field(result, "introApplied") === true;
    setCheckout(null);
    toast.success(
      schedule === "end_of_cycle"
        ? `Your plan switches to ${entry.name} at the end of the cycle`
        : introApplied
          ? "You're on Capy Lite, $1 for your first week"
          : `You're on ${entry.name}`,
    );
    onPurchased(
      {
        schedule: typeof schedule === "string" ? schedule : undefined,
        introApplied,
      },
      entry,
    );
  };

  const choose = async (entry: CatalogTier) => {
    if (orgId === undefined || submitting !== null || !pricingReady) return;
    onSelect?.(entry);
    setSelectedId(entry.id);
    setSubmitting(entry.id);
    try {
      const priced = previews[entry.id] ?? (await loadPreview(entry.id));
      if (priced === undefined) return;
      const submission = {
        tierId: entry.id,
        introExpected: priced.introEligible && introFor(entry),
      };
      const intent = await setupIntent({ params: { orgId }, query: {} });
      const clientSecret = field(intent, "clientSecret");
      const publishableKey = field(intent, "publishableKey");
      if (field(intent, "alreadySaved") === true) {
        setCheckout({ kind: "saved", submission });
      } else if (
        typeof clientSecret === "string" &&
        typeof publishableKey === "string"
      ) {
        const id = field(intent, "setupIntentId");
        setCheckout({
          kind: "capture",
          setupIntentId: typeof id === "string" ? id : "",
          clientSecret,
          publishableKey,
          submission,
        });
      } else {
        await purchase(null, entry, submission);
      }
    } catch {
      toast.error("Plan change failed");
    } finally {
      setSubmitting(null);
    }
  };

  const switchCard = async () => {
    if (orgId === undefined || checkout?.kind !== "saved") return;
    const { submission } = checkout;
    setSubmitting(submission.tierId);
    await setupIntent({ params: { orgId }, query: { card: "new" } })
      .then((intent) => {
        const clientSecret = field(intent, "clientSecret");
        const publishableKey = field(intent, "publishableKey");
        if (
          typeof clientSecret !== "string" ||
          typeof publishableKey !== "string"
        ) {
          toast.error("Card form unavailable, try again");
          return;
        }
        const id = field(intent, "setupIntentId");
        setCheckout({
          kind: "capture",
          setupIntentId: typeof id === "string" ? id : "",
          clientSecret,
          publishableKey,
          submission,
        });
      })
      .catch(() => toast.error("Card form unavailable, try again"));
    setSubmitting(null);
  };

  const finish = async (setupIntentId: string | null) => {
    if (checkout === null || submitting !== null) return;
    const entry = catalog.tiers.find(
      (candidate) => candidate.id === checkout.submission.tierId,
    );
    if (entry === undefined) return;
    if (setupIntentId !== null)
      setCheckout({
        kind: "confirmed",
        setupIntentId,
        submission: checkout.submission,
      });
    setSubmitting(entry.id);
    await purchase(setupIntentId, entry, checkout.submission);
    setSubmitting(null);
  };

  if (!loaded) return <SkeletonPanel className="h-80 w-full" />;
  if (lite === undefined || pro === undefined || max === undefined) return null;

  if (checkout !== null) {
    const entry = catalog.tiers.find(
      (candidate) => candidate.id === checkout.submission.tierId,
    );
    const terms =
      entry === undefined
        ? undefined
        : checkoutTerms(
            entry,
            checkout.submission.introExpected,
            previews[entry.id]?.dueTodayCents,
            currentId !== undefined,
            new Date(),
          );
    const action = terms?.action ?? "Subscribe";
    return (
      <PlanCheckout
        terms={terms}
        onBack={
          checkout.kind === "confirmed" || submitting !== null
            ? undefined
            : () => setCheckout(null)
        }
      >
        {checkout.kind === "saved" ? (
          <>
            <Button
              variant="inverse"
              className="w-full"
              disabled={submitting !== null}
              aria-busy={submitting !== null || undefined}
              onClick={() => void finish(null)}
            >
              {action}
            </Button>
            <Button
              variant="link"
              size="auto-xs"
              className="self-center"
              disabled={submitting !== null}
              onClick={() => void switchCard()}
            >
              Use a different card
            </Button>
          </>
        ) : checkout.kind === "capture" ? (
          <StripeCardForm
            publishableKey={checkout.publishableKey}
            clientSecret={checkout.clientSecret}
            setupIntentId={checkout.setupIntentId}
            submitLabel={action}
            block
            onComplete={(setupIntentId) => void finish(setupIntentId)}
          />
        ) : (
          <>
            <p className="text-sm font-normal text-muted-foreground-1">
              Completing your subscription
            </p>
            <Button
              variant="inverse"
              className="w-full"
              disabled={submitting !== null}
              aria-busy={submitting !== null || undefined}
              onClick={() => void finish(checkout.setupIntentId)}
            >
              Complete purchase
            </Button>
          </>
        )}
      </PlanCheckout>
    );
  }

  const card = (entry: CatalogTier, fallbackLabel: string) => {
    const terms = leadTerms(entry, introFor(entry), DEFAULT_MACHINE_SIZE);
    const isCurrent = entry.id === currentId;
    return (
      <LeadCard
        key={entry.id}
        name={entry.name}
        tier={entry.tier}
        lead={terms}
        interval={interval}
        recommended={recommended === entry.tier}
        current={isCurrent}
        disabled={false}
        selected={selectedId === entry.id}
        submitting={submitting === entry.id}
        ctaLabel={isCurrent ? "Current plan" : ctaLabel(terms, fallbackLabel)}
        onSelect={() => {
          if (selectedId !== entry.id) setSelectedId(entry.id);
        }}
        onSubmit={() => void choose(entry)}
      />
    );
  };

  return (
    <div
      data-slot="plan-picker"
      className="flex w-full flex-col items-center gap-6"
    >
      <SegmentedGroup aria-label="Billing interval">
        {(["month", "year"] as const).map((value) => (
          <Button
            key={value}
            size="sm"
            variant="segmented"
            data-selected={interval === value ? "" : undefined}
            onClick={() => {
              setInterval(value);
              const selected = catalog.tiers.find(
                (entry) => entry.id === selectedId,
              );
              const match = catalog.tiers.find(
                (entry) =>
                  entry.interval === value && entry.tier === selected?.tier,
              );
              if (match) setSelectedId(match.id);
            }}
          >
            {value === "month" ? (
              "Monthly"
            ) : (
              <span className="flex items-center gap-1">
                <span>Annual</span>
                <span className="text-muted-foreground-2">·</span>
                <span className="text-primary-ink">Save 20%</span>
              </span>
            )}
          </Button>
        ))}
      </SegmentedGroup>
      <div className="grid w-full gap-3 md:grid-cols-3">
        {card(lite, "Get Capy Lite")}
        {card(pro, "Get Capy Pro")}
        {card(max, "Get Capy Max")}
      </div>
    </div>
  );
}

function SegmentedGroup({
  children,
  ...props
}: {
  children: ReactNode;
  "aria-label": string;
}) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: Capy's segmented control is a div group, not a fieldset
    <div
      role="group"
      className="relative flex items-center gap-0.5 rounded-lg border-hairline border-border-2 bg-secondary p-0.5 [&>button]:relative [&>[data-selected]]:bg-card [&>[data-selected]]:shadow-card"
      {...props}
    >
      {children}
    </div>
  );
}

function PlanSurface({ tier }: { tier: PlanTier }) {
  return (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{ background: tierSurfaces[tier] }}
    />
  );
}

type Feature = {
  key: string;
  icon: IconId;
  prefix?: string;
  value?: string;
  label?: string;
  detail?: ReactNode;
};

function UsageDetail({
  title,
  columns,
  rows,
  footer,
}: {
  title: string;
  columns?: readonly string[];
  rows?: ReadonlyArray<{
    key: string;
    label: string;
    note?: string;
    cells: readonly [string, string];
  }>;
  footer: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-foreground">{title}</span>
      {columns !== undefined && rows !== undefined && (
        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-x-5 gap-y-1.5 text-sm font-normal text-foreground tabular-nums">
          {columns.map((column, index) => (
            <span
              key={column}
              className={cx(
                "text-xs text-muted-foreground-2",
                index > 0 && "text-right",
              )}
            >
              {column}
            </span>
          ))}
          {rows.flatMap((row) => [
            <span
              key={`${row.key}:label`}
              className="flex min-w-0 items-baseline gap-1.5 text-muted-foreground-1"
            >
              <span className="truncate">{row.label}</span>
              {row.note !== undefined && (
                <span className="shrink-0 text-xs text-muted-foreground-2">
                  {row.note}
                </span>
              )}
            </span>,
            <span
              key={`${row.key}:rate`}
              className="text-right text-muted-foreground-1"
            >
              {row.cells[0]}
            </span>,
            <span key={`${row.key}:total`} className="text-right font-medium">
              {row.cells[1]}
            </span>,
          ])}
        </div>
      )}
      <div className="flex flex-col gap-2">
        {rows !== undefined && <div className="h-px bg-border-1" />}
        <span className="text-xs font-normal text-muted-foreground-2">
          {footer}
        </span>
      </div>
    </div>
  );
}

function leadFeatures(tier: PlanTier, lead: LeadTerms): Feature[][] {
  const limits = tierLimits[tier];
  const hours = formatWhole(lead.machineHours);
  const reviews = formatWhole(lead.reviewCredits);
  const credits = formatWhole(lead.creditDollars);
  return [
    [
      {
        key: "hours",
        icon: "clock-alert",
        value: hours,
        label: "machine hours",
        detail: (
          <UsageDetail
            title={`${hours} machine hours a month`}
            columns={["Machine", "Per hour", "Hours"]}
            rows={machineSizes
              .slice(0, machineSizes.indexOf(limits.maxMachineSize) + 1)
              .map((size) => ({
                key: size,
                label: formatMachine(size),
                note: size === lead.machineSize ? "Default" : undefined,
                cells: [
                  String(machineHourRates[size]),
                  `${formatWhole(lead.machineHours / machineHourRates[size])} h`,
                ],
              }))}
            footer="Past this, machine time is paid from your credits"
          />
        ),
      },
      {
        key: "reviews",
        icon: "review",
        value: reviews,
        label: "review credits",
        detail: (
          <UsageDetail
            title={`${reviews} review credits a month`}
            columns={["Review effort", "Credits", "Reviews"]}
            rows={reviewEfforts.map((effort) => ({
              key: effort.key,
              label: effort.label,
              note: effort.key === "medium" ? "Default" : undefined,
              cells: [
                String(effort.credits),
                formatWhole(lead.reviewCredits / effort.credits),
              ],
            }))}
            footer="Past this, reviews are paid from your credits"
          />
        ),
      },
      {
        key: "model",
        icon: "console-sparkle",
        value: `$${credits}`,
        label: "of model usage",
        detail: (
          <UsageDetail
            title={`$${credits} of model usage a month`}
            footer="Past this, model usage is pay as you go"
          />
        ),
      },
    ],
    [
      {
        key: "machine_memory_budget_gb",
        icon: "chip-simple",
        value: formatGb(limits.memoryGb),
        label: "concurrent RAM",
      },
      {
        key: "machine_size_max",
        icon: "settings-gear-2",
        prefix: "Machines up to",
        value: formatMachine(limits.maxMachineSize),
      },
      {
        key: "drive_storage_gb",
        icon: "floppy-disk-1",
        value: formatGb(limits.driveGb),
        label: "drive storage",
      },
      ...(limits.mobile
        ? [
            {
              key: "mobile",
              icon: "phone-dynamic-island" as const,
              label: "Mobile builds and devices",
            },
          ]
        : []),
    ],
  ];
}

function FeatureItem({ feature }: { feature: Feature }) {
  return (
    <li className="flex items-start gap-2 text-sm text-foreground">
      <span className="flex h-[1lh] shrink-0 items-center">
        <Icon
          name={feature.icon}
          className="size-(--icon-sm) text-muted-foreground-2"
        />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="flex items-center gap-1.5">
          <span className="tabular-nums">
            {feature.prefix !== undefined && `${feature.prefix} `}
            {feature.value !== undefined && (
              <span className="font-semibold">
                {feature.label === undefined
                  ? feature.value
                  : `${feature.value} `}
              </span>
            )}
            {feature.label}
          </span>
          {feature.detail !== undefined && (
            <Popover>
              <PopoverTrigger
                openOnHover
                delay={150}
                closeDelay={100}
                onClick={stop}
                render={
                  <Button
                    variant="bare"
                    size="auto-xs"
                    aria-label={`How ${feature.label} work`}
                  />
                }
              >
                <Icon name="circle-info" className="size-(--icon-xs)" />
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="start"
                initialFocus={false}
                className="w-80 max-w-(--available-width) p-3"
                onClick={stop}
              >
                {feature.detail}
              </PopoverContent>
            </Popover>
          )}
        </span>
      </div>
    </li>
  );
}

export type LeadCardProps = {
  name: string;
  tier: PlanTier;
  lead: LeadTerms;
  interval: PlanInterval;
  recommended: boolean;
  current: boolean;
  disabled: boolean;
  selected: boolean;
  submitting: boolean;
  ctaLabel: string;
  note?: string;
  claim?: string;
  onSelect: () => void;
  onSubmit: () => void;
};

export function LeadCard({
  name,
  tier,
  lead,
  interval,
  recommended,
  current,
  disabled,
  selected,
  submitting,
  ctaLabel: label,
  note,
  claim,
  onSelect,
  onSubmit,
}: LeadCardProps) {
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Capy's card selects on click; its button is the keyboard path
    // biome-ignore lint/a11y/useKeyWithClickEvents: the card's submit button carries the keyboard interaction
    <div
      data-slot="plan-lead-card"
      data-selected={selected || undefined}
      className="flex h-full cursor-pointer flex-col rounded-(--radius-panel) border-hairline border-border-1 bg-card p-1.5 pb-4 text-left shadow-card transition-colors duration-100 select-none"
      onClick={disabled ? undefined : onSelect}
    >
      <div className="relative overflow-hidden rounded-[calc(var(--radius-panel)-var(--spacing)*1.5)]">
        <PlanSurface tier={tier} />
        <div className="relative flex flex-col p-5 text-foreground">
          <div className="flex h-(--h-control-xs) items-center gap-2">
            <span className="text-sm font-medium">{name}</span>
            {current ? (
              <Badge>Current</Badge>
            ) : (
              recommended && (
                <Badge variant="filled" color="accent" size="sm">
                  Recommended
                </Badge>
              )
            )}
          </div>
          <div
            key={interval}
            className="mt-6 flex animate-crossfade-in flex-col gap-0.5"
          >
            <div className="flex flex-wrap items-baseline gap-x-1">
              <span className="text-3xl font-medium tabular-nums">
                {lead.introToday ??
                  `$${lead.priceDollars.toLocaleString("en-US")}`}
              </span>
              <span className="text-sm font-normal whitespace-nowrap opacity-70">
                {(lead.introUnit ?? "/mo") +
                  (lead.renewal === undefined ? "" : ",")}
              </span>
              {lead.renewal === undefined ? (
                lead.priceNote !== undefined && (
                  <span className="text-sm font-normal whitespace-nowrap tabular-nums opacity-70">
                    {`· ${lead.priceNote}`}
                  </span>
                )
              ) : (
                <span className="text-sm whitespace-nowrap tabular-nums">
                  <span className="font-normal opacity-70">then </span>
                  <span className="font-semibold">{lead.renewal}</span>
                </span>
              )}
            </div>
            {note !== undefined && (
              <span className="text-xs font-normal opacity-70">{note}</span>
            )}
          </div>
        </div>
      </div>
      {claim !== undefined && (
        <p className="mt-4 px-3 text-sm font-normal text-foreground">{claim}</p>
      )}
      {leadFeatures(tier, lead).map((group, index) => (
        <ul
          key={group[0]?.key}
          className={cx(
            "mt-4 flex flex-col gap-2.5 px-3",
            index > 0 && "border-t-hairline border-border-1 pt-4",
          )}
        >
          {group.map((feature) => (
            <FeatureItem key={feature.key} feature={feature} />
          ))}
        </ul>
      ))}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: stops the card's select click */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: wrapper only stops propagation */}
      <div className="mt-auto px-3 pt-5" onClick={stop}>
        <Button
          variant="inverse"
          className="w-full"
          disabled={current || disabled || submitting}
          aria-busy={submitting || undefined}
          title={current ? "This is your current plan" : undefined}
          onClick={onSubmit}
        >
          {label}
        </Button>
      </div>
    </div>
  );
}

export type PlanCheckoutProps = {
  terms: CheckoutTerms | undefined;
  onBack?: () => void;
  children: ReactNode;
};

export function PlanCheckout({ terms, onBack, children }: PlanCheckoutProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-2">
      <Button
        variant="bare"
        size="auto-xs"
        className={cx("self-start", onBack === undefined && "invisible")}
        disabled={onBack === undefined}
        onClick={onBack}
      >
        <Icon name="chevron-left-medium" className="size-3.5" />
        Change plan
      </Button>
      <div className="rounded-(--radius-card) border-hairline border-border-1 bg-card shadow-card">
        {terms !== undefined && (
          <div className="flex flex-col gap-1 p-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 font-medium text-foreground">
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: tierSurfaces[terms.tier] }}
                />
                {`Capy ${tierLabels[terms.tier]}`}
              </span>
              <span className="font-normal text-muted-foreground-1">
                <span className="font-semibold text-foreground tabular-nums">
                  {terms.today}
                </span>
                {" today"}
              </span>
            </div>
            <p className="text-xs font-normal text-muted-foreground-1">
              {"Then "}
              <span className="font-medium text-foreground">
                {terms.renewal}
              </span>
              {`${terms.startsOn === undefined ? "" : ` starting ${terms.startsOn}`}, cancel anytime`}
            </p>
          </div>
        )}
        <div
          className={cx(
            "flex flex-col gap-3 p-4",
            terms !== undefined && "border-t-hairline border-border-1",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
