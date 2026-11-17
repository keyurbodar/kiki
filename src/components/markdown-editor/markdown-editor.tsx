import type { ComponentProps } from "react";

export type MarkdownEditorProps = ComponentProps<"div">;

export function MarkdownEditor(props: MarkdownEditorProps) {
  return <div {...props} />;
}

export type MarkdownEditorToolbarProps = ComponentProps<"div">;

export function MarkdownEditorToolbar(props: MarkdownEditorToolbarProps) {
  return <div data-slot="markdown-editor-toolbar" {...props} />;
}

export type MarkdownEditorTableMenuProps = ComponentProps<"div">;

export function MarkdownEditorTableMenu(props: MarkdownEditorTableMenuProps) {
  return <div data-slot="markdown-editor-table-menu" {...props} />;
}

export type MarkdownEditorCodeLanguageProps = ComponentProps<"div">;

export function MarkdownEditorCodeLanguage(
  props: MarkdownEditorCodeLanguageProps,
) {
  return <div data-slot="markdown-editor-code-language" {...props} />;
}
