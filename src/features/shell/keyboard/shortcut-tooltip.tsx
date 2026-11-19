import type { ComponentProps, ReactElement, ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { useShortcutChord } from "./store";

export type ShortcutTooltipProps = {
  /** The command whose effective binding prints beside the label. */
  command: string;
  label: ReactNode;
  /** The control the tooltip belongs to, rendered as the trigger. */
  render: ReactElement;
  side?: ComponentProps<typeof TooltipContent>["side"];
};

/**
 * A tooltip that prints the shortcut the command answers to now, read from the
 * binding table, so a rebind changes the hint and the handler together. A
 * command the table binds nothing to prints its label alone.
 */
export function ShortcutTooltip({
  command,
  label,
  render,
  side = "bottom",
}: ShortcutTooltipProps) {
  const shortcut = useShortcutChord(command);
  return (
    <Tooltip>
      <TooltipTrigger render={render} />
      <TooltipContent side={side} shortcut={shortcut}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
