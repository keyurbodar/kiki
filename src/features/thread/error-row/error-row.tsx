import type { Schema } from "effect";
import type { ErrorRow as ErrorRowSchema } from "@/data/events";

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/primitives/alert";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";

/**
 * Capy's framed alert: the icon is a direct child so the alert's `[&>svg]`
 * rules place it at the card's top-left and indent the text beside it.
 */
const ALERT =
  "relative w-full rounded-(--radius-card) border-hairline border-border-1 bg-card p-4 text-sm shadow-card [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:size-(--icon-base) [&>svg~*:not([data-slot=alert-action])]:pl-6.5 has-[>[data-slot=alert-action]]:grid has-[>[data-slot=alert-action]]:grid-cols-[minmax(0,1fr)_auto] has-[>[data-slot=alert-action]]:gap-x-4 text-foreground [&>[data-slot=alert-description]]:text-muted-foreground-1 [&>svg]:text-[var(--intent-text,var(--muted-foreground-1))]";

const title =
  "text-sm font-medium leading-4 break-words [&:has(~[data-slot=alert-description])]:mb-1";
const description = "text-sm font-normal break-words";

type ErrorRowData = Schema.Schema.Type<typeof ErrorRowSchema>;

export type ErrorRowProps = {
  row: ErrorRowData;
  onRetry?: () => void;
  className?: string;
};

/** A Capy error or warning alert; the copy is the row's message from the event. */
export function ErrorRow({ row, onRetry, className }: ErrorRowProps) {
  const warning = row.severity === "warning";
  return (
    <div className={`py-2 ${className ?? ""}`}>
      <Alert
        className={`${ALERT} ${warning ? "[&>svg]:[--intent-text:var(--warning-fg)]" : "[&>svg]:[--intent-text:var(--destructive)]"}`}
      >
        <Icon name="exclamation-triangle" size="base" />
        <AlertTitle className={title}>{row.code}</AlertTitle>
        <AlertDescription className={description}>
          {row.message}
        </AlertDescription>
        {onRetry === undefined || !row.retryable ? null : (
          <AlertAction className="mt-1.5 self-center">
            <Button variant="ghost" size="sm" onClick={onRetry}>
              Retry
            </Button>
          </AlertAction>
        )}
      </Alert>
    </div>
  );
}
