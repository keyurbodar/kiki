import type { KeyboardEvent, MouseEvent } from "react";
import {
  lineActivatable,
  lineLabel,
  lineOutcome,
  type McpSetupState,
} from "./helpers";
import type { McpSetupProposal } from "./proposal";

const ROW =
  "flex min-h-7 min-w-0 items-center gap-1.5 py-1 text-sm font-medium text-muted-foreground-1";
const ACTIVATABLE = [
  "group/collapsible flex cursor-pointer items-center gap-1.5 rounded text-left font-medium outline-none select-none",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-sm)",
  "focus-visible:outline-ring-inset focus-gutter w-fit",
  "transition-colors duration-100 hover:text-foreground [&>svg:last-child]:opacity-0 [&>svg:last-child]:transition-opacity [&>svg:last-child]:duration-fast [&>svg:last-child]:ease-out-quint [&:hover>svg:last-child]:opacity-100 data-[panel-open]:[&>svg:last-child]:opacity-100",
  "max-w-full [--focus-ring:var(--muted-foreground-2)]",
  "relative pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2",
].join(" ");

export type McpSetupLineProps = {
  proposal: McpSetupProposal;
  state: McpSetupState;
  actionable: boolean;
  dismissed?: () => void;
  onActivate?: () => void;
};

export function McpSetupLine({
  proposal,
  state,
  actionable,
  dismissed,
  onActivate,
}: McpSetupLineProps) {
  const outcome =
    dismissed === undefined
      ? lineOutcome(proposal, state, actionable)
      : "Dismissed";
  const activate =
    dismissed !== undefined
      ? () => {
          dismissed();
          onActivate?.();
        }
      : lineActivatable(state, actionable)
        ? onActivate
        : undefined;
  const onClick =
    activate === undefined
      ? undefined
      : (event: MouseEvent<HTMLDivElement>) => {
          activate();
          if (document.activeElement === event.currentTarget)
            event.currentTarget.blur();
        };
  const onKeyDown =
    activate === undefined
      ? undefined
      : (event: KeyboardEvent<HTMLDivElement>) => {
          if (
            event.target === event.currentTarget &&
            (event.key === "Enter" || event.key === " ")
          ) {
            event.preventDefault();
            activate();
          }
        };
  return (
    <div data-slot="mcp-setup-line">
      {/* biome-ignore lint/a11y/noStaticElementInteractions: role is set to button whenever the row is activatable, matching Capy's activity row */}
      <div
        role={activate === undefined ? undefined : "button"}
        tabIndex={activate === undefined ? undefined : 0}
        onClick={onClick}
        onKeyDown={onKeyDown}
        className={activate === undefined ? ROW : `${ROW} ${ACTIVATABLE}`}
      >
        <span className="min-w-0 truncate">{lineLabel(proposal)}</span>
        {outcome !== undefined && (
          <span className="shrink-0 text-muted-foreground-2">{outcome}</span>
        )}
      </div>
    </div>
  );
}
