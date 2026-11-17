import { useAtomSet } from "@effect/atom-react";
import { cx } from "class-variance-authority";
import { Exit } from "effect";
import type {
  ComponentProps,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
} from "react";
import { cancelMessageAtom, sendNowMessageAtom } from "@/data/atoms/events";
import { Button } from "@/primitives/button";
import { DotGridIcon } from "@/primitives/dot-grid-icon";
import { Icon } from "@/primitives/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  type QueueActHandler,
  type QueueAction,
  type QueueActor,
  type QueueRowData,
  queueRowText,
  uploadProgress,
  type useQueueActions,
  useQueueTransitions,
} from "./queue";

export * from "./queue";

const barRow =
  "mb-0.5 flex h-8 items-center gap-1.5 rounded-(--radius) py-1 pr-2.5 pl-3.5";
const barIcon =
  "flex size-4 shrink-0 items-center justify-center text-icon-muted";

function IconButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  onClick?: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={label}
            onClick={onClick}
          >
            {icon}
          </Button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export type ResolvedActor = { name: string; imageUrl?: string | null };

/** Fallback names when no directory lookup is passed, as Capy's `QueueSenderAvatar` does. */
export const actorFallbackName = (actor: QueueActor) =>
  actor.type === "agent"
    ? "Capy"
    : actor.type === "user"
      ? actor.userId
      : actor.type === "service_user"
        ? actor.serviceUserId
        : actor.service;

function QueueSenderAvatar({
  actor,
  resolveActor,
}: {
  actor: QueueActor;
  resolveActor?: (actor: QueueActor) => ResolvedActor | undefined;
}) {
  const resolved = resolveActor?.(actor);
  const name = resolved?.name ?? actorFallbackName(actor);
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          actor.type === "agent" ? (
            <span className="flex size-4 shrink-0 items-center justify-center rounded bg-foreground" />
          ) : resolved?.imageUrl ? (
            <img
              src={resolved.imageUrl}
              alt={name}
              className="size-4 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-muted-foreground">
              {name.slice(0, 1).toUpperCase()}
            </span>
          )
        }
      />
      <TooltipContent>{name}</TooltipContent>
    </Tooltip>
  );
}

export type UploadSendHandlers = {
  retry: (clientKey: string) => void;
  edit: (clientKey: string) => void;
};

export type QueueRowProps = {
  row: QueueRowData;
  viewerUserId?: string;
  onAct: (action: QueueAction) => void;
  uploadSend?: UploadSendHandlers;
  resolveActor?: (actor: QueueActor) => ResolvedActor | undefined;
};

/** One queued message: delivery icon, sender, text, hover actions and upload state. */
export function QueueRow({
  row,
  viewerUserId,
  onAct,
  uploadSend,
  resolveActor,
}: QueueRowProps) {
  const uploading =
    row.uploads?.filter((upload) => upload.status === "uploading") ?? [];
  const progress = uploadProgress(row.uploads ?? []);
  const editable = row.uploads === undefined;
  const fileCount = row.files.length + (row.uploads?.length ?? 0);
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: the row's click mirrors the Edit button, which stays keyboard reachable
    <div
      className={cx(
        "group/queue-row",
        barRow,
        editable && "cursor-pointer hover:bg-popover-hover",
      )}
      onClick={(event: MouseEvent) => {
        if (
          editable &&
          event.target instanceof Element &&
          event.target.closest("a, button") === null
        )
          onAct("edit");
      }}
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <span className={barIcon}>
              <Icon
                name={
                  row.delivery === "queue"
                    ? "arrow-corner-down-right"
                    : "arrow-corner-up-right"
                }
                className="size-(--icon-sm)"
              />
            </span>
          }
        />
        <TooltipContent>
          {row.delivery === "queue"
            ? "Sends when the current run finishes"
            : "Read when the current response finishes"}
        </TooltipContent>
      </Tooltip>
      {row.actor !== null &&
        (row.actor.type !== "user" || row.actor.userId !== viewerUserId) && (
          <QueueSenderAvatar actor={row.actor} resolveActor={resolveActor} />
        )}
      <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
        {queueRowText(row)}
      </span>
      {editable && (
        <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-fast group-hover/queue-row:opacity-100 group-hover/queue-row:duration-0 group-focus-within/queue-row:opacity-100 group-focus-within/queue-row:duration-0 pointer-coarse:opacity-100">
          <IconButton
            label="Edit in composer"
            icon={<Icon name="pencil" />}
            onClick={() => onAct("edit")}
          />
          <IconButton
            label="Send now"
            icon={<Icon name="arrow-up" />}
            onClick={() => onAct("send")}
          />
          <IconButton
            label="Discard"
            icon={<Icon name="cross-medium" />}
            onClick={() => onAct("cancel")}
          />
        </span>
      )}
      {row.uploadFailure !== undefined && row.clientKey !== undefined ? (
        <span className="flex shrink-0 items-center gap-0.5 text-xs text-destructive">
          <span className="max-w-48 truncate" title={row.uploadFailure}>
            {row.uploadFailure}
          </span>
          <Button
            variant="ghost"
            size="xs"
            onClick={() =>
              row.clientKey !== undefined && uploadSend?.retry(row.clientKey)
            }
          >
            Retry
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() =>
              row.clientKey !== undefined && uploadSend?.edit(row.clientKey)
            }
          >
            Edit
          </Button>
        </span>
      ) : uploading.length > 0 ? (
        <span className="mr-1.5 flex shrink-0 items-center gap-1 text-xs text-muted-foreground-2 tabular-nums">
          {progress === undefined || progress === 100 ? (
            <DotGridIcon
              size="xs"
              role="status"
              aria-label={`Uploading ${uploading.length} files`}
            />
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="size-5 text-muted-foreground-1"
              role="progressbar"
              aria-label="Uploading"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                fill="none"
                stroke="var(--border-3)"
                strokeWidth="2"
              />
              <circle
                cx="12"
                cy="12"
                r="9"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                pathLength="100"
                strokeDasharray={`${progress} 100`}
                transform="rotate(-90 12 12)"
              />
            </svg>
          )}
          {uploading.some((upload) => upload.kept === false)
            ? "Not kept across reload"
            : progress === undefined
              ? "Preparing"
              : progress === 100
                ? "Finishing"
                : `${progress}%`}
        </span>
      ) : fileCount > 0 ? (
        <span className="mr-1.5 flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground-2">
          <Icon name="paperclip-1" className="size-(--icon-sm)" />
          {fileCount}
        </span>
      ) : null}
    </div>
  );
}

