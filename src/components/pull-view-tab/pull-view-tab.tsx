import { ViewTab, type ViewTabProps } from "@/components/view-toolbar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";

export type PullViewTabProps = ViewTabProps & {
  label: string;
  command?: string;
  shortcut?: string;
};

export function PullViewTab({ command, shortcut, ...props }: PullViewTabProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        data-track-owner="shared/pull-view/pull-view-tab.tsx#PullViewTab:TooltipTrigger.1"
        data-command={command}
        render={
          <ViewTab
            data-track-owner="shared/pull-view/pull-view-tab.tsx#PullViewTab:ViewTab.1"
            {...props}
          />
        }
      />
      <TooltipContent side="bottom">
        {props.label}
        {shortcut !== undefined && (
          <span className="ml-2 text-muted-foreground-2">{shortcut}</span>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
