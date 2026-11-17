import type { ReactNode } from "react";
import { Button } from "@/primitives/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";

const track = (owner: string) => `features/thread/mobile-view.tsx#${owner}`;

export type ToolbarActionProps = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  pressed?: boolean;
  className?: string;
  children?: ReactNode;
};

export function ToolbarAction({
  label,
  onClick,
  disabled,
  pressed,
  className,
  children,
}: ToolbarActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        data-track-owner={track("ToolbarAction:TooltipTrigger.1")}
        render={
          <Button
            data-track-owner={track("ToolbarAction:Button[onClick=onClick]")}
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            aria-pressed={pressed}
            data-selected={pressed === true ? "" : undefined}
            onClick={onClick}
            disabled={disabled}
            className={className}
          >
            {children}
          </Button>
        }
      />
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
