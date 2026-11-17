import { cx } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/primitives/button";

export type UploadSendFailureProps = ComponentProps<"div"> & {
  /** Why the send failed, e.g. "Upload failed: network error". */
  failure?: ReactNode;
  /** Retries the upload and the send. */
  onRetry?: () => void;
  /** Puts the message back in the composer. */
  onEdit?: () => void;
};

/**
 * The line under a user message whose attachments failed to upload after the
 * send was queued: the reason, then Retry and Edit. Capy reads the handlers
 * from its thread context (`uploadSend.retry/edit`); here they're props.
 */
export function UploadSendFailure({
  failure,
  onRetry,
  onEdit,
  className,
  children,
  ...props
}: UploadSendFailureProps) {
  return (
    <div
      data-slot="upload-send-failure"
      className={cx(
        "flex min-w-0 max-w-full items-center gap-1 text-xs text-destructive",
        className,
      )}
      {...props}
    >
      {failure !== undefined && (
        <span className="min-w-0 truncate">{failure}</span>
      )}
      {onRetry !== undefined && (
        <Button variant="ghost" size="xs" onClick={onRetry}>
          Retry
        </Button>
      )}
      {onEdit !== undefined && (
        <Button variant="ghost" size="xs" onClick={onEdit}>
          Edit
        </Button>
      )}
      {children}
    </div>
  );
}
