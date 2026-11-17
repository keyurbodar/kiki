import { useState } from "react";
import { Button } from "@/primitives/button";

export type StripeCardFormProps = {
  publishableKey: string;
  clientSecret: string;
  setupIntentId: string;
  submitLabel: string;
  block?: boolean;
  onPendingChange?: (pending: boolean) => void;
  onComplete: (setupIntentId: string) => void;
};

/**
 * Capy's card form, without Stripe: Stripe is deferred, so the payment
 * element is a placeholder that is ready at once and confirms the setup
 * intent it was given.
 */
export function StripeCardForm({
  publishableKey,
  clientSecret,
  setupIntentId,
  submitLabel,
  block = false,
  onPendingChange,
  onComplete,
}: StripeCardFormProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = publishableKey !== "" && clientSecret !== "";

  const submit = () => {
    if (!ready || pending) return;
    setPending(true);
    onPendingChange?.(true);
    setError(null);
    if (setupIntentId === "") {
      setError("Payment setup failed, try again");
      setPending(false);
      onPendingChange?.(false);
      return;
    }
    onComplete(setupIntentId);
  };

  return (
    <div data-slot="stripe-card-form" className="flex flex-col gap-3">
      <div
        className={
          block
            ? "max-h-[max(16rem,calc(100dvh-26rem))] overflow-y-auto overscroll-contain"
            : undefined
        }
      >
        {/* biome-ignore lint/a11y/useSemanticElements: stands in for Stripe's payment element mount point */}
        <div
          role="group"
          aria-label="Card details"
          data-ready={ready || undefined}
          className="h-(--h-control-base) rounded-md border-hairline border-border-2 bg-(--button) shadow-[inset_0_1px_var(--highlight-top)]"
        />
      </div>
      {!ready && (
        <p className="text-sm font-normal text-destructive">
          Payment form couldn't load, reload and try again
        </p>
      )}
      {error !== null && (
        <p className="text-sm font-normal text-destructive">{error}</p>
      )}
      {block ? (
        <>
          <Button
            variant="inverse"
            className="w-full"
            disabled={!ready || pending}
            aria-busy={pending || undefined}
            onClick={submit}
          >
            {submitLabel}
          </Button>
          <span className="text-center text-xs font-normal text-muted-foreground-2">
            Payment secured via Stripe
          </span>
        </>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-normal text-muted-foreground-2">
            Payment secured via Stripe
          </span>
          <Button
            intent="accent"
            disabled={!ready || pending}
            aria-busy={pending || undefined}
            onClick={submit}
          >
            {submitLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
