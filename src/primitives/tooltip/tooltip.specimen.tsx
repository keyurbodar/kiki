import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from ".";

export function TooltipSpecimen() {
  return (
    <TooltipProvider>
      <div className="flex gap-24 p-6">
        <Tooltip open>
          <TooltipTrigger className="text-sm">New thread</TooltipTrigger>
          <TooltipContent side="bottom" align="start" shortcut="⌘N">
            New thread
          </TooltipContent>
        </Tooltip>
        <Tooltip open>
          <TooltipTrigger className="text-sm">Close pane</TooltipTrigger>
          <TooltipContent side="bottom" align="start">
            Close pane
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
