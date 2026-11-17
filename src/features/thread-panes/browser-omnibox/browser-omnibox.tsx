import type { ComponentProps } from "react";

export type BrowserBarProps = ComponentProps<"div">;

export function BrowserBar({ className, ...props }: BrowserBarProps) {
  return (
    <div
      data-slot="browser-bar"
      className={`flex h-8 shrink-0 items-center gap-0.5 border-b-hairline border-border-1 px-1 ${className ?? ""}`}
      {...props}
    />
  );
}

export type BrowserOmniboxProps = ComponentProps<"div">;

export function BrowserOmnibox({ className, ...props }: BrowserOmniboxProps) {
  return (
    <div
      data-slot="browser-omnibox"
      className={`relative flex h-6 min-w-0 flex-1 items-center gap-1.5 rounded-(--radius-sm) bg-input px-2 has-[input:focus-visible]:outline-ring-inset ${className ?? ""}`}
      {...props}
    />
  );
}

export type BrowserOmniboxInputProps = ComponentProps<"input">;

export function BrowserOmniboxInput({
  className,
  ...props
}: BrowserOmniboxInputProps) {
  return (
    <input
      data-slot="browser-omnibox-input"
      aria-label="Address"
      placeholder="Search or enter a URL"
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
      className={`h-full min-w-0 flex-1 bg-transparent text-xs font-normal text-foreground tabular-nums outline-none placeholder:text-muted-foreground-3 ${className ?? ""}`}
      {...props}
    />
  );
}

export type BrowserOmniboxSuggestionsProps = ComponentProps<"div">;

export function BrowserOmniboxSuggestions({
  className,
  ...props
}: BrowserOmniboxSuggestionsProps) {
  return (
    <div
      data-slot="browser-omnibox-suggestions"
      className={`flex max-h-[min(var(--container-sm),var(--available-height))] w-(--anchor-width) min-w-64 flex-col overflow-hidden rounded-(--radius-card) border-hairline border-border-2 bg-popover shadow-overlay ${className ?? ""}`}
      {...props}
    />
  );
}
