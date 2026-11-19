import { type ComponentProps, type ReactNode, useMemo } from "react";
import { Markdown } from "@/components/markdown";
import type { AgentMessageRow as AgentMessageRowSchema } from "@/data/events";
import { useIsPhoneSurface } from "@/features/mobile/use-mobile";
import {
  AttachmentGallery,
  type GalleryItem,
} from "@/features/thread/attachment-gallery";
import {
  BranchIcon,
  ChatBubbleIcon,
  CopyIcon,
  CopyMessageButton,
  cx,
  formatMessageStamp,
  MENU_ICON_SLOT,
  MessageFooter,
  MessageMeta,
  MessageStamp,
  MoreIcon,
  SummaryIcon,
  useMessageActions,
} from "@/features/thread/message-footer";
import { useAttachmentOpener } from "@/features/thread/thread-view/pane-session-context";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import {
  Menu,
  MenuContent,
  MenuSeparator,
  MenuTrigger,
} from "@/primitives/menu";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuTrigger,
} from "@/primitives/responsive-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { sectionCopyText, splitSections } from "./sections";

export {
  ClampedBody,
  type ClampedBodyProps,
} from "@/components/clamped-body";

export type AgentMessageRow = typeof AgentMessageRowSchema.Type;

/** Spacing between an agent message's sections (Capy's chat layout constant). */
export const SECTION_GAP = "gap-[1.5em] max-md:gap-[1.25em]";

export type AgentMessageProps = ComponentProps<"div"> & {
  row: AgentMessageRow & {
    /** The timeline marks the last settled message of an exchange. */
    readonly showFooter?: boolean | undefined;
  };
  /** True while this message belongs to the live turn and text is still arriving. */
  streaming?: boolean;
  /** Hands the clicked tile to the thread's lightbox. */
  onOpenMedia?: (items: ReadonlyArray<GalleryItem>, index: number) => void;
};

export function AgentMessage({
  row,
  streaming = false,
  onOpenMedia,
  className,
  ...props
}: AgentMessageProps) {
  const sections = useMemo(() => splitSections(row.text), [row.text]);
  const phone = useIsPhoneSurface();
  const openAttachment = useAttachmentOpener();
  return (
    <div
      data-slot="agent-message"
      className={cx("flex min-w-0 flex-col py-2", SECTION_GAP, className)}
      {...props}
    >
      {sections.map((text, index) => (
        <MessageSection
          // biome-ignore lint/suspicious/noArrayIndexKey: sections are positional and only ever grow at the end
          key={index}
          row={row}
          text={text}
          section={index}
          streaming={streaming && index === sections.length - 1}
          settled={row.settled && !streaming}
          phone={phone}
        />
      ))}
      {row.files.length > 0 && (
        <AttachmentGallery
          entries={row.files.map(({ file, title }) => ({ file, title }))}
          onOpenMedia={onOpenMedia}
          onOpenFile={(entry) => openAttachment(entry)}
        />
      )}
      {row.interrupted && <MessageStatus>Interrupted</MessageStatus>}
      {phone && row.showFooter && row.settled && !streaming && (
        <PhoneFooter
          row={row}
          section={sections.length - 1}
          text={sections.at(-1) ?? row.text}
        />
      )}
    </div>
  );
}

export type MessageHeaderProps = Omit<ComponentProps<"div">, "children"> & {
  mark?: ReactNode;
  name: ReactNode;
  detail?: ReactNode;
  date?: Date;
};

/** Sender line above a message from someone other than the viewer. */
export function MessageHeader({
  mark,
  name,
  detail,
  date,
  className,
  ...props
}: MessageHeaderProps) {
  return (
    <div
      data-slot="message-header"
      className={cx(
        "flex max-w-full min-w-0 items-center gap-1.5 text-xs leading-4",
        className,
      )}
      {...props}
    >
      <span className="flex size-4 shrink-0 items-center justify-center">
        {mark}
      </span>
      <span className="min-w-0 text-pretty">
        <span className="font-medium text-foreground">{name}</span>
        {detail !== undefined && (
          <span className="pl-1.5 text-muted-foreground-2">{detail}</span>
        )}
      </span>
      {date !== undefined && <MessageStamp date={date} />}
    </div>
  );
}

export type MessageSectionProps = Omit<ComponentProps<"div">, "children"> & {
  row: AgentMessageRow;
  text: string;
  section: number;
  streaming?: boolean;
  settled?: boolean;
  /** A phone shows one Copy + More row under the message instead of a rail per section. */
  phone?: boolean;
};

/** One block of an agent message with its own hover rail. */
export function MessageSection({
  row,
  text,
  section,
  streaming = false,
  settled = false,
  phone = false,
  className,
  ...props
}: MessageSectionProps) {
  return (
    <div
      data-slot="message-section"
      className={cx("group/rail relative min-w-0", className)}
      {...props}
    >
      <Markdown text={text} streaming={streaming} gallery />
      {settled && !phone && (
        <SectionRail row={row} text={text} section={section} />
      )}
    </div>
  );
}

