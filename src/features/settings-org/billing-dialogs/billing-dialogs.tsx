import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { useAtomSet } from "@effect/atom-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PlanPicker, type PlanPickerStage } from "@/components/plan-picker";
import { StripeCardForm } from "@/components/stripe-card-form";
import {
  billingReactivityKeys,
  confirmSsoAddOnAtom,
  createSetupIntentAtom,
  previewSsoAddOnAtom,
  purchaseCreditsAtom,
  updateAutoReloadAtom,
  updateReceiptsAtom,
} from "@/data/atoms/billing";
import {
  autoReloadError,
  CANCEL_REASONS,
  type CancelReason,
  CREDIT_AMOUNTS,
  currentPlan,
  errorMessage,
  formatBillingDate,
  formatCents,
  formatCredits,
  MIN_CREDIT_DOLLARS,
  planDisplayName,
  RECEIPT_EMAIL_PATTERN,
} from "@/lib/billing";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { Icon } from "@/primitives/icon";
import { Input, InputGroup } from "@/primitives/input";
import {
  MenuSelect,
  MenuSelectContent,
  MenuSelectItem,
  MenuSelectTrigger,
  MenuSelectValue,
} from "@/primitives/menu-select";
import { SkeletonPanel } from "@/primitives/skeleton-panel";
import { Switch } from "@/primitives/switch";
import { Textarea } from "@/primitives/textarea";
import {
  useBillingAdmin,
  useBillingOrgId,
  useBillingView,
} from "./use-billing";

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const digitsOnly = (value: string) => value.replaceAll(/[^\d]/g, "");
const PURCHASE_UNKNOWN =
  "Purchase status unknown, retry this amount or check invoices";

type OpenProps = { open: boolean; onOpenChange: (open: boolean) => void };

export function MemberBillingNotice({
  open,
  onOpenChange,
  title,
  body,
}: OpenProps & { title: string; body: string }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm font-normal text-muted-foreground-1">{body}</p>
        </DialogBody>
        <DialogFooter className="items-center justify-end">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type BillingConfirmDialogProps = OpenProps & {
  title: string;
  description: string;
  confirmLabel: string;
  intent: "accent" | "danger";
  loading?: boolean;
  loadingLabel?: string;
  closeOnConfirm?: boolean;
  onConfirm: () => void;
};

export function BillingConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  intent,
  loading = false,
  loadingLabel,
  closeOnConfirm = true,
  onConfirm,
}: BillingConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => loading || onOpenChange(next)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="ghost"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            intent={intent}
            disabled={loading}
            aria-busy={loading || undefined}
            onClick={() => {
              onConfirm();
              if (closeOnConfirm) onOpenChange(false);
            }}
          >
            {loading && loadingLabel !== undefined
              ? loadingLabel
              : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type PlanDialogProps = OpenProps & {
  surface: string;
  onPurchased?: () => void;
  onCancelPlan?: () => void;
  reason?: string;
};

export function PlanDialog({
  open,
  onOpenChange,
  surface,
  onPurchased,
  onCancelPlan,
  reason,
}: PlanDialogProps) {
  const orgId = useBillingOrgId();
  const { billing } = useBillingView(orgId);
  const { isAdmin } = useBillingAdmin();
  const [stage, setStage] = useState<PlanPickerStage>("cards");
  const plan = billing === undefined ? undefined : currentPlan(billing.plans);
  const managed = billing?.plans.find(
    (entry) => entry.planId === "capy_enterprise",
  );
  const comp = billing?.comp ?? null;

  if (managed !== undefined || comp !== null)
    return (
      <MemberBillingNotice
        open={open}
        onOpenChange={onOpenChange}
        title="Your plan"
        body={
          comp === null
            ? `${managed?.name} is managed with your account team, contact us to make changes`
            : `Capy comps ${plan === undefined ? "this plan" : planDisplayName(plan.planId, plan.name)} until ${formatBillingDate(comp.endsAt)}, contact us to change it`
        }
      />
    );

  if (!isAdmin)
    return (
      <MemberBillingNotice
        open={open}
        onOpenChange={onOpenChange}
        title="Choose a plan"
        body="Ask an organization admin to choose a plan or add balance"
      />
    );

  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop data-slot="dialog-overlay" />
        <BaseDialog.Popup
          data-slot="plan-dialog"
          className="fixed inset-0 z-(--z-dialog) h-dvh overflow-y-auto bg-background outline-none transition-opacity duration-base ease-out data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 data-[ending-style]:duration-fast"
        >
          <BaseDialog.Close
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="fixed top-[calc(1rem+var(--safe-top))] right-4"
              />
            }
          >
            <Icon name="x" />
            <span className="sr-only">Close</span>
          </BaseDialog.Close>
          <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col items-center justify-center gap-6 px-6 pt-[calc(2.5rem+var(--safe-top))] pb-[calc(2.5rem+var(--safe-bottom))]">
            {stage === "cards" ? (
              <div className="flex flex-col items-center gap-2 text-center">
                <DialogTitle className="text-xl font-medium text-foreground">
                  Choose a plan
                </DialogTitle>
                <p className="text-sm font-normal text-muted-foreground-2">
                  {reason ?? "Plans include monthly usage, switch anytime"}
                </p>
              </div>
            ) : (
              <DialogTitle className="sr-only">
                Complete your subscription
              </DialogTitle>
            )}
            {open && (
              <PlanPicker
                key={orgId}
                orgId={orgId}
                surface={surface}
                currentPlanId={plan?.planId}
                pricingReady={billing !== undefined}
                onStageChange={setStage}
                onPurchased={() => {
                  setStage("cards");
                  onOpenChange(false);
                  onPurchased?.();
                }}
              />
            )}
            {stage === "cards" &&
              plan !== undefined &&
              plan.canceledAt === null &&
              onCancelPlan !== undefined && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onCancelPlan();
                  }}
                >
                  Cancel plan
                </Button>
              )}
          </div>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

