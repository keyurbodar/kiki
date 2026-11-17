import type { ComponentProps } from "react";

export type MarkdownProps = ComponentProps<"div">;

export function Markdown(props: MarkdownProps) {
  return <div {...props} />;
}

export type MarkdownCodeHeaderProps = ComponentProps<"div">;

export function MarkdownCodeHeader(props: MarkdownCodeHeaderProps) {
  return <div data-slot="markdown-code-header" {...props} />;
}

export type MarkdownCodeLanguageProps = ComponentProps<"span">;

export function MarkdownCodeLanguage(props: MarkdownCodeLanguageProps) {
  return <span data-slot="markdown-code-language" {...props} />;
}

export type MarkdownTableProps = ComponentProps<"div">;

export function MarkdownTable(props: MarkdownTableProps) {
  return <div data-slot="markdown-table" {...props} />;
}

export type MarkdownMermaidDiagramProps = ComponentProps<"div">;

export function MarkdownMermaidDiagram(props: MarkdownMermaidDiagramProps) {
  return <div data-slot="markdown-mermaid-diagram" {...props} />;
}

export type MarkdownMermaidErrorProps = ComponentProps<"div">;

export function MarkdownMermaidError(props: MarkdownMermaidErrorProps) {
  return <div data-slot="markdown-mermaid-error" {...props} />;
}

export type MarkdownGalleryProps = ComponentProps<"div">;

export function MarkdownGallery(props: MarkdownGalleryProps) {
  return <div data-slot="markdown-gallery" {...props} />;
}

export type MarkdownVideoProps = ComponentProps<"div">;

export function MarkdownVideo(props: MarkdownVideoProps) {
  return <div data-slot="markdown-video" {...props} />;
}

export type MermaidStageProps = ComponentProps<"div">;

export function MermaidStage(props: MermaidStageProps) {
  return <div data-slot="mermaid-stage" {...props} />;
}

export type VisualProps = ComponentProps<"div">;

export function Visual(props: VisualProps) {
  return <div data-slot="visual" {...props} />;
}

export type DiagramWindowProps = ComponentProps<"div">;

export function DiagramWindow(props: DiagramWindowProps) {
  return <div data-slot="diagram-window" {...props} />;
}
