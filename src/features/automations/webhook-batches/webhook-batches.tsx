import {
  useAtomRefresh,
  useAtomSet,
  useAtomValue,
} from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { organizationsAtom } from "@/data/atoms/session";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { Icon } from "@/primitives/icon";
import {
  type AutomationWebhookBatch,
  decodeWebhookBatch,
  decodeWebhookBatchPage,
  WebhookBatchList,
} from "../webhook-batch-list";
import {
  cancelWebhookBatchAtom,
  flushWebhookBatchAtom,
  webhookBatchesAtom,
  webhookBatchKeys,
} from "./atoms";
import {
  type WebhookBatchAction,
  webhookBatchActionFailure,
  webhookBatchActionToast,
  webhookBatchPager,
} from "./batch-action";

export type AutomationBatchesSectionProps = {
  automationId: string;
  hasWebhook: boolean;
};

const segmentedGroup =
  "relative flex items-center gap-0.5 rounded-lg border-[0.5px] border-border-2 bg-secondary p-0.5 [&>[data-selected]]:bg-card [&>[data-selected]]:shadow-card [&>button]:relative";

const usePage = (result: AsyncResult.AsyncResult<unknown, unknown>) =>
  useMemo(
    () =>
      Option.getOrUndefined(
        Option.flatMap(AsyncResult.value(result), decodeWebhookBatchPage),
      ),
    [result],
  );

function useOrgId() {
  const organizations = useAtomValue(organizationsAtom);
  return AsyncResult.isSuccess(organizations)
    ? organizations.value[0]?.id
    : undefined;
}

export function AutomationBatchesSection(props: AutomationBatchesSectionProps) {
  const orgId = useOrgId();
  return orgId === undefined ? null : (
    <AutomationBatches {...props} orgId={orgId} />
  );
}

function AutomationBatches({
  automationId,
  hasWebhook,
  orgId,
}: AutomationBatchesSectionProps & { orgId: string }) {
  const [status, setStatus] = useState<"collecting">();
  const [pages, setPages] = useState(webhookBatchPager.first);
  const [pendingId, setPendingId] = useState<string>();
  const [cancelling, setCancelling] = useState<AutomationWebhookBatch>();
  const atom = webhookBatchesAtom({
    orgId,
    automationId,
    status: status ?? "",
    cursor: webhookBatchPager.current(pages),
  });
  const result = useAtomValue(atom);
  const refresh = useAtomRefresh(atom);
  const page = usePage(result);
  const all = usePage(
    useAtomValue(
      webhookBatchesAtom({ orgId, automationId, status: "", cursor: "" }),
    ),
  );
  const flush = useAtomSet(flushWebhookBatchAtom, { mode: "promise" });
  const cancel = useAtomSet(cancelWebhookBatchAtom, { mode: "promise" });
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (result) setNow(Date.now());
  }, [result]);

  const run = (batch: AutomationWebhookBatch, action: WebhookBatchAction) => {
    if (pendingId !== undefined) return;
    setPendingId(batch.id);
    (action === "flush" ? flush : cancel)({
      params: { orgId, automationId, batchId: batch.id },
      reactivityKeys: webhookBatchKeys(automationId),
    })
      .then(
        (value) =>
          Option.match(decodeWebhookBatch(value), {
            onNone: () => webhookBatchActionFailure(action),
            onSome: (updated) => webhookBatchActionToast(action, updated),
          }),
        () => webhookBatchActionFailure(action),
      )
      .then(({ level, message }) => toast[level](message))
      .finally(() => setPendingId(undefined));
  };

  if (!hasWebhook && (all?.items.length ?? 0) === 0) return null;

  const waiting = AsyncResult.isWaiting(result);
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-medium text-foreground">
          Incoming events
        </h2>
        <div className="flex items-center gap-2">
          <div role="group" aria-label="Event history" className={segmentedGroup}>
            <Button
              variant="segmented"
              size="sm"
              data-selected={status === "collecting" ? "" : undefined}
              aria-pressed={status === "collecting"}
              onClick={() => {
                setStatus("collecting");
                setPages(webhookBatchPager.first);
              }}
            >
              Pending
            </Button>
            <Button
              variant="segmented"
              size="sm"
              data-selected={status === undefined ? "" : undefined}
              aria-pressed={status === undefined}
              onClick={() => {
                setStatus(undefined);
                setPages(webhookBatchPager.first);
              }}
            >
              History
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Refresh events"
            aria-busy={waiting}
            data-loading={waiting ? "" : undefined}
            onClick={refresh}
          >
            <Icon name="rotate" size="sm" />
          </Button>
        </div>
      </div>
      {AsyncResult.isFailure(result) ? (
        <span role="alert" className="text-sm font-normal text-destructive">
          Could not refresh events, showing the last available update
        </span>
      ) : null}
      {page === undefined ? (
        AsyncResult.isInitial(result) || waiting ? (
          <div
            data-slot="skeleton"
            className="shimmer-surface shimmer-surface-motion-safe h-28 w-full rounded"
          />
        ) : null
      ) : (
        <>
          <WebhookBatchList
            items={page.items}
            now={now}
            pendingId={pendingId}
            onFlush={(batch) => run(batch, "flush")}
            onCancel={setCancelling}
          />
          {pages.length > 1 || page.cursor !== null ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-normal text-muted-foreground-2">
                Page {pages.length}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pages.length === 1 || waiting}
                  onClick={() => setPages(webhookBatchPager.previous(pages))}
                >
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page.cursor === null || waiting}
                  onClick={() =>
                    setPages(webhookBatchPager.next(pages, page.cursor))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}
      <Dialog
        open={cancelling !== undefined}
        onOpenChange={(open) => {
          if (!open) setCancelling(undefined);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel batch</DialogTitle>
            <DialogDescription>
              {`These ${cancelling?.eventCount ?? 0} events will not be run`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" size="sm" />}>
              Cancel
            </DialogClose>
            <Button
              intent="danger"
              size="sm"
              onClick={() => {
                if (cancelling !== undefined) run(cancelling, "cancel");
                setCancelling(undefined);
              }}
            >
              Cancel batch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
