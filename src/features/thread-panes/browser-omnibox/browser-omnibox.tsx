import type { ComponentProps } from "react";

export type BrowserBarProps = ComponentProps<"div">;

export function BrowserBar(props: BrowserBarProps) {
  return <div data-slot="browser-bar" {...props} />;
}

export type BrowserOmniboxProps = ComponentProps<"div">;

export function BrowserOmnibox(props: BrowserOmniboxProps) {
  return <div data-slot="browser-omnibox" {...props} />;
}

export type BrowserOmniboxInputProps = ComponentProps<"input">;

export function BrowserOmniboxInput(props: BrowserOmniboxInputProps) {
  return <input data-slot="browser-omnibox-input" {...props} />;
}

export type BrowserOmniboxSuggestionsProps = ComponentProps<"div">;

export function BrowserOmniboxSuggestions(
  props: BrowserOmniboxSuggestionsProps,
) {
  return <div data-slot="browser-omnibox-suggestions" {...props} />;
}
