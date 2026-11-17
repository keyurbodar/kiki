import type { ReactNode } from "react";
import { Button } from "@/primitives/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { preventMouseDown } from "./shared";

export type ToolbarActionProps = {
  label: string;
  pressed?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
};

export function ToolbarAction({
  label,
  pressed,
  disabled = false,
  onClick,
  children,
}: ToolbarActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="inline-flex">
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={label}
              aria-pressed={pressed}
              data-selected={pressed === true ? "" : undefined}
              disabled={disabled}
              onMouseDown={preventMouseDown}
              onClick={onClick}
            >
              {children}
            </Button>
          </span>
        }
      />
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}
