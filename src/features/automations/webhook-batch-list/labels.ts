import type {
  AutomationWebhookBatch,
  WebhookBatchGroupValue,
  WebhookBatchReason,
  WebhookBatchRunStatus,
} from "./batch";

export const webhookBatchReasonLabels: Record<WebhookBatchReason, string> = {
  count: "Event limit reached",
  quiet: "No new events",
  max_wait: "Waiting time ended",
  bytes: "Size limit reached",
  manual: "Started manually",
  cancelled: "Cancelled manually",
  configuration_changed: "Settings changed",
  disabled: "Automation disabled",
  project_deleted: "Project deleted",
};

export const webhookBatchRunStatusLabels: Record<
  WebhookBatchRunStatus,
  string
> = {
  queued: "Starting soon",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  skipped: "Skipped",
  cancelled: "Cancelled",
};

type BatchView = Pick<
  AutomationWebhookBatch,
  "status" | "dispatchAfter" | "runStatus" | "group" | "jamId"
>;

export const webhookBatchGroupLabel = (
  group: ReadonlyArray<WebhookBatchGroupValue>,
) => (group.length === 0 ? "All events" : group.map(String).join(", "));

export function webhookBatchStatusLabel(batch: BatchView, now: number) {
  if (batch.status === "collecting")
    return batch.dispatchAfter.getTime() <= now
      ? "Starting soon"
      : "Waiting for more events";
  if (batch.status === "queued")
    return batch.runStatus === null
      ? "Starting soon"
      : webhookBatchRunStatusLabels[batch.runStatus];
  return "Cancelled";
}

export const webhookBatchStartedNoThread = (batch: BatchView) =>
  batch.status === "queued" &&
  batch.jamId === null &&
  batch.runStatus !== "queued" &&
  batch.runStatus !== null;

const SECOND = 1000;

export function formatBatchDuration(ms: number) {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const seconds = Math.max(1, Math.ceil(ms / SECOND));
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return rest === 0 ? `${minutes}m` : `${minutes}m ${rest}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

const sameYear = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const otherYear = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export const formatBatchDate = (date: Date, now: number) =>
  (date.getFullYear() === new Date(now).getFullYear()
    ? sameYear
    : otherYear
  ).format(date);
