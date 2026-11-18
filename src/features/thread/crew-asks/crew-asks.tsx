import { Menu as BaseMenu } from "@base-ui/react/menu";
import { type ComponentProps, useState } from "react";
import { ThreadStatus } from "@/components/thread-status";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import {
  ResponsiveMenu,
  ResponsiveMenuItem,
} from "@/primitives/responsive-menu";
import { toast } from "@/primitives/toaster";
import {
  CREW_ASKS_PAGE,
  type CrewAsk,
  type CrewAskItem,
  type CrewAskKey,
  type CrewAsksDismiss,
  type CrewThread,
  crewAsksLabel,
  crewAsksShortLabel,
  dismissCrewAsks,
  groupCrewAsks,
} from "./crew-asks-model";

export type CrewAsksTriggerProps = ComponentProps<"button">;

export function CrewAsksTrigger(props: CrewAsksTriggerProps) {
  return <button data-slot="crew-asks-trigger" {...props} />;
}

const FOOTER_PILL =
  "relative flex h-7 cursor-pointer items-center justify-center rounded-(--radius-card) px-2.5 text-xs whitespace-nowrap text-muted-foreground hover:text-foreground focus-visible:outline-ring-inset";

export type CrewAsksMenuProps = {
  captainId: string;
  asks: readonly CrewAsk[];
  threads: readonly CrewThread[];
  onOpenJam: (threadId: string) => void;
  onDismiss: CrewAsksDismiss;
  onRestore?: (asks: readonly CrewAskKey[]) => Promise<void>;
  touch?: boolean;
};

export function CrewAsksMenu({
  captainId,
  asks,
  threads,
  onOpenJam,
  onDismiss,
  onRestore,
  touch = false,
}: CrewAsksMenuProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [limit, setLimit] = useState(CREW_ASKS_PAGE);
  const items = groupCrewAsks(asks, threads, captainId);
  if (items.length === 0) return null;

  const dismiss = async (keys: readonly CrewAskKey[]) => {
    const { dismissed, failed } = await dismissCrewAsks(keys, onDismiss);
    if (failed) toast.error("Could not dismiss the asks");
    if (dismissed.length === 0) return;
    toast.success("Dismissed", {
      action:
        onRestore === undefined
          ? undefined
          : {
              label: "Undo",
              onClick: () => {
                onRestore(dismissed).catch(() =>
                  toast.error("Could not restore the asks"),
                );
              },
            },
    });
  };

  const label = crewAsksLabel(items.length);

  const renderItem = (item: CrewAskItem) => {
    const body = (
      <>
        <ThreadStatus data-state={item.glyph} className="mt-0.5 shrink-0" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="mask-fade-r overflow-hidden whitespace-nowrap text-foreground">
            {item.title}
          </span>
          <span className="mask-fade-r overflow-hidden whitespace-nowrap text-primary-ink">
            {item.text}
          </span>
        </span>
      </>
    );
    const dismissButton = (
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={`Dismiss ${item.title}`}
        className="shrink-0 opacity-0 group-hover/ask:opacity-100 group-data-[highlighted]/ask:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void dismiss(item.asks);
        }}
      >
        <Icon name="cross-medium" />
      </Button>
    );
    return touch ? (
      <div key={item.id} className="flex items-center gap-1">
        <ResponsiveMenuItem
          className="min-w-0 flex-1 items-start gap-2"
          onClick={() => onOpenJam(item.opens)}
        >
          {body}
        </ResponsiveMenuItem>
        {dismissButton}
      </div>
    ) : (
      <ResponsiveMenuItem
        key={item.id}
        className="group/ask items-start gap-2"
        onClick={() => onOpenJam(item.opens)}
        onKeyDown={(event) => {
          if (event.key === "Delete" || event.key === "Backspace") {
            event.preventDefault();
            void dismiss(item.asks);
          }
        }}
      >
        {body}
        {dismissButton}
      </ResponsiveMenuItem>
    );
  };

  return (
    <ResponsiveMenu
      onOpenChange={(open) => {
        if (!open) setLimit(CREW_ASKS_PAGE);
      }}
    >
      <div
        ref={(node) => setAnchor(node?.parentElement ?? null)}
        className="pointer-events-auto flex shrink-0 flex-col rounded-(--radius-card) border-hairline border-(--card-hairline) bg-card shadow-card"
      >
        <BaseMenu.Trigger
          data-slot="crew-asks-trigger"
          aria-label={label}
          render={
            <button
              type="button"
              className={`${FOOTER_PILL} gap-1.5 [&_svg]:size-(--icon-sm) [&_svg]:shrink-0`}
            />
          }
        >
          <Icon name="bubble-question" />
          <span aria-hidden className="@max-crew-asks-footer/footer:hidden">
            {label}
          </span>
          <span aria-hidden className="@crew-asks-footer/footer:hidden">
            {crewAsksShortLabel(items.length)}
          </span>
        </BaseMenu.Trigger>
      </div>
      <BaseMenu.Portal>
        <BaseMenu.Positioner side="top" align="center" anchor={anchor}>
          <BaseMenu.Popup
            data-slot="crew-asks-menu"
            className="w-[min(26rem,calc(100vw-1.5rem))]"
          >
            {items.slice(0, limit).map(renderItem)}
            {items.length > limit && (
              <ResponsiveMenuItem
                closeOnClick={false}
                onClick={() => setLimit(limit + CREW_ASKS_PAGE)}
              >
                {items.length - limit} more
              </ResponsiveMenuItem>
            )}
            <BaseMenu.Separator data-slot="menu-separator" />
            <ResponsiveMenuItem
              onClick={() => void dismiss(items.flatMap((item) => item.asks))}
            >
              Dismiss all
            </ResponsiveMenuItem>
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </ResponsiveMenu>
  );
}
