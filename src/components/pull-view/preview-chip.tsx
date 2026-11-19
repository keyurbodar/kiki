import { useAtomValue } from "@effect/atom-react";
import type { ReactNode } from "react";
import { toActivityData } from "@/components/activity/activity-model";
import { MenuRowContent } from "@/components/composer/menu-surface";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuTrigger,
} from "@/primitives/responsive-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { pullActivityAtom, pullChecksAtom } from "./atoms";
import {
  type PreviewState,
  previewDeployment,
  previewHostname,
  previewHref,
  previewLinks,
  previewState,
} from "./previews";
import { type Pull, toCheckRows } from "./pull-model";
import { resultValue } from "./result";

const track = (owner: string) => `shared/pull-view/preview-chip.tsx#${owner}`;

const openPreview = (url: string) =>
  window.open(url, "_blank", "noopener,noreferrer");

const stateLabel = (state: PreviewState | null) =>
  state === "building"
    ? "Preview building"
    : state === "failed"
      ? "Preview failed"
      : "Preview";

/** A globe carrying the deployment's own state as a dot on its corner. */
function PreviewGlyph({ state }: { state: PreviewState | null }) {
  return (
    <span className="relative inline-flex shrink-0">
      <Icon name="globe" size="sm" />
      {state === null ? null : (
        <span className="kiki-status-dot bg-button" data-state={state}>
          {state === "ready" ? (
            <span className="bg-success" />
          ) : state === "building" ? (
            <span className="animate-spin text-warning-fg" />
          ) : (
            <span className="bg-destructive" />
          )}
        </span>
      )}
    </span>
  );
}

/** The chip drops its word at the pull view's narrow widths, so it is measured twice. */
function ResponsiveSize({
  render,
}: {
  render: (size: "sm" | "icon-sm") => ReactNode;
}) {
  return (
    <span className="inline-flex">
      <span className="hidden @2xl/pull:inline-flex">{render("sm")}</span>
      <span className="inline-flex @2xl/pull:hidden">{render("icon-sm")}</span>
    </span>
  );
}

export type PreviewChipProps = {
  readonly orgId: string;
  readonly pull: Pull;
};

/**
 * The deployments a pull is running previews on, in the tab strip: one link
 * when a single service deployed, a menu of them when several did, and nothing
 * until the pull has a deployment check or a linked preview.
 */
export function PreviewChip({ orgId, pull }: PreviewChipProps) {
  const checks =
    toCheckRows(resultValue(useAtomValue(pullChecksAtom(orgId, pull.id)))) ??
    [];
  const activity = resultValue(useAtomValue(pullActivityAtom(orgId, pull.id)));
  const links = previewLinks(
    activity === undefined ? [] : toActivityData(activity).comments,
  );
  const state = previewState(checks);
  const href = links[0]?.url ?? previewHref(checks);
  if (state === null && href === null) return null;
  const label = stateLabel(state);

  if (links.length > 1) {
    return (
      <ResponsiveSize
        render={(size) => (
          <ResponsiveMenu>
            <Tooltip>
              <TooltipTrigger
                data-track-owner={track("PreviewChip:TooltipTrigger.1")}
                render={
                  <ResponsiveMenuTrigger
                    data-track-owner={track(
                      "PreviewChip:ResponsiveMenuTrigger.1",
                    )}
                    render={
                      <Button
                        data-track-owner={track("PreviewChip:Button.1")}
                        size={size}
                        aria-label={size === "icon-sm" ? "Preview" : undefined}
                      >
                        <PreviewGlyph state={state} />
                        {size === "sm" && "Preview"}
                      </Button>
                    }
                  />
                }
              />
              <TooltipContent side="bottom">
                {state === "building" || state === "failed"
                  ? label
                  : `${links.length} previews`}
              </TooltipContent>
            </Tooltip>
            <ResponsiveMenuContent align="end" className="kiki-preview-menu">
              {links.map((link) => {
                const host = previewHostname(link.url) ?? link.url;
                const deployment = previewDeployment(checks, link.url);
                return (
                  <ResponsiveMenuItem
                    key={link.url}
                    data-track-owner={track(
                      "DeploymentItems:ResponsiveMenuItem.1",
                    )}
                    data-density="rich"
                    onClick={() => openPreview(link.url)}
                  >
                    <MenuRowContent
                      density="rich"
                      icon={<PreviewGlyph state={deployment?.state ?? null} />}
                      label={deployment?.name ?? host}
                      description={deployment === undefined ? undefined : host}
                    />
                  </ResponsiveMenuItem>
                );
              })}
            </ResponsiveMenuContent>
          </ResponsiveMenu>
        )}
      />
    );
  }

  const disabled = href === null;
  return (
    <ResponsiveSize
      render={(size) => (
        <Tooltip>
          <TooltipTrigger
            data-track-owner={track("PreviewChip:TooltipTrigger.2")}
            render={
              <Button
                data-track-owner={track("PreviewChip:Button.2")}
                size={size}
                aria-label={size === "icon-sm" ? "Preview" : undefined}
                disabled={disabled}
                render={
                  disabled ? undefined : (
                    // biome-ignore lint/a11y/useAnchorContent: the Button renders its children inside this anchor
                    <a
                      data-track-owner={track("PreviewChip:anchor:a.1")}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  )
                }
              >
                <PreviewGlyph state={state} />
                {size === "sm" && "Preview"}
              </Button>
            }
          />
          <TooltipContent side="bottom">
            {disabled ? label : "Open preview"}
          </TooltipContent>
        </Tooltip>
      )}
    />
  );
}
