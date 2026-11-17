import type { ReactNode } from "react";
import { Button } from "@/primitives/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";

export type CrewActionProps = {
  label: string;
  onClick: () => void;
  children: ReactNode;
};

/** One hover action on a crew row: an icon button with a tooltip. */
export function CrewAction({ label, onClick, children }: CrewActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="bare"
            size="icon-shrink"
            aria-label={label}
            className="relative p-1"
            onClick={(event) => {
              event.stopPropagation();
              onClick();
            }}
          >
            {children}
          </Button>
        }
      />
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
