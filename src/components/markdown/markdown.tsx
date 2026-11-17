import "./markdown.css";
import { type ComponentProps, useId, useMemo } from "react";
import { blockLines, keyBlocks, splitBlocks } from "./blocks";
import { useMarkdownComponents } from "./components";
import type { PipelineOptions } from "./pipeline";
import { MarkdownBlockView, MarkdownRenderContext } from "./render";

export type MarkdownProps = ComponentProps<"div"> & {
  /** Markdown source. Without it, children render as-is. */
  text?: string;
  /** The text is a still-streaming agent message: repair its live tail. */
  streaming?: boolean;
  tone?: "muted";
  /** "inline" flattens blocks into one run of text (previews, titles). */
  variant?: "inline";
  size?: "sm" | "xs" | "inherit";
  weight?: "medium";
  /** Links render as links (default true); false renders them as text. */
  interactive?: boolean;
  /** Soft line breaks render as <br>. */
  breaks?: boolean;
  /** Raw HTML renders as literal text. */
  literalHtml?: boolean;
  /** Image-only paragraphs collapse into a markdown gallery. */
  gallery?: boolean;
};

/** shared/markdown: Capy's markdown renderer, streaming-safe. */
export function Markdown({
  text,
  streaming = false,
  tone,
  variant,
  size,
  weight,
  interactive = true,
  breaks = false,
  literalHtml = false,
  gallery = false,
  children,
  ...props
}: MarkdownProps) {
  const id = useId();
  const plugins = useMarkdownComponents();
  const render = useMemo(
    () => ({ plugins, interactive }),
    [plugins, interactive],
  );
  const options = useMemo<PipelineOptions>(
    () => ({ breaks, literalHtml, gallery }),
    [breaks, literalHtml, gallery],
  );
  const keyed = useMemo(
    () =>
      text === undefined
        ? []
        : keyBlocks(splitBlocks(text, streaming), gallery),
    [text, streaming, gallery],
  );
  const lines = useMemo(
    () =>
      text === undefined
        ? []
        : blockLines(
            text,
            keyed.map((entry) => entry.block),
          ),
    [text, keyed],
  );
  if (text === undefined) return <div {...props}>{children}</div>;
  return (
    <MarkdownRenderContext.Provider value={render}>
      <div
        {...props}
        data-component="markdown"
        data-tone={tone}
        data-variant={variant}
        data-size={size}
        data-weight={weight}
        data-gallery={gallery ? "" : undefined}
      >
        {keyed.map(({ block, key }, index) => (
          <MarkdownBlockView
            key={key}
            block={block}
            blockKey={`${id}-${key}`}
            lines={lines[index] ?? ""}
            inline={variant === "inline"}
            options={options}
            plugins={plugins}
          />
        ))}
      </div>
    </MarkdownRenderContext.Provider>
  );
}

export {
  MarkdownCodeHeader,
  type MarkdownCodeHeaderProps,
  MarkdownCodeLanguage,
  type MarkdownCodeLanguageProps,
  MarkdownGallery,
  type MarkdownGalleryProps,
  MarkdownTable,
  type MarkdownTableProps,
  MarkdownVideo,
  type MarkdownVideoProps,
} from "./parts";
