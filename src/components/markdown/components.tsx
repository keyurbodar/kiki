import {
  type ComponentProps,
  type ComponentType,
  createContext,
  type ReactNode,
  useContext,
  useMemo,
} from "react";
import {
  chipTransform,
  MarkdownChipRenderer,
} from "@/components/markdown-chips";
import { MarkdownGallery } from "./gallery";
import { MarkdownMermaid } from "./mermaid";
import type { MarkdownTreeTransform } from "./pipeline";
import { MarkdownVideo } from "./video";

export type MarkdownMermaidProps = { text: string; complete: boolean };

export type MarkdownFenceProps = {
  text: string;
  language: string;
  complete: boolean;
};

export type MarkdownChipRenderProps = {
  /** Chip kind, e.g. file, path, pull_request, issue, thread, mention. */
  kind: string;
  /** Chip value for span chips (data-chip-value / data-mention). */
  value?: string;
  label?: string;
  /** Set for link chips (anchors a tree transform marked with data-chip). */
  href?: string;
  anchorProps?: ComponentProps<"a">;
  /** Markdown's interactive prop: false renders the chip as plain text. */
  interactive?: boolean;
  children?: ReactNode;
};

/**
 * The renderer's plug-in points. Sibling packages swap their entry in
 * `defaultMarkdownComponents` (one line each) or scope an override with
 * <MarkdownComponentsProvider>.
 */
export type MarkdownComponents = {
  /** ```mermaid fences. */
  mermaid: ComponentType<MarkdownMermaidProps>;
  /** Other fence languages with a custom renderer, keyed by language. */
  fences: Readonly<Record<string, ComponentType<MarkdownFenceProps>>>;
  /** Runs of image-only paragraphs (Markdown gallery prop). */
  gallery: ComponentType<{ children?: ReactNode }>;
  /** Video paragraphs (image or bare link pointing at a video file). */
  video: ComponentType<ComponentProps<"video">>;
  image: ComponentType<ComponentProps<"img">>;
  /** Chip-able references: anchors and spans carrying data-chip. */
  chip: ComponentType<MarkdownChipRenderProps>;
  /** hast passes run on every parsed block, e.g. chip detection. */
  transforms: readonly MarkdownTreeTransform[];
};

function DefaultGallery({ children }: { children?: ReactNode }) {
  return <MarkdownGallery>{children}</MarkdownGallery>;
}

function DefaultVideo({ src, title }: ComponentProps<"video">) {
  return <MarkdownVideo src={src} title={title} />;
}

function DefaultImage(props: ComponentProps<"img">) {
  return <img loading="lazy" {...props} alt={props.alt ?? ""} />;
}

export const defaultMarkdownComponents: MarkdownComponents = {
  mermaid: MarkdownMermaid,
  fences: {},
  gallery: DefaultGallery,
  video: DefaultVideo,
  image: DefaultImage,
  chip: MarkdownChipRenderer,
  transforms: [chipTransform],
};

const MarkdownComponentsContext = createContext<MarkdownComponents>(
  defaultMarkdownComponents,
);

export function MarkdownComponentsProvider({
  value,
  children,
}: {
  value: Partial<MarkdownComponents>;
  children?: ReactNode;
}) {
  const parent = useContext(MarkdownComponentsContext);
  const merged = useMemo(
    () => ({
      ...parent,
      ...value,
      fences: { ...parent.fences, ...value.fences },
    }),
    [parent, value],
  );
  return (
    <MarkdownComponentsContext.Provider value={merged}>
      {children}
    </MarkdownComponentsContext.Provider>
  );
}

export const useMarkdownComponents = () =>
  useContext(MarkdownComponentsContext);
