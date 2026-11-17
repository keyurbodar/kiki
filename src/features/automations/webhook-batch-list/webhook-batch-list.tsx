import { Link } from "@tanstack/react-router";
import { DotGrid1x3HorizontalIcon } from "@/components/app-sidebar/icons";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/primitives/collapsible";
import { Icon } from "@/primitives/icon";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/primitives/menu";
import type { AutomationWebhookBatch } from "./batch";
import {
  formatBatchDate,
  formatBatchDuration,
  webhookBatchGroupLabel,
  webhookBatchReasonLabels,
  webhookBatchStartedNoThread,
  webhookBatchStatusLabel,
} from "./labels";

const menuIconSlot =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";

export type WebhookBatchListProps = {
  items: ReadonlyArray<AutomationWebhookBatch>;
  now: number;
  pendingId?: string;
  onFlush: (batch: AutomationWebhookBatch) => void;
  onCancel: (batch: AutomationWebhookBatch) => void;
};

export function WebhookBatchList({
  items,
  now,
  pendingId,
  onFlush,
  onCancel,
}: WebhookBatchListProps) {
  return (
    <Card rows className="-mx-4">
      {items.length === 0 ? (
        <div className="px-4 py-6 text-sm font-normal text-muted-foreground-2">
          No events in this view
        </div>
      ) : (
        items.map((batch) => (
          <WebhookBatchRow
            key={batch.id}
            batch={batch}
            now={now}
            pendingId={pendingId}
            onFlush={onFlush}
            onCancel={onCancel}
          />
        ))
      )}
    </Card>
  );
}

function WebhookBatchRow({
  batch,
  now,
  pendingId,
  onFlush,
  onCancel,
}: Omit<WebhookBatchListProps, "items"> & { batch: AutomationWebhookBatch }) {
  const collecting = batch.status === "collecting";
  const label = webhookBatchGroupLabel(batch.group);
  return (
    <Collapsible>
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <CollapsibleTrigger
            className="max-w-full text-sm text-foreground"
            aria-label={`Details for ${label}`}
          >
            <span className="truncate" title={label}>
              {label}
            </span>
          </CollapsibleTrigger>
          <div className="flex flex-col gap-0.5 text-xs font-normal text-muted-foreground-2">
            <span className="tabular-nums">
              {batch.eventCount} {batch.eventCount === 1 ? "event" : "events"}
            </span>
            <span>{webhookBatchStatusLabel(batch, now)}</span>
          </div>
          {batch.failure === null ? null : (
            <span className="text-xs font-normal wrap-break-word text-destructive">
              {batch.failure}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {batch.jamId === null ? null : (
            <Button
              variant="ghost"
              size="sm"
              render={
                <Link to="/thread/$threadId" params={{ threadId: batch.jamId }} />
              }
            >
              View thread
            </Button>
          )}
          {collecting ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                data-loading={pendingId === batch.id ? "" : undefined}
                aria-busy={pendingId === batch.id}
                disabled={pendingId !== undefined}
                onClick={() => onFlush(batch)}
              >
                Start now
              </Button>
              <Menu>
                <MenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${label}`}
                      disabled={pendingId !== undefined}
                    />
                  }
                >
                  <DotGrid1x3HorizontalIcon />
                </MenuTrigger>
                <MenuContent align="end">
                  <MenuItem intent="danger" onClick={() => onCancel(batch)}>
                    <span className={menuIconSlot}>
                      <Icon name="cross-medium" />
                    </span>
                    Cancel batch
                  </MenuItem>
                </MenuContent>
              </Menu>
            </>
          ) : null}
        </div>
      </div>
      <CollapsiblePanel>
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 px-4 pb-4 text-xs font-normal text-muted-foreground-2">
          <dt>First received</dt>
          <dd>{formatBatchDate(batch.firstEventAt, now)}</dd>
          <dt>Last received</dt>
          <dd>{formatBatchDate(batch.lastEventAt, now)}</dd>
          <dt>{collecting ? "Wait ends" : "Finished waiting"}</dt>
          <dd>{formatBatchDate(batch.closedAt ?? batch.dispatchAfter, now)}</dd>
          <dt>Event limit</dt>
          <dd>{batch.maxEvents}</dd>
          <dt>Wait up to</dt>
          <dd>{formatBatchDuration(batch.maxWaitSeconds * 1000)}</dd>
          {batch.quietPeriodSeconds === null ? null : (
            <>
              <dt>Without new events</dt>
              <dd>{formatBatchDuration(batch.quietPeriodSeconds * 1000)}</dd>
            </>
          )}
          <dt>Data size</dt>
          <dd>{batch.byteCount.toLocaleString()} bytes</dd>
          <dt>Grouped values</dt>
          <dd className="flex flex-col wrap-break-word">
            {batch.group.length === 0
              ? "All events"
              : batch.group.map((value, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: grouped values are positional and may repeat
                  <span key={index}>{JSON.stringify(value)}</span>
                ))}
          </dd>
          {batch.reason === null ? null : (
            <>
              <dt>Reason</dt>
              <dd>{webhookBatchReasonLabels[batch.reason]}</dd>
            </>
          )}
          {webhookBatchStartedNoThread(batch) ? (
            <>
              <dt>Thread</dt>
              <dd>No thread was started</dd>
            </>
          ) : null}
        </dl>
      </CollapsiblePanel>
    </Collapsible>
  );
}
