import { ErrorRow as ErrorRowSchema } from "@/data/events";
import type { Schema } from "effect";

import { Alert, AlertDescription, AlertTitle } from "@/primitives/alert";
import { Button } from "@/primitives/button";

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
      <Alert color={warning ? "warning" : "danger"}>
        {warning ? (
          <span aria-hidden className="text-warning-fg">!</span>
        ) : (
          <span aria-hidden className="text-destructive">!</span>
        )}
        <AlertTitle title={row.code}>{row.code}</AlertTitle>
        <AlertDescription>{row.message}</AlertDescription>
        {onRetry === undefined || !row.retryable ? null : (
          <Button variant="ghost" size="sm" onClick={onRetry} className="mt-1.5">
            Retry
          </Button>
        )}
      </Alert>
    </div>
  );
}
