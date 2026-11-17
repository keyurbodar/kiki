import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import type { ComponentProps } from "react";

export type TooltipProviderProps = ComponentProps<typeof BaseTooltip.Provider>;

export function TooltipProvider(props: TooltipProviderProps) {
  return <BaseTooltip.Provider {...props} />;
}

export const Tooltip = BaseTooltip.Root;

export type TooltipProps = ComponentProps<typeof BaseTooltip.Root>;

export type TooltipTriggerProps = ComponentProps<typeof BaseTooltip.Trigger>;

export function TooltipTrigger(props: TooltipTriggerProps) {
  return <BaseTooltip.Trigger data-slot="tooltip-trigger" {...props} />;
}

export type TooltipContentProps = ComponentProps<typeof BaseTooltip.Popup> &
  Pick<
    ComponentProps<typeof BaseTooltip.Positioner>,
    "side" | "align" | "sideOffset" | "alignOffset"
  >;

export function TooltipContent({
  side,
  align,
  sideOffset,
  alignOffset,
  ...props
}: TooltipContentProps) {
  return (
    <BaseTooltip.Portal>
      <BaseTooltip.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
      >
        <BaseTooltip.Popup data-slot="tooltip-content" {...props} />
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  );
}