/** Fork and side-chat rows, shared by the hover rail and the phone menu. */
function QuoteMenuItems({ text }: { text: string }) {
  const actions = useMessageActions();
  if (actions.forkQuote === undefined && actions.sideChatQuote === undefined) {
    return null;
  }
  const quote = { text, source: "Capy's response" };
  return (
    <>
      <MenuSeparator />
      {actions.forkQuote !== undefined && (
        <>
          <ResponsiveMenuItem
            onClick={() => actions.forkQuote?.("copy", quote)}
          >
            <span className={MENU_ICON_SLOT}>
              <BranchIcon />
            </span>
            Fork
          </ResponsiveMenuItem>
          <ResponsiveMenuItem
            onClick={() => actions.forkQuote?.("summary", quote)}
          >
            <span className={MENU_ICON_SLOT}>
              <SummaryIcon />
            </span>
            Fork summary
          </ResponsiveMenuItem>
        </>
      )}
      {actions.sideChatQuote !== undefined && (
        <ResponsiveMenuItem onClick={() => actions.sideChatQuote?.(quote)}>
          <span className={MENU_ICON_SLOT}>
            <ChatBubbleIcon />
          </span>
          Side chat
        </ResponsiveMenuItem>
      )}
    </>
  );
}

function SectionRail({
  row,
  text,
  section,
}: {
  row: AgentMessageRow;
  text: string;
  section: number;
}) {
  const actions = useMessageActions();
  const reply = () =>
    actions.reply?.({
      eventId: row.eventId,
      rowId: row.id,
      section,
      name: actions.agentName ?? "Capy",
      text,
    });
  return (
    <MessageFooter>
      <MessageStamp date={row.createdAt} className="px-1.5" />
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Reply"
              onClick={reply}
            >
              <Icon name="arrow-share-left" />
            </Button>
          }
        />
        <TooltipContent>Reply</TooltipContent>
      </Tooltip>
      <CopyMessageButton text={sectionCopyText(text)} />
      <Menu>
        <MenuTrigger
          render={
            <Button variant="ghost" size="icon-xs" aria-label="More">
              <MoreIcon />
            </Button>
          }
        />
        <MenuContent align="end" className="kiki-message-menu">
          <ResponsiveMenuItem
            onClick={() => void navigator.clipboard?.writeText(row.text)}
          >
            <span className={MENU_ICON_SLOT}>
              <CopyIcon />
            </span>
            Copy whole message
          </ResponsiveMenuItem>
          <QuoteMenuItems text={text} />
          <MessageMeta
            modelId={row.modelId}
            reasoningMode={row.reasoningMode}
            mode={row.mode}
            separated
          />
        </MenuContent>
      </Menu>
    </MessageFooter>
  );
}

/**
 * The phone's in-flow action row under a settled message: Copy, and a More
 * menu carrying Reply, the quote actions and the message's model and time.
 * Its More menu is a bottom drawer rather than an anchored popup.
 */
function PhoneFooter({
  row,
  section,
  text,
}: {
  row: AgentMessageRow;
  section: number;
  text: string;
}) {
  const actions = useMessageActions();
  const reply = () =>
    actions.reply?.({
      eventId: row.eventId,
      rowId: row.id,
      section,
      name: actions.agentName ?? "Capy",
      text,
    });
  return (
    <div data-slot="message-footer" className="kiki-message-actions">
      <CopyMessageButton text={row.text} />
      <ResponsiveMenu>
        <ResponsiveMenuTrigger
          render={
            <Button variant="ghost" size="icon-xs" aria-label="More">
              <MoreIcon />
            </Button>
          }
        />
        <ResponsiveMenuContent align="start" className="kiki-message-menu">
          <ResponsiveMenuItem onClick={reply}>
            <span className={MENU_ICON_SLOT}>
              <Icon name="arrow-share-left" />
            </span>
            Reply
          </ResponsiveMenuItem>
          <QuoteMenuItems text={text} />
          <MessageMeta
            modelId={row.modelId}
            reasoningMode={row.reasoningMode}
            mode={row.mode}
            createdAt={row.createdAt}
            separated
          />
        </ResponsiveMenuContent>
      </ResponsiveMenu>
    </div>
  );
}

export type MessageStatusProps = ComponentProps<"div">;

export function MessageStatus({ className, ...props }: MessageStatusProps) {
  return (
    <div
      data-slot="message-status"
      className={cx("text-xs text-muted-foreground-2", className)}
      {...props}
    />
  );
}

export type ChatStampProps = Omit<ComponentProps<"span">, "children"> & {
  date: Date;
};

/** Centred time stamp the chat list puts above a row after a long gap. */
export function ChatStamp({ date, className, ...props }: ChatStampProps) {
  const { now } = useMessageActions();
  return (
    <span
      data-slot="chat-stamp"
      className={cx(
        "mb-3 flex min-h-7 items-center justify-center text-xs text-muted-foreground-2 tabular-nums select-none max-md:mb-2.5",
        className,
      )}
      {...props}
    >
      {formatMessageStamp(date, now)}
    </span>
  );
}
