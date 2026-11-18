import type { ComponentProps } from "react";
import { ClampedBody } from "@/components/clamped-body";
import { Markdown } from "@/components/markdown";
import type { UserMessageRow as UserMessageRowSchema } from "@/data/events";
import { MessageHeader } from "@/features/thread/agent-message";
import {
  type AttachmentEntry,
  AttachmentGallery,
  type GalleryItem,
} from "@/features/thread/attachment-gallery";
import {
  actorName,
  CopyMessageButton,
  cx,
  MessageFooter,
  MessageStamp,
  useMessageActions,
} from "@/features/thread/message-footer";
import { parseReply, ReplyQuote } from "@/features/thread/reply-quote";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";

export type UserMessageRow = typeof UserMessageRowSchema.Type;

const BUBBLE =
  "max-w-full min-w-0 rounded-(--radius-card) bg-secondary px-3 py-2 wrap-anywhere";
const CLAMP_HEIGHT = 288;
const CLAMP_FADE = { rest: "1.5rem", hover: "2rem" };
const CLAMP_MIN_CHARS = 420;
const CLAMP_MIN_LINES = 9;

/** Whether a message is long enough to collapse behind Show more. */
export function needsClamp(
  text: string,
  clampHeight?: number | { lines: number },
) {
  return (
    clampHeight !== undefined ||
    text.length > CLAMP_MIN_CHARS ||
    text.split("\n").length > CLAMP_MIN_LINES
  );
}

export type UserMessageProps = ComponentProps<"div"> & {
  row: UserMessageRow;
  /** Present when the chat list tracks this row's Show more state. */
  expanded?: boolean;
  onToggleExpanded?: () => void;
  clampHeight?: number | { lines: number };
  /** False hides the hover footer (previews, read-only transcripts). */
  footer?: boolean;
  /** Hands the clicked tile to the thread's lightbox. */
  onOpenMedia?: (items: ReadonlyArray<GalleryItem>, index: number) => void;
};

export function UserMessage({
  row,
  expanded = false,
  onToggleExpanded,
  clampHeight,
  footer = true,
  onOpenMedia,
  className,
  ...props
}: UserMessageProps) {
  const actions = useMessageActions();
  const mine =
    actions.viewerUserId !== undefined &&
    row.actor.type === "user" &&
    row.actor.userId === actions.viewerUserId;
  const reply = parseReply(row.text, row.mentions);
  const body = reply?.text ?? row.text;
  const name = actorName(actions, row.actor);
  const pending = row.state === "pending";
  const canReply = body !== "" && !pending;
  const canEdit =
    mine && row.state === "answered" && actions.editMessage !== undefined;
  const align = mine ? "items-end" : "items-start";
  const imageUrl = actions.resolveActor?.(row.actor)?.imageUrl;
  const attachments: ReadonlyArray<AttachmentEntry> = row.files.map((file) => ({
    file,
  }));

  const footerEl = footer && (
    <MessageFooter touch align={mine ? "end" : "start"}>
      <MessageStamp
        date={row.createdAt}
        className="px-1.5"
        edited={actions.editedRowIds?.has(row.id) ?? false}
      />
      {canReply && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Reply"
                onClick={() =>
                  actions.reply?.({
                    eventId: row.eventId,
                    rowId: row.id,
                    section: 0,
                    name,
                    text: body,
                  })
                }
              >
                <Icon name="arrow-share-left" />
              </Button>
            }
          />
          <TooltipContent>Reply</TooltipContent>
        </Tooltip>
      )}
      {body !== "" && <CopyMessageButton text={body} />}
      {canEdit && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Edit message"
                onClick={() =>
                  actions.editMessage?.({
                    rowId: row.id,
                    eventId: row.eventId,
                    text: body,
                  })
                }
              >
                <Icon name="pencil" />
              </Button>
            }
          />
          <TooltipContent>Edit message</TooltipContent>
        </Tooltip>
      )}
    </MessageFooter>
  );

  const text = <Markdown text={body} breaks literalHtml />;

  return (
    <div
      data-slot="user-message"
      className={cx(
        "group/message flex min-w-0 flex-col gap-1.5 py-2",
        align,
        className,
      )}
      {...props}
    >
      {!mine && (
        <MessageHeader
          mark={
            imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                className="size-4 shrink-0 rounded-full"
              />
            ) : undefined
          }
          name={name}
          date={row.createdAt}
        />
      )}
      <div
        className={cx(
          "relative flex max-w-[77%] min-w-0 flex-col gap-1.5",
          footer && "group/rail",
          row.files.length > 0 && "w-full",
          align,
        )}
      >
        {attachments.length > 0 && (
          <AttachmentGallery
            entries={attachments}
            align={mine ? "end" : "start"}
            onOpenMedia={onOpenMedia}
          />
        )}
        {(body !== "" || reply !== undefined) && (
          <div
            className={cx(
              "relative flex max-w-full min-w-0 flex-col gap-1.5",
              align,
            )}
          >
            {reply !== undefined && (
              <ReplyQuote
                rowId={reply.rowId}
                section={reply.section}
                quote={reply.quote}
                align={mine ? "end" : "start"}
              />
            )}
            {body !== "" &&
              (onToggleExpanded === undefined ||
              !needsClamp(body, clampHeight) ? (
                <div className={BUBBLE}>{text}</div>
              ) : (
                <ClampedBody
                  maxHeight={clampHeight ?? CLAMP_HEIGHT}
                  expanded={expanded}
                  onToggle={onToggleExpanded}
                  fade={clampHeight === undefined ? undefined : CLAMP_FADE}
                  className={BUBBLE}
                >
                  {text}
                </ClampedBody>
              ))}
            {footerEl}
          </div>
        )}
        {body === "" && reply === undefined && footerEl}
      </div>
    </div>
  );
}
