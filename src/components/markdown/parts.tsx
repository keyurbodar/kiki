import type { ComponentProps } from "react";

export type MarkdownCodeHeaderProps = ComponentProps<"div">;

export function MarkdownCodeHeader(props: MarkdownCodeHeaderProps) {
  return <div data-slot="markdown-code-header" {...props} />;
}

export type MarkdownCodeLanguageProps = ComponentProps<"span">;

export function MarkdownCodeLanguage(props: MarkdownCodeLanguageProps) {
  return <span data-slot="markdown-code-language" {...props} />;
}

export type MarkdownTableProps = ComponentProps<"div">;

/** Scroll frame around a markdown table; children is the <table>. */
export function MarkdownTable(props: MarkdownTableProps) {
  return <div data-slot="markdown-table" {...props} />;
}

export type MarkdownGalleryProps = ComponentProps<"div">;

export function MarkdownGallery(props: MarkdownGalleryProps) {
  return <div data-slot="markdown-gallery" {...props} />;
}

export type MarkdownVideoProps = ComponentProps<"div">;

export function MarkdownVideo(props: MarkdownVideoProps) {
  return <div data-slot="markdown-video" {...props} />;
}