export type MessageQueueProps = Omit<ComponentProps<"div">, "children"> & {
  rows: ReadonlyArray<QueueRowData>;
  viewerUserId?: string;
  /** From `useQueueActions`. */
  actions: Pick<ReturnType<typeof useQueueActions>, "departing" | "act">;
  /** Rendered above the queue (Capy's inventory slot). */
  inventory?: ReactNode;
  inventoryExpanded?: boolean;
  editing?: { onCancel: () => void };
  replying?: { name: string; text: string; onCancel: () => void };
  uploadSend?: UploadSendHandlers;
  resolveActor?: (actor: QueueActor) => ResolvedActor | undefined;
  /** The composer itself. */
  children?: ReactNode;
};

/** Queued messages, edit and reply bars, drawn on the composer ground above the composer. */
export function MessageQueue({
  rows,
  viewerUserId,
  actions,
  inventory,
  inventoryExpanded = false,
  editing,
  replying,
  uploadSend,
  resolveActor,
  children,
  className,
  ...props
}: MessageQueueProps) {
  const transitions = useQueueTransitions(rows, actions.departing);
  const entries = transitions.entries;
  const staying = entries.filter((entry) => entry.leaving === undefined).length;
  const grounded =
    entries.length > 0 ||
    inventoryExpanded ||
    editing !== undefined ||
    replying !== undefined;
  const onKeyDown = (event: KeyboardEvent) => {
    const cancel = editing?.onCancel ?? replying?.onCancel;
    if (
      cancel === undefined ||
      event.key !== "Escape" ||
      event.defaultPrevented
    )
      return;
    event.preventDefault();
    cancel();
  };
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Escape bubbles up from the composer and queue buttons inside, as in Capy
    <div
      onKeyDown={onKeyDown}
      className={cx(
        "-m-(--composer-ground-inset) rounded-composer-ground p-(--composer-ground-inset) transition-colors duration-base ease-out-quint",
        grounded ? "bg-composer-ground" : "bg-transparent",
        className,
      )}
      {...props}
    >
      {inventory}
      {editing !== undefined && (
        <div className={barRow}>
          <span className={barIcon}>
            <Icon name="pencil" className="size-(--icon-sm)" />
          </span>
          <span className="min-w-0 flex-1 text-sm text-muted-foreground">
            Editing message
          </span>
          <IconButton
            label="Cancel editing"
            icon={<Icon name="cross-medium" />}
            onClick={editing.onCancel}
          />
        </div>
      )}
      {replying !== undefined && (
        <div className={barRow}>
          <span className={barIcon}>
            <Icon name="arrow-share-left" className="size-(--icon-sm)" />
          </span>
          <span className="flex min-w-0 flex-1 gap-1.5 text-sm">
            <span className="mask-fade-r max-w-3/5 shrink-0 overflow-hidden whitespace-nowrap text-muted-foreground [--mask-fade-ramp:calc(var(--spacing)*4)]">
              Replying to{" "}
              <span className="font-medium text-foreground">
                {replying.name}
              </span>
            </span>
            <span className="mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap text-sm text-muted-foreground [--mask-fade-ramp:calc(var(--spacing)*8)]">
              {replying.text}
            </span>
          </span>
          <IconButton
            label="Cancel reply"
            icon={<Icon name="cross-medium" />}
            onClick={replying.onCancel}
          />
        </div>
      )}
      <div
        aria-hidden={staying < 2}
        className={cx(
          "grid transition-[grid-template-rows,opacity] duration-fast ease-out-quint motion-reduce:transition-none",
          staying >= 2
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="mb-0.5 flex h-8 items-center py-1 pr-2.5 pl-3.5 text-sm text-muted-foreground tabular-nums">
            {Math.max(staying, 2)} queued
          </div>
        </div>
      </div>
      <div
        className={cx(
          entries.length > 3 &&
            "max-h-[6.375rem] overflow-y-auto overscroll-contain md:scroll-fade-y md:supports-[animation-timeline:scroll()]:scrollbar-hide",
        )}
      >
        {entries.map((entry) => (
          <div
            key={entry.key}
            inert={entry.leaving !== undefined}
            onTransitionEnd={(event) => {
              if (
                event.target === event.currentTarget &&
                entry.leaving !== undefined
              )
                transitions.settleExit(entry.key);
            }}
            className={cx(
              "grid transition-[grid-template-rows,opacity,translate] duration-fast ease-out-quint motion-reduce:transition-none",
              entry.leaving === undefined
                ? "grid-rows-[1fr] opacity-100 starting:grid-rows-[0fr] starting:opacity-0 motion-safe:starting:translate-y-1"
                : "grid-rows-[0fr] opacity-0 duration-exit",
              entry.leaving === "cancel" && "motion-safe:-translate-x-2",
              entry.leaving === "edit" && "motion-safe:translate-y-1.5",
              (entry.leaving === "send" || entry.leaving === "promote") &&
                "motion-safe:-translate-y-1.5",
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <QueueRow
                row={entry.row}
                viewerUserId={viewerUserId}
                onAct={(action) => actions.act(entry.row, action)}
                uploadSend={uploadSend}
                resolveActor={resolveActor}
              />
            </div>
          </div>
        ))}
      </div>
      {children}
    </div>
  );
}

/**
 * Wires queue actions to the API: Send now calls `messages/:eventId/send-now`,
 * Discard calls `messages/:eventId/cancel`, Edit cancels and hands the row to
 * the composer when the cancel lands in time.
 */
export function useMessageQueueApi(
  orgId: string,
  jamId: string,
  onEdit: (row: QueueRowData) => void,
): QueueActHandler {
  const sendNow = useAtomSet(sendNowMessageAtom, { mode: "promiseExit" });
  const cancel = useAtomSet(cancelMessageAtom, { mode: "promiseExit" });
  return async (action, row, eventId) => {
    const params = { orgId, jamId, eventId };
    const reactivityKeys = [`jam_event:${jamId}`];
    if (action === "send") {
      const exit = await sendNow({ params, reactivityKeys });
      return Exit.isSuccess(exit) && exit.value.outcome === "sent";
    }
    const exit = await cancel({ params, reactivityKeys });
    const cancelled =
      Exit.isSuccess(exit) && exit.value.outcome === "cancelled";
    if (cancelled && action === "edit") onEdit(row);
    return cancelled;
  };
}

const minute = 6e4;
const halfDay = 432e5;
const timeFormat = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});
const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** Whether the queued marker shows: queued for a minute or more and not waiting on the person. */
export const showQueuedMarker = (
  queuedSince: Date | null,
  needsYou: boolean,
  now: Date,
) =>
  queuedSince !== null &&
  !needsYou &&
  now.getTime() - queuedSince.getTime() >= minute;

export type QueuedMarkerProps = ComponentProps<"div"> & {
  queuedSince?: Date;
  /** Waiting for a Claude Code slot rather than a worker. */
  claudeCode?: boolean;
  /** Animate in (Capy's enter flag on the live status row). */
  enter?: boolean;
  now?: Date;
};

/** "Queued since 10:42" status line in the thread timeline. */
export function QueuedMarker({
  queuedSince,
  claudeCode = false,
  enter = false,
  now = new Date(),
  className,
  children,
  ...props
}: QueuedMarkerProps) {
  const elapsed =
    queuedSince === undefined ? 0 : now.getTime() - queuedSince.getTime();
  return (
    <div
      data-slot="queued-marker"
      className={cx("flex w-full items-start justify-center", className)}
      {...props}
    >
      {queuedSince === undefined ? (
        children
      ) : (
        <span
          className={cx(
            "max-w-[86%] min-w-0 py-1.5 text-center text-xs font-normal text-muted-foreground-2 md:max-w-[80%]",
            enter &&
              "motion-safe:transition-opacity motion-safe:duration-base motion-safe:delay-(--duration-fast) motion-safe:ease-out-quint motion-safe:starting:opacity-0",
          )}
        >
          <DotGridIcon
            size="sm"
            data-state="waiting"
            className="mr-1 inline-block align-[-0.2em] text-muted-foreground"
          />
          {claudeCode
            ? "Queued for a Claude Code slot since "
            : "Queued since "}
          <time dateTime={queuedSince.toISOString()}>
            {(elapsed < halfDay ? timeFormat : dateTimeFormat).format(
              queuedSince,
            )}
          </time>
        </span>
      )}
    </div>
  );
}
