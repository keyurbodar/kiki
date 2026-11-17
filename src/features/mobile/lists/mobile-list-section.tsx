import type { ReactNode } from "react";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/primitives/collapsible";
import { Icon } from "@/primitives/icon";

export type MobileListSectionProps = {
  label: ReactNode;
  count: number;
  /** Section ids beginning with `closed:` start collapsed, as on desktop. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
};

const triggerClassName =
  "group/collapsible flex h-9 w-full cursor-pointer items-center gap-2 rounded-(--radius-card) bg-section px-2 text-left text-sm font-medium text-foreground outline-none select-none transition-colors duration-100 focus-visible:outline-ring-inset";

const panelClassName =
  "h-(--collapsible-panel-height) overflow-hidden transition-[height,opacity] duration-base ease-out-quint data-[starting-style]:h-0 data-[starting-style]:opacity-0 data-[ending-style]:h-0 data-[ending-style]:opacity-0 motion-reduce:transition-none -m-0.5 p-0.5";

/**
 * A list section as phones draw it: the Collapsible primitive's trigger and a
 * height-animated panel, so a section opens in place instead of only toggling
 * rows. Desktop lists keep their own section markup.
 */
export function MobileListSection({
  label,
  count,
  open,
  onOpenChange,
  children,
}: MobileListSectionProps) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className={triggerClassName}>
        <span className="flex size-4 shrink-0 items-center justify-center">
          <Icon
            name="chevron-right"
            className="-rotate-90 size-(--icon-xs) shrink-0 text-muted-foreground-3 transition-transform duration-100 group-data-[panel-open]/collapsible:rotate-0"
          />
        </span>
        <span className="min-w-0 truncate">{label}</span>
        <span className="font-normal text-muted-foreground-2 tabular-nums">
          {count}
        </span>
      </CollapsibleTrigger>
      <CollapsiblePanel className={panelClassName}>{children}</CollapsiblePanel>
    </Collapsible>
  );
}
