import type { ReactNode } from "react";
import { Card } from "@/primitives/card";
import gift from "./assets/gift.svg?url";
import wordmarkDark from "./assets/wordmark-dark.svg?url";
import wordmarkLight from "./assets/wordmark-light.svg?url";
import { formatCredits } from "./format";

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Capy"
      className={`inline-flex h-6 items-center ${className ?? ""}`}
    >
      <img src={wordmarkLight} alt="" className="h-full w-auto dark:hidden" />
      <img
        src={wordmarkDark}
        alt=""
        className="hidden h-full w-auto dark:block"
      />
    </span>
  );
}

export type PromotionPageProps = {
  name?: string;
  description?: ReactNode;
  creditAmount?: number;
  heading?: string;
  footer?: boolean;
  children?: ReactNode;
};

export function PromotionPage({
  name,
  description,
  creditAmount,
  heading,
  footer = true,
  children,
}: PromotionPageProps) {
  return (
    <div
      data-slot="promotion-page"
      className="h-dvh overflow-y-auto bg-background pt-(--safe-top)"
    >
      <header className="flex w-full items-center px-4 pt-4">
        <Wordmark className="h-5" />
      </header>
      <main className="mx-auto flex min-h-[calc(100dvh-var(--safe-top)-(--spacing(11)))] w-full max-w-xl items-center px-4 py-8 sm:px-6">
        <div className="flex w-full flex-col gap-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <img src={gift} alt="" className="h-auto w-44" />
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-medium tabular-nums text-foreground">
                {heading ?? `${formatCredits(creditAmount ?? 0)} in credits`}
              </h1>
              {name === undefined ? null : (
                <p className="text-sm font-medium text-muted-foreground-1">
                  {name}
                </p>
              )}
              {description === undefined ? null : (
                <p className="text-sm font-normal text-muted-foreground-2">
                  {description}
                </p>
              )}
            </div>
          </div>
          {children}
          {footer ? (
            <p className="text-center text-xs font-normal text-muted-foreground-3">
              One claim per account and organization
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}

export function PromotionLoading({
  label = "Loading promotion",
}: {
  label?: string;
}) {
  return (
    <div
      data-slot="promotion-loading"
      className="grid h-dvh place-items-center bg-background p-4"
    >
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function PromotionUnavailable({
  title = "Promotion unavailable",
  action,
}: {
  title?: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid h-dvh place-items-center bg-background p-4">
      <Card className="w-full max-w-md gap-4 p-4 text-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-base font-medium text-foreground">{title}</h1>
          <p className="text-sm font-normal text-muted-foreground-1">
            Check the link and try again
          </p>
        </div>
        {action}
      </Card>
    </div>
  );
}
