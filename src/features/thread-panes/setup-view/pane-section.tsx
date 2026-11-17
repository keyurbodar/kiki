import type { ReactNode } from "react";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/primitives/collapsible";

export type PaneSectionProps = {
  label: string;
  description?: string;
  count: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
};

export function PaneSection({
  label,
  description,
  count,
  defaultOpen = true,
  open,
  onOpenChange,
  children,
}: PaneSectionProps) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={
        onOpenChange === undefined ? undefined : (next) => onOpenChange(next)
      }
    >
      <CollapsibleTrigger
        block
        className="h-7 rounded-(--radius) bg-section px-2 text-xs"
      >
        <span className="text-foreground">{label}</span>
        <span className="font-normal text-muted-foreground-3 tabular-nums">
          {count}
        </span>
      </CollapsibleTrigger>
      <CollapsiblePanel>
        <div className="flex flex-col gap-1 pt-0.5 pb-1">
          {description !== undefined && (
            <p className="px-2 py-1 text-xs text-muted-foreground-2">
              {description}
            </p>
          )}
          {children}
        </div>
      </CollapsiblePanel>
    </Collapsible>
  );
}