type CardCapture = {
  kind: "capture";
  setupIntentId: string;
  clientSecret: string;
  publishableKey: string;
};

type Stage = CardCapture | { kind: "confirmed"; setupIntentId: string } | null;

const field = (value: unknown, key: string) =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)[key]
    : undefined;

export type AddBalanceDialogProps = OpenProps & {
  surface: string;
  onPurchased?: () => void;
};

export function AddBalanceDialog({
  open,
  onOpenChange,
  surface,
  onPurchased,
}: AddBalanceDialogProps) {
  const orgId = useBillingOrgId();
  const { billing } = useBillingView(orgId);
  const { isAdmin } = useBillingAdmin();
  const setupIntent = useAtomSet(createSetupIntentAtom, { mode: "promise" });
  const purchase = useAtomSet(purchaseCreditsAtom, { mode: "promise" });
  const [choice, setChoice] = useState<number | "other">(100);
  const [other, setOther] = useState("");
  const [stage, setStage] = useState<Stage>(null);
  const [busy, setBusy] = useState(false);
  const [retryCredits, setRetryCredits] = useState<number | null>(null);
  const requestId = useRef(crypto.randomUUID());
  const balance = billing?.balance;
  const dollars =
    choice === "other" ? (other === "" ? 0 : Number(other)) : choice;
  const valid = Number.isFinite(dollars) && dollars >= MIN_CREDIT_DOLLARS;
  const credits = Math.round(dollars * 1000);

  const buy = async (amount: number, setupIntentId: string | null) => {
    if (orgId === undefined) return;
    const retrying = retryCredits !== null;
    try {
      const result = await purchase({
        params: { orgId },
        payload: {
          credits: amount,
          requestId: requestId.current,
          setupIntentId,
          successUrl: window.location.href,
          surface,
        },
        reactivityKeys: billingReactivityKeys(orgId),
      });
      setRetryCredits(null);
      const paymentUrl = field(result, "paymentUrl");
      if (typeof paymentUrl === "string") {
        window.location.assign(paymentUrl);
        return;
      }
      toast.success(
        `Added $${(amount / 1e3).toLocaleString("en-US")} to your balance`,
      );
      setStage(null);
      onOpenChange(false);
      onPurchased?.();
    } catch {
      if (!retrying) {
        requestId.current = crypto.randomUUID();
        setStage(null);
        toast.error("Credit purchase failed");
        return;
      }
      setRetryCredits(amount);
      toast.error(PURCHASE_UNKNOWN);
    }
  };

  if (!isAdmin)
    return (
      <MemberBillingNotice
        open={open}
        onOpenChange={onOpenChange}
        title="Add balance"
        body="Ask an organization admin to add balance"
      />
    );

  const start = () => {
    if (orgId === undefined || (!valid && retryCredits === null)) return;
    setBusy(true);
    const run =
      retryCredits !== null
        ? buy(retryCredits, null)
        : setupIntent({ params: { orgId }, query: {} }).then((intent) => {
            const clientSecret = field(intent, "clientSecret");
            const publishableKey = field(intent, "publishableKey");
            if (
              field(intent, "alreadySaved") === true ||
              typeof clientSecret !== "string" ||
              typeof publishableKey !== "string"
            )
              return buy(credits, null);
            const id = field(intent, "setupIntentId");
            setStage({
              kind: "capture",
              setupIntentId: typeof id === "string" ? id : "",
              clientSecret,
              publishableKey,
            });
          });
    run
      .catch((failure) =>
        toast.error(errorMessage(failure, "Credit purchase failed")),
      )
      .finally(() => setBusy(false));
  };

  const amountLabel = valid ? `$${dollars.toLocaleString("en-US")}` : "$--";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {stage === null ? "Add balance" : "Complete your purchase"}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          {stage === null ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-4 gap-1.5">
                {[...CREDIT_AMOUNTS, "other" as const].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    data-selected={choice === amount || undefined}
                    disabled={retryCredits !== null}
                    className={cx(
                      "flex cursor-pointer items-center justify-center rounded-md border-hairline border-border-2 bg-(--button) px-3 py-3.5 shadow-[inset_0_1px_var(--highlight-top),var(--sh-plate)] transition-colors duration-100 outline-none select-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55",
                      "hover:bg-(--button-hover) focus-visible:outline-ring-inset",
                      "data-selected:border-primary data-selected:bg-primary/5",
                    )}
                    onClick={() => setChoice(amount)}
                  >
                    <span className="text-lg font-medium text-foreground tabular-nums">
                      {amount === "other" ? "Other" : `$${amount}`}
                    </span>
                  </button>
                ))}
              </div>
              {choice === "other" && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground">
                    Enter amount{" "}
                    <span className="font-normal text-muted-foreground-2">
                      ${MIN_CREDIT_DOLLARS} minimum
                    </span>
                  </span>
                  <DollarInput
                    ariaLabel="Amount in dollars"
                    value={other}
                    disabled={retryCredits !== null}
                    onValueChange={setOther}
                  />
                </div>
              )}
              <div className="flex flex-col gap-2 rounded-md border-hairline border-border-2 bg-(--button) px-3 py-2.5 shadow-[inset_0_1px_var(--highlight-top)]">
                <div className="flex items-center justify-between text-sm font-normal text-muted-foreground-1">
                  <span>Usage credits</span>
                  <span className="tabular-nums">{amountLabel}</span>
                </div>
                {balance != null && (
                  <div className="flex items-center justify-between text-sm font-normal text-muted-foreground-1">
                    <span>Balance after</span>
                    <span className="tabular-nums">
                      {balance.unlimited
                        ? "Unlimited"
                        : valid
                          ? formatCredits(balance.remainingCredits + credits)
                          : "$--"}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t-hairline border-border-1 pt-2 text-sm font-medium text-foreground">
                  <span>Total due</span>
                  <span className="tabular-nums">{amountLabel}</span>
                </div>
              </div>
            </div>
          ) : stage.kind === "capture" ? (
            <StripeCardForm
              publishableKey={stage.publishableKey}
              clientSecret={stage.clientSecret}
              setupIntentId={stage.setupIntentId}
              submitLabel={`Add $${dollars.toLocaleString("en-US")}`}
              onComplete={(setupIntentId) => {
                setStage({ kind: "confirmed", setupIntentId });
                setBusy(true);
                buy(credits, setupIntentId).finally(() => setBusy(false));
              }}
            />
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-normal text-muted-foreground-1">
                {retryCredits === null
                  ? "Completing your purchase"
                  : PURCHASE_UNKNOWN}
              </p>
              <Button
                intent="accent"
                disabled={busy}
                aria-busy={busy || undefined}
                onClick={() => {
                  setBusy(true);
                  buy(retryCredits ?? credits, stage.setupIntentId).finally(
                    () => setBusy(false),
                  );
                }}
              >
                {retryCredits === null ? "Complete purchase" : "Retry purchase"}
              </Button>
            </div>
          )}
        </DialogBody>
        {stage === null && (
          <DialogFooter className="flex-col items-stretch gap-2">
            <Button
              intent="accent"
              className="w-full"
              disabled={(!valid && retryCredits === null) || busy}
              aria-busy={busy || undefined}
              onClick={start}
            >
              {retryCredits === null
                ? `Buy $${valid ? dollars.toLocaleString("en-US") : "0"} of credits`
                : "Retry purchase"}
            </Button>
            {retryCredits !== null && (
              <span className="text-center text-xs font-normal text-muted-foreground-2">
                {PURCHASE_UNKNOWN}
              </span>
            )}
            <span className="text-center text-xs font-normal text-muted-foreground-2">
              Payment secured via Stripe
            </span>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DollarInput({
  ariaLabel,
  value,
  disabled,
  className,
  onValueChange,
}: {
  ariaLabel: string;
  value: string;
  disabled?: boolean;
  className?: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <InputGroup className={cx("flex w-full items-center gap-1", className)}>
      <span aria-hidden className="text-sm text-muted-foreground-2">
        $
      </span>
      <Input
        size="sm"
        inputMode="numeric"
        aria-label={ariaLabel}
        value={value}
        disabled={disabled}
        onChange={(event) => onValueChange(digitsOnly(event.target.value))}
      />
    </InputGroup>
  );
}

export type AutoReloadDialogProps = OpenProps & {
  mode: "enable" | "configure";
};

export function AutoReloadDialog({
  open,
  onOpenChange,
  mode,
}: AutoReloadDialogProps) {
  const orgId = useBillingOrgId();
  const { billing } = useBillingView(orgId);
  const update = useAtomSet(updateAutoReloadAtom, { mode: "promise" });
  const reload = billing?.autoReload;
  const hasPaymentMethod = billing?.paymentMethod === true;
  const [threshold, setThreshold] = useState("5");
  const [target, setTarget] = useState("25");
  const [capEnabled, setCapEnabled] = useState(false);
  const [cap, setCap] = useState("100");
  const [saving, setSaving] = useState<"save" | "disable" | null>(null);
  const seeded = useRef(false);

  useEffect(() => {
    if (!open) {
      seeded.current = false;
      return;
    }
    if (seeded.current || reload === undefined) return;
    seeded.current = true;
    setThreshold(String(reload.thresholdCredits / 1e3));
    setTarget(String(reload.amountCredits / 1e3));
    setCapEnabled(mode === "configure" && reload.monthlyCapCredits !== null);
    if (reload.monthlyCapCredits !== null)
      setCap(String(reload.monthlyCapCredits / 1e3));
  }, [open, mode, reload]);

  const error = autoReloadError(
    Number(threshold),
    Number(target),
    capEnabled,
    Number(cap),
  );

  const save = (enabled: boolean) => {
    if ((enabled && error !== null) || orgId === undefined) return;
    setSaving(enabled ? "save" : "disable");
    update({
      params: { orgId },
      payload: enabled
        ? {
            enabled: true,
            thresholdCredits: Math.round(Number(threshold) * 1e3),
            amountCredits: Math.round(Number(target) * 1e3),
            monthlyCapCredits: capEnabled
              ? Math.round(Number(cap) * 1e3)
              : null,
          }
        : { enabled: false },
      reactivityKeys: billingReactivityKeys(orgId),
    }).then(
      () => {
        setSaving(null);
        toast.success(
          enabled ? "Auto-reload enabled" : "Auto-reload turned off",
        );
        onOpenChange(false);
      },
      (failure) => {
        setSaving(null);
        toast.error(
          errorMessage(
            failure,
            enabled
              ? "Could not save auto-reload settings"
              : "Could not turn off auto-reload",
          ),
        );
      },
    );
  };

  const blocked = mode === "enable" && !hasPaymentMethod;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "enable" ? "Enable auto-reload" : "Auto-reload"}
          </DialogTitle>
          {mode === "configure" && (
            <DialogDescription>
              Edit when Capy refills your balance
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-4">
            {mode === "enable" && (
              <span className="text-xs font-normal text-muted-foreground-2">
                {hasPaymentMethod
                  ? "Charges your saved payment method when the balance runs low"
                  : "Add a payment method to enable auto-reload"}
              </span>
            )}
            <LabelledField label="When balance goes below">
              <DollarInput
                className="w-full"
                ariaLabel="Reload threshold in dollars"
                value={threshold}
                onValueChange={setThreshold}
              />
            </LabelledField>
            <LabelledField label="Reload to">
              <DollarInput
                className="w-full"
                ariaLabel="Reload target in dollars"
                value={target}
                onValueChange={setTarget}
              />
            </LabelledField>
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">
                  Cap monthly reloads
                </span>
                <span className="text-xs font-normal text-muted-foreground-2">
                  Limit automatic charges each month
                </span>
              </div>
              <Switch
                checked={capEnabled}
                onCheckedChange={setCapEnabled}
                aria-label="Cap monthly reloads"
              />
            </div>
            {capEnabled && (
              <LabelledField label="Monthly cap">
                <DollarInput
                  className="w-full"
                  ariaLabel="Monthly reload cap in dollars"
                  value={cap}
                  onValueChange={setCap}
                />
              </LabelledField>
            )}
            {error !== null && (
              <p className="text-xs font-normal text-destructive">{error}</p>
            )}
          </div>
        </DialogBody>
        <DialogFooter
          className={
            mode === "configure"
              ? "items-center justify-between"
              : "items-center justify-end"
          }
        >
          {mode === "configure" && (
            <Button
              variant="ghost"
              intent="danger"
              disabled={saving !== null}
              aria-busy={saving === "disable" || undefined}
              onClick={() => save(false)}
            >
              Turn off
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              disabled={saving !== null}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              intent="accent"
              disabled={error !== null || blocked || saving !== null}
              title={
                blocked
                  ? "Add a payment method to enable auto-reload"
                  : undefined
              }
              aria-busy={saving === "save" || undefined}
              onClick={() => save(true)}
            >
              {mode === "enable" ? "Enable" : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LabelledField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </div>
  );
}

export type ReceiptEmailDialogProps = OpenProps & { email: string };

export function ReceiptEmailDialog({
  open,
  onOpenChange,
  email,
}: ReceiptEmailDialogProps) {
  const orgId = useBillingOrgId();
  const update = useAtomSet(updateReceiptsAtom, { mode: "promise" });
  const [value, setValue] = useState(email);
  const [saving, setSaving] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setValue(email);
  }
  const trimmed = value.trim();
  const valid = RECEIPT_EMAIL_PATTERN.test(trimmed);

  const save = () => {
    if (!valid || saving || orgId === undefined) return;
    setSaving(true);
    update({
      params: { orgId },
      payload: { enabled: true, email: trimmed },
      reactivityKeys: billingReactivityKeys(orgId),
    })
      .then(
        () => {
          toast.success(`Receipts go to ${trimmed}`);
          onOpenChange(false);
        },
        (failure) =>
          toast.error(
            errorMessage(failure, "Could not save the receipt email"),
          ),
      )
      .finally(() => setSaving(false));
  };

  return (
    <Dialog open={open} onOpenChange={(next) => saving || onOpenChange(next)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Receipt email</DialogTitle>
          <DialogDescription>
            Payment receipts and invoices go to this address
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              save();
            }}
          >
            <Input
              type="email"
              autoFocus
              value={value}
              placeholder="billing@company.com"
              aria-label="Receipt email"
              aria-invalid={trimmed !== "" && !valid}
              onChange={(event) => setValue(event.target.value)}
            />
          </form>
        </DialogBody>
        <DialogFooter className="items-center justify-end">
          <Button
            variant="ghost"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            intent="accent"
            disabled={!valid || saving}
            aria-busy={saving || undefined}
            onClick={save}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type CancelPlanDialogProps = OpenProps & {
  loading: boolean;
  ssoAddOnEndsOn: string | null | undefined;
  onConfirm: (reason: { reason: CancelReason; detail?: string }) => void;
};

export const cancelPlanDescription = (
  ssoAddOnEndsOn: string | null | undefined,
) =>
  ssoAddOnEndsOn === undefined
    ? "Your plan stays active until the end of the current cycle, then stops renewing"
    : ssoAddOnEndsOn === null
      ? "Your plan stays active until the end of the current cycle, then stops renewing, and single sign-on ends too"
      : `Your plan stays active until the end of the current cycle, then stops renewing, and single sign-on ends sooner, on ${ssoAddOnEndsOn}`;

export function CancelPlanDialog({
  open,
  onOpenChange,
  loading,
  ssoAddOnEndsOn,
  onConfirm,
}: CancelPlanDialogProps) {
  const [reason, setReason] = useState<CancelReason | null>(null);
  const [detail, setDetail] = useState("");
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setReason(null);
      setDetail("");
    }
  }
  const trimmed = detail.trim();
  const ready = reason !== null && (reason !== "other" || trimmed !== "");
  const close = (next: boolean) => {
    if (!loading) onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel plan?</DialogTitle>
          <DialogDescription>
            {cancelPlanDescription(ssoAddOnEndsOn)}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {/* biome-ignore lint/a11y/noLabelWithoutControl: the select trigger inside is the control, as in Capy */}
          <label className="flex flex-col gap-1.5 text-sm font-normal text-muted-foreground-1">
            Reason
            <MenuSelect
              items={CANCEL_REASONS}
              value={reason}
              onValueChange={(value) => setReason(value as CancelReason)}
            >
              <MenuSelectTrigger className="w-full" disabled={loading}>
                <MenuSelectValue>
                  {(value: CancelReason | null) =>
                    value === null ? "Choose a reason" : CANCEL_REASONS[value]
                  }
                </MenuSelectValue>
              </MenuSelectTrigger>
              <MenuSelectContent>
                {(Object.keys(CANCEL_REASONS) as CancelReason[]).map((key) => (
                  <MenuSelectItem key={key} value={key}>
                    {CANCEL_REASONS[key]}
                  </MenuSelectItem>
                ))}
              </MenuSelectContent>
            </MenuSelect>
          </label>
          {reason === "other" && (
            <Textarea
              aria-label="Tell us more"
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
              placeholder="What made you cancel"
              maxLength={500}
              rows={3}
              disabled={loading}
              autoFocus
            />
          )}
        </DialogBody>
        <DialogFooter>
          <Button
            variant="ghost"
            disabled={loading}
            onClick={() => close(false)}
          >
            Cancel
          </Button>
          <Button
            intent="danger"
            disabled={!ready || loading}
            aria-busy={loading || undefined}
            onClick={() => {
              if (reason === null) return;
              onConfirm(
                reason === "other" ? { reason, detail: trimmed } : { reason },
              );
            }}
          >
            Cancel plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type SsoAddOnDialogProps = OpenProps & {
  orgId: string;
  priceCents: number;
  onPurchased: () => void;
};

export function SsoAddOnDialog({
  open,
  onOpenChange,
  orgId,
  priceCents,
  onPurchased,
}: SsoAddOnDialogProps) {
  const preview = useAtomSet(previewSsoAddOnAtom, { mode: "promise" });
  const confirm = useAtomSet(confirmSsoAddOnAtom, { mode: "promise" });
  const [quote, setQuote] = useState<
    { dueTodayCents: number } | "failed" | null
  >(null);
  const [paying, setPaying] = useState(false);
  const requestId = useRef(crypto.randomUUID());

  useEffect(() => {
    if (!open) return;
    setQuote(null);
    let live = true;
    preview({ params: { orgId } }).then(
      (result) => {
        if (live)
          setQuote({
            dueTodayCents: Number(field(result, "dueTodayCents") ?? 0),
          });
      },
      (failure) => {
        if (!live) return;
        setQuote("failed");
        toast.error(errorMessage(failure, "Could not price single sign-on"));
      },
    );
    return () => {
      live = false;
    };
  }, [open, orgId, preview]);

  const pay = () => {
    if (paying || quote === null || quote === "failed") return;
    setPaying(true);
    confirm({
      params: { orgId },
      payload: {
        requestId: requestId.current,
        successUrl: window.location.href,
      },
      reactivityKeys: billingReactivityKeys(orgId),
    })
      .then(
        (result) => {
          const paymentUrl = field(result, "paymentUrl");
          if (typeof paymentUrl === "string") {
            window.location.assign(paymentUrl);
            return;
          }
          requestId.current = crypto.randomUUID();
          if (field(result, "requiredAction") == null) {
            toast.success("Single sign-on added");
            onPurchased();
          } else {
            toast.error("Payment needs another step, finish it from Billing");
          }
        },
        () => {
          requestId.current = crypto.randomUUID();
          toast.error(
            "Purchase status unknown, try again or check your invoices in Billing",
          );
        },
      )
      .finally(() => setPaying(false));
  };

  const unavailable = quote === null || quote === "failed";

  return (
    <Dialog open={open} onOpenChange={(next) => paying || onOpenChange(next)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add single sign-on?</DialogTitle>
          <DialogDescription>
            Members on your verified domains sign in with their work Google
            account, renewing monthly with your plan until you cancel it in
            Billing
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-normal text-muted-foreground-1">
              Due today
            </span>
            {quote === null ? (
              <SkeletonPanel className="h-4 w-14" />
            ) : (
              <span className="text-sm font-medium text-foreground tabular-nums">
                {quote === "failed"
                  ? "Unavailable"
                  : formatCents(quote.dueTodayCents)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-normal text-muted-foreground-1">
              Then
            </span>
            <span className="text-sm font-medium text-foreground tabular-nums">
              {formatCents(priceCents)} a month
            </span>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="ghost"
            disabled={paying}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            intent="accent"
            disabled={unavailable || paying}
            aria-busy={paying || undefined}
            onClick={pay}
          >
            {paying
              ? "Paying"
              : unavailable
                ? "Pay"
                : `Pay ${formatCents(quote.dueTodayCents)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
