import type { PullCheck } from "@/components/checks-rows";
import { PullGlyph, Spinner } from "@/components/checks-rows";
import { MenuRowContent } from "@/components/merge-controls/menu-row-content";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import {
  MenuContent,
  MenuSub,
  MenuSubTrigger,
  MenuTrigger,
  menuRowVariants,
} from "@/primitives/menu";
import {
  ResponsiveMenu,
  ResponsiveMenuItem,
} from "@/primitives/responsive-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  hostnameOf,
  namedPreviewState,
  openPreview,
  type PreviewLink,
  type PreviewState,
  previewLabel,
  previewSummary,
} from "./preview";

const iconSlot =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";

/** The preview glyph with its deployment state badged in the corner. */
export function PreviewIcon({ state }: { state: PreviewState | null }) {
  return (
    <span className="relative inline-flex shrink-0">
      <PullGlyph name="deep-search" className="size-(--icon-sm)" />
      {state !== null && (
        <span className="absolute -right-1 -bottom-1 flex items-center justify-center rounded-full bg-(--button) p-px">
          {state === "ready" ? (
            <Icon name="circle-check" className="size-2 text-success" />
          ) : state === "building" ? (
            <Spinner
              label="Preview building"
              className="size-2 border text-warning-fg"
            />
          ) : (
            <Icon name="circle-x" className="size-2 text-destructive" />
          )}
        </span>
      )}
    </span>
  );
}

function DeploymentItems({
  links,
  checks,
}: {
  links: ReadonlyArray<PreviewLink>;
  checks: ReadonlyArray<PullCheck>;
}) {
  return links.map((link) => {
    const host = hostnameOf(link.url);
    return (
      <ResponsiveMenuItem
        key={link.url}
        className={menuRowVariants({ density: "rich" })}
        onClick={() => openPreview(link.url)}
      >
        <MenuRowContent
          density="rich"
          icon={
            <PreviewIcon
              state={
                link.name === null ? null : namedPreviewState(checks, link.name)
              }
            />
          }
          label={link.name ?? host}
          description={link.name === null ? undefined : host}
        />
      </ResponsiveMenuItem>
    );
  });
}

export type PreviewChipProps = {
  checks: ReadonlyArray<PullCheck>;
  links: ReadonlyArray<PreviewLink>;
  /** `icon-sm` when the pull header is too narrow for the label. */
  size?: "sm" | "icon-sm";
};

/** The pull header's Preview button: one deployment opens, several list. */
export function PreviewChip({ checks, links, size = "sm" }: PreviewChipProps) {
  const { state, href } = previewSummary(checks, links);
  if (state === null && href === null) return null;
  const label = previewLabel(state);
  const content = (
    <>
      <PreviewIcon state={state} />
      {size === "sm" && "Preview"}
    </>
  );
  const ariaLabel = size === "icon-sm" ? "Preview" : undefined;
  if (links.length > 1) {
    return (
      <ResponsiveMenu>
        <Tooltip>
          <TooltipTrigger
            render={
              <MenuTrigger
                render={<Button size={size} aria-label={ariaLabel} />}
              />
            }
          >
            {content}
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {state === "building" || state === "failed"
              ? label
              : `${links.length} previews`}
          </TooltipContent>
        </Tooltip>
        <MenuContent align="end" className="w-96">
          <DeploymentItems links={links} checks={checks} />
        </MenuContent>
      </ResponsiveMenu>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            size={size}
            aria-label={ariaLabel}
            disabled={href === null}
            render={
              href === null ? undefined : (
                // biome-ignore lint/a11y/useAnchorContent: the button renders the content into this anchor
                <a href={href} target="_blank" rel="noopener noreferrer" />
              )
            }
          />
        }
      >
        {content}
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

export type PreviewMenuItemProps = {
  checks: ReadonlyArray<PullCheck>;
  links: ReadonlyArray<PreviewLink>;
};

/** The pull menu's Open preview row, a submenu when there are several. */
export function PreviewMenuItem({ checks, links }: PreviewMenuItemProps) {
  const { state, href } = previewSummary(checks, links);
  if (state === null && href === null) return null;
  if (links.length > 1) {
    return (
      <MenuSub>
        <MenuSubTrigger className={menuRowVariants()}>
          <span className={iconSlot}>
            <PreviewIcon state={state} />
          </span>
          Open preview
        </MenuSubTrigger>
        <MenuContent className="w-96">
          <DeploymentItems links={links} checks={checks} />
        </MenuContent>
      </MenuSub>
    );
  }
  return (
    <ResponsiveMenuItem
      className={menuRowVariants()}
      disabled={href === null}
      onClick={() => {
        if (href !== null) openPreview(href);
      }}
    >
      <span className={iconSlot}>
        <PreviewIcon state={state} />
      </span>
      {href === null ? previewLabel(state) : "Open preview"}
    </ResponsiveMenuItem>
  );
}
