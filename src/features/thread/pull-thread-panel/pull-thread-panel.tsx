import {
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  useRef,
} from "react";
import { RightPanelHostPanel } from "@/features/shell/right-panel-host";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Textarea } from "@/primitives/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import captainArt from "./art/captain.svg";
import { usePullThreadSelection, useStartPullChat } from "./pull-chat-data";
import {
  type PanelPull,
  type PullPanelSelection,
  pullChatDraft,
  pullChatSubtitle,
} from "./selection";

export const pullChatPlaceholder =
  "Ask anything, / for commands, @ for context";

export type PullThreadPanelProps = {
  selection: PullPanelSelection;
  pull: PanelPull;
  onClose: () => void;
  onSelectThread: (jamId: string) => void;
  onOpenChat: () => void;
  renderThread?: (jamId: string, onClose: () => void) => ReactNode;
};

export function PullThreadPanel({
  selection,
  pull,
  onClose,
  onSelectThread,
  renderThread,
}: PullThreadPanelProps) {
  return (
    <RightPanelHostPanel open={selection !== null}>
      {selection?.kind === "thread" && renderThread?.(selection.jamId, onClose)}
      {selection?.kind === "chat" && (
        <PullChatView
          pull={pull}
          onClose={onClose}
          onCreated={onSelectThread}
        />
      )}
    </RightPanelHostPanel>
  );
}

export type PullThreadPanelTriggerProps = {
  pull: PanelPull;
  open: boolean;
  onOpen: (selection: NonNullable<PullPanelSelection>) => void;
};

export function PullThreadPanelTrigger({
  pull,
  open,
  onOpen,
}: PullThreadPanelTriggerProps) {
  const selection = usePullThreadSelection(pull);
  if (open || selection === null) return null;
  return (
    <Tooltip>
      <TooltipTrigger
        data-track-owner="features/thread/pull-thread-panel.tsx#PullThreadPanelTrigger:TooltipTrigger.1"
        render={
          <Button
            data-track-owner="features/thread/pull-thread-panel.tsx#PullThreadPanelTrigger:Button[Open thread panel]"
            variant="ghost"
            size="icon-sm"
            aria-label="Open thread panel"
            onClick={() => onOpen(selection)}
          >
            <Icon name="sidebar-simple-right-wide" />
          </Button>
        }
      />
      <TooltipContent side="bottom">Open thread</TooltipContent>
    </Tooltip>
  );
}

export type PullChatViewProps = {
  pull: PanelPull;
  onClose: () => void;
  onCreated: (jamId: string) => void;
};

export function PullChatView({ pull, onClose, onCreated }: PullChatViewProps) {
  const { start, busy, ready } = useStartPullChat(pull, onCreated);
  const input = useRef<HTMLTextAreaElement>(null);

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    const message = input.current?.value.trim() ?? "";
    if (message === "" || busy || !ready) return;
    if (await start(message)) input.current?.form?.reset();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    )
      return;
    event.preventDefault();
    void submit();
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <div className="flex min-h-11 shrink-0 items-center gap-1 border-b-hairline border-border-1 px-2">
        <span className="mask-fade-r min-w-0 flex-1 overflow-hidden pl-1 text-sm font-medium whitespace-nowrap text-foreground">
          Chat with Capy
        </span>
        <Tooltip>
          <TooltipTrigger
            data-track-owner="features/thread/pull-thread-panel.tsx#PullChatView:TooltipTrigger.1"
            render={
              <Button
                data-track-owner="features/thread/pull-thread-panel.tsx#PullChatView:Button[Close panel]"
                variant="ghost"
                size="icon-sm"
                aria-label="Close panel"
                onClick={onClose}
              >
                <Icon name="sidebar-simple-right-wide" />
              </Button>
            }
          />
          <TooltipContent side="bottom">Close panel</TooltipContent>
        </Tooltip>
      </div>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <img
          src={captainArt}
          alt=""
          className="mb-2 h-20 opacity-30 grayscale mix-blend-luminosity"
        />
        <span className="max-w-xs text-sm text-balance text-muted-foreground-1">
          Chat with Capy about this pull request
        </span>
        <span className="max-w-xs text-xs text-balance text-muted-foreground-3">
          {pullChatSubtitle(pull)}
        </span>
      </div>
      <div className="px-4 pb-[calc(1rem+var(--safe-bottom))]">
        <Textarea
          ref={input}
          variant="blank"
          aria-label="Message"
          placeholder={pullChatPlaceholder}
          defaultValue={pullChatDraft(pull).text}
          autoFocus
          aria-busy={busy}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  );
}
