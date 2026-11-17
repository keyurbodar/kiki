import { type Ref, useState } from "react";
import {
  BranchIcon,
  ChatBubbleIcon,
  MENU_ICON_SLOT,
  MoreIcon,
  SummaryIcon,
} from "@/features/thread/message-footer";
import { Button } from "@/primitives/button";
import {
  Menu,
  MenuActionItem,
  MenuContent,
  type MenuProps,
  MenuTrigger,
} from "@/primitives/menu";

type Run = () => Promise<unknown> | undefined;

export type ResponseSelectionActionsProps = {
  onFork?: Run;
  onForkSummary?: Run;
  onSideChat?: Run;
  /** Disables every action while the caller is still preparing the selection. */
  pending?: boolean;
  onOpenChange: (open: boolean, event?: Event) => void;
  contentRef?: Ref<HTMLDivElement>;
};

/**
 * The overflow menu on the floating toolbar over selected response text:
 * Fork, Fork summary and Side chat on the selection. An action that returns
 * a promise keeps the menu open and busy until it settles.
 */
export function ResponseSelectionActions({
  onFork,
  onForkSummary,
  onSideChat,
  pending = false,
  onOpenChange,
  contentRef,
}: ResponseSelectionActionsProps) {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState<number | null>(null);
  const busy = pending || running !== null;
  const items = [
    { label: "Fork", icon: <BranchIcon />, run: onFork },
    { label: "Fork summary", icon: <SummaryIcon />, run: onForkSummary },
    { label: "Side chat", icon: <ChatBubbleIcon />, run: onSideChat },
  ];
  const change = (next: boolean, event?: Event) => {
    setOpen(next);
    onOpenChange(next, event);
  };
  const handleOpenChange: MenuProps["onOpenChange"] = (next, details) =>
    change(
      next,
      details.reason === "outside-press" || details.reason === "focus-out"
        ? details.event
        : undefined,
    );
  return (
    <Menu open={open} onOpenChange={handleOpenChange}>
      <MenuTrigger
        render={
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="More selection actions"
            aria-busy={busy || undefined}
          >
            <MoreIcon />
          </Button>
        }
      />
      <MenuContent
        ref={contentRef}
        aria-label="Selection actions"
        className="w-60"
        onPointerUp={(event) => event.stopPropagation()}
      >
        {items.map((item, index) => (
          <MenuActionItem
            key={item.label}
            disabled={busy || item.run === undefined}
            aria-busy={running === index || undefined}
            onClick={() => {
              const result = item.run?.();
              if (result === undefined) {
                change(false);
                return;
              }
              setRunning(index);
              void result.then(() => {
                setRunning(null);
                change(false);
              });
            }}
          >
            <span className={MENU_ICON_SLOT}>{item.icon}</span>
            {item.label}
          </MenuActionItem>
        ))}
      </MenuContent>
    </Menu>
  );
}
