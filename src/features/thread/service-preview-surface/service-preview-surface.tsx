import type { ComponentProps, ReactNode } from "react";
import {
  BrowserBar,
  BrowserOmnibox,
  BrowserOmniboxInput,
  BrowserOmniboxSuggestions,
  type OmniboxSuggestion,
} from "@/features/thread-panes/browser-omnibox";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/primitives/menu";
import { PreviewEmptyState } from "./empty-state.tsx";
import { PreviewIconButton } from "./icon-button.tsx";

export type ServicePreviewSurfaceProps = ComponentProps<"div"> & {
  readonly url?: string;
  readonly loading?: boolean;
  readonly failed?: boolean;
  readonly title?: string;
  readonly canGoBack?: boolean;
  readonly canGoForward?: boolean;
  readonly onBack?: () => void;
  readonly onForward?: () => void;
  readonly onReload?: (hard: boolean) => void;
  readonly onNavigate?: (suggestion: OmniboxSuggestion) => void;
  readonly onOpenNewTab?: () => void;
  readonly devtools?: { readonly open: boolean; readonly toggle: () => void };
  readonly designMode?: {
    readonly active: boolean;
    readonly toggle: () => void;
  };
  readonly tools?: ReadonlyArray<{
    readonly label: string;
    readonly icon?: ReactNode;
    readonly onClick: () => void;
    readonly separator?: boolean;
  }>;
  readonly placeholder?: ReactNode;
  readonly children?: ReactNode;
};

export function ServicePreviewSurface({
  url = "",
  loading = false,
  failed = false,
  title,
  canGoBack = false,
  canGoForward = false,
  onBack,
  onForward,
  onReload,
  onNavigate,
  onOpenNewTab,
  devtools,
  designMode,
  tools = [],
  placeholder,
  className,
  children,
  ...props
}: ServicePreviewSurfaceProps) {
  const recovery = failed
    ? (placeholder ?? (
        <PreviewEmptyState
          art=""
          line="Page failed to load"
          sub={url === "" ? undefined : url}
          action={
            <Button
              variant="outline"
              size="xs"
              onClick={() => onReload?.(false)}
            >
              Reload
            </Button>
          }
        />
      ))
    : undefined;
  return (
    <div
      className={`flex min-h-0 w-full flex-1 flex-col ${className ?? ""}`}
      {...props}
    >
      <BrowserBar>
        <PreviewIconButton
          label="Back"
          icon={<Icon name="chevron-left-medium" size="xs" />}
          onClick={onBack}
          disabled={!canGoBack}
        />
        <PreviewIconButton
          label="Forward"
          icon={<Icon name="chevron-right" size="xs" />}
          onClick={onForward}
          disabled={!canGoForward}
        />
        <PreviewIconButton
          label="Reload"
          icon={<Icon name="arrows-repeat-circle" size="xs" />}
          onClick={() => onReload?.(false)}
          disabled={loading}
        />
        <BrowserOmnibox>
          {loading ? (
            <Icon
              name="progress-50-outline"
              size="xs"
              className="text-icon-muted"
            />
          ) : (
            <Icon name="safari" size="xs" className="text-icon-muted" />
          )}
          <BrowserOmniboxInput
            value={url}
            aria-label="Address"
            onKeyDown={(event) => {
              if (event.key === "Enter" && url.trim() !== "") {
                onNavigate?.({ kind: "url", url });
              }
            }}
          />
        </BrowserOmnibox>
        {designMode === undefined ? null : (
          <PreviewIconButton
            label={designMode.active ? "Exit design mode" : "Design mode"}
            icon={<Icon name="color-palette" size="xs" />}
            selected={designMode.active}
            onClick={designMode.toggle}
          />
        )}
        {devtools === undefined ? null : (
          <PreviewIconButton
            label={devtools.open ? "Close developer tools" : "Developer tools"}
            icon={<Icon name="code-brackets" size="xs" />}
            selected={devtools.open}
            onClick={devtools.toggle}
          />
        )}
        {onOpenNewTab === undefined ? null : (
          <PreviewIconButton
            label="Open in new tab"
            icon={<Icon name="arrow-up-right" size="xs" />}
            onClick={onOpenNewTab}
          />
        )}
        <Menu>
          <MenuTrigger
            render={
              <Button variant="ghost" size="icon-xs" aria-label="More">
                <Icon name="bubble-dots" size="xs" />
              </Button>
            }
          />
          <MenuContent align="end" className="w-56">
            {tools.map((tool, index) => (
              <MenuItem key={tool.label} onClick={tool.onClick}>
                <span className="flex items-center gap-2">
                  {tool.icon}
                  {tool.label}
                </span>
              </MenuItem>
            ))}
          </MenuContent>
        </Menu>
      </BrowserBar>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
        {recovery ?? children ?? (
          <PreviewEmptyState
            art=""
            line="New tab"
            sub="Type a URL, pick a port, or search"
          />
        )}
        {placeholder === undefined ? null : (
          <div className="absolute inset-0 flex min-h-0 flex-col bg-background">
            {placeholder}
          </div>
        )}
        <BrowserOmniboxSuggestions className="hidden" aria-label={title} />
      </div>
    </div>
  );
}
