import type { AutomationWebhookBatch } from "../webhook-batch-list";

export type WebhookBatchAction = "flush" | "cancel";

export type WebhookBatchToast = {
  readonly level: "info" | "error" | "success";
  readonly message: string;
};

export const webhookBatchActionFailure = (
  action: WebhookBatchAction,
): WebhookBatchToast => ({
  level: "error",
  message:
    action === "flush" ? "Could not start batch" : "Could not cancel batch",
});

/** The toast Capy shows once a flush or cancel request comes back. */
export function webhookBatchActionToast(
  action: WebhookBatchAction,
  batch: Pick<AutomationWebhookBatch, "status" | "runStatus" | "failure">,
): WebhookBatchToast {
  if (action === "flush" && batch.status === "cancelled")
    return { level: "info", message: "Batch was already cancelled" };
  if (action === "cancel" && batch.status === "queued")
    return { level: "info", message: "Batch is already starting" };
  if (action === "flush" && batch.runStatus === "failed")
    return {
      level: "error",
      message: batch.failure ?? "Could not start batch",
    };
  if (action === "flush" && batch.runStatus === "skipped")
    return { level: "info", message: batch.failure ?? "Batch was skipped" };
  return {
    level: "success",
    message: action === "flush" ? "Batch is starting" : "Batch cancelled",
  };
}

/** Pages are a stack of cursors; the first page has the empty cursor. */
export const webhookBatchPager = {
  first: [""] as ReadonlyArray<string>,
  next: (pages: ReadonlyArray<string>, cursor: string | null) =>
    cursor === null ? pages : [...pages, cursor],
  previous: (pages: ReadonlyArray<string>) =>
    pages.length === 1 ? pages : pages.slice(0, -1),
  current: (pages: ReadonlyArray<string>) => pages[pages.length - 1] ?? "",
};
