import { CapyMark } from "@/components/capy-logo";
import {
  BrowserBar,
  BrowserOmnibox,
  BrowserOmniboxInput,
} from "@/features/thread-panes/browser-omnibox";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";

/** The bar's controls are 24×24 on a 26 px pitch, as Capy's are. */

function BarButton({
  label,
  icon,
  disabled,
}: {
  label: string;
  icon: string;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={label}
            disabled={disabled}
          >
            <Icon name={icon as never} size="xs" />
          </Button>
        }
      />
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

export type BrowserPaneProps = {
  threadId: string;
  /** The session this tab was opened for, when the route names one. */
  sessionId?: string | undefined;
};

/**
 * The browser surface Capy opens from the chat column's strip: a 32 px bar with
 * history controls and the omnibox, then the page. There is no browser session
 * behind it yet — no endpoint opens one — so the page area shows Capy's own
 * new-tab state rather than a fabricated view.
 */
export function BrowserPane({ threadId, sessionId }: BrowserPaneProps) {
  return (
    <div
      data-slot="browser-pane"
      data-thread={threadId}
      className="flex min-h-0 flex-1 flex-col"
    >
      <BrowserBar>
        <BarButton label="Back" icon="arrow-left" disabled />
        <BarButton label="Forward" icon="arrow-right" disabled />
        <BarButton label="Reload" icon="rotate" disabled />
        <BrowserOmnibox>
          <Icon
            name="globe"
            size="xs"
            className="shrink-0 text-muted-foreground-2"
          />
          <BrowserOmniboxInput readOnly />
        </BrowserOmnibox>
        <BarButton label="Open externally" icon="arrow-up-right" />
        <BarButton label="Browser options" icon="dot-grid-1x3-horizontal" />
      </BrowserBar>
      <div
        data-slot="browser-new-tab"
        data-session={sessionId}
        className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center"
      >
        <CapyMark className="size-12 opacity-80" />
        <p className="text-sm font-medium">
          {sessionId === undefined ? "New tab" : "No page loaded"}
        </p>
        <p className="text-xs text-muted-foreground-2">
          {sessionId === undefined
            ? "Type a URL, pick a port, or search"
            : `Session ${sessionId} has no loaded page in this build.`}
        </p>
      </div>
    </div>
  );
}
