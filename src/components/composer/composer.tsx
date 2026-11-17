import type { ComponentProps } from "react";

export type ComposerProps = ComponentProps<"div">;

export function Composer(props: ComposerProps) {
  return <div data-slot="composer" {...props} />;
}

export type ComposerCommandMenuProps = ComponentProps<"div">;

export function ComposerCommandMenu(props: ComposerCommandMenuProps) {
  return <div data-slot="composer-command-menu" {...props} />;
}

export type ComposerMentionMenuProps = ComponentProps<"div">;

export function ComposerMentionMenu(props: ComposerMentionMenuProps) {
  return <div data-slot="composer-mention-menu" {...props} />;
}

export type SelectionBoxProps = ComponentProps<"div">;

export function SelectionBox(props: SelectionBoxProps) {
  return <div data-slot="selection-box" {...props} />;
}

export type SelectionToolbarProps = ComponentProps<"div">;

export function SelectionToolbar(props: SelectionToolbarProps) {
  return <div data-slot="selection-toolbar" {...props} />;
}
